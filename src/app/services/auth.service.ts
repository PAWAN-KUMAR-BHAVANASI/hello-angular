import { Injectable } from '@angular/core';

export type UserRole = 'Admin' | 'Sales' | 'Customer';

export interface AppUser {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'app-user';

  private readonly users: AppUser[] = [
    { email: 'admin@shop.com', password: 'admin123', role: 'Admin', name: 'Admin User' },
    { email: 'sales@shop.com', password: 'sales123', role: 'Sales', name: 'Sales User' },
    { email: 'customer@shop.com', password: 'customer123', role: 'Customer', name: 'Customer User' },
  ];

  login(email: string, password: string): AppUser {
    const foundUser = this.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password,
    );

    if (!foundUser) {
      throw new Error('Invalid email or password.');
    }

    localStorage.setItem(this.storageKey, JSON.stringify(foundUser));
    return foundUser;
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  getCurrentUser(): AppUser | null {
    const storedUser = localStorage.getItem(this.storageKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AppUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasPermission(requiredRole: UserRole): boolean {
    const user = this.getCurrentUser();

    if (!user) {
      return false;
    }

    const hierarchy: Record<UserRole, number> = {
      Admin: 3,
      Sales: 2,
      Customer: 1,
    };

    return hierarchy[user.role] >= hierarchy[requiredRole];
  }
}
