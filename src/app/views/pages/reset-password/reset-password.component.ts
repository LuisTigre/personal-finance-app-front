import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  ColComponent,
  ContainerComponent,
  RowComponent,
  AlertComponent
} from '@coreui/angular';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

/**
 * Reset Password component for Keycloak authentication
 * In Keycloak flow, password reset is handled entirely by Keycloak UI
 * This component redirects users to login after they've reset via Keycloak
 */
@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  standalone: true,
  imports: [
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardBodyComponent,
    ButtonDirective,
    IconDirective,
    AlertComponent,
    NgIf
  ]
})
export class ResetPasswordComponent implements OnInit {
  message: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if user came from Keycloak reset flow
    this.route.queryParams.subscribe(params => {
      if (params['session_state'] || params['code']) {
        this.message = 'Password reset successful! You can now log in with your new password.';
      } else {
        this.message = 'To reset your password, please use the "Forgot Password" option on the login page.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
