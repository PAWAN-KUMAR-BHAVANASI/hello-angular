import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const customerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAllowed = authService.hasPermission('Customer');

  if (isAllowed) {
    return true;
  }

  return authService.isLoggedIn()
    ? router.createUrlTree(['/'])
    : router.createUrlTree(['/login']);
};
