import { Injectable } from '@angular/core';

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly keyPrefix = 'wishlist';

  constructor(private readonly authService: AuthService) {}

  getProductIds(): string[] {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      const ids = data ? JSON.parse(data) as unknown : [];
      return Array.isArray(ids) ? ids.map(String) : [];
    } catch {
      return [];
    }
  }

  contains(productId: number | string): boolean {
    return this.getProductIds().includes(String(productId));
  }

  toggle(productId: number | string): boolean {
    const ids = this.getProductIds();
    const id = String(productId);
    const isSaved = ids.includes(id);
    const updated = isSaved ? ids.filter((savedId) => savedId !== id) : [...ids, id];
    localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
    return !isSaved;
  }

  private getStorageKey(): string {
    const user = this.authService.getCurrentUser();
    return user
      ? `${this.keyPrefix}:${user.email.toLowerCase()}`
      : `${this.keyPrefix}:guest`;
  }
}
