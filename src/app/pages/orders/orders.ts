import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CartService, OrderRecord } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-orders',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class OrdersPage implements OnInit {
  readonly orders = signal<OrderRecord[]>([]);
  readonly isAdmin: boolean;
  readonly accountEmail: string;
  readonly isLoading = signal(true);

  constructor(
    private readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService,
  ) {
    this.isAdmin = this.authService.hasPermission('Admin');
    this.accountEmail = this.authService.getCurrentUser()?.email ?? '';
  }

  async ngOnInit(): Promise<void> {
    try {
      const orders = await this.cartService.loadOrders();
      this.orders.set(orders.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)));
    } catch (error) {
      this.toastService.showError(error instanceof Error ? error.message : 'Could not load orders.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
