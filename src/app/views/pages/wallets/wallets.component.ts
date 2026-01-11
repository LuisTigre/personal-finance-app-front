import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonDirective,
  ButtonCloseDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  FormControlDirective,
  FormFeedbackComponent,
  FormLabelDirective,
  RowComponent,
  SpinnerComponent,
  TableDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { finalize } from 'rxjs/operators';

import { CreateWalletDialogComponent } from '../../../components/create-wallet-dialog/create-wallet-dialog.component';
import { AppToastService } from '../../../services/app-toast.service';
import { AddWalletMemberRequest, WalletResponse, WalletService } from '../../../services/wallet.service';
import { AuthService, UserResponse } from '../../../services/auth.service';

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  styleUrls: ['./wallets.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ButtonDirective,
    ButtonCloseDirective,
    IconDirective,
    TableDirective,
    SpinnerComponent,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    FormLabelDirective,
    FormControlDirective,
    FormFeedbackComponent,
    CreateWalletDialogComponent,
  ]
})
export class WalletsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly walletService = inject(WalletService);
  private readonly toast = inject(AppToastService);
  private readonly auth = inject(AuthService);

  readonly wallets = this.walletService.wallets;
  readonly showArchived = signal(false);

  readonly filteredWallets = computed(() => {
    const all = this.wallets();
    const show = this.showArchived();
    return all.filter(w => show ? w.status === 'ARCHIVED' : w.status !== 'ARCHIVED');
  });

  readonly currentUser = signal<UserResponse | null>(null);

  readonly deleteVisible = signal(false);
  readonly deleteWalletId = signal<string | null>(null);
  readonly deleteLoading = signal(false);

  readonly createWalletDialogVisible = signal(false);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly detailsVisible = signal(false);
  readonly detailsLoading = signal(false);
  readonly detailsError = signal<string | null>(null);
  readonly selectedWallet = signal<WalletResponse | null>(null);

  readonly addMemberLoading = signal(false);
  readonly addMemberError = signal<string | null>(null);

  readonly addMemberForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    })
  });

  constructor() {
    this.loadCurrentUser();
    this.refresh();

    this.addMemberForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.addMemberError()) {
        this.addMemberError.set(null);
      }
    });
  }

  private loadCurrentUser(): void {
    this.auth.getUserProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (u) => this.currentUser.set(u),
      error: () => this.currentUser.set(null),
    });
  }

  refresh(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.walletService
      .getWallets()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {},
        error: (err) => {
          const message =
            (err?.error && (err.error.message || err.error.error)) ||
            err?.message ||
            'Failed to load wallets';
          this.errorMessage.set(String(message));
        }
      });
  }

  openCreateWalletDialog(): void {
    this.createWalletDialogVisible.set(true);
  }

  handleCreateWalletDialogVisibleChange(visible: boolean): void {
    this.createWalletDialogVisible.set(visible);
    if (!visible) {
      // Ensure the list reflects the server state after creating.
      this.refresh();
    }
  }

  openDetails(walletId: string): void {
    this.detailsVisible.set(true);
    this.loadDetails(walletId);
  }

  handleDetailsVisibleChange(visible: boolean): void {
    this.detailsVisible.set(visible);
    if (!visible) {
      this.detailsLoading.set(false);
      this.detailsError.set(null);
      this.selectedWallet.set(null);
      this.addMemberForm.reset({ email: '' });
      this.addMemberError.set(null);
      this.addMemberLoading.set(false);
    }
  }

  private loadDetails(walletId: string): void {
    this.detailsLoading.set(true);
    this.detailsError.set(null);
    this.selectedWallet.set(null);

    this.walletService
      .getWallet(walletId)
      .pipe(finalize(() => this.detailsLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (wallet) => this.selectedWallet.set(wallet),
        error: (err) => {
          const message =
            (err?.error && (err.error.message || err.error.error)) ||
            err?.message ||
            'Failed to load wallet details';
          this.detailsError.set(String(message));
        }
      });
  }

  archive(walletId: string): void {
    const ok = confirm('Archive this wallet?');
    if (!ok) {
      return;
    }

    this.walletService.archiveWallet(walletId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Wallet archived');
        const current = this.selectedWallet();
        if (current?.id === walletId) {
          this.handleDetailsVisibleChange(false);
        }
      },
      error: (err) => {
        const message =
          (err?.error && (err.error.message || err.error.error)) ||
          err?.message ||
          'Failed to archive wallet';
        this.toast.error(String(message));
      }
    });
  }

  submitAddMember(): void {
    const wallet = this.selectedWallet();
    if (!wallet) {
      return;
    }
    if (this.addMemberLoading()) {
      return;
    }
    if (this.addMemberForm.invalid) {
      this.addMemberForm.markAllAsTouched();
      return;
    }

    this.addMemberLoading.set(true);
    this.addMemberError.set(null);

    const req: AddWalletMemberRequest = {
      email: this.addMemberForm.controls.email.value.trim()
    };

    this.walletService
      .addMember(wallet.id, req)
      .pipe(finalize(() => this.addMemberLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.toast.success('Member added');
          this.selectedWallet.set(updated);
          this.addMemberForm.reset({ email: '' });
        },
        error: (err) => {
          const body = err?.error;
          const message =
            (typeof body === 'string' && body.trim() ? body : null) ||
            body?.message ||
            body?.detail ||
            body?.error ||
            err?.message ||
            err?.statusText ||
            'Failed to add member';
          this.addMemberError.set(String(message));
        }
      });
  }


  isOwner(wallet: WalletResponse): boolean {
    const user = this.currentUser();
    if (!user) return false;

    const members = wallet.members;
    if (!Array.isArray(members)) return false;

    const match = members.find((m) => this.memberMatchesUser(m, user));
    if (!match) return false;

    const role = (match as any).role;
    return role === 'OWNER';
  }

  private memberMatchesUser(member: unknown, user: UserResponse): boolean {
    if (!member || typeof member !== 'object') {
      return false;
    }

    const m: any = member;
    const userId = (user.id || '').trim();
    const email = (user.email || '').trim().toLowerCase();
    const preferredUsername = (user.preferredUsername || '').trim().toLowerCase();

    if (userId && typeof m.userId === 'string' && m.userId.trim() === userId) {
      return true;
    }

    if (email && typeof m.email === 'string' && m.email.trim().toLowerCase() === email) {
      return true;
    }
    
    // Some backends use 'username' for identifying logic
    if (preferredUsername && typeof m.username === 'string' && m.username.trim().toLowerCase() === preferredUsername) {
      return true;
    }

    return false;
  }

  openDelete(wallet: WalletResponse): void {
    this.deleteWalletId.set(wallet.id);
    this.deleteVisible.set(true);
  }

  handleDeleteVisibleChange(visible: boolean): void {
    this.deleteVisible.set(visible);
    if (!visible) {
      this.deleteWalletId.set(null);
      this.deleteLoading.set(false);
    }
  }

  confirmDelete(): void {
    const id = this.deleteWalletId();
    if (!id || this.deleteLoading()) return;

    this.deleteLoading.set(true);
    this.walletService.deleteWallet(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deleteLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.toast.success('Wallet process completed.');
          this.handleDeleteVisibleChange(false);
        },
        error: () => {
          this.toast.error('Failed to delete wallet.');
        }
      });
  }

  unarchive(walletId: string): void {
    this.walletService.unarchiveWallet(walletId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.toast.success('Wallet restored successfully.'),
        error: (err) => {
          const message = err?.error?.message || 'Failed to restore wallet';
          this.toast.error(message);
        }
      });
  }

  get memberEmail() {
    return this.addMemberForm.controls.email;
  }

  memberEmailValue(member: unknown): string | null {
    if (!member || typeof member !== 'object') {
      return null;
    }
    const email = (member as { email?: unknown }).email;
    return typeof email === 'string' && email.trim() ? email : null;
  }
}
