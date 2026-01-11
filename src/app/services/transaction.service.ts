import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';
export type TransactionStatus = 'POSTED' | 'DELETED';

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  transactionDate: string;
  category?: string;
  description?: string;
  walletId?: string;
  fromWalletId?: string;
  toWalletId?: string;
}

export interface TransactionResponse {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  transactionDate: string;
  category?: string;
  description?: string;
  walletId?: string | null;
  fromWalletId?: string | null;
  toWalletId?: string | null;
  createdByUserId: string;
}

export interface Totals {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export interface ListTransactionsResponse {
  items: TransactionResponse[];
  totals: Totals;
}

export interface ListTransactionsFilters {
  walletId?: string;
  from?: string;
  to?: string;
  type?: TransactionType;
  q?: string;
  status?: TransactionStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  constructor(private readonly http: HttpClient) {}

  createTransaction(req: CreateTransactionRequest): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>('/api/transactions', req);
  }

  listTransactions(filters: ListTransactionsFilters): Observable<ListTransactionsResponse> {
    let params = new HttpParams();

    const setIf = (key: keyof ListTransactionsFilters, value: string | undefined) => {
      if (value && value.trim()) {
        params = params.set(String(key), value.trim());
      }
    };

    setIf('walletId', filters.walletId);
    setIf('from', filters.from);
    setIf('to', filters.to);
    setIf('type', filters.type);
    setIf('q', filters.q);
    setIf('status', filters.status);

    return this.http.get<ListTransactionsResponse>('/api/transactions', { params });
  }

  deleteTransaction(id: string): Observable<TransactionResponse> {
    return this.http.delete<TransactionResponse>(`/api/transactions/${id}`);
  }
}
