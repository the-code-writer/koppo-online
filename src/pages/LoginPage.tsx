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
import { useState, useEffect } from "react";
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
  notification,
  Flex,
} from "antd";
import { useNavigate } from "react-router-dom";
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
import { useOAuth } from "../contexts/OAuthContext";
const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    login,
    logout,
    isLoggedIn,
    isInitialized,
    isLoading,
    isEmailVerified,
    isKYCVerified
  } = useOAuth();

  const [api, contextHolder] = notification.useNotification();

  const { effectiveTheme } = useTheme();

  const { 
    serverPublicKey,
    deviceKeys,
    deviceId,
    pusherDeviceId,
    deviceToken,
    deviceInfo,
    devicePayload,
    deviceHashData,
    getPusherId,
    getDevice,
    getDeviceToken,
    refreshDevice,
    clearDeviceKeys,
    storeServerPublicKey,
    clearServerPublicKey,
    storeDeviceId,
    setDeviceId,
    clearDeviceId
   } = useDeviceUtils();

  const [deviceData, setDeviceData] = useState({ serverPublicKey, deviceKeys, deviceId, deviceToken, deviceInfo, pusherDeviceId });

  const setupDeviceData = async () => {
    
    if(!deviceData.serverPublicKey || !deviceData.deviceKeys || !deviceData.deviceInfo){
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

  useEffect(()=>{

    setupDeviceData();
    
  },[])

  const [googleLoading, setGoogleLoading] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [rememberedCredentials, setRememberedCredentials] = useLocalStorage<{ email: string; timestamp: number } | null>('rememberedCredentials', {
    defaultValue: null
  });

  const [authLoadingMessage, setAuthLoadingMessage] = useState('');

  const openNotification = (title: string, description: string, options: any = { button: null, icon: null, type: 'info', durtion: 0, placement: 'bottomRight'}) => {
    const key = `open${Date.now()}`;
    const btn = (<>{options.button ? (
      <Space>
        <Button type="link" size="small" onClick={() => api.destroy(key)}>
          Close
        </Button>
        <Button type="primary" size="small" onClick={options.button.callback}>
          {options.button.label}
        </Button>
      </Space>) : (<></>)}</>
    );
    const getBulletType = () => {
      switch(options.type){
        case "emoji-error" : {
          return (<>⛔</>)
        }
        case "emoji-info" : {
          return (<>ℹ️</>)
        }
        case "emoji-warn" : {
          return (<>⚠️</>)
        }
        case "emoji-success" : {
          return (<>✅</>)
        }
        case "error" : {
          return (<>🔴</>)
        }
        case "warn" : {
          return (<>🟡</>)
        }
        case "success" : {
          return (<>🟢</>)
        }
        case "info" : {
          return (<>🔵</>)
        }
        default : {
          return (<>🔵</>)
        }
      }
    }
    const getIcon = () => { if (options.icon) { return (<>{options.icon}</>) } else { return null; } };
    const getTitle = () => (<Flex align="center">{!options.icon && (<span>{getBulletType()}</span>)}&nbsp;&nbsp;<strong>{title}</strong></Flex>);
    api.open({
      title: getTitle(),
      description: description,
      icon: getIcon(),
      duration: options.duration || 0,
      placement: options.placement || 'bottomRight',
      btn,
      key,
      onClose: () => api.destroy(key),
    });
  };

  const handleLogin = async (credentials: any) => {

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

      navigate('/home');
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

    // Update loading message based on auth state
    if (isLoading) {
      if (rememberedCredentials) {
        setAuthLoadingMessage('Found saved credentials, signing you in...');
      } else {
        setAuthLoadingMessage('Checking your credentials...');
      }
    } else {
      setAuthLoadingMessage('Ready to login');
    }

  }, [isEmailVerified, isKYCVerified, isLoading, isLoggedIn, isInitialized, navigate, rememberedCredentials]);

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

      if (envConfig.VITE_SECURE_LOGIN === 'ENHANCED' && parsedDeviceId && serverKeys?.publicKey) {
        const encryptedDeviceId = await rsaEncryptWithPem(parsedDeviceId?.deviceId, serverKeys.publicKey);
        const _response: EnhancedLoginResponse = await authAPI.enhancedLogin(loginData, encryptedDeviceId);
        response.user = _response.data.user;
        response.tokens = _response.data.tokens;
        response.success = _response.success;
        response.message = _response.message;
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
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        let errorMessage = error.response.data?.message || 'XLogin failed. Please check your credentials.';
        if (error.response.data?.error) {
          errorMessage += `: ${error.response.data?.error}`;
        }
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
          setAuthLoadingMessage('Google login failed. Please try again.');
        }
      } else {
        setAuthLoadingMessage('Google authentication failed. Please try again.');
      }
    } catch (error: any) {
      // Handle different error scenarios
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthLoadingMessage('Google sign-in was cancelled.');
      } else if (error.code === 'auth/popup-blocked') {
        setAuthLoadingMessage('Google sign-in popup was blocked. Please allow popups and try again.');
      } else if (error.code === 'auth/user-cancelled') {
        setAuthLoadingMessage('Google sign-in was cancelled.');
      } else if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message ||
          error.response.data?.error ||
          error.response.message ||
          'Google login failed. Please try again.';
        setAuthLoadingMessage(errorMessage);
      } else if (error.request) {
        // Network error
        setAuthLoadingMessage('Network error. Please check your connection and try again.');
      } else {
        // Other error - check if it's a backend error
        const errorMessage = error.message || error.toString() || 'Google login failed. Please try again.';
        setAuthLoadingMessage(errorMessage);
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

      {contextHolder}

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
              name="login"
              layout="vertical"
              onFinish={handleLogin}
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
                    loading={isLoading}
                    className="login-button"
                    block
                    size="large"
                  >
                    {isLoading ? "Logging in..." : "Log in"}
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