# 🔒 Windows-Like Lock Screen Feature

## Overview

This feature implements a **Windows-like lock screen** for the Angular SPA that:
- Locks the UI with a blur overlay (without logging out)
- Requires Keycloak re-authentication to unlock
- Persists lock state across page refresh
- Optional idle auto-lock after N minutes of inactivity

## ✅ Implementation Complete

### Files Created/Modified

#### New Files:
1. **[src/app/services/lock.service.ts](src/app/services/lock.service.ts)**
   - Manages lock state (singleton service)
   - Persists state in `sessionStorage`
   - Handles Keycloak re-authentication for unlock
   - Optional idle detection with configurable timeout

2. **[src/app/components/lock-screen/lock-screen.component.ts](src/app/components/lock-screen/lock-screen.component.ts)**
   - Full-screen overlay with purple gradient background
   - Displays current time, date, user info
   - "Unlock" button triggers Keycloak re-auth
   - Animated, responsive design

#### Modified Files:
3. **[src/app/layout/default-layout/default-layout.component.ts](src/app/layout/default-layout/default-layout.component.ts)**
   - Subscribes to `LockService.isLocked$`
   - Applies blur effect to main app container when locked
   - Shows lock screen overlay

4. **[src/app/layout/default-layout/default-layout.component.html](src/app/layout/default-layout/default-layout.component.html)**
   - Wraps app in container with conditional blur
   - Adds lock screen component overlay

5. **[src/app/layout/default-layout/default-layout.component.scss](src/app/layout/default-layout/default-layout.component.scss)**
   - CSS blur effect (8px) for locked state
   - Disables pointer events and user selection

6. **[src/app/layout/default-layout/default-header/default-header.component.ts](src/app/layout/default-layout/default-header/default-header.component.ts)**
   - "Lock Account" menu item now calls `lockService.lock()`
   - **Does NOT log out** - just shows overlay

7. **[src/app/app.config.ts](src/app/app.config.ts)**
   - Added `LockService` to Keycloak initialization
   - After successful re-auth, automatically unlocks if locked

---

## 🎯 How It Works

### Lock Flow:
1. User clicks **"Lock Account"** in header dropdown
2. `LockService.lock()` is called:
   - Sets `sessionStorage.setItem('app_locked', 'true')`
   - Emits `isLocked$ = true`
3. `DefaultLayoutComponent` receives lock state:
   - Applies `.app-locked` class (blur + pointer-events: none)
   - Shows `<app-lock-screen>` overlay
4. App UI is **immediately blurred and blocked**
5. User **cannot interact** with underlying app

### Unlock Flow:
1. User clicks **"Unlock"** on lock screen
2. `LockService.unlock()` triggers Keycloak re-authentication:
   ```typescript
   keycloak.login({
     prompt: 'login',      // Force login screen
     maxAge: 0,           // Don't use cached auth
     redirectUri: currentUrl
   })
   ```
3. Keycloak redirects to login page
4. User enters credentials (typically only password if username remembered)
5. Keycloak redirects back to app
6. App initializes, detects `authenticated && isLocked()`
7. Calls `lockService.unlockLocalOnly()`:
   - Removes `sessionStorage` lock flag
   - Emits `isLocked$ = false`
8. Lock screen disappears, blur removed, **app unlocked**

### Refresh Persistence:
- If locked and user refreshes page:
  - Lock overlay appears immediately (from `sessionStorage`)
  - User must unlock to proceed
  - After re-auth, lock is removed

---

## 🧪 Test Cases

### Test 1: Basic Lock/Unlock
1. **Start**: Logged in, viewing dashboard
2. **Action**: Click "Lock Account" in header dropdown
3. **Expected**: 
   - App immediately blurs
   - Lock screen overlay appears with time, user info
   - Cannot click/interact with app behind overlay
4. **Action**: Click "Unlock" button
5. **Expected**: 
   - Redirects to Keycloak login
   - Enter password (username may be pre-filled)
   - Returns to app
   - Lock screen disappears, app functional

✅ **Result**: Lock/unlock works correctly

### Test 2: Refresh While Locked
1. **Start**: App is locked (overlay visible)
2. **Action**: Refresh page (F5 or Ctrl+R)
3. **Expected**: 
   - Page reloads
   - Lock screen overlay appears immediately
   - App remains blurred
4. **Action**: Click "Unlock"
5. **Expected**: 
   - Keycloak re-auth flow
   - After login, app unlocks

✅ **Result**: Lock state persists across refresh

### Test 3: No Logout
1. **Start**: Logged in
2. **Action**: Lock account
3. **Expected**: 
   - Lock screen appears
   - **NO Keycloak logout**
   - **NO token cleared**
   - Session remains active
4. **Verify**: Check browser storage - Keycloak tokens still present

✅ **Result**: Lock does NOT log out user

### Test 4: Compare Lock vs Logout
1. **Lock Account**: 
   - Shows overlay
   - Requires re-auth to unlock
   - Session active in background
2. **Logout**: 
   - Clears tokens
   - Redirects to Keycloak login
   - Session terminated

✅ **Result**: Lock and Logout are distinct operations

---

## 🔧 Configuration

### Enable Idle Auto-Lock

To automatically lock after 5 minutes of inactivity:

**Option 1: In Component (e.g., `app.component.ts` or `default-layout.component.ts`)**
```typescript
import { LockService } from './services/lock.service';

constructor(private lockService: LockService) {
  // Auto-lock after 5 minutes of idle
  this.lockService.setAutoLock(5);
}
```

**Option 2: In Service Constructor**
Edit [src/app/services/lock.service.ts](src/app/services/lock.service.ts):
```typescript
constructor(private keycloakService: KeycloakService) {
  this.initializeLockState();
  this.initializeIdleDetection();
  
  // Auto-enable idle lock (5 minutes)
  this.setAutoLock(5);
}
```

### Disable Idle Auto-Lock
```typescript
this.lockService.setAutoLock(0); // Disable
```

### Get Current Settings
```typescript
const minutes = this.lockService.getAutoLockTime();
console.log(`Auto-lock: ${minutes} minutes`);
```

---

## 🎨 Customization

### Change Lock Screen Colors

Edit [src/app/components/lock-screen/lock-screen.component.ts](src/app/components/lock-screen/lock-screen.component.ts) styles:

```css
.lock-screen-overlay {
  /* Change gradient background */
  background: linear-gradient(135deg, 
    rgba(50, 31, 219, 0.95) 0%, 
    rgba(40, 25, 176, 0.95) 100%);
}

.lock-unlock-button {
  /* Change button color */
  background: rgba(255, 255, 255, 0.9);
  color: #321fdb;
}
```

### Adjust Blur Intensity

Edit [src/app/layout/default-layout/default-layout.component.scss](src/app/layout/default-layout/default-layout.component.scss):

```scss
.app-locked {
  filter: blur(12px); // Increase blur (default: 8px)
}
```

### Change Clock Format

Edit [src/app/components/lock-screen/lock-screen.component.ts](src/app/components/lock-screen/lock-screen.component.ts):

```typescript
// 12-hour format with AM/PM
this.currentTime = now.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true // Change to true for AM/PM
});
```

### Add Company Logo

Edit lock screen template in [src/app/components/lock-screen/lock-screen.component.ts](src/app/components/lock-screen/lock-screen.component.ts):

```html
<div class="lock-user-info">
  <!-- Add logo above avatar -->
  <img src="assets/brand/logo.svg" alt="Company Logo" style="max-width: 150px; margin-bottom: 2rem;">
  
  <div class="lock-avatar">
    <svg cIcon name="cilUser" class="lock-user-icon"></svg>
  </div>
  ...
</div>
```

---

## 🔐 Security Notes

### What This Lock Feature Does:
- ✅ Hides UI content with blur overlay
- ✅ Blocks user interaction with app
- ✅ Requires Keycloak re-authentication (password)
- ✅ Persists across page refresh

### What It Does NOT Do:
- ❌ Does NOT prevent browser DevTools access
- ❌ Does NOT clear tokens from memory
- ❌ Does NOT terminate backend sessions
- ❌ Does NOT prevent screenshot/screen recording

### Best Practices:
1. **Use for privacy**: Temporarily hide sensitive data when stepping away
2. **Not a security boundary**: Don't rely on this for security-critical scenarios
3. **Combine with session timeout**: Configure Keycloak session limits
4. **Full logout for shared devices**: Use "Logout" for complete termination

---

## 🐛 Troubleshooting

### Lock screen doesn't appear
- Check browser console for errors
- Verify `LockService` is injected correctly
- Ensure `LockScreenComponent` is imported in `DefaultLayoutComponent`

### Unlock redirects but doesn't remove overlay
- Check if `lockService.unlockLocalOnly()` is called in `app.config.ts`
- Verify `authenticated` is `true` after redirect
- Check sessionStorage: `sessionStorage.getItem('app_locked')`

### Blur effect not working
- Verify CSS class `.app-locked` is applied
- Check browser support for CSS `filter: blur()`
- Inspect element: ensure wrapper has correct class

### Auto-lock not triggering
- Verify `setAutoLock(minutes)` was called with value > 0
- Check browser console for event listener errors
- Test in normal browsing mode (not private/incognito)

### Keycloak re-auth fails
- Verify `prompt: 'login'` and `maxAge: 0` in unlock code
- Check Keycloak client settings: Standard Flow must be enabled
- Ensure valid redirect URI in Keycloak client config

---

## 📝 Code Location Summary

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **LockService** | `src/app/services/lock.service.ts` | Lock state management |
| **LockScreenComponent** | `src/app/components/lock-screen/lock-screen.component.ts` | Lock overlay UI |
| **Layout Integration** | `src/app/layout/default-layout/default-layout.component.*` | Blur effect & overlay display |
| **Header Lock Button** | `src/app/layout/default-layout/default-header/default-header.component.ts` | "Lock Account" action |
| **App Initialization** | `src/app/app.config.ts` | Auto-unlock after re-auth |

---

## 🚀 Usage Examples

### Programmatic Lock/Unlock

```typescript
import { LockService } from './services/lock.service';

export class MyComponent {
  constructor(private lockService: LockService) {}

  lockNow() {
    this.lockService.lock();
  }

  async unlockNow() {
    await this.lockService.unlock();
  }

  checkLockState() {
    if (this.lockService.isLocked()) {
      console.log('App is locked');
    }
  }

  subscribeToLockState() {
    this.lockService.isLocked$.subscribe(locked => {
      console.log('Lock state changed:', locked);
    });
  }
}
```

### Enable Auto-Lock on Login

```typescript
// In default-layout.component.ts
ngOnInit(): void {
  // Subscribe to lock state
  this.lockSubscription = this.lockService.isLocked$.subscribe(locked => {
    this.locked = locked;
  });

  // Enable 10-minute idle auto-lock
  this.lockService.setAutoLock(10);
}
```

---

## ✨ Features Summary

- ✅ Windows-like lock screen UI
- ✅ Blur effect on locked app
- ✅ Keycloak re-authentication (secure)
- ✅ Session persistence across refresh
- ✅ Real-time clock display
- ✅ User profile info display
- ✅ Optional idle auto-lock
- ✅ Configurable idle timeout
- ✅ No password handling in Angular
- ✅ Responsive mobile design
- ✅ Smooth animations

**Total Implementation**: 7 files created/modified, ~500 lines of code

🎉 **Lock Screen Feature Complete!**
