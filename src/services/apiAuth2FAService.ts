/**
 * @file: apiAuth2FAService.ts
 * @description: API service for Two-Factor Authentication operations including backup codes
 * 
 * @components:
 *   - Auth2FAService class: Service for 2FA API operations
 *   - apiAuth2FAService export: Singleton instance
 * 
 * @dependencies:
 *   - apiService: Base API service for HTTP requests
 * 
 * @usage:
 *   // Generate backup codes
 *   const response = await apiAuth2FAService.generateBackupCodes();
 * 
 *   // List backup codes
 *   const codes = await apiAuth2FAService.listBackupCodes();
 */

import { apiService } from './api';

export interface BackupCode {
  code: string;
  createdAt: string;
}

export interface GenerateBackupCodesResponse {
  message: string;
  codes: string[];
  count: number;
}

export interface ListBackupCodesResponse {
  message: string;
  codes: BackupCode[];
  count: number;
}

export interface GenerateAuthenticatorSecretResponse {
  message: string;
  secret: string;
  qrCode: string;
  otpAuthUrl: string;
}

export interface VerifyAuthenticatorOTPRequest {
  otp: string;
}

export interface VerifyAuthenticatorOTPResponse {
  message: string;
  verified: boolean;
}

export interface SetAuthenticatorDefaultResponse {
  message: string;
}

export interface Disable2FAMethodRequest {
  method: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'AUTHENTICATOR';
}

export interface Disable2FAMethodResponse {
  message: string;
  method: string;
  disabled: boolean;
}

export interface SendWhatsAppOTPRequest {
  phoneNumber?: string;
}

export interface SendWhatsAppOTPResponse {
  message: string;
  expiresIn: string;
  phoneNumber: string;
}

export interface VerifyWhatsAppOTPRequest {
  otp: string;
}

export interface VerifyWhatsAppOTPResponse {
  message: string;
  verified: boolean;
}

export interface SetWhatsAppDefaultResponse {
  message: string;
  method: string;
}

export interface SendSMSOTPRequest {
  phoneNumber?: string;
}

export interface SendSMSOTPResponse {
  message: string;
  expiresIn: string;
  phoneNumber: string;
}

export interface VerifySMSOTPRequest {
  otp: string;
}

export interface VerifySMSOTPResponse {
  message: string;
  verified: boolean;
}

export interface SetSMSDefaultResponse {
  message: string;
  method: string;
}

class Auth2FAService {
  private static instance: Auth2FAService;

  private constructor() {}

  public static getInstance(): Auth2FAService {
    if (!Auth2FAService.instance) {
      Auth2FAService.instance = new Auth2FAService();
    }
    return Auth2FAService.instance;
  }

  /**
   * Generate new backup codes
   * @returns Promise<GenerateBackupCodesResponse>
   */
  async generateBackupCodes(): Promise<GenerateBackupCodesResponse> {
    try {
      const response = await apiService.post<GenerateBackupCodesResponse>(
        '/auth/2fa/backup-codes/generate',
        {}
      );
      return response;
    } catch (error) {
      console.error('Error generating backup codes:', error);
      throw error;
    }
  }

  /**
   * List active backup codes
   * @returns Promise<ListBackupCodesResponse>
   */
  async listBackupCodes(): Promise<ListBackupCodesResponse> {
    try {
      const response = await apiService.get<ListBackupCodesResponse>(
        '/auth/2fa/backup-codes/list'
      );
      return response;
    } catch (error) {
      console.error('Error listing backup codes:', error);
      throw error;
    }
  }

  /**
   * Generate authenticator secret and QR code
   * @returns Promise<GenerateAuthenticatorSecretResponse>
   */
  async generateAuthenticatorSecret(): Promise<GenerateAuthenticatorSecretResponse> {
    try {
      const response = await apiService.post<GenerateAuthenticatorSecretResponse>(
        '/auth/2fa/authenticator/generate-secret',
        {}
      );
      return response;
    } catch (error) {
      console.error('Error generating authenticator secret:', error);
      throw error;
    }
  }

  /**
   * Verify authenticator OTP code
   * @param otp - The 6-digit OTP code
   * @returns Promise<VerifyAuthenticatorOTPResponse>
   */
  async verifyAuthenticatorOTP(otp: string): Promise<VerifyAuthenticatorOTPResponse> {
    try {
      const response = await apiService.post<VerifyAuthenticatorOTPResponse>(
        '/auth/2fa/authenticator/verify-otp',
        { otp }
      );
      return response;
    } catch (error) {
      console.error('Error verifying authenticator OTP:', error);
      throw error;
    }
  }

  /**
   * Set authenticator as default 2FA method
   * @returns Promise<SetAuthenticatorDefaultResponse>
   */
  async setAuthenticatorAsDefault(): Promise<SetAuthenticatorDefaultResponse> {
    try {
      const response = await apiService.post<SetAuthenticatorDefaultResponse>(
        '/auth/2fa/authenticator/set-as-default',
        {}
      );
      return response;
    } catch (error) {
      console.error('Error setting authenticator as default:', error);
      throw error;
    }
  }

  /**
   * Disable a 2FA method
   * @param method - The 2FA method to disable (SMS, WHATSAPP, EMAIL, AUTHENTICATOR)
   * @returns Promise<Disable2FAMethodResponse>
   */
  async disable2FAMethod(method: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'AUTHENTICATOR'): Promise<Disable2FAMethodResponse> {
    try {
      const response = await apiService.post<Disable2FAMethodResponse>(
        '/v1/auth/2fa/disable',
        { method }
      );
      return response;
    } catch (error) {
      console.error(`Error disabling ${method} 2FA:`, error);
      throw error;
    }
  }

  /**
   * Send WhatsApp OTP
   * @param phoneNumber - Optional phone number, uses user's phone if not provided
   * @returns Promise<SendWhatsAppOTPResponse>
   */
  async sendWhatsAppOTP(phoneNumber?: string): Promise<SendWhatsAppOTPResponse> {
    try {
      const response = await apiService.post<SendWhatsAppOTPResponse>(
        '/auth/2fa/whatsapp/send-otp',
        phoneNumber ? { phoneNumber } : {}
      );
      return response;
    } catch (error) {
      console.error('Error sending WhatsApp OTP:', error);
      throw error;
    }
  }

  /**
   * Verify WhatsApp OTP
   * @param otp - The 6-digit OTP code
   * @returns Promise<VerifyWhatsAppOTPResponse>
   */
  async verifyWhatsAppOTP(otp: string): Promise<VerifyWhatsAppOTPResponse> {
    try {
      const response = await apiService.post<VerifyWhatsAppOTPResponse>(
        '/auth/2fa/whatsapp/verify-otp',
        { otp }
      );
      return response;
    } catch (error) {
      console.error('Error verifying WhatsApp OTP:', error);
      throw error;
    }
  }

  /**
   * Set WhatsApp as default 2FA method
   * @returns Promise<SetWhatsAppDefaultResponse>
   */
  async setWhatsAppAsDefault(): Promise<SetWhatsAppDefaultResponse> {
    try {
      const response = await apiService.post<SetWhatsAppDefaultResponse>(
        '/auth/2fa/whatsapp/set-as-default',
        {}
      );
      return response;
    } catch (error) {
      console.error('Error setting WhatsApp as default:', error);
      throw error;
    }
  }

  /**
   * Send SMS OTP
   * @param phoneNumber - Optional phone number, uses user's phone if not provided
   * @returns Promise<SendSMSOTPResponse>
   */
  async sendSMSOTP(phoneNumber?: string): Promise<SendSMSOTPResponse> {
    try {
      const response = await apiService.post<SendSMSOTPResponse>(
        '/auth/2fa/sms/send-otp',
        phoneNumber ? { phoneNumber } : {}
      );
      return response;
    } catch (error) {
      console.error('Error sending SMS OTP:', error);
      throw error;
    }
  }

  /**
   * Verify SMS OTP
   * @param otp - The 6-digit OTP code
   * @returns Promise<VerifySMSOTPResponse>
   */
  async verifySMSOTP(otp: string): Promise<VerifySMSOTPResponse> {
    try {
      const response = await apiService.post<VerifySMSOTPResponse>(
        '/auth/2fa/sms/verify-otp',
        { otp }
      );
      return response;
    } catch (error) {
      console.error('Error verifying SMS OTP:', error);
      throw error;
    }
  }

  /**
   * Set SMS as default 2FA method
   * @returns Promise<SetSMSDefaultResponse>
   */
  async setSMSAsDefault(): Promise<SetSMSDefaultResponse> {
    try {
      const response = await apiService.post<SetSMSDefaultResponse>(
        '/auth/2fa/sms/set-as-default',
        {}
      );
      return response;
    } catch (error) {
      console.error('Error setting SMS as default:', error);
      throw error;
    }
  }
}

export const apiAuth2FAService = Auth2FAService.getInstance();
