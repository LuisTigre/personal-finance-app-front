# Keycloak Integration - Troubleshooting Checklist

## Pre-Flight Checklist

Before starting the app, verify:

### Keycloak Server
- [ ] Keycloak is running at `http://localhost:8080`
- [ ] Can access Keycloak admin console at `http://localhost:8080/admin`
- [ ] Realm `Persfin` exists
- [ ] Can log into Keycloak admin console

### Client Configuration
- [ ] Client `persfin-frontend` exists in `Persfin` realm
- [ ] Client type is set to **Public**
- [ ] **Standard flow** is enabled
- [ ] **Direct access grants** is disabled
- [ ] Valid Redirect URIs: `http://localhost:4200/*`
- [ ] Valid Post Logout Redirect URIs: `http://localhost:4200/*`
- [ ] Web Origins: `http://localhost:4200`
- [ ] PKCE method is set to **S256** (in Advanced settings)

### Application Configuration
- [ ] File `src/environments/keycloak.config.ts` exists
- [ ] URLs in keycloak.config.ts match your Keycloak server
- [ ] Client ID matches exactly (case-sensitive)
- [ ] Dependencies installed: `npm install` completed
- [ ] No TypeScript compilation errors

## Testing Checklist

### 1. Basic Authentication

**Login Test**:
```
1. Start app: npm start
2. Navigate to: http://localhost:4200/#/login
3. Click "Login with Keycloak"
4. Should redirect to: http://localhost:8080/realms/Persfin/protocol/openid-connect/auth...
5. Enter credentials in Keycloak
6. Should redirect back to: http://localhost:4200/#/dashboard
```

**Expected Result**: ✅ Successfully logged in and redirected to dashboard

**If it fails**:
- Check browser console for errors
- Verify Keycloak server is running
- Check client configuration in Keycloak
- Verify redirect URIs are correctly configured

### 2. Protected Routes

**Protected Route Test**:
```
1. Logout (if logged in)
2. Try to access: http://localhost:4200/#/dashboard
3. Should redirect to Keycloak login
4. After login, should return to dashboard
```

**Expected Result**: ✅ Redirected to login, then back to dashboard after auth

**If it fails**:
- Check authGuard is applied to routes in app.routes.ts
- Verify auth.guard.ts is correctly implemented
- Check browser console for errors

### 3. User Profile

**Profile Test**:
```
1. Log in to the app
2. Navigate to: http://localhost:4200/#/profile-example
3. Should see user profile with:
   - User ID (Keycloak UUID)
   - Email
   - Username
   - First name, Last name
   - Roles
```

**Expected Result**: ✅ User profile displays with Keycloak UUID (sub)

**If it fails**:
- Open browser console, check for errors
- Verify user is logged in: check authService.isAuthenticatedSync()
- Check Keycloak token includes user claims
- Try refreshing the profile

### 4. Registration

**Registration Test**:
```
1. Navigate to: http://localhost:4200/#/register
2. Click "Create Account with Keycloak"
3. Should redirect to Keycloak registration page
4. Fill out registration form
5. Submit
6. Should redirect to login page
7. Log in with new credentials
```

**Expected Result**: ✅ New user created and can log in

**If it fails**:
- Check "User registration" is enabled in Keycloak Realm Settings → Login
- Verify redirect URI in Keycloak client config
- Check browser console for errors
- Try creating user manually in Keycloak admin console

### 5. Forgot Password

**Password Reset Test**:
```
1. Navigate to: http://localhost:4200/#/forgot-password
2. Click "Reset Password"
3. Should redirect to Keycloak password reset page
4. Enter email
5. Submit
6. Check email for reset link
7. Click link and reset password
8. Log in with new password
```

**Expected Result**: ✅ Password reset email received and password changed

**If it fails**:
- Check "Forgot password" is enabled in Keycloak Realm Settings → Login
- Verify email configuration in Keycloak Realm Settings → Email
- Test email configuration in Keycloak
- For development, you can manually reset password in Keycloak admin console

### 6. Logout

**Logout Test**:
```
1. Log in to the app
2. Click logout button
3. Should be logged out from Keycloak
4. Should redirect to login page
5. Try accessing protected route (e.g., dashboard)
6. Should redirect to Keycloak login again
```

**Expected Result**: ✅ Logged out and cannot access protected routes

**If it fails**:
- Check logout() method in auth.service.ts
- Verify post logout redirect URI in Keycloak client config
- Check browser console for errors
- Clear browser cache/cookies and try again

## Common Issues & Solutions

### Issue: "Client not found" Error

**Symptoms**: Error message saying client 'persfin-frontend' not found

**Solutions**:
1. Verify client ID in `src/environments/keycloak.config.ts` matches Keycloak (case-sensitive)
2. Check you're using the correct realm ('Persfin')
3. Verify client exists in Keycloak admin console
4. Try restarting Keycloak server

### Issue: "Invalid redirect URI" Error

**Symptoms**: Error after clicking login, saying redirect URI is invalid

**Solutions**:
1. Add `http://localhost:4200/*` to Valid Redirect URIs in Keycloak client
2. Add `http://localhost:4200/*` to Valid Post Logout Redirect URIs
3. Add `http://localhost:4200` to Web Origins
4. Make sure there are no extra spaces or trailing slashes
5. Save changes in Keycloak and restart Angular app

### Issue: CORS Errors in Browser Console

**Symptoms**: Console shows "CORS policy" errors when trying to authenticate

**Solutions**:
1. Add `http://localhost:4200` to Web Origins in Keycloak client settings
2. Verify Keycloak is accessible from browser (try opening Keycloak URL)
3. Clear browser cache
4. Try in incognito/private mode
5. Restart Keycloak server

### Issue: Redirect Loop

**Symptoms**: App keeps redirecting between Angular and Keycloak

**Solutions**:
1. Check `onLoad` setting in `app.config.ts` (should be `check-sso`, not `login-required`)
2. Clear browser localStorage and sessionStorage
3. Clear browser cache
4. Try incognito/private mode
5. Verify redirect URIs in Keycloak are correct

### Issue: Token Not Added to HTTP Requests

**Symptoms**: Backend API returns 401 Unauthorized even when logged in

**Solutions**:
1. Verify `authInterceptor` is registered in `app.config.ts`
2. Check `auth.interceptor.ts` is correctly implemented
3. Verify token is available: `authService.getAccessToken()`
4. Check browser Network tab to see if Authorization header is present
5. Verify backend is accepting the token format

### Issue: User Profile Not Loading

**Symptoms**: Profile page shows "Loading..." forever or returns null

**Solutions**:
1. Verify user is logged in: `authService.isAuthenticatedSync()`
2. Check browser console for errors
3. Verify Keycloak token includes user profile claims
4. Check `loadUserProfileAtStartUp: true` in app.config.ts
5. Try manually calling `authService.getUserProfile()`

### Issue: PKCE Errors

**Symptoms**: Error mentioning "code_challenge" or "PKCE"

**Solutions**:
1. Verify PKCE is set to **S256** in Keycloak client Advanced settings
2. Make sure `pkceMethod: 'S256'` is in app.config.ts
3. Restart both Keycloak and Angular app
4. Clear browser cache

### Issue: Registration Not Available

**Symptoms**: Registration button doesn't redirect or shows error

**Solutions**:
1. Enable "User registration" in Keycloak Realm Settings → Login
2. Verify redirect URI in Keycloak client
3. Check browser console for errors
4. Try the Keycloak registration URL directly:
   `http://localhost:8080/realms/Persfin/protocol/openid-connect/registrations?client_id=persfin-frontend&redirect_uri=http://localhost:4200`

### Issue: Password Reset Email Not Sent

**Symptoms**: No email received after password reset request

**Solutions**:
1. Configure SMTP settings in Keycloak Realm Settings → Email
2. Test email configuration in Keycloak admin console
3. Check spam folder
4. For development, use MailHog or similar SMTP testing tool
5. Manually reset password via Keycloak admin console as workaround

## Debugging Tips

### 1. Check Browser Console

Always check browser console (F12) for errors:
- Red errors indicate problems
- Look for Keycloak-related errors
- Check for network errors (CORS, 401, 404, etc.)

### 2. Check Network Tab

In browser DevTools, Network tab:
- Look for requests to Keycloak server
- Check status codes (200 = success, 401 = unauthorized, etc.)
- Verify Authorization header is present in API requests
- Check redirect URLs

### 3. Verify Token

Test if token is available:
```typescript
// In browser console, if app is loaded
// (This won't work directly, but you can add console.log in your code)
const token = authService.getAccessToken();
console.log('Token:', token);
```

### 4. Check Keycloak Logs

If Keycloak is running:
- Check Keycloak server logs for errors
- Look for authentication failures
- Check for token generation errors

### 5. Test Direct Keycloak URLs

Try accessing Keycloak URLs directly:
- Realm: `http://localhost:8080/realms/Persfin`
- Login: `http://localhost:8080/realms/Persfin/protocol/openid-connect/auth?client_id=persfin-frontend&redirect_uri=http://localhost:4200&response_type=code&scope=openid`

## Still Having Issues?

### Reset Everything

If all else fails, try resetting:

1. **Clear Browser Data**:
   - Clear cache
   - Clear localStorage: `localStorage.clear()`
   - Clear sessionStorage: `sessionStorage.clear()`
   - Clear cookies for localhost

2. **Restart Services**:
   ```bash
   # Stop Angular app (Ctrl+C)
   # Restart Keycloak server
   # Start Angular app
   npm start
   ```

3. **Recreate Keycloak Client**:
   - Delete `persfin-frontend` client in Keycloak
   - Create new client following QUICKSTART.md
   - Test again

4. **Fresh npm install**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm start
   ```

## Getting Help

If you're still stuck:

1. Check the documentation:
   - `KEYCLOAK_SETUP.md` - Full setup guide
   - `QUICKSTART.md` - Quick start guide
   - `IMPLEMENTATION_SUMMARY.md` - Implementation details

2. Check Keycloak documentation:
   - [Keycloak Docs](https://www.keycloak.org/documentation)
   - [JavaScript Adapter Guide](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)

3. Check keycloak-angular docs:
   - [GitHub Repository](https://github.com/mauriciovigolo/keycloak-angular)

## Success Indicators

You know everything is working when:

✅ Can log in and see dashboard
✅ Protected routes require authentication
✅ Can see user profile with Keycloak UUID at `/profile-example`
✅ Can register new users
✅ Can reset password
✅ Can log out
✅ Access token is available and valid
✅ No console errors related to authentication

---

**If all checkboxes are checked above, your integration is working correctly! 🎉**
