/**
 * @file: LoginPage.tsx
 * @description: Simple login page component that accepts any credentials
 *               and sets the authentication state without external validation.
 *
 * @components: LoginPage - Form with username and password fields
 * @dependencies:
 *   - React: useState for form state
 *   - antd: Form, Input, Button components for UI
 *   - useOAuth: For authentication state management
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
import { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  ConfigProvider,
  theme as antdTheme,
  Checkbox,
  Space,
  Card,
  Divider,
  Flex,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { LockOutlined, MailOutlined, GoogleOutlined } from "@ant-design/icons";
import { authAPI, EnhancedLoginResponse, LoginData } from "../services/api";
import logoSvg from "../assets/logo.png";
import "../styles/login.scss";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/config";
import { GDPRCookieConsent } from '../components/GDPRCookieConsent';
import { RiskDisclosureModal } from '../components/RiskDisclosureModal';
import { useLocalStorage } from "../utils/use-local-storage";
import { rsaEncryptWithPem, useDeviceUtils } from '../utils/deviceUtils';
import { useOAuth } from "../contexts/OAuthContext";
import { useNotification } from "../contexts/NotificationContext";
import googleIcon from "../assets/google-icon.webp";
const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const formRef = useRef<any>(null);

  const {
    login,
    logout,
    isLoggedIn,
    isInitialized,
    isLoading,
    isLoggingIn,
    isEmailVerified,
    isKYCVerified
  } = useOAuth();

  const { openNotification } = useNotification();

  const { effectiveTheme } = useTheme();

  const {
    serverPublicKey,
    deviceKeys,
    deviceId,
    pusherDeviceId,
    deviceToken,
    deviceInfo,
    devicePayload,
    refreshDevice
  } = useDeviceUtils();

  const [deviceData, setDeviceData] = useState({ serverPublicKey, deviceKeys, deviceId, deviceToken, deviceInfo, pusherDeviceId });

  const setupDeviceData = async () => {

    if (!deviceData.serverPublicKey || !deviceData.deviceKeys || !deviceData.deviceInfo) {
      const refreshedDevice = await refreshDevice();
      // Use returned values instead of hook state
      setDeviceData({
        serverPublicKey: refreshedDevice._serverPublicKey,
        deviceKeys: refreshedDevice._deviceKeys,
        deviceId: refreshedDevice._deviceId,
        deviceToken: refreshedDevice._deviceToken,
        deviceInfo: refreshedDevice._deviceInfo,
        pusherDeviceId: refreshedDevice._pusherDeviceId
      });
    }

  }

  useEffect(() => {

    setupDeviceData();

  }, [])

  const [googleLoading, setGoogleLoading] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [rememberedCredentials, setRememberedCredentials] = useLocalStorage<{ email: string; timestamp: number } | null>('rememberedCredentials', {
    defaultValue: null
  });

  const handleButtonClick = () => {
    formRef.current?.submit();
  };

  const handleLogin = async (credentials: any) => {
    try {
      // Prepare login data
      const loginData: LoginData = {
        email: credentials.email,
        password: credentials.password,
        rememberMe: rememberMe // Optional: extends session to 30 days
      };

      if (!deviceData.deviceId) {
        openNotification(
          'Device Error',
          'This device is not yet authorized. Would you want to set it up now?',
          {
            type: 'error',
            placement: 'top',
            icon: null,
            button: {
              label: "Setup Device",
              callback: () => {
                navigate('/device-registration');
              }
            }
          }
        );
        return;
      }

      const encryptedDeviceId = await rsaEncryptWithPem(String(deviceData.deviceId?.deviceId), String(deviceData.serverPublicKey?.publicKey));

      const result: EnhancedLoginResponse = await login(loginData);

      if (result.success) {
        if (rememberMe) {
          setRememberedCredentials({
            email: result.data?.user.profile.email as string,
            timestamp: Date.now()
          });
        } else {
          setRememberedCredentials(null);
        }
        openNotification('Login successful', `Welcome ${result.data?.user.profile.displayName}`, { type: 'info', showProgressBar: true, duration: 4 });
        navigate('/home');

      } else {

        openNotification('Login Error', result?.error?.message, { type: 'message-error' });

      }

    } catch (error: any) {

      openNotification('Login Error', result?.message, { type: 'error' });

    }

  };


  // Initialize auth state and redirect if already authenticated
  useEffect(() => {
    // Don't do anything if not initialized yet
    if (!isInitialized) return;

    // If logged in, check verification requirements
    if (isLoggedIn) {
      // Email verification required
      if (!isEmailVerified) {
        navigate("/verify-email");
        return;
      }

      // KYC required
      if (!isKYCVerified) {
        //navigate("/kyc");
        //return;
      }

      // All checks passed, redirect to home
      navigate("/home");
      return;
    }

  }, [isEmailVerified, isKYCVerified, isLoading, isLoggedIn, isInitialized, navigate, rememberedCredentials]);


  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

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
        setGoogleLoading(false);

        if (response.user && response.tokens) {
          // Check if email is verified
          if (!response.user.isEmailVerified) {

            // Navigate to email verification page
            navigate('/verify-email');
            return;
          }

          // Store credentials if remember me is checked
          if (rememberMe) {
            setRememberedCredentials({
              email: result.data?.email as string,
              timestamp: Date.now()
            });
          } else {
            setRememberedCredentials(null);
          }

          // Redirect to home page
          navigate("/home");
        } else {
          openNotification('Google Login Failed', 'Google login failed. Please try again.', { type: 'error' });
        }
      } else {
        openNotification('Google Authentication Failed', 'Google authentication failed. Please try again.', { type: 'error' });
      }
    } catch (error: any) {
      // Handle different error scenarios
      if (error.code === 'auth/popup-closed-by-user') {
        openNotification('Google Sign-in Cancelled', 'Google sign-in was cancelled.', { type: 'warn' });
      } else if (error.code === 'auth/popup-blocked') {
        openNotification('Popup Blocked', 'Google sign-in popup was blocked. Please allow popups and try again.', { type: 'warn' });
      } else if (error.code === 'auth/user-cancelled') {
        openNotification('Google Sign-in Cancelled', 'Google sign-in was cancelled.', { type: 'warn' });
      } else if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message ||
          error.response.data?.error ||
          error.response.message ||
          'Google login failed. Please try again.';
        openNotification('Google Login Error', errorMessage, { type: 'error' });
      } else if (error.request) {
        // Network error
        openNotification('Network Error', 'Network error. Please check your connection and try again.', { type: 'error' });
      } else {
        // Other error - check if it's a backend error
        const errorMessage = error.message || error.toString() || 'Google login failed. Please try again.';
        openNotification('Google Login Error', errorMessage, { type: 'error' });
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

      {!isInitialized ? (<div className="login-page">
        <div className="login-container">
          <div className="login-logo">
            <img src={logoSvg} alt="Koppo Logo" />
          </div>
          <div className="auth-loading">
            <div className="loading-spinner">
              <div className="spinner-circle"></div>
            </div>
            <Title level={4} className="loading-title">Authenticating</Title>
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

            <Form
              ref={formRef}
              name="login"
              layout="vertical"
              onFinish={handleLogin}
              onFinishFailed={() => { }}
              autoComplete="off"
              className="login-form"
              size="large"
              preserve={false}
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
                    onClick={handleButtonClick}
                    loading={isLoggingIn}
                    className="login-button"
                    block
                    size="large"
                  >
                    {isLoggingIn ? "Logging in..." : "Log in"}
                  </Button>

                  <Divider>or</Divider>

                  <Button
                    type="default"
                    className="register-button"
                    block
                    onClick={handleGoogleLogin}
                    icon={<img src={googleIcon} style={{ width: 24, height: 24, marginTop: 4 }} />}
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
                  <Button
                    type="default"
                    className="register-button"
                    block
                    onClick={() => navigate('/forgot-password')}
                    size="large"
                  >
                    Forgot password?
                  </Button>
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