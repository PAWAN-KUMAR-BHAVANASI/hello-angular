import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../services/product.service';
import { ProductComparisonService } from '../../services/product-comparision.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-comparison',
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './product-comparision.html',
  styleUrl: './product-comparision.css',
})
export class ProductComparisonPage implements OnInit {
  products: Product[] = [];

  constructor(
    private readonly comparisonService: ProductComparisonService,
    private readonly authService: AuthService,
  ) {}

  get isAdmin(): boolean {
    return this.authService.hasPermission('Admin');
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.products = this.comparisonService.getProducts();
  }

  clearComparison(): void {
    this.comparisonService.clearProducts();
    this.products = [];
  }

  removeProduct(product: Product): void {
    this.comparisonService.removeProduct(product.id);
    this.loadProducts();
  }

  canCompare(): boolean {
    return this.products.length === 2;
  }
}