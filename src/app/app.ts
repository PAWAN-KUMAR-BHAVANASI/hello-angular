import { AsyncPipe, Location } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly toastState$;

  constructor(
    private readonly toastService: ToastService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly location: Location,
  ) {
    this.toastState$ = this.toastService.toastState$;
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get canManageProducts(): boolean {
    return this.authService.hasPermission('Admin');
  }

  get userInitials(): string {
    const user = this.currentUser;

    if (!user) {
      return 'U';
    }

    const initials = user.name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    return initials.slice(0, 2) || user.email.charAt(0).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  goBack(): void {
    const state = this.location.getState() as { navigationId?: number };

    if (state.navigationId && state.navigationId > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/');
  }
}