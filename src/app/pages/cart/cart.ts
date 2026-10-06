import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CartItem, CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cart',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartPage implements OnInit {
  readonly cartItems = signal<CartItem[]>([]);
  readonly draftQuantities = signal<Record<string, number>>({});
  checkoutForm!: ReturnType<CartPage['createCheckoutForm']>;
  isSubmitting = false;
  isEditing = false;
  isSavingCart = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly cartService: CartService,
    private readonly toastService: ToastService,
    private readonly productService: ProductService,
  ) {
    this.checkoutForm = this.createCheckoutForm();
  }

  async ngOnInit(): Promise<void> {
    await this.loadCart();
  }

  private createCheckoutForm() {
    return this.formBuilder.nonNullable.group({
      fullName: ['', Validators.required],
      address: ['', Validators.required],
    });
  }

  get totalPrice(): number {
    return this.cartItems().reduce((sum, item) => sum + item.price * this.quantityFor(item), 0);
  }

  async submitCheckout(): Promise<void> {
    if (this.checkoutForm.invalid || this.isSubmitting || this.cartItems().length === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const { fullName, address } = this.checkoutForm.getRawValue();
      const order = await this.cartService.placeOrder(fullName, address);
      this.cartItems.set([]);
      this.checkoutForm.reset();
      this.toastService.showSuccess(`Order ${order.id} placed and saved to your account.`);
    } catch (error) {
      this.toastService.showError(error instanceof Error ? error.message : 'Could not place your order. Your cart is unchanged.');
    } finally {
      this.isSubmitting = false;
    }
  }

  async updateQuantity(item: CartItem, quantity: number): Promise<void> {
    this.draftQuantities.update((quantities) => ({ ...quantities, [String(item.productId)]: quantity }));
  }

  quantityFor(item: CartItem): number {
    return this.draftQuantities()[String(item.productId)] ?? item.quantity;
  }

  beginEditing(): void {
    this.draftQuantities.set(Object.fromEntries(this.cartItems().map((item) => [String(item.productId), item.quantity])));
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.draftQuantities.set({});
    this.isEditing = false;
  }

  async saveCartChanges(): Promise<void> {
    this.isSavingCart = true;
    try {
      const changes = Object.entries(this.draftQuantities()).map(([productId, quantity]) => ({ productId, quantity }));
      this.cartItems.set(await this.cartService.updateCartQuantities(changes));
      this.isEditing = false;
      this.draftQuantities.set({});
      this.toastService.showSuccess('Cart changes saved.');
    } catch (error) {
      this.toastService.showError(error instanceof Error ? error.message : 'Could not save cart changes.');
    } finally {
      this.isSavingCart = false;
    }
  }

  async removeItem(item: CartItem): Promise<void> {
    this.cartItems.set(await this.cartService.removeItem(item.id));
    this.toastService.showSuccess(`${item.productName} removed from cart.`);
  }

  private async loadCart(): Promise<void> {
    try {
      await this.productService.ensureProductsLoaded();
      this.cartItems.set(await this.cartService.loadCart());
    } catch (error) {
      this.toastService.showError(error instanceof Error ? error.message : 'Could not load your cart.');
      this.cartItems.set([]);
    }
  }
}
