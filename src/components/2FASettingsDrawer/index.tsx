import { useState, useEffect, useRef } from "react";
import { Drawer, Input, Button, Space, Typography, Switch, Divider, Flex, Alert } from "antd";
import { User } from '../../services/api';
import { AuthenticatorApp, QRCodeGenerator } from '../../utils/AuthenticatorApp';
import { SMSAuthenticator, SMSVerificationSession, WhatsAppAuthenticator, WhatsAppVerificationSession } from '../../utils/SMSAuthenticator';
import { MobileOutlined, WhatsAppOutlined, QrcodeOutlined, DownloadOutlined, CopyOutlined, CheckCircleFilled, SafetyOutlined } from "@ant-design/icons";
import "./styles.scss";
import { LegacyRefresh1pxIcon } from "@deriv/quill-icons";

const { Title, Text } = Typography;

interface ProfileSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function TwoFASettingsDrawer({ visible, onClose, user }: ProfileSettingsDrawerProps) {
  // SMS State
  const [smsCode, setSmsCode] = useState(['', '', '', '', '', '']);
  const smsInputRefs = useRef<(InputRef | null)[]>([]);
  const [smsSetupStep, setSmsSetupStep] = useState<'setup' | 'verify'>('setup');
  const [smsSessionId, setSmsSessionId] = useState<string | null>(null);
  const [smsCodeExpiresAt, setSmsCodeExpiresAt] = useState<number | null>(null);
  const [smsResendAvailable, setSmsResendAvailable] = useState(true);
  const [smsResendCountdown, setSmsResendCountdown] = useState(0);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsShake, setSmsShake] = useState(false);

  // WhatsApp State
  const [whatsappCode, setWhatsappCode] = useState(['', '', '', '', '', '']);
  const whatsappInputRefs = useRef<(InputRef | null)[]>([]);
  const [whatsappSetupStep, setWhatsappSetupStep] = useState<'setup' | 'verify'>('setup');
  const [whatsappSessionId, setWhatsappSessionId] = useState<string | null>(null);
  const [whatsappCodeExpiresAt, setWhatsappCodeExpiresAt] = useState<number | null>(null);
  const [whatsappResendAvailable, setWhatsappResendAvailable] = useState(true);
  const [whatsappResendCountdown, setWhatsappResendCountdown] = useState(0);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappShake, setWhatsappShake] = useState(false);

  // WhatsApp Input Refs
  // Removed single ref in favor of array refs above

  // Authenticator 2FA State
    const [authenticatorSecret, setAuthenticatorSecret] = useState('');
  const [authenticatorQRCode, setAuthenticatorQRCode] = useState('');
  const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState<'setup' | 'verify'>('setup');
  const [authenticatorLoading, setAuthenticatorLoading] = useState(false);
  const [authenticatorVerificationCode, setAuthenticatorVerificationCode] = useState('');
  const [authenticatorShake, setAuthenticatorShake] = useState(false);
  
  // Modal States
  const [smsModalVisible, setSmsModalVisible] = useState(false);
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
  const [authenticatorModalVisible, setAuthenticatorModalVisible] = useState(false);
  const [backupCodesModalVisible, setBackupCodesModalVisible] = useState(false);
  
  // Backup Codes State
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCodesGenerated, setBackupCodesGenerated] = useState(false);
  const [backupCodesLoading, setBackupCodesLoading] = useState(false);
  
  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'whatsapp' | 'authenticator' | null>(null);
  
  // SMS Code Handlers
  const handleSMSCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...smsCode];
    newCode[index] = value;
    setSmsCode(newCode);
    
    // Auto-focus to next input
    if (value && index < 5) {
      smsInputRefs.current[index + 1]?.focus();
    }
  };

  const handleSMSKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !smsCode[index] && index > 0) {
      smsInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      smsInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      smsInputRefs.current[index + 1]?.focus();
    }
  };

  // WhatsApp Code Handlers
  const handleWhatsAppCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...whatsappCode];
    newCode[index] = value;
    setWhatsappCode(newCode);
    
    // Auto-focus to next input
    if (value && index < 5) {
      whatsappInputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleWhatsAppKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !whatsappCode[index] && index > 0) {
      whatsappInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      whatsappInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      whatsappInputRefs.current[index + 1]?.focus();
    }
  };
  // Helper function to start resend countdown
  const startResendCountdown = () => {
    setSmsResendCountdown(60); // 60 seconds countdown
    setSmsResendAvailable(false);
  };

  // Helper function to start WhatsApp resend countdown
  const startWhatsAppResendCountdown = () => {
    setWhatsappResendCountdown(60); // 60 seconds countdown
    setWhatsappResendAvailable(false);
  };

  // Real-time countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      // Check if SMS code has expired
      if (smsCodeExpiresAt && smsCodeExpiresAt > 0 && Date.now() > smsCodeExpiresAt) {
        setSmsResendAvailable(true);
        setSmsResendCountdown(0);
      }
      
      // Update SMS resend countdown
      if (smsResendCountdown > 0) {
        setSmsResendCountdown(prev => prev - 1);
      }

      // Check if WhatsApp code has expired
      if (whatsappCodeExpiresAt && whatsappCodeExpiresAt > 0 && Date.now() > whatsappCodeExpiresAt) {
        setWhatsappResendAvailable(true);
        setWhatsappResendCountdown(0);
      }
      
      // Update WhatsApp resend countdown
      if (whatsappResendCountdown > 0) {
        setWhatsappResendCountdown(prev => prev - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [smsCodeExpiresAt, smsResendCountdown, whatsappCodeExpiresAt, whatsappResendCountdown]);

  // SMS Authentication Functions
  const handleSetupSMS = async () => {
    if (!user?.phoneNumber) {
      console.error('No phone number available');
      return;
    }

    setSmsLoading(true);
    try {
      // Validate phone number
      if (!SMSAuthenticator.validatePhoneNumber(user.phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Create SMS session
      const sessionId = `sms_${user.id}_${Date.now()}`;
      const session = SMSVerificationSession.getInstance();
      const { code, expiresAt } = session.createSession(sessionId, user.phoneNumber);

      // Send SMS
      const message = SMSAuthenticator.generateSMSMessage(code, 'Koppo App');
      const smsSent = await SMSAuthenticator.sendSMS(user.phoneNumber, message);

      if (smsSent) {
        setSmsSessionId(sessionId);
        setSmsCodeExpiresAt(expiresAt);
        setSmsSetupStep('verify');
        setSmsResendAvailable(false);
        setTwoFactorMethod('sms');
        
        // Start countdown timer
        startResendCountdown();
        
        // Reset SMS code inputs
        setSmsCode(['', '', '', '', '', '']);
                
        alert('SMS code sent successfully');
      } else {
        throw new Error('Failed to send SMS');
      }
    } catch {
      alert('Failed to send SMS. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleVerifySMS = async () => {
    // Combine the 6-digit code from input fields
    const enteredCode = smsCode.join('');
    
        
    if (!enteredCode || !smsSessionId) {
      return;
    }

    // Check if code has expired
    if (smsCodeExpiresAt && Date.now() > smsCodeExpiresAt) {
            alert('Verification code has expired. Please request a new code.');
      return;
    }

    setSmsLoading(true);
    try {
      const session = SMSVerificationSession.getInstance();
      
            
      const isValid = session.verifyCode(smsSessionId, enteredCode);

      
      if (isValid) {
        // TODO: Save to backend
                setTwoFactorMethod('sms');
        setTwoFactorEnabled(true);
        setSmsSetupStep('setup');
        setSmsCode(['', '', '', '', '', '']);
                setSmsSessionId('');
        setSmsCodeExpiresAt(0);
        setSmsResendAvailable(true);
        setSmsResendCountdown(0);
        
        alert('SMS authentication enabled successfully!');
      } else {
                // Trigger shake effect
        setSmsShake(true);
        setTimeout(() => setSmsShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch {
      alert('Failed to verify code. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleResendSMS = async () => {
    if (!smsSessionId || !smsResendAvailable) {
      return;
    }

    setSmsLoading(true);
    try {
      const session = SMSVerificationSession.getInstance();
      const result = session.resendCode(smsSessionId);

      if (result) {
        // Send new SMS
        const message = SMSAuthenticator.generateSMSMessage(result.code, 'Koppo App');
        const smsSent = await SMSAuthenticator.sendSMS(user?.phoneNumber || '', message);

        if (smsSent) {
          setSmsCodeExpiresAt(result.expiresAt);
          setSmsResendAvailable(false);
          // Clear previous code
          startResendCountdown();
          
                    alert('New verification code sent successfully!');
        } else {
          throw new Error('Failed to resend SMS');
        }
      }
    } catch {
      alert('Failed to resend verification code. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleCancelSMSSetup = () => {
    setSmsSetupStep('setup');
        setSmsSessionId('');
    setSmsCodeExpiresAt(0);
    setSmsResendAvailable(true);
    setSmsResendCountdown(0);
    setTwoFactorMethod(null);
  };

  // WhatsApp Authentication Functions
  const handleSetupWhatsApp = async () => {
    if (!user?.phoneNumber) {
      console.error('No phone number available');
      return;
    }

    setWhatsappLoading(true);
    try {
      // Validate phone number
      if (!WhatsAppAuthenticator.validatePhoneNumber(user.phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Create WhatsApp session
      const sessionId = `whatsapp_${user.id}_${Date.now()}`;
      const session = WhatsAppVerificationSession.getInstance();
      const { code, expiresAt } = session.createSession(sessionId, user.phoneNumber);

      // Send WhatsApp
      const message = WhatsAppAuthenticator.generateWhatsAppMessage(code, 'Koppo App');
      const whatsappSent = await WhatsAppAuthenticator.sendWhatsApp(user.phoneNumber, message);

      if (whatsappSent) {
        setWhatsappSessionId(sessionId);
        setWhatsappCodeExpiresAt(expiresAt);
        setWhatsappSetupStep('verify');
        setWhatsappResendAvailable(false);
        setTwoFactorMethod('whatsapp');
        
        // Start countdown timer
        startWhatsAppResendCountdown();
        
        // Reset WhatsApp code inputs
        setWhatsappCode(['', '', '', '', '', '']);
                
        alert('WhatsApp code sent successfully!');
      } else {
        throw new Error('Failed to send WhatsApp');
      }
    } catch {
      alert('Failed to send WhatsApp. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleVerifyWhatsApp = async () => {
    // Combine the 6-digit code from input fields
    const enteredCode = whatsappCode.join('');
    
            
    if (!enteredCode || !whatsappSessionId) {
      return;
    }

    // Check if code has expired
    if (whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt) {
            alert('Verification code has expired. Please request a new code.');
      return;
    }

    setWhatsappLoading(true);
    try {
      const session = WhatsAppVerificationSession.getInstance();
      
            
      const isValid = session.verifyCode(whatsappSessionId, enteredCode);

      
      if (isValid) {
        // TODO: Save to backend
                setTwoFactorMethod('whatsapp');
        setTwoFactorEnabled(true);
        setWhatsappSetupStep('setup');
        setWhatsappCode(['', '', '', '', '', '']);
                setWhatsappSessionId('');
        setWhatsappCodeExpiresAt(0);
        setWhatsappResendAvailable(true);
        setWhatsappResendCountdown(0);
        
        alert('WhatsApp authentication enabled successfully!');
      } else {
                // Trigger shake effect
        setWhatsappShake(true);
        setTimeout(() => setWhatsappShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch {
      alert('Failed to verify code. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleResendWhatsApp = async () => {
    if (!whatsappSessionId || !whatsappResendAvailable) {
      return;
    }

    setWhatsappLoading(true);
    try {
      const session = WhatsAppVerificationSession.getInstance();
      const result = session.resendCode(whatsappSessionId);

      if (result) {
        // Send new WhatsApp
        const message = WhatsAppAuthenticator.generateWhatsAppMessage(result.code, 'Koppo App');
        const whatsappSent = await WhatsAppAuthenticator.sendWhatsApp(user?.phoneNumber || '', message);

        if (whatsappSent) {
          setWhatsappCodeExpiresAt(result.expiresAt);
          setWhatsappResendAvailable(false);
          // Clear previous code
          startWhatsAppResendCountdown();
          
                    alert('New verification code sent successfully!');
        } else {
          throw new Error('Failed to resend WhatsApp');
        }
      }
    } catch {
      alert('Failed to resend verification code. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleCancelWhatsAppSetup = () => {
    setWhatsappSetupStep('setup');
        setWhatsappSessionId('');
    setWhatsappCodeExpiresAt(0);
    setWhatsappResendAvailable(true);
    setWhatsappResendCountdown(0);
    setTwoFactorMethod(null);
  };

  // Authenticator Functions
  const handleSetupAuthenticator = async () => {
    setAuthenticatorLoading(true);
    try {
      // Generate secret key
      const secret = AuthenticatorApp.generateSecret();
      setAuthenticatorSecret(secret);

      // Generate QR code data
      const qrData = AuthenticatorApp.generateQRCodeData(
        secret,
        user?.email || 'user@example.com',
        'Koppo App'
      );

      // Generate QR code image
      const qrImage = await QRCodeGenerator.generateQRCode(qrData);
      setAuthenticatorQRCode(qrImage);

      // Move to verify step and set method
      setAuthenticatorSetupStep('verify');
      setTwoFactorMethod('authenticator');
    } catch {
      alert('Failed to setup authenticator. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
    }
  };

  const handleVerifyAuthenticator = async () => {
    if (!authenticatorVerificationCode || !authenticatorSecret) {
      return;
    }

    setAuthenticatorLoading(true);
    try {
      const isValid = AuthenticatorApp.verifyTOTP(
        authenticatorSecret,
        authenticatorVerificationCode
      );

      if (isValid) {
        // TODO: Save to backend
                setTwoFactorMethod('authenticator');
        setTwoFactorEnabled(true);
        setAuthenticatorSetupStep('setup');
        setAuthenticatorVerificationCode('');
        setAuthenticatorSecret('');
        setAuthenticatorQRCode('');
      } else {
        // Trigger shake effect
        setAuthenticatorShake(true);
        setTimeout(() => setAuthenticatorShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch {
      alert('Failed to verify authenticator. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
    }
  };

  // Backup Codes Functions
  const generateBackupCodes = () => {
    setBackupCodesLoading(true);
    
    // Generate 10 backup codes (8 digits each)
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString().substr(2, 8);
      codes.push(code);
    }
    
    setBackupCodes(codes);
    setBackupCodesGenerated(true);
    setBackupCodesLoading(false);
    
    alert('Backup codes generated successfully! Please save them in a secure location.');
  };

  const downloadBackupCodes = () => {
    if (backupCodes.length === 0) {
      alert('No backup codes to download. Please generate backup codes first.');
      return;
    }

    const content = `Two-Factor Authentication Backup Codes\n` +
      `Generated on: ${new Date().toLocaleString()}\n` +
      `User: ${user?.email || 'N/A'}\n` +
      `\nKeep these codes in a safe and secure location.\n` +
      `Each code can only be used once.\n` +
      `\nBackup Codes:\n` +
      backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `2fa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const regenerateBackupCodes = () => {
    if (confirm('Are you sure you want to regenerate backup codes? The old codes will no longer be valid.')) {
      generateBackupCodes();
    }
  };

  const handleCancelAuthenticatorSetup = () => {
    setAuthenticatorSetupStep('setup');
    setAuthenticatorVerificationCode('');
    setAuthenticatorSecret('');
    setAuthenticatorQRCode('');
    setTwoFactorMethod(null);
  };

  // Missing Disable Handlers
  const handleDisableSMS = () => {
    if (confirm('Are you sure you want to disable SMS authentication?')) {
      setTwoFactorMethod(null);
      setSmsSetupStep('setup');
      setSmsCode(['', '', '', '', '', '']);
      setSmsSessionId('');
      setSmsCodeExpiresAt(0);
      setSmsResendAvailable(true);
      setSmsResendCountdown(0);
      alert('SMS authentication disabled successfully.');
    }
  };

  const handleDisableWhatsApp = () => {
    if (confirm('Are you sure you want to disable WhatsApp authentication?')) {
      setTwoFactorMethod(null);
      setWhatsappSetupStep('setup');
      setWhatsappCode(['', '', '', '', '', '']);
      setWhatsappSessionId('');
      setWhatsappCodeExpiresAt(0);
      setWhatsappResendAvailable(true);
      setWhatsappResendCountdown(0);
      alert('WhatsApp authentication disabled successfully.');
    }
  };

  const handleDisableAuthenticator = () => {
    if (confirm('Are you sure you want to disable authenticator app authentication?')) {
      setTwoFactorMethod(null);
      setAuthenticatorSetupStep('setup');
      setAuthenticatorVerificationCode('');
      setAuthenticatorSecret('');
      setAuthenticatorQRCode('');
      alert('Authenticator app authentication disabled successfully.');
    }
  };

  
  return (
    <Drawer
      title="Two-Factor Authentication"
      placement="right"
      onClose={onClose}
      open={visible}
      size={600}
      className="profile-settings-drawer"
    >
      <div className="twofa-content">
        <div className="status-card-premium">
          <div className="status-header">
            <div className={`status-icon ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
              <CheckCircleFilled />
            </div>
            <div className="status-info">
              <Title level={4} className="status-title">
                {twoFactorEnabled ? 'Security Active' : 'Security Inactive'}
              </Title>
              <Text className="status-subtitle">
                {twoFactorEnabled 
                  ? 'Your account is protected' 
                  : 'Add an extra layer of protection'}
              </Text>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onChange={setTwoFactorEnabled}
              className="premium-switch"
            />
          </div>
          {!twoFactorEnabled && (
            <div className="status-footer">
              <Text className="footer-text">
                Enable 2FA to prevent unauthorized access to your account.
              </Text>
            </div>
          )}
        </div>

        {/* 2FA Methods Buttons */}
        {twoFactorEnabled && (
          <div className="method-selection-premium">
            <Text className="selection-title">Authentication Methods</Text>
            <div className="method-grid">
              <Button 
                className={`method-item ${twoFactorMethod === 'sms' ? 'active' : ''}`}
                onClick={() => setSmsModalVisible(true)}
              >
                <div className="method-icon-wrapper">
                  <MobileOutlined />
                </div>
                <div className="method-content">
                  <span className="method-name">SMS Codes</span>
                  <span className="method-desc">Get codes via text message</span>
                </div>
                {twoFactorMethod === 'sms' && <CheckCircleFilled className="active-check" />}
              </Button>
              
              <Button 
                className={`method-item ${twoFactorMethod === 'whatsapp' ? 'active' : ''}`}
                onClick={() => setWhatsappModalVisible(true)}
              >
                <div className="method-icon-wrapper whatsapp">
                  <WhatsAppOutlined />
                </div>
                <div className="method-content">
                  <span className="method-name">WhatsApp</span>
                  <span className="method-desc">Codes sent to WhatsApp</span>
                </div>
                {twoFactorMethod === 'whatsapp' && <CheckCircleFilled className="active-check" />}
              </Button>
              
              <Button 
                className={`method-item ${twoFactorMethod === 'authenticator' ? 'active' : ''}`}
                onClick={() => setAuthenticatorModalVisible(true)}
              >
                <div className="method-icon-wrapper auth">
                  <QrcodeOutlined />
                </div>
                <div className="method-content">
                  <span className="method-name">Auth App</span>
                  <span className="method-desc">Use Google Authenticator</span>
                </div>
                {twoFactorMethod === 'authenticator' && <CheckCircleFilled className="active-check" />}
              </Button>
              
              <Button 
                className="method-item"
                onClick={() => setBackupCodesModalVisible(true)}
              >
                <div className="method-icon-wrapper backup">
                  <DownloadOutlined />
                </div>
                <div className="method-content">
                  <span className="method-name">Backup Codes</span>
                  <span className="method-desc">Recovery access keys</span>
                </div>
                {backupCodesGenerated && <CheckCircleFilled className="active-check success" />}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* SMS Drawer */}
      <Drawer
        title="SMS Authentication"
        placement="right"
        onClose={() => setSmsModalVisible(false)}
        open={smsModalVisible}
        width={400}
        className="premium-sub-drawer"
      >
        {/* Default State */}
        {smsSetupStep === 'setup' && (
          <div className="feature-intro">
            <div className="intro-icon">
              <MobileOutlined />
            </div>
            
            <Title level={2} className="intro-title">SMS Security</Title>
            <Text className="intro-description">
              Secure your account with a secondary verification code sent via text message.
            </Text>

            <div className="feature-benefits">
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">Instant Setup</span>
                  <span className="benefit-text">Start protecting your account in under a minute.</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">Global Reach</span>
                  <span className="benefit-text">Works with mobile providers worldwide.</span>
                </div>
              </div>
            </div>

            <div className="phone-number-display">
              <Text className="label">Current Phone Number</Text>
              <Text className="number">
                {user?.phoneNumber ? SMSAuthenticator.maskPhoneNumber(user.phoneNumber) : 'No phone number set'}
              </Text>
            </div>

            <div className="action-buttons">
              {!twoFactorMethod || twoFactorMethod !== 'sms' ? (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleSetupSMS}
                  loading={smsLoading}
                  disabled={!user?.phoneNumber}
                  block
                >
                  Enable SMS Security
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleDisableSMS}
                  loading={smsLoading}
                  block
                  danger
                >
                  Disable SMS Authentication
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Verification State */}
        {smsSetupStep === 'verify' && (
          <div className="verification-screen">
            <div className="screen-icon">
              <MobileOutlined />
            </div>
            
            <Title level={3} className="screen-title">Verify SMS Code</Title>
            <Text className="screen-description">
              We've sent a 6-digit verification code to your phone number.
            </Text>

            <div className="phone-number-display">
              {user?.phoneNumber ? SMSAuthenticator.maskPhoneNumber(user.phoneNumber) : 'your phone number'}
            </div>

            <div className="verification-inputs-container">
              <div className={`verification-inputs-group ${smsShake ? 'shake' : ''}`}>
                <Space size={8}>
                  {smsCode.slice(0, 3).map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        if (el) {
                          smsInputRefs.current[index] = el;
                        }
                      }}
                      value={digit}
                      onChange={(e) => handleSMSCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleSMSKeyDown(index, e)}
                      maxLength={1}
                      className="premium-otp-input"
                    />
                  ))}
                </Space>
                <div className="otp-separator">—</div>
                <Space size={8}>
                  {smsCode.slice(3, 6).map((digit, index) => (
                    <Input
                      key={index + 3}
                      ref={(el) => {
                        if (el) {
                          smsInputRefs.current[index + 3] = el;
                        }
                      }}
                      value={digit}
                      onChange={(e) => handleSMSCodeChange(index + 3, e.target.value)}
                      onKeyDown={(e) => handleSMSKeyDown(index + 3, e)}
                      maxLength={1}
                      className="premium-otp-input"
                    />
                  ))}
                </Space>
              </div>
            </div>

            <div className="countdown-container">
              <Text type="secondary" className="countdown-text">
                {smsCodeExpiresAt && Date.now() > smsCodeExpiresAt 
                  ? 'Code expired' 
                  : `Code expires in: ${smsCodeExpiresAt ? SMSAuthenticator.formatRemainingTime(smsCodeExpiresAt) : 'Loading...'}`
                }
              </Text>
            </div>

            <div className="action-buttons">
              {smsCodeExpiresAt && Date.now() > smsCodeExpiresAt ? (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleResendSMS}
                  loading={smsLoading}
                  block
                >
                  Resend Code
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleVerifySMS}
                  loading={smsLoading}
                  block
                >
                  Verify
                </Button>
              )}
              <Button 
                type="text" 
                size="large"
                onClick={handleCancelSMSSetup}
                block
              >
                Change Phone Number
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* WhatsApp Drawer */}
      <Drawer
        title="WhatsApp Authentication"
        placement="right"
        onClose={() => setWhatsappModalVisible(false)}
        open={whatsappModalVisible}
        size={400}
      >
        {/* Default State */}
        {whatsappSetupStep === 'setup' && (
          <div className="feature-intro">
            <div className="intro-icon">
              <WhatsAppOutlined />
            </div>
            
            <Title level={2} className="intro-title">WhatsApp Security</Title>
            <Text className="intro-description">
              Get verification codes delivered directly to your WhatsApp for faster and more secure access.
            </Text>

            <div className="feature-benefits">
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">Global Accessibility</span>
                  <span className="benefit-text">Works anywhere you have an internet connection.</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">End-to-End Encrypted</span>
                  <span className="benefit-text">Your codes are protected by WhatsApp's industry-leading security.</span>
                </div>
              </div>
            </div>

            <div className="phone-number-display" style={{ width: '100%', marginBottom: 32 }}>
              <Text strong style={{ display: 'block', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, marginBottom: 8 }}>
                WhatsApp Number
              </Text>
              <Text style={{ fontSize: 20, color: 'var(--accent-primary)', fontWeight: 700 }}>
                {user?.phoneNumber ? SMSAuthenticator.maskPhoneNumber(user.phoneNumber) : 'No phone number set'}
              </Text>
            </div>

            <div className="action-buttons">
              {!twoFactorMethod || twoFactorMethod !== 'whatsapp' ? (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleSetupWhatsApp}
                  loading={whatsappLoading}
                  disabled={!user?.phoneNumber}
                  block
                >
                  Enable WhatsApp Security
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleDisableWhatsApp}
                  loading={whatsappLoading}
                  block
                  danger
                >
                  Disable WhatsApp Authentication
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Verification State */}
        {whatsappSetupStep === 'verify' && (
          <div className="verification-screen">
            <div className="screen-icon">
              <WhatsAppOutlined />
            </div>
            
            <Title level={3} className="screen-title">Verify WhatsApp Code</Title>
            <Text className="screen-description">
              We've sent a 6-digit verification code to your WhatsApp.
            </Text>

            <div className="phone-number-display">
              {user?.phoneNumber ? SMSAuthenticator.maskPhoneNumber(user.phoneNumber) : 'your phone number'}
            </div>

            <div className="verification-inputs-container">
              <div className={`verification-inputs-group ${whatsappShake ? 'shake' : ''}`}>
                <Space size={8}>
                  {whatsappCode.slice(0, 3).map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        if (el) {
                          whatsappInputRefs.current[index] = el;
                        }
                      }}
                      value={digit}
                      onChange={(e) => handleWhatsAppCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleWhatsAppKeyDown(index, e)}
                      maxLength={1}
                      className="premium-otp-input"
                    />
                  ))}
                </Space>
                <div className="otp-separator">—</div>
                <Space size={8}>
                  {whatsappCode.slice(3, 6).map((digit, index) => (
                    <Input
                      key={index + 3}
                      ref={(el) => {
                        if (el) {
                          whatsappInputRefs.current[index + 3] = el;
                        }
                      }}
                      value={digit}
                      onChange={(e) => handleWhatsAppCodeChange(index + 3, e.target.value)}
                      onKeyDown={(e) => handleWhatsAppKeyDown(index + 3, e)}
                      maxLength={1}
                      className="premium-otp-input"
                    />
                  ))}
                </Space>
              </div>
            </div>

            <div className="countdown-container">
              <Text type="secondary" className="countdown-text">
                {whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt 
                  ? 'Code expired' 
                  : `Code expires in: ${whatsappCodeExpiresAt ? WhatsAppAuthenticator.formatRemainingTime(whatsappCodeExpiresAt) : 'Loading...'}`
                }
              </Text>

              <Text>Having trouble? Sometimes it takes up to 10 minutes to retrieve a verification code. If it's been longer than that, return to the previous page and try again.</Text>
            </div>

            <div className="action-buttons">
              {whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt ? (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleResendWhatsApp}
                  loading={whatsappLoading}
                  block
                >
                  Resend Code
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleVerifyWhatsApp}
                  loading={whatsappLoading}
                  block
                >
                  Verify
                </Button>
              )}
              <Button 
                type="text" 
                size="large"
                onClick={handleCancelWhatsAppSetup}
                block
              >
                Change Phone Number
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Authenticator Drawer */}
      <Drawer
        title="Authenticator App"
        placement="right"
        onClose={() => setAuthenticatorModalVisible(false)}
        open={authenticatorModalVisible}
        width={400}
        className="premium-sub-drawer"
      >
        {/* Default State */}
        {authenticatorSetupStep === 'setup' && (
          <div className="feature-intro">
            <div className="intro-icon">
              <QrcodeOutlined />
            </div>
            
            <Title level={2} className="intro-title">Authenticator</Title>
            <Text className="intro-description">
              Generate secure verification codes offline using an authenticator app.
            </Text>

            <div className="feature-benefits">
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">Offline Codes</span>
                  <span className="benefit-text">Works even without cellular service or internet.</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">Universal Support</span>
                  <span className="benefit-text">Google Authenticator, Authy, Microsoft Auth, etc.</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              {!twoFactorMethod || twoFactorMethod !== 'authenticator' ? (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleSetupAuthenticator}
                  loading={authenticatorLoading}
                  block
                >
                  Enable Auth App
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleDisableAuthenticator}
                  loading={authenticatorLoading}
                  block
                  danger
                >
                  Disable Authenticator
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Verification State */}
        {authenticatorSetupStep === 'verify' && (
          <div className="verification-screen">
            <div className="screen-icon">
              <QrcodeOutlined />
            </div>
            
            <Title level={3} className="screen-title">Link App</Title>
            <Text className="screen-description">
              Scan the QR code below with your authenticator app, then enter the 6-digit verification code.
            </Text>

            <div className="verification-inputs-container">
              <div className="qr-code-container" style={{ marginBottom: 32 }}>
                {authenticatorQRCode && (
                  <img 
                    src={authenticatorQRCode} 
                    alt="Authenticator QR Code" 
                  />
                )}
              </div>

              <div className={`verification-inputs-group ${authenticatorShake ? 'shake' : ''}`}>
                <Input
                  placeholder="000 000"
                  value={authenticatorVerificationCode}
                  onChange={(e) => setAuthenticatorVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="premium-otp-input single-block"
                  style={{ 
                    width: '220px',
                    letterSpacing: '4px',
                    fontSize: '28px',
                    height: '60px',
                    borderRadius: '16px',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>

            <div className="action-buttons">
              <Button 
                type="primary" 
                size="large"
                onClick={handleVerifyAuthenticator}
                loading={authenticatorLoading}
                block
              >
                Verify & Enable
              </Button>
              <Button 
                type="text" 
                size="large"
                onClick={handleCancelAuthenticatorSetup}
                block
              >
                Cancel Setup
              </Button>
            </div>

            <div className="security-note" style={{ marginTop: 24, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '12px' }}>
              <SafetyOutlined style={{ marginRight: 8, color: 'var(--accent-primary)' }} />
              Keep your phone secure. These codes change every 30 seconds.
            </div>
          </div>
        )}
      </Drawer>

      {/* Backup Codes Drawer */}
      <Drawer
        title="Backup Codes"
        placement="right"
        onClose={() => setBackupCodesModalVisible(false)}
        open={backupCodesModalVisible}
        width={500}
        className="premium-sub-drawer"
      >
        <Alert
          message="Emergency Recovery"
          description="Generate backup codes to access your account when you can't use your regular 2FA method. Keep these codes in a secure location."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        {!backupCodesGenerated ? (
          <div className="feature-intro">
            <div className="intro-icon">
              <DownloadOutlined />
            </div>
            
            <Title level={2} className="intro-title">Backup Codes</Title>
            <Text className="intro-description">
              Generate one-time recovery codes to access your account if you lose your 2FA device.
            </Text>

            <div className="feature-benefits">
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">Offline Recovery</span>
                  <span className="benefit-text">Always have a way in, even without your phone or internet.</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">Secure & Unique</span>
                  <span className="benefit-text">Each code is 8 digits long and can only be used once.</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <Button 
                type="primary" 
                size="large"
                onClick={generateBackupCodes}
                loading={backupCodesLoading}
                block
              >
                Generate Recovery Codes
              </Button>
            </div>
          </div>
        ) : (
          <div className="verification-screen">
            <div className="screen-icon" style={{ background: 'linear-gradient(135deg, var(--success), #059669)' }}>
              <CheckCircleFilled />
            </div>
            
            <Title level={3} className="screen-title">Codes Generated</Title>
            <Text className="screen-description">
              Save these codes in a secure place. You can use each code only once.
            </Text>

            <div className="backup-codes-list" style={{ width: '100%', marginTop: 16 }}>
              {backupCodes.map((code, index) => (
                <div key={index}>
                  <Flex align="center" justify="space-between" style={{ padding: '8px 0' }}>
                    <Text code style={{ 
                      background: 'transparent',
                      padding: 0,
                      fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                      fontSize: 22,
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}>
                      {code}
                    </Text>
                    <Button 
                      type="text" 
                      size="large"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        alert(`Code copied to clipboard!`);
                      }}
                    />
                  </Flex>
                  {index < backupCodes.length - 1 && <Divider style={{ margin: '4px 0', opacity: 0.1 }} />}
                </div>
              ))}
            </div>

            <div className="action-buttons" style={{ marginTop: 32 }}>
              <Button 
                type="primary" 
                size="large"
                icon={<DownloadOutlined />}
                onClick={downloadBackupCodes}
                block
              >
                Download as Text File
              </Button>
              <Button 
                type="text" 
                size="large"
                icon={<LegacyRefresh1pxIcon />}
                onClick={regenerateBackupCodes}
                block
              >
                Regenerate New Codes
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </Drawer>
  );
}

export default TwoFASettingsDrawer;
