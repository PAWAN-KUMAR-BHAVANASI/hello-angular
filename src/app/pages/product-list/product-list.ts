import { Component } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListPage {
  products: Product[] = [];

  constructor(private readonly productService: ProductService) {
    this.products = this.productService.getAllProducts();
  }

  deleteProduct(id: number): void {
    this.productService.deleteProduct(id);
    this.products = this.productService.getAllProducts();
  }
}