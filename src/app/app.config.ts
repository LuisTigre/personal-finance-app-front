import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
  withRouterConfig,
  withViewTransitions
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { DropdownModule, SidebarModule } from '@coreui/angular';
import { IconSetService } from '@coreui/icons-angular';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { debugHttpInterceptor } from './interceptors/debug-http.interceptor';
import { KeycloakService } from 'keycloak-angular';
import { keycloakConfig } from '../environments/keycloak.config';
import { LockService } from './services/lock.service';

/**
 * Initialize Keycloak with Authorization Code Flow + PKCE
 * Includes timeout wrapper to prevent app from hanging indefinitely
 * 
 * Uses check-sso to allow app to load even without Web Crypto API
 * Handles lock state: if locked, unlock after successful re-authentication
 * 
 * Critical fixes for F12-only load issue:
 * - checkLoginIframe: false (disables iframe polling)
 * - silentCheckSsoRedirectUri provided for fallback SSO check
 * - messageReceiveTimeout: 10000ms (10 seconds max for iframe messages)
 * - Promise.race() timeout wrapper (10 seconds max for entire init)
 * - onLoad: 'check-sso' (allows app to load without forcing login on init)
 */
function initializeKeycloak(keycloak: KeycloakService, lockService: LockService) {
  return () => {
    // CRITICAL: Force clean URL immediately to break redirect loops
    const currentUrl = window.location.href;
    if (currentUrl.includes('state=') && currentUrl.length > 500) {
      console.warn('⚠️ Detected corrupted URL with accumulated OAuth parameters. Cleaning...');
      const cleanUrl = window.location.origin + window.location.pathname;
      window.location.replace(cleanUrl);
      return Promise.resolve();
    }
    
    // Check if Web Crypto API is available (required for Keycloak)
    const isWebCryptoAvailable = window.crypto && window.crypto.subtle;
    
    if (!isWebCryptoAvailable) {
      console.error('❌ Web Crypto API not available. Keycloak requires Web Crypto.');
      console.error('💡 Solutions:');
      console.error('   1. Use a modern browser (Chrome, Firefox, Edge)');
      console.error('   2. Ensure app runs on localhost or HTTPS');
      console.error('   3. Check browser security settings');
      console.error('⚠️ App will continue in logged-out state.');
      return Promise.resolve();
    }

    // Create timeout promise that resolves after 10 seconds
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn('⚠️ Keycloak initialization timed out after 10 seconds. Continuing with logged-out state.');
        resolve();
      }, 10000);
    });

    const isOAuthCallback =
      window.location.search.includes('code=') ||
      window.location.search.includes('state=') ||
      window.location.search.includes('session_state=');

    // Create Keycloak init promise
    const keycloakPromise = keycloak.init({
      config: keycloakConfig,
      initOptions: {
        // Use check-sso so Keycloak reliably processes OAuth callbacks
        // (and restores existing sessions) without forcing login on init.
        onLoad: 'check-sso',
        // Enable PKCE S256 for Authorization Code Flow
        pkceMethod: 'S256',
        // CRITICAL: Use query response mode (not fragment) for path-based routing
        responseMode: 'query',
        // CRITICAL: Disable login iframe to prevent infinite loading (F12-only issue)
        checkLoginIframe: false,
        // Provide silent SSO redirect page for fallback checks
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
        // Timeout for iframe message receipt (prevents hanging)
        messageReceiveTimeout: 10000,
      },
      // Don't add token to requests by default (our interceptor will handle this)
      enableBearerInterceptor: false,
      // Don't load user profile on init to avoid blocking
      loadUserProfileAtStartUp: false,
    })
      .then((authenticated) => {
        console.log('✅ Keycloak initialized successfully. Authenticated:', authenticated);
        
        // If user was locked and successfully re-authenticated, unlock
        if (authenticated && lockService.isLocked()) {
          lockService.unlockLocalOnly();
        }
        
        // Clean OAuth params from URL if present
        if (window.location.search.includes('state=') || window.location.search.includes('code=')) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
        
        return authenticated;
      })
      .catch((error) => {
        console.error('❌ Keycloak initialization error:', error);
        console.error('⚠️ App will continue in logged-out state.');
        console.error('💡 Check browser console for Web Crypto API errors.');
        // Allow app to continue even if Keycloak init fails
        return Promise.resolve(false);
      });

    // Race between Keycloak init and timeout
    // This ensures app NEVER hangs indefinitely
    // BUT: if we're on an OAuth callback URL, do NOT race with a timeout,
    // otherwise we can proceed unauthenticated while the callback params remain,
    // triggering guards to start another login and causing redirect_uri growth.
    const bootstrapPromise = isOAuthCallback
      ? keycloakPromise
      : Promise.race([keycloakPromise, timeoutPromise]);

    return bootstrapPromise.then(() => {
      console.log('🚀 App bootstrap complete');
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      }),
      withEnabledBlockingInitialNavigation(),
      withViewTransitions()
    ),
    provideHttpClient(withInterceptors([authInterceptor, debugHttpInterceptor])),
    importProvidersFrom(SidebarModule, DropdownModule),
    IconSetService,
    provideAnimationsAsync(),
    // Provide Keycloak
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService, LockService],
    },
  ]
};
