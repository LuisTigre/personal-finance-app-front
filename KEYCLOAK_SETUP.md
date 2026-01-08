# Keycloak Integration Setup Guide

## Overview

This Angular application is integrated with Keycloak using **Authorization Code Flow with PKCE** for secure authentication. The integration is purely frontend-based with no backend dependency for authentication.

## Keycloak Configuration

### Realm Settings
- **Realm Name**: `Persfin`
- **Base URL**: `http://localhost:8080`

### Client Configuration
- **Client ID**: `persfin-frontend`
- **Client Type**: Public (no client secret)
- **Authentication Flow**: Standard Flow (Authorization Code) with PKCE
- **Valid Redirect URIs**: `http://localhost:4200/*`
- **Valid Post Logout Redirect URIs**: `http://localhost:4200/*`
- **Web Origins**: `http://localhost:4200`
- **PKCE Code Challenge Method**: S256

### Required Keycloak Settings

1. **Enable User Registration** (optional but recommended):
   - Go to Realm Settings → Login
   - Enable "User registration"
   - This allows users to self-register via the Keycloak UI

2. **Enable Forgot Password**:
   - Go to Realm Settings → Login
   - Enable "Forgot password"
   - Configure email settings in Realm Settings → Email

3. **Client Configuration in Keycloak**:
   ```
   Client ID: persfin-frontend
   Client Protocol: openid-connect
   Access Type: public
   Standard Flow Enabled: ON
   Direct Access Grants Enabled: OFF (we don't use password grant)
   Valid Redirect URIs: http://localhost:4200/*
   Valid Post Logout Redirect URIs: http://localhost:4200/*
   Web Origins: http://localhost:4200
   ```

## Application Configuration

### Configuration File
Location: `src/environments/keycloak.config.ts`

```typescript
export const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'Persfin',
  clientId: 'persfin-frontend'
};
```

**To modify settings:**
- Change `url` to point to your Keycloak server
- Change `realm` to match your Keycloak realm name
- Change `clientId` to match your client ID in Keycloak

## Authentication Flows

### 1. Login Flow
- User clicks "Login with Keycloak" button
- App redirects to Keycloak login page
- User enters credentials in Keycloak UI
- After successful login, Keycloak redirects back to app with authorization code
- App exchanges code for tokens (handled automatically by keycloak-angular)
- User is redirected to their intended destination or dashboard

### 2. Registration Flow
- User clicks "Register" or "Create Account" button
- App redirects to Keycloak registration page
- User creates account via Keycloak UI
- After successful registration, user is redirected to login page
- User logs in to get their profile and access token

### 3. Forgot Password Flow
- User clicks "Forgot Password" button
- App redirects to Keycloak reset credentials page
- User enters email in Keycloak UI
- Keycloak sends password reset email
- User clicks link in email and resets password in Keycloak
- User can now log in with new password

### 4. Logout Flow
- User clicks logout
- App calls Keycloak logout endpoint
- Tokens are cleared from memory/storage
- User is redirected to login page

## Using the AuthService

### Available Methods

```typescript
// Check if user is authenticated (Observable)
isAuthenticated(): Observable<boolean>

// Check if user is authenticated (synchronous)
isAuthenticatedSync(): boolean

// Initiate login (redirects to Keycloak)
login(redirectUrl?: string): void

// Logout (redirects to login page after logout)
logout(): void

// Register new user (redirects to Keycloak registration)
register(): void

// Forgot password (redirects to Keycloak reset flow)
forgotPassword(): void

// Get user profile with Keycloak UUID
getUserProfile(): Observable<UserProfile | null>

// Get current access token
getAccessToken(): string | undefined

// Get user roles
getUserRoles(): string[]

// Check if user has specific role
hasRole(role: string): boolean

// Manually refresh token
refreshToken(): Promise<boolean>
```

### User Profile Structure

```typescript
interface UserProfile {
  sub: string;           // Keycloak user UUID - YOUR USER REFERENCE
  username?: string;     // preferred_username from token
  email?: string;        // user's email
  firstName?: string;    // given_name from token
  lastName?: string;     // family_name from token
}
```

### Example Usage in Components

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from './services/auth.service';

@Component({
  selector: 'app-profile',
  template: `
    <div *ngIf="userProfile">
      <h2>User Profile</h2>
      <p><strong>User ID (sub):</strong> {{ userProfile.sub }}</p>
      <p><strong>Username:</strong> {{ userProfile.username }}</p>
      <p><strong>Email:</strong> {{ userProfile.email }}</p>
      <p><strong>Name:</strong> {{ userProfile.firstName }} {{ userProfile.lastName }}</p>
      <button (click)="logout()">Logout</button>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Get user profile after login
    this.authService.getUserProfile().subscribe(profile => {
      this.userProfile = profile;
      console.log('Keycloak User UUID (sub):', profile?.sub);
      // This is your user reference - store it or use it for backend calls
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
```

### Protecting Routes

Routes are protected using `authGuard`. Example from `app.routes.ts`:

```typescript
{
  path: 'dashboard',
  loadComponent: () => import('./dashboard/dashboard.component'),
  canActivate: [authGuard],  // Requires authentication
  data: { title: 'Dashboard' }
}
```

## Token Storage

- **Storage**: Tokens are managed in memory by Keycloak JS adapter
- **Security**: No tokens stored in localStorage by default (more secure)
- **Refresh**: Tokens are automatically refreshed before expiration
- **Interceptor**: HTTP interceptor automatically adds Bearer token to requests

## Important Notes

### User Reference / User ID
- After successful login, the user's **Keycloak UUID** is available in the `sub` claim
- This is your **primary user reference** for the user
- Access it via: `authService.getUserProfile().subscribe(profile => profile.sub)`
- The `sub` value is a UUID like: `"f8e7d6c5-b4a3-9281-7065-4f3e2d1c0b9a"`

### Registration Flow
- Registration is handled entirely by Keycloak
- After registration, user **must log in** to obtain tokens and profile
- The app cannot create users or set passwords directly (no backend admin access)
- User reference (`sub`) is only available **after login**

### Password Reset
- Password reset is handled entirely by Keycloak
- Requires email configuration in Keycloak realm
- User receives email from Keycloak (not from your app)
- After reset, user can log in with new password

### No Backend for Auth
- This is a pure frontend integration
- No backend API calls for login/register/forgot-password
- All auth flows go through Keycloak directly
- Backend APIs (if any) receive the access token via HTTP interceptor

## Testing the Integration

### Prerequisites
1. Keycloak running at `http://localhost:8080`
2. Realm `Persfin` created and configured
3. Client `persfin-frontend` configured as described above
4. Angular app running at `http://localhost:4200`

### Test Steps

1. **Start the app**:
   ```bash
   npm start
   ```

2. **Test Login**:
   - Navigate to `http://localhost:4200/#/login`
   - Click "Login with Keycloak"
   - Enter Keycloak credentials
   - Should redirect to dashboard after successful login

3. **Test Registration**:
   - Click "Register Now!" on login page
   - Fill out registration form in Keycloak
   - After registration, log in
   - Check user profile to see `sub` (user UUID)

4. **Test Forgot Password**:
   - Click "Forgot password?" on login page
   - Enter email in Keycloak page
   - Check email for reset link
   - Reset password in Keycloak
   - Log in with new password

5. **Test Protected Routes**:
   - Try accessing `http://localhost:4200/#/dashboard` without login
   - Should redirect to Keycloak login
   - After login, should return to dashboard

6. **Test Logout**:
   - Click logout button in app
   - Should be logged out from Keycloak
   - Should redirect to login page
   - Tokens should be cleared

## Troubleshooting

### Issue: Redirect Loop
**Solution**: Check `onLoad` configuration in `app.config.ts`. Use `check-sso` instead of `login-required`.

### Issue: CORS Errors
**Solution**: 
- Add `http://localhost:4200` to Web Origins in Keycloak client config
- Ensure Valid Redirect URIs includes `http://localhost:4200/*`

### Issue: Token Not Added to Requests
**Solution**: The HTTP interceptor automatically adds tokens. Check `auth.interceptor.ts` is registered in `app.config.ts`.

### Issue: User Profile Not Loading
**Solution**: 
- Ensure `loadUserProfileAtStartUp: true` in Keycloak init options
- Check user is authenticated: `authService.isAuthenticatedSync()`
- Check Keycloak token includes required claims

### Issue: Registration Not Working
**Solution**: 
- Enable "User registration" in Keycloak Realm Settings → Login
- Check Keycloak realm allows self-registration

### Issue: Forgot Password Email Not Sent
**Solution**: 
- Configure email server in Keycloak Realm Settings → Email
- Test email configuration in Keycloak
- Enable "Forgot password" in Realm Settings → Login

## Security Considerations

✅ **Good Practices**:
- Using Authorization Code Flow with PKCE (most secure for SPAs)
- No client secret (public client)
- Tokens managed in memory (not localStorage)
- Automatic token refresh
- HTTP-only approach (no password handling in app)

❌ **Avoid**:
- Do NOT use Direct Access Grants (password grant)
- Do NOT store tokens in localStorage (use memory/sessionStorage)
- Do NOT implement custom password management (let Keycloak handle it)
- Do NOT try to create users via Admin API from frontend

## Next Steps

Once authentication is working:

1. **Add User Profile Display**: Show user info in header/nav
2. **Role-Based Access**: Use `authService.hasRole()` for RBAC
3. **Backend Integration**: Pass tokens to your backend APIs
4. **Customize UI**: Update login/register pages styling
5. **Add Loading States**: Show spinners during auth redirects

## File Structure

```
src/
├── environments/
│   └── keycloak.config.ts          # Keycloak configuration
├── app/
│   ├── app.config.ts                # Keycloak initialization
│   ├── services/
│   │   └── auth.service.ts          # Authentication service
│   ├── guards/
│   │   └── auth.guard.ts            # Route protection
│   ├── interceptors/
│   │   └── auth.interceptor.ts      # HTTP token injection
│   └── views/pages/
│       ├── login/                   # Login page
│       ├── register/                # Registration page
│       └── forgot-password/         # Password reset page
└── assets/
    └── silent-check-sso.html        # SSO check iframe
```

## Support

For Keycloak documentation:
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Securing Angular Apps](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)

For keycloak-angular library:
- [keycloak-angular GitHub](https://github.com/mauriciovigolo/keycloak-angular)
