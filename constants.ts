import { Category, TransactionType } from './types';

// Default system categories (user_id: null)
export const DEFAULT_CATEGORIES: Category[] = [
    // Expenses
    { id: 'c1', name: 'Food & Dining', type: TransactionType.EXPENSE, icon: 'Utensils', user_id: null, color: '#ef4444' },
    { id: 'c2', name: 'Transport', type: TransactionType.EXPENSE, icon: 'Car', user_id: null, color: '#f97316' },
    { id: 'c3', name: 'Shopping', type: TransactionType.EXPENSE, icon: 'ShoppingBag', user_id: null, color: '#eab308' },
    { id: 'c4', name: 'Entertainment', type: TransactionType.EXPENSE, icon: 'Film', user_id: null, color: '#8b5cf6' },
    { id: 'c5', name: 'Bills & Utilities', type: TransactionType.EXPENSE, icon: 'Zap', user_id: null, color: '#64748b' },
    // Income
    { id: 'c6', name: 'Salary', type: TransactionType.INCOME, icon: 'Briefcase', user_id: null, color: '#10b981' },
    { id: 'c7', name: 'Freelance', type: TransactionType.INCOME, icon: 'Laptop', user_id: null, color: '#06b6d4' },
    { id: 'c8', name: 'Investments', type: TransactionType.INCOME, icon: 'TrendingUp', user_id: null, color: '#3b82f6' },
];

export const AVAILABLE_ICONS = [
    'Utensils', 'Car', 'ShoppingBag', 'Film', 'Zap', 'Briefcase', 'Laptop', 'TrendingUp',
    'Home', 'Gift', 'Coffee', 'Smartphone', 'Wifi', 'CreditCard', 'DollarSign', 'Heart'
];
