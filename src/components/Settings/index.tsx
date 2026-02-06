import { useState } from "react";
import { useOAuth } from "../../contexts/OAuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { BottomActionSheet } from "../BottomActionSheet";
import { ProfileSettingsDrawer } from "../ProfileSettingsDrawer";
import { PasswordSettingsDrawer } from "../PasswordSettingsDrawer";
import { LinkedAccountsSettingsDrawer } from "../LinkedAccountsSettingsDrawer";
import { KYCSettingsDrawer } from "../KYCSettingsDrawer";
import {TwoFASettingsDrawer} from "../2FASettingsDrawer";
import {TokenSettingsDrawer} from "../TokenSettingsDrawer";
import {CashierSettingsDrawer } from "../CashierSettingsDrawer";

import {
  LegacyOpenLink2pxIcon,
  StandaloneSunBrightBoldIcon,
  StandaloneMoonBoldIcon,
  StandaloneLanguageBoldIcon,
  StandaloneLifeRingBoldIcon,
  StandaloneRightFromBracketBoldIcon,
  StandaloneGearBoldIcon,
} from "@deriv/quill-icons";
import "./styles.scss";
import { DollarOutlined, HomeOutlined, LockOutlined, QrcodeOutlined, SafetyOutlined, TeamOutlined, VerifiedOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import { useEventPublisher } from '../../hooks/useEventManager';

// Setting types
type SettingType = "theme" | "language" | "help" | "profile" | "passwords" | "accounts" | "kyc" | "2fa" | "tokens" | "cashier" | null;

// Language options with icons
const languages = [
  { label: "English", value: "en", icon: "🇺🇸" },
  { label: "中文", value: "zh", icon: "🇨🇳" },
  { label: "Español", value: "es", icon: "🇪🇸" },
  { label: "Français", value: "fr", icon: "🇫🇷" },
];

// Theme Selector Component
const ThemeSelector = ({
  currentTheme,
  onThemeSelect,
}: {
  currentTheme: string;
  onThemeSelect: (theme: "light" | "dark" | "system") => void;
}) => {
  const themeOptions = [
    { 
      label: "Light", 
      value: "light", 
      icon: "☀️",
      description: "Clean and bright interface"
    },
    { 
      label: "Dark", 
      value: "dark", 
      icon: "🌙",
      description: "Easy on the eyes in low light"
    },
    { 
      label: "System", 
      value: "system", 
      icon: "💻",
      description: "Follows your device settings"
    },
  ];

  return (
    <div className="modern-action-sheet-list">
      <div className="modern-action-sheet-header">
        <h3>Theme</h3>
      </div>
      <div className="modern-action-sheet-list">
        {themeOptions.map((option) => (
          <div
            key={option.value}
            className={`modern-action-sheet-item ${
              currentTheme === option.value ? "modern-action-sheet-item--active" : ""
            }`}
            onClick={() => {
              if (currentTheme !== option.value) {
                onThemeSelect(option.value as "light" | "dark" | "system");
              }
            }}
          >
            <div className="modern-action-sheet-icon">
              {option.icon}
            </div>
            <div className="modern-action-sheet-content">
              <div>
                <div className="modern-action-sheet-label">{option.label}</div>
                <div className="modern-action-sheet-description">{option.description}</div>
              </div>
              {currentTheme === option.value && (
                <div className="modern-action-sheet-badge">Active</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Language Selector Component
const LanguageSelector = ({
  currentLanguage,
  onLanguageChange,
  languages,
}: {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
  languages: Array<{ label: string; value: string; icon: string }>;
}) => {
  return (
    <div className="modern-action-sheet-list">
      <div className="modern-action-sheet-header">
        <h3>Language</h3>
      </div>
      <div className="modern-action-sheet-list">
        {languages.map((lang) => (
          <div
            key={lang.value}
            className={`modern-action-sheet-item ${
              currentLanguage === lang.value ? "modern-action-sheet-item--active" : ""
            }`}
            onClick={() => onLanguageChange(lang.value)}
          >
            <div className="modern-action-sheet-icon">
              {lang.icon}
            </div>
            <div className="modern-action-sheet-content">
              <div>
                <div className="modern-action-sheet-label">{lang.label}</div>
                <div className="modern-action-sheet-description">
                  {lang.value === 'en' && 'English'}
                  {lang.value === 'zh' && '中文'}
                  {lang.value === 'es' && 'Español'}
                  {lang.value === 'fr' && 'Français'}
                </div>
              </div>
              {currentLanguage === lang.value && (
                <div className="modern-action-sheet-badge">Current</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Help Center Component
const HelpCenter = () => {
  const helpOptions = [
    { 
      label: "FAQ", 
      value: "faq", 
      url: "https://champion.trade/faq",
      icon: "❓",
      description: "Frequently asked questions"
    },
    {
      label: "WhatsApp",
      value: "whatsapp",
      url: "https://wa.me/message/KPQFKKQZXEYPM1",
      icon: "💬",
      description: "Chat with our support team"
    },
    {
      label: "Live chat",
      value: "livechat",
      url: "https://champion.trade/livechat",
      icon: "💭",
      description: "Get instant help online"
    },
  ];

  const handleHelpOptionClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="modern-action-sheet-list">
      <div className="modern-action-sheet-header">
        <h3>Help Centre</h3>
      </div>
      <div className="modern-action-sheet-list">
        {helpOptions.map((option) => (
          <div
            key={option.value}
            className="modern-action-sheet-item"
            onClick={() => handleHelpOptionClick(option.url)}
          >
            <div className="modern-action-sheet-icon">
              {option.icon}
            </div>
            <div className="modern-action-sheet-content">
              <div>
                <div className="modern-action-sheet-label">{option.label}</div>
                <div className="modern-action-sheet-description">{option.description}</div>
              </div>
              <div className="modern-action-sheet-right">
                <div className="modern-action-sheet-badge">External</div>
                <LegacyOpenLink2pxIcon
                  className="modern-action-sheet-arrow"
                  iconSize="xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function Settings() {
  const { user } = useOAuth();
  const { theme, setTheme } = useTheme();
  const { publish } = useEventPublisher();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<SettingType>(null);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [profileDrawerVisible, setProfileDrawerVisible] = useState(false);
  const [passwordDrawerVisible, setPasswordDrawerVisible] = useState(false);
  const [accountsDrawerVisible, setAccountsDrawerVisible] = useState(false);
  const [kycDrawerVisible, setKycDrawerVisible] = useState(false);
  const [twoFADrawerVisible, setTwoFADrawerVisible] = useState(false);
  const [tokensDrawerVisible, setTokensDrawerVisible] = useState(false);
  const [cashierDrawerVisible, setCashierDrawerVisible] = useState(false);

  const handleLogout = () => {
    publish('LOGOUT', {});
  }

  const handleGoHome = () => {
    window.open("https://champion.trade/", "_blank");
  };

  // Open action sheet for a specific setting
  const openActionSheet = (setting: SettingType) => {
    console.log(setting)
    switch (setting) {
      case "profile":
        setProfileDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "passwords":
        setPasswordDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "accounts":
        setAccountsDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "kyc":
        setKycDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "2fa":
        setTwoFADrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "tokens":
        setTokensDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      case "cashier":
        setCashierDrawerVisible(true);
        setIsActionSheetOpen(false);
        break;
      default:
        setCurrentSetting(setting);
        setIsActionSheetOpen(true);
        break;
    }
  };

  // Close action sheet
  const closeActionSheet = () => {
    setIsActionSheetOpen(false);
  };

  // Handle language change
  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    // Here you would implement actual language change logic
    closeActionSheet();
  };

  // Handle theme change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    closeActionSheet();
  };

  // Render content based on selected setting
  const renderActionSheetContent = () => {
    switch (currentSetting) {
      case "theme":
        return (
          <ThemeSelector
            currentTheme={theme}
            onThemeSelect={handleThemeChange}
          />
        );
      case "language":
        return (
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            languages={languages}
          />
        );
      case "help":
        return <HelpCenter />;
      case "profile":
        // Open profile drawer instead of showing action sheet content
        setProfileDrawerVisible(true);
        closeActionSheet();
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="settings">
      <div className="settings__container">
        <div className="settings__menu">

          {/* Profile Settings */}
          <div
            className="settings__profile-card"
            onClick={() => openActionSheet("profile")}
          >
            <div className="settings__profile-card-content">
              <div className="settings__profile-avatar-wrapper">
                <Avatar 
                  size={64} 
                  src={user?.photoURL || undefined}
                  className="settings__profile-avatar"
                  style={{ marginLeft: 8}}
                >
                  {user?.displayName?.[0]}
                </Avatar>
                <div className="settings__profile-avatar-badge">
                  <VerifiedOutlined />
                </div>
              </div>
              <div className="settings__profile-info">
                <h2 className="settings__profile-name">{user?.displayName}</h2>
                <div className="settings__profile-id">
                  <span className="label">ID:</span>
                  <code className="value">{user?.uuid?.split('-')[0].toLocaleUpperCase()}</code>
                </div>
                {user?.email && <span className="settings__profile-email">{user.email}</span>}
              </div>
            </div>
            <div className="settings__profile-card-glow" />
          </div>

          <div className="settings__sections">
            {/* Account Section */}
            <div className="settings__section">
              <h3 className="settings__section-title">Account</h3>
              <div className="settings__section-content">
                <div className="settings__menu-item" onClick={handleGoHome}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      <HomeOutlined className="settings__menu-icon" />
                    </div>
                    <span className="settings__menu-label">Go to Home</span>
                  </div>
                  <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                </div>

                <div className="settings__menu-item" onClick={() => openActionSheet("passwords")}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      <LockOutlined className="settings__menu-icon" />
                    </div>
                    <span className="settings__menu-label">My Passwords</span>
                  </div>
                  <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                </div>

                <div className="settings__menu-item" onClick={() => openActionSheet("accounts")}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      <TeamOutlined className="settings__menu-icon" />
                    </div>
                    <span className="settings__menu-label">Linked Accounts</span>
                  </div>
                  <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="settings__section">
              <h3 className="settings__section-title">Security & Verification</h3>
              <div className="settings__section-content">
                <div className="settings__menu-item" onClick={() => openActionSheet("kyc")}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      <VerifiedOutlined className="settings__menu-icon" />
                    </div>
                    <span className="settings__menu-label">Account Verification</span>
                  </div>
                  <div className="settings__menu-item-right">
                    <span className="settings__status-badge settings__status-badge--pending">Pending</span>
                    <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                  </div>
                </div>

                <div className="settings__menu-item" onClick={() => openActionSheet("2fa")}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      <QrcodeOutlined className="settings__menu-icon" />
                    </div>
                    <span className="settings__menu-label">Two-Factor Auth (2FA)</span>
                  </div>
                  <div className="settings__menu-item-right">
                    <span className={`settings__status-badge ${
                      user?.twoFactorAuth?.sms?.enabled || 
                      user?.twoFactorAuth?.whatsapp?.enabled || 
                      user?.twoFactorAuth?.email?.enabled || 
                      user?.twoFactorAuth?.authenticator?.enabled
                        ? 'settings__status-badge--enabled' 
                        : 'settings__status-badge--disabled'
                    }`}>
                      {user?.twoFactorAuth?.sms?.enabled || 
                       user?.twoFactorAuth?.whatsapp?.enabled || 
                       user?.twoFactorAuth?.email?.enabled || 
                       user?.twoFactorAuth?.authenticator?.enabled
                        ? 'Enabled' 
                        : 'Disabled'}
                    </span>
                    <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                  </div>
                </div>

                <div className="settings__menu-item" onClick={() => openActionSheet("tokens")}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      <SafetyOutlined className="settings__menu-icon" />
                    </div>
                    <span className="settings__menu-label">Sessions & Tokens</span>
                  </div>
                  <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                </div>
              </div>
            </div>

            {/* Payments Section */}
            <div className="settings__section">
              <h3 className="settings__section-title">Payments</h3>
              <div className="settings__section-content">
                <div className="settings__menu-item" onClick={() => openActionSheet("cashier")}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      <DollarOutlined className="settings__menu-icon" />
                    </div>
                    <span className="settings__menu-label">Deposits & Withdrawals</span>
                  </div>
                  <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="settings__section">
              <h3 className="settings__section-title">Preferences</h3>
              <div className="settings__section-content">
                <div className="settings__menu-item" onClick={() => openActionSheet("theme")}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      {theme === "dark" ? (
                        <StandaloneMoonBoldIcon className="settings__menu-icon" />
                      ) : theme === "light" ? (
                        <StandaloneSunBrightBoldIcon className="settings__menu-icon" />
                      ) : (
                        <StandaloneGearBoldIcon className="settings__menu-icon" />
                      )}
                    </div>
                    <span className="settings__menu-label">Theme</span>
                  </div>
                  <div className="settings__menu-item-right">
                    <span className="settings__menu-value">{theme?.charAt(0).toUpperCase() + theme?.slice(1)}</span>
                    <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                  </div>
                </div>

                <div className="settings__menu-item" onClick={() => openActionSheet("language")}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      <StandaloneLanguageBoldIcon className="settings__menu-icon" />
                    </div>
                    <span className="settings__menu-label">Language</span>
                  </div>
                  <div className="settings__menu-item-right">
                    <span className="settings__menu-value">{languages.find(l => l.value === currentLanguage)?.label}</span>
                    <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Support Section */}
            <div className="settings__section">
              <h3 className="settings__section-title">Support</h3>
              <div className="settings__section-content">
                <div className="settings__menu-item" onClick={() => openActionSheet("help")}>
                  <div className="settings__menu-item-left">
                    <div className="settings__menu-icon-wrapper">
                      <StandaloneLifeRingBoldIcon className="settings__menu-icon" />
                    </div>
                    <span className="settings__menu-label">Help Center</span>
                  </div>
                  <LegacyOpenLink2pxIcon className="settings__menu-arrow" iconSize="xs" />
                </div>

                {user && (
                  <div className="settings__menu-item settings__menu-item--logout" onClick={handleLogout}>
                    <div className="settings__menu-item-left">
                      <div className="settings__menu-icon-wrapper">
                        <StandaloneRightFromBracketBoldIcon className="settings__menu-icon" />
                      </div>
                      <span className="settings__menu-label">Log out</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Sheet */}
      <BottomActionSheet
        isOpen={isActionSheetOpen}
        onClose={closeActionSheet}
        height="auto"
      >
        {renderActionSheetContent()}
      </BottomActionSheet>

      {/* Profile Settings Drawer */}
      <ProfileSettingsDrawer
        visible={profileDrawerVisible}
        onClose={() => setProfileDrawerVisible(false)}
        user={user}
      />

      {/* Password Settings Drawer */}
      <PasswordSettingsDrawer
        visible={passwordDrawerVisible}
        onClose={() => setPasswordDrawerVisible(false)}
        user={user}
      />

      {/* Linked Accounts Settings Drawer */}
      <LinkedAccountsSettingsDrawer
        visible={accountsDrawerVisible}
        onClose={() => setAccountsDrawerVisible(false)}
        user={user}
      />

      {/* KYC Settings Drawer */}
      <KYCSettingsDrawer
        visible={kycDrawerVisible}
        onClose={() => setKycDrawerVisible(false)}
        user={user}
      />

      {/* 2FA Settings Drawer */}
      <TwoFASettingsDrawer
        visible={twoFADrawerVisible}
        onClose={() => setTwoFADrawerVisible(false)}
        user={user}
      />

      {/* Tokens Settings Drawer */}
      <TokenSettingsDrawer
        visible={tokensDrawerVisible}
        onClose={() => setTokensDrawerVisible(false)}
        user={user}
      />
      {/* Cashier Settings Drawer */}
      <CashierSettingsDrawer
        visible={cashierDrawerVisible}
        onClose={() => setCashierDrawerVisible(false)}
      />


    </div>
  );
}
