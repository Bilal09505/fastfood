// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { Role } from '../models';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed: Role[] = route.data['roles'] ?? [];
  const role = auth.currentUser()?.role;
  if (role && allowed.includes(role)) return true;
  return router.createUrlTree(['/dashboard']);
};
