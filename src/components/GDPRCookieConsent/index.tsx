import React, { useState, useEffect } from 'react';
import { Button, Typography, Space, Checkbox, Divider } from 'antd';
import { BottomActionSheet } from '../BottomActionSheet';
import { useSecureCookies } from '../../utils/use-cookies/useCookies';
import './styles.scss';

const { Title, Text, Paragraph } = Typography;

interface CookieConsentData {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export function GDPRCookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [cookieConsent, setCookieConsent] = useSecureCookies<CookieConsentData>('gdprConsent', 'gdpr-consent-secret', {
    expireAfter: 365 * 24 * 60 * 60 * 1000, // 1 year
    secure: true,
    sameSite: 'strict'
  });

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
      preferences: true
    };
    setCookieConsent(consent);
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    setCookieConsent(cookieConsent || {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
    setIsVisible(false);
    setIsDetailsOpen(false);
  };

  const handleRejectAll = () => {
    const consent: CookieConsentData = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    setCookieConsent(consent);
    setIsVisible(false);
  };

  const handleCookieChange = (type: keyof Omit<CookieConsentData, 'necessary'>, checked: boolean) => {
    setCookieConsent(prev => ({
      necessary: true,
      analytics: type === 'analytics' ? checked : prev?.analytics || false,
      marketing: type === 'marketing' ? checked : prev?.marketing || false,
      preferences: type === 'preferences' ? checked : prev?.preferences || false
    }));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Main Cookie Banner */}
      <div className="gdpr-cookie-banner">
        <div className="gdpr-cookie-banner-content">
          <div className="gdpr-cookie-banner-text">
            <Title level={4} style={{ margin: 0, color: 'white' }}>
              Cookie Consent
            </Title>
            <Paragraph style={{ margin: '8px 0', color: 'rgba(255, 255, 255, 0.8)' }}>
              We use cookies to enhance your experience, analyze site traffic, and personalize content. 
              By continuing to use our site, you agree to our use of cookies.
            </Paragraph>
          </div>
          <div className="gdpr-cookie-banner-actions">
            <Space size="small">
              <Button 
                size="small" 
                onClick={() => setIsDetailsOpen(true)}
                style={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
              >
                Customize
              </Button>
              <Button 
                size="small" 
                onClick={handleRejectAll}
                style={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
              >
                Reject All
              </Button>
              <Button 
                type="primary" 
                size="small" 
                onClick={handleAcceptAll}
                style={{ background: '#aa58e3', borderColor: '#aa58e3' }}
              >
                Accept All
              </Button>
            </Space>
          </div>
        </div>
      </div>

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
                  style={{ background: '#aa58e3', borderColor: '#aa58e3' }}
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
