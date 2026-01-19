import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Alert, 
  Button, 
  Space, 
  Form, 
  Input, 
  Select, 
  Row, 
  Col, 
  Radio 
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  UserAddOutlined, 
  ArrowLeftOutlined 
} from '@ant-design/icons';
import { authAPI, RegisterData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAuthCookies } from '../utils/use-cookies';
import logoSvg from '../assets/logo.png';
import '../styles/login.scss';

const { Title } = Typography;

// Country codes for phone numbers
const countries = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: '+45', flag: '🇩🇰', name: 'Denmark' },
  { code: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: '+48', flag: '🇵🇱', name: 'Poland' },
  { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+43', flag: '🇦🇹', name: 'Austria' },
  { code: '+30', flag: '🇬🇷', name: 'Greece' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263', flag: '🇿🇲', name: 'Zimbabwe' },
  { code: '+265', flag: '🇲🇼', name: 'Malawi' },
  { code: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: '+268', flag: '🇸🇿', name: 'Eswatini' },
  { code: '+290', flag: '🇸🇭', name: 'Saint Helena' },
  { code: '+247', flag: '🇦🇨', name: 'Ascension Island' },
];

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  
  // Use secure cookies for pending verification data
  const [pendingVerificationCookie, setPendingVerificationCookie] = useAuthCookies('pendingVerification', {
    defaultValue: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Default to US
  
  // Form data state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    gender: 'MALE'
  });

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
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.displayName || 
          !formData.username || !formData.email || !formData.password || 
          !formData.phoneNumber) {
        setError("Please fill in all required fields");
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
        // Check if email is verified
        if (!response.user.isEmailVerified) {
          // Store user data temporarily for verification flow
          setPendingVerificationCookie({
            user: response.user,
            tokens: response.tokens
          });
          
          // Redirect to email verification page
          navigate('/verify-email');
          return;
        }
        
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
        setError('Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle different error scenarios
      if (error.response?.status === 409) {
        setError('Username or email already exists. Please try different credentials.');
      } else if (error.response?.status === 400) {
        setError('Invalid registration data. Please check your information and try again.');
      } else if (error.response?.status === 422) {
        setError('Registration data validation failed. Please ensure all fields are correctly filled.');
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img style={{height: 48}}src={logoSvg} alt="Koppo Logo" />
        </div>
        
        <Card className="register-card">
          <Title level={3} className="register-title">
            <UserAddOutlined /> Create Account
          </Title>
          
          {error && (
            <Alert
              message="Registration Error"
              description={error}
              type="error"
              showIcon
              className="register-error"
              style={{ marginBottom: 20 }}
            />
          )}
          
          <Form
            layout="vertical"
            className="register-form"
            size="large"
          >
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
                
                <Input
                  style={{ width: '100%' }}
                  placeholder="772890123"
                  value={formData.phoneNumber}
                  onChange={handlePhoneNumberChange}
                  prefix={<><PhoneOutlined /><Select
                  value={`${selectedCountry.flag} ${selectedCountry.code}`}
                  onChange={(value) => {
                    const country = countries.find(c => `${c.flag} ${c.code}` === value);
                    if (country) handleCountryChange(country);
                  }}
                  style={{ width: '100%', border: 'none', margin: 0, marginLeft: 16, marginRight: 16, padding: 0  }}
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
                </Select></>}
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
              </Radio.Group>
            </Form.Item>

            <Form.Item>
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  htmlType="button"
                  loading={loading}
                  className="register-submit-button"
                  block
                  onClick={handleRegister}
                  size="large"
                >
                  {loading ? "Creating Account..." : "Create Account"}
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
        </Card>
      </div>
    </div>
  );
}
