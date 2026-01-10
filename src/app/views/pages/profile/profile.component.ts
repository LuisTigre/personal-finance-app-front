import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconModule } from '@coreui/icons-angular';
import {
  AlertComponent,
  ButtonDirective,
  FormControlDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  SpinnerComponent
} from '@coreui/angular';
import { AuthService, UserResponse } from '../../../services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconModule,
    AlertComponent,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    ButtonDirective,
    SpinnerComponent,
    FormControlDirective
  ],
  template: `
    <div class="profile-page">
      <div class="layout">
        <aside class="card profile-card" aria-label="Profile menu">
          <div class="profile-head">
            <div class="avatar">
              <span>{{ userInitials }}</span>
            </div>
            <div class="identity">
              <div class="name">{{ fullName }}</div>
              <div class="email">{{ displayEmail }}</div>
            </div>
          </div>

          <nav class="nav-list" aria-label="Profile navigation">
            <button class="nav-item active" type="button">
              <div class="nav-left">
                <svg cIcon name="cilUser"></svg>
                <span>My Profile</span>
              </div>
              <svg cIcon name="cilChevronRight"></svg>
            </button>

            <button class="nav-item danger" type="button" (click)="onLogoutClick($event)">
              <div class="nav-left">
                <svg cIcon name="cilAccountLogout"></svg>
                <span>Log Out</span>
              </div>
            </button>
          </nav>
        </aside>

        <section class="card detail-card" aria-label="Profile details">
          <c-alert *ngIf="alert" [color]="alert.color" [visible]="true" class="alert" (visibleChange)="alert = null">
            {{ alert.message }}
          </c-alert>

          <div class="summary-grid" *ngIf="!isLoading; else loadingState">
            <div class="field">
              <span class="field-label">Current full name</span>
              <div class="value">{{ fullName }}</div>
            </div>

            <div class="field">
              <span class="field-label">Email</span>
              <div class="value">{{ displayEmail }}</div>
            </div>

            <div class="actions">
              <button cButton color="primary" class="primary" type="button" (click)="openEditModal()">
                Edit name
              </button>
            </div>
          </div>

          <ng-template #loadingState>
            <div class="loading">Loading profile...</div>
          </ng-template>
        </section>
      </div>

      <c-modal alignment="center" [visible]="editModalVisible" (visibleChange)="onModalVisibleChange($event)" size="lg">
        <c-modal-header>
          <h5 cModalTitle>Edit name</h5>
          <button type="button" class="btn-close" aria-label="Close" (click)="closeEditModal()"></button>
        </c-modal-header>
        <c-modal-body>
          <form [formGroup]="editForm" class="modal-form" (ngSubmit)="saveName()" novalidate>
            <label class="field">
              <span class="field-label">First name</span>
              <input cFormControl type="text" formControlName="firstName" autocomplete="given-name">
              <small class="hint" *ngIf="firstNameControl.invalid && firstNameControl.touched">{{ firstNameError }}</small>
            </label>

            <label class="field">
              <span class="field-label">Last name</span>
              <input cFormControl type="text" formControlName="lastName" autocomplete="family-name">
              <small class="hint" *ngIf="lastNameControl.invalid && lastNameControl.touched">{{ lastNameError }}</small>
            </label>

            <div class="modal-error" *ngIf="errorMessage">{{ errorMessage }}</div>
          </form>
        </c-modal-body>
        <c-modal-footer>
          <button cButton color="secondary" variant="ghost" type="button" (click)="closeEditModal()" [disabled]="isSaving">Cancel</button>
          <button cButton color="primary" type="button" (click)="saveName()" [disabled]="editForm.invalid || isSaving">
            <c-spinner size="sm" *ngIf="isSaving" class="me-2"></c-spinner>
            {{ isSaving ? 'Saving...' : 'Save changes' }}
          </button>
        </c-modal-footer>
      </c-modal>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
      background: var(--cui-body-bg, #0f172a);
      color: var(--cui-body-color, #0b1b2b);
      transition: background 0.3s ease, color 0.3s ease;
    }

    .profile-page {
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'Space Grotesk', 'Segoe UI', system-ui, -apple-system, sans-serif;
    }

    .layout {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr;
      align-items: start;
    }

    .card {
      background: var(--cui-card-bg, #ffffff);
      color: inherit;
      border-radius: 18px;
      box-shadow: 0 16px 38px rgba(15, 23, 42, 0.14);
      border: 1px solid var(--cui-border-color, rgba(15, 23, 42, 0.08));
      padding: 1rem;
      transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .profile-card {
      padding: 1.1rem;
    }

    .profile-head {
      display: flex;
      gap: 0.9rem;
      align-items: center;
      margin-bottom: 0.85rem;
    }

    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(145deg, #f3f6ff, #dfe7f5);
      display: grid;
      place-items: center;
      font-weight: 700;
      letter-spacing: 0.01em;
      color: #1c2c4a;
      border: 1px solid var(--cui-border-color, #dbe4f0);
    }

    .identity .name {
      font-weight: 700;
      font-size: 1rem;
    }

    .identity .email {
      font-size: 0.9rem;
      color: var(--cui-secondary-color, #5b6575);
    }

    .nav-list {
      display: grid;
      gap: 0.35rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0.75rem 0.65rem;
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      border: 1px solid transparent;
      background: transparent;
      transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
    }

    .nav-item:hover {
      background: color-mix(in srgb, var(--cui-primary, #2f9cf1) 8%, transparent);
      transform: translateY(-1px);
      border-color: var(--cui-border-color, rgba(47, 156, 241, 0.2));
    }

    .nav-item.active {
      background: color-mix(in srgb, var(--cui-primary, #2f9cf1) 14%, var(--cui-card-bg, #0f172a) 86%);
      border-color: color-mix(in srgb, var(--cui-primary, #2f9cf1) 28%, var(--cui-border-color, rgba(47, 156, 241, 0.2)) 72%);
      font-weight: 700;
    }

    .nav-item.danger {
      color: #d7263d;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-weight: 600;
    }

    .detail-card {
      padding: 1.25rem 1.35rem 1.5rem;
    }

    .icon-btn {
      background: #eef2f7;
      border: 1px solid var(--cui-border-color, #dbe4f0);
      border-radius: 12px;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      color: var(--cui-body-color, #0b1b2b);
      transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
    }

    .icon-btn:hover {
      background: color-mix(in srgb, var(--cui-primary, #2f9cf1) 12%, transparent);
      border-color: color-mix(in srgb, var(--cui-primary, #2f9cf1) 35%, #dbe4f0);
      transform: translateY(-1px);
    }

    .icon-btn.ghost {
      background: transparent;
      border-color: transparent;
      color: var(--cui-secondary-color, #5b6575);
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .summary-grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .field {
      background: var(--cui-card-bg, #fff);
      border: 1px solid var(--cui-border-color, #e7edf5);
      border-radius: 12px;
      padding: 0.85rem 0.95rem;
      display: grid;
      gap: 0.35rem;
    }

    .field-label {
      font-size: 0.9rem;
      color: var(--cui-secondary-color, #6b7280);
    }

    .value {
      font-weight: 700;
      color: var(--cui-body-color, #0b1b2b);
      word-break: break-word;
    }

    input[cFormControl] {
      background: var(--cui-body-bg, #f8fafc);
      border: 1px solid var(--cui-border-color, #e2e8f0);
      color: var(--cui-body-color, #0b1b2b);
    }

    .hint {
      font-size: 0.8rem;
      color: var(--cui-tertiary-color, #9aa3b5);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .primary {
      font-weight: 700;
      box-shadow: 0 10px 24px rgba(47, 156, 241, 0.28);
    }

    .loading {
      text-align: center;
      margin-top: 0.5rem;
      color: var(--cui-secondary-color, #6c7685);
      font-size: 0.95rem;
    }

    .modal-form {
      display: grid;
      gap: 0.75rem;
    }

    .modal-error {
      color: var(--cui-danger-color, #e55353);
      font-weight: 600;
      margin-top: 0.25rem;
    }

    .alert {
      margin-bottom: 0.75rem;
    }

    @media (min-width: 992px) {
      .layout {
        grid-template-columns: 320px 1fr;
      }
    }

    @media (max-width: 991px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .profile-card {
        order: -1;
      }
    }

    @media (max-width: 520px) {
      :host {
        padding: 0.75rem;
      }

      .card {
        padding: 0.9rem;
      }

      .nav-item {
        padding: 0.65rem 0.55rem;
      }
    }
  `]
})
export class ProfilePageComponent implements OnInit {
  userProfile: UserResponse | null = null;
  isLoading = true;
  isSaving = false;
  editModalVisible = false;
  alert: { color: 'success' | 'danger'; message: string } | null = null;
  errorMessage = '';
  readonly editForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]]
  });

  constructor(private authService: AuthService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.authService.getUserProfile().subscribe({
      next: (profile: UserResponse | null) => {
        this.userProfile = this.normalizeProfile(profile);
        this.syncFormFromProfile();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  syncFormFromProfile(): void {
    this.editForm.patchValue({
      firstName: this.firstName,
      lastName: this.lastName
    });
  }

  openEditModal(): void {
    this.clearAlerts();
    this.syncFormFromProfile();
    this.editForm.markAsPristine();
    this.editForm.markAsUntouched();
    this.editModalVisible = true;
  }

  closeEditModal(): void {
    if (this.isSaving) {
      return;
    }
    this.editModalVisible = false;
    this.errorMessage = '';
  }

  onModalVisibleChange(visible: boolean): void {
    this.editModalVisible = visible;
    if (!visible) {
      this.errorMessage = '';
    }
  }

  saveName(): void {
    if (this.editForm.invalid || this.isSaving) {
      this.editForm.markAllAsTouched();
      return;
    }

    const payload = {
      firstName: (this.editForm.get('firstName')?.value || '').trim(),
      lastName: (this.editForm.get('lastName')?.value || '').trim()
    };

    if (!this.userProfile?.id) {
      this.errorMessage = 'User ID is missing';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.editForm.disable();

    this.authService.updateProfileName(this.userProfile.id, payload).subscribe({
      next: (updated) => {
        this.applyNameUpdate(updated, payload);
        this.isSaving = false;
        this.editForm.enable();
        this.editModalVisible = false;
        this.alert = { color: 'success', message: 'Name updated successfully.' };
      },
      error: (err) => {
        this.isSaving = false;
        this.editForm.enable();
        this.errorMessage = err?.error?.message || 'Could not update name. Please try again.';
      }
    });
  }

  applyNameUpdate(updated: Partial<UserResponse>, fallbackPayload: { firstName: string; lastName: string }): void {
    const current = this.userProfile || ({} as UserResponse);
    const merged: UserResponse = {
      id: updated.id ?? current.id ?? '',
      firstName: (updated.firstName ?? current.firstName ?? fallbackPayload.firstName).trim(),
      lastName: (updated.lastName ?? current.lastName ?? fallbackPayload.lastName).trim(),
      email: updated.email ?? current.email ?? '',
      photoUrl: updated.photoUrl ?? current.photoUrl ?? '',
      role: updated.role ?? current.role ?? '',
      active: updated.active ?? current.active ?? true,
      preferredUsername: updated.preferredUsername ?? current.preferredUsername ?? ''
    };
    this.userProfile = this.normalizeProfile(merged);
    this.syncFormFromProfile();
  }

  normalizeProfile(profile: UserResponse | null): UserResponse | null {
    if (!profile) {
      return null;
    }

    const first = (profile.firstName ?? '').trim();
    const last = (profile.lastName ?? '').trim();
    const email = (profile.email ?? '').trim();
    const preferred = (profile.preferredUsername ?? (email ? email.split('@')[0] : '')).trim();

    return {
      ...profile,
      firstName: first,
      lastName: last,
      preferredUsername: preferred,
      email
    } as UserResponse;
  }

  clearAlerts(): void {
    this.alert = null;
  }

  logout(): void {
    this.authService.logout();
  }

  onLogoutClick(event: Event): void {
    event.preventDefault();
    this.logout();
  }

  get firstName(): string {
    return (this.userProfile?.firstName ?? '').trim();
  }

  get lastName(): string {
    return (this.userProfile?.lastName ?? '').trim();
  }

  get preferredUsername(): string {
    const username = this.userProfile?.preferredUsername ?? '';
    if (username) {
      return username;
    }
    const email = this.userProfile?.email ?? '';
    return email ? email.split('@')[0] : '';
  }

  get fullName(): string {
    const combined = `${this.firstName} ${this.lastName}`.trim();
    return combined || this.preferredUsername || 'User';
  }

  get displayEmail(): string {
    return this.userProfile?.email || 'Email unavailable';
  }

  get userInitials(): string {
    const fn = this.firstName;
    const ln = this.lastName;
    const fallback = this.preferredUsername || this.displayEmail;
    if (fn && ln) {
      return `${fn[0]}${ln[0]}`.toUpperCase();
    }
    const single = fn || ln;
    if (single) {
      return single.substring(0, 2).toUpperCase();
    }
    return (fallback || 'US').substring(0, 2).toUpperCase();
  }

  get firstNameControl() {
    return this.editForm.get('firstName')!;
  }

  get lastNameControl() {
    return this.editForm.get('lastName')!;
  }

  get firstNameError(): string {
    if (this.firstNameControl.hasError('required')) return 'First name is required.';
    if (this.firstNameControl.hasError('minlength')) return 'Minimum of 2 characters.';
    if (this.firstNameControl.hasError('maxlength')) return 'Maximum of 60 characters.';
    return '';
  }

  get lastNameError(): string {
    if (this.lastNameControl.hasError('required')) return 'Last name is required.';
    if (this.lastNameControl.hasError('minlength')) return 'Minimum of 2 characters.';
    if (this.lastNameControl.hasError('maxlength')) return 'Maximum of 60 characters.';
    return '';
  }
}
