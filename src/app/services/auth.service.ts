import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { from, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * User profile extracted from Keycloak token
 * - sub: Keycloak user UUID (unique identifier)
 * - username: preferred_username claim
 * - email: user's email
 * - firstName: given_name claim
 * - lastName: family_name claim
 */
export interface UserProfile {
  sub: string;  // Keycloak user UUID - this is your user reference
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private keycloak: KeycloakService) {}

  private buildRedirectUri(redirectUrl?: string): string {
    const fallbackPath = '/dashboard';
    const raw = (redirectUrl || '').trim() || fallbackPath;

    try {
      const url = new URL(raw, window.location.origin);
      // Never include query or fragment in redirectUri to avoid redirect loops.
      return url.origin + url.pathname;
    } catch {
      return window.location.origin + fallbackPath;
    }
  }

  /**
   * Check if user is authenticated
   * Returns Observable<boolean>
   */
  isAuthenticated(): Observable<boolean> {
    return of(this.keycloak.getKeycloakInstance().authenticated || false);
  }

  /**
   * Check if user is authenticated (synchronous)
   * Use this for guards and quick checks
   */
  isAuthenticatedSync(): boolean {
    return this.keycloak.getKeycloakInstance().authenticated || false;
  }

  /**
   * Initiate login flow
   * Redirects user to Keycloak login page
   * @param redirectUrl - URL to return to after successful login
   */
  login(redirectUrl?: string): void {
    const options: any = {
      redirectUri: this.buildRedirectUri(redirectUrl)
    };
    this.keycloak.login(options);
  }

  /**
   * Logout from Keycloak and redirect to app homepage
   * Clears all tokens and session
   */
  logout(): void {
    this.keycloak.logout(window.location.origin + '/login');
  }

  /**
   * Redirect to Keycloak registration page
   * User can create a new account via Keycloak UI
   * After successful registration, user should log in to get their profile
   */
  register(): void {
    const options: any = {
      action: 'register',
      redirectUri: window.location.origin + '/login'
    };
    this.keycloak.register(options);
  }

  /**
   * Redirect to Keycloak forgot password / reset credentials flow
   * User will receive reset email from Keycloak
   * After reset, they can log in with new password
   */
  forgotPassword(): void {
    // Construct Keycloak reset credentials URL
    const keycloakInstance = this.keycloak.getKeycloakInstance();
    const realm = keycloakInstance.realm;
    const authServerUrl = keycloakInstance.authServerUrl;
    const clientId = keycloakInstance.clientId;
    const redirectUri = encodeURIComponent(window.location.origin + '/login');
    
    // Keycloak reset credentials URL format
    const resetUrl = `${authServerUrl}/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid&kc_action=UPDATE_PASSWORD`;
    
    window.location.href = resetUrl;
  }

  /**
   * Get user profile from Keycloak token
   * Returns the user's Keycloak UUID (sub) and other profile information
   * This is the "user reference" you can use to identify the user
   */
  getUserProfile(): Observable<UserProfile | null> {
    if (!this.isAuthenticatedSync()) {
      return of(null);
    }

    return from(this.keycloak.loadUserProfile()).pipe(
      map((profile: KeycloakProfile) => {
        const tokenParsed = this.keycloak.getKeycloakInstance().tokenParsed;
        return {
          sub: tokenParsed?.['sub'] || '',  // Keycloak user UUID
          username: profile.username || tokenParsed?.['preferred_username'],
          email: profile.email || tokenParsed?.['email'],
          firstName: profile.firstName || tokenParsed?.['given_name'],
          lastName: profile.lastName || tokenParsed?.['family_name']
        };
      }),
      catchError(error => {
        console.error('Error loading user profile:', error);
        return of(null);
      })
    );
  }

  /**
   * Get current access token
   * Returns null if not authenticated
   */
  getAccessToken(): string | undefined {
    try {
      return this.keycloak.getKeycloakInstance().token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return undefined;
    }
  }

  /**
   * Get user roles from Keycloak token
   * Useful for role-based access control
   */
  getUserRoles(): string[] {
    return this.keycloak.getUserRoles();
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.keycloak.isUserInRole(role);
  }

  /**
   * Manually refresh the token
   * Keycloak automatically refreshes tokens, but you can force it
   */
  refreshToken(): Promise<boolean> {
    return this.keycloak.updateToken(5);
  }
}
