# 2FA WhatsApp & SMS Implementation Documentation

## Overview

This document provides comprehensive documentation for the **WhatsApp** and **SMS** Two-Factor Authentication (2FA) implementation in the Koppo App. Both methods follow identical patterns and share the same backend API structure, differing only in the delivery channel (WhatsApp vs SMS).

### Key Features

- **Backend OTP Generation** - Server generates and sends OTP codes
- **Multiple Delivery Channels** - WhatsApp and SMS support
- **Automatic Expiry** - Time-based code expiration (5 minutes default)
- **Resend Functionality** - Users can request new codes
- **Visual Feedback** - Countdown timers, shake animations, loading states
- **Set as Default** - Automatic configuration as primary 2FA method
- **Input Validation** - 6-digit code with auto-focus navigation
- **Error Handling** - Comprehensive error messages and recovery

### Supported Platforms

- **WhatsApp** - OTP delivered via WhatsApp message
- **SMS** - OTP delivered via text message

---

## Architecture

### File Structure

```
src/
├── components/
│   └── 2FASettingsDrawer/
│       ├── index.tsx                    # Main component
│       ├── styles.scss                  # Component styles
│       ├── 2FA-BackupCodes.md          # Backup codes documentation
│       ├── 2FA-Auth.md                 # Authenticator app documentation
│       ├── 2FA-DisableMethod.md        # Disable method documentation
│       └── 2FA-WhatsApp-SMS.md         # This documentation
└── services/
    └── apiAuth2FAService.ts            # API service for 2FA operations
```

### Technology Stack

- **React** (Functional Components with Hooks)
- **TypeScript** (Type-safe implementation)
- **Ant Design** (UI components - Drawer, Input, Button, Typography)
- **Axios** (HTTP client via apiService)

---

## API Integration

### Service: `apiAuth2FAService`

Located at: `src/services/apiAuth2FAService.ts`

#### WhatsApp TypeScript Interfaces

```typescript
export interface SendWhatsAppOTPRequest {
  phoneNumber?: string;
}

export interface SendWhatsAppOTPResponse {
  message: string;
  expiresIn: string;
  phoneNumber: string;
}

export interface VerifyWhatsAppOTPRequest {
  otp: string;
}

export interface VerifyWhatsAppOTPResponse {
  message: string;
  verified: boolean;
}

export interface SetWhatsAppDefaultResponse {
  message: string;
  method: string;
}
```

#### SMS TypeScript Interfaces

```typescript
export interface SendSMSOTPRequest {
  phoneNumber?: string;
}

export interface SendSMSOTPResponse {
  message: string;
  expiresIn: string;
  phoneNumber: string;
}

export interface VerifySMSOTPRequest {
  otp: string;
}

export interface VerifySMSOTPResponse {
  message: string;
  verified: boolean;
}

export interface SetSMSDefaultResponse {
  message: string;
  method: string;
}
```

---

## API Endpoints

### WhatsApp Endpoints

#### 1. Send WhatsApp OTP

**Endpoint:** `POST /auth/2fa/whatsapp/send-otp`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "phoneNumber": "+263772123456"  // Optional, uses user's phone if not provided
}
```

**Response:**
```json
{
  "message": "WhatsApp OTP sent successfully",
  "expiresIn": "5 minutes",
  "phoneNumber": "+263772123456"
}
```

**Implementation:**
```typescript
async sendWhatsAppOTP(phoneNumber?: string): Promise<SendWhatsAppOTPResponse> {
  try {
    const response = await apiService.post<SendWhatsAppOTPResponse>(
      '/auth/2fa/whatsapp/send-otp',
      phoneNumber ? { phoneNumber } : {}
    );
    return response;
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error);
    throw error;
  }
}
```

---

#### 2. Verify WhatsApp OTP

**Endpoint:** `POST /auth/2fa/whatsapp/verify-otp`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "otp": "919104"
}
```

**Response:**
```json
{
  "message": "WhatsApp OTP verified successfully",
  "verified": true
}
```

**Implementation:**
```typescript
async verifyWhatsAppOTP(otp: string): Promise<VerifyWhatsAppOTPResponse> {
  try {
    const response = await apiService.post<VerifyWhatsAppOTPResponse>(
      '/auth/2fa/whatsapp/verify-otp',
      { otp }
    );
    return response;
  } catch (error) {
    console.error('Error verifying WhatsApp OTP:', error);
    throw error;
  }
}
```

---

#### 3. Set WhatsApp as Default

**Endpoint:** `POST /auth/2fa/whatsapp/set-as-default`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "WhatsApp set as default 2FA method",
  "method": "WHATSAPP"
}
```

**Implementation:**
```typescript
async setWhatsAppAsDefault(): Promise<SetWhatsAppDefaultResponse> {
  try {
    const response = await apiService.post<SetWhatsAppDefaultResponse>(
      '/auth/2fa/whatsapp/set-as-default',
      {}
    );
    return response;
  } catch (error) {
    console.error('Error setting WhatsApp as default:', error);
    throw error;
  }
}
```

---

### SMS Endpoints

#### 1. Send SMS OTP

**Endpoint:** `POST /auth/2fa/sms/send-otp`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "phoneNumber": "+263772123456"  // Optional, uses user's phone if not provided
}
```

**Response:**
```json
{
  "message": "SMS OTP sent successfully",
  "expiresIn": "5 minutes",
  "phoneNumber": "+263772123456"
}
```

**Implementation:**
```typescript
async sendSMSOTP(phoneNumber?: string): Promise<SendSMSOTPResponse> {
  try {
    const response = await apiService.post<SendSMSOTPResponse>(
      '/auth/2fa/sms/send-otp',
      phoneNumber ? { phoneNumber } : {}
    );
    return response;
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    throw error;
  }
}
```

---

#### 2. Verify SMS OTP

**Endpoint:** `POST /auth/2fa/sms/verify-otp`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "otp": "919104"
}
```

**Response:**
```json
{
  "message": "SMS OTP verified successfully",
  "verified": true
}
```

**Implementation:**
```typescript
async verifySMSOTP(otp: string): Promise<VerifySMSOTPResponse> {
  try {
    const response = await apiService.post<VerifySMSOTPResponse>(
      '/auth/2fa/sms/verify-otp',
      { otp }
    );
    return response;
  } catch (error) {
    console.error('Error verifying SMS OTP:', error);
    throw error;
  }
}
```

---

#### 3. Set SMS as Default

**Endpoint:** `POST /auth/2fa/sms/set-as-default`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "SMS set as default 2FA method",
  "method": "SMS"
}
```

**Implementation:**
```typescript
async setSMSAsDefault(): Promise<SetSMSDefaultResponse> {
  try {
    const response = await apiService.post<SetSMSDefaultResponse>(
      '/auth/2fa/sms/set-as-default',
      {}
    );
    return response;
  } catch (error) {
    console.error('Error setting SMS as default:', error);
    throw error;
  }
}
```

---

## Component Implementation

### State Management

Located at: `src/components/2FASettingsDrawer/index.tsx`

#### WhatsApp State Variables

```typescript
const [whatsappSetupStep, setWhatsappSetupStep] = useState<'setup' | 'verify'>('setup');
const [whatsappCode, setWhatsappCode] = useState<string[]>(['', '', '', '', '', '']);
const [whatsappSessionId, setWhatsappSessionId] = useState<string>('');
const [whatsappCodeExpiresAt, setWhatsappCodeExpiresAt] = useState<number>(0);
const [whatsappResendAvailable, setWhatsappResendAvailable] = useState<boolean>(true);
const [whatsappResendCountdown, setWhatsappResendCountdown] = useState<number>(0);
const [whatsappLoading, setWhatsappLoading] = useState<boolean>(false);
const [whatsappShake, setWhatsappShake] = useState<boolean>(false);
```

#### SMS State Variables

```typescript
const [smsSetupStep, setSmsSetupStep] = useState<'setup' | 'verify'>('setup');
const [smsCode, setSmsCode] = useState<string[]>(['', '', '', '', '', '']);
const [smsSessionId, setSmsSessionId] = useState<string>('');
const [smsCodeExpiresAt, setSmsCodeExpiresAt(0);
const [smsResendAvailable, setSmsResendAvailable] = useState<boolean>(true);
const [smsResendCountdown, setSmsResendCountdown] = useState<number>(0);
const [smsLoading, setSmsLoading] = useState<boolean>(false);
const [smsShake, setSmsShake] = useState<boolean>(false);
```

---

### WhatsApp Handlers

#### Setup Handler

**Location:** Lines 373-406

```typescript
const handleSetupWhatsApp = async () => {
  if (!user?.phoneNumber) {
    console.error('No phone number available');
    return;
  }

  setWhatsappLoading(true);
  try {
    // Send WhatsApp OTP via backend
    const response = await apiAuth2FAService.sendWhatsAppOTP(user.phoneNumber);
    
    // Parse expiry time (e.g., "5 minutes" -> milliseconds)
    const expiryMinutes = parseInt(response.expiresIn);
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    
    setWhatsappCodeExpiresAt(expiresAt);
    setWhatsappSetupStep('verify');
    setWhatsappResendAvailable(false);
    setTwoFactorMethod('whatsapp');
    
    // Start countdown timer
    startWhatsAppResendCountdown();
    
    // Reset WhatsApp code inputs
    setWhatsappCode(['', '', '', '', '', '']);
            
    alert('WhatsApp code sent successfully!');
  } catch (error) {
    console.error('Failed to send WhatsApp:', error);
    alert('Failed to send WhatsApp. Please try again.');
  } finally {
    setWhatsappLoading(false);
  }
};
```

**Flow:**
1. Validates user has phone number
2. Calls backend API to send OTP
3. Parses expiry time from response
4. Updates state and UI
5. Starts countdown timer
6. Shows success message

---

#### Verification Handler

**Location:** Lines 408-460

```typescript
const handleVerifyWhatsApp = async () => {
  // Combine the 6-digit code from input fields
  const enteredCode = whatsappCode.join('');
  
  if (!enteredCode || enteredCode.length !== 6) {
    return;
  }

  // Check if code has expired
  if (whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt) {
    alert('Verification code has expired. Please request a new code.');
    return;
  }

  setWhatsappLoading(true);
  try {
    // Verify OTP with backend
    const response = await apiAuth2FAService.verifyWhatsAppOTP(enteredCode);
    
    if (response.verified) {
      // Set WhatsApp as default 2FA method
      await apiAuth2FAService.setWhatsAppAsDefault();
      
      setTwoFactorMethod('whatsapp');
      setTwoFactorEnabled(true);
      setWhatsappSetupStep('setup');
      setWhatsappCode(['', '', '', '', '', '']);
      setWhatsappSessionId('');
      setWhatsappCodeExpiresAt(0);
      setWhatsappResendAvailable(true);
      setWhatsappResendCountdown(0);
      
      alert('WhatsApp authentication enabled successfully!');
    } else {
      // Trigger shake effect
      setWhatsappShake(true);
      setTimeout(() => setWhatsappShake(false), 500);
      setWhatsappCode(['', '', '', '', '', '']);
      alert('Invalid verification code. Please try again.');
    }
  } catch (error) {
    console.error('WhatsApp verification error:', error);
    
    // Trigger shake effect on error
    setWhatsappShake(true);
    setTimeout(() => setWhatsappShake(false), 500);
    setWhatsappCode(['', '', '', '', '', '']);
    
    alert('Failed to verify code. Please try again.');
  } finally {
    setWhatsappLoading(false);
  }
};
```

**Flow:**
1. Combines 6-digit code from input fields
2. Validates code length
3. Checks if code has expired
4. Calls backend verification API
5. On success: Sets as default and enables 2FA
6. On failure: Shows shake animation and error

---

#### Resend Handler

**Location:** Lines 462-490

```typescript
const handleResendWhatsApp = async () => {
  if (!whatsappResendAvailable || !user?.phoneNumber) {
    return;
  }

  setWhatsappLoading(true);
  try {
    // Resend WhatsApp OTP via backend
    const response = await apiAuth2FAService.sendWhatsAppOTP(user.phoneNumber);
    
    // Parse expiry time
    const expiryMinutes = parseInt(response.expiresIn);
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    
    setWhatsappCodeExpiresAt(expiresAt);
    setWhatsappResendAvailable(false);
    setWhatsappCode(['', '', '', '', '', '']);
    
    // Restart countdown timer
    startWhatsAppResendCountdown();
    
    alert('New verification code sent successfully!');
  } catch (error) {
    console.error('Failed to resend WhatsApp:', error);
    alert('Failed to resend verification code. Please try again.');
  } finally {
    setWhatsappLoading(false);
  }
};
```

**Flow:**
1. Validates resend is available
2. Calls backend to send new OTP
3. Updates expiry time
4. Clears previous code
5. Restarts countdown timer

---

### SMS Handlers

#### Setup Handler

**Location:** Lines 236-269

```typescript
const handleSetupSMS = async () => {
  if (!user?.phoneNumber) {
    console.error('No phone number available');
    return;
  }

  setSmsLoading(true);
  try {
    // Send SMS OTP via backend
    const response = await apiAuth2FAService.sendSMSOTP(user.phoneNumber);
    
    // Parse expiry time (e.g., "5 minutes" -> milliseconds)
    const expiryMinutes = parseInt(response.expiresIn);
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    
    setSmsCodeExpiresAt(expiresAt);
    setSmsSetupStep('verify');
    setSmsResendAvailable(false);
    setTwoFactorMethod('sms');
    
    // Start countdown timer
    startResendCountdown();
    
    // Reset SMS code inputs
    setSmsCode(['', '', '', '', '', '']);
            
    alert('SMS code sent successfully');
  } catch (error) {
    console.error('Failed to send SMS:', error);
    alert('Failed to send SMS. Please try again.');
  } finally {
    setSmsLoading(false);
  }
};
```

---

#### Verification Handler

**Location:** Lines 271-323

```typescript
const handleVerifySMS = async () => {
  // Combine the 6-digit code from input fields
  const enteredCode = smsCode.join('');
  
  if (!enteredCode || enteredCode.length !== 6) {
    return;
  }

  // Check if code has expired
  if (smsCodeExpiresAt && Date.now() > smsCodeExpiresAt) {
    alert('Verification code has expired. Please request a new code.');
    return;
  }

  setSmsLoading(true);
  try {
    // Verify OTP with backend
    const response = await apiAuth2FAService.verifySMSOTP(enteredCode);
    
    if (response.verified) {
      // Set SMS as default 2FA method
      await apiAuth2FAService.setSMSAsDefault();
      
      setTwoFactorMethod('sms');
      setTwoFactorEnabled(true);
      setSmsSetupStep('setup');
      setSmsCode(['', '', '', '', '', '']);
      setSmsSessionId('');
      setSmsCodeExpiresAt(0);
      setSmsResendAvailable(true);
      setSmsResendCountdown(0);
      
      alert('SMS authentication enabled successfully!');
    } else {
      // Trigger shake effect
      setSmsShake(true);
      setTimeout(() => setSmsShake(false), 500);
      setSmsCode(['', '', '', '', '', '']);
      alert('Invalid verification code. Please try again.');
    }
  } catch (error) {
    console.error('SMS verification error:', error);
    
    // Trigger shake effect on error
    setSmsShake(true);
    setTimeout(() => setSmsShake(false), 500);
    setSmsCode(['', '', '', '', '', '']);
    
    alert('Failed to verify code. Please try again.');
  } finally {
    setSmsLoading(false);
  }
};
```

---

#### Resend Handler

**Location:** Lines 325-353

```typescript
const handleResendSMS = async () => {
  if (!smsResendAvailable || !user?.phoneNumber) {
    return;
  }

  setSmsLoading(true);
  try {
    // Resend SMS OTP via backend
    const response = await apiAuth2FAService.sendSMSOTP(user.phoneNumber);
    
    // Parse expiry time
    const expiryMinutes = parseInt(response.expiresIn);
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    
    setSmsCodeExpiresAt(expiresAt);
    setSmsResendAvailable(false);
    setSmsCode(['', '', '', '', '', '']);
    
    // Restart countdown timer
    startResendCountdown();
    
    alert('New verification code sent successfully!');
  } catch (error) {
    console.error('Failed to resend SMS:', error);
    alert('Failed to resend verification code. Please try again.');
  } finally {
    setSmsLoading(false);
  }
};
```

---

## User Interface

### 6-Digit Code Input

Both WhatsApp and SMS use the same input pattern:

```tsx
<div className="code-input-container">
  {[0, 1, 2, 3, 4, 5].map((index) => (
    <Input
      key={index}
      ref={(el) => (whatsappInputRefs.current[index] = el)}
      value={whatsappCode[index]}
      onChange={(e) => handleWhatsAppCodeChange(index, e.target.value)}
      onKeyDown={(e) => handleWhatsAppKeyDown(index, e)}
      maxLength={1}
      className={`code-input ${whatsappShake ? 'shake' : ''}`}
      disabled={whatsappLoading}
    />
  ))}
</div>
```

**Features:**
- Auto-focus on next input
- Backspace navigation
- Paste support (splits 6-digit code)
- Shake animation on error
- Loading state

---

### Countdown Timer

```tsx
<div className="countdown-container">
  <Text type="secondary" className="countdown-text">
    {whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt 
      ? 'Code expired' 
      : `Code expires in: ${whatsappCodeExpiresAt ? formatRemainingTime(whatsappCodeExpiresAt) : 'Loading...'}`
    }
  </Text>
</div>
```

**Features:**
- Real-time countdown display
- Expiry detection
- Automatic resend button display

---

### Action Buttons

```tsx
<div className="action-buttons">
  {whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt ? (
    <Button 
      type="primary" 
      size="large"
      onClick={handleResendWhatsApp}
      loading={whatsappLoading}
      block
    >
      Resend Code
    </Button>
  ) : (
    <Button 
      type="primary" 
      size="large"
      onClick={handleVerifyWhatsApp}
      loading={whatsappLoading}
      block
    >
      Verify
    </Button>
  )}
  <Button 
    type="text" 
    size="large"
    onClick={handleCancelWhatsAppSetup}
    block
  >
    Change Phone Number
  </Button>
</div>
```

**Features:**
- Dynamic button switching (Verify/Resend)
- Loading states
- Cancel option

---

## Data Flow

### Setup Flow

```
User clicks "Enable WhatsApp/SMS"
    ↓
Component validates phone number
    ↓
Call sendWhatsAppOTP() or sendSMSOTP()
    ↓
Backend generates OTP and sends via channel
    ↓
Parse expiry time from response
    ↓
Update UI to verification step
    ↓
Start countdown timer
    ↓
User receives OTP message
```

---

### Verification Flow

```
User enters 6-digit code
    ↓
Component validates code length
    ↓
Check if code has expired
    ↓
Call verifyWhatsAppOTP() or verifySMSOTP()
    ↓
Backend validates OTP
    ↓
If valid:
    ├─ Call setWhatsAppAsDefault() or setSMSAsDefault()
    ├─ Enable 2FA globally
    ├─ Clear all state
    └─ Show success message
    ↓
If invalid:
    ├─ Show shake animation
    ├─ Clear code inputs
    └─ Show error message
```

---

### Resend Flow

```
User clicks "Resend Code"
    ↓
Component validates resend availability
    ↓
Call sendWhatsAppOTP() or sendSMSOTP()
    ↓
Backend generates new OTP
    ↓
Update expiry time
    ↓
Clear previous code
    ↓
Restart countdown timer
    ↓
User receives new OTP message
```

---

## Security Considerations

### Backend Security

1. **Server-Side Generation**
   - All OTP codes generated on backend
   - No client-side code generation
   - Cryptographically secure random generation

2. **Time-Based Expiry**
   - Codes expire after 5 minutes
   - Server enforces expiry validation
   - Client shows countdown for UX

3. **Rate Limiting**
   - Backend should implement rate limiting
   - Prevent OTP spam/abuse
   - Cooldown between resend requests

4. **Single-Use Codes**
   - Each OTP is valid for one verification only
   - Used codes are invalidated immediately
   - New code required after expiry

### Client-Side Security

1. **No Code Storage**
   - Codes not persisted in localStorage
   - Cleared from state after use
   - Memory cleared on component unmount

2. **HTTPS Only**
   - All API calls over HTTPS
   - Bearer token authentication
   - Secure transmission

3. **Input Validation**
   - 6-digit numeric validation
   - Length checking
   - Expiry checking before submission

---

## Error Handling

### Network Errors

```typescript
try {
  const response = await apiAuth2FAService.sendWhatsAppOTP(phoneNumber);
  // Success handling
} catch (error) {
  console.error('Failed to send WhatsApp:', error);
  alert('Failed to send WhatsApp. Please try again.');
}
```

### Validation Errors

```typescript
// Code length validation
if (!enteredCode || enteredCode.length !== 6) {
  return;
}

// Expiry validation
if (whatsappCodeExpiresAt && Date.now() > whatsappCodeExpiresAt) {
  alert('Verification code has expired. Please request a new code.');
  return;
}
```

### Verification Errors

```typescript
if (response.verified) {
  // Success flow
} else {
  // Show shake animation
  setWhatsappShake(true);
  setTimeout(() => setWhatsappShake(false), 500);
  setWhatsappCode(['', '', '', '', '', '']);
  alert('Invalid verification code. Please try again.');
}
```

---

## Usage Guide

### For End Users

#### Enabling WhatsApp 2FA

1. Open 2FA Settings
2. Click "Enable WhatsApp Authentication"
3. Receive OTP code via WhatsApp
4. Enter 6-digit code
5. Click "Verify"
6. WhatsApp 2FA is now enabled

#### Enabling SMS 2FA

1. Open 2FA Settings
2. Click "Enable SMS Authentication"
3. Receive OTP code via SMS
4. Enter 6-digit code
5. Click "Verify"
6. SMS 2FA is now enabled

#### Resending Code

1. Wait for code to expire (or click resend if available)
2. Click "Resend Code"
3. Receive new OTP
4. Enter new code

---

### For Developers

#### Adding WhatsApp 2FA to Your Component

```typescript
import { apiAuth2FAService } from '@/services/apiAuth2FAService';

// Send OTP
const sendWhatsAppOTP = async (phoneNumber: string) => {
  try {
    const response = await apiAuth2FAService.sendWhatsAppOTP(phoneNumber);
    console.log('OTP sent:', response.message);
    console.log('Expires in:', response.expiresIn);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Verify OTP
const verifyWhatsAppOTP = async (otp: string) => {
  try {
    const response = await apiAuth2FAService.verifyWhatsAppOTP(otp);
    if (response.verified) {
      await apiAuth2FAService.setWhatsAppAsDefault();
      console.log('WhatsApp 2FA enabled!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### Adding SMS 2FA to Your Component

```typescript
import { apiAuth2FAService } from '@/services/apiAuth2FAService';

// Send OTP
const sendSMSOTP = async (phoneNumber: string) => {
  try {
    const response = await apiAuth2FAService.sendSMSOTP(phoneNumber);
    console.log('OTP sent:', response.message);
    console.log('Expires in:', response.expiresIn);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Verify OTP
const verifySMSOTP = async (otp: string) => {
  try {
    const response = await apiAuth2FAService.verifySMSOTP(otp);
    if (response.verified) {
      await apiAuth2FAService.setSMSAsDefault();
      console.log('SMS 2FA enabled!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Troubleshooting

### Common Issues

#### 1. OTP Not Received

**Problem:** User doesn't receive WhatsApp/SMS message

**Solutions:**
- Check phone number is correct
- Verify phone has signal/data
- Wait up to 10 minutes for delivery
- Check spam/blocked messages
- Try resending code

#### 2. Code Expired

**Problem:** Code expires before user enters it

**Solutions:**
- Click "Resend Code" button
- Enter code faster (5-minute window)
- Check system time is correct

#### 3. Invalid Code Error

**Problem:** Verification fails with valid code

**Solutions:**
- Ensure code is entered correctly
- Check code hasn't expired
- Try resending new code
- Verify no typos in input

#### 4. Network Errors

**Problem:** API calls fail

**Solutions:**
- Check internet connection
- Verify authentication token is valid
- Check backend service status
- Retry after brief delay

---

## Testing

### Manual Testing Checklist

#### WhatsApp 2FA

- [ ] Send OTP successfully
- [ ] Receive WhatsApp message
- [ ] Verify valid code
- [ ] Reject invalid code
- [ ] Handle expired code
- [ ] Resend functionality works
- [ ] Countdown timer accurate
- [ ] Shake animation on error
- [ ] Loading states display
- [ ] Set as default works
- [ ] Cancel setup works

#### SMS 2FA

- [ ] Send OTP successfully
- [ ] Receive SMS message
- [ ] Verify valid code
- [ ] Reject invalid code
- [ ] Handle expired code
- [ ] Resend functionality works
- [ ] Countdown timer accurate
- [ ] Shake animation on error
- [ ] Loading states display
- [ ] Set as default works
- [ ] Cancel setup works

---

### Automated Testing

```typescript
describe('WhatsApp 2FA', () => {
  it('should send OTP successfully', async () => {
    const response = await apiAuth2FAService.sendWhatsAppOTP('+1234567890');
    expect(response.message).toBe('WhatsApp OTP sent successfully');
    expect(response.expiresIn).toBe('5 minutes');
  });

  it('should verify valid OTP', async () => {
    const response = await apiAuth2FAService.verifyWhatsAppOTP('123456');
    expect(response.verified).toBe(true);
  });

  it('should set WhatsApp as default', async () => {
    const response = await apiAuth2FAService.setWhatsAppAsDefault();
    expect(response.method).toBe('WHATSAPP');
  });
});

describe('SMS 2FA', () => {
  it('should send OTP successfully', async () => {
    const response = await apiAuth2FAService.sendSMSOTP('+1234567890');
    expect(response.message).toBe('SMS OTP sent successfully');
    expect(response.expiresIn).toBe('5 minutes');
  });

  it('should verify valid OTP', async () => {
    const response = await apiAuth2FAService.verifySMSOTP('123456');
    expect(response.verified).toBe(true);
  });

  it('should set SMS as default', async () => {
    const response = await apiAuth2FAService.setSMSAsDefault();
    expect(response.method).toBe('SMS');
  });
});
```

---

## Best Practices

### Development

1. **Always validate input**
   - Check code length before API calls
   - Validate phone number format
   - Check expiry before verification

2. **Handle errors gracefully**
   - Show user-friendly error messages
   - Log errors for debugging
   - Provide recovery options

3. **Provide visual feedback**
   - Loading states during API calls
   - Countdown timers for expiry
   - Shake animations for errors
   - Success confirmations

4. **Secure implementation**
   - Never expose OTP codes in logs
   - Clear sensitive data from state
   - Use HTTPS for all API calls
   - Implement proper authentication

### User Experience

1. **Clear instructions**
   - Explain what will happen
   - Show expected wait times
   - Provide help text

2. **Easy input**
   - Auto-focus next field
   - Support paste functionality
   - Allow backspace navigation

3. **Helpful feedback**
   - Show remaining time
   - Indicate when code expires
   - Explain errors clearly

4. **Recovery options**
   - Easy resend functionality
   - Cancel/change options
   - Alternative methods

---

## Comparison: WhatsApp vs SMS

| Feature | WhatsApp | SMS |
|---------|----------|-----|
| **Delivery Speed** | Usually faster | Can be slower |
| **Cost** | Free (data required) | May incur SMS charges |
| **Reliability** | Requires internet | Works without internet |
| **Security** | End-to-end encrypted | Not encrypted |
| **Global Reach** | Requires WhatsApp app | Universal |
| **User Preference** | Popular in some regions | Universal fallback |

---

## Future Enhancements

### Potential Improvements

1. **Auto-detection**
   - SMS auto-read on Android
   - WhatsApp message parsing
   - Clipboard monitoring

2. **Enhanced Security**
   - Biometric verification
   - Device fingerprinting
   - Anomaly detection

3. **Better UX**
   - Voice call fallback
   - Multiple language support
   - Accessibility improvements

4. **Analytics**
   - Delivery success rates
   - Verification attempts
   - User preferences

---

## Related Documentation

- [2FA Authenticator App](./2FA-Auth.md)
- [2FA Backup Codes](./2FA-BackupCodes.md)
- [2FA Disable Method](./2FA-DisableMethod.md)

---

## Support

For issues or questions:
- Check troubleshooting section above
- Review error logs in console
- Contact development team
- Submit bug report with details

---

**Last Updated:** February 2026  
**Version:** 1.0.0  
**Maintained by:** Koppo Development Team
