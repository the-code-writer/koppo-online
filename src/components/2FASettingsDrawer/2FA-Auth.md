# Two-Factor Authentication (2FA) - Authenticator App

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Integration](#api-integration)
4. [Component Implementation](#component-implementation)
5. [User Interface](#user-interface)
6. [Data Flow](#data-flow)
7. [Security Considerations](#security-considerations)
8. [Usage Guide](#usage-guide)
9. [Developer Guide](#developer-guide)
10. [Troubleshooting](#troubleshooting)
11. [Testing](#testing)

---

## Overview

The Authenticator App 2FA feature allows users to secure their accounts using Time-based One-Time Password (TOTP) authentication. This implementation integrates with popular authenticator apps like Google Authenticator, Microsoft Authenticator, Authy, and others that support the TOTP standard (RFC 6238).

### Key Features
- **Backend-generated secrets** - Server creates cryptographically secure secrets
- **QR code display** - Visual QR code for easy app linking
- **Manual secret entry** - Fallback for users who can't scan QR codes
- **Real-time countdown** - 30-second TOTP refresh timer with visual progress
- **Backend verification** - Server-side OTP validation
- **Auto-focus inputs** - Seamless 6-digit code entry
- **Shake animation** - Visual feedback for invalid codes
- **Loading states** - Clear feedback during API operations

### Supported Authenticator Apps
- Google Authenticator (iOS, Android)
- Microsoft Authenticator (iOS, Android)
- Authy (iOS, Android, Desktop)
- 1Password
- LastPass Authenticator
- Any RFC 6238 compliant TOTP app

---

## Architecture

### File Structure
```
src/
├── components/
│   └── 2FASettingsDrawer/
│       ├── index.tsx                    # Main component
│       ├── styles.scss                  # Component styles
│       ├── 2FA-Auth.md                 # This documentation
│       ├── 2FA-BackupCodes.md          # Backup codes documentation
│       └── 2FA-DisableMethod.md        # Disable method documentation
└── services/
    └── apiAuth2FAService.ts            # API service for 2FA operations
```

### Technology Stack
- **React** (Functional Components with Hooks)
- **TypeScript** (Type-safe implementation)
- **Ant Design** (UI components)
- **TOTP Standard** (RFC 6238)
- **Base64 Images** (QR code display)

---

## API Integration

### Service: `apiAuth2FAService`

Located at: `src/services/apiAuth2FAService.ts`

#### TypeScript Interfaces

```typescript
export interface GenerateAuthenticatorSecretResponse {
  message: string;
  secret: string;
  qrCode: string;
  otpAuthUrl: string;
}

export interface VerifyAuthenticatorOTPResponse {
  message: string;
  verified: boolean;
}

export interface SetAuthenticatorDefaultResponse {
  message: string;
}
```

---

## API Endpoints

### 1. Generate Authenticator Secret

**Endpoint:** `POST /auth/2fa/authenticator/generate-secret`

**Request:**
```http
POST /auth/2fa/authenticator/generate-secret
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "Authenticator secret generated successfully",
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "otpAuthUrl": "otpauth://totp/KoppoApp:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=KoppoApp"
}
```

### 2. Verify Authenticator OTP

**Endpoint:** `POST /auth/2fa/authenticator/verify-otp`

**Request:**
```http
POST /auth/2fa/authenticator/verify-otp
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Authenticator OTP verified successfully",
  "verified": true
}
```

### 3. Set Authenticator as Default

**Endpoint:** `POST /auth/2fa/authenticator/set-as-default`

**Request:**
```http
POST /auth/2fa/authenticator/set-as-default
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "Authenticator set as default 2FA method successfully"
}
```

---

## Component Implementation

### State Management

```typescript
const [authenticatorSecret, setAuthenticatorSecret] = useState('');
const [authenticatorQRCode, setAuthenticatorQRCode] = useState('');
const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState<'setup' | 'verify'>('setup');
const [authenticatorLoading, setAuthenticatorLoading] = useState(false);
const [authenticatorCode, setAuthenticatorCode] = useState(['', '', '', '', '', '']);
const [totpTimeRemaining, setTotpTimeRemaining] = useState(30);
```

### Setup Handler

```typescript
const handleSetupAuthenticator = async () => {
  setAuthenticatorLoading(true);
  try {
    const response = await apiAuth2FAService.generateAuthenticatorSecret();
    setAuthenticatorSecret(response.secret);
    setAuthenticatorQRCode(response.qrCode);
    setAuthenticatorSetupStep('verify');
    setTwoFactorMethod('authenticator');
  } catch (error) {
    console.error('Failed to setup authenticator:', error);
    alert('Failed to setup authenticator. Please try again.');
  } finally {
    setAuthenticatorLoading(false);
  }
};
```

### Verification Handler

```typescript
const handleVerifyAuthenticator = async () => {
  const enteredCode = authenticatorCode.join('');
  if (!enteredCode || enteredCode.length !== 6) return;

  setAuthenticatorLoading(true);
  try {
    const response = await apiAuth2FAService.verifyAuthenticatorOTP(enteredCode);
    if (response.verified) {
      await apiAuth2FAService.setAuthenticatorAsDefault();
      setTwoFactorEnabled(true);
      // Clear state and show success
    } else {
      // Show error and shake animation
    }
  } catch (error) {
    console.error('Verification error:', error);
  } finally {
    setAuthenticatorLoading(false);
  }
};
```

---

## User Interface

### QR Code Display

```tsx
<img 
  src={authenticatorQRCode} 
  alt="Authenticator QR Code" 
  style={{ 
    width: 200, 
    height: 200, 
    border: '2px solid #e0e0e0', 
    borderRadius: 8,
    padding: 8,
    background: 'white'
  }} 
/>
```

### TOTP Timer

```tsx
<Text>Code refreshes in: {totpTimeRemaining}s</Text>
<div style={{ 
  width: `${(totpTimeRemaining / 30) * 100}%`, 
  background: totpTimeRemaining <= 5 ? '#ff4d4f' : '#52c41a'
}} />
```

---

## Data Flow

### Setup Flow
1. User clicks "Setup Authenticator"
2. Backend generates secret and QR code
3. Frontend displays QR code
4. User scans with authenticator app
5. User enters 6-digit code
6. Backend verifies code
7. Set as default 2FA method

### Verification Flow
1. User enters 6 digits
2. Auto-verify when complete
3. Backend validates OTP
4. If valid: Enable 2FA
5. If invalid: Show error

---

## Security Considerations

- Backend-generated secrets (cryptographically secure)
- Server-side OTP verification
- Time-based validation (30-second windows)
- Clock drift tolerance (±30 seconds)
- No client-side TOTP generation
- Secrets cleared after verification

---

## Usage Guide

### For End Users

1. Click "Setup Authenticator"
2. Scan QR code with authenticator app
3. Enter 6-digit code from app
4. Success! Authenticator is enabled

### For Developers

See implementation examples in Component Implementation section.

---

## Troubleshooting

**Invalid Code:**
- Check device time synchronization
- Wait for next code (30 seconds)
- Re-scan QR code

**QR Code Not Displaying:**
- Check API response
- Verify network connection
- Check console for errors

---

## Testing

Manual testing checklist and automated test examples available in full documentation.

---

**Last Updated:** February 5, 2026  
**Document Version:** 1.0.0
