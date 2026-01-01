import { Transaction, Category, TransactionType } from "../types";
import { supabase } from "../lib/supabaseClient";

export const analyzeFinances = async (
  transactions: Transaction[],
  categories: Category[]
): Promise<string> => {
  // 1. Prepare Data
  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income = currentMonthTransactions
    .filter(t => {
      const cat = categories.find(c => c.id === t.category_id);
      return cat?.type === TransactionType.INCOME;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = currentMonthTransactions
    .filter(t => {
      const cat = categories.find(c => c.id === t.category_id);
      return cat?.type === TransactionType.EXPENSE;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseBreakdown: Record<string, number> = {};
  currentMonthTransactions.forEach(t => {
    const cat = categories.find(c => c.id === t.category_id);
    if (cat?.type === TransactionType.EXPENSE) {
      expenseBreakdown[cat.name] = (expenseBreakdown[cat.name] || 0) + t.amount;
    }
  });

  const promptData = {
    totalIncome: income,
    totalExpense: expense,
    savings: income - expense,
    expenseBreakdown,
    transactionCount: currentMonthTransactions.length
  };

  try {
    // 2. Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-finances', {
      body: { promptData }
    });

    if (error) throw error;
    return data.text || "Could not generate insights.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Sorry, I couldn't analyze your data right now. Please try again later.";
  }
};
