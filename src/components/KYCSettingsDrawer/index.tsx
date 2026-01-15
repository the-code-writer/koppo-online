import React from 'react';
import { Drawer, Button, Typography, Alert, Space, Card, Steps, Upload, Form, Input, Select, Divider } from 'antd';
import { UploadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, FileTextOutlined, IdcardOutlined, CameraOutlined } from '@ant-design/icons';
import './styles.scss';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Dragger } = Upload;

interface KYCSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user?: any;
}

export function KYCSettingsDrawer({ visible, onClose, user }: KYCSettingsDrawerProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [kycStatus, setKycStatus] = React.useState<'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected'>('pending');
  const [form] = Form.useForm();

  // Mock KYC status - in real app, this would come from API
  React.useEffect(() => {
    // Simulate different KYC statuses for demonstration
    const mockStatus = 'pending'; // Change this to test different states
    setKycStatus(mockStatus);
  }, []);

  const steps = [
    {
      title: 'Personal Information',
      description: 'Basic personal details',
      icon: <IdcardOutlined />,
    },
    {
      title: 'Document Upload',
      description: 'Identity verification',
      icon: <FileTextOutlined />,
    },
    {
      title: 'Selfie Verification',
      description: 'Photo verification',
      icon: <CameraOutlined />,
    },
    {
      title: 'Review & Submit',
      description: 'Final review',
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
      <div className="kyc-all-steps-content">
        {/* Step 1: Personal Information */}
        <div className={`kyc-step-section ${currentStep === 0 ? 'active' : ''}`}>
          <div className="kyc-step-header" onClick={() => handleStepClick(0)}>
            <div className="kyc-step-number">1</div>
            <div className="kyc-step-info">
              <h3>Personal Information</h3>
              <p>Basic personal details</p>
            </div>
            <CheckCircleOutlined className={`kyc-step-icon ${currentStep >= 0 ? 'completed' : ''}`} />
          </div>
          
          <div className="kyc-step-content">
            <Form form={form} layout="vertical" className="kyc-form">
              <Form.Item
                name="fullName"
                label="Full Legal Name"
                rules={[{ required: true, message: 'Please enter your full legal name' }]}
              >
                <Input placeholder="Enter your full legal name as it appears on your ID" />
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[{ required: true, message: 'Please select your date of birth' }]}
              >
                <Input type="date" />
              </Form.Item>

              <Form.Item
                name="nationality"
                label="Nationality"
                rules={[{ required: true, message: 'Please select your nationality' }]}
              >
                <Select placeholder="Select your nationality">
                  <Select.Option value="ZW">Zimbabwe</Select.Option>
                  <Select.Option value="US">United States</Select.Option>
                  <Select.Option value="GB">United Kingdom</Select.Option>
                  <Select.Option value="ZA">South Africa</Select.Option>
                  <Select.Option value="NG">Nigeria</Select.Option>
                  <Select.Option value="KE">Kenya</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="address"
                label="Residential Address"
                rules={[{ required: true, message: 'Please enter your residential address' }]}
              >
                <Input.TextArea rows={3} placeholder="Enter your full residential address" />
              </Form.Item>
            </Form>
          </div>
        </div>

        {/* Step 2: Document Upload */}
        <div className={`kyc-step-section ${currentStep === 1 ? 'active' : ''}`}>
          <div className="kyc-step-header" onClick={() => handleStepClick(1)}>
            <div className="kyc-step-number">2</div>
            <div className="kyc-step-info">
              <h3>Document Upload</h3>
              <p>Identity verification</p>
            </div>
            <FileTextOutlined className={`kyc-step-icon ${currentStep >= 1 ? 'completed' : ''}`} />
          </div>
          
          <div className="kyc-step-content">
            <Paragraph>
              Please upload a clear, valid government-issued ID document (Passport, National ID, or Driver's License).
            </Paragraph>

            <Card title="Identity Document" className="upload-card">
              <Dragger {...uploadProps} className="upload-dragger">
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for PDF, JPG, PNG files. Maximum file size: 5MB.
                </p>
              </Dragger>
            </Card>
          </div>
        </div>

        {/* Step 3: Selfie Verification */}
        <div className={`kyc-step-section ${currentStep === 2 ? 'active' : ''}`}>
          <div className="kyc-step-header" onClick={() => handleStepClick(2)}>
            <div className="kyc-step-number">3</div>
            <div className="kyc-step-info">
              <h3>Selfie Verification</h3>
              <p>Photo verification</p>
            </div>
            <CameraOutlined className={`kyc-step-icon ${currentStep >= 2 ? 'completed' : ''}`} />
          </div>
          
          <div className="kyc-step-content">
            <Paragraph>
              Please upload a clear selfie holding your ID document for verification.
            </Paragraph>

            <Card title="Selfie with ID" className="upload-card">
              <Dragger {...uploadProps} className="upload-dragger">
                <p className="ant-upload-drag-icon">
                  <CameraOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for JPG, PNG files. Maximum file size: 5MB.
                </p>
              </Dragger>
            </Card>
          </div>
        </div>

        {/* Step 4: Review & Submit */}
        <div className={`kyc-step-section ${currentStep === 3 ? 'active' : ''}`}>
          <div className="kyc-step-header" onClick={() => handleStepClick(3)}>
            <div className="kyc-step-number">4</div>
            <div className="kyc-step-info">
              <h3>Review & Submit</h3>
              <p>Final review</p>
            </div>
            <CheckCircleOutlined className={`kyc-step-icon ${currentStep >= 3 ? 'completed' : ''}`} />
          </div>
          
          <div className="kyc-step-content">
            <Title level={4}>Review Your Information</Title>
            <Paragraph>
              Please review all your information before submitting. Once submitted, you won't be able to make changes until the review process is complete.
            </Paragraph>

            <Alert
              message="Important Notice"
              description="KYC verification typically takes 1-3 business days. You will be notified via email once the review is complete."
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <div className="kyc-submit-actions">
              <Button type="primary" size="large" onClick={handleSubmit}>
                Submit for Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusContent = () => {
    switch (kycStatus) {
      case 'verified':
        return (
          <div className="kyc-status-content">
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 20 }} />
            <Title level={3} style={{ color: '#52c41a' }}>KYC Verified</Title>
            <Paragraph>
              Your account has been successfully verified. You now have access to all features including higher withdrawal limits and advanced trading options.
            </Paragraph>
          </div>
        );

      case 'submitted':
        return (
          <div className="kyc-status-content">
            <ExclamationCircleOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 20 }} />
            <Title level={3} style={{ color: '#1890ff' }}>Under Review</Title>
            <Paragraph>
              Your KYC application has been submitted and is currently under review. This typically takes 1-3 business days. You will be notified via email once the review is complete.
            </Paragraph>
          </div>
        );

      case 'rejected':
        return (
          <div className="kyc-status-content">
            <ExclamationCircleOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 20 }} />
            <Title level={3} style={{ color: '#ff4d4f' }}>Verification Failed</Title>
            <Paragraph>
              Your KYC application could not be verified. Please review the rejection reasons and submit a new application with correct information.
            </Paragraph>
            <Button type="primary">Start New Application</Button>
          </div>
        );

      default:
        return (
          <div className="kyc-process">
            <Title level={4}>Complete KYC Verification</Title>
            <Paragraph>
              Complete our KYC (Know Your Customer) verification process to unlock full account features and higher limits.
            </Paragraph>

            <Steps 
              current={currentStep} 
              items={steps} 
              className="kyc-steps clickable" 
              direction="horizontal"
              onChange={handleStepClick}
            />

            <Divider />

            {renderAllStepsContent()}
          </div>
        );
    }
  };

  return (
    <Drawer
      title={
        <div className="kyc-drawer-title">
          <Title level={4} style={{ margin: 0 }}>
            Account Verification (KYC)
          </Title>
          <div className="kyc-status-badge" style={{ color: getStatusColor(kycStatus) }}>
            {getStatusText(kycStatus)}
          </div>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      size={600}
      className="kyc-settings-drawer"
    >
      <div className="kyc-content">
        {renderStatusContent()}
      </div>
    </Drawer>
  );
}
