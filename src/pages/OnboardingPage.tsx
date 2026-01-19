import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Space,
  Steps,
  Row,
  Col,
  Avatar,
  Switch,
  Divider,
  Alert,
  Spin,
  message,
  Tag,
  Modal,
  Flex
} from 'antd';
import {
  BellOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  MoonOutlined,
  LockOutlined,
  EyeOutlined,
  HomeOutlined,
  SecurityScanOutlined,
  MobileOutlined,
  DesktopOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { collectDeviceInfo, getDeviceFingerprint } from '../utils/deviceHash';
import { getOrCreateDeviceKeys, useServerKeys, rsaEncryptWithPem } from '../utils/deviceKeys';
import { deviceEncryption } from '../utils/deviceKeys';
import { authAPI } from '../services/api';
import logoSvg from '../assets/logo.png';
import '../styles/login.scss';
import '../styles/onboarding.scss';
import { QrcodeOutlined } from '@ant-design/icons';
import { useFirebaseMessaging } from '../hooks/useFirebaseMessaging';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface OnboardingData {
  deviceHash: string;
  deviceInfo: any;
  notificationsEnabled: boolean;
  mfa: string;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  useAuth();
  const { storeServerKeys } = useServerKeys();
  const {
    token,
    requestPermission,
    getFirebaseToken,
  } = useFirebaseMessaging();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const [deviceId, setDeviceId] = useState("xxxx-xxxx-xxxx-xxxx");
  const [deviceHash, setDeviceHash] = useState("0x00000 ... 00000");
  const [deviceFingerprint, setDeviceFingerprint] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>({device: {vendor: '', type: '', model: ''}});
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    deviceHash: '',
    deviceInfo: {device: {vendor: '', type: '', model: ''}},
    notificationsEnabled: false,
    mfa: ''
  });
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    console.log('FCM Token updated:', { FCM_TOKEN: token })
  }, [token])

  useEffect(() => {
    console.log('FCM Token updated:', { FCM_TOKEN: token })
    if (currentStep === 2) {
      fingerprintDevice();
    }
  }, [currentStep])

  const fingerprintDevice = async () => {

    setLoading(true);
    setDeviceRegistered(false);
    const fullDeviceInfo = collectDeviceInfo();
    setDeviceInfo(fullDeviceInfo);
    const keyPair = await getOrCreateDeviceKeys();
    const { publicKey } = keyPair;
    console.log('Device keys generated:', { keyPair });
    try {
      const serverHello: any = await authAPI.initiateHandshake(publicKey);
      console.info('Server handshake response:', { serverHello });
      const sessionId = serverHello.data.sessionId;
      const serverPublicKey = serverHello.data.serverPublicKey;
      storeServerKeys(serverPublicKey);
      const deviceMFAToken:string = await getFirebaseToken();
      console.debug('Handshake data:', { sessionId, serverPublicKey, deviceMFAToken, token });
      const encryptedDeviceToken = await rsaEncryptWithPem(deviceMFAToken, serverPublicKey);
      console.info('Device token encrypted:', { encryptedDeviceToken });
      const deviceData = { device: { type: fullDeviceInfo.device.type, vendor: fullDeviceInfo.device.vendor, model: fullDeviceInfo.device.model } };
      const handshake: any = await authAPI.completeHandshake(sessionId, publicKey, encryptedDeviceToken, deviceData);
      console.log('Handshake completed:', { handshake });
      const fingerprint = handshake?.data.deviceId;
      
      // Decrypt the fingerprint using device private key
      try {
        const deviceKeys = await getOrCreateDeviceKeys();
        console.info({ deviceKeys });
        const decryptedFingerprint = await deviceEncryption.rsaDecrypt(fingerprint, deviceKeys.privateKey);
        console.info('Fingerprint decrypted successfully:', { decryptedFingerprint });
        setDeviceId(decryptedFingerprint);
      } catch (decryptError) {
        console.error('Failed to decrypt fingerprint:', decryptError);
        // Fallback: use the encrypted fingerprint if decryption fails
        setDeviceId(fingerprint);
      }
      
      setDeviceHash(handshake.data.deviceHash);
      setOnboardingData(prev => ({
        ...prev,
        deviceHash: fingerprint.hash,
      }));
      setDeviceRegistered(handshake.data.handshakeCompleted);
      setLoading(false);
    } catch (error) {
      console.error('Error fingerprinting device:', error);
      setLoading(false);
    }
  }

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipeGesture();
  };

  const handleSwipeGesture = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentStep < 3) {
        // Swipe left - next step
        handleNext();
      } else if (diff < 0 && currentStep > 0) {
        // Swipe right - previous step
        handlePrevious();
      }
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Ensure authentication state is fresh before navigation
      await new Promise(resolve => setTimeout(resolve, 3000));
      message.success('Onboarding completed successfully!');
      // Navigate with a small delay to ensure state is settled
      setTimeout(() => {
        navigate('/discover', { replace: true });
      }, 500);
    } catch (error: any) {
      console.error('Onboarding completion error:', error);
      message.error('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Welcome Screen
  const WelcomeScreen = () => (
    <div className="onboarding-screen welcome-screen">
      <div className="onboarding-content">
        <div className="onboarding-icon">
          <SecurityScanOutlined style={{ fontSize: 64, color: '#aa58e3' }} />
        </div>
        <Title level={2} className="onboarding-title">
          Welcome! Let's secure your trading account
        </Title>

        <div className="onboarding-features">
          <div className="feature-item">
            <BellOutlined className="feature-icon" />
            <div className="feature-content">
              <Title level={4}>Push Notifications (Optional)</Title>
              <Text type="secondary">
                Get real-time trade alerts. You can enable/disable anytime.
              </Text>
            </div>
          </div>

          <div className="feature-item">
            <SecurityScanOutlined className="feature-icon" />
            <div className="feature-content">
              <Title level={4}>Device Registration</Title>
              <Text type="secondary">
                We'll create a secure, anonymous identifier for this device
                to protect against unauthorized access.
              </Text>
            </div>
          </div>

          <div className="feature-item">
            <LockOutlined className="feature-icon" />
            <div className="feature-content">
              <Title level={4}>Your Control</Title>
              <Text type="secondary">
                View and manage all devices in Privacy Center.
              </Text>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // Notifications Screen
  const NotificationsScreen = () => (
    <div className="onboarding-screen notifications-screen">
      <div className="onboarding-content">
        <div className="onboarding-icon">
          <BellOutlined style={{ fontSize: 64, color: '#aa58e3' }} />
        </div>
        <Title level={2} className="onboarding-title">
          Enable Push Notifications
        </Title>
        <Paragraph type="secondary">
          Get real-time alerts for your trading activities. You can change this anytime in settings.
        </Paragraph>

        <div className="notification-options">
          <Card size="small" className={`notification-card ${onboardingData.notificationsEnabled ? 'selected' : ''}`}>
            <div className="notification-option">
              <div className="option-content">
                <Title level={4}>Enable Notifications</Title>
                <Text type="secondary">
                  Receive instant updates about your trades, account activity, and important alerts.
                </Text>
              </div>
              <Switch
                checked={onboardingData.notificationsEnabled}
                onChange={(checked) => { requestPermission(); setOnboardingData(prev => ({ ...prev, notificationsEnabled: checked })) }}
                size="large"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // Device Registration Screen
  const DeviceRegistrationScreen = () => (
    <div className="onboarding-screen device-screen">
      <div className="onboarding-content">
        {deviceRegistered ? (<>
        <div className="onboarding-icon">
          <SecurityScanOutlined style={{ fontSize: 64, color: '#52c41a' }} />
        </div>
        <Title level={2} className="onboarding-title">
          Device Registered
        </Title>

          <Card title={<Title level={4}>{deviceInfo?.device.type.toLowerCase()==='mobile' ? <MobileOutlined className="feature-icon" />:<DesktopOutlined className="feature-icon" />} {deviceInfo?.device.vendor || ''} {deviceInfo?.device.model || ''} <sup><Tag color="blue">{deviceInfo?.device.type || ''}</Tag></sup></Title>}>
            <Text> <code style={{ fontSize: 16, display: 'block', textAlign: 'center' }}><small>Device ID:</small><br />{deviceId}</code></Text>
            <Text>
              <code style={{ marginTop: 16, fontSize: 16, display: 'block', textAlign: 'center' }}>
                <small>Device Hash:</small><br />0x{deviceHash.substring(0, 8)}....{deviceHash.substring(deviceHash.length - 8)}
              </code>
            </Text>
          </Card>
          <div className="privacy-link">
            <Button
              type="default" block
              icon={<QrcodeOutlined />} loading={loading}
              onClick={() => fingerprintDevice()} size="large"
            >
              Regenerate Hash
            </Button>
          </div></>
        ) : (
          <>
          
        <div className="onboarding-icon">
          {deviceInfo?.device.type.toLowerCase()==='mobile' ? <MobileOutlined style={{ fontSize: 64, color: '#aa58e3' }} />:<DesktopOutlined style={{ fontSize: 64, color: '#aa58e3' }} />}
        </div>
        <Title level={2} className="onboarding-title">
          Registering Device...
        </Title>
          <Space vertical >
          
        <Alert
          title="Privacy Protected"
          description="We are now fingerprinting your device. We have only collected your Device brand and model commonly known as the User Agent."
          type="info"
          showIcon
          style={{ marginBottom: 24, textAlign: 'left' }}
        /><div style={{ textAlign: 'center', padding: 32 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Generating device identifier...</Text>
            </div>
          </div>
</Space>
</>
          
        )}

      </div>
    </div>
  );

  // Completion Screen
  const CompletionScreen = () => (
    <div className="onboarding-screen completion-screen">
      <div className="onboarding-content">
        <div className="onboarding-icon">
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
        </div>
        <Title level={2} className="onboarding-title">
          Setup Complete!
        </Title>
        <Paragraph type="secondary">
          Your trading account is now secure and ready to use. You can modify these settings anytime in your profile.
        </Paragraph>

        <div className="completion-summary">
          <Card size="small" title="Configuration Summary">
            <div className="summary-item">
              <SecurityScanOutlined /> Device Registered
            </div>
            <div className="summary-item">
              {onboardingData.notificationsEnabled ? <BellOutlined /> : <BellOutlined style={{ opacity: 0.3 }} />}
              Notifications {onboardingData.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <div className="summary-item">
              {onboardingData.profilePicture ? <Avatar size={20} src={onboardingData.profilePicture} /> : <UserOutlined />}
              Profile {onboardingData.profilePicture ? 'Customized' : 'Default'}
            </div>
            <div className="summary-item">
              {onboardingData.theme === 'dark' ? <MoonOutlined /> : <BulbOutlined />}
              {onboardingData.theme === 'dark' ? 'Dark' : 'Light'} Theme
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const screens = [
    WelcomeScreen,
    NotificationsScreen,
    DeviceRegistrationScreen,
    CompletionScreen
  ];

  const CurrentScreen = screens[currentStep];

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img style={{ height: 48 }} src={logoSvg} alt="Koppo Logo" />
        </div>

        <Card className="onboarding-card">
          <div className="onboarding-header">
            <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}>
              <Step title="Welcome" />
              <Step title="Notifications" />
              <Step title="Device" />
              <Step title="Complete" />
            </Steps>
          </div>

          <div
            className="onboarding-screens"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <CurrentScreen />
          </div>

          <Flex justify="center" align="center">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => setPrivacyVisible(true)}
            >
              View Privacy Policy
            </Button>
          </Flex>

          <div className="onboarding-navigation">
            <Row justify="space-between" align="top">
              <Col>
                {currentStep > 0 && (
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handlePrevious}
                    disabled={loading}
                  >
                    Previous
                  </Button>
                )}
              </Col>
              <Col>
                {currentStep < 3 ? (
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />} iconPlacement="end"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<HomeOutlined />}
                    onClick={handleComplete}
                    loading={loading}
                  >
                    Proceed Home
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        </Card>
      </div>

      {/* Privacy Policy Modal */}
      <Modal
        title="Device & Session Data Collection"
        open={privacyVisible}
        onCancel={() => setPrivacyVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPrivacyVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div className="privacy-content">
          <Title level={4}>What We Collect:</Title>

          <div className="privacy-section">
            <Title level={5}>1. Device Identifier (Hashed)</Title>
            <Paragraph>
              <strong>Purpose:</strong> Recognize trusted devices, prevent account takeover<br />
              <strong>What:</strong> Anonymous hash of device characteristics<br />
              <strong>NOT collected:</strong> Serial numbers, IMEI, MAC addresses
            </Paragraph>
          </div>

          <div className="privacy-section">
            <Title level={5}>2. Push Notification Tokens</Title>
            <Paragraph>
              <strong>Purpose:</strong> Send trading alerts (only with your consent)<br />
              <strong>Storage:</strong> Encrypted, deleted when consent revoked<br />
              <strong>Control:</strong> Toggle in Settings → Notifications
            </Paragraph>
          </div>

          <div className="privacy-section">
            <Title level={5}>3. Login Session Logs</Title>
            <Paragraph>
              <strong>Purpose:</strong> Security audit trail, detect intrusions<br />
              <strong>Data:</strong> Timestamp, success/failure, general location (country)<br />
              <strong>Retention:</strong> 90 days, then automatic deletion
            </Paragraph>
          </div>

          <Divider />

          <Title level={4}>Your Controls:</Title>
          <ul>
            <li>View all active devices in Privacy Center</li>
            <li>Revoke any device instantly (terminates all sessions)</li>
            <li>Export all session history</li>
            <li>Disable push notifications per-device</li>
            <li>Request deletion of historical session logs</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
