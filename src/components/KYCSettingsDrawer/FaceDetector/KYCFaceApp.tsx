import React, { useState } from 'react';
import FacialKYC from './FacialKYC';
import { Button } from 'antd';

export const KYCFaceApp = () => {
  const [showFacialKYC, setShowFacialKYC] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerificationComplete = (result: any) => {
    setVerificationResult(result);
    setShowFacialKYC(true);
    // Send result to your backend API
    console.warn("KYC COMPLETE", result)
  };

  return (
    <div className="action-buttons">
      <Button type="primary" onClick={() => setShowFacialKYC(true)}>
        Start Face Detection
      </Button>
      
      {showFacialKYC && (
        <FacialKYC
          onVerificationComplete={handleVerificationComplete}
          onClose={() => setShowFacialKYC(false)}
        />
      )}
      
    </div>
  );
}