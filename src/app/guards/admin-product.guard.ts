import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminProductGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasPermission('Admin')) {
    return true;
  }

  return authService.isLoggedIn()
    ? router.createUrlTree(['/'])
    : router.createUrlTree(['/login']);
};