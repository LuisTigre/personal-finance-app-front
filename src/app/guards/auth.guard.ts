import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Authentication guard using Keycloak
 * Protects routes from unauthorized access
 * Redirects to login if not authenticated, preserving the intended destination
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If we're on the OAuth callback URL, Keycloak init will process it.
  // Starting another login here causes redirect loops and huge redirect_uri values.
  const isOAuthCallback =
    window.location.search.includes('code=') ||
    window.location.search.includes('state=') ||
    window.location.search.includes('session_state=');
  if (isOAuthCallback) {
    return true;
  }

  // Check authentication synchronously
  const isAuthenticated = authService.isAuthenticatedSync();
  
  if (isAuthenticated) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = (state.url.split('?')[0].split('#')[0] || '').trim() || '/dashboard';
  
  // Redirect to Keycloak login with return URL
  authService.login(returnUrl);
  
  return false;
};
