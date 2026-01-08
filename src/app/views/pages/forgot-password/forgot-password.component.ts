import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  ColComponent,
  ContainerComponent,
  RowComponent
} from '@coreui/angular';
import { AuthService } from '../../../services/auth.service';

/**
 * Forgot Password component for Keycloak authentication
 * Redirects users to Keycloak reset credentials flow
 * Users will receive password reset email from Keycloak
 */
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  standalone: true,
  imports: [
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardBodyComponent,
    ButtonDirective,
    IconDirective
  ]
})
export class ForgotPasswordComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticatedSync()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Redirect to Keycloak reset credentials flow
   * User will receive email with reset link from Keycloak
   */
  resetPassword(): void {
    this.authService.forgotPassword();
  }

  /**
   * Navigate back to login page
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
