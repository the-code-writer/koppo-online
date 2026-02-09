import React, { useState, useCallback, useEffect } from 'react';
import { Drawer, Button, Typography, Space, Card, Steps, Upload, Form, Input, Select, Radio, Progress, message, Spin, Alert } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, FileTextOutlined, IdcardOutlined, CameraOutlined, ArrowRightOutlined, RetweetOutlined, HomeOutlined, UserOutlined, InboxOutlined, LoadingOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { kycAPI, storageAPI, KYCRequest } from '../../services/api';
import './styles.scss';

const { Title, Text, Paragraph } = Typography;

interface KYCSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user?: any;
}

type OverallStatus = KYCRequest['overallStatus'];

const mapOverallToLegacy = (status: OverallStatus | null): string => {
  switch (status) {
    case 'approved': return 'verified';
    case 'pending_review': return 'submitted';
    case 'in_progress': return 'in_progress';
    case 'declined': return 'rejected';
    case 'requires_resubmission': return 'rejected';
    default: return 'pending';
  }
};

export function KYCSettingsDrawer({ visible, onClose }: KYCSettingsDrawerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [kycData, setKycData] = useState<KYCRequest | null>(null);
  const [kycStatus, setKycStatus] = useState<string>('pending');
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Document Upload States
  const [documentStep, setDocumentStep] = useState<'identification' | 'proof_of_residence'>('identification');
  const [selectedIdType, setSelectedIdType] = useState<string>('passport');
  const [selectedProofType, setSelectedProofType] = useState<string>('utility_bill');
  const [idUploadProgress, setIdUploadProgress] = useState(0);
  const [proofUploadProgress, setProofUploadProgress] = useState(0);
  const [idUploadStatus, setIdUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [proofUploadStatus, setProofUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedIdFile, setUploadedIdFile] = useState<File | null>(null);
  const [uploadedProofFile, setUploadedProofFile] = useState<File | null>(null);
  const [idImageUrl, setIdImageUrl] = useState<string | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

  // Camera State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [videoNode, setVideoNode] = useState<HTMLVideoElement | null>(null);

  // Load KYC data when drawer opens
  useEffect(() => {
    if (visible) {
      loadKycData();
    }
  }, [visible]);

  const loadKycData = async () => {
    setLoadingKyc(true);
    try {
      const response = await kycAPI.getRequest();
      if (response.success && response.data) {
        setKycData(response.data);
        setKycStatus(mapOverallToLegacy(response.data.overallStatus));

        // Pre-fill form if profile data exists
        if (response.data.profile) {
          form.setFieldsValue({
            fullName: response.data.profile.legalFullName || '',
            dateOfBirth: response.data.profile.dateOfBirth?.split('T')[0] || '',
            nationality: response.data.profile.nationality || undefined,
            address: response.data.profile.residentialAddress || '',
          });
        }

        // Pre-fill document types if already submitted
        if (response.data.documents?.profile?.type) {
          setSelectedIdType(response.data.documents.profile.type);
          if (response.data.documents.profile.imgUrl) {
            setIdUploadStatus('success');
            setIdImageUrl(response.data.documents.profile.imgUrl);
          }
        }
        if (response.data.documents?.residence?.type) {
          setSelectedProofType(response.data.documents.residence.type);
          if (response.data.documents.residence.imgUrl) {
            setProofUploadStatus('success');
            setProofImageUrl(response.data.documents.residence.imgUrl);
          }
        }

        // Pre-fill selfie if already submitted
        if (response.data.self?.images?.length > 0) {
          setCapturedImage(response.data.self.images[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load KYC data:', error);
    } finally {
      setLoadingKyc(false);
    }
  };

  // File to base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload file to storage and return URL
  const uploadFileToStorage = async (file: File, category: string): Promise<string | null> => {
    try {
      const base64Data = await fileToBase64(file);
      const response = await storageAPI.uploadFile({
        fileName: file.name,
        mimeType: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        fileSize: file.size,
        data: base64Data,
        metadata: {
          category,
          tags: ['kyc', category],
        },
      });
      if (response.success && response.url) {
        return response.url;
      }
      return null;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  // Camera helpers
  useEffect(() => {
    if (stream && videoNode) {
      videoNode.srcObject = stream;
      videoNode.play().catch(err => {
        if (err.name !== 'AbortError') { /* silent */ }
      });
    }
  }, [stream, videoNode]);

  const startCamera = useCallback(async () => {
    setIsCameraStarting(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
    } catch {
      message.error('Failed to access camera. Please check permissions.');
    } finally {
      setIsCameraStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
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

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (currentStep !== 2 && stream) {
      stopCamera();
    }
  }, [currentStep, stream, stopCamera]);

  // --- Upload Handlers ---
  const handleIdUpload = async (file: File) => {
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB');
      return false;
    }

    setUploadedIdFile(file);
    setIdUploadStatus('uploading');
    setIdUploadProgress(0);

    const progressInterval = setInterval(() => {
      setIdUploadProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + 15;
      });
    }, 300);

    const url = await uploadFileToStorage(file, 'kyc-identification');
    clearInterval(progressInterval);

    if (url) {
      setIdUploadProgress(100);
      setIdUploadStatus('success');
      setIdImageUrl(url);
      message.success('ID document uploaded successfully!');
    } else {
      setIdUploadStatus('error');
      setIdUploadProgress(0);
      message.error('Failed to upload ID document. Please try again.');
    }

    return false;
  };

  const handleProofUpload = async (file: File) => {
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB');
      return false;
    }

    setUploadedProofFile(file);
    setProofUploadStatus('uploading');
    setProofUploadProgress(0);

    const progressInterval = setInterval(() => {
      setProofUploadProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + 15;
      });
    }, 300);

    const url = await uploadFileToStorage(file, 'kyc-residence');
    clearInterval(progressInterval);

    if (url) {
      setProofUploadProgress(100);
      setProofUploadStatus('success');
      setProofImageUrl(url);
      message.success('Proof of residence uploaded successfully!');
    } else {
      setProofUploadStatus('error');
      setProofUploadProgress(0);
      message.error('Failed to upload document. Please try again.');
    }

    return false;
  };

  // --- Step Navigation ---
  const handleProfileSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const response = await kycAPI.submitProfile({
        legalFullName: values.fullName,
        dateOfBirth: values.dateOfBirth,
        nationality: values.nationality,
        residentialAddress: values.address,
      });

      if (response.success) {
        setKycData(response.data);
        message.success('Profile information saved!');
        setCurrentStep(1);
      } else {
        message.error(response.message || 'Failed to save profile.');
      }
    } catch {
      message.warning('Please fill in all required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentNext = async () => {
    if (documentStep === 'identification') {
      if (idUploadStatus !== 'success' || !idImageUrl) {
        message.warning('Please upload your identification document first.');
        return;
      }

      setSubmitting(true);
      const response = await kycAPI.submitDocumentProfile({
        imgUrl: idImageUrl,
        type: selectedIdType,
      });
      setSubmitting(false);

      if (response.success) {
        setKycData(response.data);
        message.success('Identification document submitted!');
        setDocumentStep('proof_of_residence');
      } else {
        message.error(response.message || 'Failed to submit identification document.');
      }
    } else if (documentStep === 'proof_of_residence') {
      if (proofUploadStatus !== 'success' || !proofImageUrl) {
        message.warning('Please upload your proof of residence first.');
        return;
      }

      setSubmitting(true);
      const response = await kycAPI.submitDocumentResidence({
        imgUrl: proofImageUrl,
        type: selectedProofType,
      });
      setSubmitting(false);

      if (response.success) {
        setKycData(response.data);
        message.success('Proof of residence submitted!');
        setCurrentStep(2);
      } else {
        message.error(response.message || 'Failed to submit residence document.');
      }
    }
  };

  const handleDocumentBack = () => {
    if (documentStep === 'proof_of_residence') {
      setDocumentStep('identification');
    } else {
      setCurrentStep(0);
    }
  };

  const handleSelfieSubmit = async () => {
    if (!capturedImage) {
      message.warning('Please capture a selfie first.');
      return;
    }

    setSubmitting(true);
    const response = await kycAPI.submitSelf({
      images: [capturedImage],
      meta: {
        captureMethod: 'webcam',
        deviceInfo: navigator.userAgent,
      },
    });
    setSubmitting(false);

    if (response.success) {
      setKycData(response.data);
      message.success('Selfie submitted!');
      setCurrentStep(3);
    } else {
      message.error(response.message || 'Failed to submit selfie.');
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    // The individual sections are already submitted, so we just reload status
    const response = await kycAPI.getRequest();
    setSubmitting(false);

    if (response.success && response.data) {
      setKycData(response.data);
      setKycStatus(mapOverallToLegacy(response.data.overallStatus));
      message.success('KYC application submitted for review!');
    } else {
      message.error('Something went wrong. Please try again.');
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  // --- Status Helpers ---
  const steps = [
    { title: 'Profile', icon: <IdcardOutlined /> },
    { title: 'Documents', icon: <FileTextOutlined /> },
    { title: 'Selfie', icon: <CameraOutlined /> },
    { title: 'Submit', icon: <CheckCircleOutlined /> },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#52c41a';
      case 'submitted': return '#1890ff';
      case 'in_progress': return '#faad14';
      case 'rejected': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'submitted': return 'Under Review';
      case 'in_progress': return 'In Progress';
      case 'rejected': return 'Rejected';
      default: return 'Not Started';
    }
  };

  // --- Render Steps ---
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
            <Card className="document-type-card">
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
              >
                <Input size="large" className="modern-input" type="date" />
              </Form.Item>

              <Form.Item
                name="nationality"
                label="Nationality"
                rules={[{ required: true, message: 'Please select your nationality' }]}
              >
                <Select size="large" className="modern-input" placeholder="Select">
                  <Select.Option value="Zimbabwean">Zimbabwe</Select.Option>
                  <Select.Option value="American">United States</Select.Option>
                  <Select.Option value="South African">South Africa</Select.Option>
                  <Select.Option value="British">United Kingdom</Select.Option>
                  <Select.Option value="Nigerian">Nigeria</Select.Option>
                  <Select.Option value="Kenyan">Kenya</Select.Option>
                  <Select.Option value="Botswanan">Botswana</Select.Option>
                  <Select.Option value="Zambian">Zambia</Select.Option>
                  <Select.Option value="Mozambican">Mozambique</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="address"
                label="Residential Address"
                rules={[{ required: true, message: 'Please enter your residential address' }]}
              >
                <Input.TextArea rows={3} className="modern-input" placeholder="Full residential address" />
              </Form.Item>
              <Space className="action-buttons" vertical size={18} style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  className="action-button primary-button"
                  onClick={handleProfileSubmit}
                  loading={submitting}
                >
                  Continue to Documents
                </Button></Space>
            </Form>
            </Card>
          </div>
        </div>

        {/* Step 2: Document Upload */}
        <div className={`drawer-section ${currentStep === 1 ? 'active' : ''}`} style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <div className="drawer-section-header">
            <div className="section-icon">
              <FileTextOutlined />
            </div>
            <h3 className="drawer-section-title">
              {documentStep === 'identification' ? 'Upload Identification Document' : 'Upload Proof of Residence'}
            </h3>
          </div>

          <div className="drawer-section-content">
            {documentStep === 'identification' ? (
              <>
                <Card className="document-type-card">
                  <Title level={5}>Select Document Type</Title>
                  <Text className="info-text">
                    Please select and upload a clear, valid government-issued identification document.
                  </Text>
                  <Radio.Group
                    value={selectedIdType}
                    onChange={(e) => setSelectedIdType(e.target.value)}
                    className="document-radio-group"
                  >
                    <Space vertical style={{ width: '100%' }}>
                      <Radio value="passport" className="document-radio">
                        <div className="radio-content">

                          <div>
                            <Text strong><IdcardOutlined className="radio-icon" /> Passport</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>International travel document</Text>
                          </div>
                        </div>
                      </Radio>
                      <Radio value="national_id" className="document-radio">
                        <div className="radio-content">
                          <div>
                            <Text strong><IdcardOutlined className="radio-icon" /> National ID Card</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>Government-issued identity card</Text>
                          </div>
                        </div>
                      </Radio>
                      <Radio value="drivers_licence" className="document-radio">
                        <div className="radio-content">
                          <div>
                            <Text strong><IdcardOutlined className="radio-icon" /> Driver's License</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>Official driving permit</Text>
                          </div>
                        </div>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Card>

                <Card className="upload-card-modern">
                  <Upload.Dragger
                    name="file"
                    multiple={false}
                    accept=".pdf,.jpg,.jpeg,.png"
                    beforeUpload={handleIdUpload}
                    showUploadList={false}
                    className="modern-uploader"
                    disabled={idUploadStatus === 'uploading'}
                  >
                    <div className="uploader-content">
                      {idUploadStatus === 'uploading' ? (
                        <div className="upload-progress">
                          <Progress type="circle" percent={idUploadProgress} size={80} />
                          <Text style={{ marginTop: 16, display: 'block' }}>Uploading...</Text>
                        </div>
                      ) : idUploadStatus === 'success' ? (
                        <div className="upload-success">
                          <CheckCircleOutlined className="success-icon" />
                          <Text strong style={{ marginTop: 16, display: 'block' }}>
                            {uploadedIdFile?.name || 'Document uploaded'}
                          </Text>
                          <Text type="secondary">Upload completed successfully</Text>
                        </div>
                      ) : idUploadStatus === 'error' ? (
                        <div className="upload-error">
                          <CloseCircleOutlined style={{ fontSize: 40, color: '#ff4d4f' }} />
                          <Text type="danger" style={{ marginTop: 16, display: 'block' }}>Upload failed. Click to retry.</Text>
                        </div>
                      ) : (
                        <>
                          <InboxOutlined className="upload-icon" />
                          <p className="ant-upload-text">Click or drag file to upload</p>
                          <p className="ant-upload-hint">Support for PDF, JPG, PNG (Max 5MB)</p>
                        </>
                      )}
                    </div>
                  </Upload.Dragger>
                </Card>
              </>
            ) : (
              <>
                <div className="info-box">
                  <Text className="info-text">
                    Please upload a recent document that proves your residential address.
                  </Text>
                </div>

                <Card className="document-type-card">
                  <Title level={5}>Select Document Type</Title>
                  <Radio.Group
                    value={selectedProofType}
                    onChange={(e) => setSelectedProofType(e.target.value)}
                    className="document-radio-group"
                  >
                    <Space vertical style={{ width: '100%' }}>
                      <Radio value="utility_bill" className="document-radio">
                        <div className="radio-content">
                          <HomeOutlined className="radio-icon" />
                          <div>
                            <Text strong>Utility Bill</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>Electricity, water, or gas bill (last 3 months)</Text>
                          </div>
                        </div>
                      </Radio>
                      <Radio value="bank_statement" className="document-radio">
                        <div className="radio-content">
                          <FileTextOutlined className="radio-icon" />
                          <div>
                            <Text strong>Bank Statement</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>Recent bank statement with address</Text>
                          </div>
                        </div>
                      </Radio>
                      <Radio value="lease_agreement" className="document-radio">
                        <div className="radio-content">
                          <FileTextOutlined className="radio-icon" />
                          <div>
                            <Text strong>Lease Agreement</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>Current rental contract</Text>
                          </div>
                        </div>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Card>

                <Card className="upload-card-modern">
                  <Upload.Dragger
                    name="file"
                    multiple={false}
                    accept=".pdf,.jpg,.jpeg,.png"
                    beforeUpload={handleProofUpload}
                    showUploadList={false}
                    className="modern-uploader"
                    disabled={proofUploadStatus === 'uploading'}
                  >
                    <div className="uploader-content">
                      {proofUploadStatus === 'uploading' ? (
                        <div className="upload-progress">
                          <Progress type="circle" percent={proofUploadProgress} size={80} />
                          <Text style={{ marginTop: 16, display: 'block' }}>Uploading...</Text>
                        </div>
                      ) : proofUploadStatus === 'success' ? (
                        <div className="upload-success">
                          <CheckCircleOutlined className="success-icon" />
                          <Text strong style={{ marginTop: 16, display: 'block' }}>
                            {uploadedProofFile?.name || 'Document uploaded'}
                          </Text>
                          <Text type="secondary">Upload completed successfully</Text>
                        </div>
                      ) : proofUploadStatus === 'error' ? (
                        <div className="upload-error">
                          <CloseCircleOutlined style={{ fontSize: 40, color: '#ff4d4f' }} />
                          <Text type="danger" style={{ marginTop: 16, display: 'block' }}>Upload failed. Click to retry.</Text>
                        </div>
                      ) : (
                        <>
                          <InboxOutlined className="upload-icon" />
                          <p className="ant-upload-text">Click or drag file to upload</p>
                          <p className="ant-upload-hint">Support for PDF, JPG, PNG (Max 5MB)</p>
                        </>
                      )}
                    </div>
                  </Upload.Dragger>
                </Card>
              </>
            )}

            <Space className="action-buttons" vertical size={18} style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                block
                className="action-button primary-button"
                onClick={handleDocumentNext}
                loading={submitting}
                disabled={
                  (documentStep === 'identification' && idUploadStatus !== 'success') ||
                  (documentStep === 'proof_of_residence' && proofUploadStatus !== 'success')
                }
              >
                {documentStep === 'identification' ? 'Continue to Proof of Residence' : 'Continue to Selfie'}
                <ArrowRightOutlined />
              </Button>
              <Button
                type="default"
                block
                className="action-button secondary-button"
                onClick={handleDocumentBack}
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

            <Space className="action-buttons" vertical size={18} style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                block
                className="action-button primary-button"
                disabled={!capturedImage}
                loading={submitting}
                onClick={handleSelfieSubmit}
              >
                Continue to Submit
              </Button>
              <Button
                type="default"
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
            {/* Review Summary */}
            <div className="review-summary">
              <Card size="small" style={{ marginBottom: 12 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text><IdcardOutlined /> Profile Information</Text>
                    {kycData?.profile?.legalFullName ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text><FileTextOutlined /> Identification Document</Text>
                    {kycData?.documents?.profile?.imgUrl ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text><HomeOutlined /> Proof of Residence</Text>
                    {kycData?.documents?.residence?.imgUrl ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text><CameraOutlined /> Selfie Verification</Text>
                    {kycData?.self?.images?.length ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    )}
                  </div>
                </Space>
              </Card>

              {kycData?.completionPercentage !== undefined && (
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">Completion</Text>
                  <Progress percent={kycData.completionPercentage} status="active" />
                </div>
              )}
            </div>

            <div className="info-box" style={{ background: 'var(--accent-glow)', borderColor: 'var(--accent-color)' }}>
              <Text className="info-text" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                Verification typically takes 1-3 business days. You'll receive an email once complete.
              </Text>
            </div>

            <Space className="action-buttons" vertical size={18} style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                block
                className="action-button submit-button"
                onClick={handleFinalSubmit}
                loading={submitting}
                icon={<CheckCircleOutlined />}
              >
                Submit for Review
              </Button>
              <Button
                type="default"
                block
                className="action-button secondary-button"
                onClick={() => setCurrentStep(2)}
              >
                Back to Edit
              </Button>
            </Space>
          </div>
        </div>
      </>
    );
  };

  const renderStatusContent = () => {
    if (loadingKyc) {
      return (
        <div className="kyc-status-content" style={{ padding: '60px 0' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <Text style={{ marginTop: 24, display: 'block' }}>Loading verification status...</Text>
        </div>
      );
    }

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
            <Space className="action-buttons" vertical size={18} style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                onClick={onClose}
                className="action-button primary-button"
                style={{ minWidth: 200 }}
              >
                Great, thanks!
              </Button></Space>
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
            {kycData?.completionPercentage !== undefined && (
              <div style={{ width: '100%', maxWidth: 300, margin: '0 auto 24px' }}>
                <Progress percent={kycData.completionPercentage} status="active" />
              </div>
            )}
            <Space className="action-buttons" vertical size={18} style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                onClick={onClose}
                className="action-button primary-button"
                style={{ minWidth: 200 }}
              >
                Back to Settings
              </Button>
            </Space>
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
            {kycData?.reviewHistory?.length ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 24, textAlign: 'left' }}
                message="Reason"
                description={kycData.reviewHistory[kycData.reviewHistory.length - 1]?.reason || 'No specific reason provided.'}
              />
            ) : null}
            <Space className="action-buttons" vertical size={18} style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setKycStatus('pending');
                  setCurrentStep(0);
                }}
                className="action-button primary-button"
                style={{ minWidth: 200 }}
              >
                Start New Application
              </Button>
            </Space>
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
                orientation="horizontal"
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
      size={600}
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
          <Title level={4} className="drawer-title">KYC Verification</Title>
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
