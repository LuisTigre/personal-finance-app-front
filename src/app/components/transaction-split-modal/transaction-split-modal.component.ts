import { Component, DestroyRef, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  ButtonDirective,
  ButtonCloseDirective,
  ModalComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ModalBodyComponent,
  ModalFooterComponent,
  FormControlDirective,
  SpinnerComponent,
  CardComponent,
  CardBodyComponent,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

import { TransactionResponse, TransactionService, TransactionItem } from '../../services/transaction.service';
import { AppToastService } from '../../services/app-toast.service';

@Component({
  selector: 'app-transaction-split-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    ButtonDirective,
    ButtonCloseDirective,
    FormControlDirective,
    SpinnerComponent,
    IconDirective,
    CardComponent,
    CardBodyComponent
  ],
  templateUrl: './transaction-split-modal.component.html',
  styleUrls: ['./transaction-split-modal.component.scss']
})
export class TransactionSplitModalComponent {
  private readonly txService = inject(TransactionService);
  private readonly toast = inject(AppToastService);
  private readonly destroyRef = inject(DestroyRef);
  private loadSubscription?: Subscription;

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  // The parent transaction to split
  private _transaction = signal<TransactionResponse | null>(null);
  @Input() 
  set transaction(tx: TransactionResponse | null) {
    this._transaction.set(tx);
    if (tx && this.visible) {
      this.loadDetails(tx.id);
    }
  }
  get transaction() { return this._transaction(); }

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  
  readonly form = new FormGroup({
    items: new FormArray<FormGroup>([]),
  });

  readonly allocatedTotal = signal(0);
  
  // Computed helpers
  readonly remaining = computed(() => {
    const tx = this._transaction();
    if (!tx) return 0;
    return tx.amount - this.allocatedTotal();
  });

  readonly isBalanced = computed(() => {
    // Floating point comparison tolerance
    return Math.abs(this.remaining()) < 0.01;
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.recalculateTotal();
    });
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  handleVisibleChange(visible: boolean) {
    this.visible = visible;
    this.visibleChange.emit(visible);
    if (visible && this.transaction) {
      this.loadDetails(this.transaction.id);
    } else {
      this.items.clear();
      this.error.set(null);
    }
  }

  loadDetails(id: string) {
    this.loadSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.items.clear();

    this.loadSubscription = this.txService.getTransactionDetails(id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.items.clear();
          if (res.items && res.items.length > 0) {
            res.items.forEach(item => this.addItem(item));
          } else {
            // Default: One row with full amount if clean
            this.addItem({
              name: '',
              category: res.transaction.category || '',
              amount: res.transaction.amount,
              note: ''
            });
          }
          this.recalculateTotal();
        },
        error: (err) => {
          this.error.set('Failed to load transaction details.');
        }
      });
  }

  addItem(initial?: TransactionItem) {
    const group = new FormGroup({
      name: new FormControl(initial?.name || '', { nonNullable: true, validators: [Validators.required] }),
      category: new FormControl(initial?.category || '', { nonNullable: true, validators: [Validators.required] }),
      amount: new FormControl(initial?.amount || 0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
      note: new FormControl(initial?.note || '', { nonNullable: true }),
    });
    this.items.push(group);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  save() {
    if (this.saving() || !this.transaction) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.isBalanced()) {
      return; // Button should be disabled, but double check
    }

    this.saving.set(true);
    this.error.set(null);

    const data = this.form.getRawValue();
    const items: TransactionItem[] = data.items.map((i: any) => ({
      name: i['name'],
      category: i['category'],
      amount: i['amount'],
      note: i['note'] || undefined
    }));

    this.txService.updateTransactionItems(this.transaction.id, items)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toast.success('Transaction itemized successfully');
          this.saved.emit();
          this.handleVisibleChange(false);
        },
        error: (err) => {
          this.error.set('Failed to save items.');
        }
      });
  }

  resetToSingle() {
    if (this.saving() || !this.transaction) return;
    if (!confirm('Are you sure? This will remove all split items and restore the original transaction.')) return;

    this.saving.set(true);
    this.txService.clearTransactionItems(this.transaction.id)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toast.success('Transaction restored to single item');
          this.saved.emit();
          this.handleVisibleChange(false);
        },
        error: (err) => {
          this.error.set('Failed to clear items.');
        }
      });
  }

  private recalculateTotal() {
    const raw = this.items.getRawValue();
    const sum = raw.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    this.allocatedTotal.set(sum);
  }
}
