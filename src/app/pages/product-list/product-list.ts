import { Component, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Product, ProductService } from '../../services/product.service';
import { ProductComparisonService } from '../../services/product-comparision.service';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListPage {
  readonly products: Signal<Product[]>;
  readonly wishlistRevision = signal(0);
  selectedOwnerEmail = 'all';
  searchTerm = '';
  selectedBrand = 'all';
  sortOrder = 'recommended';
  readonly addQuantities = signal<Record<string, number>>({});

  constructor(
    private readonly productService: ProductService,
    private readonly comparisonService: ProductComparisonService,
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly toastService: ToastService,
    private readonly wishlistService: WishlistService,
  ) {
    this.products = toSignal(this.productService.products$, { initialValue: [] });
  }

  get canManageProducts(): boolean {
    return this.authService.hasPermission('Admin');
  }

  get isAdmin(): boolean {
    return this.authService.hasPermission('Admin');
  }

  get ownerEmails(): string[] {
    return [...new Set(this.visibleAccountProducts.map((product) => product.ownerEmail).filter((email): email is string => !!email))]
      .sort((left, right) => left.localeCompare(right));
  }

  get brands(): string[] {
    return [...new Set(this.products().map((product) => product.brand).filter((brand): brand is string => !!brand))]
      .sort((left, right) => left.localeCompare(right));
  }

  private get visibleAccountProducts(): Product[] {
    return this.products();
  }

  get visibleProducts(): Product[] {
    const search = this.searchTerm.trim().toLowerCase();
    const filtered = this.visibleAccountProducts.filter((product) => {
      const matchesAccount = this.selectedOwnerEmail === 'all'
        || (this.selectedOwnerEmail === 'unassigned' ? !product.ownerEmail : product.ownerEmail?.toLowerCase() === this.selectedOwnerEmail);
      const matchesBrand = this.selectedBrand === 'all' || product.brand === this.selectedBrand;
      const specText = Object.values(product.specifications ?? {}).join(' ');
      const matchesSearch = !search || `${product.name} ${product.brand ?? ''} ${product.model ?? ''} ${specText} ${product.ownerEmail ?? ''}`.toLowerCase().includes(search);
      return matchesAccount && matchesBrand && matchesSearch;
    });

    return [...filtered].sort((left, right) => {
      if (this.sortOrder === 'price-low') return left.price - right.price;
      if (this.sortOrder === 'price-high') return right.price - left.price;
      if (this.sortOrder === 'name') return left.name.localeCompare(right.name);
      return 0;
    });
  }

  setOwnerFilter(event: Event): void {
    this.selectedOwnerEmail = (event.target as HTMLSelectElement).value;
  }

  setSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  setBrand(event: Event): void {
    this.selectedBrand = (event.target as HTMLSelectElement).value;
  }

  setSort(event: Event): void {
    this.sortOrder = (event.target as HTMLSelectElement).value;
  }

  async deleteProduct(id: number | string): Promise<void> {
    try {
      await this.productService.deleteProduct(id);
    } catch {
      this.toastService.showError('Only admins can delete catalog products.');
    }
  }

  get canShop(): boolean {
    return this.authService.hasPermission('Customer') && !this.authService.hasPermission('Admin');
  }

  getAddQuantity(product: Product): number {
    return this.addQuantities()[String(product.id)] ?? 1;
  }

  getProductImage(product: Product): string {
    const brand = product.brand?.toLowerCase();
    if (brand === 'apple') return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80';
    if (brand === 'hp') return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80';
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80';
  }

  setAddQuantity(product: Product, event: Event): void {
    const requested = Number((event.target as HTMLInputElement).value);
    this.addQuantities.update((values) => ({
      ...values,
      [String(product.id)]: Math.max(1, Math.min(product.quantity, Math.floor(requested || 1))),
    }));
  }

  adjustAddQuantity(product: Product, change: number): void {
    this.addQuantities.update((values) => ({
      ...values,
      [String(product.id)]: Math.max(1, Math.min(product.quantity, this.getAddQuantity(product) + change)),
    }));
  }

  async addToCart(product: Product): Promise<void> {
    try {
      await this.cartService.addProduct(product, this.getAddQuantity(product));
      this.toastService.showSuccess('Product added to your cart.');
    } catch (error) {
      this.toastService.showError(error instanceof Error ? error.message : 'Could not add this product to cart.');
    }
  }

  // =========================================================
  // PRODUCT COMPARISON
  // =========================================================

  /**
   * Add a product to the comparison list.
   */
  compareProduct(product: Product): void {
    const added = this.comparisonService.addProduct(product);

    if (!added) {
      alert('You can compare a maximum of 2 products.');
    }
  }

  /**
   * Remove a product from the comparison list.
   */
  removeFromComparison(product: Product): void {
    this.comparisonService.removeProduct(product.id);
  }

  /**
   * Check whether the product is already selected.
   */
  isCompared(product: Product): boolean {
    return this.comparisonService.isSelected(product.id);
  }

  isWishlisted(product: Product): boolean {
    this.wishlistRevision();
    return this.wishlistService.contains(product.id);
  }

  toggleWishlist(product: Product): void {
    const saved = this.wishlistService.toggle(product.id);
    this.wishlistRevision.update((revision) => revision + 1);
    this.toastService.showSuccess(saved ? 'Added to your wishlist.' : 'Removed from your wishlist.');
  }

  /**
   * Get the number of products currently selected.
   */
  get comparisonCount(): number {
    return this.comparisonService.getSelectedCount();
  }

  /**
   * Allow comparison page only when 2 products are selected.
   */
  canCompare(): boolean {
    return this.comparisonService.canCompare();
  }
}