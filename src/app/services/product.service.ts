import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export interface Product {
  id: number | string;
  name: string;
  brand?: string;
  model?: string;
  specifications?: LaptopSpecifications;
  category?: string;
  price: number;
  quantity: number;
  createdAt: string;
  ownerEmail?: string;
}

export interface LaptopSpecifications {
  processor: string;
  ram: string;
  storage: string;
  graphics: string;
  display: string;
  operatingSystem: string;
}

export interface ProductInput {
  name: string;
  brand: string;
  model: string;
  specifications: LaptopSpecifications;
  price: number;
  quantity: number;
  createdAt: Date | string;
}

export interface StockReservation {
  productId: number | string;
  previousQuantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly apiUrl = 'http://localhost:3002/products';
  private readonly productsSubject = new BehaviorSubject<Product[]>([]);
  readonly products$ = this.productsSubject.asObservable();

  products: Product[] = [];
  private initialLoad: Promise<void>;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {
    this.initialLoad = this.loadInitialProducts();
  }

  async ensureProductsLoaded(): Promise<void> {
    await this.initialLoad;
  }

  async reloadProducts(): Promise<void> {
    const products = await firstValueFrom(this.http.get<Product[]>(this.apiUrl));
    this.setProducts(this.normalizeProducts(products));
  }

  async reserveStock(items: Array<{ productId: number | string; quantity: number }>): Promise<StockReservation[]> {
    await this.reloadProducts();
    const reservations: StockReservation[] = [];

    try {
      for (const item of items) {
        const product = this.getProductById(item.productId);

        if (!product || product.quantity < item.quantity) {
          throw new Error(`${product?.name ?? 'A selected laptop'} no longer has enough stock.`);
        }

        const updated = await firstValueFrom(
          this.http.patch<Product>(`${this.apiUrl}/${product.id}`, { quantity: product.quantity - item.quantity }),
        );
        reservations.push({ productId: product.id, previousQuantity: product.quantity });
        this.products = this.products.map((current) => String(current.id) === String(product.id) ? updated : current);
        this.productsSubject.next([...this.products]);
      }

      return reservations;
    } catch (error) {
      await this.restoreStock(reservations);
      throw error;
    }
  }

  async restoreStock(reservations: StockReservation[]): Promise<void> {
    for (const reservation of [...reservations].reverse()) {
      const restored = await firstValueFrom(
        this.http.patch<Product>(`${this.apiUrl}/${reservation.productId}`, { quantity: reservation.previousQuantity }),
      );
      this.products = this.products.map((product) => String(product.id) === String(restored.id) ? restored : product);
      this.productsSubject.next([...this.products]);
    }
  }

  private async loadInitialProducts(): Promise<void> {
    try {
      const products = await firstValueFrom(this.http.get<Product[]>(this.apiUrl));
      this.setProducts(this.normalizeProducts(products));
    } catch {
      this.setProducts([]);
    }
  }

  private normalizeProducts(products: Product[]): Product[] {
    return products.map((product) => ({
      ...product,
      quantity: Number.isFinite(product.quantity) && product.quantity > 0 ? product.quantity : 1,
      createdAt: typeof product.createdAt === 'string' ? product.createdAt : new Date(product.createdAt).toISOString(),
    }));
  }

  private setProducts(products: Product[]): void {
    this.products = products;
    this.productsSubject.next([...this.products]);
  }

  getAllProducts(): Product[] {
    return [...this.products];
  }

  getProductsForCurrentUser(): Product[] {
    return this.getAllProducts();
  }

  getProductById(id: number | string): Product | undefined {
    return this.products.find((product) => String(product.id) === String(id));
  }

  canManageProduct(product: Product): boolean {
    const user = this.authService.getCurrentUser();
    return !!user && user.role === 'Admin' && !!product;
  }

  async addProduct(product: ProductInput): Promise<Product> {
    const user = this.authService.getCurrentUser();

    if (!user || user.role !== 'Admin') {
      throw new Error('Only admin accounts can manage catalog products.');
    }

    const payload: Omit<Product, 'id'> = {
      ...product,
      createdAt: new Date(product.createdAt).toISOString(),
      ownerEmail: user.email.toLowerCase(),
    };

    const createdProduct = await firstValueFrom(this.http.post<Product>(this.apiUrl, payload));
    this.products = [createdProduct, ...this.products];
    this.productsSubject.next([...this.products]);
    return createdProduct;
  }

  async updateProduct(id: number | string, updatedProduct: ProductInput): Promise<Product | undefined> {
    const currentProduct = this.getProductById(id);

    if (!currentProduct || !this.canManageProduct(currentProduct)) {
      return undefined;
    }

    const payload: Product = {
      ...currentProduct,
      ...updatedProduct,
      id: currentProduct.id,
      createdAt: new Date(updatedProduct.createdAt).toISOString(),
    };

    const updated = await firstValueFrom(this.http.put<Product>(`${this.apiUrl}/${currentProduct.id}`, payload));
    this.products = this.products.map((product) => (String(product.id) === String(id) ? updated : product));
    this.productsSubject.next([...this.products]);
    return updated;
  }

  async deleteProduct(id: number | string): Promise<void> {
    const product = this.getProductById(id);

    if (!product || !this.canManageProduct(product)) {
      throw new Error('Only admin accounts can manage catalog products.');
    }

    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${product.id}`));
    this.products = this.products.filter((item) => String(item.id) !== String(id));
    this.productsSubject.next([...this.products]);
  }
}
