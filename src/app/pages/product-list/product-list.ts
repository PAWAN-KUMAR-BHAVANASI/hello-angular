import { Component } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListPage {
  products: Product[] = [];

  constructor(
    private readonly productService: ProductService,
    private readonly authService: AuthService,
  ) {
    this.productService.products$.subscribe((products) => {
      this.products = products;
    });

    this.products = this.productService.getAllProducts();
  }

  isAdmin(): boolean {
    return this.authService.hasPermission('Admin');
  }

  async deleteProduct(id: number): Promise<void> {
    await this.productService.deleteProduct(id);
  }
}