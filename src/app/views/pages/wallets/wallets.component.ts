import { NgIf, NgFor, JsonPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.component.html',
  styleUrls: ['./wallets.component.scss'],
  imports: [
    NgIf,
    NgFor,
    JsonPipe,
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

  readonly wallets = this.walletService.wallets;

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
    this.refresh();

    this.addMemberForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.addMemberError()) {
        this.addMemberError.set(null);
      }
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
