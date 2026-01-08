import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import { ButtonDirective } from '@coreui/angular';
import { LockService } from '../../services/lock.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, interval } from 'rxjs';

/**
 * LockScreenComponent displays a Windows-like lock screen overlay
 * Blocks UI interaction and requires Keycloak re-authentication to unlock
 */
@Component({
  selector: 'app-lock-screen',
  standalone: true,
  imports: [CommonModule, IconDirective, ButtonDirective],
  template: `
    <div class="lock-screen-overlay">
      <div class="lock-screen-content">
        <!-- Clock Display -->
        <div class="lock-time">
          {{ currentTime }}
        </div>
        <div class="lock-date">
          {{ currentDate }}
        </div>

        <!-- User Info -->
        <div class="lock-user-info">
          <div class="lock-avatar">
            <svg cIcon name="cilUser" class="lock-user-icon"></svg>
          </div>
          <div class="lock-username">{{ userName }}</div>
          <div class="lock-email" *ngIf="userEmail">{{ userEmail }}</div>
        </div>

        <!-- Locked Message -->
        <div class="lock-message">
          <svg cIcon name="cilLockLocked" class="lock-icon"></svg>
          <h2>Screen Locked</h2>
          <p>Click below to unlock and continue</p>
        </div>

        <!-- Unlock Button -->
        <button 
          cButton 
          color="primary" 
          size="lg"
          class="lock-unlock-button"
          (click)="onUnlock()"
          [disabled]="unlocking">
          <span class="button-content">
            <svg cIcon name="cilLockUnlocked" class="me-2"></svg>
            {{ unlocking ? 'Unlocking...' : 'Unlock' }}
          </span>
        </button>

        <!-- Hint -->
        <div class="lock-hint">
          You will be asked to re-enter your password
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lock-screen-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
      backdrop-filter: blur(20px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .lock-screen-content {
      text-align: center;
      color: #ffffff;
      max-width: 500px;
      padding: 2rem;
    }

    .lock-time {
      font-size: 4rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .lock-date {
      font-size: 1.5rem;
      font-weight: 300;
      margin-bottom: 3rem;
      opacity: 0.9;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }

    .lock-user-info {
      margin-bottom: 3rem;
    }

    .lock-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: 3px solid rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .lock-user-icon {
      width: 60px;
      height: 60px;
      color: #ffffff;
    }

    .lock-username {
      font-size: 1.8rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .lock-email {
      font-size: 1rem;
      opacity: 0.8;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .lock-message {
      margin-bottom: 2rem;
    }

    .lock-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
      opacity: 0.9;
    }

    .lock-message h2 {
      font-size: 2rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .lock-message p {
      font-size: 1rem;
      opacity: 0.8;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .lock-unlock-button {
      padding: 0.875rem 2.5rem;
      font-size: 1.125rem;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      color: #321fdb;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: auto;
      margin: 0 auto;
    }

    .button-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .lock-unlock-button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }

    .lock-unlock-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .lock-hint {
      margin-top: 2rem;
      font-size: 0.875rem;
      opacity: 0.7;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    /* Responsive adjustments */
    @media (max-width: 576px) {
      .lock-time {
        font-size: 3rem;
      }

      .lock-date {
        font-size: 1.2rem;
      }

      .lock-avatar {
        width: 100px;
        height: 100px;
      }

      .lock-user-icon {
        width: 50px;
        height: 50px;
      }

      .lock-username {
        font-size: 1.5rem;
      }

      .lock-message h2 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class LockScreenComponent implements OnInit, OnDestroy {
  currentTime = '';
  currentDate = '';
  userName = 'User';
  userEmail = '';
  unlocking = false;

  private timeSubscription?: Subscription;

  constructor(
    private lockService: LockService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateDateTime();
    this.loadUserInfo();
    
    // Update time every second
    this.timeSubscription = interval(1000).subscribe(() => {
      this.updateDateTime();
    });
  }

  ngOnDestroy(): void {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }

  /**
   * Update current time and date display
   */
  private updateDateTime(): void {
    const now = new Date();
    
    // Format time (HH:MM)
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Format date (Day, Month Date)
    this.currentDate = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Load user information from Keycloak token
   */
  private loadUserInfo(): void {
    this.authService.getUserProfile().subscribe(profile => {
      if (profile) {
        this.userName = profile.firstName && profile.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : profile.username || 'User';
        
        this.userEmail = profile.email || '';
      }
    });
  }

  /**
   * Handle unlock button click
   * Triggers Keycloak re-authentication
   */
  async onUnlock(): Promise<void> {
    if (this.unlocking) {
      return;
    }

    try {
      this.unlocking = true;
      await this.lockService.unlock();
      // After redirect, the app will reload and unlock automatically
    } catch (error) {
      console.error('Unlock failed:', error);
      this.unlocking = false;
    }
  }
}
