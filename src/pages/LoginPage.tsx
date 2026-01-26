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
  message,
  Divider,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useAuthCookies } from '../utils/use-cookies';
import { useTheme } from "../contexts/ThemeContext";
import { LockOutlined, MailOutlined, GoogleOutlined } from "@ant-design/icons";
import { authAPI, EnhancedLoginResponse, LoginData, LoginResponse } from "../services/api";
import logoSvg from "../assets/logo.png";
import "../styles/login.scss";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/config";
import { envConfig } from "../config/env.config";
import { GDPRCookieConsent } from '../components/GDPRCookieConsent';
import { RiskDisclosureModal } from '../components/RiskDisclosureModal';
import { useLocalStorage } from "../utils/use-local-storage";
import { rsaEncryptWithPem, useDeviceUtils } from '../utils/deviceUtils';
const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuthData, isAuthenticated, isLoading: authLoading } = useAuth();
  const { effectiveTheme } = useTheme();
  const { serverKeys, parsedDeviceId } = useDeviceUtils();

  // Use secure cookies for pending verification data
  const [pendingVerificationCookie, setPendingVerificationCookie] = useAuthCookies<{ user: { email: string;[key: string]: any }; tokens: any } | null>('pendingVerification', {
    defaultValue: null
  });


  const [rememberedCredentials, setRememberedCredentials] = useLocalStorage<{ email: string; timestamp: number } | null>('rememberedCredentials', {
    defaultValue: null
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<{ action: string; path: string } | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [authLoadingMessage, setAuthLoadingMessage] = useState('Initializing...');

  // Initialize auth state and redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }

    // Check if there's pending verification data
    if (pendingVerificationCookie) {
      try {
        const { user } = pendingVerificationCookie;
        setAuthLoadingMessage(`Completing verification for ${user?.email}...`);
        // Auto-redirect to verification page
        navigate('/verify-email');
        return;
      } catch (error) {
        console.error('Error parsing pending verification data:', error);
        setPendingVerificationCookie(null);
      }
    }

    // Update loading message based on auth state
    if (authLoading) {
      if (rememberedCredentials) {
        setAuthLoadingMessage('Found saved credentials, signing you in...');
      } else {
        setAuthLoadingMessage('Checking your credentials...');
      }
    } else {
      setAuthLoadingMessage('Ready to login');
    }
  }, [isAuthenticated, navigate, authLoading, pendingVerificationCookie, setPendingVerificationCookie, rememberedCredentials]);

  const processLoginResult = (response: any, email: string) => {

    if (response.user && response.tokens) {

      message.success('Login successful');

      // Login successful - store auth data
      setAuthData(response.user, response.tokens);

      // Check if email is verified
      if (!response.user.isEmailVerified) {
        // Store user data temporarily for verification flow
        setPendingVerificationCookie({
          user: response.user,
          tokens: response.tokens
        });
        // Navigate to email verification page
        navigate('/verify-email');
        return;
      }

      // Store credentials if remember me is checked
      setRememberedCredentials(rememberMe ? {
        email,
        timestamp: Date.now()
      } : null);
      // Redirect to home page
      navigate("/home");
    } else {
      setError('Login failed. Please check your credentials.');
      message.error('Login failed. Please check your credentials.');
    }
    setLoading(false);
  }

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    setErrorAction(null);

    const response: LoginResponse = {} as LoginResponse;

    // Prepare login data
    const loginData: LoginData = {
      email: values.email,
      password: values.password
    };

    try {
      // Call login API

      console.log({ parsedDeviceId, serverPublicKey: serverKeys?.publicKey, envConfig: envConfig.VITE_SECURE_LOGIN });
      if (envConfig.VITE_SECURE_LOGIN === 'ENHANCED' && parsedDeviceId && serverKeys?.publicKey) {
        const encryptedDeviceId = await rsaEncryptWithPem(parsedDeviceId?.deviceId, serverKeys.publicKey);
        const _response: EnhancedLoginResponse = await authAPI.enhancedLogin(loginData, encryptedDeviceId);
        response.user = _response.data.user;
        response.tokens = _response.data.tokens;
        response.success = _response.success;
        response.message = _response.message;
        console.log({ _response, response })
      } else {
        // const _response: LoginResponse = await authAPI.login(loginData);
        // response.user = _response.user;
        // response.tokens = _response.tokens;
        const errorMessage: string = `Device is not authenticated.`;
        setError(errorMessage);
        setErrorAction({ label: "Setup Device", path: "/device-registration" });
        return; // Prevent processLoginResult from being called
      }

      processLoginResult(response, values.email);

    } catch (error: any) {
      console.error('Login error:', error);

      // Handle different error scenarios
      if (error.response) {
        console.error({ errorResponse: error.response });
        // Server responded with error status
        let errorMessage = error.response.data?.message || 'XLogin failed. Please check your credentials.';
        if (error.response.data?.error) {
          errorMessage += `: ${error.response.data?.error}`;
        }
        console.error({ errorMessage });
        if (error.response.data?.code === "DEVICE_NOT_FOUND") {
          setErrorAction({ label: "Setup Device", path: "/device-registration" });
          setError(errorMessage);
        } else if (error.response.data?.code === "DEVICE_ID_DECRYPTION_FAILED") {
          setErrorAction({ label: "Setup Device", path: "/device-registration" });
          setError(errorMessage);
        } else {
          setError(`${error.response.statusText}. ${error.response.data?.message}`);
        }

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
      provider?.addScope('email');
      provider?.addScope('profile');

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
            setPendingVerificationCookie({
              user: response.user,
              tokens: response.tokens
            });

            // Navigate to email verification page
            navigate('/verify-email');
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
          navigate("/home");
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


      {authLoading ? (<div className="login-page">
        <div className="login-container">
          <div className="login-logo">
            <img src={logoSvg} alt="Koppo Logo" />
          </div>
          <div className="auth-loading">
            <div className="loading-spinner">
              <div className="spinner-circle"></div>
            </div>
            <Title level={4} className="loading-title">{authLoadingMessage}</Title>
            <Text className="loading-subtitle">Please wait while we verify your account</Text>
          </div>
        </div>
      </div>) : (<div className={`login-page ${effectiveTheme}`}>
        <div
          className="login-container"
        >
          <div className="login-logo">
            <img src={logoSvg} alt="Koppo Logo" />
          </div>

          <Card className="login-card">
            <Title level={2} className="login-title">
              🔒 Login
            </Title>

            {error && (
              <Alert
                title={<><small>🔴</small> <strong>Login Error</strong></>}
                description={<>{error}{errorAction && (
                  <Button size="small" type="default" onClick={() => navigate(errorAction.path)} style={{ marginTop: 12 }}>
                    {errorAction.label}
                  </Button>)}</>}
                type="error"
                className="login-error"
                closable={false}
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
                <Space orientation="vertical" style={{ width: '100%' }}>
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

                  <Divider>or</Divider>

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
                    onClick={() => navigate('/register')}
                    size="large"
                  >
                    Register
                  </Button>

                  <div style={{ textAlign: 'center' }}>
                    <Button
                      type="text"
                      block
                      onClick={() => navigate('/forgot-password')}
                      size="large"
                    >
                      Forgot password?
                    </Button>
                  </div>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>)}

      {/* GDPR Cookie Consent */}
      <GDPRCookieConsent />

      {/* Risk Disclosure Modal */}
      <RiskDisclosureModal />

    </ConfigProvider>
  );
}