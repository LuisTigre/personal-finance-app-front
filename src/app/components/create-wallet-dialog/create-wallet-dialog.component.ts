import { NgIf, NgFor } from '@angular/common';
import { Component, EventEmitter, Output, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonCloseDirective,
  ButtonDirective,
  FormControlDirective,
  FormFeedbackComponent,
  FormLabelDirective,
  FormSelectDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  SpinnerComponent,
} from '@coreui/angular';
import { finalize } from 'rxjs/operators';

import { AppToastService } from '../../services/app-toast.service';
import { CreateWalletRequest, WalletCurrency, WalletService } from '../../services/wallet.service';

@Component({
  selector: 'app-create-wallet-dialog',
  templateUrl: './create-wallet-dialog.component.html',
  styleUrls: ['./create-wallet-dialog.component.scss'],
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ButtonCloseDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    ButtonDirective,
    FormLabelDirective,
    FormControlDirective,
    FormSelectDirective,
    FormFeedbackComponent,
    SpinnerComponent,
  ]
})
export class CreateWalletDialogComponent {
  readonly visible = input(false);

  @Output() readonly visibleChange = new EventEmitter<boolean>();

  readonly currencies: WalletCurrency[] = ['USD', 'EUR', 'PLN', 'GBP'];

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    currency: new FormControl<WalletCurrency>('USD', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    initialBalance: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor(
    private readonly walletService: WalletService,
    private readonly toast: AppToastService,
  ) {
    // Clear server error as user edits.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set(null);
      }
    });
  }

  onVisibleChange(next: boolean): void {
    this.visibleChange.emit(next);

    if (!next) {
      this.loading.set(false);
      this.errorMessage.set(null);
    }
  }

  cancel(): void {
    this.onVisibleChange(false);
  }

  submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const payload: CreateWalletRequest = {
      name: raw.name.trim(),
      currency: raw.currency,
      initialBalance: Number(raw.initialBalance)
    };

    this.walletService
      .createWallet(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Wallet created');
          this.form.reset({ name: '', currency: 'USD', initialBalance: 0 });
          this.onVisibleChange(false);
        },
        error: (err) => {
          const message =
            (err?.error && (err.error.message || err.error.error)) ||
            err?.message ||
            'Failed to create wallet';
          this.errorMessage.set(String(message));
        }
      });
  }

  get name() {
    return this.form.controls.name;
  }

  get currency() {
    return this.form.controls.currency;
  }

  get initialBalance() {
    return this.form.controls.initialBalance;
  }
}
