export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  billing_start_day: number; // 1-31
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Lucide icon name
  user_id: string | null; // Null means system default
  color?: string; // Hex code for UI
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  note: string;
  date: string; // ISO String
  created_at: string;
}

export interface FinancialInsight {
  analysis: string;
  recommendations: string[];
}

export type ViewState = 'dashboard' | 'transactions' | 'stats' | 'profile';
