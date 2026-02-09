import * as faceapi from 'face-api.js';
// File: src/utils/faceDetectionUtils.js
// Utility functions for face detection

export const loadFaceAPIModels = async () => {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      faceapi.nets.ageGenderNet.loadFromUri('/models')
    ]);
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    return false;
  }
};

export const detectFaceAttributes = async (videoElement:any) => {
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5
  });

  const detection = await faceapi.detectSingleFace(videoElement, options)
    .withFaceLandmarks()
    .withFaceExpressions()
    .withAgeAndGender();

  return detection;
};

export const validateHeadRotation = (landmarks:any) => {
  const nose = landmarks.getNose();
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  // Calculate relative positions
  const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
  const noseX = nose[3].x;
  
  const offset = noseX - eyeCenterX;
  
  return {
    isLeft: offset < -15,
    isRight: offset > 15,
    isCenter: Math.abs(offset) <= 15,
    offset: offset
  };
};