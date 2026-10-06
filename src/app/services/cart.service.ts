import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { LaptopSpecifications, Product, ProductService } from './product.service';

export interface SavedCartItem {
  productId: number | string;
  quantity: number;
}

export interface CartItem extends SavedCartItem {
  id: number | string;
  ownerEmail: string;
  productName: string;
  brand: string;
  model: string;
  specifications?: LaptopSpecifications;
  price: number;
  availableQuantity: number;
}

export interface OrderRecord {
  id: number | string;
  ownerEmail: string;
  customerName: string;
  address: string;
  items: Array<Pick<CartItem, 'productId' | 'productName' | 'brand' | 'model' | 'specifications' | 'price' | 'quantity'>>;
  total: number;
  createdAt: string;
  status: 'Placed' | 'Processing' | 'Shipped' | 'Delivered';
}

interface AccountCartRecord {
  id: number | string;
  email: string;
  cartItems?: SavedCartItem[];
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly usersUrl = 'http://localhost:3002/users';
  private readonly ordersUrl = 'http://localhost:3002/orders';

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
    private readonly productService: ProductService,
  ) {}

  async loadCart(): Promise<CartItem[]> {
    const account = this.requireCustomerAccount();
    const { cartItems } = await this.loadAccountCart(account.id, account.email);
    return this.enrichCart(account.email, cartItems);
  }

  async addProduct(product: Product, requestedQuantity: number): Promise<CartItem[]> {
    const account = this.requireCustomerAccount();
    const current = this.getCachedCart(account.email);
    const quantity = Math.max(1, Math.min(product.quantity, Math.floor(requestedQuantity || 1)));
    const existing = current.find((item) => String(item.productId) === String(product.id));
    const next = existing
      ? current.map((item) => String(item.productId) === String(product.id)
        ? { ...item, quantity: Math.min(product.quantity, item.quantity + quantity) }
        : item)
      : [...current, { productId: product.id, quantity }];

    await this.saveAccountCart(account.id, account.email, next);
    return this.enrichCart(account.email, next);
  }

  async updateQuantity(productId: number | string, requestedQuantity: number): Promise<CartItem[]> {
    const account = this.requireCustomerAccount();
    const current = this.getCachedCart(account.email);
    const product = this.productService.getProductById(productId);
    if (!product) return this.enrichCart(account.email, current);

    const quantity = Math.max(1, Math.min(product.quantity, Math.floor(requestedQuantity || 1)));
    const next = current.map((item) => String(item.productId) === String(productId)
      ? { ...item, quantity }
      : item);

    await this.saveAccountCart(account.id, account.email, next);
    return this.enrichCart(account.email, next);
  }

  async updateCartQuantities(changes: Array<{ productId: number | string; quantity: number }>): Promise<CartItem[]> {
    const account = this.requireCustomerAccount();
    const current = this.getCachedCart(account.email);
    const next = current.map((item) => {
      const change = changes.find((entry) => String(entry.productId) === String(item.productId));
      const product = this.productService.getProductById(item.productId);
      if (!change || !product) return item;
      return {
        ...item,
        quantity: Math.max(1, Math.min(product.quantity, Math.floor(change.quantity || 1))),
      };
    });

    await this.saveAccountCart(account.id, account.email, next);
    return this.enrichCart(account.email, next);
  }

  async removeItem(productId: number | string): Promise<CartItem[]> {
    const account = this.requireCustomerAccount();
    const current = this.getCachedCart(account.email);
    const next = current.filter((item) => String(item.productId) !== String(productId));
    await this.saveAccountCart(account.id, account.email, next);
    return this.enrichCart(account.email, next);
  }

  async clearCart(): Promise<void> {
    const account = this.requireCustomerAccount();
    await this.saveAccountCart(account.id, account.email, []);
  }

  async placeOrder(customerName: string, address: string): Promise<OrderRecord> {
    const account = this.requireCustomerAccount();
    const items = await this.loadCart();

    if (items.length === 0) {
      throw new Error('Your cart is empty. Add products before checkout.');
    }

    const payload: Omit<OrderRecord, 'id'> = {
      ownerEmail: account.email,
      customerName: customerName.trim(),
      address: address.trim(),
      items: items.map(({ productId, productName, brand, model, specifications, price, quantity }) => ({
        productId, productName, brand, model, specifications, price, quantity,
      })),
      total: items.reduce((total, item) => total + item.price * item.quantity, 0),
      createdAt: new Date().toISOString(),
      status: 'Placed',
    };

    const reservations = await this.productService.reserveStock(items);
    let order: OrderRecord;
    try {
      order = await firstValueFrom(this.http.post<OrderRecord>(this.ordersUrl, payload));
    } catch (error) {
      await this.productService.restoreStock(reservations);
      throw error;
    }

    await this.clearCart();
    return order;
  }

  async loadOrders(): Promise<OrderRecord[]> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('Sign in to view orders.');

    const url = user.role === 'Admin'
      ? this.ordersUrl
      : `${this.ordersUrl}?ownerEmail=${encodeURIComponent(user.email.toLowerCase())}`;
    return firstValueFrom(this.http.get<OrderRecord[]>(url));
  }

  private async loadAccountCart(id: number | string, email: string): Promise<{ cartItems: SavedCartItem[] }> {
    const record = await firstValueFrom(this.http.get<AccountCartRecord>(`${this.usersUrl}/${id}`));
    const cartItems = Array.isArray(record.cartItems) ? record.cartItems : [];
    this.saveCachedCart(email, cartItems);
    return { cartItems };
  }

  private getCachedCart(email: string): SavedCartItem[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey(email));
      if (raw !== null) {
        const items = JSON.parse(raw) as unknown;
        return this.normalizeCartItems(items);
      }
      const user = this.authService.getCurrentUser() as (ReturnType<AuthService['getCurrentUser']> & { cartItems?: SavedCartItem[] });
      return this.normalizeCartItems(user?.cartItems);
    } catch {
      return [];
    }
  }

  private normalizeCartItems(value: unknown): SavedCartItem[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!item || typeof item !== 'object' || !('productId' in item)) return [];
      const candidate = item as { productId: number | string; quantity?: number };
      return [{
        productId: candidate.productId,
        quantity: Math.max(1, Math.floor(Number(candidate.quantity) || 1)),
      }];
    });
  }

  private async saveAccountCart(id: number | string, email: string, cartItems: SavedCartItem[]): Promise<void> {
    await firstValueFrom(this.http.patch<AccountCartRecord>(`${this.usersUrl}/${id}`, { cartItems }));
    this.saveCachedCart(email, cartItems);
  }

  private enrichCart(ownerEmail: string, items: SavedCartItem[]): CartItem[] {
    const products = this.productService.getAllProducts();
    return items.flatMap((item) => {
      const product = products.find((entry) => String(entry.id) === String(item.productId));
      if (!product) return [];
      return [{
        id: String(product.id),
        productId: product.id,
        ownerEmail,
        productName: product.name,
        brand: product.brand ?? 'Laptop',
        model: product.model ?? product.name,
        specifications: product.specifications,
        price: product.price,
        quantity: Math.max(1, Math.min(product.quantity, item.quantity)),
        availableQuantity: product.quantity,
      }];
    });
  }

  private requireCustomerAccount(): { id: number | string; email: string } {
    const user = this.authService.getCurrentUser();
    if (!user || (user.role ?? 'Customer') !== 'Customer' || user.id === undefined) {
      throw new Error('Sign in with a customer account to manage a cart.');
    }
    return { id: user.id, email: user.email.toLowerCase() };
  }

  private getStorageKey(ownerEmail: string): string {
    return `cart-items:${ownerEmail}`;
  }

  private saveCachedCart(ownerEmail: string, items: SavedCartItem[]): void {
    localStorage.setItem(this.getStorageKey(ownerEmail), JSON.stringify(items));
    const user = this.authService.getCurrentUser();
    if (user?.email.toLowerCase() === ownerEmail) {
      localStorage.setItem('app-user', JSON.stringify({ ...user, cartItems: items }));
    }
  }
}