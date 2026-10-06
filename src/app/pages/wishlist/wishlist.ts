import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../services/cart.service';
import { Product, ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class WishlistPage implements OnInit {
  readonly products = signal<Product[]>([]);

  constructor(
    private readonly wishlistService: WishlistService,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly toastService: ToastService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.productService.ensureProductsLoaded();
    this.refresh();
  }

  refresh(): void {
    const ids = new Set(this.wishlistService.getProductIds());
    this.products.set(this.productService.getAllProducts().filter((product) => ids.has(String(product.id))));
  }

  remove(product: Product): void {
    this.wishlistService.toggle(product.id);
    this.refresh();
  }

  async addToCart(product: Product): Promise<void> {
    try {
      await this.cartService.addProduct(product, 1);
      this.toastService.showSuccess(`${product.name} added to cart.`);
    } catch (error) {
      this.toastService.showError(error instanceof Error ? error.message : 'Could not add this laptop to cart.');
    }
  }
}
