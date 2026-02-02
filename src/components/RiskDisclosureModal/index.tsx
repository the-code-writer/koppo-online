import React, { useState, useEffect } from 'react';
import { Button, Typography, Space, Checkbox } from 'antd';
import { BottomActionSheet } from '../BottomActionSheet';
import './styles.scss';
import { useLocalStorage } from '../../utils/use-local-storage';

const { Title, Text } = Typography;

interface RiskDisclosureData {
  hasConsented: boolean;
  consentTimestamp: number;
}

interface GDPRConsentData {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  consentTimestamp: number;
}

export function RiskDisclosureModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [riskConsent, setRiskConsent] = useLocalStorage<RiskDisclosureData>('riskDisclosureConsent');

  // Check GDPR consent status
  const [gdprConsent] = useLocalStorage<GDPRConsentData>('gdprConsent');

  // Check if consent has been given and show modal after GDPR is dismissed
  useEffect(() => {
    // Temporary: Force show modal for testing (remove this line in production)
    const forceShow = true;
    
    // Check if GDPR consent exists (meaning GDPR modal was shown and dismissed)
    if ((gdprConsent || forceShow) && !riskConsent?.hasConsented) {
      // Show risk disclosure after a short delay to ensure GDPR modal is fully dismissed
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000); // Increased delay for testing
      return () => clearTimeout(timer);
    }
  }, [gdprConsent, riskConsent]);

  const handleAccept = () => {
    const consent: RiskDisclosureData = {
      hasConsented: true,
      consentTimestamp: Date.now()
    };
    setRiskConsent(consent);
    setIsVisible(false);
  };

  const handleDecline = () => {
    // User can decline but we'll show the modal again on next visit
    setIsVisible(false);
  };

  return (
    <BottomActionSheet
      isOpen={isVisible}
      onClose={handleDecline}
      height="80vh"
      zIndex={1500}
    >
      <div className="risk-disclosure-content">
        <div className="risk-disclosure-header">
          <Title level={3} style={{ padding: 16, color: '#aa58e3', textAlign: 'center' }}>
            ⚠️ Trading Risk Disclosure
          </Title>
        </div>

        <div className="risk-disclosure-body">
          <div className="risk-disclosure-text">
            <div className="risk-disclosure-content">
              <p>
                Deriv offers complex derivatives, such as options and contracts for difference ("CFDs"). These products may not be suitable for all clients, and trading them puts you at risk. Please make sure that you understand the following risks before trading Deriv products:
              </p>
              
              <div className="risk-points">
                <div className="risk-point">
                  <span className="risk-bullet">a)</span>
                  <span className="risk-text">You may lose some or all of the money you invest in the trade</span>
                </div>
                
                <div className="risk-point">
                  <span className="risk-bullet">b)</span>
                  <span className="risk-text">If your trade involves currency conversion, exchange rates will affect your profit and loss</span>
                </div>
              </div>
              
              <p className="final-warning">
                You should never trade with borrowed money or with money that you cannot afford to lose.
              </p>
            </div>
          </div>

          <div className="risk-disclosure-checkbox">
            <Checkbox
              checked={hasAccepted}
              onChange={(e) => setHasAccepted(e.target.checked)}
              style={{ marginBottom: 12 }}
            >
              <Text strong>
                I have read, understood, and agree to trading risks disclosed above
              </Text>
            </Checkbox>
          </div>
        </div>

        <div className="risk-disclosure-actions">
          <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button 
              onClick={handleDecline}
              size="large"
            >
              Decline
            </Button>
            <Button
              type="primary"
              onClick={handleAccept}
              disabled={!hasAccepted}
              size="large"
              style={{ 
                background: '#aa58e3', 
                borderColor: '#aa58e3',
                minWidth: '120px'
              }}
            >
              I Accept
            </Button>
          </Space>
        </div>

        <div style={{ textAlign: 'center', paddingTop: 12 }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Your consent will be stored securely for future reference
          </Text>
        </div>
      </div>
    </BottomActionSheet>
  );
}
