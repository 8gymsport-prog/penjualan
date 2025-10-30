export type PaymentMethod = "Tunai" | "QR" | "Transfer";

export interface Transaction {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
}

export interface User {
  username: string;
  photoURL?: string;
}