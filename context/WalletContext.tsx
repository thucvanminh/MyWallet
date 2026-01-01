import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { UserProfile, Transaction, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface WalletContextType {
  user: UserProfile | null;
  isLoading: boolean;
  transactions: Transaction[];
  categories: Category[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getBillingCycle: () => { start: Date; end: Date };
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Check Auth Session & Load Data
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserData(session.user.id, session.user.email || '');
      } else {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // If we just logged in, fetch data
        if (!user) await fetchUserData(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setTransactions([]);
        setCategories(DEFAULT_CATEGORIES);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string, email: string) => {
    try {
      // A. Fetch Profile
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        const newProfile = {
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          billing_start_day: 1
        };
        const { data: insertedProfile } = await supabase.from('profiles').insert(newProfile).select().single();
        profile = insertedProfile;
      }

      if (profile) {
        setUser(profile as UserProfile);
      }

      // B. Fetch Transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (txs) setTransactions(txs as Transaction[]);

      // C. Fetch Categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`);

      if (cats) {
        setCategories(cats as Category[]);
      }

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      Alert.alert('Error', error.message);
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) {
      Alert.alert('Error', error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: name,
        avatar_url: `https://ui-avatars.com/api/?name=${name}`,
        billing_start_day: 1
      });
      if (!profileError) {
        await fetchUserData(data.user.id, email);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...data });
    }
  };

  const addTransaction = async (data: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    const newTx = {
      ...data,
      user_id: user.id,
      created_at: new Date().toISOString()
    };

    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert(newTx)
      .select()
      .single();

    if (!error && inserted) {
      setTransactions(prev => [inserted as Transaction, ...prev]);
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const addCategory = async (data: Omit<Category, 'id' | 'user_id'>) => {
    if (!user) return;
    const newCat = {
      ...data,
      user_id: user.id
    };

    const { data: inserted, error } = await supabase
      .from('categories')
      .insert(newCat)
      .select()
      .single();

    if (!error && inserted) {
      setCategories(prev => [...prev, inserted as Category]);
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const getBillingCycle = () => {
    const startDay = user?.billing_start_day || 1;
    const now = new Date();
    const currentDay = now.getDate();

    let start = new Date(now.getFullYear(), now.getMonth(), startDay);
    let end = new Date(now.getFullYear(), now.getMonth() + 1, startDay - 1);

    if (currentDay < startDay) {
      start = new Date(now.getFullYear(), now.getMonth() - 1, startDay);
      end = new Date(now.getFullYear(), now.getMonth(), startDay - 1);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  return (
    <WalletContext.Provider value={{
      user,
      isLoading,
      transactions,
      categories,
      signIn,
      signOut,
      signUp,
      updateUser,
      addTransaction,
      deleteTransaction,
      addCategory,
      deleteCategory,
      getBillingCycle
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
