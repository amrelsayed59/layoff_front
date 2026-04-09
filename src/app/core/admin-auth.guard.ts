import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService, decodeJwtClaims } from './auth.service';

/**
 * Protects the admin panel route by requiring a JWT.
 * Optionally enforces `role === "admin"` when present in token claims.
 */
export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  if (!token) {
    return router.createUrlTree(['/login']);
  }

  const claims = decodeJwtClaims(token);
  if (claims?.role && claims.role !== 'admin') {
    auth.logout();
    return router.createUrlTree(['/login']);
  }

  return true;
};
