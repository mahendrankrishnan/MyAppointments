import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check authentication status - verify both signal and token existence
  const token = authService.getToken();
  const isAuthSignal = authService.isAuthenticated();
  
  // Ensure we have both a token and the signal indicates authentication
  const isAuthenticated = token !== null && token !== '' && isAuthSignal;
  
  if (isAuthenticated) {
    return true;
  }

  // Redirect to login page if not authenticated
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
