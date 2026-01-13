import axios from 'axios';
import { 
  BotConfiguration, 
  BotInstance, 
  CreateBotResponse, 
  UpdateBotResponse, 
  DeleteBotResponse, 
  GetBotsResponse, 
  GetBotResponse,
  StartBotResponse,
  StopBotResponse 
} from '../types/bot';

const API_BASE_URL = 'http://localhost:3051/v1';


const tokens = JSON.parse( String(localStorage.getItem('tokens')) );

if (tokens && tokens.access) {
    console.warn("API CONFIG", tokens.access.token);
}

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse( String(localStorage.getItem('tokens')) );
    if (tokens) {
      config.headers.Authorization = `Bearer ${tokens.access.token}`;
    }
    console.warn("API CONFIG", config)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not on login page (to prevent redirect loops and allow proper error handling)
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('app_params');
        localStorage.removeItem('app_auth');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
}

export interface ForgotPasswordData {
  email: string;
}

export interface User {
  role: string;
  meta: {
    status: string;
  };
  isEmailVerified: boolean;
  isActivated: boolean;
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  email: string;
  phoneNumber: string;
  gender: string;
  accounts: {
    firebase: {
      displayName: string;
      photoURL: string | false;
      phoneNumber: string | false;
      email: string;
    };
    identities: {
      uuid: string;
      uid: string;
      mid: string;
      fid: string;
      did: string | false;
      tid: string | false;
    };
  };
}

export interface Tokens {
  access: {
    token: string;
    expires: string;
  };
  refresh: {
    token: string;
    expires: string;
  };
}

export interface RegisterResponse {
  user: User;
  tokens: Tokens;
}

export interface LoginResponse {
  user: User;
  tokens: Tokens;
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

export interface LoginWithFirebaseTokenData {
  firebaseToken: string;
}

export interface LoginWithFirebaseTokenResponse {
  user: User;
  tokens: Tokens;
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

export interface LinkGoogleAccountResponse {
  success: boolean;
  message: string;
  user?: User;
}

export const authAPI = {
  register: async (userData: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  loginWithToken: async (token: string): Promise<LoginWithTokenResponse> => {
    const response = await api.post('/auth/login-with-native-token', { token });
    return response.data;
  },
  
  loginWithFirebaseToken: async (token: string): Promise<LoginWithFirebaseTokenResponse> => {
    const response = await api.post('/auth/login-with-firebase-token', { token });
    return response.data;
  },
  
  loginWithGoogleAccountToken: async (token: string): Promise<LoginWithFirebaseTokenResponse> => {
    const response = await api.post('/auth/login-with-google-account-token', { token });
    return response.data;
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
    const response = await api.post(`/auth/verify-email?token=${token}`);
    return response.data;
  },
  
  refreshToken: async (): Promise<LoginWithTokenResponse> => {
    const response = await api.post('/auth/refresh-token');
    return response.data;
  },
  
  updateUserProfile: async (profileData: { photoURL?: string; [key: string]: any }): Promise<{ success: boolean; user?: User; error?: string }> => {
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
  
  unLinkGoogleAccount: async (): Promise<LinkGoogleAccountResponse> => {
    try {
      const response = await api.post('/auth/unlink-google-account', 
          {payload: {
            key: "accounts.google.isAccountLinked", value: false
          }});
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unlink Google account'
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
