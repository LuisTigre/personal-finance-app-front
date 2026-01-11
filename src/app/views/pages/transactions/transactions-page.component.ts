import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ButtonCloseDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  FormControlDirective,
  FormFeedbackComponent,
  FormLabelDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  RowComponent,
  SpinnerComponent,
  TableDirective,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { TransactionSplitModalComponent } from '../../../components/transaction-split-modal/transaction-split-modal.component';
import { resolveEmoji } from '../../../shared/emoji/emoji-rules';
import { finalize } from 'rxjs/operators';

import { AppToastService } from '../../../services/app-toast.service';
import { AuthService, UserResponse } from '../../../services/auth.service';
import {
  CreateTransactionRequest,
  ListTransactionsResponse,
  TransactionResponse,
  TransactionService,
  TransactionStatus,
  TransactionType,
  TransactionItem
} from '../../../services/transaction.service';
import { WalletResponse, WalletService } from '../../../services/wallet.service';

function extractApiErrorMessage(err: any, fallback: string): string {
  const body = err?.error;
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body === 'object') {
    // Spring Boot default error payload often has {timestamp,status,error,path}
    const message = (body as any).message ?? (body as any).detail ?? (body as any).title;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    const error = (body as any).error;
    const status = (body as any).status;
    const path = (body as any).path;
    if (typeof error === 'string' && error.trim()) {
      return `${status ?? ''} ${error}${path ? ` (${path})` : ''}`.trim();
    }
    try {
      return JSON.stringify(body);
    } catch {
      // fall through
    }
  }
  const message =
    body?.message ??
    body?.detail ??
    body?.error ??
    body?.title ??
    err?.message ??
    err?.statusText;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return fallback;
}

function toIsoInstantFromLocalDateTime(value: string | null | undefined): string | undefined {
  const v = (value || '').trim();
  if (!v) {
    return undefined;
  }
  const d = new Date(v);
  const iso = d.toISOString();
  return iso;
}

function nowLocalDateTimeInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

@Component({
  selector: 'app-transactions-page',
  templateUrl: './transactions-page.component.html',
  styleUrls: ['./transactions-page.component.scss'],
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
    DropdownComponent,
    DropdownToggleDirective,
    DropdownMenuDirective,
    DropdownItemDirective,
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
    TransactionSplitModalComponent
  ]
})
export class TransactionsPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly txService = inject(TransactionService);
  private readonly walletService = inject(WalletService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(AppToastService);

  readonly wallets = this.walletService.wallets;

  readonly currentUser = signal<UserResponse | null>(null);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly deletingId = signal<string | null>(null);

  readonly transactions = signal<TransactionResponse[]>([]);
  readonly totals = signal<ListTransactionsResponse['totals'] | null>(null);
  readonly filteredCurrency = signal<string | null>(null);

  readonly createVisible = signal(false);
  readonly createLoading = signal(false);
  readonly createError = signal<string | null>(null);

  readonly splitVisible = signal(false);
  readonly splitTransaction = signal<TransactionResponse | null>(null);

  // Expansion Logic State
  readonly expandedIds = signal<Set<string>>(new Set());
  readonly itemsByTransactionId = signal<Map<string, TransactionItem[]>>(new Map());
  readonly loadingItemsIds = signal<Set<string>>(new Set());
  readonly errorItemsIds = signal<Map<string, string>>(new Map());

  // We use a manual signal instead of computed because formControl.value is not a signal dependency
  readonly createType = signal<TransactionType>('EXPENSE');

  readonly transferSameWalletError = computed(() => {
    if (this.createType() !== 'TRANSFER') {
      return false;
    }
    const from = this.createForm.controls.fromWalletId.value.trim();
    const to = this.createForm.controls.toWalletId.value.trim();
    return !!from && !!to && from === to;
  });

  readonly filtersForm = new FormGroup({
    walletId: new FormControl<string>('', { nonNullable: true }),
    fromLocal: new FormControl<string>('', { nonNullable: true }),
    toLocal: new FormControl<string>('', { nonNullable: true }),
    type: new FormControl<string>('', { nonNullable: true }),
    q: new FormControl<string>('', { nonNullable: true }),
    status: new FormControl<TransactionStatus>('POSTED', { nonNullable: true }),
  });

  readonly createForm = new FormGroup({
    type: new FormControl<TransactionType>('EXPENSE', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0.01)] }),
    transactionDateLocal: new FormControl<string>(nowLocalDateTimeInputValue(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category: new FormControl<string>('', { nonNullable: true }),
    description: new FormControl<string>('', { nonNullable: true }),
    walletId: new FormControl<string>('', { nonNullable: true }),
    fromWalletId: new FormControl<string>('', { nonNullable: true }),
    toWalletId: new FormControl<string>('', { nonNullable: true }),
  });

  readonly createPermissionHint = computed<string | null>(() => {
    // Only show hints if we can determine role(s).
    const type = this.createType();
    if (type === 'TRANSFER') {
      const from = this.createForm.controls.fromWalletId.value.trim();
      const to = this.createForm.controls.toWalletId.value.trim();
      const fromRole = from ? this.roleForWallet(from) : null;
      const toRole = to ? this.roleForWallet(to) : null;
      if (fromRole === 'READER' || toRole === 'READER') {
        return 'Read-only: you need WRITER/OWNER in both wallets to create a transfer.';
      }
      return null;
    }

    const walletId = this.createForm.controls.walletId.value.trim();
    const role = walletId ? this.roleForWallet(walletId) : null;
    if (role === 'READER') {
      return "Read-only: you don't have permission to create transactions in this wallet.";
    }
    return null;
  });

  constructor() {
    this.ensureWalletsLoaded();
    this.loadCurrentUser();

    this.resetCreateWalletControls();

    this.createForm.controls.type.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      this.createType.set(val);
      this.createError.set(null);
      this.resetCreateWalletControls();
    });

    this.createForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.createError()) {
        this.createError.set(null);
      }
    });

    this.refresh();
  }

  txTypeLabel(type: TransactionType): string {
    switch (type) {
      case 'EXPENSE':
        return 'Expense';
      case 'INCOME':
        return 'Income';
      case 'TRANSFER':
        return 'Transfer';
      default:
        return String(type);
    }
  }

  txTypeEmoji(type: TransactionType): string {
    switch (type) {
      case 'EXPENSE':
        return '💳';
      case 'INCOME':
        return '💰';
      case 'TRANSFER':
        return '🔁';
      default:
        return '💱';
    }
  }

  categoryEmoji(category: string | null | undefined, description: string | null | undefined, type: TransactionType): string {
    return resolveEmoji(category, description);
  }

  txWalletLine(tx: TransactionResponse): string {
    if (tx.type === 'TRANSFER') {
      return `${this.walletName(tx.fromWalletId)} → ${this.walletName(tx.toWalletId)}`;
    }
    return this.walletName(tx.walletId);
  }

  txDateShort(valueIso: string): string {
    // Matches the screenshot style: 1/10/26, 7:47 PM
    const d = new Date(valueIso);
    if (Number.isNaN(d.getTime())) {
      return valueIso;
    }
    const date = new Intl.DateTimeFormat(undefined, {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric',
    }).format(d);
    const time = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    return `${date}, ${time}`;
  }

  // --- Expansion Logic ---

  hasExpandableItems(tx: TransactionResponse): boolean {
    // Show expansion if specifically marked itemized, has count > 0, OR is legacy "Mix of Products" category
    return !!tx.isItemized || (!!tx.itemCount && tx.itemCount > 0) || tx.category === 'MIXED_PRODUCTS';
  }

  isExpanded(txId: string): boolean {
    return this.expandedIds().has(txId);
  }

  toggleExpand(tx: TransactionResponse, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (!this.hasExpandableItems(tx)) {
      return;
    }

    const currentExpanded = new Set(this.expandedIds());
    if (currentExpanded.has(tx.id)) {
      currentExpanded.delete(tx.id);
      this.expandedIds.set(currentExpanded);
    } else {
      currentExpanded.add(tx.id);
      this.expandedIds.set(currentExpanded);
      this.loadItemsIfNeeded(tx.id);
    }
  }

  private loadItemsIfNeeded(id: string) {
    if (this.itemsByTransactionId().has(id)) {
      return;
    }

    const currentLoading = new Set(this.loadingItemsIds());
    currentLoading.add(id);
    this.loadingItemsIds.set(currentLoading);

    // Clear previous error if any
    const currentErrors = new Map(this.errorItemsIds());
    if (currentErrors.has(id)) {
      currentErrors.delete(id);
      this.errorItemsIds.set(currentErrors);
    }

    this.txService.getTransactionDetails(id)
      .pipe(
        finalize(() => {
          const loading = new Set(this.loadingItemsIds());
          loading.delete(id);
          this.loadingItemsIds.set(loading);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const itemsMap = new Map(this.itemsByTransactionId());
          itemsMap.set(id, res.items);
          this.itemsByTransactionId.set(itemsMap);
        },
        error: (err) => {
          const errorMap = new Map(this.errorItemsIds());
          errorMap.set(id, 'Failed to load items');
          this.errorItemsIds.set(errorMap);
        }
      });
  }

  getItemsFor(txId: string): TransactionItem[] {
    return this.itemsByTransactionId().get(txId) || [];
  }

  isLoadingItems(txId: string): boolean {
    return this.loadingItemsIds().has(txId);
  }

  getItemsError(txId: string): string | undefined {
    return this.errorItemsIds().get(txId);
  }

  netClass(net: number): string {
    if (net > 0) return 'text-success';
    if (net < 0) return 'text-danger';
    return 'text-body';
  }

  private ensureWalletsLoaded(): void {
    // Wallet dropdowns depend on this.
    this.walletService.getWallets().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  private loadCurrentUser(): void {
    this.auth
      .getUserProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (u) => this.currentUser.set(u),
        error: () => this.currentUser.set(null),
      });
  }

  refresh(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filters = this.buildFilters();
    if (filters.walletId) {
      const w = this.wallets().find((x) => x.id === filters.walletId);
      this.filteredCurrency.set(w?.currency ?? null);
    } else {
      this.filteredCurrency.set(null);
    }

    this.txService
      .listTransactions(filters)
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.transactions.set(res.items ?? []);
          this.totals.set(res.totals ?? null);
        },
        error: (err) => {
          this.errorMessage.set(extractApiErrorMessage(err, 'Failed to load transactions'));
          this.transactions.set([]);
          this.totals.set(null);
        },
      });
  }

  applyFilters(): void {
    this.refresh();
  }

  clearFilters(): void {
    this.filtersForm.reset({
      walletId: '',
      fromLocal: '',
      toLocal: '',
      type: '',
      q: '',
      status: 'POSTED',
    });
    this.refresh();
  }

  openCreate(): void {
    this.createError.set(null);
    this.createVisible.set(true);
  }

  handleCreateVisibleChange(visible: boolean): void {
    this.createVisible.set(visible);
    if (!visible) {
      this.createLoading.set(false);
      this.createError.set(null);
      this.createForm.reset({
        type: 'EXPENSE',
        amount: 0,
        transactionDateLocal: nowLocalDateTimeInputValue(),
        category: '',
        description: '',
        walletId: '',
        fromWalletId: '',
        toWalletId: '',
      });
    }
  }

  openSplit(tx: TransactionResponse): void {
    this.splitTransaction.set(tx);
    this.splitVisible.set(true);
  }

  handleSplitVisibleChange(visible: boolean): void {
    this.splitVisible.set(visible);
    if (!visible) {
      this.splitTransaction.set(null);
    }
  }

  handleSplitSaved(): void {
    const tx = this.splitTransaction();
    if (tx && this.isExpanded(tx.id)) {
        // Force reload by clearing cache
        const items = new Map(this.itemsByTransactionId());
        items.delete(tx.id);
        this.itemsByTransactionId.set(items);
        this.loadItemsIfNeeded(tx.id);
    }
    this.refresh();
  }

  submitCreate(): void {
    if (this.createLoading()) {
      return;
    }
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const type = this.createForm.controls.type.value;
    const amount = this.createForm.controls.amount.value;

    if (!(amount > 0)) {
      this.createError.set('Amount must be greater than 0.');
      return;
    }

    const dateIso = toIsoInstantFromLocalDateTime(this.createForm.controls.transactionDateLocal.value);
    if (!dateIso) {
      this.createError.set('Transaction date is required.');
      return;
    }

    // Build request according to rules (do not send irrelevant fields).
    const base: Omit<CreateTransactionRequest, 'walletId' | 'fromWalletId' | 'toWalletId'> = {
      type,
      amount,
      transactionDate: dateIso,
      category: this.createForm.controls.category.value.trim() || undefined,
      description: this.createForm.controls.description.value.trim() || undefined,
    };

    let req: CreateTransactionRequest;

    if (type === 'TRANSFER') {
      const fromWalletId = this.createForm.controls.fromWalletId.value.trim();
      const toWalletId = this.createForm.controls.toWalletId.value.trim();

      if (!fromWalletId || !toWalletId) {
        this.createForm.controls.fromWalletId.markAsTouched();
        this.createForm.controls.toWalletId.markAsTouched();
        this.createError.set('Transfer requires both From and To wallets.');
        return;
      }
      if (fromWalletId === toWalletId) {
        this.createError.set('From and To wallets must be different.');
        return;
      }

      // UI hinting only if role info is available; backend is source of truth.
      if (!this.canWriteWallet(fromWalletId) || !this.canWriteWallet(toWalletId)) {
        this.createError.set('You do not have permission to create transfers for one of the selected wallets.');
        return;
      }

      req = {
        ...base,
        fromWalletId,
        toWalletId,
      };
    } else {
      const walletId = this.createForm.controls.walletId.value.trim();
      if (!walletId) {
        this.createForm.controls.walletId.markAsTouched();
        this.createError.set('Wallet is required for Expense/Income.');
        return;
      }

      if (!this.canWriteWallet(walletId)) {
        this.createError.set("You don't have permission to create transactions in this wallet.");
        return;
      }

      req = {
        ...base,
        walletId,
      };
    }

    this.createLoading.set(true);
    this.createError.set(null);

    this.txService
      .createTransaction(req)
      .pipe(finalize(() => this.createLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Transaction created');
          this.handleCreateVisibleChange(false);
          this.refresh();
          this.walletService.getWallets().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        },
        error: (err) => {
          const status = err?.status;
          if (status === 403) {
            this.createError.set("You don't have permission to modify transactions in this wallet.");
            return;
          }
          this.createError.set(extractApiErrorMessage(err, 'Failed to create transaction'));
        },
      });
  }

  delete(tx: TransactionResponse): void {
    if (this.deletingId()) {
      return;
    }
    const ok = confirm('Delete this transaction? This will reverse balances on the server.');
    if (!ok) {
      return;
    }

    this.deletingId.set(tx.id);

    this.txService
      .deleteTransaction(tx.id)
      .pipe(finalize(() => this.deletingId.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Transaction deleted');
          this.refresh();
          this.walletService.getWallets().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
        },
        error: (err) => {
          const status = err?.status;
          if (status === 403) {
            this.toast.error("You don't have permission to modify transactions in this wallet.");
            return;
          }
          this.toast.error(extractApiErrorMessage(err, 'Failed to delete transaction'));
        },
      });
  }

  canDelete(tx: TransactionResponse): boolean {
    if (tx.status !== 'POSTED') {
      return false;
    }

    // UI hinting. If role isn't available, allow the action and rely on backend.
    if (tx.type === 'TRANSFER') {
      const fromOk = tx.fromWalletId ? this.canWriteWallet(tx.fromWalletId) : true;
      const toOk = tx.toWalletId ? this.canWriteWallet(tx.toWalletId) : true;
      return fromOk && toOk;
    }

    if (tx.walletId) {
      return this.canWriteWallet(tx.walletId);
    }

    return true;
  }

  walletName(walletId: string | null | undefined): string {
    const id = (walletId || '').trim();
    if (!id) {
      return '-';
    }
    const w = this.wallets().find((x) => x.id === id);
    return w?.name ?? id;
  }

  private buildFilters() {
    const walletId = this.filtersForm.controls.walletId.value.trim() || undefined;
    const from = toIsoInstantFromLocalDateTime(this.filtersForm.controls.fromLocal.value);
    const to = toIsoInstantFromLocalDateTime(this.filtersForm.controls.toLocal.value);

    const typeRaw = this.filtersForm.controls.type.value.trim();
    const type = (typeRaw ? (typeRaw as TransactionType) : undefined);

    const q = this.filtersForm.controls.q.value.trim() || undefined;

    const status = this.filtersForm.controls.status.value;

    return {
      walletId,
      from,
      to,
      type,
      q,
      status,
    };
  }

  private resetCreateWalletControls(): void {
    const type = this.createForm.controls.type.value;

    if (type === 'TRANSFER') {
      this.createForm.controls.walletId.setValue('');
      this.createForm.controls.walletId.clearValidators();
      this.createForm.controls.walletId.updateValueAndValidity({ emitEvent: false });

      this.createForm.controls.fromWalletId.setValidators([Validators.required]);
      this.createForm.controls.toWalletId.setValidators([Validators.required]);
      this.createForm.controls.fromWalletId.updateValueAndValidity({ emitEvent: false });
      this.createForm.controls.toWalletId.updateValueAndValidity({ emitEvent: false });
    } else {
      this.createForm.controls.fromWalletId.setValue('');
      this.createForm.controls.toWalletId.setValue('');
      this.createForm.controls.fromWalletId.clearValidators();
      this.createForm.controls.toWalletId.clearValidators();
      this.createForm.controls.fromWalletId.updateValueAndValidity({ emitEvent: false });
      this.createForm.controls.toWalletId.updateValueAndValidity({ emitEvent: false });

      this.createForm.controls.walletId.setValidators([Validators.required]);
      this.createForm.controls.walletId.updateValueAndValidity({ emitEvent: false });
    }
  }

  private canWriteWallet(walletId: string): boolean {
    const role = this.roleForWallet(walletId);
    if (!role) {
      return true;
    }
    return role !== 'READER';
  }

  private roleForWallet(walletId: string): 'OWNER' | 'WRITER' | 'READER' | null {
    const user = this.currentUser();
    if (!user) {
      return null;
    }

    const wallet = this.wallets().find((w) => w.id === walletId);
    const members = wallet?.members;
    if (!wallet || !Array.isArray(members)) {
      return null;
    }

    const match = members.find((m) => this.memberMatchesUser(m, user));
    if (!match || typeof match !== 'object') {
      return null;
    }

    const rawRole = (match as any).role;
    if (typeof rawRole !== 'string' || !rawRole.trim()) {
      return null;
    }

    const upper = rawRole.trim().toUpperCase();
    if (upper === 'OWNER' || upper === 'WRITER' || upper === 'READER') {
      return upper as any;
    }
    return null;
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

    if (
      preferredUsername &&
      typeof m.preferredUsername === 'string' &&
      m.preferredUsername.trim().toLowerCase() === preferredUsername
    ) {
      return true;
    }

    return false;
  }

  get typeCtrl() {
    return this.createForm.controls.type;
  }
  get amountCtrl() {
    return this.createForm.controls.amount;
  }
  get transactionDateLocalCtrl() {
    return this.createForm.controls.transactionDateLocal;
  }
  get walletIdCtrl() {
    return this.createForm.controls.walletId;
  }
  get fromWalletIdCtrl() {
    return this.createForm.controls.fromWalletId;
  }
  get toWalletIdCtrl() {
    return this.createForm.controls.toWalletId;
  }
}
