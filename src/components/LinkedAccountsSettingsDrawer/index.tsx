import { useState, useEffect, useRef } from "react";
import { Drawer, Form, Input, Button, Avatar, Upload, Space, Typography, Switch, Tabs, Divider, Card, Badge, Tooltip, Alert, List, Tag, Select, Collapse, Modal } from "antd";
import { UserOutlined, LinkOutlined, GoogleOutlined, MessageOutlined, AlertFilled, WarningTwoTone, WarningFilled, CheckCircleFilled, CaretRightOutlined, WalletOutlined, WarningOutlined, MailOutlined, PhoneOutlined, SafetyOutlined, MobileOutlined, QrcodeOutlined, WhatsAppOutlined, CopyOutlined, LockOutlined, TeamOutlined } from "@ant-design/icons";
import { User, authAPI } from '../../services/api';
import { FileHandler } from '../../utils/FileHandler';
import { AuthenticatorApp, QRCodeGenerator } from '../../utils/AuthenticatorApp';
import { SMSAuthenticator, SMSVerificationSession, WhatsAppAuthenticator, WhatsAppVerificationSession } from '../../utils/SMSAuthenticator';
import { GoogleAuth } from '../../utils/GoogleAuth';
import { TelegramAuth } from '../../utils/TelegramAuth';
import { DerivAuth } from '../../utils/DerivAuth';
import { useDeriv } from '../../hooks/useDeriv.tsx';
import derivLogo from '../../assets/deriv-logo.svg';
import "./styles.scss";

const { Title, Text } = Typography;
const { Option } = Select;

interface LinkedAccountsSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export const LinkedAccountsSettingsDrawer: React.FC<LinkedAccountsSettingsDrawerProps> = ({
  visible,
  onClose,
  user
}) => {
  // Form instance
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // State variables
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'whatsapp' | 'authenticator' | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [accountsDrawerVisible, setAccountsDrawerVisible] = useState(false);

  // Country selection for phone
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+1',
    flag: '🇺🇸',
    name: 'United States'
  });
  const countries = [
    { code: '+1', flag: '🇺🇸', name: 'United States' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+55', flag: '🇧🇷', name: 'Brazil' },
    { code: '+7', flag: '🇷🇺', name: 'Russia' }
  ];

  // SMS State
  const [smsCode, setSmsCode] = useState<string[]>(['', '', '', '', '', '']);
  const [smsVerificationCode, setSmsVerificationCode] = useState('');
  const [smsShake, setSmsShake] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsSetupStep, setSmsSetupStep] = useState<'setup' | 'verify'>('setup');
  const [smsSessionId, setSmsSessionId] = useState<string | null>(null);
  const [smsCodeExpiresAt, setSmsCodeExpiresAt] = useState<number | null>(null);
  const [smsCanResend, setSmsCanResend] = useState(true);
  const [smsResendCountdown, setSmsResendCountdown] = useState(0);
  const smsInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp State
  const [whatsappCode, setWhatsappCode] = useState<string[]>(['', '', '', '', '', '']);
  const [whatsappVerificationCode, setWhatsappVerificationCode] = useState('');
  const [whatsappShake, setWhatsappShake] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappSetupStep, setWhatsappSetupStep] = useState<'setup' | 'verify'>('setup');
  const [whatsappSessionId, setWhatsappSessionId] = useState<string | null>(null);
  const [whatsappCodeExpiresAt, setWhatsappCodeExpiresAt] = useState<number | null>(null);
  const [whatsappCanResend, setWhatsappCanResend] = useState(true);
  const [whatsappResendCountdown, setWhatsappResendCountdown] = useState(0);
  const whatsappInputRef = useRef<HTMLInputElement>(null);

  // Authenticator State
  const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState<'setup' | 'verify'>('setup');
  const [authenticatorLoading, setAuthenticatorLoading] = useState(false);
  const [authenticatorVerificationCode, setAuthenticatorVerificationCode] = useState('');
  const [authenticatorShake, setAuthenticatorShake] = useState(false);
  const [authenticatorSecret, setAuthenticatorSecret] = useState<string | null>(null);
  const [authenticatorQRCode, setAuthenticatorQRCode] = useState<string | null>(null);

  // Backup Codes State
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesGenerated, setBackupCodesGenerated] = useState(false);
  const [backupCodesLoading, setBackupCodesLoading] = useState(false);
  const [backupCodesSetupStep, setBackupCodesSetupStep] = useState<'setup' | 'view'>('setup');
  const [backupCodesShake, setBackupCodesShake] = useState(false);

  // Google Auth State
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [googleAuthModalVisible, setGoogleAuthModalVisible] = useState(false);

  // Telegram Auth State
  const [telegramAuthLoading, setTelegramAuthLoading] = useState(false);
  const [telegramAuthModalVisible, setTelegramAuthModalVisible] = useState(false);

  // Deriv Auth State
  const [derivAuthLoading, setDerivAuthLoading] = useState(false);
  const [derivAuthModalVisible, setDerivAuthModalVisible] = useState(false);

  // Tokens State
  const [activeTokens, setActiveTokens] = useState<any[]>([]);

  // Connected accounts state
  const [connectedAccounts, setConnectedAccounts] = useState([
    {
      id: 'google',
      name: 'Google',
      icon: <GoogleOutlined style={{ fontSize: 24, color: '#4285f4' }} />,
      connected: false,
      email: '',
      lastSync: null
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <MessageOutlined style={{ fontSize: 24, color: '#0088cc' }} />,
      connected: false,
      email: '',
      lastSync: null
    },
    {
      id: 'deriv',
      name: 'Deriv',
      icon: <WalletOutlined style={{ fontSize: 24, color: '#ff6600' }} />,
      connected: false,
      email: '',
      lastSync: null
    }
  ]);

  // Effects
  useEffect(() => {
    if (visible && user) {
      form.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber
      });
    }
  }, [visible, user, form]);

  // Countdown timer effect for SMS codes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (smsCodeExpiresAt && Date.now() < smsCodeExpiresAt) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now >= smsCodeExpiresAt) {
          setSmsCanResend(true);
          setSmsResendCountdown(0);
          clearInterval(interval);
        } else {
          const remaining = Math.ceil((smsCodeExpiresAt - now) / 1000);
          setSmsResendCountdown(remaining);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [smsCodeExpiresAt]);

  // Countdown timer effect for WhatsApp codes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (whatsappCodeExpiresAt && Date.now() < whatsappCodeExpiresAt) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now >= whatsappCodeExpiresAt) {
          setWhatsappCanResend(true);
          setWhatsappResendCountdown(0);
          clearInterval(interval);
        } else {
          const remaining = Math.ceil((whatsappCodeExpiresAt - now) / 1000);
          setWhatsappResendCountdown(remaining);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [whatsappCodeExpiresAt]);

  // Event handlers
  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      // Update profile logic here
      console.log('Updating profile:', values);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomUpload = async (options: any) => {
    const { file } = options;
    try {
      // Handle file upload logic here
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const handleSendPasswordReset = async () => {
    setResetLoading(true);
    try {
      // Send password reset logic here
      console.log('Sending password reset link');
      alert('Password reset link sent to your email!');
    } catch (error) {
      console.error('Failed to send password reset:', error);
      alert('Failed to send password reset. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setChangePasswordLoading(true);
    try {
      // Change password logic here
      console.log('Changing password:', values);
      alert('Password changed successfully!');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password. Please try again.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // SMS Functions
  const handleSMSCodeChange = (index: number, value: string) => {
    const newCode = [...smsCode];
    const previousValue = newCode[index];
    newCode[index] = value.replace(/\D/g, '');
    setSmsCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`sms-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }

    // Auto-verify only when:
    // 1. User is typing in the last box (index 5)
    // 2. The value is not empty
    // 3. This is a new entry (not an edit of existing value)
    if (index === 5 && value && !previousValue) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const fullCode = newCode.join('');
        if (fullCode.length === 6) {
          handleVerifySMS();
        }
      }, 100);
    }
  };

  const handleSMSCodeKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !smsCode[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      const prevInput = document.getElementById(`sms-input-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleSetupSMS = async () => {
    setSmsLoading(true);
    try {
      // Generate SMS verification code
      const sessionId = `sms_${user?.id}_${Date.now()}`;
      const code = SMSAuthenticator.generateCode();
      const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

      setSmsSessionId(sessionId);
      setSmsCodeExpiresAt(expiresAt);
      setSmsCanResend(false);
      setSmsSetupStep('verify');
      setSmsCode(['', '', '', '', '', '']);

      // Store session
      SMSVerificationSession.createSession(sessionId, code, expiresAt);

      // Simulate sending SMS
      await SMSAuthenticator.sendSMS(user?.phoneNumber || '', code);
      
      console.log('SMS verification code:', code);
      console.log('Code expires at:', new Date(expiresAt).toLocaleString());
    } catch (error) {
      console.error('Failed to setup SMS:', error);
      alert('Failed to send SMS verification. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleVerifySMS = async () => {
    if (!smsSessionId) return;

    const fullCode = smsCode.join('');
    if (fullCode.length !== 6) {
      alert('Please enter all 6 digits');
      return;
    }

    setSmsLoading(true);
    try {
      const isValid = SMSVerificationSession.verifyCode(smsSessionId, fullCode);
      
      if (isValid) {
        console.log('✅ SMS verification successful');
        setTwoFactorMethod('sms');
        setTwoFactorEnabled(true);
        setSmsSetupStep('setup');
        setSmsCode(['', '', '', '', '', '']);
        setSmsSessionId(null);
        setSmsCodeExpiresAt(null);
        alert('SMS authentication enabled successfully!');
      } else {
        console.log('❌ Invalid verification code');
        setSmsShake(true);
        setTimeout(() => setSmsShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify SMS:', error);
      alert('Failed to verify SMS code. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleCancelSMSSetup = () => {
    setSmsSetupStep('setup');
    setSmsCode(['', '', '', '', '', '']);
    setSmsSessionId(null);
    setSmsCodeExpiresAt(null);
    setSmsCanResend(true);
    setSmsResendCountdown(0);
    
    // Clean up session
    if (smsSessionId) {
      SMSVerificationSession.cleanupSession(smsSessionId);
    }
  };

  const startSMSResendCountdown = () => {
    setSmsCanResend(false);
    setSmsResendCountdown(60); // 60 seconds countdown
  };

  // WhatsApp Functions
  const handleWhatsAppCodeChange = (index: number, value: string) => {
    const newCode = [...whatsappCode];
    const previousValue = newCode[index];
    newCode[index] = value.replace(/\D/g, '');
    setWhatsappCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`whatsapp-input-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }

    // Auto-verify only when:
    // 1. User is typing in the last box (index 5)
    // 2. The value is not empty
    // 3. This is a new entry (not an edit of existing value)
    if (index === 5 && value && !previousValue) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        const fullCode = newCode.join('');
        if (fullCode.length === 6) {
          handleVerifyWhatsApp();
        }
      }, 100);
    }
  };

  const handleWhatsAppCodeKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !whatsappCode[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      const prevInput = document.getElementById(`whatsapp-input-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleSetupWhatsApp = async () => {
    setWhatsappLoading(true);
    try {
      // Generate WhatsApp verification code
      const sessionId = `whatsapp_${user?.id}_${Date.now()}`;
      const code = WhatsAppAuthenticator.generateCode();
      const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

      setWhatsappSessionId(sessionId);
      setWhatsappCodeExpiresAt(expiresAt);
      setWhatsappCanResend(false);
      setWhatsappSetupStep('verify');
      setWhatsappCode(['', '', '', '', '', '']);

      // Store session
      WhatsAppVerificationSession.createSession(sessionId, code, expiresAt);

      // Simulate sending WhatsApp message
      await WhatsAppAuthenticator.sendWhatsAppMessage(user?.phoneNumber || '', code);
      
      console.log('WhatsApp verification code:', code);
      console.log('Code expires at:', new Date(expiresAt).toLocaleString());
    } catch (error) {
      console.error('Failed to setup WhatsApp:', error);
      alert('Failed to send WhatsApp verification. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleVerifyWhatsApp = async () => {
    if (!whatsappSessionId) return;

    const fullCode = whatsappCode.join('');
    if (fullCode.length !== 6) {
      alert('Please enter all 6 digits');
      return;
    }

    setWhatsappLoading(true);
    try {
      const isValid = WhatsAppVerificationSession.verifyCode(whatsappSessionId, fullCode);
      
      if (isValid) {
        console.log('✅ WhatsApp verification successful');
        setTwoFactorMethod('whatsapp');
        setTwoFactorEnabled(true);
        setWhatsappSetupStep('setup');
        setWhatsappCode(['', '', '', '', '', '']);
        setWhatsappSessionId(null);
        setWhatsappCodeExpiresAt(null);
        alert('WhatsApp authentication enabled successfully!');
      } else {
        console.log('❌ Invalid verification code');
        setWhatsappShake(true);
        setTimeout(() => setWhatsappShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify WhatsApp:', error);
      alert('Failed to verify WhatsApp code. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleCancelWhatsAppSetup = () => {
    setWhatsappSetupStep('setup');
    setWhatsappCode(['', '', '', '', '', '']);
    setWhatsappSessionId(null);
    setWhatsappCodeExpiresAt(null);
    setWhatsappCanResend(true);
    setWhatsappResendCountdown(0);
    
    // Clean up session
    if (whatsappSessionId) {
      WhatsAppVerificationSession.cleanupSession(whatsappSessionId);
    }
  };

  const startWhatsAppResendCountdown = () => {
    setWhatsappCanResend(false);
    setWhatsappResendCountdown(60); // 60 seconds countdown
  };

  // Authenticator Functions
  const handleSetupAuthenticator = async () => {
    setAuthenticatorLoading(true);
    try {
      // Generate secret and QR code
      const secret = AuthenticatorApp.generateSecret();
      const qrCode = QRCodeGenerator.generateQRCode(
        secret,
        user?.email || '',
        'Koppo App'
      );
      
      setAuthenticatorSecret(secret);
      setAuthenticatorQRCode(qrCode);
      setAuthenticatorSetupStep('verify');
      setAuthenticatorVerificationCode('');
      
      console.log('Authenticator secret:', secret);
      console.log('Current TOTP code:', AuthenticatorApp.generateTOTP(secret));
    } catch (error) {
      console.error('Failed to setup authenticator:', error);
      alert('Failed to setup authenticator app. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
    }
  };

  const handleVerifyAuthenticator = async () => {
    if (!authenticatorSecret) return;

    const code = authenticatorVerificationCode;
    if (code.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    setAuthenticatorLoading(true);
    try {
      const isValid = AuthenticatorApp.verifyTOTP(authenticatorSecret, code);
      
      if (isValid) {
        console.log('✅ Authenticator verification successful');
        setTwoFactorMethod('authenticator');
        setTwoFactorEnabled(true);
        setAuthenticatorSetupStep('setup');
        setAuthenticatorVerificationCode('');
        setAuthenticatorSecret(null);
        setAuthenticatorQRCode(null);
        alert('Authenticator app enabled successfully!');
      } else {
        console.error('Invalid verification code');
        setAuthenticatorShake(true);
        setTimeout(() => setAuthenticatorShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify authenticator:', error);
      alert('Failed to verify authenticator code. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
    }
  };

  const handleCancelAuthenticatorSetup = () => {
    setAuthenticatorSetupStep('setup');
    setAuthenticatorVerificationCode('');
    setAuthenticatorSecret(null);
    setAuthenticatorQRCode(null);
  };

  const handleRefreshAuthenticator = () => {
    if (authenticatorSecret) {
      const currentCode = AuthenticatorApp.generateTOTP(authenticatorSecret);
      console.log('Current TOTP code:', currentCode);
      alert(`Current code: ${currentCode} (refreshes every 30 seconds)`);
    }
  };

  // Backup Codes Functions
  const handleGenerateBackupCodes = async () => {
    setBackupCodesLoading(true);
    try {
      // Generate 10 backup codes
      const codes = AuthenticatorApp.generateBackupCodes(10);
      setBackupCodes(codes);
      setBackupCodesGenerated(true);
      setBackupCodesSetupStep('view');
      
      console.log('Backup codes generated successfully');
      alert('Backup codes generated! Please save them in a secure location.');
    } catch (error) {
      console.error('Failed to generate backup codes:', error);
      // Trigger shake effect
      setBackupCodesShake(true);
      setTimeout(() => setBackupCodesShake(false), 500);
      alert('Failed to generate backup codes. Please try again.');
    } finally {
      setBackupCodesLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    if (backupCodes.length === 0) return;

    const codesText = `Koppo App Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nKeep these codes in a safe location. Each code can only be used once.`;
    
    navigator.clipboard.writeText(codesText).then(() => {
      alert('Backup codes copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy backup codes:', err);
      alert('Failed to copy backup codes. Please try again.');
    });
  };

  const handleDownloadBackupCodes = () => {
    if (backupCodes.length === 0) return;

    const codesText = `Koppo App Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nKeep these codes in a safe location. Each code can only be used once.`;
    
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'koppo-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRegenerateBackupCodes = () => {
    if (confirm('This will invalidate your previous backup codes. Are you sure you want to generate new ones?')) {
      setBackupCodes([]);
      setBackupCodesGenerated(false);
      setBackupCodesSetupStep('setup');
      handleGenerateBackupCodes();
    }
  };

  // Token Management Functions
  const getTokenPreview = (token: string) => {
    if (!token) return '';
    return token.substring(0, 8) + '...' + token.substring(token.length - 8);
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      // Revoke token logic here
      console.log('Revoking token:', tokenId);
      setActiveTokens(prev => prev.filter(token => token.id !== tokenId));
      alert('Token revoked successfully!');
    } catch (error) {
      console.error('Failed to revoke token:', error);
      alert('Failed to revoke token. Please try again.');
    }
  };

  const handleRevokeAllTokens = async () => {
    if (confirm('Are you sure you want to revoke all active sessions? This will sign you out from all devices.')) {
      try {
        // Revoke all tokens logic here
        console.log('Revoking all tokens');
        setActiveTokens([]);
        alert('All sessions revoked successfully!');
      } catch (error) {
        console.error('Failed to revoke all tokens:', error);
        alert('Failed to revoke all tokens. Please try again.');
      }
    }
  };

  // Auth Functions
  const handleGoogleSignIn = async () => {
    setGoogleAuthLoading(true);
    try {
      const result = await GoogleAuth.signInWithPopup();
      if (result.success && result.user) {
        console.log('Google sign-in successful:', result.user);
        // Update connected accounts
        setConnectedAccounts(prev => prev.map(account => 
          account.id === 'google' 
            ? { ...account, connected: true, email: result.user.email, lastSync: new Date() }
            : account
        ));
        alert('Google account connected successfully!');
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      alert('Failed to connect Google account. Please try again.');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const handleTelegramSignIn = async () => {
    setTelegramAuthLoading(true);
    try {
      const result = await TelegramAuth.signInWithPopup();
      if (result.success && result.user) {
        console.log('Telegram sign-in successful:', result.user);
        // Update connected accounts
        setConnectedAccounts(prev => prev.map(account => 
          account.id === 'telegram' 
            ? { ...account, connected: true, email: result.user.email, lastSync: new Date() }
            : account
        ));
        alert('Telegram account connected successfully!');
      }
    } catch (error) {
      console.error('Telegram sign-in failed:', error);
      alert('Failed to connect Telegram account. Please try again.');
    } finally {
      setTelegramAuthLoading(false);
    }
  };

  const handleDerivSignIn = async () => {
    setDerivAuthLoading(true);
    try {
      const result = await DerivAuth.signInWithPopup();
      if (result.success && result.user) {
        console.log('Deriv sign-in successful:', result.user);
        // Update connected accounts
        setConnectedAccounts(prev => prev.map(account => 
          account.id === 'deriv' 
            ? { ...account, connected: true, email: result.user.email, lastSync: new Date() }
            : account
        ));
        alert('Deriv account connected successfully!');
      }
    } catch (error) {
      console.error('Deriv sign-in failed:', error);
      alert('Failed to connect Deriv account. Please try again.');
    } finally {
      setDerivAuthLoading(false);
    }
  };

  const handleDisconnectAccount = (accountId: string) => {
    if (confirm('Are you sure you want to disconnect this account?')) {
      setConnectedAccounts(prev => prev.map(account => 
        account.id === accountId 
          ? { ...account, connected: false, email: '', lastSync: null }
          : account
      ));
      alert('Account disconnected successfully!');
    }
  };

  return (
    <Drawer
      title="Linked Accounts"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="linked-accounts-drawer"
    >
      <div className="linked-accounts-content">
        <Alert
          message="Connected Accounts"
          description="Manage your connected third-party accounts and services. Connect your accounts to enable seamless integration and enhanced features."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <div className="accounts-grid">
          {connectedAccounts.map((account) => (
            <Card
              key={account.id}
              className="account-card"
              size="small"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {account.icon}
                  <span>{account.name}</span>
                </div>
              }
              extra={
                <Tag color={account.connected ? 'green' : 'default'}>
                  {account.connected ? 'Connected' : 'Disconnected'}
                </Tag>
              }
            >
              {account.connected ? (
                <div className="account-connected">
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Email: </Text>
                    <Text>{account.email}</Text>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Last Sync: </Text>
                    <Text>{account.lastSync ? new Date(account.lastSync).toLocaleString() : 'Never'}</Text>
                  </div>
                  <Space>
                    <Button size="small" onClick={() => {
                      // Sync logic here
                      alert('Account synced successfully!');
                    }}>
                      Sync Now
                    </Button>
                    <Button 
                      size="small" 
                      danger 
                      onClick={() => handleDisconnectAccount(account.id)}
                    >
                      Disconnect
                    </Button>
                  </Space>
                </div>
              ) : (
                <div className="account-disconnected">
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Connect your {account.name} account to enable integration and sync features.
                  </Text>
                  <Button 
                    type="primary" 
                    size="small"
                    loading={
                      (account.id === 'google' && googleAuthLoading) ||
                      (account.id === 'telegram' && telegramAuthLoading) ||
                      (account.id === 'deriv' && derivAuthLoading)
                    }
                    onClick={() => {
                      if (account.id === 'google') handleGoogleSignIn();
                      else if (account.id === 'telegram') handleTelegramSignIn();
                      else if (account.id === 'deriv') handleDerivSignIn();
                    }}
                  >
                    Connect {account.name}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>

        <Divider />

        <Card title="Account Benefits" size="small">
          <List
            dataSource={[
              'Seamless integration with your favorite services',
              'Automatic sync of data and preferences',
              'Enhanced security with trusted providers',
              'Access to premium features and content',
              'Unified experience across platforms'
            ]}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  <CheckCircleFilled style={{ color: '#52c41a' }} />
                  <Text>{item}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </Drawer>
  );
};
