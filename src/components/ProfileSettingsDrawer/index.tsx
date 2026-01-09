import { useState, useEffect } from "react";
import { Drawer, Form, Input, Button, Avatar, Upload, Typography, Divider, Tooltip, Alert, Select, Spin, message } from "antd";
import { UserOutlined, WarningOutlined, MailOutlined, PhoneOutlined, CheckCircleFilled } from "@ant-design/icons";
import { User, authAPI } from '../../services/api';
import { FileHandler } from '../../utils/FileHandler';
import { storageService } from '../../services/storage';
import { useAuth } from '../../contexts/AuthContext';
import "./styles.scss";

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
  const { refreshProfile } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modificationRequestStatus, setModificationRequestStatus] = useState<'idle' | 'loading' | 'pending'>('idle');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  const handleRequestModification = () => {
    setModificationRequestStatus('loading');
    
    // Simulate API call for 3 seconds
    setTimeout(() => {
      setModificationRequestStatus('pending');
    }, 3000);
  };

  const handlePhotoUpload = async (file: File) => {
    // Validate file using storageService
    const validation = storageService.validateFile(file, 5, ['image/jpeg', 'image/png', 'image/webp']);
    if (!validation.valid) {
      message.error(validation.error);
      return false;
    }

    setUploadingPhoto(true);
    
    try {
      // Handle file upload and convert to base64 using FileHandler
      const fileData = await FileHandler.handleFileUpload(file);
      
      // Create data URL for display
      const dataUrl = FileHandler.createDataUrl(fileData.base64, fileData.fileType);
      
      // Update both states
      setProfileImage(dataUrl);
      setProfileImageData(fileData);
      
      // Also upload to storage service for backup
      const result = await storageService.uploadFile(file, 'profile', ['user-photo']);
      
      if (result.success && result.url) {
        const downloadUrl = `http://localhost:3051${result.url}/download`;
        setProfilePhotoUrl(downloadUrl);
        
        // Update user data with new photoURL
        try {
          const updateResponse = await authAPI.updateUserProfile({payload: {
            key: "accounts.firebase.photoURL", value: downloadUrl
          }});
          
          if (updateResponse.success) {
            console.log('User profile updated with new photoURL:', updateResponse);
            
            // Refresh profile data from database to update auth context
            await refreshProfile();
            
            message.success('Profile photo updated successfully!');
          } else {
            console.warn('Failed to update user profile:', updateResponse.error);
            message.warning('Photo uploaded but profile update failed');
          }
        } catch (updateError) {
          console.error('Error updating user profile:', updateError);
          message.warning('Photo uploaded but profile update failed');
        }
        
        console.log('Profile photo URL:', {result, downloadUrl});
      } else {
        console.warn('Storage upload failed, but local preview works:', result.error);
      }
      
      console.log('Profile image processed successfully:', {
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        base64Length: fileData.base64.length,
        dataUrl,
        fileData,
        result
      });
      
    } catch (error) {
      console.error('Photo upload error:', error);
      message.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
    
    return false; // Prevent default upload behavior
  };

  const beforeUpload = (file: File) => {
    handlePhotoUpload(file);
    return false; // Prevent default upload behavior
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

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      console.log('ProfileSettingsDrawer - User data:', user);
      console.log('ProfileSettingsDrawer - Phone number:', user.phoneNumber);
      form.setFieldsValue(user);
      
      // Set profile image from user's photoURL if available
      if (user.accounts?.firebase?.photoURL) {
        setProfileImage(user.accounts.firebase.photoURL);
      }
    }
  }, [user, form]);



  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      // Prepare profile data including image if updated
      const profileData = {
        ...values,
        ...(profileImageData && {
          profileImage: {
            base64: profileImageData.base64,
            fileName: profileImageData.fileName,
            fileType: profileImageData.fileType
          }
        })
      };

      // TODO: Implement API call to update profile
      console.log('Updating profile:', profileData);
      
      // If there's a profile image, log its details
      if (profileImageData) {
        console.log('Profile image to upload:', {
          fileName: profileImageData.fileName,
          fileType: profileImageData.fileType,
          base64Size: profileImageData.base64.length
        });
      }
      
      await authAPI.updateUserProfile(profileData);
      
      // Refresh profile data from database to update auth context
      await refreshProfile();
      
      // Show success message
      console.log('Profile updated successfully');
      
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerificationLink = async () => {
    const response = await authAPI.sendVerificationEmail();
    console.log("EMAIL VERIFICATION LINK SENT RESPONSE", response);
  }

  return (
    <Drawer
      title="My Profile"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    >
      
              <div className="profile-settings-content">
                {/* Profile Picture Section */}
                <div className="profile-picture-section">
                  <div className="profile-picture-upload">
                    <Upload
                      name="avatar"
                      listType="picture-card"
                      className="avatar-uploader"
                      showUploadList={false}
                      beforeUpload={beforeUpload}
                      accept="image/*"
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Spin size="large" />
                        </div>
                      ) : profilePhotoUrl ? (
                        <Avatar src={profilePhotoUrl} size={80} />
                      ) : profileImage ? (
                        <Avatar src={profileImage} size={80} />
                      ) : (
                        <Avatar icon={<UserOutlined />} size={80} />
                      )}
                    </Upload>
                    <Title level={4} style={{fontSize: 24, margin: 0}}>{user?.displayName}</Title>
                    <Text style={{fontSize: 16, margin: 0}}><code>Koppo ID: {user?.uuid.split('-')[0].toUpperCase()}</code></Text>
                  </div>
                </div>

                <Divider />

                {/* Profile Information Form */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  className="profile-form"
                >
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label="Display Name"
                    name="displayName"
                    rules={[{ required: true, message: 'Please enter your display name' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label="Username"
                    name="username"
                    rules={[{ required: true, message: 'Please enter your username' }]}
                  >
                    <Input size="large" disabled={true} prefix={<UserOutlined />} />
                  </Form.Item>

                  <Form.Item
                    label="Email Address"
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' }
                    ]}
                  >
                    <Input 
                      size="large" 
                      disabled={user?.isEmailVerified}
                      prefix={<MailOutlined />}
                      suffix={
                        !user?.isEmailVerified ? (
                          <Button 
                            type="link" 
                            onClick={()=>sendEmailVerificationLink()} 
                            size="small" 
                            style={{color: "#fa8c16", padding: 0, height: 'auto'}}
                          >
                            <WarningOutlined style={{color: "#fa8c16"}} /> Verify
                          </Button>
                        ) : (
                          <Tooltip title="Email Verified">
                            <CheckCircleFilled style={{color: "#00df6fff"}} />
                          </Tooltip>
                        )
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    label={<>Phone Number</>}
                    name="phoneNumber"
                    rules={[{ required: true, message: 'Please enter your phone number' }]}
                  >
                    <Input.Group compact>
                      <Select
                        size="large"
                        value={`${selectedCountry.flag} ${selectedCountry.code}`}
                        onChange={(value) => {
                          const country = countries.find(c => `${c.flag} ${c.code}` === value);
                          if (country) setSelectedCountry(country);
                        }}
                        style={{ width: '30%' }}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children?.toString().toLowerCase().indexOf(input.toLowerCase()) ?? -1) >= 0
                        }
                      >
                        {countries.map(country => (
                          <Select.Option key={country.code} value={`${country.flag} ${country.code}`}>
                            {country.flag} {country.code}
                          </Select.Option>
                        ))}
                      </Select>
                      <Input
                        size="large"
                        style={{ width: '70%' }}
                        placeholder="772890123"
                        prefix={<PhoneOutlined />}
                        disabled={true}
                        value={form.getFieldValue('phoneNumber')}
                      />
                    </Input.Group>
                  </Form.Item>

                  <Alert
                    message={
                      modificationRequestStatus === 'pending' 
                        ? "Request Pending Authorization"
                        : "Request Profile Modifications"
                    }
                    description={
                      <div>
                        {modificationRequestStatus === 'idle' && (
                          <>
                            <p>To modify your email address, username, or phone number, you need to submit a request for approval.</p>
                            <Button 
                              block
                              type="primary"
                              style={{ 
                                backgroundColor: '#fa8c16',
                                borderColor: '#fa8c16',
                                marginTop: '12px'
                              }}
                              onClick={handleRequestModification}
                            >
                              Request Modification
                            </Button>
                          </>
                        )}
                        {modificationRequestStatus === 'loading' && (
                          <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Spin size="large" />
                            <p style={{ marginTop: '16px', marginBottom: 0 }}>Submitting your request...</p>
                          </div>
                        )}
                        {modificationRequestStatus === 'pending' && (
                          <p>Your modification request has been submitted and is pending authorization. You will be notified once it's approved.</p>
                        )}
                      </div>
                    }
                    type={modificationRequestStatus === 'pending' ? 'info' : 'warning'}
                    showIcon
                    style={{ marginBottom: '24px' }}
                  />

                  <Form.Item style={{ marginTop: '32px' }}>
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading} 
                        size="large"
                        style={{ flex: 1, width: '50%' }}
                      >
                        Update Profile
                      </Button>
                      <Button 
                        onClick={onClose} 
                        size="large"
                        style={{ flex: 1, width: '50%' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form.Item>
                </Form>
              </div>
    </Drawer>
  );
}
