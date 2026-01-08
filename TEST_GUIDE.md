# 🚀 Quick Test Guide - Keycloak Authentication

## Start Testing in 3 Steps

### 1. Start the App
```bash
npm start
```
App opens at: `http://localhost:4200`

### 2. Verify No Infinite Loading
- ✅ App should load normally (no endless "Loading..." screen)
- ✅ You should see the login page

### 3. Test Login
1. Click **"Login with Keycloak"** button
2. Enter credentials in Keycloak login page
3. Should redirect back to app dashboard
4. Navigate to `http://localhost:4200/#/profile-example` to see your user UUID

---

## Key URLs

| Purpose | URL |
|---------|-----|
| App | `http://localhost:4200` |
| Login Page | `http://localhost:4200/#/login` |
| Profile Example | `http://localhost:4200/#/profile-example` |
| Keycloak | `http://localhost:8080` |
| Keycloak Admin | `http://localhost:8080/admin` |
| Silent SSO Check | `http://localhost:4200/assets/silent-check-sso.html` |

---

## Authentication Buttons

### Login Page Features:
- **"Login with Keycloak"** → Redirects to Keycloak login
- **"Register Now!"** → Redirects to Keycloak registration
- **"Forgot password?"** → Redirects to Keycloak password reset

### After Login:
- Navigate to any protected route (e.g., `/dashboard`)
- View profile at `/profile-example`
- Click logout button to sign out

---

## Configuration Files

**Keycloak Settings**: `src/environments/keycloak.config.ts`
```typescript
{
  url: 'http://localhost:8080',
  realm: 'Persfin',
  clientId: 'persfin-frontend'
}
```

**Init Options**: `src/app/app.config.ts` → `initializeKeycloak()`
```typescript
{
  flow: 'standard',
  pkceMethod: 'S256',
  onLoad: 'check-sso',
  checkLoginIframe: false,  // ← Key fix for infinite loading
  loadUserProfileAtStartUp: false  // ← Prevents blocking
}
```

---

## Getting User Data

```typescript
// In any component
this.authService.getUserProfile().subscribe(profile => {
  console.log('User UUID:', profile.sub);  // ← Keycloak user reference
  console.log('Email:', profile.email);
  console.log('Username:', profile.username);
});
```

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Still showing "Loading..." | Clear cache (`Ctrl+Shift+R`) or use incognito mode |
| Can't access silent-check-sso.html | Restart dev server (`npm start`) |
| "Client not found" | Check client ID matches Keycloak exactly |
| "Invalid redirect URI" | Check Keycloak client redirect URIs include `http://localhost:4200/*` |
| CORS errors | Add `http://localhost:4200` to Web Origins in Keycloak |

---

## Success Checklist

- [ ] App loads without infinite loading screen
- [ ] Can see login page
- [ ] Can click "Login with Keycloak" and redirect
- [ ] Can log in successfully
- [ ] Can see dashboard after login
- [ ] Can view profile at `/profile-example` with user UUID
- [ ] SSO works (login persists across tabs)
- [ ] Logout works correctly

---

**Status**: 🟢 Ready to Test
**Documentation**: See `LOADING_FIX.md` for detailed guide
