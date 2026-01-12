import { Component, computed, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonModule,
  CardModule,
  FormModule,
  GridModule,
  ModalModule,
  SpinnerModule,
  TableModule
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { TransactionService } from '../../services/transaction.service';
import { WalletResponse } from '../../services/wallet.service';
import { ConfirmReceiptResponse, ReceiptConfirmRequest, ReceiptOcrResponse } from '../../models/receipt.models';

@Component({
  selector: 'app-receipt-upload-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalModule,
    ButtonModule,
    SpinnerModule,
    FormModule,
    GridModule,
    TableModule,
    IconModule,
    CardModule
  ],
  templateUrl: './receipt-upload-modal.component.html',
  styleUrls: ['./receipt-upload-modal.component.scss']
})
export class ReceiptUploadModalComponent {
  private readonly transactionService = inject(TransactionService);

  @Input() visible = false;
  @Input() wallets: WalletResponse[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<ConfirmReceiptResponse>();

  readonly step = signal<'UPLOAD' | 'REVIEW'>('UPLOAD');
  readonly processing = signal(false);
  readonly errorMessage = signal<string | null>(null);
  
  // OCR Data for reference/debugging
  readonly ocrResult = signal<ReceiptOcrResponse | null>(null);

  readonly form = new FormGroup({
    walletId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    merchant: new FormControl<string>(''),
    transactionDate: new FormControl<string>(new Date().toISOString().slice(0, 16), { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('Receipt upload'),
    totalAmount: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    currency: new FormControl<string>('EUR', { nonNullable: true }),
    items: new FormArray([this.createItemFormGroup({ name: 'Item 1', amount: 0, category: null })])
  });

  // Computed state for total validation
  readonly itemsSum = computed(() => {
    // This needs to be triggered by form value changes, so we might handling it in logic or use a signal updated by valueChanges
    // For simplicity, we'll assume updates on value changes
    return 0; // Placeholder, real logic below
  });

  // Track the actual sum for validation
  currentItemsSum = 0;

  constructor() {
    this.form.controls.items.valueChanges.subscribe(items => {
      this.currentItemsSum = items.reduce((sum, item) => sum + (item?.amount || 0), 0);
    });
    
    // Clear items initially
    this.form.controls.items.clear();
  }

  handleVisibleChange(visible: boolean) {
    this.visible = visible;
    this.visibleChange.emit(visible);
    if (!visible) {
      this.reset();
    }
  }

  reset() {
    this.step.set('UPLOAD');
    this.processing.set(false);
    this.errorMessage.set(null);
    this.ocrResult.set(null);
    this.form.reset({
      transactionDate: new Date().toISOString().slice(0, 16),
      description: 'Receipt upload',
      currency: 'EUR'
    });
    this.form.controls.items.clear();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.processing.set(true);
    this.errorMessage.set(null);

    this.transactionService.uploadReceipt(file).subscribe({
      next: (res) => {
        this.ocrResult.set(res);
        this.populateForm(res);
        this.step.set('REVIEW');
        this.processing.set(false);
      },
      error: (err) => {
        console.error('OCR Error', err);
        this.errorMessage.set('Failed to scan receipt. Please try again.');
        this.processing.set(false);
      }
    });
  }

  private populateForm(data: ReceiptOcrResponse) {
    this.form.patchValue({
      merchant: data.merchant || '',
      totalAmount: data.totalAmount || 0,
      currency: data.currency || 'EUR',
      description: data.merchant ? `Receipt from ${data.merchant}` : 'Receipt upload'
    });

    this.form.controls.items.clear();
    data.items.forEach(item => {
      this.form.controls.items.push(this.createItemFormGroup(item));
    });
    
    // If OCR returned items but the sum doesn't match total, or total was null, 
    // we might want to default the totalAmount to the sum
    const sum = data.items.reduce((acc, i) => acc + i.amount, 0);
    if (!data.totalAmount || data.totalAmount === 0) {
      this.form.controls.totalAmount.setValue(sum);
    }
    this.currentItemsSum = sum;
  }

  createItemFormGroup(item: { name: string, amount: number, category: string | null }): FormGroup {
    return new FormGroup({
        name: new FormControl(item.name || 'Unknown Item', { nonNullable: true, validators: [Validators.required] }),
        amount: new FormControl(item.amount || 0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
        category: new FormControl(item.category || '', { nonNullable: true, validators: [Validators.required] })
    });
  }
  
  // Helper for template
  get itemsControls() {
    return (this.form.get('items') as FormArray).controls as FormGroup[];
  }

  addItem() {
    this.form.controls.items.push(this.createItemFormGroup({ name: '', amount: 0, category: '' }));
  }

  removeItem(index: number) {
    this.form.controls.items.removeAt(index);
  }

  get isTotalMismatch(): boolean {
    // Floating point comparison
    return Math.abs(this.currentItemsSum - (this.form.value.totalAmount || 0)) > 0.01;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    if (this.isTotalMismatch) {
      // Allow them to proceed? Specification checks "Constraint: Sum(items.amount) MUST strictly equal totalAmount"
      // So we should block or auto-fix. Let's block with error.
      this.errorMessage.set(`Sum of items (${this.currentItemsSum.toFixed(2)}) does not match Total Amount (${this.form.value.totalAmount?.toFixed(2)})`);
      return;
    }

    this.processing.set(true);
    const formVal = this.form.getRawValue();
    
    const request: ReceiptConfirmRequest = {
      walletId: formVal.walletId,
      transactionDate: new Date(formVal.transactionDate).toISOString(), // Parse local input to ISO
      merchant: formVal.merchant || null,
      description: formVal.description || null,
      totalAmount: formVal.totalAmount,
      currency: formVal.currency,
      items: formVal.items.map((i: any) => ({
        name: i?.name || '', 
        amount: Number(i?.amount || 0),
        category: i?.category || ''
      }))
    };

    this.transactionService.confirmReceipt(request).subscribe({
      next: (res) => {
        this.saved.emit(res);
        this.handleVisibleChange(false);
      },
      error: (err) => {
        console.error('Confirm Error', err);
        this.errorMessage.set(err.error?.message || 'Failed to save transaction');
        this.processing.set(false);
      }
    });
  }
}
