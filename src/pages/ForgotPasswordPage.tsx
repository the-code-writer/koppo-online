import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Alert, 
  Button, 
  Space, 
  Form, 
  Input 
} from 'antd';
import { 
  MailOutlined, 
  LockOutlined, 
  ArrowLeftOutlined 
} from '@ant-design/icons';
import { authAPI, ForgotPasswordData } from '../services/api';
import logoSvg from '../assets/logo.png';
import '../styles/login.scss';

const { Title } = Typography;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async (values: { email: string }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate email
      if (!values.email) {
        setError("Please enter your email address");
        return;
      }

      // Prepare forgot password data
      const forgotPasswordData: ForgotPasswordData = {
        email: values.email
      };

      // Call forgot password API
      const response = await authAPI.forgotPassword(forgotPasswordData);
      
      if (response.success) {
        // Forgot password successful - show success message
        console.log('Password reset token sent:', response.data);
        setSuccess(true);
        setEmail("");
      } else {
        setError(response.message || 'Failed to send reset token. Please try again.');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Failed to send reset token. Please try again.';
        setError(errorMessage);
      } else if (error.request) {
        // Network error
        setError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setError('Failed to send reset token. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img style={{height: 48}} src={logoSvg} alt="Koppo Logo" />
        </div>
        
        <Card className="forgot-password-card">
          <Title level={3} className="forgot-password-title">
            🔐 Reset Password
          </Title>
          
          {success ? (
            <Alert
              message="Reset Token Sent"
              description="A password reset token has been sent to your email address. Please check your inbox and follow the instructions to reset your password."
              type="success"
              showIcon
              className="forgot-password-success"
              style={{ marginBottom: 20 }}
            />
          ) : (
            <>
              <Alert
                message="Reset Your Password"
                description="Enter your email address below and we'll send you a password reset token."
                type="info"
                showIcon
                style={{ marginBottom: 20, textAlign: 'left' }}
              />
              
              {error && (
                <Alert
                  message="Reset Error"
                  description={error}
                  type="error"
                  showIcon
                  className="forgot-password-error"
                  style={{ marginBottom: 20 }}
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
                  initialValue={email}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Enter your email address"
                    onChange={handleEmailChange}
                    size="large"
                    autoFocus
                  />
                </Form.Item>

                <Form.Item>
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="forgot-password-button"
                      block
                      size="large"
                    >
                      {loading ? "Sending..." : "Send Reset Token"}
                    </Button>
                    
                    <Button
                      type="link"
                      onClick={handleBackToLogin}
                      icon={<ArrowLeftOutlined />}
                      style={{ padding: 0, height: 'auto', marginTop: 32 }}
                      size="large"
                    >
                      Back to login
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
          
          {success && (
            <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
              <Button
                type="default"
                onClick={handleBackToLogin}
                block
                size="large"
                style={{ marginTop: 32 }}
              >
                Back to Login
              </Button>
              
              <Button
                type="primary"
                onClick={() => {
                  setSuccess(false);
                  setError(null);
                }}
                block
                size="large"
              >
                Send Another Reset Token
              </Button>
            </Space>
          )}
        </Card>
      </div>
    </div>
  );
}
