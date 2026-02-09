// File: src/components/FacialKYC/FacialKYC.tsx
import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import './FacialKYC.css';

interface Step {
  key: string;
  label: string;
}

interface StepIndicatorProps {
  currentStep: string;
}

interface DetectionResults {
  faceDetected: boolean;
  leftTurn: boolean;
  rightTurn: boolean;
  smile: boolean;
  blink: boolean;
  verificationComplete: boolean;
}

interface CapturedImages {
  front: string | null;
  left: string | null;
  right: string | null;
  smile: string | null;
  blink: string | null;
}

interface HeadRotation {
  x: number;
  isLeft: boolean;
  isRight: boolean;
  isCenter: boolean;
}

interface VerificationCompleteData {
  success: boolean;
  images: CapturedImages;
  timestamp: string;
  verificationData: DetectionResults;
}

interface FacialKYCProps {
  onVerificationComplete?: (data: VerificationCompleteData) => void;
  onClose: () => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps: Step[] = [
    { key: 'initial', label: 'Front Face' },
    { key: 'left', label: 'Left Turn' },
    { key: 'right', label: 'Right Turn' },
    { key: 'smile', label: 'Smile' },
    { key: 'blink', label: 'Blink' }
  ];

  return (
    <div className="step-indicator">
      {steps.map((step, index) => (
        <div key={step.key} className="step-item">
          <div className={`step-circle ${currentStep === step.key ? 'active' : ''} ${steps.indexOf(currentStep) > index ? 'completed' : ''}`}>
            {index + 1}
          </div>
          <div className="step-label">{step.label}</div>
        </div>
      ))}
    </div>
  );
};

const FacialKYC: React.FC<FacialKYCProps> = ({ onVerificationComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [instructions, setInstructions] = useState('Please position your face in the frame');
  const [detectionResults, setDetectionResults] = useState<DetectionResults>({
    faceDetected: false,
    leftTurn: false,
    rightTurn: false,
    smile: false,
    blink: false,
    verificationComplete: false
  });
  const [capturedImages, setCapturedImages] = useState<CapturedImages>({
    front: null,
    left: null,
    right: null,
    smile: null,
    blink: null
  });
  const [processing, setProcessing] = useState(false);
  const [timer, setTimer] = useState(3);

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      setIsModelLoaded(true);
      startCamera();
    } catch (error) {
      console.error('Error loading models:', error);
      setVerificationStatus('Failed to load face detection models');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setVerificationStatus('Camera access denied. Please enable camera permissions.');
    }
  };

  const startCountdown = () => {
    setTimer(3);
  };

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded || processing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.width, height: video.height };
    
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    // Clear canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw detections
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    // Analyze face position and expressions
    if (detections.length > 0) {
      const detection = detections[0];
      const landmarks = detection.landmarks;
      
      // Calculate head rotation
      const rotation = calculateHeadRotation(landmarks);
      
      // Update detection results based on current step
      updateVerificationStatus(detection, rotation);
    } else {
      setDetectionResults(prev => ({ ...prev, faceDetected: false }));
    }

    // Continue detection loop
    requestAnimationFrame(detectFace);
  };

  const calculateHeadRotation = (landmarks: faceapi.FaceLandmarks68): HeadRotation => {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jaw = landmarks.getJawOutline();

    // Simple head rotation calculation
    const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
    const noseCenterX = nose[3].x;
    const rotationX = noseCenterX - eyeCenterX;

    return {
      x: rotationX,
      isLeft: rotationX < -10,
      isRight: rotationX > 10,
      isCenter: Math.abs(rotationX) <= 10
    };
  };

  const updateVerificationStatus = (detection: faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>, rotation: HeadRotation) => {
    const expressions = detection.expressions;
    const landmarks = detection.landmarks;
    
    let newResults = { ...detectionResults, faceDetected: true };

    // Detect blink (simplified - check eye aspect ratio)
    const blinkDetected = detectBlink(landmarks);
    
    // Update based on current step
    switch(currentStep) {
      case 'initial':
        if (rotation.isCenter) {
          setInstructions('Face detected! Ready to start verification');
          setTimeout(() => setCurrentStep('left'), 2000);
        }
        break;
      case 'left':
        if (rotation.isLeft) {
          newResults.leftTurn = true;
          setVerificationStatus('Left turn detected ');
        }
        break;
      case 'right':
        if (rotation.isRight) {
          newResults.rightTurn = true;
          setVerificationStatus('Right turn detected ');
        }
        break;
      case 'smile':
        if (expressions.happy > 0.8) {
          newResults.smile = true;
          setVerificationStatus('Smile detected ');
        }
        break;
      case 'blink':
        if (blinkDetected) {
          newResults.blink = true;
          setVerificationStatus('Blink detected ');
        }
        break;
    }

    setDetectionResults(newResults);
  };

  const detectBlink = (landmarks: faceapi.FaceLandmarks68): boolean => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    // Calculate eye aspect ratio (simplified)
    const leftEAR = calculateEyeAspectRatio(leftEye);
    const rightEAR = calculateEyeAspectRatio(rightEye);
    
    const ear = (leftEAR + rightEAR) / 2;
    
    // Threshold for blink detection
    return ear < 0.2;
  };

  const calculateEyeAspectRatio = (eye: faceapi.Point[]): number => {
    // Vertical distances
    const A = Math.sqrt(Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2));
    const B = Math.sqrt(Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2));
    
    // Horizontal distance
    const C = Math.sqrt(Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2));
    
    return (A + B) / (2 * C);
  };

  const captureStepImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }
    
    const imageData = canvas.toDataURL('image/jpeg');
    
    setCapturedImages(prev => ({
      ...prev,
      [currentStep]: imageData
    }));

    // Move to next step
    moveToNextStep();
  };

  const moveToNextStep = () => {
    const steps = ['initial', 'left', 'right', 'smile', 'blink', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      completeVerification();
    }
  };

  const completeVerification = () => {
    setProcessing(true);
    setInstructions('Verification complete! Processing results...');
    
    // Simulate API call
    setTimeout(() => {
      const allStepsComplete = 
        detectionResults.leftTurn && 
        detectionResults.rightTurn && 
        detectionResults.smile && 
        detectionResults.blink;
      
      if (allStepsComplete) {
        setVerificationStatus('Verification successful!');
        
        // Pass results to parent component
        if (onVerificationComplete) {
          onVerificationComplete({
            success: true,
            images: capturedImages,
            timestamp: new Date().toISOString(),
            verificationData: detectionResults
          });
        }
      } else {
        setVerificationStatus('Verification failed. Please try again.');
      }
      
      setProcessing(false);
      setCurrentStep('complete');
    }, 2000);
  };

  const retryVerification = () => {
    setCurrentStep('initial');
    setDetectionResults({
      faceDetected: false,
      leftTurn: false,
      rightTurn: false,
      smile: false,
      blink: false,
      verificationComplete: false
    });
    setCapturedImages({
      front: null,
      left: null,
      right: null,
      smile: null,
      blink: null
    });
    setVerificationStatus('');
    setInstructions('Please position your face in the frame');
  };

  // Load models on component mount
  useEffect(() => {
    const initializeModels = async () => {
      try {
        await loadModels();
      } catch (error) {
        console.error('Error initializing models:', error);
      }
    };
    
    initializeModels();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle step changes
  useEffect(() => {
    if (currentStep === 'left') {
      setInstructions('Slowly turn your head to the LEFT');
      startCountdown();
    } else if (currentStep === 'right') {
      setInstructions('Slowly turn your head to the RIGHT');
      startCountdown();
    } else if (currentStep === 'smile') {
      setInstructions('Please SMILE for the camera');
      startCountdown();
    } else if (currentStep === 'blink') {
      setInstructions('Please BLINK naturally');
      startCountdown();
    }
  }, [currentStep]);

  // Countdown timer for each step
  useEffect(() => {
    if (timer > 0 && currentStep !== 'initial' && currentStep !== 'complete') {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0) {
      captureStepImage();
    }
  }, [timer, currentStep]);

  // Start detection when models are loaded
  useEffect(() => {
    if (isModelLoaded && currentStep !== 'complete') {
      detectFace();
    }
  }, [isModelLoaded, currentStep]);

  return (
    <div className="facial-kyc-container">
      <div className="facial-kyc-modal">
        <div className="modal-header">
          <h2>Facial Verification</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="verification-progress">
          <StepIndicator currentStep={currentStep}/>
        </div>

        <div className="camera-container">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              width="640"
              height="480"
              onPlay={() => {
                if (videoRef.current) {
                  videoRef.current.width = videoRef.current.videoWidth;
                  videoRef.current.height = videoRef.current.videoHeight;
                }
              }}
            />
            <canvas
              ref={canvasRef}
              className="overlay-canvas"
              width="640"
              height="480"
            />
            
            {currentStep !== 'complete' && timer > 0 && (
              <div className="countdown-overlay">
                <div className="countdown-circle">{timer}</div>
              </div>
            )}
          </div>
        </div>

        <div className="instructions-panel">
          <div className="instructions-text">{instructions}</div>
          <div className="verification-status">{verificationStatus}</div>
          
          <div className="verification-checklist">
            <div className={`checklist-item ${detectionResults.leftTurn ? 'completed' : ''}`}>
              ✓ Left Turn {detectionResults.leftTurn ? '✓' : '...'}
            </div>
            <div className={`checklist-item ${detectionResults.rightTurn ? 'completed' : ''}`}>
              ✓ Right Turn {detectionResults.rightTurn ? '✓' : '...'}
            </div>
            <div className={`checklist-item ${detectionResults.smile ? 'completed' : ''}`}>
              ✓ Smile {detectionResults.smile ? '✓' : '...'}
            </div>
            <div className={`checklist-item ${detectionResults.blink ? 'completed' : ''}`}>
              ✓ Blink {detectionResults.blink ? '✓' : '...'}
            </div>
          </div>
        </div>

        <div className="action-buttons">
          {currentStep === 'complete' ? (
            <>
              <button 
                className="btn-primary"
                onClick={retryVerification}
              >
                Retry Verification
              </button>
              <button 
                className="btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </>
          ) : (
            <button 
              className="btn-primary"
              onClick={captureStepImage}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Capture Current Step'}
            </button>
          )}
        </div>

        {!isModelLoaded && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading face detection models...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacialKYC;