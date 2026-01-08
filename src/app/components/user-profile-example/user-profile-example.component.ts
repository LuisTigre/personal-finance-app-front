import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserProfile } from '../../services/auth.service';
import {
  CardComponent,
  CardBodyComponent,
  CardHeaderComponent,
  ButtonDirective,
  RowComponent,
  ColComponent
} from '@coreui/angular';

/**
 * Example component showing how to use AuthService to display user profile
 * This demonstrates accessing the Keycloak user reference (sub) and other profile data
 */
@Component({
  selector: 'app-user-profile-example',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    ButtonDirective,
    RowComponent,
    ColComponent
  ],
  template: `
    <c-row>
      <c-col xs="12" md="6">
        <c-card class="mb-4">
          <c-card-header>
            <strong>User Profile</strong> <small>(from Keycloak)</small>
          </c-card-header>
          <c-card-body>
            <div *ngIf="userProfile; else loading">
              <div class="mb-3">
                <strong>User ID (Keycloak UUID):</strong>
                <p class="text-body-secondary">{{ userProfile.sub }}</p>
                <small class="text-muted">
                  This is your user reference - use this ID for backend operations
                </small>
              </div>
              
              <div class="mb-3">
                <strong>Username:</strong>
                <p class="text-body-secondary">{{ userProfile.username || 'Not available' }}</p>
              </div>
              
              <div class="mb-3">
                <strong>Email:</strong>
                <p class="text-body-secondary">{{ userProfile.email || 'Not available' }}</p>
              </div>
              
              <div class="mb-3">
                <strong>First Name:</strong>
                <p class="text-body-secondary">{{ userProfile.firstName || 'Not available' }}</p>
              </div>
              
              <div class="mb-3">
                <strong>Last Name:</strong>
                <p class="text-body-secondary">{{ userProfile.lastName || 'Not available' }}</p>
              </div>
              
              <div class="mb-3">
                <strong>Roles:</strong>
                <p class="text-body-secondary">{{ userRoles.join(', ') || 'No roles assigned' }}</p>
              </div>
              
              <hr>
              
              <div class="d-grid gap-2">
                <button cButton color="primary" (click)="refreshProfile()">
                  Refresh Profile
                </button>
                <button cButton color="secondary" (click)="showToken()">
                  Show Access Token
                </button>
                <button cButton color="danger" (click)="logout()">
                  Logout
                </button>
              </div>
              
              <div *ngIf="accessToken" class="mt-3 p-3 bg-light">
                <strong>Access Token (first 100 chars):</strong>
                <pre class="text-wrap">{{ accessToken.substring(0, 100) }}...</pre>
              </div>
            </div>
            
            <ng-template #loading>
              <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading user profile...</p>
              </div>
            </ng-template>
          </c-card-body>
        </c-card>
      </c-col>
      
      <c-col xs="12" md="6">
        <c-card class="mb-4">
          <c-card-header>
            <strong>How to Use</strong> <small>AuthService API</small>
          </c-card-header>
          <c-card-body>
            <h6>Getting User Profile:</h6>
            <pre class="bg-light p-3">
this.authService.getUserProfile()
  .subscribe(profile => &#123;
    console.log('User UUID:', profile.sub);
    console.log('Email:', profile.email);
  &#125;);
            </pre>
            
            <h6 class="mt-3">Getting Access Token:</h6>
            <pre class="bg-light p-3">
const token = this.authService.getAccessToken();
// Use this token for backend API calls
            </pre>
            
            <h6 class="mt-3">Checking Authentication:</h6>
            <pre class="bg-light p-3">
if (this.authService.isAuthenticatedSync()) &#123;
  // User is logged in
&#125;
            </pre>
            
            <h6 class="mt-3">Checking Roles:</h6>
            <pre class="bg-light p-3">
if (this.authService.hasRole('admin')) &#123;
  // User has admin role
&#125;
            </pre>
          </c-card-body>
        </c-card>
      </c-col>
    </c-row>
  `,
  styles: [`
    pre {
      font-size: 0.875rem;
      margin-bottom: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  `]
})
export class UserProfileExampleComponent implements OnInit {
  userProfile: UserProfile | null = null;
  userRoles: string[] = [];
  accessToken: string | undefined;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadUserRoles();
  }

  /**
   * Load user profile from Keycloak
   * The 'sub' field contains the Keycloak user UUID - this is your user reference
   */
  loadUserProfile(): void {
    this.authService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        console.log('User profile loaded:', profile);
        console.log('User UUID (sub):', profile?.sub);
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
      }
    });
  }

  /**
   * Load user roles from Keycloak token
   */
  loadUserRoles(): void {
    this.userRoles = this.authService.getUserRoles();
  }

  /**
   * Refresh user profile data
   */
  refreshProfile(): void {
    console.log('Refreshing profile...');
    this.loadUserProfile();
    this.loadUserRoles();
  }

  /**
   * Show access token (for demonstration)
   * In production, be careful about exposing tokens
   */
  showToken(): void {
    this.accessToken = this.authService.getAccessToken();
    console.log('Access token:', this.accessToken);
  }

  /**
   * Logout from Keycloak
   */
  logout(): void {
    this.authService.logout();
  }
}
