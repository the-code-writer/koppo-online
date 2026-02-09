// File: src/hooks/useFaceDetection.js
// Custom hook for face detection logic

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export const useFaceDetection = (videoRef: any, isActive: boolean) => {
  const [faceData, setFaceData] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const detectionInterval = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };

    loadModels();

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!modelsLoaded || !isActive || !videoRef.current) return;

    const detectFace = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detection) {
          setFaceData({
            detection,
            expressions: detection.expressions,
            landmarks: detection.landmarks
          });
        } else {
          setFaceData(null);
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
    };

    detectionInterval.current = setInterval(detectFace, 100); // Detect 10 times per second

    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [modelsLoaded, isActive, videoRef]);

  return { faceData, modelsLoaded };
};