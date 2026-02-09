import React, { useState } from 'react';
import FacialKYC from './FacialKYC';

export const KYCFaceApp = () => {
  const [showFacialKYC, setShowFacialKYC] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerificationComplete = (result) => {
    setVerificationResult(result);
    setShowFacialKYC(false);
    // Send result to your backend API
  };

  return (
    <div>
      <button onClick={() => setShowFacialKYC(true)}>
        Start Facial Verification
      </button>
      
      {showFacialKYC && (
        <FacialKYC
          onVerificationComplete={handleVerificationComplete}
          onClose={() => setShowFacialKYC(false)}
        />
      )}
      
      {verificationResult && (
        <div>
          <h3>Verification Result:</h3>
          <pre>{JSON.stringify(verificationResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}