import { useState, useEffect, useRef } from "react";
import { Drawer, Input, Button, Space, Typography, Switch, Flex, InputRef } from "antd";
import { User } from '../../services/api';
import { SMSAuthenticator, SMSVerificationSession, WhatsAppAuthenticator, WhatsAppVerificationSession } from '../../utils/SMSAuthenticator';
import { apiAuth2FAService, BackupCode } from '../../services/apiAuth2FAService';
import { MobileOutlined, WhatsAppOutlined, QrcodeOutlined, DownloadOutlined, CopyOutlined, CheckCircleFilled, SafetyOutlined, WarningOutlined, MailOutlined } from "@ant-design/icons";
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

  // Email State
  const [emailCode, setEmailCode] = useState(['', '', '', '', '', '']);
  const emailInputRefs = useRef<(InputRef | null)[]>([]);
  const [emailSetupStep, setEmailSetupStep] = useState<'setup' | 'verify'>('setup');
  const [emailSessionId, setEmailSessionId] = useState<string | null>(null);
  const [emailCodeExpiresAt, setEmailCodeExpiresAt] = useState<number | null>(null);
  const [emailResendAvailable, setEmailResendAvailable] = useState(true);
  const [emailResendCountdown, setEmailResendCountdown] = useState(0);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailShake, setEmailShake] = useState(false);

  // Authenticator 2FA State
    const [authenticatorSecret, setAuthenticatorSecret] = useState('');
  const [authenticatorQRCode, setAuthenticatorQRCode] = useState('');
  const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState<'setup' | 'verify'>('setup');
  const [authenticatorLoading, setAuthenticatorLoading] = useState(false);
  const [authenticatorCode, setAuthenticatorCode] = useState(['', '', '', '', '', '']);
  const authenticatorInputRefs = useRef<(InputRef | null)[]>([]);
  const [authenticatorShake, setAuthenticatorShake] = useState(false);
  const [totpTimeRemaining, setTotpTimeRemaining] = useState(30);
  
  // Modal States
  const [smsModalVisible, setSmsModalVisible] = useState(false);
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [authenticatorModalVisible, setAuthenticatorModalVisible] = useState(false);
  const [backupCodesModalVisible, setBackupCodesModalVisible] = useState(false);
  
  // Backup Codes State
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [backupCodesGenerated, setBackupCodesGenerated] = useState(false);
  const [backupCodesLoading, setBackupCodesLoading] = useState(false);
  
  // 2FA State - now using user.twoFactorAuth from backend
  const [masterSwitchLoading, setMasterSwitchLoading] = useState(false);
  const [show2FAMethods, setShow2FAMethods] = useState(false);
  
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

  // Email Code Handlers
  const handleEmailCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...emailCode];
    newCode[index] = value;
    setEmailCode(newCode);
    
    // Auto-focus to next input
    if (value && index < 5) {
      emailInputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleEmailKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !emailCode[index] && index > 0) {
      emailInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      emailInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      emailInputRefs.current[index + 1]?.focus();
    }
  };

  // Authenticator Code Handlers
  const handleAuthenticatorCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...authenticatorCode];
    newCode[index] = value;
    setAuthenticatorCode(newCode);
    
    // Auto-focus to next input
    if (value && index < 5) {
      authenticatorInputRefs.current[index + 1]?.focus();
    }
  };

  const handleAuthenticatorKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !authenticatorCode[index] && index > 0) {
      authenticatorInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      authenticatorInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      authenticatorInputRefs.current[index + 1]?.focus();
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

      // Check if Email code has expired
      if (emailCodeExpiresAt && emailCodeExpiresAt > 0 && Date.now() > emailCodeExpiresAt) {
        setEmailResendAvailable(true);
        setEmailResendCountdown(0);
      }
      
      // Update Email resend countdown
      if (emailResendCountdown > 0) {
        setEmailResendCountdown(prev => prev - 1);
      }

      // Update TOTP countdown (30-second window)
      if (authenticatorSetupStep === 'verify') {
        const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
        setTotpTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [smsCodeExpiresAt, smsResendCountdown, whatsappCodeExpiresAt, whatsappResendCountdown, emailCodeExpiresAt, emailResendCountdown, authenticatorSetupStep]);

  // SMS Authentication Functions
  const handleSetupSMS = async () => {
    if (!user?.phoneNumber) {
      console.error('No phone number available');
      return;
    }

    setSmsLoading(true);
    try {
      // Send SMS OTP via backend
      const response = await apiAuth2FAService.sendSMSOTP(user.phoneNumber);
      
      // Parse expiry time (e.g., "5 minutes" -> milliseconds)
      const expiryMinutes = parseInt(response.expiresIn);
      const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
      
      setSmsCodeExpiresAt(expiresAt);
      setSmsSetupStep('verify');
      setSmsResendAvailable(false);
      
      // Start countdown timer
      startResendCountdown();
      
      // Reset SMS code inputs
      setSmsCode(['', '', '', '', '', '']);
              
      alert('SMS code sent successfully');
    } catch (error) {
      console.error('Failed to send SMS:', error);
      alert('Failed to send SMS. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleVerifySMS = async () => {
    // Combine the 6-digit code from input fields
    const enteredCode = smsCode.join('');
    
    if (!enteredCode || enteredCode.length !== 6) {
      return;
    }

    // Check if code has expired
    if (smsCodeExpiresAt && Date.now() > smsCodeExpiresAt) {
      alert('Verification code has expired. Please request a new code.');
      return;
    }

    setSmsLoading(true);
    try {
      // Verify OTP with backend
      const response = await apiAuth2FAService.verifySMSOTP(enteredCode);
      
      if (response.verified) {
        // Set SMS as default 2FA method
        await apiAuth2FAService.setSMSAsDefault();
        
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
        setSmsCode(['', '', '', '', '', '']);
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('SMS verification error:', error);
      
      // Trigger shake effect on error
      setSmsShake(true);
      setTimeout(() => setSmsShake(false), 500);
      setSmsCode(['', '', '', '', '', '']);
      
      alert('Failed to verify code. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleResendSMS = async () => {
    if (!smsResendAvailable || !user?.phoneNumber) {
      return;
    }

    setSmsLoading(true);
    try {
      // Resend SMS OTP via backend
      const response = await apiAuth2FAService.sendSMSOTP(user.phoneNumber);
      
      // Parse expiry time
      const expiryMinutes = parseInt(response.expiresIn);
      const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
      
      setSmsCodeExpiresAt(expiresAt);
      setSmsResendAvailable(false);
      setSmsCode(['', '', '', '', '', '']);
      
      // Restart countdown timer
      startResendCountdown();
      
      alert('New verification code sent successfully!');
    } catch (error) {
      console.error('Failed to resend SMS:', error);
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
  };

  // WhatsApp Authentication Functions
  const handleSetupWhatsApp = async () => {
    if (!user?.phoneNumber) {
      console.error('No phone number available');
      return;
    }

    setWhatsappLoading(true);
    try {
      // Send WhatsApp OTP via backend
      const response = await apiAuth2FAService.sendWhatsAppOTP(user.phoneNumber);
      
      // Parse expiry time (e.g., "5 minutes" -> milliseconds)
      const expiryMinutes = parseInt(response.expiresIn);
      const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
      
      setWhatsappCodeExpiresAt(expiresAt);
      setWhatsappSetupStep('verify');
      setWhatsappResendAvailable(false);
      
      // Start countdown timer
      startWhatsAppResendCountdown();
      
      // Reset WhatsApp code inputs
      setWhatsappCode(['', '', '', '', '', '']);
              
      alert('WhatsApp code sent successfully!');
    } catch (error) {
      console.error('Failed to send WhatsApp:', error);
      alert('Failed to send WhatsApp. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleVerifyWhatsApp = async () => {
    // Combine the 6-digit code from input fields
    const enteredCode = whatsappCode.join('');
    
    if (!enteredCode || enteredCode.length !== 6) {
      return;
    }

    // Check if code has expired
    if (whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt) {
      alert('Verification code has expired. Please request a new code.');
      return;
    }

    setWhatsappLoading(true);
    try {
      // Verify OTP with backend
      const response = await apiAuth2FAService.verifyWhatsAppOTP(enteredCode);
      
      if (response.verified) {
        // Set WhatsApp as default 2FA method
        await apiAuth2FAService.setWhatsAppAsDefault();
        
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
        setWhatsappCode(['', '', '', '', '', '']);
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('WhatsApp verification error:', error);
      
      // Trigger shake effect on error
      setWhatsappShake(true);
      setTimeout(() => setWhatsappShake(false), 500);
      setWhatsappCode(['', '', '', '', '', '']);
      
      alert('Failed to verify code. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleResendWhatsApp = async () => {
    if (!whatsappResendAvailable || !user?.phoneNumber) {
      return;
    }

    setWhatsappLoading(true);
    try {
      // Resend WhatsApp OTP via backend
      const response = await apiAuth2FAService.sendWhatsAppOTP(user.phoneNumber);
      
      // Parse expiry time
      const expiryMinutes = parseInt(response.expiresIn);
      const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
      
      setWhatsappCodeExpiresAt(expiresAt);
      setWhatsappResendAvailable(false);
      setWhatsappCode(['', '', '', '', '', '']);
      
      // Restart countdown timer
      startWhatsAppResendCountdown();
      
      alert('New verification code sent successfully!');
    } catch (error) {
      console.error('Failed to resend WhatsApp:', error);
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
  };

  // Email Authentication Functions
  const handleSetupEmail = async () => {
    if (!user?.email) {
      console.error('No email available');
      return;
    }

    setEmailLoading(true);
    try {
      // Create Email session
      const sessionId = `email_${user.id}_${Date.now()}`;
      const session = WhatsAppVerificationSession.getInstance(); // Reusing session manager
      const { code, expiresAt } = session.createSession(sessionId, user.email);

      // TODO: Send Email via backend API
      // For now, simulate email sending
      const emailSent = true; // Replace with actual email API call
      console.log(`Email code sent to ${user.email}: ${code}`);

      if (emailSent) {
        setEmailSessionId(sessionId);
        setEmailCodeExpiresAt(expiresAt);
        setEmailSetupStep('verify');
        setEmailResendAvailable(false);
        
        // Start countdown timer
        setEmailResendCountdown(60);
        
        // Reset Email code inputs
        setEmailCode(['', '', '', '', '', '']);
                
        alert('Email verification code sent successfully! Check your inbox.');
      } else {
        throw new Error('Failed to send email');
      }
    } catch {
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    const enteredCode = emailCode.join('');
    
    if (!enteredCode || !emailSessionId) {
      return;
    }

    // Check if code has expired
    if (emailCodeExpiresAt && Date.now() > emailCodeExpiresAt) {
      alert('Verification code has expired. Please request a new code.');
      return;
    }

    setEmailLoading(true);
    try {
      const session = WhatsAppVerificationSession.getInstance();
      const isValid = session.verifyCode(emailSessionId, enteredCode);

      if (isValid) {
        // TODO: Save to backend
        setEmailSetupStep('setup');
        setEmailCode(['', '', '', '', '', '']);
        setEmailSessionId('');
        setEmailCodeExpiresAt(0);
        setEmailResendAvailable(true);
        setEmailResendCountdown(0);
        
        alert('Email authentication enabled successfully!');
      } else {
        // Trigger shake effect
        setEmailShake(true);
        setTimeout(() => setEmailShake(false), 500);
        alert('Invalid verification code. Please try again.');
      }
    } catch {
      alert('Failed to verify code. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!emailSessionId || !emailResendAvailable) {
      return;
    }

    setEmailLoading(true);
    try {
      const session = WhatsAppVerificationSession.getInstance();
      const result = session.resendCode(emailSessionId);

      if (result) {
        // TODO: Send new Email via backend API
        const emailSent = true; // Replace with actual email API call
        console.log(`Email code resent to ${user?.email}: ${result.code}`);

        if (emailSent) {
          setEmailCodeExpiresAt(result.expiresAt);
          setEmailResendAvailable(false);
          setEmailResendCountdown(60);
          
          alert('New verification code sent successfully!');
        } else {
          throw new Error('Failed to resend email');
        }
      }
    } catch {
      alert('Failed to resend verification code. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCancelEmailSetup = () => {
    setEmailSetupStep('setup');
    setEmailSessionId('');
    setEmailCodeExpiresAt(0);
    setEmailResendAvailable(true);
    setEmailResendCountdown(0);
  };

  // Authenticator Functions
  const handleSetupAuthenticator = async () => {
    setAuthenticatorLoading(true);
    try {
      // Generate secret and QR code from backend
      const response = await apiAuth2FAService.generateAuthenticatorSecret();
      
      setAuthenticatorSecret(response.secret);
      setAuthenticatorQRCode(response.qrCode);

      // Move to verify step
      setAuthenticatorSetupStep('verify');
    } catch (error) {
      console.error('Failed to setup authenticator:', error);
      alert('Failed to setup authenticator. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
    }
  };

  const handleVerifyAuthenticator = async () => {
    const enteredCode = authenticatorCode.join('');
    
    if (!enteredCode || enteredCode.length !== 6) {
      return;
    }

    setAuthenticatorLoading(true);
    try {
      // Verify the code with backend
      const response = await apiAuth2FAService.verifyAuthenticatorOTP(enteredCode);

      if (response.verified) {
        // Set authenticator as default 2FA method
        await apiAuth2FAService.setAuthenticatorAsDefault();
        
        setAuthenticatorSetupStep('setup');
        setAuthenticatorCode(['', '', '', '', '', '']);
        setAuthenticatorSecret('');
        setAuthenticatorQRCode('');
        
        alert('Authenticator app enabled successfully!');
      } else {
        // Trigger shake effect
        setAuthenticatorShake(true);
        setTimeout(() => setAuthenticatorShake(false), 500);
        
        // Clear the code inputs
        setAuthenticatorCode(['', '', '', '', '', '']);
        
        alert('Invalid verification code. Please try again with a fresh code from your authenticator app.');
      }
    } catch (error) {
      console.error('Authenticator verification error:', error);
      
      // Trigger shake effect on error
      setAuthenticatorShake(true);
      setTimeout(() => setAuthenticatorShake(false), 500);
      setAuthenticatorCode(['', '', '', '', '', '']);
      
      alert('Failed to verify authenticator. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
    }
  };

  // Backup Codes Functions
  const generateBackupCodes = async () => {
    setBackupCodesLoading(true);
    
    try {
      const response = await apiAuth2FAService.generateBackupCodes();
      
      // Convert string codes to BackupCode objects with current timestamp
      const codesWithTimestamp: BackupCode[] = response.codes.map(code => ({
        code,
        createdAt: new Date().toISOString()
      }));
      
      setBackupCodes(codesWithTimestamp);
      setBackupCodesGenerated(true);
      
      alert('Backup codes generated successfully! Please save them in a secure location.');
    } catch (error) {
      console.error('Error generating backup codes:', error);
      alert('Failed to generate backup codes. Please try again.');
    } finally {
      setBackupCodesLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (backupCodes.length === 0) {
      alert('No backup codes to download. Please generate backup codes first.');
      return;
    }

    const content = `Two-Factor Authentication Backup Codes\n` +
      `Generated on: ${new Date(backupCodes[0].createdAt).toLocaleString()}\n` +
      `User: ${user?.email || 'N/A'}\n` +
      `\nKeep these codes in a safe and secure location.\n` +
      `Each code can only be used once.\n` +
      `\nBackup Codes:\n` +
      backupCodes.map((item, index) => `${index + 1}. ${item.code}`).join('\n');

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

  // Fetch existing backup codes when modal opens
  useEffect(() => {
    const fetchBackupCodes = async () => {
      if (backupCodesModalVisible && !backupCodesGenerated) {
        setBackupCodesLoading(true);
        try {
          const response = await apiAuth2FAService.listBackupCodes();
          
          if (response.codes && response.codes.length > 0) {
            setBackupCodes(response.codes);
            setBackupCodesGenerated(true);
          }
        } catch (error) {
          console.error('Error fetching backup codes:', error);
          // Don't show error alert, just leave it empty to allow generation
        } finally {
          setBackupCodesLoading(false);
        }
      }
    };

    fetchBackupCodes();
  }, [backupCodesModalVisible, backupCodesGenerated]);

  const handleCancelAuthenticatorSetup = () => {
    setAuthenticatorSetupStep('setup');
    setAuthenticatorCode(['', '', '', '', '', '']);
    setAuthenticatorSecret('');
    setAuthenticatorQRCode('');
  };

  // Missing Disable Handlers
  const handleDisableSMS = async () => {
    if (!confirm('Are you sure you want to disable SMS authentication?')) {
      return;
    }

    setSmsLoading(true);
    try {
      const response = await apiAuth2FAService.disable2FAMethod('SMS');
      
      if (response.disabled) {
        setSmsSetupStep('setup');
        setSmsCode(['', '', '', '', '', '']);
        setSmsSessionId('');
        setSmsCodeExpiresAt(0);
        setSmsResendAvailable(true);
        setSmsResendCountdown(0);
        alert('SMS authentication disabled successfully.');
      }
    } catch (error) {
      console.error('Error disabling SMS 2FA:', error);
      alert('Failed to disable SMS authentication. Please try again.');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleDisableWhatsApp = async () => {
    if (!confirm('Are you sure you want to disable WhatsApp authentication?')) {
      return;
    }

    setWhatsappLoading(true);
    try {
      const response = await apiAuth2FAService.disable2FAMethod('WHATSAPP');
      
      if (response.disabled) {
        setWhatsappSetupStep('setup');
        setWhatsappCode(['', '', '', '', '', '']);
        setWhatsappSessionId('');
        setWhatsappCodeExpiresAt(0);
        setWhatsappResendAvailable(true);
        setWhatsappResendCountdown(0);
        alert('WhatsApp authentication disabled successfully.');
      }
    } catch (error) {
      console.error('Error disabling WhatsApp 2FA:', error);
      alert('Failed to disable WhatsApp authentication. Please try again.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleDisableEmail = async () => {
    if (!confirm('Are you sure you want to disable email authentication?')) {
      return;
    }

    setEmailLoading(true);
    try {
      const response = await apiAuth2FAService.disable2FAMethod('EMAIL');
      
      if (response.disabled) {
        setEmailSetupStep('setup');
        setEmailCode(['', '', '', '', '', '']);
        setEmailSessionId('');
        setEmailCodeExpiresAt(0);
        setEmailResendAvailable(true);
        setEmailResendCountdown(0);
        alert('Email authentication disabled successfully.');
      }
    } catch (error) {
      console.error('Error disabling Email 2FA:', error);
      alert('Failed to disable email authentication. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleDisableAuthenticator = async () => {
    if (!confirm('Are you sure you want to disable authenticator app authentication?')) {
      return;
    }

    setAuthenticatorLoading(true);
    try {
      const response = await apiAuth2FAService.disable2FAMethod('AUTHENTICATOR');
      
      if (response.disabled) {
        setAuthenticatorSetupStep('setup');
        setAuthenticatorCode(['', '', '', '', '', '']);
        setAuthenticatorSecret('');
        setAuthenticatorQRCode('');
        alert('Authenticator app authentication disabled successfully.');
      }
    } catch (error) {
      console.error('Error disabling Authenticator 2FA:', error);
      alert('Failed to disable authenticator authentication. Please try again.');
    } finally {
      setAuthenticatorLoading(false);
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
            <div className={`status-icon ${user?.twoFactorAuth?.enabled ? 'enabled' : 'disabled'}`}>
              {user?.twoFactorAuth?.enabled ? <CheckCircleFilled /> : <WarningOutlined/>}
            </div>
            <div className="status-info">
              <Title level={4} className="status-title">
                {user?.twoFactorAuth?.enabled ? 'Security Active' : 'Security Inactive'}
              </Title>
              <Text className="status-subtitle">
                {user?.twoFactorAuth?.enabled 
                  ? 'Your account is protected' 
                  : 'Your account is at risk'}
              </Text>
            </div>
            <Switch
              checked={user?.twoFactorAuth?.enabled || show2FAMethods}
              loading={masterSwitchLoading}
              onChange={async (checked) => {
                if (!checked && user?.twoFactorAuth?.enabled) {
                  // Disabling 2FA - show confirmation
                  if (!confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) {
                    return;
                  }
                  
                  setMasterSwitchLoading(true);
                  try {
                    // TODO: Call API to disable all 2FA methods
                    // This should be a backend endpoint that disables all methods at once
                    alert('2FA disabled successfully. Please refresh to see changes.');
                  } catch (error) {
                    console.error('Error disabling 2FA:', error);
                    alert('Failed to disable 2FA. Please try again.');
                  } finally {
                    setMasterSwitchLoading(false);
                  }
                } else if (checked && !user?.twoFactorAuth?.enabled) {
                  // Turning ON to show methods (UI only)
                  setShow2FAMethods(true);
                } else if (!checked && !user?.twoFactorAuth?.enabled) {
                  // Turning OFF when no backend 2FA (UI only)
                  setShow2FAMethods(false);
                }
              }}
              className="premium-switch"
            />
          </div>
          {!user?.twoFactorAuth?.enabled && (
            <div className="status-footer">
              <Text className="footer-text">
                Enable 2FA to prevent unauthorized access to your account.
              </Text>
              
            </div>
          )}
        </div>

        {/* Conditional Content Based on 2FA Status */}
        {!user?.twoFactorAuth?.enabled && !show2FAMethods ? (
          /* Security Warning Alert - Only shown when 2FA is OFF */
          <div className="security-warning-alert" style={{ 
            marginTop: 24, 
            padding: 20, 
            background: 'linear-gradient(135deg, #fff5f5 0%, #ffe7e7 100%)',
            border: '2px solid #ff4d4f',
            borderRadius: 16,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 80, opacity: 0.1, color: '#ff4d4f' }}>
              <WarningOutlined />
            </div>
            <Flex gap={16} align="start" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: 32, 
                color: '#ff4d4f',
                lineHeight: 1
              }}>
                <WarningOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Typography.Title level={5} style={{ margin: 0, marginBottom: 8, color: '#cf1322', fontSize: 16 }}>
                  Your Account is Vulnerable
                </Typography.Title>
                <Typography.Paragraph style={{ margin: 0, marginBottom: 12, color: '#595959', fontSize: 14 }}>
                  Without two-factor authentication, your account is protected only by your password. This means:
                </Typography.Paragraph>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#595959', fontSize: 13, lineHeight: 1.8 }}>
                  <li><strong>Password breaches:</strong> If your password is compromised in a data breach, attackers can access your account immediately</li>
                  <li><strong>Phishing attacks:</strong> Scammers can trick you into revealing your password through fake login pages</li>
                  <li><strong>Brute force attacks:</strong> Automated tools can attempt thousands of password combinations</li>
                  <li><strong>Unauthorized access:</strong> Anyone with your password can access your trading account, funds, and personal information</li>
                </ul>
                <Typography.Paragraph style={{ margin: 0, marginTop: 12, color: '#595959', fontSize: 14, fontWeight: 500 }}>
                  <SafetyOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                  Turn on the switch above to enable Two-Factor Authentication and protect your account.
                </Typography.Paragraph>
              </div>
            </Flex>
          </div>
        ) : (
          /* 2FA Methods Buttons - Only shown when 2FA is ON */
          <div className="method-selection-premium" style={{ marginTop: 24 }}>
            <Text className="selection-title">Authentication Methods</Text>
            <div className="method-grid">
            <Button 
              className={`method-item ${user?.twoFactorAuth?.method === 'SMS' ? 'active' : ''}`}
              onClick={() => setSmsModalVisible(true)}
            >
              <div className="method-icon-wrapper">
                <MobileOutlined />
              </div>
              <div className="method-content">
                <span className="method-name">SMS Codes</span>
                <span className="method-desc">Get codes via text message</span>
              </div>
              {user?.twoFactorAuth?.sms?.enabled && <CheckCircleFilled className="active-check" />}
            </Button>
            
            <Button 
              className={`method-item ${user?.twoFactorAuth?.method === 'WHATSAPP' ? 'active' : ''}`}
              onClick={() => setWhatsappModalVisible(true)}
            >
              <div className="method-icon-wrapper whatsapp">
                <WhatsAppOutlined />
              </div>
              <div className="method-content">
                <span className="method-name">WhatsApp</span>
                <span className="method-desc">Codes sent to WhatsApp</span>
              </div>
              {user?.twoFactorAuth?.whatsapp?.enabled && <CheckCircleFilled className="active-check" />}
            </Button>
            
            <Button 
              className={`method-item ${user?.twoFactorAuth?.method === 'EMAIL' ? 'active' : ''}`}
              onClick={() => setEmailModalVisible(true)}
            >
              <div className="method-icon-wrapper email">
                <MailOutlined />
              </div>
              <div className="method-content">
                <span className="method-name">Email Codes</span>
                <span className="method-desc">Get codes via email</span>
              </div>
              {user?.twoFactorAuth?.email?.enabled && <CheckCircleFilled className="active-check" />}
            </Button>
            
            <Button 
              className={`method-item ${user?.twoFactorAuth?.method === 'AUTHENTICATOR' ? 'active' : ''}`}
              onClick={() => setAuthenticatorModalVisible(true)}
            >
              <div className="method-icon-wrapper auth">
                <QrcodeOutlined />
              </div>
              <div className="method-content">
                <span className="method-name">Auth App</span>
                <span className="method-desc">Use Google Authenticator</span>
              </div>
              {user?.twoFactorAuth?.authenticator?.enabled && <CheckCircleFilled className="active-check" />}
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
              {user?.twoFactorAuth?.backupCodes?.enabled && <CheckCircleFilled className="active-check success" />}
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
              {!user?.twoFactorAuth?.sms?.enabled ? (
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
              <Text>Having trouble? Sometimes it takes up to 10 minutes to retrieve a verification code. If it's been longer than that, return to the previous page and try again.</Text>
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
              {!user?.twoFactorAuth?.whatsapp?.enabled ? (
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

      {/* Email Drawer */}
      <Drawer
        title="Email Authentication"
        placement="right"
        onClose={() => setEmailModalVisible(false)}
        open={emailModalVisible}
        size={400}
      >
        {/* Default State */}
        {emailSetupStep === 'setup' && (
          <div className="feature-intro">
            <div className="intro-icon">
              <MailOutlined />
            </div>
            
            <Title level={2} className="intro-title">Email Security</Title>
            <Text className="intro-description">
              Get verification codes delivered directly to your email inbox for secure access.
            </Text>

            <div className="feature-benefits">
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">Universal Access</span>
                  <span className="benefit-text">Access codes from any device with email.</span>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon"><CheckCircleFilled /></div>
                <div className="benefit-content">
                  <span className="benefit-title">Reliable Delivery</span>
                  <span className="benefit-text">Codes delivered instantly to your inbox.</span>
                </div>
              </div>
            </div>

            <div className="phone-number-display" style={{ width: '100%', marginBottom: 32 }}>
              <Text strong style={{ display: 'block', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6, marginBottom: 8 }}>
                Email Address
              </Text>
              <Text style={{ fontSize: 20, color: 'var(--accent-primary)', fontWeight: 700 }}>
                {user?.email || 'No email set'}
              </Text>
            </div>

            <div className="action-buttons">
              {!user?.twoFactorAuth?.email?.enabled ? (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleSetupEmail}
                  loading={emailLoading}
                  disabled={!user?.email}
                  block
                >
                  Enable Email Security
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleDisableEmail}
                  loading={emailLoading}
                  block
                  danger
                >
                  Disable Email Authentication
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Verification State */}
        {emailSetupStep === 'verify' && (
          <div className="verification-screen">
            <div className="screen-icon">
              <MailOutlined />
            </div>
            
            <Title level={3} className="screen-title">Verify Email Code</Title>
            <Text className="screen-description">
              We've sent a 6-digit verification code to your email.
            </Text>

            <div className="phone-number-display">
              {user?.email || 'your email'}
            </div>

            <div className="verification-inputs-container">
              <div className={`verification-inputs-group ${emailShake ? 'shake' : ''}`}>
                <Space size={8}>
                  {emailCode.slice(0, 3).map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        if (el) {
                          emailInputRefs.current[index] = el;
                        }
                      }}
                      value={digit}
                      onChange={(e) => handleEmailCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleEmailKeyDown(index, e)}
                      maxLength={1}
                      className="premium-otp-input"
                    />
                  ))}
                </Space>
                <div className="otp-separator">—</div>
                <Space size={8}>
                  {emailCode.slice(3, 6).map((digit, index) => (
                    <Input
                      key={index + 3}
                      ref={(el) => {
                        if (el) {
                          emailInputRefs.current[index + 3] = el;
                        }
                      }}
                      value={digit}
                      onChange={(e) => handleEmailCodeChange(index + 3, e.target.value)}
                      onKeyDown={(e) => handleEmailKeyDown(index + 3, e)}
                      maxLength={1}
                      className="premium-otp-input"
                    />
                  ))}
                </Space>
              </div>
            </div>

            <div className="countdown-container">
              <Text type="secondary" className="countdown-text">
                {emailResendCountdown > 0 
                  ? `Resend available in ${emailResendCountdown}s` 
                  : 'You can resend the code now'}
              </Text>

              <Text>Check your inbox and spam folder. If you don't receive the code, you can request a new one.</Text>
            </div>

            <div className="action-buttons">
              <Button 
                type="primary" 
                size="large"
                onClick={handleVerifyEmail}
                loading={emailLoading}
                block
              >
                Verify
              </Button>
              <Button 
                type="default" 
                size="large"
                onClick={handleResendEmail}
                loading={emailLoading}
                disabled={!emailResendAvailable}
                block
              >
                {emailResendCountdown > 0 ? `Resend in ${emailResendCountdown}s` : 'Resend Code'}
              </Button>
              <Button 
                type="text" 
                size="large"
                onClick={handleCancelEmailSetup}
                block
              >
                Cancel
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
              {!user?.twoFactorAuth?.authenticator?.enabled ? (
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

            <div className="verification-inputs-container qr">
              <Flex vertical={true} align="center" justify="center" className="qr-code-container" style={{ marginBottom: 32 }}>
                {authenticatorQRCode && (
                  <img 
                    src={authenticatorQRCode} 
                    alt="Authenticator QR Code" 
                    style={{ 
                      width: 200, 
                      height: 200, 
                      border: '2px solid #e0e0e0', 
                      borderRadius: 8,
                      padding: 8,
                      background: 'white'
                    }} 
                  />
                )}
                <Text style={{fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace', fontSize: 16, marginTop: 12, letterSpacing: 1}}>{authenticatorSecret}</Text>
              </Flex>

              <div className="countdown-container" style={{ marginBottom: 16, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  Code refreshes in: <strong style={{ color: totpTimeRemaining <= 5 ? '#ff4d4f' : '#52c41a' }}>{totpTimeRemaining}s</strong>
                </Text>
                <div style={{ 
                  width: '100%', 
                  height: '4px', 
                  background: '#f0f0f0', 
                  borderRadius: '2px', 
                  marginTop: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${(totpTimeRemaining / 30) * 100}%`, 
                    height: '100%', 
                    background: totpTimeRemaining <= 5 ? '#ff4d4f' : '#52c41a',
                    transition: 'width 1s linear'
                  }} />
                </div>
              </div>

              <div className={`verification-inputs-group ${authenticatorShake ? 'shake' : ''}`}>
                <Space size={8}>
                  {authenticatorCode.slice(0, 3).map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        if (el) {
                          authenticatorInputRefs.current[index] = el;
                        }
                      }}
                      value={digit}
                      onChange={(e) => handleAuthenticatorCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleAuthenticatorKeyDown(index, e)}
                      maxLength={1}
                      className="premium-otp-input"
                    />
                  ))}
                </Space>
                <div className="otp-separator">—</div>
                <Space size={8}>
                  {authenticatorCode.slice(3, 6).map((digit, index) => (
                    <Input
                      key={index + 3}
                      ref={(el) => {
                        if (el) {
                          authenticatorInputRefs.current[index + 3] = el;
                        }
                      }}
                      value={digit}
                      onChange={(e) => handleAuthenticatorCodeChange(index + 3, e.target.value)}
                      onKeyDown={(e) => handleAuthenticatorKeyDown(index + 3, e)}
                      maxLength={1}
                      className="premium-otp-input"
                    />
                  ))}
                </Space>
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
       
        {!backupCodesGenerated ? (
          <div className="feature-intro">
            <div className="intro-icon">
              <DownloadOutlined />
            </div>
            
            <Title level={2} className="intro-title">Backup Codes</Title>
            <Text className="intro-description">
              Generate backup codes to access your account when you can't use your regular 2FA method. Keep these codes in a secure location.
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

            <div className="backup-codes-list" style={{ 
              width: '100%', 
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {backupCodes.map((item, index) => (
                <div 
                  key={index} 
                  style={{ 
                    position: 'relative',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    border: '2px solid #dee2e6',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    overflow: 'hidden'
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(item.code);
                    alert(`Code ${index + 1} copied to clipboard!`);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#00adff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                >
                  <div style={{ 
                    position: 'absolute',
                    top: 4,
                    left: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#adb5bd',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    #{index + 1}
                  </div>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px'
                  }}>
                    <span style={{ 
                      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#212529',
                      letterSpacing: '2px'
                    }}>
                      {item.code}
                    </span>
                    <CopyOutlined style={{ 
                      fontSize: 16,
                      color: '#00adff',
                      opacity: 0.7
                    }} />
                  </div>
                  <div style={{ 
                    fontSize: 10,
                    color: '#6c757d',
                    marginTop: '8px',
                    fontWeight: 500
                  }}>
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                  </div>
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
