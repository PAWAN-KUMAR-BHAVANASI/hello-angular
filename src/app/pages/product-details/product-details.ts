import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductComparisonService } from '../../services/product-comparision.service';
import { Product, ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-product-details',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetailsPage implements OnInit {
  readonly products: Signal<Product[]>;
  readonly productId: string;
  readonly quantity = signal(1);
  readonly wishlistRevision = signal(0);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productService: ProductService,
    private readonly comparisonService: ProductComparisonService,
    private readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly wishlistService: WishlistService,
  ) {
    this.productId = this.route.snapshot.paramMap.get('id') ?? '';
    this.products = toSignal(this.productService.products$, { initialValue: [] });
  }

  async ngOnInit(): Promise<void> {
    await this.productService.ensureProductsLoaded();
    if (!this.product) {
      try {
        await this.productService.reloadProducts();
      } catch {
        this.toastService.showError('Could not load this product.');
      }
    }
  }

  get product(): Product | undefined {
    return this.products().find((item) => String(item.id) === this.productId);
  }

  get canShop(): boolean {
    return this.authService.hasPermission('Customer') && !this.authService.hasPermission('Admin');
  }

  get isCompared(): boolean {
    return this.comparisonService.isSelected(this.productId);
  }

  get comparisonCount(): number {
    return this.comparisonService.getSelectedCount();
  }

  get isWishlisted(): boolean {
    this.wishlistRevision();
    return this.wishlistService.contains(this.productId);
  }

  toggleWishlist(): void {
    const saved = this.wishlistService.toggle(this.productId);
    this.wishlistRevision.update((revision) => revision + 1);
    this.toastService.showSuccess(saved ? 'Added to your wishlist.' : 'Removed from your wishlist.');
  }

  get productImage(): string {
    const brand = this.product?.brand?.toLowerCase();
    if (brand === 'apple') return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=85';
    if (brand === 'hp') return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1400&q=85';
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=85';
  }

  adjustQuantity(change: number): void {
    const stock = this.product?.quantity ?? 1;
    this.quantity.update((quantity) => Math.max(1, Math.min(stock, quantity + change)));
  }

  async addToCart(): Promise<void> {
    const product = this.product;
    if (!product || !this.canShop) return;

    try {
      await this.cartService.addProduct(product, this.quantity());
      this.toastService.showSuccess('Product added to your cart.');
    } catch (error) {
      this.toastService.showError(error instanceof Error ? error.message : 'Could not add this product to cart.');
    }
  }

  toggleComparison(): void {
    const product = this.product;
    if (!product) return;

    if (this.isCompared) {
      this.comparisonService.removeProduct(product.id);
      return;
    }

    if (!this.comparisonService.addProduct(product)) {
      this.toastService.showError('Your comparison is full. Remove a product before adding another.');
      return;
    }

    this.toastService.showSuccess(`Added to comparison (${this.comparisonCount}/2).`);
  }
}
