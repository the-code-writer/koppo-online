/**
 * @file: derivUrlParser.ts
 * @description: Utility functions to parse Deriv URL parameters and manage account data
 */

interface DerivAccount {
  account: string;
  token: string;
  currency: string;
  balance: number;
}

interface ParsedDerivData {
  accounts: DerivAccount[];
  timestamp: number;
}

/**
 * Parses Deriv URL parameters and extracts account information
 * @param url - The URL containing Deriv account parameters
 * @returns Parsed account data with timestamp
 */
export function parseDerivUrl(url: string): ParsedDerivData {
  const accounts: DerivAccount[] = [];
  
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // Extract all account parameters
    let index = 1;
    while (true) {
      const acct = params.get(`acct${index}`);
      const token = params.get(`token${index}`);
      const cur = params.get(`cur${index}`);

      // Break if any required parameter is missing
      if (!acct || !token || !cur) break;

      accounts.push({
        account: acct,
        token: token,
        currency: cur,
        balance: 0.00 // Default balance, can be updated later
      });

      index++;
    }
  } catch (error) {
    console.error('Error parsing Deriv URL:', error);
    throw new Error('Invalid URL format');
  }

  return {
    accounts,
    timestamp: Date.now()
  };
}

/**
 * Saves parsed Deriv data to localStorage
 * @param data - The parsed Deriv account data
 */
export function saveDerivDataToLocalStorage(data: ParsedDerivData): void {
  try {
    localStorage.setItem('deriv_accounts', JSON.stringify(data));
    console.log('Deriv account data saved to localStorage:', data);
  } catch (error) {
    console.error('Error saving Deriv data to localStorage:', error);
    throw new Error('Failed to save data to localStorage');
  }
}

/**
 * Retrieves Deriv data from localStorage
 * @returns Parsed Deriv data or null if not found
 */
export function getDerivDataFromLocalStorage(): ParsedDerivData | null {
  try {
    const data = localStorage.getItem('deriv_accounts');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving Deriv data from localStorage:', error);
    return null;
  }
}

/**
 * Clears Deriv data from localStorage
 */
export function clearDerivDataFromLocalStorage(): void {
  try {
    localStorage.removeItem('deriv_accounts');
    console.log('Deriv account data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing Deriv data from localStorage:', error);
  }
}

/**
 * Complete function to parse Deriv URL and save to localStorage
 * @param url - The URL containing Deriv account parameters
 * @returns The parsed account data
 */
export function processDerivUrl(url: string): ParsedDerivData {
  const parsedData = parseDerivUrl(url);
  saveDerivDataToLocalStorage(parsedData);
  return parsedData;
}

/**
 * Gets a specific account by account number
 * @param accountNumber - The account number to find
 * @returns The account object or null if not found
 */
export function getAccountByNumber(accountNumber: string): DerivAccount | null {
  const data = getDerivDataFromLocalStorage();
  if (!data) return null;
  
  return data.accounts.find(acc => acc.account === accountNumber) || null;
}

/**
 * Gets all accounts sorted by currency
 * @returns Array of accounts sorted by currency
 */
export function getAllAccountsSorted(): DerivAccount[] {
  const data = getDerivDataFromLocalStorage();
  if (!data) return [];
  
  return [...data.accounts].sort((a, b) => a.currency.localeCompare(b.currency));
}

/**
 * Updates balance for a specific account
 * @param accountNumber - The account number to update
 * @param newBalance - The new balance value
 */
export function updateAccountBalance(accountNumber: string, newBalance: number): void {
  const data = getDerivDataFromLocalStorage();
  if (!data) return;
  
  const accountIndex = data.accounts.findIndex(acc => acc.account === accountNumber);
  if (accountIndex !== -1) {
    data.accounts[accountIndex].balance = newBalance;
    saveDerivDataToLocalStorage(data);
  }
}
