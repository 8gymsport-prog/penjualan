export type PaymentMethod = "Tunai" | "QR" | "Transfer";

export interface Payment {
  method: PaymentMethod;
  amount: number;
}

export interface Transaction {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  payments: Payment[];
  timestamp: string;
  // Firestore fields
  productId: string;
  userId: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    userId: string;
}


// This User type is now simplified as Firebase's User type will be the primary source of truth.
// You can extend this or use Firebase's `User` type from 'firebase/auth' directly in your components.
export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}
