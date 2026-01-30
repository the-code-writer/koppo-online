import React from 'react';
import { Drawer, Button, Typography, Space, Card, Steps, Upload, Form, Input, Select } from 'antd';
import { UploadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, FileTextOutlined, IdcardOutlined, CameraOutlined, ArrowRightOutlined, RetweetOutlined } from '@ant-design/icons';
import './styles.scss';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface KYCSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function KYCSettingsDrawer({ visible, onClose }: KYCSettingsDrawerProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [kycStatus, setKycStatus] = React.useState<'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected'>('pending');
  const [form] = Form.useForm();
  
  // Camera State
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = React.useState(false);
  const [videoNode, setVideoNode] = React.useState<HTMLVideoElement | null>(null);

  // Reliable stream attachment when both stream and video element are available
  React.useEffect(() => {
    if (stream && videoNode) {
      console.log("KYC: Attaching stream to video node");
      videoNode.srcObject = stream;
      videoNode.play().catch(err => {
        if (err.name !== 'AbortError') {
          console.error("KYC: Play error", err);
        }
      });
    }
  }, [stream, videoNode]);

  const startCamera = React.useCallback(async () => {
    setIsCameraStarting(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
    } catch (err) {
      console.error("KYC: Error accessing camera:", err);
    } finally {
      setIsCameraStarting(false);
    }
  }, []);

  const stopCamera = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = React.useCallback(() => {
    if (videoNode) {
      const canvas = document.createElement('canvas');
      canvas.width = videoNode.videoWidth;
      canvas.height = videoNode.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoNode, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
        stopCamera();
      }
    }
  }, [videoNode, stopCamera]);

  const retakePhoto = React.useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Mock KYC status - in real app, this would come from API
  React.useEffect(() => {
    const mockStatus = 'pending';
    setKycStatus(mockStatus);
  }, []);

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  React.useEffect(() => {
    if (currentStep !== 2 && stream) {
      stopCamera();
    }
  }, [currentStep, stream, stopCamera]);

  const steps = [
    {
      title: 'Profile',
      icon: <IdcardOutlined />,
    },
    {
      title: 'Documents',
      icon: <FileTextOutlined />,
    },
    {
      title: 'Selfie',
      icon: <CameraOutlined />,
    },
    {
      title: 'Submit',
      icon: <CheckCircleOutlined />,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#52c41a';
      case 'submitted':
        return '#1890ff';
      case 'in_progress':
        return '#faad14';
      case 'rejected':
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'submitted':
        return 'Under Review';
      case 'in_progress':
        return 'In Progress';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Started';
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.jpg,.jpeg,.png',
    beforeUpload: (file: File) => {
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        console.error('File must be smaller than 5MB!');
        return false;
      }
      return false; // Prevent automatic upload
    },
    onChange(info: any) {
      console.log('File info:', info);
    },
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('KYC submission:', values);
      // In real app, submit to API
      setKycStatus('submitted');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  const renderAllStepsContent = () => {
    return (
      <>
        {/* Step 1: Personal Information */}
        <div className={`drawer-section ${currentStep === 0 ? 'active' : ''}`} style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <div className="drawer-section-header">
            <div className="section-icon">
              <IdcardOutlined />
            </div>
            <h3 className="drawer-section-title">Personal Information</h3>
          </div>
          
          <div className="drawer-section-content">
            <Form form={form} layout="vertical" className="modern-form">
              <Form.Item
                name="fullName"
                label="Full Legal Name"
                rules={[{ required: true, message: 'Please enter your full legal name' }]}
              >
                <Input size="large" className="modern-input" placeholder="As it appears on your ID" />
              </Form.Item>

                <Form.Item
                  name="dateOfBirth"
                  label="Date of Birth"
                  rules={[{ required: true, message: 'Please select your date of birth' }]}
                  style={{ flex: 1 }}
                >
                  <Input size="large" className="modern-input" type="date" />
                </Form.Item>

                <Form.Item
                  name="nationality"
                  label="Nationality"
                  rules={[{ required: true, message: 'Please select your nationality' }]}
                  style={{ flex: 1 }}
                >
                  <Select size="large" className="modern-input" placeholder="Select">
                    <Select.Option value="ZW">Zimbabwe</Select.Option>
                    <Select.Option value="US">United States</Select.Option>
                    <Select.Option value="ZA">South Africa</Select.Option>
                  </Select>
                </Form.Item>

              <Form.Item
                name="address"
                label="Residential Address"
                rules={[{ required: true, message: 'Please enter your residential address' }]}
              >
                <Input.TextArea rows={3} className="modern-input" placeholder="Full residential address" />
              </Form.Item>

              <Button 
                type="primary" 
                size="large" 
                block 
                className="action-button primary-button"
                onClick={() => setCurrentStep(1)}
              >
                Continue to Documents
              </Button>
            </Form>
          </div>
        </div>

        {/* Step 2: Document Upload */}
        <div className={`drawer-section ${currentStep === 1 ? 'active' : ''}`} style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <div className="drawer-section-header">
            <div className="section-icon">
              <FileTextOutlined />
            </div>
            <h3 className="drawer-section-title">Document Upload</h3>
          </div>
          
          <div className="drawer-section-content">
            <div className="info-box">
              <Text className="info-text">
                Please upload a clear, valid government-issued ID (Passport, National ID, or Driver's License).
              </Text>
            </div>

            <Card className="upload-card">
              <Dragger {...uploadProps} className="upload-dragger">
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 32, color: 'var(--accent-color)' }} />
                </p>
                <p className="ant-upload-text">Click or drag ID to upload</p>
                <p className="ant-upload-hint">Support for PDF, JPG, PNG (Max 5MB)</p>
              </Dragger>
            </Card>

            <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 24 }}>
              <Button 
                type="primary" 
                size="large" 
                block 
                className="action-button primary-button"
                onClick={() => setCurrentStep(2)}
              >
                Continue to Selfie
              </Button>
              <Button 
                type="text" 
                block 
                className="action-button secondary-button"
                onClick={() => setCurrentStep(0)}
              >
                Back
              </Button>
            </Space>
          </div>
        </div>

        {/* Step 3: Selfie Verification */}
        <div className={`drawer-section ${currentStep === 2 ? 'active' : ''}`} style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <div className="drawer-section-header">
            <div className="section-icon">
              <CameraOutlined />
            </div>
            <h3 className="drawer-section-title">Selfie Verification</h3>
          </div>
          
          <div className="drawer-section-content">
            <div className="info-box">
              <Text className="info-text">
                Position your face within the frame. Ensure good lighting and that your features are clearly visible.
              </Text>
            </div>

            <div className="camera-container">
              {!stream && !capturedImage ? (
                <div className="camera-placeholder" onClick={startCamera}>
                  {isCameraStarting ? (
                    <div className="camera-loader" />
                  ) : (
                    <>
                      <CameraOutlined className="placeholder-icon" />
                      <Text className="placeholder-text">Enable Camera</Text>
                    </>
                  )}
                </div>
              ) : capturedImage ? (
                <div className="captured-preview">
                  <img src={capturedImage} alt="Captured selfie" />
                  <Button 
                    icon={<RetweetOutlined />} 
                    className="retake-button"
                    onClick={retakePhoto}
                  >
                    Retake
                  </Button>
                </div>
              ) : (
                <div className="live-feed">
                  <video 
                    ref={setVideoNode} 
                    autoPlay 
                    playsInline 
                    muted 
                  />
                  <div className="camera-overlay">
                    <div className="face-guide" />
                  </div>
                  <Button 
                    type="primary" 
                    shape="circle" 
                    size="large"
                    className="capture-button"
                    icon={<CameraOutlined />}
                    onClick={capturePhoto}
                  />
                </div>
              )}
            </div>

            <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 24 }}>
              <Button 
                type="primary" 
                size="large" 
                block 
                className="action-button primary-button"
                disabled={!capturedImage}
                onClick={() => setCurrentStep(3)}
              >
                Continue to Submit
              </Button>
              <Button 
                type="text" 
                block 
                className="action-button secondary-button"
                onClick={() => {
                  stopCamera();
                  setCurrentStep(1);
                }}
              >
                Back
              </Button>
            </Space>
          </div>
        </div>

        {/* Step 4: Review & Submit */}
        <div className={`drawer-section ${currentStep === 3 ? 'active' : ''}`} style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          <div className="drawer-section-header">
            <div className="section-icon">
              <CheckCircleOutlined />
            </div>
            <h3 className="drawer-section-title">Review & Submit</h3>
          </div>
          
          <div className="drawer-section-content">
            <div className="info-box" style={{ background: 'var(--accent-glow)', borderColor: 'var(--accent-color)' }}>
              <Text className="info-text" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                Verification typically takes 1-3 business days. You'll receive an email once complete.
              </Text>
            </div>

            <div className="kyc-submit-actions">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  className="action-button submit-button"
                  onClick={handleSubmit}
                  icon={<CheckCircleOutlined />}
                >
                  Submit for Review
                </Button>
                <Button 
                  type="text" 
                  block 
                  className="action-button secondary-button"
                  onClick={() => setCurrentStep(2)}
                >
                  Back to Edit
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderStatusContent = () => {
    switch (kycStatus) {
      case 'verified':
        return (
          <div className="kyc-status-content">
            <div className="status-icon-wrapper" style={{ color: '#52c41a' }}>
              <CheckCircleOutlined />
            </div>
            <Title level={3} className="status-title">KYC Verified</Title>
            <Paragraph className="status-description">
              Your account has been successfully verified. You now have full access to all premium features and higher limits.
            </Paragraph>
            <Button 
              type="primary" 
              size="large" 
              onClick={onClose}
              className="action-button primary-button"
              style={{ minWidth: 200 }}
            >
              Great, thanks!
            </Button>
          </div>
        );

      case 'submitted':
        return (
          <div className="kyc-status-content">
            <div className="status-icon-wrapper" style={{ color: '#1890ff' }}>
              <ExclamationCircleOutlined />
            </div>
            <Title level={3} className="status-title">Under Review</Title>
            <Paragraph className="status-description">
              Your application is being processed. This typically takes 1-3 business days. We will notify you once complete.
            </Paragraph>
            <Button 
              type="primary" 
              size="large" 
              onClick={onClose}
              className="action-button primary-button"
              style={{ minWidth: 200 }}
            >
              Back to Settings
            </Button>
          </div>
        );

      case 'rejected':
        return (
          <div className="kyc-status-content">
            <div className="status-icon-wrapper" style={{ color: '#ff4d4f' }}>
              <ExclamationCircleOutlined />
            </div>
            <Title level={3} className="status-title">Verification Failed</Title>
            <Paragraph className="status-description">
              We couldn't verify your information. Please check the requirements and try submitting a new application.
            </Paragraph>
            <Button 
              type="primary" 
              size="large"
              onClick={() => setKycStatus('pending')}
              className="action-button primary-button"
              style={{ minWidth: 200 }}
            >
              Start New Application
            </Button>
          </div>
        );

      default:
        return (
          <div className="kyc-process">
            <div className="kyc-steps-container">
              <Steps 
                current={currentStep} 
                items={steps} 
                className="kyc-steps" 
                direction="horizontal"
                size="small"
                titlePlacement="vertical"
                responsive={false}
                onChange={handleStepClick}
              />
            </div>

            <div className="drawer-sections">
              {renderAllStepsContent()}
            </div>
          </div>
        );
    }
  };

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={visible}
      width={window.innerWidth > 600 ? 550 : "100%"}
      className="kyc-settings-drawer"
      closeIcon={null}
    >
      <div className="drawer-header">
        <div className="header-left">
          <Button 
            type="text" 
            icon={<ArrowRightOutlined rotate={180} />} 
            onClick={onClose}
            className="back-button"
          />
          <Title level={4} className="drawer-title">Account Verification</Title>
        </div>
        <div className="kyc-status-badge" style={{ 
          background: `${getStatusColor(kycStatus)}15`,
          color: getStatusColor(kycStatus),
          border: `1px solid ${getStatusColor(kycStatus)}30`
        }}>
          {getStatusText(kycStatus)}
        </div>
      </div>

      <div className="drawer-content">
        {renderStatusContent()}
      </div>
    </Drawer>
  );
}
