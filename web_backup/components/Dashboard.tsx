import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { TransactionType } from '../types';
import { TrendingUp, TrendingDown, Sparkles, Settings, Calendar } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { analyzeFinances } from '../services/geminiService';
import { IconByName } from './IconUtils';

export const Dashboard: React.FC = () => {
    const { transactions, categories, user, updateUser, getBillingCycle } = useWallet();
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Settings State
    const [tempStartDay, setTempStartDay] = useState(user?.billing_start_day || 1);

    // Get Billing Cycle
    const { start, end } = getBillingCycle();

    // Filter transactions for CURRENT cycle
    const currentCycleTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return isWithinInterval(tDate, { start, end });
    });

    // Calculate Totals for Cycle
    const totalIncome = currentCycleTransactions
        .filter(t => {
            const cat = categories.find(c => c.id === t.category_id);
            return cat?.type === TransactionType.INCOME;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = currentCycleTransactions
        .filter(t => {
            const cat = categories.find(c => c.id === t.category_id);
            return cat?.type === TransactionType.EXPENSE;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const handleAiAnalysis = async () => {
        setIsAnalyzing(true);
        const insight = await analyzeFinances(currentCycleTransactions, categories);
        setAiInsight(insight);
        setIsAnalyzing(false);
    };

    const saveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser({ billing_start_day: tempStartDay });
        setIsSettingsOpen(false);
    };

    return (
        <div className="space-y-6 pb-20 md:pb-0 relative">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Hello, {user?.full_name?.split(' ')[0] || 'User'}</h1>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-slate-500 text-xs flex items-center gap-1 hover:text-indigo-600 transition"
                    >
                        <Calendar className="w-3 h-3" />
                        {format(start, 'dd/MM')} - {format(end, 'dd/MM')}
                    </button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
                        <Settings className="w-5 h-5" />
                    </button>
                    <img src={user?.avatar_url || 'https://picsum.photos/100'} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                </div>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:scale-[1.01]">
                <div className="relative z-10">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Balance</p>
                    <h2 className="text-4xl font-bold mb-4">${balance.toLocaleString()}</h2>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            <div className="bg-emerald-400/30 p-1 rounded-full"><TrendingUp className="w-4 h-4 text-emerald-300" /></div>
                            <div>
                                <p className="text-xs text-indigo-100">Income</p>
                                <p className="font-semibold text-sm">${totalIncome.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            <div className="bg-rose-400/30 p-1 rounded-full"><TrendingDown className="w-4 h-4 text-rose-300" /></div>
                            <div>
                                <p className="text-xs text-indigo-100">Expense</p>
                                <p className="font-semibold text-sm">${totalExpense.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* AI Insight */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        AI Advisor
                    </h3>
                    {!aiInsight && (
                        <button
                            onClick={handleAiAnalysis}
                            disabled={isAnalyzing}
                            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium hover:bg-indigo-100 transition disabled:opacity-50"
                        >
                            {isAnalyzing ? 'Thinking...' : 'Analyze Cycle'}
                        </button>
                    )}
                </div>
                {aiInsight ? (
                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 leading-relaxed border border-slate-200">
                        {aiInsight}
                        <button onClick={() => setAiInsight(null)} className="block mt-2 text-xs text-indigo-600 hover:underline">Refresh</button>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400 italic">Get insights on your spending for this billing cycle.</p>
                )}
            </div>

            {/* Recent Transactions in Cycle */}
            <div>
                <h3 className="font-bold text-slate-700 mb-3 text-lg">Cycle Transactions</h3>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {currentCycleTransactions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <p>No transactions in this cycle yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {[...currentCycleTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(t => {
                                const cat = categories.find(c => c.id === t.category_id);
                                return (
                                    <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cat?.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                <IconByName name={cat?.icon || 'Tag'} className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{cat?.name || 'Unknown'}</p>
                                                <p className="text-xs text-slate-500">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className={`font-bold ${cat?.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {cat?.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Cycle Settings</h3>
                        <form onSubmit={saveSettings}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Billing Start Day</label>
                                <p className="text-xs text-slate-500 mb-3">Select the day of the month when your billing cycle resets.</p>

                                <div className="relative">
                                    <select
                                        value={tempStartDay}
                                        onChange={(e) => setTempStartDay(parseInt(e.target.value))}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                                    >
                                        {[...Array(31)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
