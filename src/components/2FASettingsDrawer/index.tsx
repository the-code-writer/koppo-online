import React, { useState, useRef, useEffect } from "react";
import {
  Drawer,
  Form,
  Button,
  Input,
  Card,
  Alert,
  Typography,
  Tabs,
  Space,
  List,
  Tag,
  Collapse,
  Divider,
  Switch,
  QRCode,
  Select,
  Upload,
  message,
  Modal,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  GoogleOutlined,
  PhoneOutlined,
  MailOutlined,
  KeyOutlined,
  CopyOutlined,
  DownloadOutlined,
  UploadOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  MobileOutlined,
  WhatsAppOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import "./styles.scss";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

interface TwoFASettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user?: any;
}

const TwoFASettingsDrawer: React.FC<TwoFASettingsDrawerProps> = ({
  visible,
  onClose,
  user,
}) => {
  // 2FA States
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<string>("sms");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [authenticatorSecret, setAuthenticatorSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // SMS States
  const [smsSetupStep, setSmsSetupStep] = useState(0);
  const [smsVerificationCode, setSmsVerificationCode] = useState(["", "", "", "", "", ""]);
  const [smsVerificationSession, setSmsVerificationSession] = useState<string>("");
  const [smsCodeExpiry, setSmsCodeExpiry] = useState<Date | null>(null);
  const [smsResendAvailable, setSmsResendAvailable] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [smsShake, setSmsShake] = useState(false);

  // WhatsApp States
  const [whatsappSetupStep, setWhatsappSetupStep] = useState(0);
  const [whatsappVerificationCode, setWhatsappVerificationCode] = useState(["", "", "", "", "", ""]);
  const [whatsappVerificationSession, setWhatsappVerificationSession] = useState<string>("");
  const [whatsappCodeExpiry, setWhatsappCodeExpiry] = useState<Date | null>(null);
  const [whatsappResendAvailable, setWhatsappResendAvailable] = useState(false);
  const [whatsappCountdown, setWhatsappCountdown] = useState(0);
  const [whatsappShake, setWhatsappShake] = useState(false);

  // Authenticator States
  const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState(0);
  const [authenticatorVerificationCode, setAuthenticatorVerificationCode] = useState(["", "", "", "", "", ""]);
  const [authenticatorShake, setAuthenticatorShake] = useState(false);

  // Backup Codes States
  const [backupCodesSetupStep, setBackupCodesSetupStep] = useState(0);
  const [backupCodesShake, setBackupCodesShake] = useState(false);

  // Refs
  const smsInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const whatsappInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const authenticatorInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer effects
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (smsCountdown > 0) {
      timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
    } else if (smsCountdown === 0 && smsSetupStep === 1) {
      setSmsResendAvailable(true);
    }
    return () => clearTimeout(timer);
  }, [smsCountdown, smsSetupStep]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (whatsappCountdown > 0) {
      timer = setTimeout(() => setWhatsappCountdown(whatsappCountdown - 1), 1000);
    } else if (whatsappCountdown === 0 && whatsappSetupStep === 1) {
      setWhatsappResendAvailable(true);
    }
    return () => clearTimeout(timer);
  }, [whatsappCountdown, whatsappSetupStep]);

  // SMS Handlers
  const handleSetupSMS = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    const sessionId = Math.random().toString(36).substr(2, 9);
    
    setSmsVerificationSession(sessionId);
    setSmsCodeExpiry(expiry);
    setSmsSetupStep(1);
    setSmsCountdown(300);
    setSmsResendAvailable(false);
    setSmsVerificationCode(["", "", "", "", "", ""]);
    
    console.log(`SMS verification code: ${code}`);
    message.success("SMS code sent to your phone");
  };

  const handleSMSCodeChange = (index: number, value: string) => {
    const newCode = [...smsVerificationCode];
    newCode[index] = value;
    setSmsVerificationCode(newCode);
    
    if (value && index < 5) {
      smsInputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifySMS = () => {
    const code = smsVerificationCode.join("");
    if (!code || code.length !== 6) {
      setSmsShake(true);
      setTimeout(() => setSmsShake(false), 500);
      message.error("Please enter the complete 6-digit code");
      return;
    }

    if (Date.now() > (smsCodeExpiry?.getTime() || 0)) {
      setSmsShake(true);
      setTimeout(() => setSmsShake(false), 500);
      message.error("Code has expired. Please request a new one.");
      return;
    }

    setSmsSetupStep(2);
    setTwoFAEnabled(true);
    setTwoFAMethod("sms");
    message.success("SMS 2FA enabled successfully");
  };

  const handleResendSMS = () => {
    handleSetupSMS();
  };

  const handleCancelSMSSetup = () => {
    setSmsSetupStep(0);
    setSmsVerificationCode(["", "", "", "", "", ""]);
    setSmsVerificationSession("");
    setSmsCodeExpiry(null);
    setSmsResendAvailable(false);
    setSmsCountdown(0);
    setTwoFAMethod("");
  };

  // WhatsApp Handlers
  const handleSetupWhatsApp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    const sessionId = Math.random().toString(36).substr(2, 9);
    
    setWhatsappVerificationSession(sessionId);
    setWhatsappCodeExpiry(expiry);
    setWhatsappSetupStep(1);
    setWhatsappCountdown(300);
    setWhatsappResendAvailable(false);
    setWhatsappVerificationCode(["", "", "", "", "", ""]);
    
    console.log(`WhatsApp verification code: ${code}`);
    message.success("WhatsApp code sent to your phone");
  };

  const handleWhatsAppCodeChange = (index: number, value: string) => {
    const newCode = [...whatsappVerificationCode];
    newCode[index] = value;
    setWhatsappVerificationCode(newCode);
    
    if (value && index < 5) {
      whatsappInputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyWhatsApp = () => {
    const code = whatsappVerificationCode.join("");
    if (!code || code.length !== 6) {
      setWhatsappShake(true);
      setTimeout(() => setWhatsappShake(false), 500);
      message.error("Please enter the complete 6-digit code");
      return;
    }

    if (Date.now() > (whatsappCodeExpiry?.getTime() || 0)) {
      setWhatsappShake(true);
      setTimeout(() => setWhatsappShake(false), 500);
      message.error("Code has expired. Please request a new one.");
      return;
    }

    setWhatsappSetupStep(2);
    setTwoFAEnabled(true);
    setTwoFAMethod("whatsapp");
    message.success("WhatsApp 2FA enabled successfully");
  };

  const handleResendWhatsApp = () => {
    handleSetupWhatsApp();
  };

  const handleCancelWhatsAppSetup = () => {
    setWhatsappSetupStep(0);
    setWhatsappVerificationCode(["", "", "", "", "", ""]);
    setWhatsappVerificationSession("");
    setWhatsappCodeExpiry(null);
    setWhatsappResendAvailable(false);
    setWhatsappCountdown(0);
    setTwoFAMethod("");
  };

  // Authenticator Handlers
  const handleSetupAuthenticator = () => {
    const secret = Math.random().toString(36).substr(2, 16).toUpperCase();
    setAuthenticatorSecret(secret);
    setAuthenticatorSetupStep(1);
    setAuthenticatorVerificationCode(["", "", "", "", "", ""]);
  };

  const handleAuthenticatorCodeChange = (index: number, value: string) => {
    const newCode = [...authenticatorVerificationCode];
    newCode[index] = value;
    setAuthenticatorVerificationCode(newCode);
    
    if (value && index < 5) {
      authenticatorInputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyAuthenticator = () => {
    const code = authenticatorVerificationCode.join("");
    if (!code || code.length !== 6) {
      setAuthenticatorShake(true);
      setTimeout(() => setAuthenticatorShake(false), 500);
      message.error("Please enter the complete 6-digit code");
      return;
    }

    setAuthenticatorSetupStep(2);
    setTwoFAEnabled(true);
    setTwoFAMethod("authenticator");
    message.success("Authenticator app 2FA enabled successfully");
  };

  const handleCancelAuthenticatorSetup = () => {
    setAuthenticatorSetupStep(0);
    setAuthenticatorVerificationCode(["", "", "", "", "", ""]);
    setAuthenticatorSecret("");
    setTwoFAMethod("");
  };

  // Backup Codes Handlers
  const handleGenerateBackupCodes = () => {
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substr(2, 8).toUpperCase()
    );
    setBackupCodes(codes);
    setShowBackupCodes(true);
    setBackupCodesSetupStep(1);
    message.success("Backup codes generated successfully");
  };

  const handleRegenerateBackupCodes = () => {
    setBackupCodesShake(true);
    setTimeout(() => setBackupCodesShake(false), 500);
    handleGenerateBackupCodes();
  };

  const handleDownloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    message.success("Backup codes downloaded");
  };

  const handleCopyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success("Code copied to clipboard");
  };

  const handleDisable2FA = () => {
    Modal.confirm({
      title: "Disable 2FA?",
      content: "This will make your account less secure. Are you sure?",
      onOk: () => {
        setTwoFAEnabled(false);
        setTwoFAMethod("");
        setBackupCodes([]);
        setShowBackupCodes(false);
        message.success("2FA disabled");
      },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Drawer
      title="2FA & Security Settings"
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
      className="settings-drawer"
    >
      <div className="settings-content">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          
          {/* 2FA Status */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Title level={4}>Two-Factor Authentication</Title>
                <Text type="secondary">
                  {twoFAEnabled ? `Enabled via ${twoFAMethod}` : "Not configured"}
                </Text>
              </div>
              <div>
                {twoFAEnabled ? (
                  <Button danger onClick={handleDisable2FA}>
                    Disable 2FA
                  </Button>
                ) : (
                  <Tag color="red">Disabled</Tag>
                )}
              </div>
            </div>
          </Card>

          {/* 2FA Setup Options */}
          {!twoFAEnabled && (
            <Card title="Choose 2FA Method">
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Button
                  icon={<PhoneOutlined />}
                  onClick={handleSetupSMS}
                  block
                  size="large"
                >
                  SMS Authentication
                </Button>
                <Button
                  icon={<WhatsAppOutlined />}
                  onClick={handleSetupWhatsApp}
                  block
                  size="large"
                  style={{ color: "#25D366", borderColor: "#25D366" }}
                >
                  WhatsApp Authentication
                </Button>
                <Button
                  icon={<KeyOutlined />}
                  onClick={handleSetupAuthenticator}
                  block
                  size="large"
                >
                  Authenticator App
                </Button>
              </Space>
            </Card>
          )}

          {/* SMS Setup */}
          {smsSetupStep > 0 && (
            <Card title="SMS Authentication" className={smsShake ? "shake" : ""}>
              {smsSetupStep === 1 && (
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Alert
                    message="Enter the 6-digit code sent to your phone"
                    type="info"
                    showIcon
                  />
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    {smsVerificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (smsInputRefs.current[index] = el)}
                        value={digit}
                        onChange={(e) => handleSMSCodeChange(index, e.target.value)}
                        maxLength={1}
                        style={{ width: 45, textAlign: "center", fontSize: 18 }}
                      />
                    ))}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    {smsCountdown > 0 ? (
                      <Text type="secondary">
                        Resend available in {formatTime(smsCountdown)}
                      </Text>
                    ) : (
                      <Button type="link" onClick={handleResendSMS}>
                        Resend Code
                      </Button>
                    )}
                  </div>
                  <Space>
                    <Button onClick={handleCancelSMSSetup}>Cancel</Button>
                    <Button type="primary" onClick={handleVerifySMS}>
                      Verify
                    </Button>
                  </Space>
                </Space>
              )}
              {smsSetupStep === 2 && (
                <div style={{ textAlign: "center" }}>
                  <CheckCircleFilled style={{ fontSize: 48, color: "#52c41a" }} />
                  <Title level={4}>SMS 2FA Enabled!</Title>
                  <Text type="secondary">Your account is now protected with SMS authentication</Text>
                </div>
              )}
            </Card>
          )}

          {/* WhatsApp Setup */}
          {whatsappSetupStep > 0 && (
            <Card title="WhatsApp Authentication" className={whatsappShake ? "shake" : ""}>
              {whatsappSetupStep === 1 && (
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Alert
                    message="Enter the 6-digit code sent via WhatsApp"
                    type="info"
                    showIcon
                  />
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    {whatsappVerificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (whatsappInputRefs.current[index] = el)}
                        value={digit}
                        onChange={(e) => handleWhatsAppCodeChange(index, e.target.value)}
                        maxLength={1}
                        style={{ width: 45, textAlign: "center", fontSize: 18 }}
                      />
                    ))}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    {whatsappCountdown > 0 ? (
                      <Text type="secondary">
                        Resend available in {formatTime(whatsappCountdown)}
                      </Text>
                    ) : (
                      <Button type="link" onClick={handleResendWhatsApp}>
                        Resend Code
                      </Button>
                    )}
                  </div>
                  <Space>
                    <Button onClick={handleCancelWhatsAppSetup}>Cancel</Button>
                    <Button type="primary" onClick={handleVerifyWhatsApp}>
                      Verify
                    </Button>
                  </Space>
                </Space>
              )}
              {whatsappSetupStep === 2 && (
                <div style={{ textAlign: "center" }}>
                  <CheckCircleFilled style={{ fontSize: 48, color: "#52c41a" }} />
                  <Title level={4}>WhatsApp 2FA Enabled!</Title>
                  <Text type="secondary">Your account is now protected with WhatsApp authentication</Text>
                </div>
              )}
            </Card>
          )}

          {/* Authenticator Setup */}
          {authenticatorSetupStep > 0 && (
            <Card title="Authenticator App" className={authenticatorShake ? "shake" : ""}>
              {authenticatorSetupStep === 1 && (
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Alert
                    message="Scan the QR code with your authenticator app"
                    type="info"
                    showIcon
                  />
                  <div style={{ textAlign: "center" }}>
                    <QRCode value={`otpauth://totp/KoppoApp:${user?.email}?secret=${authenticatorSecret}&issuer=KoppoApp`} />
                  </div>
                  <Text type="secondary">Or enter this code manually: {authenticatorSecret}</Text>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    {authenticatorVerificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (authenticatorInputRefs.current[index] = el)}
                        value={digit}
                        onChange={(e) => handleAuthenticatorCodeChange(index, e.target.value)}
                        maxLength={1}
                        style={{ width: 45, textAlign: "center", fontSize: 18 }}
                      />
                    ))}
                  </div>
                  <Space>
                    <Button onClick={handleCancelAuthenticatorSetup}>Cancel</Button>
                    <Button type="primary" onClick={handleVerifyAuthenticator}>
                      Verify
                    </Button>
                  </Space>
                </Space>
              )}
              {authenticatorSetupStep === 2 && (
                <div style={{ textAlign: "center" }}>
                  <CheckCircleFilled style={{ fontSize: 48, color: "#52c41a" }} />
                  <Title level={4}>Authenticator App 2FA Enabled!</Title>
                  <Text type="secondary">Your account is now protected with authenticator app</Text>
                </div>
              )}
            </Card>
          )}

          {/* Backup Codes */}
          {twoFAEnabled && (
            <Card title="Backup Codes" className={backupCodesShake ? "shake" : ""}>
              {!showBackupCodes ? (
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Alert
                    message="Generate backup codes for account recovery"
                    description="Save these codes in a secure location. You can use them to access your account if you lose your 2FA device."
                    type="warning"
                    showIcon
                  />
                  <Button onClick={handleGenerateBackupCodes} block>
                    Generate Backup Codes
                  </Button>
                </Space>
              ) : (
                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                  <Alert
                    message="Save these backup codes securely"
                    description="Each code can only be used once. Store them in a safe place."
                    type="success"
                    showIcon
                  />
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {backupCodes.map((code, index) => (
                      <div key={index} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: "8px 12px",
                        borderBottom: "1px dotted #d9d9d9"
                      }}>
                        <Text code>{code}</Text>
                        <Button 
                          type="text" 
                          icon={<CopyOutlined />} 
                          onClick={() => handleCopyBackupCode(code)}
                        />
                      </div>
                    ))}
                  </div>
                  <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleDownloadBackupCodes}>
                      Download
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleRegenerateBackupCodes}>
                      Regenerate
                    </Button>
                  </Space>
                </Space>
              )}
            </Card>
          )}

        </Space>
      </div>
    </Drawer>
  );
};

export default TwoFASettingsDrawer;
