import { useState, useEffect, useMemo, useCallback } from 'react';
import { DerivAccount } from '../utils/DerivAuth';
import DerivAPIBasic from "@deriv/deriv-api/dist/DerivAPIBasic.js";
import { useAuth } from '../contexts/AuthContext';

// Import interfaces from the page or define them here
interface DerivAccountInfo {
  account_category: string;
  account_type: string;
  broker: string;
  created_at: number;
  currency: string;
  currency_type: string;
  is_disabled: number;
  is_virtual: number;
  landing_company_name: string;
  linked_to: any[];
  loginid: string;
}

interface DerivAuthorizeResponse {
  authorize: {
    account_list: DerivAccountInfo[];
    balance: number;
    country: string;
    currency: string;
    email: string;
    fullname: string;
    is_virtual: number;
    landing_company_fullname: string;
    landing_company_name: string;
    linked_to: any[];
    local_currencies: Record<string, any>;
    loginid: string;
    preferred_language: string;
    scopes: string[];
    upgradeable_landing_companies: any[];
    user_id: number;
  };
  echo_req: {
    authorize: string;
    req_id: number;
  };
  msg_type: string;
  req_id: number;
}

export interface EnhancedAccount {
  id: string;
  token: string;
  currency: string;
  currencyType: string;
  balance?: number;
  status?: string;
  isDisabled: boolean;
  isVirtual: boolean;
  isActive: boolean;
  createdAt?: number;
}

export interface FullAccount {
  accountList: EnhancedAccount[];
  createdAt?: number;
  language?: string;
  currency?: string;
  loginId?: string;
  userId?: string;
  email?: string;
  fullname?: string;
  country?: string;
  scopes?: string[];
  parsedFromUrl?: string;
  accountLinkedTime?: string;
}

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
  updateAccountStatus: (accountId: string, status: 'active' | 'disabled') => Promise<boolean>;
  // New authorization methods
  authorizeWithToken: (token: string) => Promise<{ enhancedAccounts: EnhancedAccount[]; fullAccount: FullAccount } | null>;
  parseAndAuthorizeFromUrl: (url: string) => Promise<{ enhancedAccounts: EnhancedAccount[]; fullAccount: FullAccount } | null>;
  enhancedAccounts: EnhancedAccount[];
  fullAccount: FullAccount | null;
  isAuthorizing: boolean;
}

/**
 * Custom hook for managing Deriv account data from local storage
 */
export function useDeriv(): UseDerivReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Derive fullAccount and enhancedAccounts from user.accounts.deriv
  const fullAccount = useMemo(() => {
    return user?.accounts?.deriv || null;
  }, [user?.accounts?.deriv]);

  const enhancedAccounts = useMemo(() => {
    return fullAccount?.accountList || [];
  }, [fullAccount]);

  // Create accounts array from enhancedAccounts for backward compatibility
  const accounts = useMemo(() => {
    return enhancedAccounts.map(account => ({
      id: account.id,
      token: account.token,
      currency: account.currency,
      currencyType: account.currencyType,
      balance: account.balance || 0,
      status: account.status || 'active',
      isDisabled: account.isDisabled,
      isVirtual: account.isVirtual,
      isActive: account.isActive,
      createdAt: account.createdAt
    }));
  }, [enhancedAccounts]);

  const clearData = () => {
    // Data is managed by user context, no need to clear localStorage
    console.log('Clear data called - data managed by user context');
  };

  const refreshData = () => {
    // Data is managed by user context, trigger refresh by calling authAPI.getProfile
    console.log('Refresh data called - data managed by user context');
  };

  const getAccountById = (accountId: string): DerivAccount | undefined => {
    return accounts.find(account => account.id === accountId);
  };

  const getAccountsByCurrency = (currency: string): DerivAccount[] => {
    return accounts.filter(account => account.currency === currency) || [];
  };

  const getAccountsByType = (type: 'real' | 'demo'): DerivAccount[] => {
    return accounts.filter(account => 
      type === 'real' ? account.isVirtual === false : account.isVirtual === true
    ) || [];
  };

  const updateAccountStatus = async (accountId: string, status: 'active' | 'disabled'): Promise<boolean> => {
    console.log('updateAccountStatus called - this would need to update user context');
    // This would need to update the user context through authAPI
    // For now, return false as this is not implemented with user context approach
    return false;
  };

  const authorizeWithToken = useCallback(async (token: string): Promise<{ enhancedAccounts: EnhancedAccount[]; fullAccount: FullAccount } | null> => {
    try {
      setIsAuthorizing(true);
      setError(null);

      // Create WebSocket connection
      const connection = new WebSocket(
        `wss://ws.derivws.com/websockets/v3?app_id=111480`
      );
      const api = new DerivAPIBasic({ connection: connection });
      
      // Wait for connection to open
      await new Promise((resolve) => {
        if (connection.readyState === WebSocket.OPEN) {
          resolve(null);
        } else {
          connection.addEventListener('open', () => resolve(null));
        }
      });
      
      // Authorize with token
      const tokenAccount: DerivAuthorizeResponse = await api.authorize(token);
      console.log("Authorization successful", tokenAccount);
      
      // Parse the authorize response
      const authData = tokenAccount.authorize;
      
      // Create enhanced accounts array
      const enhancedAccountsData: EnhancedAccount[] = authData.account_list.map(account => ({
        id: account.loginid,
        token: token, // Use the authorized token for all accounts
        currency: account.currency,
        currencyType: account.currency_type,
        balance: 0, // Will be fetched separately if needed
        status: account.is_disabled ? 'disabled' : 'active',
        isDisabled: account.is_disabled === 1,
        isVirtual: account.is_virtual === 1,
        isActive: account.is_disabled === 0,
        createdAt: account.created_at
      }));

      // Create full account object
      const fullAccountData: FullAccount = {
        accountList: enhancedAccountsData,
        createdAt: authData.account_list.find(acc => acc.loginid === authData.loginid)?.created_at,
        language: authData.preferred_language,
        currency: authData.currency,
        loginId: authData.loginid,
        userId: authData.user_id.toString(),
        email: authData.email,
        fullname: authData.fullname,
        country: authData.country,
        scopes: authData.scopes
      };
      
      console.log("Enhanced accounts:", enhancedAccountsData);
      console.log("Full account:", fullAccountData);
      
      // Close connection
      connection.close();
      
      return { enhancedAccounts: enhancedAccountsData, fullAccount: fullAccountData };
      
    } catch (apiError: any) {
      console.error("Error authorizing with token:", apiError);
      setError(apiError.message || 'Failed to authorize with token');
      return null;
    } finally {
      setIsAuthorizing(false);
    }
  }, [setError, setIsAuthorizing]);

  const parseAndAuthorizeFromUrl = useCallback(async (url: string): Promise<{ enhancedAccounts: EnhancedAccount[]; fullAccount: FullAccount } | null> => {
    try {
      setIsAuthorizing(true);
      setError(null);

      // Import DerivAuth dynamically to avoid circular dependencies
      const { DerivAuth } = await import('../utils/DerivAuth');
      
      // Parse accounts from the URL
      const result = DerivAuth.parseAccountUrl(url);

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse Deriv accounts from URL');
      }

      console.log("result.accounts", result.accounts);

      // Get additional user information from Deriv API using token from accounts array index 1
      if (result.accounts && result.accounts.length > 1) {
        const targetAccount = result.accounts[1];
        const token = targetAccount.token;
        
        console.log("Getting account details for account:", targetAccount.id);
        
        const authResult = await authorizeWithToken(token);

        if (authResult) {
          // Add parsedFromUrl to fullAccount
          const updatedFullAccount = {
            ...authResult.fullAccount,
            parsedFromUrl: url
          };
          
          return { 
            enhancedAccounts: authResult.enhancedAccounts, 
            fullAccount: updatedFullAccount 
          };
        }
      }
      
      return null;
      
    } catch (error: any) {
      console.error("Error parsing and authorizing from URL:", error);
      setError(error.message || 'Failed to parse and authorize from URL');
      return null;
    } finally {
      setIsAuthorizing(false);
    }
  }, [authorizeWithToken, setError, setIsAuthorizing]);

  // Computed values
  const hasData = accounts.length > 0;
  const realAccounts = accounts.filter(acc => acc.isVirtual === false);
  const demoAccounts = accounts.filter(acc => acc.isVirtual === true);
  const currencies = [...new Set(accounts.map(acc => acc.currency))];
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const activeAccounts = accounts.filter(acc => acc.status === 'active');

  // Set loading to false since we're using user context
  useEffect(() => {
    setIsLoading(false);
  }, []);

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
    getAccountsByType,
    updateAccountStatus,
    // Authorization methods
    authorizeWithToken,
    parseAndAuthorizeFromUrl,
    enhancedAccounts,
    fullAccount,
    isAuthorizing
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