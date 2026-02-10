import React, { useRef, useState, useCallback } from 'react';
import { Button, Modal } from 'antd';
import { CameraOutlined, RetweetOutlined } from '@ant-design/icons';
import './styles.scss';
import { KYCFaceApp } from '../KYCSettingsDrawer/FaceDetector/KYCFaceApp';

interface CameraContainerProps {
  onCapture?: (imageData: string) => void;
  isLiveliness: boolean;
  className?: string;
  placeholderText?: string;
  showRetakeButton?: boolean;
  capturedImage?: string;
  onRetake?: () => void;
}

const CameraContainer: React.FC<CameraContainerProps> = ({
  onCapture,
  isLiveliness = true,
  className = '',
  placeholderText = 'Enable Camera',
  showRetakeButton = true,
  capturedImage: externalCapturedImage,
  onRetake: externalOnRetake
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [kycFaceAppOpen, setKYCFaceAppOpen] = useState(false);

  const setVideoNode = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      videoRef.current = node;
      console.log('Video node set');
      // If we already have a stream, assign it to the video
      if (streamRef.current) {
        console.log('Assigning existing stream to video');
        node.srcObject = streamRef.current;
        node.play().then(() => {
          console.log('Video playing successfully');
        }).catch(error => {
          console.error('Video play failed:', error);
        });
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    if(isLiveliness){
      setKYCFaceAppOpen(true);
      return;
    }
    setIsCameraStarting(true);
    setErrorMessage('');
    try {
      console.log('Starting camera...');
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Stream obtained:', mediaStream.getVideoTracks().length, 'video tracks');
      setStream(mediaStream);
      streamRef.current = mediaStream;

      // Assign to video element if it exists
      if (videoRef.current) {
        console.log('Assigning stream to video element');
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().then(() => {
          console.log('Video playing successfully after stream assignment');
        }).catch(error => {
          console.error('Video play failed after stream assignment:', error);
        });
      } else {
        console.log('Video element not ready yet');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Failed to access camera. Please check permissions.');
    } finally {
      setIsCameraStarting(false);
    }
  }, [isLiveliness]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');

      if (context) {
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        onCapture?.(imageData);
        stopCamera();
      }
    }
  }, [onCapture, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage('');
    externalOnRetake?.();
    startCamera();
  }, [externalOnRetake, startCamera]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle external captured image
  const displayImage = externalCapturedImage || capturedImage;

  return (


    <>
<div className={`camera-container ${className}`}>
          {/* Error Message */}
          {errorMessage && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#ff4d4f',
              color: 'white',
              borderRadius: '4px',
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              {errorMessage}
            </div>
          )}

          {!stream && !displayImage ? (
            <div className="camera-placeholder" onClick={startCamera}>
              {isCameraStarting ? (
                <div className="camera-loader" />
              ) : (
                <>
                  <CameraOutlined
                    className="placeholder-icon"
                    style={{ fontSize: '48px', color: 'white' }}
                  />
                  <span className="placeholder-text">{placeholderText}</span>
                </>
              )}
            </div>
          ) : displayImage ? (
            <div className="captured-preview">
              <img src={displayImage} alt="Captured selfie" />
              {showRetakeButton && (
                <Button
                  icon={<RetweetOutlined />}
                  className="retake-button"
                  onClick={retakePhoto}
                >
                  Retake
                </Button>
              )}
            </div>
          ) : (
            <div className="live-feed">
              <video
                ref={setVideoNode}
                autoPlay
                playsInline
                muted
                controls={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror effect for better user experience
                  backgroundColor: '#000' // Black background to see if video element is rendered
                }}
                onLoadedMetadata={() => console.log('Video metadata loaded')}
                onCanPlay={() => console.log('Video can play')}
                onError={(e) => console.error('Video error:', e)}
              />
              <div className="camera-overlay">
                <div className="face-guide" />
              </div>
              <Button
                type="primary"
                className="capture-button"
                onClick={capturePhoto}
                icon={<CameraOutlined
                  className="placeholder-icon"
                  style={{ fontSize: '48px', color: 'white' }}
                />}
              />
            </div>
          )}
        </div>

      <Modal 
        title="Facial Verification"
        open={kycFaceAppOpen}
        onCancel={() => setKYCFaceAppOpen(false)}
        footer={null}
        width="100%"
        style={{ maxWidth: '600px' }}
      >
        <KYCFaceApp />
      </Modal>

    </>

  );
};

export default CameraContainer;
