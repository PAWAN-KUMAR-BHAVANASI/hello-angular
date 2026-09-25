import { Injectable } from '@angular/core';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  createdAt: Date;
}

export type ProductInput = Omit<Product, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  products: Product[] = [
    {
      id: 1,
      name: 'Laptop',
      category: 'Electronics',
      price: 55000,
      createdAt: new Date(2026, 8, 20),
    },
    {
      id: 2,
      name: 'Wireless Mouse',
      category: 'Accessories',
      price: 800,
      createdAt: new Date(2026, 8, 21),
    },
    {
      id: 3,
      name: 'Mechanical Keyboard',
      category: 'Accessories',
      price: 1500,
      createdAt: new Date(2026, 8, 22),
    },
  ];

  getAllProducts(): Product[] {
    return this.products;
  }

  getProductById(id: number): Product | undefined {
    return this.products.find((product) => product.id === id);
  }

  addProduct(product: ProductInput): Product {
    const newProduct: Product = {
      ...product,
      id: Date.now(),
      createdAt: product.createdAt instanceof Date ? product.createdAt : new Date(product.createdAt),
    };

    this.products.unshift(newProduct);
    return newProduct;
  }

  updateProduct(id: number, updatedProduct: ProductInput): Product | undefined {
    const index = this.products.findIndex((product) => product.id === id);

    if (index === -1) {
      return undefined;
    }

    const productToUpdate: Product = {
      ...this.products[index],
      ...updatedProduct,
      createdAt: updatedProduct.createdAt instanceof Date ? updatedProduct.createdAt : new Date(updatedProduct.createdAt),
    };

    this.products[index] = productToUpdate;
    return productToUpdate;
  }

  deleteProduct(id: number): void {
    this.products = this.products.filter((product) => product.id !== id);
  }
}
