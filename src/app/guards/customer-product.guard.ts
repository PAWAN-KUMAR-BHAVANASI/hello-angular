import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const customerProductGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  if (user && (user.role ?? 'Customer') === 'Customer') {
    return true;
  }

  return authService.isLoggedIn()
    ? router.createUrlTree(['/'])
    : router.createUrlTree(['/login']);
};