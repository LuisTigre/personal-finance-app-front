import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

export type WalletCurrency = 'USD' | 'EUR' | 'PLN' | 'GBP';

export interface CreateWalletRequest {
  name: string;
  currency: WalletCurrency;
  initialBalance: number;
}

export interface AddWalletMemberRequest {
  /**
   * Member identifier (email).
   * Note: the backend may use a different JSON field name (e.g. userEmail).
   * We auto-detect and retry once if Spring returns an "Unrecognized field" parse error.
   */
  email: string;
}

export interface Wallet {
  id: string;
  name: string;
  currency: WalletCurrency;
  initialBalance?: number;
  currentBalance?: number;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
  members?: unknown[];
}

export type WalletResponse = Wallet;

type WalletApiResponse = {
  id: string;
  name: string;
  currency: WalletCurrency;
  initialBalance?: number | string;
  currentBalance?: number | string;
  balance?: number | string;
  initial_balance?: number | string;
  current_balance?: number | string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  members?: unknown[];
};

function toNumberOrUndefined(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeWallet(raw: WalletApiResponse): WalletResponse {
  return {
    id: raw.id,
    name: raw.name,
    currency: raw.currency,
    initialBalance: toNumberOrUndefined(raw.initialBalance ?? raw.initial_balance),
    currentBalance: toNumberOrUndefined(raw.currentBalance ?? raw.current_balance ?? raw.balance),
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
    members: raw.members,
  };
}

function extractApiErrorMessage(err: any): string {
  const body = err?.error;
  if (typeof body === 'string' && body.trim()) {
    return body;
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
  return 'Request failed';
}

function inferSingleFieldNameFromJacksonError(message: string): string | null {
  // Examples:
  // - Unrecognized field "email" (class ...AddWalletMemberRequest), not marked as ignorable (one known property: "userEmail"])
  // - ... (known properties: ["userEmail","userId"]) ...
  const oneKnown = message.match(/one known property:\s*"([^"]+)"/i);
  if (oneKnown?.[1]) {
    return oneKnown[1];
  }
  const knownList = message.match(/known properties:\s*\[([^\]]+)\]/i);
  if (knownList?.[1]) {
    const first = knownList[1].match(/"([^"]+)"/);
    return first?.[1] ?? null;
  }
  const knownProp = message.match(/known property:\s*"([^"]+)"/i);
  if (knownProp?.[1]) {
    return knownProp[1];
  }
  return null;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  readonly wallets = signal<WalletResponse[]>([]);

  constructor(private readonly http: HttpClient) {}

  getWallets(): Observable<WalletResponse[]> {
    return this.http.get<WalletApiResponse[]>('/api/wallets').pipe(
      map((items) => items.map(normalizeWallet)),
      tap((items) => this.wallets.set(items))
    );
  }

  getWallet(walletId: string): Observable<WalletResponse> {
    return this.http.get<WalletApiResponse>(`/api/wallets/${walletId}`).pipe(
      map(normalizeWallet)
    );
  }

  archiveWallet(walletId: string): Observable<WalletResponse> {
    return this.http.put<WalletApiResponse>(`/api/wallets/${walletId}/archive`, null).pipe(
      map(normalizeWallet),
      tap((updated) => {
        // Default UX: remove archived wallets from the list.
        this.wallets.update((current) => current.filter((w) => w.id !== updated.id));
      })
    );
  }

  addMember(walletId: string, request: AddWalletMemberRequest): Observable<WalletResponse> {
    const email = request.email.trim();

    const post = (payload: Record<string, string>) =>
      this.http.post<WalletApiResponse>(`/api/wallets/${walletId}/members`, payload).pipe(
        map(normalizeWallet),
        tap((updated) => {
          this.wallets.update((current) => {
            const idx = current.findIndex((w) => w.id === updated.id);
            if (idx === -1) {
              return current;
            }
            const copy = current.slice();
            copy[idx] = updated;
            return copy;
          });
        })
      );

    // First attempt with { email }.
    return post({ email }).pipe(
      catchError((err) => {
        // If the backend rejects the JSON field name, try to infer the expected one.
        const message = extractApiErrorMessage(err);
        const inferredField = inferSingleFieldNameFromJacksonError(message);
        if (inferredField && inferredField !== 'email') {
          return post({ [inferredField]: email });
        }
        return throwError(() => err);
      })
    );
  }

  createWallet(data: CreateWalletRequest): Observable<WalletResponse> {
    return this.http.post<WalletApiResponse>('/api/wallets', data).pipe(
      map((created) => normalizeWallet(created)),
      tap((created) => {
        this.wallets.update((current) => [created, ...current]);
      })
    );
  }
}
