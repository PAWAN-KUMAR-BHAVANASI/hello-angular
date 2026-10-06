import { Injectable } from '@angular/core';

import { Product } from './product.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProductComparisonService {
  private readonly storageKeyPrefix = 'selected-products-for-comparison';
  private readonly MAX_PRODUCTS = 2;

  constructor(private readonly authService: AuthService) {}

  addProduct(product: Product): boolean {
    const selectedProducts = this.loadProducts();
    const alreadySelected = selectedProducts.some((selectedProduct) => String(selectedProduct.id) === String(product.id));

    if (alreadySelected) {
      return true;
    }

    if (selectedProducts.length >= this.MAX_PRODUCTS) {
      return false;
    }

    this.persistProducts([...selectedProducts, product]);
    return true;
  }

  removeProduct(productId: number | string): void {
    const selectedProducts = this.loadProducts();
    this.persistProducts(selectedProducts.filter((product) => String(product.id) !== String(productId)));
  }

  getProducts(): Product[] {
    return this.loadProducts();
  }

  isSelected(productId: number | string): boolean {
    return this.loadProducts().some((product) => String(product.id) === String(productId));
  }

  getSelectedCount(): number {
    return this.loadProducts().length;
  }

  canCompare(): boolean {
    return this.loadProducts().length === this.MAX_PRODUCTS;
  }

  clearProducts(): void {
    this.persistProducts([]);
  }

  private getStorageKey(): string {
    const user = this.authService.getCurrentUser();

    if (!user) {
      return `${this.storageKeyPrefix}:guest`;
    }

    const role = user.role ?? 'Customer';
    return `${this.storageKeyPrefix}:${role}:${user.email.toLowerCase()}`;
  }

  private loadProducts(): Product[] {
    const rawValue = localStorage.getItem(this.getStorageKey());

    if (!rawValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawValue) as Product[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistProducts(products: Product[]): void {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(products));
  }
}