import { FieldValue } from 'firebase/firestore';

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

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  profilePictureUrl?: string;
  role?: 'user' | 'superadmin';
}

export interface Chat {
  id: string;
  participantIds: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: FieldValue;
  }
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: FieldValue;
}
