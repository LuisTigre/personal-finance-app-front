export interface ReceiptItemDraft {
  name: string;
  amount: number;
  category: string | null;
}

export interface ReceiptOcrResponse {
  ocrText: string;
  merchant: string | null;
  totalAmount: number | null;
  currency: string;
  items: ReceiptItemDraft[];
  warnings: string[];
}

export interface ReceiptItemConfirm {
  name: string;
  amount: number;
  category: string;
}

export interface ReceiptConfirmRequest {
  walletId: string;
  transactionDate: string;
  merchant: string | null;
  description: string | null;
  totalAmount: number;
  currency: string;
  items: ReceiptItemConfirm[];
}

export interface ConfirmReceiptResponse {
  transactionId: string;
}
