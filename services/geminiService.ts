import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, TransactionType } from "../types";

// In a real production app, this call should often be proxied through a backend to protect the key.
// For this frontend-only demo, we assume the key is available in the environment.
const API_KEY = import.meta.env.VITE_API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeFinances = async (
  transactions: Transaction[],
  categories: Category[]
): Promise<string> => {
  if (!API_KEY) {
    return "AI insights are unavailable. Please configure the API_KEY.";
  }

  // 1. Prepare Data for Prompt
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

  // Group expenses by category
  const expenseBreakdown: Record<string, number> = {};
  currentMonthTransactions.forEach(t => {
    const cat = categories.find(c => c.id === t.category_id);
    if (cat?.type === TransactionType.EXPENSE) {
      expenseBreakdown[cat.name] = (expenseBreakdown[cat.name] || 0) + t.amount;
    }
  });

  const promptData = JSON.stringify({
    totalIncome: income,
    totalExpense: expense,
    savings: income - expense,
    expenseBreakdown,
    transactionCount: currentMonthTransactions.length
  });

  // 2. Construct Prompt
  const prompt = `
    Act as a financial advisor. Analyze this JSON summary of my finances for this month:
    ${promptData}

    Provide a concise, friendly, and actionable summary (max 150 words).
    1. Comment on my saving rate.
    2. Point out the highest expense category.
    3. Give one specific tip to improve.
    Format as plain text, no markdown bolding needed.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate insights.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't analyze your data right now. Please try again later.";
  }
};
