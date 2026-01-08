# Quick Start Guide - Keycloak Integration

## Prerequisites

Before starting, ensure you have:
1. ✅ Keycloak server running at `http://localhost:8080`
2. ✅ Realm `Persfin` created in Keycloak
3. ✅ Client `persfin-frontend` configured in Keycloak
4. ✅ Node.js and npm installed
5. ✅ Angular dependencies installed (`npm install` completed)

## Keycloak Client Setup (5 minutes)

### Step 1: Create Client in Keycloak

1. Log in to Keycloak Admin Console: `http://localhost:8080/admin`
2. Select realm: `Persfin` (or create it if it doesn't exist)
3. Go to **Clients** → Click **Create client**
4. Fill in:
   - **Client ID**: `persfin-frontend`
   - **Client type**: `OpenID Connect`
   - Click **Next**

5. **Capability config**:
   - ✅ **Standard flow** (enabled)
   - ✅ **Direct access grants** (disabled) - not using password grant
   - Click **Next**

6. **Login settings**:
   - **Valid redirect URIs**: `http://localhost:4200/*`
   - **Valid post logout redirect URIs**: `http://localhost:4200/*`
   - **Web origins**: `http://localhost:4200`
   - Click **Save**

### Step 2: Enable PKCE (Required)

1. In the client settings, go to **Advanced** tab
2. Find **Proof Key for Code Exchange Code Challenge Method**
3. Set to: **S256**
4. Click **Save**

### Step 3: Enable User Registration (Optional)

1. Go to **Realm Settings** → **Login** tab
2. Enable:
   - ✅ **User registration**
   - ✅ **Forgot password**
   - ✅ **Remember me**
3. Click **Save**

### Step 4: Configure Email (For Password Reset)

1. Go to **Realm Settings** → **Email** tab
2. Configure your SMTP server settings
3. Test the connection
4. Click **Save**

**Note**: For development, you can use a service like MailHog or just skip email config and manually reset passwords via Keycloak admin console.

## Running the Application

### Step 1: Install Dependencies (if not done)

```bash
npm install
```

### Step 2: Start the Application

```bash
npm start
```

The app will open at: `http://localhost:4200`

### Step 3: Test Authentication

1. **Test Login**:
   - Navigate to: `http://localhost:4200/#/login`
   - Click "Login with Keycloak"
   - You'll be redirected to Keycloak login page
   - Enter credentials (or create a user in Keycloak admin if needed)
   - After successful login, you'll be redirected back to the app

2. **Test Registration**:
   - Click "Register Now!" button
   - Fill out the registration form in Keycloak
   - After registration, log in with your new credentials

3. **Test Forgot Password**:
   - Click "Forgot password?"
   - Enter your email in Keycloak
   - Check email for reset link (if email is configured)
   - Reset password and log in again

4. **View User Profile**:
   - After logging in, navigate to: `http://localhost:4200/#/profile-example`
   - You'll see your user profile with Keycloak UUID (sub)
   - This demonstrates how to access user data

## Verification Checklist

✅ **Authentication Working**:
- [ ] Can redirect to Keycloak login page
- [ ] Can log in successfully
- [ ] Redirected back to app after login
- [ ] Protected routes (e.g., dashboard) are accessible after login

✅ **User Profile Available**:
- [ ] Can access user profile at `/profile-example`
- [ ] User UUID (sub) is displayed
- [ ] Email and name are displayed
- [ ] Access token is available

✅ **Registration Working**:
- [ ] Can redirect to Keycloak registration page
- [ ] Can create new account
- [ ] After registration, can log in

✅ **Password Reset Working**:
- [ ] Can redirect to Keycloak forgot password page
- [ ] Email is sent (if configured)
- [ ] Can reset password

✅ **Logout Working**:
- [ ] Can log out
- [ ] Redirected to login page
- [ ] Cannot access protected routes after logout

## Common Issues & Solutions

### Issue: "Client not found" error
**Solution**: Double-check the client ID in `src/environments/keycloak.config.ts` matches exactly with Keycloak (case-sensitive).

### Issue: "Invalid redirect URI" error
**Solution**: 
- Ensure `http://localhost:4200/*` is in Valid Redirect URIs
- Check for trailing slashes or typos
- Make sure Web Origins includes `http://localhost:4200`

### Issue: Can't see user profile data
**Solution**: 
- Check that you're logged in: `authService.isAuthenticatedSync()`
- Open browser console and look for errors
- Verify Keycloak token includes user claims (check in Keycloak admin)

### Issue: CORS errors
**Solution**:
- Add `http://localhost:4200` to Web Origins in Keycloak client
- Clear browser cache and try again

### Issue: Redirect loop
**Solution**:
- Check `onLoad` setting in `app.config.ts` (should be `check-sso`)
- Clear browser localStorage/sessionStorage
- Try incognito/private mode

## Next Steps

Once everything is working:

1. **Customize the UI**: Update login/register pages with your branding
2. **Add User Info to Header**: Display logged-in user in navigation
3. **Implement Role-Based Access**: Use `authService.hasRole()` for permissions
4. **Connect to Backend**: Use access token for API authentication
5. **Production Configuration**: Update URLs in `keycloak.config.ts` for production

## Testing Endpoints

Test these URLs to verify everything works:

- **Login**: `http://localhost:4200/#/login`
- **Register**: `http://localhost:4200/#/register`
- **Forgot Password**: `http://localhost:4200/#/forgot-password`
- **Dashboard** (protected): `http://localhost:4200/#/dashboard`
- **Profile Example**: `http://localhost:4200/#/profile-example`

## Getting User Reference

After login, get the user's Keycloak UUID:

```typescript
this.authService.getUserProfile().subscribe(profile => {
  const userId = profile.sub;  // This is the Keycloak user UUID
  console.log('User ID:', userId);
  // Use this ID for backend operations, database records, etc.
});
```

## Configuration Files

- **Keycloak Config**: `src/environments/keycloak.config.ts`
- **App Config**: `src/app/app.config.ts`
- **Auth Service**: `src/app/services/auth.service.ts`
- **Auth Guard**: `src/app/guards/auth.guard.ts`
- **Auth Interceptor**: `src/app/interceptors/auth.interceptor.ts`

## Support

For detailed documentation, see: `KEYCLOAK_SETUP.md`

Need help? Check:
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [keycloak-angular GitHub](https://github.com/mauriciovigolo/keycloak-angular)
