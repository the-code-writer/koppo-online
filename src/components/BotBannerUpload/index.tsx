import React, { useState } from 'react';
import { Upload, Typography, message, Spin } from 'antd';
import { CameraOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { FileHandler } from '../../utils/FileHandler';
import { storageService } from '../../services/storage';
import { envConfig } from '../../config/env.config';
import './styles.scss';

const { Text } = Typography;

interface BotBannerUploadProps {
  value?: string | null;
  onChange?: (url: string | null) => void;
}

export const BotBannerUpload: React.FC<BotBannerUploadProps> = ({
  value,
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);

  const handleUpload = async (file: File) => {
    const validation = storageService.validateFile(file, 5, [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]);

    if (!validation.valid) {
      message.error(validation.error);
      return false;
    }

    setUploading(true);

    try {
      // Create local preview immediately
      const fileData = await FileHandler.handleFileUpload(file);
      const dataUrl = FileHandler.createDataUrl(fileData.base64, fileData.fileType);
      setPreviewUrl(dataUrl);

      // Upload to server
      const result = await storageService.uploadFile(file, 'bot-banner', ['bot', 'banner']);

      if (result.success && result.url) {
        const downloadUrl = `${envConfig.VITE_API_BASE_URL}${result.url}/download`;
        onChange?.(downloadUrl);
        message.success('Banner uploaded successfully');
      } else {
        // Keep local preview even if server upload fails
        onChange?.(dataUrl);
        message.warning('Banner saved locally');
      }
    } catch (error) {
      message.error('Failed to upload banner');
      setPreviewUrl(null);
      onChange?.(null);
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onChange?.(null);
  };

  const beforeUpload = (file: any) => {
    handleUpload(file);
    return false;
  };

  return (
    <div className="bot-banner-upload">
      {previewUrl ? (
        <div className="bot-banner-upload__preview">
          <img
            src={previewUrl}
            alt="Bot banner"
            className="bot-banner-upload__image"
          />
          <div className="bot-banner-upload__overlay">
            <Upload
              name="banner"
              showUploadList={false}
              beforeUpload={beforeUpload}
              accept="image/*"
              disabled={uploading}
            >
              <div className="bot-banner-upload__action" title="Change image">
                <CameraOutlined />
              </div>
            </Upload>
            <div
              className="bot-banner-upload__action bot-banner-upload__action--delete"
              onClick={handleRemove}
              title="Remove image"
            >
              <DeleteOutlined />
            </div>
          </div>
          {uploading && (
            <div className="bot-banner-upload__loading">
              <Spin />
            </div>
          )}
        </div>
      ) : (
        <Upload
          name="banner"
          showUploadList={false}
          beforeUpload={beforeUpload}
          accept="image/*"
          disabled={uploading}
          className="bot-banner-upload__dropzone-wrapper"
        >
          <div className="bot-banner-upload__dropzone">
            {uploading ? (
              <Spin />
            ) : (
              <>
                <div className="bot-banner-upload__dropzone-icon">
                  <PictureOutlined />
                </div>
                <Text strong className="bot-banner-upload__dropzone-title">
                  Upload Bot Banner
                </Text>
                <Text type="secondary" className="bot-banner-upload__dropzone-hint">
                  Tap to select an image (JPG, PNG, WebP, max 5MB)
                </Text>
              </>
            )}
          </div>
        </Upload>
      )}
    </div>
  );
};
