import { useState, useEffect } from 'react';
import { Button, Typography, Space, Checkbox, Divider } from 'antd';
import { BottomActionSheet } from '../BottomActionSheet';
import './styles.scss';
import { useLocalStorage } from '../../utils/use-local-storage';

const { Title, Text, Paragraph } = Typography;

interface CookieConsentData {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  consentTimestamp: number;
}

export function GDPRCookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [cookieConsent, setCookieConsent] = useLocalStorage<CookieConsentData>('gdprConsent');

  // Check if consent has been given
  useEffect(() => {
    if (!cookieConsent) {
      // Show consent banner after a short delay to allow page to load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cookieConsent]);

  const handleAcceptAll = () => {
    const consent: CookieConsentData = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      consentTimestamp: Date.now()
    };
    setCookieConsent(consent);
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    setCookieConsent(cookieConsent || {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      consentTimestamp: Date.now()
    });
    setIsVisible(false);
    setIsDetailsOpen(false);
  };

  const handleRejectAll = () => {
    const consent: CookieConsentData = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      consentTimestamp: Date.now()
    };
    setCookieConsent(consent);
    setIsVisible(false);
  };

  const handleCookieChange = (type: keyof Omit<CookieConsentData, 'necessary'>, checked: boolean) => {
    setCookieConsent(prev => ({
      necessary: true,
      analytics: type === 'analytics' ? checked : prev?.analytics || false,
      marketing: type === 'marketing' ? checked : prev?.marketing || false,
      preferences: type === 'preferences' ? checked : prev?.preferences || false,
      consentTimestamp: Date.now()
    }));
  };

  return (
    <>
      <BottomActionSheet
        isOpen={isVisible}
        onClose={() => setIsVisible(false)}
        height="45vh"
        zIndex={1400}
      >
        <div className="gdpr-cookie-consent-drawer">
          <div className="gdpr-cookie-consent-header">
            <Title level={3} style={{ margin: 0, color: '#3b82f6', textAlign: 'center' }}>
              🍪 Cookie Consent
            </Title>
          </div>

          <div className="gdpr-cookie-consent-body">
            <div className="gdpr-cookie-consent-text">
              <Paragraph>
                We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                By continuing to use our site, you agree to our use of cookies.
              </Paragraph>
            </div>

            <div className="gdpr-cookie-consent-actions">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  onClick={handleAcceptAll}
                  style={{ 
                    background: '#3b82f6', 
                    borderColor: '#3b82f6',
                    height: '48px'
                  }}
                >
                  Accept All Cookies
                </Button>
                
                <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Button 
                    size="large"
                    onClick={handleRejectAll}
                    style={{ flex: 1 }}
                  >
                    Reject All
                  </Button>
                  <Button 
                    size="large"
                    onClick={() => setIsDetailsOpen(true)}
                    style={{ flex: 1 }}
                  >
                    Customize
                  </Button>
                </Space>
              </Space>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Your consent preferences will be stored securely
            </Text>
          </div>
        </div>
      </BottomActionSheet>

      {/* Detailed Cookie Settings */}
      <BottomActionSheet
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        height="70vh"
        zIndex={1500}
      >
        <div className="gdpr-cookie-settings">
          <div className="gdpr-cookie-settings-header">
            <Title level={3}>Cookie Preferences</Title>
            <Paragraph>
              Manage your cookie preferences below. You can update these settings at any time.
            </Paragraph>
          </div>

          <div className="gdpr-cookie-settings-categories">
            {/* Necessary Cookies */}
            <div className="gdpr-cookie-category">
              <div className="gdpr-cookie-category-header">
                <Checkbox checked={true} disabled />
                <div className="gdpr-cookie-category-info">
                  <Title level={5}>Necessary Cookies</Title>
                  <Text type="secondary">
                    These cookies are essential for the website to function properly. 
                    They enable basic functions like page navigation and access to secure areas.
                  </Text>
                </div>
              </div>
            </div>

            <Divider />

            {/* Analytics Cookies */}
            <div className="gdpr-cookie-category">
              <div className="gdpr-cookie-category-header">
                <Checkbox 
                  checked={cookieConsent?.analytics || false}
                  onChange={(e) => handleCookieChange('analytics', e.target.checked)}
                />
                <div className="gdpr-cookie-category-info">
                  <Title level={5}>Analytics Cookies</Title>
                  <Text type="secondary">
                    These cookies help us understand how visitors interact with our website 
                    by collecting and reporting information anonymously.
                  </Text>
                </div>
              </div>
            </div>

            <Divider />

            {/* Marketing Cookies */}
            <div className="gdpr-cookie-category">
              <div className="gdpr-cookie-category-header">
                <Checkbox 
                  checked={cookieConsent?.marketing || false}
                  onChange={(e) => handleCookieChange('marketing', e.target.checked)}
                />
                <div className="gdpr-cookie-category-info">
                  <Title level={5}>Marketing Cookies</Title>
                  <Text type="secondary">
                    These cookies are used to track visitors across websites to display 
                    relevant advertisements and marketing campaigns.
                  </Text>
                </div>
              </div>
            </div>

            <Divider />

            {/* Preference Cookies */}
            <div className="gdpr-cookie-category">
              <div className="gdpr-cookie-category-header">
                <Checkbox 
                  checked={cookieConsent?.preferences || false}
                  onChange={(e) => handleCookieChange('preferences', e.target.checked)}
                />
                <div className="gdpr-cookie-category-info">
                  <Title level={5}>Preference Cookies</Title>
                  <Text type="secondary">
                    These cookies allow the website to remember choices you make and provide 
                    enhanced, more personal features.
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div className="gdpr-cookie-settings-actions">
            <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={handleRejectAll}>
                Reject All
              </Button>
              <Space>
                <Button onClick={() => setIsDetailsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleAcceptSelected}
                  style={{ background: '#3b82f6', borderColor: '#3b82f6' }}
                >
                  Confirm Selection
                </Button>
              </Space>
            </Space>
          </div>
        </div>
      </BottomActionSheet>
    </>
  );
}
