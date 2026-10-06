import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'Admin' | 'Customer';

export interface AppUser {
  id?: number | string;
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'app-user';
  private readonly apiUrl = 'http://localhost:3002/users';

  constructor(private readonly http: HttpClient) {}

  private async fetchUsers(): Promise<AppUser[]> {
    try {
      return await firstValueFrom(this.http.get<AppUser[]>(this.apiUrl));
    } catch {
      throw new Error('Cannot reach the login database. Make sure JSON Server is running with npm run server.');
    }
  }

  async login(email: string, password: string): Promise<AppUser> {
    const users = await this.fetchUsers();
    const foundUser = users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password,
    );

    if (!foundUser) {
      throw new Error('Invalid email or password.');
    }

    localStorage.setItem(this.storageKey, JSON.stringify(foundUser));
    return foundUser;
  }

  async register(name: string, email: string, password: string): Promise<AppUser> {
    const users = await this.fetchUsers();

    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }

    try {
      const newUser = await firstValueFrom(
        this.http.post<AppUser>(this.apiUrl, {
          name: name.trim(),
          email: email.trim(),
          password,
          role: 'Customer',
        }),
      );
      localStorage.setItem(this.storageKey, JSON.stringify(newUser));
      return newUser;
    } catch {
      throw new Error('Could not create the account. Check that JSON Server is running and try again.');
    }
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
      Admin: 2,
      Customer: 1,
    };

    const userRole = user.role ?? 'Customer';
    return hierarchy[userRole] >= hierarchy[requiredRole];
  }

}
