import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAllowed = authService.hasPermission('Admin');

  if (isAllowed) {
    return true;
  }

  router.navigateByUrl('/login');
  return false;
};
