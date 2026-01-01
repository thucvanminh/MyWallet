import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { IconByName } from './IconUtils';

type TimeRange = '1M' | '3M' | '6M' | '1Y';

export const Stats: React.FC = () => {
  const { transactions, categories } = useWallet();
  const [range, setRange] = useState<TimeRange>('1M');

  // Filter Transactions by Range
  const getStartDate = () => {
    const now = new Date();
    const d = new Date(now);
    switch (range) {
      case '1M':
        d.setMonth(d.getMonth() - 1);
        break;
      case '3M':
        d.setMonth(d.getMonth() - 3);
        break;
      case '6M':
        d.setMonth(d.getMonth() - 6);
        break;
      case '1Y':
        d.setFullYear(d.getFullYear() - 1);
        break;
      default:
        d.setMonth(d.getMonth() - 1);
    }
    return d;
  };

  const startDate = getStartDate();
  const filteredTx = transactions.filter(t => new Date(t.date) > startDate);

  // --- DATA PREP FOR PIE CHART (Expenses by Category) ---
  const expenseDataMap: Record<string, number> = {};
  filteredTx.forEach(t => {
    const cat = categories.find(c => c.id === t.category_id);
    if (cat?.type === TransactionType.EXPENSE) {
      expenseDataMap[cat.name] = (expenseDataMap[cat.name] || 0) + t.amount;
    }
  });

  const pieData = Object.entries(expenseDataMap)
    .map(([name, value]) => {
      const cat = categories.find(c => c.name === name);
      return { name, value, color: cat?.color || '#94a3b8' };
    })
    .sort((a, b) => b.value - a.value);

  // --- DATA PREP FOR BAR CHART (Income vs Expense Over Time) ---
  // Group by Month
  const barDataMap: Record<string, { name: string, income: number, expense: number }> = {};
  
  filteredTx.forEach(t => {
    const monthKey = format(new Date(t.date), 'MMM yyyy');
    if (!barDataMap[monthKey]) {
        barDataMap[monthKey] = { name: monthKey, income: 0, expense: 0 };
    }
    const cat = categories.find(c => c.id === t.category_id);
    if (cat?.type === TransactionType.INCOME) {
        barDataMap[monthKey].income += t.amount;
    } else {
        barDataMap[monthKey].expense += t.amount;
    }
  });

  const barData = Object.values(barDataMap).sort((a, b) => {
    // Simple sort by parsing date string hack or just preserve insertion order if iterating logically
    return new Date('01 ' + a.name).getTime() - new Date('01 ' + b.name).getTime();
  });


  return (
    <div className="pb-20 md:pb-0 space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800">Financial Stats</h2>
      </div>

      {/* Range Filter */}
      <div className="flex bg-slate-200 p-1 rounded-lg">
        {(['1M', '3M', '6M', '1Y'] as TimeRange[]).map((r) => (
            <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${range === r ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                {r}
            </button>
        ))}
      </div>

      {/* Total Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-600 uppercase">Total Income</p>
            <p className="text-xl font-bold text-slate-800">
                ${filteredTx.filter(t => categories.find(c => c.id === t.category_id)?.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
            <p className="text-xs font-semibold text-rose-600 uppercase">Total Expense</p>
            <p className="text-xl font-bold text-slate-800">
                ${filteredTx.filter(t => categories.find(c => c.id === t.category_id)?.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-700 mb-4 text-sm">Expenses Breakdown</h3>
        <div className="h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <span className="text-xs text-slate-400">Total</span>
                    <p className="font-bold text-slate-700">
                        ${pieData.reduce((s, i) => s + i.value, 0).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-slate-600 truncate flex-1">{item.name}</span>
                    <span className="text-xs font-semibold text-slate-800">${item.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-700 mb-4 text-sm">Income vs Expense</h3>
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};