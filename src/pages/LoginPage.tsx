/**
 * @file: LoginPage.tsx
 * @description: Simple login page component that accepts any credentials
 *               and sets the authentication state without external validation.
 *
 * @components: LoginPage - Form with username and password fields
 * @dependencies:
 *   - React: useState for form state
 *   - antd: Form, Input, Button components for UI
 *   - useAuth: For authentication state management
 *   - useNavigate: For redirection after login
 * @usage:
 *   // In router configuration
 *   <Route path="/login" element={<LoginPage />} />
 *
 * @architecture: Presentational component with local form state
 * @relationships:
 *   - Used by: Router
 *   - Uses: AuthContext for authentication state
 * @dataFlow: Captures form input, updates auth state, redirects user
 */
import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  ConfigProvider,
  theme as antdTheme,
  Checkbox,
  Space,
  Card,
  Select,
  Row,
  Col,
  Radio,
  Modal,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { UserOutlined, LockOutlined, MailOutlined, ArrowLeftOutlined, PhoneOutlined, UserAddOutlined, GoogleOutlined } from "@ant-design/icons";
import { authAPI, RegisterData, LoginData, ForgotPasswordData, InitiatePhoneAuthData, VerifyPhoneAuthData } from "../services/api";
import logoSvg from "../assets/logo.png";
import "../styles/login.scss";
import { envConfig } from "../config/env.config";
import { Encryption } from "../utils/encryption";
import { GoogleAuthProvider, signInWithPopup, PhoneAuthProvider } from "firebase/auth";
import { auth } from "../firebase/config";
import app from "../firebase/config";
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

const { Title, Text } = Typography;

const countries = [
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+265', flag: '🇲🇼', name: 'Malawi' },
  { code: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: '+268', flag: '🇸🇿', name: 'Eswatini' },
  { code: '+290', flag: '🇸🇭', name: 'Saint Helena' },
  { code: '+247', flag: '🇦🇨', name: 'Ascension Island' },
];
const encryption = new Encryption();

// Test encryption (async)
const testEncryption = async () => {
  try {
    const txt = "U2FsdGVkX1%2BsXfadVLFQn4fwjIT%2BwFV32t4v3BzKsRA%3D";
    const enc1 = await encryption.aesEncrypt(txt);
    const enc2 = await encryption.aesDecrypt(enc1.encrypted, enc1.iv, enc1.salt, enc1.tag);
    console.log('=== Test 1: New Encryption ===');
    console.log('Original:', txt);
    console.log('Encrypted:', enc1);
    console.log('Decrypted:', enc2);
    console.log('Success:', txt === enc2);
  } catch (error) {
    console.error('Test 1 failed:', error);
  }
};

// Test decryption of existing encrypted string
const testDecryption = async () => {
  try {
    // URL decode the string first
    const encryptedString = decodeURIComponent("U2FsdGVkX1%2BsXfadVLFQn4fwjIT%2BwFV32t4v3BzKsRA%3D");
    console.log('=== Test 2: Decrypt Existing String ===');
    console.log('URL decoded:', encryptedString);
    
    // This looks like OpenSSL format - try to parse it
    // OpenSSL encrypted data usually starts with "Salted__" in base64
    const decoded = atob(encryptedString);
    console.log('Base64 decoded:', decoded);
    
    // Check if it has the OpenSSL salt prefix
    if (decoded.startsWith('Salted__')) {
      console.log('Detected OpenSSL format');
      const salt = decoded.substring(8, 16); // Next 8 bytes are salt
      const encryptedData = decoded.substring(16); // Rest is encrypted data
      console.log('Salt (hex):', Array.from(new TextEncoder().encode(salt)).map(b => b.toString(16).padStart(2, '0')).join(''));
      console.log('Encrypted data (hex):', Array.from(new TextEncoder().encode(encryptedData)).map(b => b.toString(16).padStart(2, '0')).join(''));
      
      // Try to decrypt with our current method (this might not work due to format differences)
      try {
        const decrypted = await encryption.aesDecrypt(
          Array.from(new TextEncoder().encode(encryptedData)).map(b => b.toString(16).padStart(2, '0')).join(''),
          Array.from(new TextEncoder().encode(salt)).map(b => b.toString(16).padStart(2, '0')).join(''),
          '', // No separate salt needed as it's included
          null,
          envConfig.VITE_APP_CRYPTOGRAPHIC_KEY
        );
        console.log('Decryption successful:', decrypted);
      } catch (decryptError) {
        console.log('Standard decryption failed - this is expected for OpenSSL format');
        console.log('Error:', decryptError instanceof Error ? decryptError.message : String(decryptError));
      }
    } else {
      console.log('Not OpenSSL format, trying direct decryption...');
      // Try direct decryption
      const decrypted = await encryption.simpleDecrypt(encryptedString, envConfig.VITE_APP_CRYPTOGRAPHIC_KEY);
      console.log('Direct decryption result:', decrypted);
    }
  } catch (error) {
    console.error('Test 2 failed:', error);
  }
};

// Run both tests
testEncryption();
testDecryption();


export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuthData, isAuthenticated, isLoading: authLoading } = useAuth();
  const { effectiveTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  // Phone authentication states
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showFirebaseUI, setShowFirebaseUI] = useState(false);
  const [firebaseUIVisible, setFirebaseUIVisible] = useState(false);
  const [authLoadingMessage, setAuthLoadingMessage] = useState('Initializing...');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER'
  });
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+263',
    flag: '🇿🇼',
    name: 'Zimbabwe'
  });

  // Initialize auth state and redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
    
    // Check if there's pending verification data
    const pendingVerification = localStorage.getItem('pendingVerification');
    if (pendingVerification) {
      try {
        const { user } = JSON.parse(pendingVerification);
        if (user && !user.isEmailVerified) {
          setShowEmailVerification(true);
        }
      } catch (error) {
        console.error('Error parsing pending verification data:', error);
        localStorage.removeItem('pendingVerification');
      }
    }
    
    // Update loading message based on auth state
    if (authLoading) {
      const rememberedCredentials = localStorage.getItem('rememberedCredentials');
      if (rememberedCredentials) {
        setAuthLoadingMessage('Found saved credentials, signing you in...');
      } else {
        setAuthLoadingMessage('Checking your credentials...');
      }
    }
    
    // Trigger form animation
    setFormVisible(true);
  }, [isAuthenticated, navigate, authLoading]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-logo">
            <img src={logoSvg} alt="Champion Trading Logo" />
          </div>
          <div className="auth-loading">
            <div className="loading-spinner">
              <div className="spinner-circle"></div>
            </div>
            <Title level={4} className="loading-title">{authLoadingMessage}</Title>
            <Text className="loading-subtitle">Please wait while we verify your account</Text>
          </div>
        </div>
      </div>
    );
  }

  const handleForgotPassword = async () => {
    setForgotPasswordLoading(true);
    setForgotPasswordError(null);
    setForgotPasswordSuccess(false);

    try {
      // Validate email
      if (!forgotPasswordEmail) {
        setForgotPasswordError("Please enter your email address");
        return;
      }

      // Prepare forgot password data
      const forgotPasswordData: ForgotPasswordData = {
        email: forgotPasswordEmail
      };

      // Call forgot password API
      const response = await authAPI.forgotPassword(forgotPasswordData);
      
      if (response.success) {
        // Forgot password successful - show success message
        console.log('Password reset token sent:', response.data);
        setForgotPasswordSuccess(true);
        setForgotPasswordEmail("");
      } else {
        setForgotPasswordError(response.message || 'Failed to send reset token. Please try again.');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Failed to send reset token. Please try again.';
        setForgotPasswordError(errorMessage);
      } else if (error.request) {
        // Network error
        setForgotPasswordError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setForgotPasswordError('Failed to send reset token. Please try again.');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Real-time form handlers
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const firstName = e.target.value;
    const lastName = formData.lastName;
    const displayName = `${firstName} ${lastName}`.trim();
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '.');
    
    setFormData(prev => ({
      ...prev,
      firstName,
      displayName,
      username
    }));
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lastName = e.target.value;
    const firstName = formData.firstName;
    const displayName = `${firstName} ${lastName}`.trim();
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '.');
    
    setFormData(prev => ({
      ...prev,
      lastName,
      displayName,
      username
    }));
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayName = e.target.value;
    const username = displayName.toLowerCase().replace(/\s+/g, '.');
    
    setFormData(prev => ({
      ...prev,
      displayName,
      username
    }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      username: e.target.value.toLowerCase()
    }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      email: e.target.value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      password: e.target.value
    }));
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: e.target.value
    }));
  };

  const handleGenderChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      gender: e.target.value
    }));
  };

  const handleCountryChange = (country: any) => {
    setSelectedCountry(country);
  };

  const handleRegister = async () => {
    setRegisterLoading(true);
    setRegisterError(null);

    try {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.displayName || 
          !formData.username || !formData.email || !formData.password || 
          !formData.phoneNumber) {
        setRegisterError("Please fill in all required fields");
        return;
      }

      // Prepare registration data
      const registerData: RegisterData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: formData.displayName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phoneNumber: `${selectedCountry.code}${formData.phoneNumber}`,
        gender: formData.gender
      };

      // Call registration API
      const response = await authAPI.register(registerData);
      
      if (response.user && response.tokens) {
        // Registration successful - store auth data and redirect
        setAuthData(response.user, response.tokens);
        
        // Store credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            username: response.user.username,
            timestamp: Date.now()
          }));
        }
        
        console.log('Registration successful:', response.user);
        
        // Redirect to home page directly after successful registration
        navigate("/");
      } else {
        setRegisterError('Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Registration failed. Please try again.';
        setRegisterError(errorMessage);
      } else if (error.request) {
        // Network error
        setRegisterError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setRegisterError('Registration failed. Please try again.');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordError(null);
    setForgotPasswordSuccess(false);
    setForgotPasswordEmail("");
  };

  const handleBackToLoginFromRegister = () => {
    setShowRegister(false);
    setRegisterError(null);
    setFormData({
      firstName: '',
      lastName: '',
      displayName: '',
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      gender: 'MALE'
    });
  };

  const handleSendVerificationEmail = async () => {
    setVerificationLoading(true);
    setVerificationError(null);
    setVerificationSuccess(false);

    try {
      const response = await authAPI.sendVerificationEmail();
      
      if (response.success) {
        // Add 3-second delay for better UX during transition
        await new Promise(resolve => setTimeout(resolve, 3000));
        setVerificationSuccess(true);
      } else {
        setVerificationError(response.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('Send verification email error:', error);
      setVerificationError(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleProceedWithoutVerification = () => {
    // Get pending verification data
    const pendingVerification = localStorage.getItem('pendingVerification');
    if (pendingVerification) {
      try {
        const { user, tokens } = JSON.parse(pendingVerification);
        // Set auth data and proceed to app
        setAuthData(user, tokens);
        // Clear pending verification data
        localStorage.removeItem('pendingVerification');
      } catch (error) {
        console.error('Error parsing pending verification data:', error);
        localStorage.removeItem('pendingVerification');
      }
    }
    // Navigate to home page
    navigate('/');
  };

  const handleBackToLoginFromVerification = () => {
    setShowEmailVerification(false);
    setVerificationError(null);
    setVerificationSuccess(false);
    setVerificationLoading(false);
    // Also remove tokens from regular location since verification was cancelled
    localStorage.removeItem('tokens');
  };

  // Phone authentication handlers
  const handlePhoneLogin = async () => {
    setPhoneLoading(true);
    setPhoneError(null);
    
    // Show modal immediately
    setShowFirebaseUI(true);
    setPhoneLoading(false);
  };

  const handleCancelPhoneAuth = () => {
    setShowFirebaseUI(false);
    setPhoneError(null);
    setPhoneLoading(false);
    setFirebaseUIVisible(false);
    
    // Clean up FirebaseUI instance
    const ui = firebaseui.auth.AuthUI.getInstance();
    if (ui) {
      ui.delete();
    }
  };

  const handleFirebaseUIModalOpen = () => {
    setFirebaseUIVisible(true);
    
    // Initialize FirebaseUI after modal is visible
    setTimeout(() => {
      const uiConfig = {
        callbacks: {
          signInSuccessWithAuthResult: (authResult: any, redirectUrl: string) => {
            console.log('FirebaseUI sign-in success:', authResult);
            const user = authResult.user;
            
            // Get Firebase ID token and handle authentication
            user.getIdToken().then((idToken: string) => {
              authAPI.loginWithFirebaseToken(idToken).then(response => {
                if (response.user && response.tokens) {
                  // Check if email is verified
                  if (!response.user.isEmailVerified) {
                    // Store user data temporarily for verification flow
                    localStorage.setItem('pendingVerification', JSON.stringify({
                      user: response.user,
                      tokens: response.tokens
                    }));
                    
                    // Also store tokens in regular location so API can access them for verification email
                    localStorage.setItem('tokens', JSON.stringify(response.tokens));
                    
                    // Close modal and transition to email verification
                    handleCancelPhoneAuth();
                    setTimeout(() => {
                      setShowEmailVerification(true);
                    }, 350);
                    return false;
                  }
                  
                  // Login successful - store auth data
                  setAuthData(response.user, response.tokens);
                  
                  // Store credentials if remember me is checked
                  if (rememberMe) {
                    localStorage.setItem('rememberedCredentials', JSON.stringify({
                      email: response.user.email,
                      timestamp: Date.now()
                    }));
                  } else {
                    localStorage.removeItem('rememberedCredentials');
                  }

                  console.log('Phone login successful:', response.user);

                  // Close modal and redirect to home page
                  handleCancelPhoneAuth();
                  setTimeout(() => {
                    navigate("/");
                  }, 350);
                  return false;
                } else {
                  setPhoneError('Failed to authenticate with backend');
                  return false;
                }
              }).catch((error: any) => {
                console.error('Backend authentication error:', error);
                setPhoneError(error.response?.data?.message || 'Failed to authenticate with backend');
                return false;
              });
            }).catch((error: any) => {
              console.error('Token error:', error);
              setPhoneError('Failed to get authentication token');
              return false;
            });
            
            return false; // Prevent auto-redirect
          },
          signInFailure: (error: any) => {
            console.error('FirebaseUI sign-in failure:', error);
            setPhoneError('Phone authentication failed: ' + error.message);
          },
          uiShown: () => {
            console.log('FirebaseUI shown');
            setPhoneLoading(false);
          }
        },
        signInFlow: 'popup',
        signInOptions: [
          {
            provider: 'phone',
            defaultCountry: 'ZW', // Default country code
            whitelistedCountries: ['ZW', 'US', 'GB', 'ZA', 'NG', 'KE', 'UG', 'ZM', 'MW', 'LS', 'BW'],
            recaptchaParameters: {
              type: 'image',
              size: 'normal',
              badge: 'bottomleft'
            }
          }
        ],
        tosUrl: 'https://www.google.com',
        privacyPolicyUrl: 'https://www.google.com'
      };

      // Initialize FirebaseUI
      const ui = new firebaseui.auth.AuthUI(auth, app);
      ui.start('#firebaseui-auth-container', uiConfig);
    }, 100);
  };

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      // Prepare login data
      const loginData: LoginData = {
        email: values.email,
        password: values.password
      };

      // Call login API
      const response = await authAPI.login(loginData);
      
      if (response.user && response.tokens) {
        // Check if email is verified
        if (!response.user.isEmailVerified) {
          // Store user data temporarily for verification flow
          localStorage.setItem('pendingVerification', JSON.stringify({
            user: response.user,
            tokens: response.tokens
          }));
          
          // Also store tokens in regular location so API can access them for verification email
          localStorage.setItem('tokens', JSON.stringify(response.tokens));
          
          setShowEmailVerification(true);
          setLoading(false);
          return;
        }
        
        // Login successful - store auth data
        setAuthData(response.user, response.tokens);
        
        // Store credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            email: values.email,
            timestamp: Date.now()
          }));
        } else {
          localStorage.removeItem('rememberedCredentials');
        }

        // Redirect to home page
        navigate("/");
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Login failed. Please check your credentials.';
        setError(errorMessage);
      } else if (error.request) {
        // Network error
        setError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      // Create Google provider
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      // Sign in with Google popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        // Get the Firebase ID token
        const idToken = await user.getIdToken();

        // Call backend API with Firebase token
        const response = await authAPI.loginWithGoogleAccountToken(idToken);
        
        if (response.user && response.tokens) {
          // Check if email is verified
          if (!response.user.isEmailVerified) {
            // Store user data temporarily for verification flow
            localStorage.setItem('pendingVerification', JSON.stringify({
              user: response.user,
              tokens: response.tokens
            }));
            
            // Also store tokens in regular location so API can access them for verification email
            localStorage.setItem('tokens', JSON.stringify(response.tokens));
            
            setShowEmailVerification(true);
            setLoading(false);
            return;
          }
          
          // Login successful - store auth data
          setAuthData(response.user, response.tokens);
          
          // Store credentials if remember me is checked
          if (rememberMe) {
            localStorage.setItem('rememberedCredentials', JSON.stringify({
              email: response.user.email,
              timestamp: Date.now()
            }));
          } else {
            localStorage.removeItem('rememberedCredentials');
          }

          console.log('Google login successful:', response.user);

          // Redirect to home page
          navigate("/");
        } else {
          setError('Google login failed. Please try again.');
        }
      } else {
        setError('Google authentication failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      
      // Handle different error scenarios
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked. Please allow popups and try again.');
      } else if (error.code === 'auth/user-cancelled') {
        setError('Google sign-in was cancelled.');
      } else if (error.response) {
        // Server responded with error status
        console.log('Server error response:', error.response);
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            error.response.message ||
                            'Google login failed. Please try again.';
        setError(errorMessage);
      } else if (error.request) {
        // Network error
        setError('Network error. Please check your connection and try again.');
      } else {
        // Other error - check if it's a backend error
        const errorMessage = error.message || error.toString() || 'Google login failed. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm:
          effectiveTheme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#aa58e3" as string,
          borderRadius: 6,
        } as any,
      }}
    >
      <div className={`login-page ${effectiveTheme}`}>
        <div
          className="login-container"
          style={{
            opacity: formVisible ? 1 : 0,
            transform: formVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.5s ease-in-out",
          }}
        >
          <div className="login-logo">
            <img src={logoSvg} alt="Champion Trading Logo" />
          </div>

          {showEmailVerification ? (
            <Card className="email-verification-card">
              <Title level={3} className="email-verification-title">
                📧 Email Verification Required
              </Title>
              
              {!verificationSuccess && (
                <Alert
                  message="Verify Your Email"
                  description="Please verify your email address to continue. We've sent a verification email to your registered email address."
                  type="info"
                  showIcon
                  style={{ marginBottom: 20, textAlign: 'left' }}
                />
              )}
              
              {verificationSuccess && (
                <Alert
                  message="Verification Email Sent"
                  description="A new verification email has been sent to your email address. Please check your inbox and click the verification link."
                  type="success"
                  showIcon
                  className="email-verification-success"
                />
              )}
              
              {verificationError && (
                <Alert
                  message="Send Error"
                  description={verificationError}
                  type="error"
                  showIcon
                  className="email-verification-error"
                />
              )}
              
              <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 20 }}>
                <Button
                  type="primary"
                  onClick={handleSendVerificationEmail}
                  loading={verificationLoading}
                  className="send-verification-button"
                  block
                  size="large"
                >
                  {verificationLoading ? "Sending..." : (verificationSuccess ? "Resend Verification Email" : "Send Verification Email")}
                </Button>
                
                <Button
                  type="default"
                  onClick={handleProceedWithoutVerification}
                  className="proceed-button"
                  block
                  size="large"
                >
                  Proceed to App
                </Button>
                
                <Button
                  type="text"
                  onClick={handleBackToLoginFromVerification}
                  className="back-to-login-button"
                  block
                  size="large"
                >
                  Back to Login
                </Button>
              </Space>
            </Card>
          ) : showForgotPassword ? (
            <Card className="forgot-password-card">
              <Title level={3} className="forgot-password-title">
                🔐 Reset Password
              </Title>
              
              {forgotPasswordSuccess ? (
                <Alert
                  message="Reset Token Sent"
                  description="A password reset token has been sent to your email address. Please check your inbox."
                  type="success"
                  showIcon
                  className="forgot-password-success"
                />
              ) : (
                <>
                  {forgotPasswordError && (
                    <Alert
                      message="Reset Error"
                      description={forgotPasswordError}
                      type="error"
                      showIcon
                      className="forgot-password-error"
                    />
                  )}
                  
                  <Form
                    layout="vertical"
                    onFinish={handleForgotPassword}
                    className="forgot-password-form"
                    size="large"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: "Please enter your email address" },
                        { type: 'email', message: 'Please enter a valid email address' }
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="Enter your email address"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        size="large"
                        autoFocus
                      />
                    </Form.Item>

                    <Form.Item>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={forgotPasswordLoading}
                          className="forgot-password-button"
                          block
                          size="large"
                        >
                          {forgotPasswordLoading ? "Sending..." : "Send Reset Token"}
                        </Button>
                        
                        <Button
                          type="link"
                          onClick={handleBackToLogin}
                          icon={<ArrowLeftOutlined />}
                          style={{ padding: 0, height: 'auto' }}
                          size="large"
                        >
                          Back to login
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </>
              )}
            </Card>
          ) : showRegister ? (
            <Card className="register-card">
              <Title level={3} className="register-title">
                <UserAddOutlined /> Create Account
              </Title>
              
              {registerError && (
                <Alert
                  message="Registration Error"
                  description={registerError}
                  type="error"
                  showIcon
                  className="register-error"
                />
              )}
              
              <Form
                layout="vertical"
                className="register-form"
                size="large"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="First Name"
                      rules={[{ required: true, message: "Please enter your first name" }]}
                    >
                      <Input
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleFirstNameChange}
                        size="large"
                        autoFocus
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Last Name"
                      rules={[{ required: true, message: "Please enter your last name" }]}
                    >
                      <Input
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleLastNameChange}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Display Name"
                  rules={[{ required: true, message: "Please enter your display name" }]}
                >
                  <Input
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={handleDisplayNameChange}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="Username"
                  rules={[{ required: true, message: "Please enter your username" }]}
                >
                  <Input
                    placeholder="john.doe"
                    value={formData.username}
                    onChange={handleUsernameChange}
                    size="large"
                    prefix={<UserOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  label="Email"
                  rules={[
                    { required: true, message: "Please enter your email address" },
                    { type: 'email', message: 'Please enter a valid email address' }
                  ]}
                >
                  <Input
                    placeholder="john.doe@domain.com"
                    value={formData.email}
                    onChange={handleEmailChange}
                    size="large"
                    prefix={<MailOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  rules={[{ required: true, message: "Please enter your password" }]}
                >
                  <Input.Password
                    placeholder="pass123!"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    size="large"
                    prefix={<LockOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  label="Phone Number"
                  rules={[{ required: true, message: "Please enter your phone number" }]}
                >
                  <Input.Group compact>
                    <Select
                      value={`${selectedCountry.flag} ${selectedCountry.code}`}
                      onChange={(value) => {
                        const country = countries.find(c => `${c.flag} ${c.code}` === value);
                        if (country) handleCountryChange(country);
                      }}
                      style={{ width: '30%' }}
                      showSearch
                      size="large"
                      filterOption={(input, option) =>
                        (option?.children?.toString().toLowerCase().indexOf(input.toLowerCase()) ?? -1) >= 0
                      }
                    >
                      {countries.map(country => (
                        <Select.Option key={country.code} value={`${country.flag} ${country.code}`}>
                          {country.flag} {country.code}
                        </Select.Option>
                      ))}
                    </Select>
                    <Input
                      style={{ width: '70%' }}
                      placeholder="772890123"
                      value={formData.phoneNumber}
                      onChange={handlePhoneNumberChange}
                      prefix={<PhoneOutlined />}
                      size="large"
                    />
                  </Input.Group>
                </Form.Item>

                <Form.Item
                  label="Gender"
                  rules={[{ required: true, message: "Please select your gender" }]}
                >
                  <Radio.Group
                    value={formData.gender}
                    onChange={handleGenderChange}
                  >
                    <Radio value="MALE">Male</Radio>
                    <Radio value="FEMALE">Female</Radio>
                    <Radio value="OTHER">Other</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      htmlType="button"
                      loading={registerLoading}
                      className="register-submit-button"
                      block
                      onClick={handleRegister}
                      size="large"
                    >
                      {registerLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                    
                    <Button
                      type="link"
                      onClick={handleBackToLoginFromRegister}
                      icon={<ArrowLeftOutlined />}
                      style={{ padding: 0, height: 'auto' }}
                      size="large"
                    >
                      Back to login
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          ) : (
            <Card className="login-card">
              <Title level={2} className="login-title">
                🔒 Login
              </Title>

              {error && (
                <Alert
                  message="Login Error"
                  description={error}
                  type="error"
                  showIcon
                  className="login-error"
                />
              )}

              {phoneError && (
                <Alert
                  message="Phone Authentication"
                  description={phoneError}
                  type={phoneError.includes('sent') ? 'success' : 'error'}
                  showIcon
                  className="login-error"
                  style={{ marginBottom: 16 }}
                />
              )}

              <Form
                name="login"
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                className="login-form"
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: 'email', message: 'Please enter a valid email address' }
                  ]}
                >
                  <Input size="large"
                    prefix={<MailOutlined />}
                    placeholder="Email"
                    autoFocus
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "Please enter your password" },
                  ]}
                >
                  <Input.Password size="large"
                    prefix={<LockOutlined />}
                    placeholder="Password"
                  />
                </Form.Item>

                <Form.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      >
                        Remember me
                      </Checkbox>
                    </Form.Item>
                    
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="login-button"
                      block
                      size="large"
                    >
                      {loading ? "Logging in..." : "Log in"}
                    </Button>
                    
                    <Button
                      type="default"
                      className="register-button"
                      block
                      onClick={handleGoogleLogin}
                      icon={<GoogleOutlined />} 
                      loading={googleLoading}
                      size="large"
                    >
                      {googleLoading ? "Signing in with Google..." : "Continue with Google"}
                    </Button>
                    
                    <Button
                      type="default"
                      className="register-button"
                      block
                      onClick={handlePhoneLogin}
                      icon={<PhoneOutlined />} 
                      loading={phoneLoading}
                      size="large"
                    >
                      {phoneLoading ? "Initializing..." : "Continue with Phone"}
                    </Button>
                    
                    <Button
                      type="default"
                      className="register-button"
                      block
                      onClick={() => setShowRegister(true)}
                      size="large"
                    >
                      Register
                    </Button>
                    
                    <div style={{ textAlign: 'center' }}>
                      <Button
                        type="text"
                        block
                        onClick={() => setShowForgotPassword(true)} 
                        size="large"
                      >
                        Forgot password?
                      </Button>
                    </div>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}
          
          {/* FirebaseUI Phone Authentication Modal */}
          <Modal
            title="📱 Phone Authentication"
            open={showFirebaseUI}
            onCancel={handleCancelPhoneAuth}
            footer={null}
            width={450}
            centered
            destroyOnClose
            afterOpenChange={(open) => {
              if (open && !firebaseUIVisible) {
                handleFirebaseUIModalOpen();
              }
            }}
          >
            {phoneError && (
              <Alert
                message="Phone Authentication"
                description={phoneError}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            
            <div id="firebaseui-auth-container"></div>
            
            <Button
              type="default"
              onClick={handleCancelPhoneAuth}
              size="large"
              block
              style={{ marginTop: 16 }}
            >
              Cancel
            </Button>
          </Modal>
        </div>
      </div>
    </ConfigProvider>
  );
}
