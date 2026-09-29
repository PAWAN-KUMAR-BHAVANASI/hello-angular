import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  createdAt: Date | string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly apiUrl = 'http://localhost:3002/products';
  private readonly productsSubject = new BehaviorSubject<Product[]>([]);
  readonly products$ = this.productsSubject.asObservable();

  products: Product[] = [];

  constructor(private readonly http: HttpClient) {
    void this.loadInitialProducts();
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

  getProductById(id: number): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  async addProduct(product: ProductInput): Promise<Product> {
    const payload: Product = {
      ...product,
      id: Date.now(),
      createdAt: new Date(product.createdAt).toISOString(),
    };

    const createdProduct = await firstValueFrom(this.http.post<Product>(this.apiUrl, payload));
    this.products = [createdProduct, ...this.products];
    this.productsSubject.next([...this.products]);
    return createdProduct;
  }

  async updateProduct(id: number, updatedProduct: ProductInput): Promise<Product | undefined> {
    const currentProduct = this.products.find((product) => product.id === id);

    if (!currentProduct) {
      return undefined;
    }

    const payload: Product = {
      ...currentProduct,
      ...updatedProduct,
      id,
      createdAt: new Date(updatedProduct.createdAt).toISOString(),
    };

    const updated = await firstValueFrom(this.http.put<Product>(`${this.apiUrl}/${id}`, payload));
    this.products = this.products.map((product) => (product.id === id ? updated : product));
    this.productsSubject.next([...this.products]);
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
    this.products = this.products.filter((product) => product.id !== id);
    this.productsSubject.next([...this.products]);
  }
}
