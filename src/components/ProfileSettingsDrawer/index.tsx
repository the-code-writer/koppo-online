import { useState, useEffect } from "react";
import { Drawer, Form, Input, Button, Avatar, Upload, Typography, Tooltip, Alert, Select, Spin, message, Space } from "antd";
import { UserOutlined, WarningOutlined, MailOutlined, PhoneOutlined, CheckCircleFilled, ArrowRightOutlined, CameraOutlined, IdcardOutlined, GlobalOutlined } from "@ant-design/icons";
import { User, authAPI } from '../../services/api';
import { FileHandler } from '../../utils/FileHandler';
import { storageService } from '../../services/storage';
import { useOAuth } from '../../contexts/OAuthContext';
import "./styles.scss";
import { envConfig } from "../../config/env.config";

const { Title, Text } = Typography;

const countries = [
  { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: '+265', flag: '🇲🇼', name: 'Malawi' },
  { code: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+267', flag: '🇧🇼', name: 'Botswana' },
  { code: '+268', flag: '🇸🇿', name: 'Eswatini' },
  { code: '+290', flag: '🇸🇭', name: 'Saint Helena' },
  { code: '+247', flag: '🇦🇨', name: 'Ascension Island' },
];

interface ProfileSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export const ProfileSettingsDrawer: React.FC<ProfileSettingsDrawerProps> = ({ visible, onClose, user }) => {
  const { refreshProfile } = useOAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modificationRequestStatus, setModificationRequestStatus] = useState<'idle' | 'loading' | 'pending'>('idle');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [verificationEmailLoading, setVerificationEmailLoading] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  
  const handleRequestModification = () => {
    setModificationRequestStatus('loading');
    
    // Simulate API call for 3 seconds
    setTimeout(() => {
      setModificationRequestStatus('pending');
    }, 3000);
  };

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageData, setProfileImageData] = useState<{
    base64: string;
    fileName: string;
    fileType: string;
  } | null>(null);

  const [selectedCountry, setSelectedCountry] = useState({
    code: '+263',
    flag: '🇿🇼',
    name: 'Zimbabwe'
  });

  const handlePhotoUpload = async (file: File) => {
    const validation = storageService.validateFile(file, 5, ['image/jpeg', 'image/png', 'image/webp']);
    if (!validation.valid) {
      message.error(validation.error);
      return false;
    }
    
    setUploadingPhoto(true);
    
    try {
      const fileData = await FileHandler.handleFileUpload(file);
      const dataUrl = FileHandler.createDataUrl(fileData.base64, fileData.fileType);
      
      setProfileImage(dataUrl);
      setProfileImageData(fileData);
      
      const result = await storageService.uploadFile(file, 'profile', ['user-photo']);

      console.warn({apiUrl: envConfig.VITE_API_BASE_URL, resultUrl:result.url})
      
      if (result.success && result.url) {
        const downloadUrl = `${envConfig.VITE_API_BASE_URL}${result.url}/download`;
        setProfilePhotoUrl(downloadUrl);
        
        try {
          const updateResponse = await authAPI.updateUserProfile({payload: {
            key: "accounts.firebase.photoURL", value: downloadUrl
          }});
          if (updateResponse.success) {
            await refreshProfile();
            message.success('Profile photo updated successfully!');
          } else {
            message.warning('Photo uploaded but profile update failed');
          }
        } catch (updateError) {
          message.warning('Photo uploaded but profile update failed');
        }
      }
    } catch (error) {
      message.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
    
    return false;
  };

  const beforeUpload = (file: File) => {
    handlePhotoUpload(file);
    return false;
  };

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
      if (user?.photoURL) {
        setProfileImage(user?.photoURL);
        setProfilePhotoUrl(user?.photoURL);
      }
    }
  }, [user, form]);

  const handleUpdateProfile = async (profileData: any) => {
    setLoading(true);
    try {
      await authAPI.updateUserProfile(profileData);
      await refreshProfile();
      message.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerificationLink = async () => {
    setVerificationEmailLoading(true);
    setVerificationEmailSent(false);
    
    try {
      const response = await authAPI.sendVerificationEmail();
      if (response.success) {
        setVerificationEmailSent(true);
        message.success('Verification email sent successfully!');
      } else {
        message.error(response.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setVerificationEmailLoading(false);
    }
  }

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={visible}
      size={600}
      className="profile-settings-drawer"
      closeIcon={null}
    >
      <div className="drawer-header">
        <Button 
          type="text" 
          icon={<ArrowRightOutlined rotate={180} />} 
          onClick={onClose}
          className="back-button"
        />
        <Title level={4} className="drawer-title">My Profile</Title>
      </div>

      <div className="drawer-content">
        <div className="profile-picture-container">
          <div className="avatar-wrapper">
            <Upload
              name="avatar"
              showUploadList={false}
              beforeUpload={beforeUpload}
              accept="image/*"
              disabled={uploadingPhoto}
            >
              <div style={{ position: 'relative' }}>
                {uploadingPhoto ? (
                  <Avatar size={110} style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                    <Spin />
                  </Avatar>
                ) : (
                  <Avatar 
                    src={profilePhotoUrl || profileImage} 
                    icon={<UserOutlined />} 
                    size={110} 
                  >
                    {!profilePhotoUrl && !profileImage && user?.displayName?.[0]}
                  </Avatar>
                )}
                <div className="camera-badge">
                  <CameraOutlined />
                </div>
              </div>
            </Upload>
          </div>
          <div className="user-info">
            <Title level={2}>{user?.displayName}</Title>
            <span className="koppo-id">Koppo ID: {user?.uuid?.split('-')[0].toUpperCase()}</span>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          className="modern-form"
        >
          <div className="profile-section">
            <div className="profile-section-header">
              <div className="section-icon"><IdcardOutlined /></div>
              <h3>Personal Information</h3>
            </div>
            
            <div className="profile-card">
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Space size={16} style={{ width: '100%' }}>
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input size="large" className="modern-input" placeholder="First Name" />
                  </Form.Item>
                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input size="large" className="modern-input" placeholder="Last Name" />
                  </Form.Item>
                </Space>

                <Form.Item
                  label="Display Name"
                  name="displayName"
                  rules={[{ required: true, message: 'Please enter your display name' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input size="large" className="modern-input" placeholder="How others see you" />
                </Form.Item>

                <Form.Item
                  label="Username"
                  name="username"
                  style={{ marginBottom: 0 }}
                >
                  <Input size="large" disabled className="modern-input" prefix={<UserOutlined />} />
                </Form.Item>
              </Space>
            </div>
          </div>

          <div className="profile-section">
            <div className="profile-section-header">
              <div className="section-icon"><GlobalOutlined /></div>
              <h3>Contact Details</h3>
            </div>

            <div className="profile-card">
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Form.Item
                  label="Email Address"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <Input 
                    size="large" 
                    className="modern-input"
                    disabled={user?.isEmailVerified}
                    prefix={<MailOutlined />}
                    suffix={
                      !user?.isEmailVerified ? (
                        <Button 
                          type="link" 
                          onClick={sendEmailVerificationLink} 
                          loading={verificationEmailLoading}
                          style={{ 
                            color: verificationEmailSent ? "var(--success-color, #52c41a)" : "var(--warning-color, #faad14)",
                            padding: 0,
                            height: 'auto',
                            fontSize: '12px'
                          }}
                        >
                          {verificationEmailSent ? "Resend" : "Verify"}
                        </Button>
                      ) : (
                        <Tooltip title="Verified">
                          <CheckCircleFilled style={{ color: "var(--success-color, #52c41a)" }} />
                        </Tooltip>
                      )
                    }
                  />
                </Form.Item>

                <Form.Item
                  label="Phone Number"
                  name="phoneNumber"
                  style={{ marginBottom: 0 }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Select
                      size="large"
                      className="modern-input"
                      value={`${selectedCountry.flag} ${selectedCountry.code}`}
                      onChange={(value) => {
                        const country = countries.find(c => `${c.flag} ${c.code}` === value);
                        if (country) setSelectedCountry(country);
                      }}
                      style={{ width: '100px' }}
                      showSearch
                    >
                      {countries.map(country => (
                        <Select.Option key={country.code} value={`${country.flag} ${country.code}`}>
                          {country.flag} {country.code}
                        </Select.Option>
                      ))}
                    </Select>
                    <Input
                      size="large"
                      className="modern-input"
                      style={{ flex: 1 }}
                      placeholder="772890123"
                      prefix={<PhoneOutlined />}
                      disabled
                    />
                  </div>
                </Form.Item>
              </Space>
            </div>
          </div>

          <Alert
            className="modification-alert"
            message={modificationRequestStatus === 'pending' ? "Request Pending" : "Account Protection"}
            description={
              modificationRequestStatus === 'pending' 
                ? "Your profile change request is under review. You'll be notified via email."
                : "To update your verified email or phone number, please submit a modification request."
            }
            type={modificationRequestStatus === 'pending' ? 'info' : 'warning'}
            showIcon
            action={modificationRequestStatus === 'idle' && (
              <Button size="small" type="ghost" onClick={handleRequestModification}>
                Request
              </Button>
            )}
          />

          <div className="action-buttons">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              className="action-button primary-button"
            >
              Save Changes
            </Button>
            <Button 
              onClick={onClose} 
              className="action-button secondary-button"
            >
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    </Drawer>
  );
};
