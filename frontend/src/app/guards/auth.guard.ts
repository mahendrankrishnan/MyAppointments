import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const isAuthSignal = authService.isAuthenticated();

  const isAuthenticated = token !== null && token !== '' && isAuthSignal;

  if (!isAuthenticated) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  return authService.validateSession().pipe(
    map((valid) => {
      if (!valid) {
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url, reason: 'access_denied' },
        });
        return false;
      }

      return true;
    })
  );
};
