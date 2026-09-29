import { AsyncPipe } from '@angular/common';
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
  ) {
    this.toastState$ = this.toastService.toastState$;
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  isAdmin(): boolean {
    return this.authService.hasPermission('Admin');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}