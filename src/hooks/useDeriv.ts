import { useState, useEffect, useMemo } from 'react';
import { DerivAccount } from '../utils/DerivAuth';

export interface DerivAccountsData {
  accounts: DerivAccount[];
  parsedAt: string;
  userId: string;
  url: string;
}

export interface UseDerivReturn {
  accounts: DerivAccount[];
  isLoading: boolean;
  error: string | null;
  hasData: boolean;
  realAccounts: DerivAccount[];
  demoAccounts: DerivAccount[];
  currencies: string[];
  totalBalance: number;
  activeAccounts: DerivAccount[];
  refreshData: () => void;
  clearData: () => void;
  getAccountById: (accountId: string) => DerivAccount | undefined;
  getAccountsByCurrency: (currency: string) => DerivAccount[];
  getAccountsByType: (type: 'real' | 'demo') => DerivAccount[];
}

/**
 * Custom hook for managing Deriv account data from local storage
 */
export function useDeriv(): UseDerivReturn {
  const [data, setData] = useState<DerivAccountsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    try {
      setIsLoading(true);
      setError(null);

      const savedData = localStorage.getItem('derivAccounts');
      
      if (!savedData) {
        setData(null);
        return;
      }

      const parsedData: DerivAccountsData = JSON.parse(savedData);
      
      // Validate data structure
      if (!parsedData.accounts || !Array.isArray(parsedData.accounts)) {
        throw new Error('Invalid Deriv accounts data structure');
      }

      // Validate each account
      const validAccounts = parsedData.accounts.filter(account => 
        account.id && 
        account.token && 
        account.currency && 
        account.accountType
      );

      if (validAccounts.length === 0) {
        throw new Error('No valid Deriv accounts found');
      }

      setData({
        ...parsedData,
        accounts: validAccounts
      });

    } catch (err: any) {
      console.error('Error loading Deriv data:', err);
      setError(err.message || 'Failed to load Deriv account data');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    try {
      localStorage.removeItem('derivAccounts');
      setData(null);
      setError(null);
    } catch (err: any) {
      console.error('Error clearing Deriv data:', err);
      setError(err.message || 'Failed to clear Deriv account data');
    }
  };

  const refreshData = () => {
    loadData();
  };

  const getAccountById = (accountId: string): DerivAccount | undefined => {
    return data?.accounts.find(account => account.id === accountId);
  };

  const getAccountsByCurrency = (currency: string): DerivAccount[] => {
    return data?.accounts.filter(account => account.currency === currency) || [];
  };

  const getAccountsByType = (type: 'real' | 'demo'): DerivAccount[] => {
    return data?.accounts.filter(account => account.accountType === type) || [];
  };

  useEffect(() => {
    loadData();
  }, []);

  // Computed values
  const accounts = data?.accounts || [];
  const hasData = accounts.length > 0;
  const realAccounts = accounts.filter(acc => acc.accountType === 'real');
  const demoAccounts = accounts.filter(acc => acc.accountType === 'demo');
  const currencies = [...new Set(accounts.map(acc => acc.currency))];
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const activeAccounts = accounts.filter(acc => acc.status === 'active');

  return {
    accounts,
    isLoading,
    error,
    hasData,
    realAccounts,
    demoAccounts,
    currencies,
    totalBalance,
    activeAccounts,
    refreshData,
    clearData,
    getAccountById,
    getAccountsByCurrency,
    getAccountsByType
  };
}

/**
 * Hook for managing a specific Deriv account
 */
export function useDerivAccount(accountId: string) {
  const { getAccountById, ...derivData } = useDeriv();
  
  const account = useMemo(() => {
    return getAccountById(accountId) || null;
  }, [accountId, getAccountById]);

  return {
    account,
    ...derivData
  };
}

/**
 * Hook for Deriv account statistics
 */
export function useDerivStats() {
  const { accounts, realAccounts, demoAccounts, currencies, totalBalance, activeAccounts } = useDeriv();

  return {
    totalAccounts: accounts.length,
    realAccountsCount: realAccounts.length,
    demoAccountsCount: demoAccounts.length,
    currenciesCount: currencies.length,
    totalBalance,
    activeAccountsCount: activeAccounts.length,
    inactiveAccountsCount: accounts.length - activeAccounts.length,
    // Additional stats
    averageBalance: accounts.length > 0 ? totalBalance / accounts.length : 0,
    hasRealAccounts: realAccounts.length > 0,
    hasDemoAccounts: demoAccounts.length > 0,
    hasMultipleCurrencies: currencies.length > 1,
    mostCommonCurrency: currencies.length > 0 ? 
      currencies.reduce((a, b, _, arr) => 
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
      ) : null
  };
}
