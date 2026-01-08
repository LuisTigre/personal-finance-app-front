import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, timer } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

/**
 * LockService manages the application lock state (local screen lock)
 * Provides Windows-like lock screen functionality with Keycloak re-authentication
 */
@Injectable({
  providedIn: 'root'
})
export class LockService {
  private readonly LOCK_STATE_KEY = 'app_locked';
  private readonly IDLE_TIME_KEY = 'idle_lock_minutes';
  
  private lockedSubject = new BehaviorSubject<boolean>(false);
  public isLocked$: Observable<boolean> = this.lockedSubject.asObservable();

  private idleTimeout: any;
  private idleTimeMinutes = 0; // 0 = disabled

  constructor(private keycloakService: KeycloakService) {
    this.initializeLockState();
    this.initializeIdleDetection();
  }

  /**
   * Initialize lock state from sessionStorage on app start
   */
  private initializeLockState(): void {
    const savedLockState = sessionStorage.getItem(this.LOCK_STATE_KEY);
    if (savedLockState === 'true') {
      this.lockedSubject.next(true);
    }

    const savedIdleTime = sessionStorage.getItem(this.IDLE_TIME_KEY);
    if (savedIdleTime) {
      this.idleTimeMinutes = parseInt(savedIdleTime, 10);
    }
  }

  /**
   * Initialize idle detection to auto-lock after inactivity
   */
  private initializeIdleDetection(): void {
    // Listen to user activity events
    const events$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'scroll')
    );

    events$.pipe(debounceTime(1000)).subscribe(() => {
      this.resetIdleTimer();
    });
  }

  /**
   * Lock the application immediately
   * Shows overlay and blurs UI without logging out
   */
  lock(): void {
    sessionStorage.setItem(this.LOCK_STATE_KEY, 'true');
    this.lockedSubject.next(true);
    console.log('🔒 Application locked');
  }

  /**
   * Unlock by triggering Keycloak re-authentication
   * Forces user to re-enter credentials (prompt=login, maxAge=0)
   */
  async unlock(): Promise<void> {
    try {
      // Get current location to return to after re-auth (without query params)
      const currentUrl = window.location.origin + window.location.pathname;
      
      // Trigger Keycloak login with forced re-authentication
      await this.keycloakService.login({
        prompt: 'login',      // Force login screen
        maxAge: 0,           // Don't accept SSO, require fresh auth
        redirectUri: currentUrl
      });

      // After successful redirect back, unlockLocalOnly will be called
    } catch (error) {
      console.error('❌ Unlock failed:', error);
      throw error;
    }
  }

  /**
   * Remove lock state without triggering re-auth
   * Called after successful Keycloak re-authentication
   */
  unlockLocalOnly(): void {
    sessionStorage.removeItem(this.LOCK_STATE_KEY);
    this.lockedSubject.next(false);
    this.resetIdleTimer();
    console.log('🔓 Application unlocked');
  }

  /**
   * Check if application is currently locked
   */
  isLocked(): boolean {
    return this.lockedSubject.value;
  }

  /**
   * Set auto-lock after N minutes of inactivity
   * Set to 0 to disable
   */
  setAutoLock(minutes: number): void {
    this.idleTimeMinutes = minutes;
    
    if (minutes > 0) {
      sessionStorage.setItem(this.IDLE_TIME_KEY, minutes.toString());
      this.resetIdleTimer();
      console.log(`⏰ Auto-lock enabled: ${minutes} minutes`);
    } else {
      sessionStorage.removeItem(this.IDLE_TIME_KEY);
      this.disableIdleTimer();
      console.log('⏰ Auto-lock disabled');
    }
  }

  /**
   * Reset the idle timer (called on user activity)
   */
  private resetIdleTimer(): void {
    // Clear existing timer
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    // Don't set timer if disabled or already locked
    if (this.idleTimeMinutes === 0 || this.isLocked()) {
      return;
    }

    // Set new timer
    this.idleTimeout = setTimeout(() => {
      console.log('⏰ Idle timeout reached, locking application');
      this.lock();
    }, this.idleTimeMinutes * 60 * 1000);
  }

  /**
   * Disable idle auto-lock
   */
  disableIdleTimer(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  /**
   * Get current auto-lock time in minutes
   */
  getAutoLockTime(): number {
    return this.idleTimeMinutes;
  }
}
