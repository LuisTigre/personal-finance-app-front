import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor for Keycloak authentication
 * - Adds Bearer token to requests automatically
 * - Handles token refresh on 401 errors
 * - Redirects to login on authentication failures
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get current access token from Keycloak
  const token = authService.getAccessToken();

  // Clone request and add Authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - token might be expired
      if (error.status === 401) {
        // Try to refresh the token
        return from(authService.refreshToken()).pipe(
          switchMap((refreshed) => {
            if (refreshed) {
              // Token refreshed successfully, retry the request
              const newToken = authService.getAccessToken();
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(retryReq);
            } else {
              // Token refresh failed, redirect to login
              authService.logout();
              return throwError(() => error);
            }
          }),
          catchError((refreshError) => {
            // Token refresh failed, redirect to login
            authService.logout();
            return throwError(() => error);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};
