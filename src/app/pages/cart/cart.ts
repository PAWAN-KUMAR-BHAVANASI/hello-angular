import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-cart',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartPage {
  cartItems: Product[] = [];
  checkoutForm!: ReturnType<CartPage['createCheckoutForm']>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productService: ProductService,
  ) {
    this.checkoutForm = this.createCheckoutForm();
    this.cartItems = this.productService.getAllProducts().slice(0, 2);
  }

  private createCheckoutForm() {
    return this.formBuilder.nonNullable.group({
      fullName: ['', Validators.required],
      address: ['', Validators.required],
      paymentMethod: ['Card', Validators.required],
    });
  }

  get totalPrice(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price, 0);
  }

  submitCheckout(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    alert('Order placed successfully.');
  }
}
