import React, { useState, useEffect } from 'react';
import { Button, Typography, Space, Checkbox } from 'antd';
import { BottomActionSheet } from '../BottomActionSheet';
import { useSecureCookies } from '../../utils/use-cookies/useCookies';
import './styles.scss';

const { Title, Text, Paragraph } = Typography;

interface RiskDisclosureData {
  hasConsented: boolean;
  consentTimestamp: number;
}

interface GDPRConsentData {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export function RiskDisclosureModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [riskConsent, setRiskConsent] = useSecureCookies<RiskDisclosureData>('riskDisclosureConsent', 'risk-disclosure-secret', {
    expireAfter: 365 * 24 * 60 * 60 * 1000, // 1 year
    sameSite: 'strict'
  });

  // Check GDPR consent status
  const [gdprConsent] = useSecureCookies<GDPRConsentData>('gdprConsent', 'gdpr-consent-secret', {
    expireAfter: 365 * 24 * 60 * 60 * 1000,
    sameSite: 'strict'
  });

  // Check if consent has been given and show modal after GDPR is dismissed
  useEffect(() => {
    console.log('RiskDisclosureModal - gdprConsent:', gdprConsent);
    console.log('RiskDisclosureModal - riskConsent:', riskConsent);
    
    // Temporary: Force show modal for testing (remove this line in production)
    const forceShow = true;
    
    // Check if GDPR consent exists (meaning GDPR modal was shown and dismissed)
    if ((gdprConsent || forceShow) && !riskConsent?.hasConsented) {
      console.log('RiskDisclosureModal - Showing modal');
      // Show risk disclosure after a short delay to ensure GDPR modal is fully dismissed
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000); // Increased delay for testing
      return () => clearTimeout(timer);
    } else {
      console.log('RiskDisclosureModal - Not showing modal. GDPR consent:', !!gdprConsent, 'Risk consent:', riskConsent?.hasConsented);
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

  const riskDisclosureText = `Deriv offers complex derivatives, such as options and contracts for difference ("CFDs"). These products may not be suitable for all clients, and trading them puts you at risk. Please make sure that you understand the following risks before trading Deriv products: 
a) you may lose some or all of the money you invest in the trade, 
b) if your trade involves currency conversion, exchange rates will affect your profit and loss. 
You should never trade with borrowed money or with money that you cannot afford to lose.`;

  return (
    <BottomActionSheet
      isOpen={isVisible}
      onClose={handleDecline}
      height="70vh"
      zIndex={1500}
    >
      <div className="risk-disclosure-content">
        <div className="risk-disclosure-header">
          <Title level={3} style={{ margin: 0, color: '#aa58e3', textAlign: 'center' }}>
            ⚠️ Trading Risk Disclosure
          </Title>
        </div>

        <div className="risk-disclosure-body">
          <div className="risk-disclosure-text">
            <Paragraph>
              {riskDisclosureText}
            </Paragraph>
          </div>

          <div className="risk-disclosure-checkbox">
            <Checkbox
              checked={hasAccepted}
              onChange={(e) => setHasAccepted(e.target.checked)}
              style={{ marginBottom: '20px' }}
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

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Your consent will be stored securely for future reference
          </Text>
        </div>
      </div>
    </BottomActionSheet>
  );
}
