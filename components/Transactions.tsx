import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { TransactionType, Category } from '../types';
import { format } from 'date-fns';
import { Trash2, Plus, X, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { IconByName, IconPicker } from './IconUtils';

type Tab = 'history' | 'categories';

export const Transactions: React.FC = () => {
  const { transactions, categories, addTransaction, deleteTransaction, addCategory, deleteCategory } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('history');
  
  // Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // --- Handlers ---
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;
    addTransaction({
      category_id: categoryId,
      amount: parseFloat(amount),
      note,
      date: new Date(date).toISOString(),
    });
    closeTxModal();
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName,
      type: newCatType,
      icon: newCatIcon,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
    });
    setNewCatName('');
    setNewCatIcon('Tag');
  };

  const closeTxModal = () => {
    setIsTxModalOpen(false);
    setAmount('');
    setNote('');
    setCategoryId('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const filteredCategories = categories.filter(c => c.type === txType);

  return (
    <div className="h-full flex flex-col pb-20 md:pb-0">
      
      {/* Top Bar with Tabs */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'history' ? 'Transactions' : 'Categories'}
        </h2>
        {activeTab === 'history' && (
             <button 
                onClick={() => setIsTxModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg shadow-indigo-200"
            >
                <Plus className="w-6 h-6" />
            </button>
        )}
      </div>

      <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
        <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
            History
        </button>
        <button 
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'categories' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
        >
            Manage Categories
        </button>
      </div>

      {/* --- HISTORY TAB --- */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto space-y-3">
            {transactions.length === 0 && (
                <div className="text-center text-slate-400 mt-10">No transactions found.</div>
            )}
            {[...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((t) => {
            const cat = categories.find((c) => c.id === t.category_id);
            return (
                <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white`} style={{ backgroundColor: cat?.color || '#94a3b8' }}>
                       <IconByName name={cat?.icon || 'Tag'} className="w-5 h-5" />
                    </div>
                    <div>
                    <p className="font-medium text-slate-800">{cat?.name}</p>
                    <p className="text-xs text-slate-500">{format(new Date(t.date), 'MMM dd')} • {t.note || 'No note'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`font-bold ${cat?.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {cat?.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                    </span>
                    <button 
                        onClick={() => deleteTransaction(t.id)}
                        className="text-slate-300 hover:text-rose-500 transition"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                </div>
            );
            })}
        </div>
      )}

      {/* --- CATEGORIES TAB --- */}
      {activeTab === 'categories' && (
          <div className="flex-1 overflow-y-auto">
             {/* Add New Category Form */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Add New Category</h3>
                <form onSubmit={handleCatSubmit} className="space-y-3">
                    <div className="flex gap-2">
                        <select
                            value={newCatType}
                            onChange={(e) => setNewCatType(e.target.value as TransactionType)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value={TransactionType.EXPENSE}>Expense</option>
                            <option value={TransactionType.INCOME}>Income</option>
                        </select>
                        <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Category Name"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Select Icon:</p>
                        <IconPicker selectedIcon={newCatIcon} onSelect={setNewCatIcon} />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 mt-2"
                    >
                        <Plus className="w-4 h-4" /> Create Category
                    </button>
                </form>
            </div>

            {/* Categories List */}
            <div className="space-y-2 pb-10">
                {categories.map((c) => (
                <div key={c.id} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                    <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: c.color || '#94a3b8' }}
                    >
                         <IconByName name={c.icon} className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{c.type.toLowerCase()}</p>
                    </div>
                    </div>
                    
                    {c.user_id ? (
                    <button 
                        onClick={() => deleteCategory(c.id)}
                        className="text-slate-300 hover:text-rose-500 p-2"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    ) : (
                        <div title="System Default" className="p-2">
                            <AlertCircle className="w-4 h-4 text-slate-200" />
                        </div>
                    )}
                </div>
                ))}
            </div>
          </div>
      )}

      {/* Add Transaction Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">New Transaction</h3>
              <button onClick={closeTxModal}><X className="w-6 h-6 text-slate-400" /></button>
            </div>

            <form onSubmit={handleTxSubmit} className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                    <button
                        type="button"
                        onClick={() => { setTxType(TransactionType.EXPENSE); setCategoryId(''); }}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${txType === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTxType(TransactionType.INCOME); setCategoryId(''); }}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition ${txType === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Income
                    </button>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                        <input 
                            type="number" 
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-7 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-semibold"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        required
                    >
                        <option value="" disabled>Select Category</option>
                        {filteredCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
                        <div className="relative">
                            <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                             <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Note (Optional)</label>
                        <input 
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Lunch..."
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className={`w-full py-3 rounded-lg text-white font-bold mt-4 shadow-lg transition transform active:scale-95 ${txType === TransactionType.EXPENSE ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}
                >
                    Save Transaction
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
