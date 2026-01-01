import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Stats } from './components/Stats';
import { ViewState } from './types';
import { LayoutDashboard, List, PieChart, LogOut, Wallet } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, signOut } = useWallet();
  const [view, setView] = useState<ViewState>('dashboard');

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row max-w-7xl mx-auto overflow-hidden shadow-2xl md:my-8 md:rounded-3xl md:border border-slate-200 md:h-[90vh]">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-10 text-indigo-600">
            <Wallet className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">My Wallet</span>
        </div>
        
        <nav className="flex-1 space-y-2">
            <button 
                onClick={() => setView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button 
                onClick={() => setView('transactions')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${view === 'transactions' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <List className="w-5 h-5" /> Transactions
            </button>
            <button 
                onClick={() => setView('stats')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${view === 'stats' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <PieChart className="w-5 h-5" /> Stats
            </button>
        </nav>

        <button 
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-500 transition mt-auto"
        >
            <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {view === 'dashboard' && <Dashboard />}
        {view === 'transactions' && <Transactions />}
        {view === 'stats' && <Stats />}
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around p-3 pb-safe z-40">
        <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
            onClick={() => setView('transactions')}
            className={`flex flex-col items-center gap-1 p-2 ${view === 'transactions' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
            <List className="w-6 h-6" />
            <span className="text-[10px] font-medium">History</span>
        </button>
        <button 
            onClick={() => setView('stats')}
            className={`flex flex-col items-center gap-1 p-2 ${view === 'stats' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
            <PieChart className="w-6 h-6" />
            <span className="text-[10px] font-medium">Stats</span>
        </button>
        <button 
            onClick={signOut}
            className="flex flex-col items-center gap-1 p-2 text-slate-400"
        >
            <LogOut className="w-6 h-6" />
            <span className="text-[10px] font-medium">Logout</span>
        </button>
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
};

export default App;
