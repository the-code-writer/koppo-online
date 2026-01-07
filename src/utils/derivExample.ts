/**
 * @file: derivExample.ts
 * @description: Example usage of Deriv URL parser
 */

import { processDerivUrl, getDerivDataFromLocalStorage, getAccountByNumber, getAllAccountsSorted } from './derivUrlParser';

// Example URL from the docs
const derivUrl = "https://koppo-ai.vercel.app/?acct1=CR2029443&token1=a1-SeELadC8eBxvkygmhdZ3Rwi8L632k&cur1=USDC&acct2=CR518993&token2=a1-iilvdtV8s0gPIYqH7wFgPRojkFlkn&cur2=USD&acct3=CR528370&token3=a1-9CTgLksiylMIHOOC9lmBMIZ9B0s6v&cur3=BTC&acct4=CR528372&token4=a1-NdB2dFsn217DJeCj8G6lVXl6sTfzu&cur4=LTC&acct5=CR8424472&token5=a1-YhLLEP7dT5MfN8NBFB5o6aiK4FnxC&cur5=eUSDT&acct6=CR9452662&token6=a1-en1tb4O3LgkBcPiXDhrFwKziqg2Am&cur6=tUSDT&acct7=CR9452665&token7=a1-5sQSsocVroBen3vY7Nnx0hE08N1Jv&cur7=XRP&acct8=CR982988&token8=a1-RAKsJtjFZNqsGc1d8gTymoFbaYXrw&cur8=ETH&acct9=VRTC1605087&token9=a1-bU9XdPS70dEk8LTmiKWciKLi0NpOy&cur9=USD";

/**
 * Example function to demonstrate Deriv URL parsing
 */
export function exampleUsage() {
  try {
    // Parse the URL and save to localStorage
    const parsedData = processDerivUrl(derivUrl);
    
    console.log('Parsed Deriv Data:', parsedData);
    console.log('Number of accounts:', parsedData.accounts.length);
    
    // Get specific account
    const specificAccount = getAccountByNumber('CR2029443');
    console.log('Specific Account:', specificAccount);
    
    // Get all accounts sorted
    const sortedAccounts = getAllAccountsSorted();
    console.log('Sorted Accounts:', sortedAccounts);
    
    // Retrieve from localStorage
    const storedData = getDerivDataFromLocalStorage();
    console.log('Stored Data:', storedData);
    
    return parsedData;
  } catch (error) {
    console.error('Error processing Deriv URL:', error);
    return null;
  }
}

/**
 * Simple function to parse any Deriv URL string
 * @param urlString - The URL string to parse
 * @returns The parsed data object
 */
export function parseDerivUrlString(urlString: string) {
  return processDerivUrl(urlString);
}
