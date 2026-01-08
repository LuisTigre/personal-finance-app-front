import { Component, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardGroupComponent,
  ColComponent,
  ContainerComponent,
  RowComponent
} from '@coreui/angular';
import { AuthService } from '../../../services/auth.service';

/**
 * Login component for Keycloak authentication
 * This component redirects users to Keycloak login page
 * No form submission - pure redirect flow
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [ContainerComponent, RowComponent, ColComponent, CardGroupComponent, CardComponent, CardBodyComponent, ButtonDirective, NgStyle, IconDirective]
})
export class LoginComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticatedSync()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Redirect to Keycloak login page
   */
  login(): void {
    this.authService.login();
  }

  /**
   * Redirect to Keycloak registration page
   */
  register(): void {
    this.authService.register();
  }

  /**
   * Redirect to Keycloak forgot password flow
   */
  forgotPassword(): void {
    this.authService.forgotPassword();
  }
}
