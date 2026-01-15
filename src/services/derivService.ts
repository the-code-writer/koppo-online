/**
 * @file: derivService.ts
 * @description: Service for handling Deriv account linking operations
 * 
 * @dependencies:
 *   - apiService: For making HTTP requests to the API
 *   - API_ENDPOINTS: For endpoint constants
 * @usage:
 *   import { linkDerivAccount } from '../services/derivService';
 *   
 *   const result = await linkDerivAccount(fullAccountData);
 */

import { apiService } from './api/apiService';
import { API_ENDPOINTS } from '../config/api.config';

export interface DerivAccountLinkRequest {
  fullAccount: {
    loginId: string;
    fullname: string;
    email: string;
    country: string;
    currency: string;
    createdAt: number;
    scopes: string[];
    tokens: string[];
    parsedFromUrl?: string;
  };
  userId: string;
  linkedAt: string;
}

export interface DerivAccountLinkResponse {
  success: boolean;
  message: string;
  accountId?: string;
  error?: string;
}

/**
 * Links a Deriv account to the user's account
 * @param accountData - The full account data from Deriv
 * @param userId - The user ID to link the account to
 * @returns Promise with the link result
 */
export const linkDerivAccount = async (
  fullAccount: DerivAccountLinkRequest['fullAccount'],
  userId: string
): Promise<DerivAccountLinkResponse> => {
  try {
    const requestData: DerivAccountLinkRequest = {
      fullAccount,
      userId,
      linkedAt: new Date().toISOString()
    };

    console.log('Linking Deriv account with data:', {
      loginId: fullAccount.loginId,
      fullname: fullAccount.fullname,
      userId,
      linkedAt: requestData.linkedAt
    });

    const response = await apiService.post<DerivAccountLinkResponse>(
      API_ENDPOINTS.LINK_DERIV_ACCOUNT,
      requestData
    );

    console.log('Deriv account link response:', response);
    return response;
  } catch (error: any) {
    console.error('Error linking Deriv account:', error);
    
    // Return a structured error response
    return {
      success: false,
      message: 'Failed to link Deriv account',
      error: error.message || 'Unknown error occurred'
    };
  }
};
