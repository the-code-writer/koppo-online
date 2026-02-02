/**
 * @file: apiService.ts
 * @description: Centralized API service that handles HTTP requests with Axios,
 *               including request/response interceptors, authentication, and error handling.
 *
 * @components:
 *   - ApiService class: Singleton service for HTTP requests
 *   - apiService export: Singleton instance
 * @dependencies:
 *   - axios: HTTP client library
 *   - API_CONFIG: Configuration for API endpoints and settings
 *   - authStore: Authentication state store for headers
 * @usage:
 *   // GET request
 *   const data = await api.service.get<ResponseType>('/endpoint', { param: 'value' });
 *
 *   // POST request
 *   const result = await api.service.post<ResponseType>('/endpoint', { data: 'value' });
 *
 * @architecture: Singleton pattern with interceptors and generic request methods
 * @relationships:
 *   - Used by: Various services and components that need API access
 *   - Depends on: authStore for authentication headers
 * @dataFlow:
 *   - Input: Request parameters, data, and headers
 *   - Processing: Adds auth headers, logs requests/responses, handles errors
 *   - Output: Typed response data or error rejection
 *
 * @ai-hints: This service implements the Singleton pattern to ensure a single
 *            instance is used throughout the application. All HTTP methods are
 *            typed with generics for type-safe responses.
 */
import axios, { AxiosInstance, AxiosError, AxiosResponse, RawAxiosRequestHeaders } from 'axios';
import {
  BotConfiguration,
  CreateBotResponse,
  UpdateBotResponse,
  DeleteBotResponse,
  GetBotsResponse,
  GetBotResponse,
  StartBotResponse,
  StopBotResponse
} from '../types/bot';
import { envConfig } from '../config/env.config';
import { CookieUtils } from '../utils/use-cookies/cookieTracker';
import { deviceEncryption } from '../utils/deviceUtils';
import { apiService } from './api/apiService';

// Simple deserialize function
const deserialize = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// Simplified function to get access token with better error handling
export const getAccessToken = async (): Promise<string | null> => {
  try {
    // Try to get tokens from cookies first
    let tokensCookie = CookieUtils.getCookie('tokens');
    
    // Fallback to localStorage if cookies fail
    if (!tokensCookie) {
      tokensCookie = localStorage.getItem('tokens');
    }
    
    if (!tokensCookie) {
      return null;
    }
    
    const tokensCookieObject = deserialize(tokensCookie);
    if (!tokensCookieObject?.access) {
      return null;
    }
    
    // If token is not encrypted, return it directly
    if (!tokensCookieObject.access.isEncrypted) {
      return tokensCookieObject.access.token || null;
    }
    
    // For encrypted tokens, try to decrypt
    const deviceKeys = CookieUtils.getCookie('deviceKeys') || localStorage.getItem('deviceKeys');
    if (!deviceKeys) {
      return null;
    }
    
    const deviceKeysCookieObject = deserialize(deviceKeys);
    if (!deviceKeysCookieObject?.privateKey) {
      return null;
    }
    
    const accessToken = tokensCookieObject.access.token;
    if (!accessToken) {
      return null;
    }
    
    // Prepare payload for decryption
    const modifiedPayload = {
      encryptedAESKey: accessToken.encryptedAESKeyWithRSA,
      iv: accessToken.iv,
      encryptedData: accessToken.encryptedData
    };
    
    // Decrypt the token
    const devicePrivateKey = String(deviceKeysCookieObject.privateKey).trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    
    const decryptedToken = await deviceEncryption.hybridDecrypt(
      JSON.stringify(modifiedPayload), 
      devicePrivateKey
    );
    
    return decryptedToken;
    
  } catch {
    // Final fallback - try direct localStorage access
    return localStorage.getItem('access_token');
  }
};

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: envConfig.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  async (config) => {
    if (!config.params) {
      config.params = {};
    }

    config.params = addCommonParams(config.params);
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Only redirect if not on login page (to prevent redirect loops and allow proper error handling)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/verify-email' && window.location.pathname !== '/register' && window.location.pathname !== '/register-device') {
        // TODO: remove saved data
        //CookieUtils.deleteCookie('tokens');
        //CookieUtils.deleteCookie('user_data');
        //localStorage.removeItem('tokens');
        //localStorage.removeItem('user_data');
        //window.location.href = '/login';
      }
    } else if (error.response?.status === 400) {
      console.error('API: Bad request - Check request parameters');
    } else if (error.response?.status === 404) {
      console.error('API: Resource not found');
    } else if (error.response?.status === 500) {
      console.error('API: Server error');
    }

    // Implement retry logic for transient errors
    if (error.response?.status === 429 || error.response?.status === 503) {
      console.warn('API: Rate limited or service unavailable, will retry');
      // Retry logic would be implemented here
    }
    return Promise.reject(error);
  }
);

const mergeHeaders = (customHeaders?: RawAxiosRequestHeaders): RawAxiosRequestHeaders => {
  // Default headers
  const requiredHeaders: RawAxiosRequestHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json'
  };

  // Add any custom headers, which will override the defaults if there are duplicates
  return {
    ...requiredHeaders,
    ...customHeaders,
  };
}

const addCommonParams = (params?: object): object => {
  return {
    ...params,
  };
}

export const apiService = {

  async get<T>(url: string, params?: object, headers?: RawAxiosRequestHeaders): Promise<T> {
    const response: AxiosResponse<T> = await api.get(url, {
      params: addCommonParams(params),
      headers: mergeHeaders(headers)
    });
    return response.data;
  },

  async post<T>(url: string, data?: object, headers?: RawAxiosRequestHeaders, params?: object): Promise<T> {
    const response: AxiosResponse<T> = await api.post(url, data, {
      params: addCommonParams(params),
      headers: mergeHeaders(headers)
    });
    return response.data;
  },

  async put<T>(url: string, data?: object, headers?: RawAxiosRequestHeaders, params?: object): Promise<T> {
    const response: AxiosResponse<T> = await api.put(url, data, {
      params: addCommonParams(params),
      headers: mergeHeaders(headers)
    });
    return response.data;
  },

  async delete<T>(url: string, headers?: RawAxiosRequestHeaders, params?: object): Promise<T> {
    const response: AxiosResponse<T> = await api.delete(url, {
      params: addCommonParams(params),
      headers: mergeHeaders(headers)
    });
    return response.data;
  },

  async patch<T>(url: string, data?: object, headers?: RawAxiosRequestHeaders, params?: object): Promise<T> {
    const response: AxiosResponse<T> = await api.patch(url, data, {
      params: addCommonParams(params),
      headers: mergeHeaders(headers)
    });
    return response.data;
  },

}

export interface RegisterData {
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface User {
  role: string;
  meta: {
    status: string;
  };
  isKYCVerified: boolean;
  isEmailVerified: boolean;
  isActivated: boolean;
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: string;
  accounts: HybridEncryptedPayload;
}

export interface HybridEncryptedPayload {
  encryptedAESKey: string;
  iv: string;
  encryptedData: string;
}

export interface TokenItem {
  token: HybridEncryptedPayload;
  expires: string;
}

export interface Tokens {
  access: TokenItem;
  refresh: TokenItem;
}

export interface RegisterResponse {
  user: User;
  tokens: Tokens;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: Tokens;
}

export interface EnhancedLoginResponse {
  success: boolean;
  message: string;
  data: {
    user: { profile: User, accounts: any };
    tokens: Tokens;
  }
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    email: string;
  };
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface LoginWithTokenResponse {
  user: User;
  tokens: Tokens;
}

export interface VerifyPhoneAuthData {
  phoneNumber: string;
  code: string;
}

export interface InitiatePhoneAuthData {
  phoneNumber: string;
}

export interface LoginWithFirebaseTokenResponse {
  user: User;
  tokens: Tokens;
}

export interface LinkTelegramAccountData {
  uid: string;
  email: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerId: string;
  token: string;
  displayName?: string;
  photoURL?: string;
}

export interface LinkGoogleAccountData {
  uid: string;
  email: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerId: string;
  token: string;
  displayName?: string;
  photoURL?: string;
}

export interface LinkDerivAccountData {
  uid: string;
  email: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerId: string;
  token: string;
  displayName?: string;
  photoURL?: string;
}

export interface LinkTelegramAccountResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface LinkGoogleAccountResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface LinkDerivAccountResponse {
  [x: string]: any;
  success: boolean;
  message: string;
  user?: User;
}

export interface TelegramAuthRequestResponse {
  code: string;
  expires: number;
  token: string;
}

export interface TelegramAuthCheckRequest {
  code: string;
}

export interface TelegramAuthCheckResponse {
  isAuthorized: boolean;
  isAccountLinked: boolean;
  authorizedTime: number | null;
  expires: number;
}

export const authAPI = {
  register: async (userData: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  enhancedLogin: async (credentials: LoginData, deviceId: string): Promise<EnhancedLoginResponse> => {
    const response = await api.post('/auth/enhanced-login', credentials, {
      headers: {
        'x-device-id': deviceId
      }
    });
    return response.data;
  },


  login: async (credentials: LoginData): Promise<EnhancedLoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  loginWithToken: async (token: string): Promise<LoginWithTokenResponse> => {
    const response = await api.post('/auth/login/native-token', { token });
    return response.data;
  },

  loginWithFirebaseToken: async (token: string): Promise<LoginWithFirebaseTokenResponse> => {
    const response = await api.post('/auth/login/firebase-token', { token });
    return response.data;
  },

  loginWithGoogleAccountToken: async (token: string): Promise<LoginWithFirebaseTokenResponse> => {
    const response = await api.post('/auth/login-with-google-account-token', { token });
    return response.data;
  },

  initiatePhoneAuth: async (phoneData: InitiatePhoneAuthData): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.post('/auth/initiate-phone-auth', phoneData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initiate phone authentication'
      };
    }
  },

  verifyPhoneAuth: async (verifyData: VerifyPhoneAuthData): Promise<EnhancedLoginResponse> => {
    try {
      const response = await api.post('/auth/verify-phone-auth', verifyData);
      return response.data;
    } catch {
      return {
        success: false,
        message: null as any,
        data: {
          user: null as any,
          tokens: null as any,
        }
      };
    }
  },

  forgotPassword: async (emailData: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
    const response = await api.post('/auth/forgot-password', emailData);

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Password reset instructions sent to your email'
      };
    }

    return response.data;
  },

  sendVerificationEmail: async (): Promise<ForgotPasswordResponse> => {
    const response = await api.post('/auth/send-verification-email');

    // Handle 204 No Content response
    if (response.status === 204) {
      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    }

    return response.data;
  },

  verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
    try {
      const response = await api.post(`/auth/verify-email?token=${token}`);

      // Handle 204 No Content response for successful verification
      if (response.status === 204) {
        return {
          success: true,
          message: 'Email verified successfully'
        };
      }

      return response.data;
    } catch (error: any) {
      // Handle error responses
      if (error.response?.status === 401) {
        return {
          success: false,
          message: error.response.data?.message || 'verify email failed'
        };
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Email verification failed'
      };
    }
  },

  refreshToken: async (): Promise<LoginWithTokenResponse> => {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },

  updateUserProfile: async (profileData: { photoURL?: string;[key: string]: any }): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const response = await api.patch('/auth/profile', profileData);
      return { success: true, user: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update profile'
      };
    }
  },

  linkTelegramAccount: async (telegramData: LinkTelegramAccountData): Promise<LinkTelegramAccountResponse> => {
    try {
      const response = await api.post('/auth/link-telegram-account', telegramData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to link Telegram account'
      };
    }
  },

  linkGoogleAccount: async (googleData: LinkGoogleAccountData): Promise<LinkGoogleAccountResponse> => {
    try {
      const response = await api.post('/auth/link-google-account', googleData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to link Google account'
      };
    }
  },

  linkDerivAccount: async (derivData: LinkDerivAccountData): Promise<LinkDerivAccountResponse> => {
    try {
      const response = await api.post('/auth/link-deriv-account', derivData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to link Deriv account'
      };
    }
  },

  unLinkTelegramAccount: async (): Promise<LinkTelegramAccountResponse> => {
    try {
      const response = await api.post('/auth/unlink-telegram-account',
        {
          payload: {
            key: "accounts.telegram.isAccountLinked", value: false
          }
        });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unlink Telegram account'
      };
    }
  },

  unLinkGoogleAccount: async (): Promise<LinkGoogleAccountResponse> => {
    try {
      const response = await api.post('/auth/unlink-google-account',
        {
          payload: {
            key: "accounts.google.isAccountLinked", value: false
          }
        });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unlink Google account'
      };
    }
  },

  unLinkDerivAccount: async (): Promise<LinkDerivAccountResponse> => {
    try {
      const response = await api.post('/auth/unlink-deriv-account',
        {
          payload: {
            key: "accounts.deriv.isAccountLinked", value: false
          }
        });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unlink Deriv account'
      };
    }
  },

  getProfile: async (): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const response = await api.get('/auth/profile');
      return { success: true, user: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch profile'
      };
    }
  },

  requestTelegramAuthorization: async (): Promise<TelegramAuthRequestResponse> => {
    const response = await api.post('/auth/request-telegram-authorization');
    return response.data;
  },

  checkTelegramAuthorization: async (code: string): Promise<TelegramAuthCheckResponse> => {
    const response = await api.post('/auth/check-telegram-authorization', { code });
    return response.data;
  },

  initiateHandshake: async (devicePublicKey: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await api.post('/devices/initiate-handshake', { devicePublicKey });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to register device'
      };
    }
  },

  completeHandshake: async (sessionId: string, devicePublicKey: string, encryptedDeviceToken: string, deviceData: any): Promise<{ success: boolean; message?: string }> => {

    console.log({ sessionId, devicePublicKey, encryptedDeviceToken, deviceData })

    try {
      const response = await api.post('/devices/complete-handshake', { sessionId, devicePublicKey, encryptedDeviceToken, deviceData });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to register device'
      };
    }
  },

};

export default api;

// Bot API endpoints
export const botAPI = {
  // Create a new bot
  createBot: async (configuration: BotConfiguration): Promise<CreateBotResponse> => {
    try {
      const response = await api.post('/bots', { configuration });
      return { success: true, bot: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create bot'
      };
    }
  },

  // Get all bots for the current user
  getBots: async (): Promise<GetBotsResponse> => {
    try {
      const response = await api.get('/bots');
      return { success: true, bots: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch bots'
      };
    }
  },

  // Get a single bot by ID
  getBot: async (botId: string): Promise<GetBotResponse> => {
    try {
      const response = await api.get(`/bots/${botId}`);
      return { success: true, bot: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch bot'
      };
    }
  },

  // Update a bot
  updateBot: async (botId: string, configuration: BotConfiguration): Promise<UpdateBotResponse> => {
    try {
      const response = await api.patch(`/bots/${botId}`, { configuration });
      return { success: true, bot: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update bot'
      };
    }
  },

  // Delete a bot
  deleteBot: async (botId: string): Promise<DeleteBotResponse> => {
    try {
      await api.delete(`/bots/${botId}`);
      return { success: true, message: 'Bot deleted successfully' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete bot'
      };
    }
  },

  // Start a bot
  startBot: async (botId: string): Promise<StartBotResponse> => {
    try {
      const response = await api.post(`/bots/${botId}/start`);
      return { success: true, sessionId: response.data.sessionId };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to start bot'
      };
    }
  },

  // Stop a bot
  stopBot: async (botId: string): Promise<StopBotResponse> => {
    try {
      await api.post(`/bots/${botId}/stop`);
      return { success: true, message: 'Bot stopped successfully' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to stop bot'
      };
    }
  },

  // Pause a bot
  pauseBot: async (botId: string): Promise<StopBotResponse> => {
    try {
      await api.post(`/bots/${botId}/pause`);
      return { success: true, message: 'Bot paused successfully' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to pause bot'
      };
    }
  },

  // Resume a bot
  resumeBot: async (botId: string): Promise<StartBotResponse> => {
    try {
      const response = await api.post(`/bots/${botId}/resume`);
      return { success: true, sessionId: response.data.sessionId };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to resume bot'
      };
    }
  },
};

// Strategy API endpoints (mirrors botAPI but with strategy terminology)
export const strategyAPI = {
  // Create a new strategy
  createStrategy: async (configuration: BotConfiguration): Promise<CreateBotResponse> => {
    try {
      const response = await api.post('/strategies', { configuration });
      return { success: true, strategy: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create strategy'
      };
    }
  },

  // Get all strategies for the current user
  getStrategies: async (): Promise<GetBotsResponse> => {
    try {
      const response = await api.get('/strategies');
      return { success: true, strategies: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch strategies'
      };
    }
  },

  // Get a single strategy by ID
  getStrategy: async (strategyId: string): Promise<GetBotResponse> => {
    try {
      const response = await api.get(`/strategies/${strategyId}`);
      return { success: true, strategy: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch strategy'
      };
    }
  },

  // Update a strategy
  updateStrategy: async (strategyId: string, configuration: BotConfiguration): Promise<UpdateBotResponse> => {
    try {
      const response = await api.patch(`/strategies/${strategyId}`, { configuration });
      return { success: true, strategy: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update strategy'
      };
    }
  },

  // Delete a strategy
  deleteStrategy: async (strategyId: string): Promise<DeleteBotResponse> => {
    try {
      await api.delete(`/strategies/${strategyId}`);
      return { success: true, message: 'Strategy deleted successfully' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete strategy'
      };
    }
  },

  // Start a strategy
  startStrategy: async (strategyId: string): Promise<StartBotResponse> => {
    try {
      const response = await api.post(`/strategies/${strategyId}/start`);
      return { success: true, sessionId: response.data.sessionId };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to start strategy'
      };
    }
  },

  // Stop a strategy
  stopStrategy: async (strategyId: string): Promise<StopBotResponse> => {
    try {
      await api.post(`/strategies/${strategyId}/stop`);
      return { success: true, message: 'Strategy stopped successfully' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to stop strategy'
      };
    }
  },

  // Pause a strategy
  pauseStrategy: async (strategyId: string): Promise<StopBotResponse> => {
    try {
      await api.post(`/strategies/${strategyId}/pause`);
      return { success: true, message: 'Strategy paused successfully' };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to pause strategy'
      };
    }
  },

  // Resume a strategy
  resumeStrategy: async (strategyId: string): Promise<StartBotResponse> => {
    try {
      const response = await api.post(`/strategies/${strategyId}/resume`);
      return { success: true, sessionId: response.data.sessionId };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to resume strategy'
      };
    }
  },
};
