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
  const [blinkCount, setBlinkCount] = useState(0);
  const [previousEAR, setPreviousEAR] = useState(0);
  const [blinkState, setBlinkState] = useState<'open' | 'closed'>('open');

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
    
    // Detect blink (simplified - check eye aspect ratio)
    const blinkDetected = detectBlink(landmarks);
    
    // Update based on current step and auto-capture when detected
    // Only process the current step - don't go back to previous steps
    switch(currentStep) {
      case 'initial':
        if (rotation.isCenter && !detectionResults.faceDetected) {
          setVerificationStatus('Face Detected');
          const updatedResults = { ...detectionResults, faceDetected: true };
          setDetectionResults(updatedResults);
          
          // Log step 1 results
          const step1Results = {
            scores: {
              faceDetected: true,
              leftTurn: false,
              rightTurn: false,
              smile: false,
              blink: false
            },
            images: {
              front: null, // Will be captured after this
              left: null,
              right: null,
              smile: null,
              blink: null
            },
            timestamp: new Date().toISOString(),
            step: 'front_face_detected'
          };
          console.log('Step 1 - Front Face Detected:', step1Results);
          
          // Auto-capture front face image and move to next step
          setTimeout(() => {
            captureStepImage();
            setCurrentStep('left');
            setInstructions('Turn your head to the left');
          }, 1000);
        }
        break;
      case 'left':
        if (rotation.isLeft && !detectionResults.leftTurn) {
          const newResults = { ...detectionResults, leftTurn: true };
          setVerificationStatus('Left turn detected');
          setDetectionResults(newResults);
          // Auto-capture left turn image and move to next step
          setTimeout(() => {
            captureStepImage();
            setCurrentStep('right');
            setInstructions('Turn your head to the right');
          }, 1000);
        }
        break;
      case 'right':
        if (rotation.isRight && !detectionResults.rightTurn) {
          const newResults = { ...detectionResults, rightTurn: true };
          setVerificationStatus('Right turn detected');
          setDetectionResults(newResults);
          // Auto-capture right turn image and move to next step
          setTimeout(() => {
            captureStepImage();
            setCurrentStep('smile');
            setInstructions('Please smile');
          }, 1000);
        }
        break;
      case 'smile':
        if (expressions.happy > 0.8 && !detectionResults.smile) {
          const newResults = { ...detectionResults, smile: true };
          setVerificationStatus('Smile detected');
          setDetectionResults(newResults);
          // Auto-capture smile image and move to next step
          setTimeout(() => {
            captureStepImage();
            setCurrentStep('blink');
            setInstructions('Please blink');
          }, 1000);
        }
        break;
      case 'blink':
        if (blinkDetected && !detectionResults.blink) {
          const newResults = { ...detectionResults, blink: true };
          setVerificationStatus('Blink detected');
          setDetectionResults(newResults);
          // Auto-capture blink image and complete verification
          setTimeout(() => {
            captureStepImage();
            setCurrentStep('complete');
            setInstructions('Verification complete!');
          }, 1000);
        }
        break;
    }
  };

  const detectBlink = (landmarks: faceapi.FaceLandmarks68): boolean => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    
    // Calculate eye aspect ratio for both eyes
    const leftEAR = calculateEyeAspectRatio(leftEye);
    const rightEAR = calculateEyeAspectRatio(rightEye);
    const averageEAR = (leftEAR + rightEAR) / 2;
    
    console.log(`EAR values - Left: ${leftEAR.toFixed(3)}, Right: ${rightEAR.toFixed(3)}, Average: ${averageEAR.toFixed(3)}, BlinkState: ${blinkState}`);
    
    // Much more forgiving thresholds - detect ANY eye closure
    const LEFT_EYE_THRESHOLD = 0.35;  // Very forgiving for left eye
    const RIGHT_EYE_THRESHOLD = 0.35; // Very forgiving for right eye
    const BOTH_EYES_THRESHOLD = 0.4; // Even more forgiving for both eyes
    
    const leftEyeClosed = leftEAR < LEFT_EYE_THRESHOLD;
    const rightEyeClosed = rightEAR < RIGHT_EYE_THRESHOLD;
    const bothEyesClosed = averageEAR < BOTH_EYES_THRESHOLD;
    
    if (currentStep === 'blink') {
      // Detect ANY of these scenarios:
      // 1. Both eyes blink (normal blink)
      // 2. Left eye wink (left eye closed, right eye open)
      // 3. Right eye wink (right eye closed, left eye open)
      
      const normalBlink = bothEyesClosed && blinkState === 'open';
      const leftWink = leftEyeClosed && !rightEyeClosed && blinkState === 'open';
      const rightWink = rightEyeClosed && !leftEyeClosed && blinkState === 'open';

      if (normalBlink || leftWink || rightWink) {
        const detectionType = normalBlink ? 'blink' : leftWink ? 'left wink' : 'right wink';
        console.log(`${detectionType} detected! Count: ${blinkCount + 1}`);
        console.log(`Left EAR: ${leftEAR.toFixed(3)}, Right EAR: ${rightEAR.toFixed(3)}`);
        
        // Set blink state to closed and increment count
        setBlinkState('closed');
        setBlinkCount(prev => prev + 1);
        
        // Reset blink state after a short delay
        setTimeout(() => setBlinkState('open'), 300);
        
        return true;
      }
    }

    // Update previous EAR for next frame
    setPreviousEAR(averageEAR);

    return false;
  };

  const calculateEyeAspectRatio = (eye: faceapi.Eye) => {
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

    // Map current step to the correct image key
    const imageKey = currentStep === 'initial' ? 'front' : currentStep;

    setCapturedImages(prev => ({
      ...prev,
      [imageKey]: imageData,
    }));

    // Log results when blink is completed
    if (currentStep === 'blink') {
      const finalResults = {
        scores: {
          faceDetected: detectionResults.faceDetected,
          leftTurn: detectionResults.leftTurn,
          rightTurn: detectionResults.rightTurn,
          smile: detectionResults.smile,
          blink: true,
        },
        images: {
          ...capturedImages,
          blink: imageData,
        },
        timestamp: new Date().toISOString(),
      };
      console.log('Face Detection Results:', finalResults);
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
            verificationData: detectionResults,
          });
        }
      } else {
        setVerificationStatus('Verification failed. Please try again.');
      }

      setProcessing(false);
      setCurrentStep('complete');
    }, 2000);
  };

  useEffect(()=>{

    if(currentStep==='complete'){
      completeVerification();
    }

  },[currentStep])

  const retryVerification = () => {
    setCurrentStep('initial');
    setDetectionResults({
      faceDetected: false,
      leftTurn: false,
      rightTurn: false,
      smile: false,
      blink: false,
      verificationComplete: false,
    });
    setCapturedImages({
      front: null,
      left: null,
      right: null,
      smile: null,
      blink: null,
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
        videoRef.current.srcObject.getTracks().forEach((track: any) => track.stop());
      }
    };
  }, []);

  // Handle step changes
  useEffect(() => {
    if (currentStep === 'initial') {
      setInstructions('Position your head in the center');
    } else if (currentStep === 'left') {
      setInstructions('Turn your head to the left');
    } else if (currentStep === 'right') {
      setInstructions('Turn your head to the right');
    } else if (currentStep === 'smile') {
      setInstructions('Please smile');
    } else if (currentStep === 'blink') {
      setInstructions('Please blink');
    }
  }, [currentStep]);

  // Start detection when models are loaded
  useEffect(() => {
    if (isModelLoaded && currentStep !== 'complete') {
      detectFace();
    }
  }, [isModelLoaded, currentStep]);

  return (
    <div className="facial-kyc-container">
      <div className="facial-kyc-modal">
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
          </div>
        </div>

        <div className="instructions-panel">
          <div className="instructions-text">{instructions}</div>
          <div className="verification-status">{verificationStatus}</div>
          
          <div className="verification-checklist">
            <div className="checklist-grid">
              <div className={`checklist-item ${detectionResults.faceDetected ? 'completed' : ''}`}>
                <span className="checklist-icon"><small>{detectionResults.faceDetected ? '🟢' : '⚪'}</small></span>
                <span className="checklist-text">Front Face</span>
              </div>
              <div className={`checklist-item ${detectionResults.leftTurn ? 'completed' : ''}`}>
                <span className="checklist-icon"><small>{detectionResults.leftTurn ? '🟢' : '⚪'}</small></span>
                <span className="checklist-text">Left Turn</span>
              </div>
              <div className={`checklist-item ${detectionResults.rightTurn ? 'completed' : ''}`}>
                <span className="checklist-icon"><small>{detectionResults.rightTurn ? '🟢' : '⚪'}</small></span>
                <span className="checklist-text">Right Turn</span>
              </div>
              <div className={`checklist-item ${detectionResults.smile ? 'completed' : ''}`}>
                <span className="checklist-icon"><small>{detectionResults.smile ? '🟢' : '⚪'}</small></span>
                <span className="checklist-text">Smile</span>
              </div>
              <div className={`checklist-item ${detectionResults.blink ? 'completed' : ''}`}>
                <span className="checklist-icon"><small>{detectionResults.blink ? '🟢' : '⚪'}</small></span>
                <span className="checklist-text">Blink</span>
              </div>
              <div className="checklist-item score-item">
                <span className="checklist-icon">🔵</span>
                <span className="checklist-text">Completed</span>
              </div>
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
          ) : currentStep === 'initial' && !detectionResults.faceDetected ? (
            <button 
              className="btn-primary"
              onClick={() => {
                // Start the detection process by triggering face detection
                setVerificationStatus('Detecting face...');
                setInstructions('Please position your face in the frame');
                // Manually trigger face detection to start the process
                if (isModelLoaded && videoRef.current) {
                  detectFace();
                }
              }}
              disabled={processing || !isModelLoaded}
            >
              {processing ? 'Processing...' : !isModelLoaded ? 'Loading Models...' : 'Start Detection'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FacialKYC;