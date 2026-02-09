# 2FA Telegram Implementation Documentation

## Overview

This document provides comprehensive documentation for the **Telegram** Two-Factor Authentication (2FA) implementation in the Koppo App. Telegram 2FA follows the same patterns as SMS and WhatsApp methods, delivering OTP codes via telegram messages.

### Key Features

- **Backend OTP Generation** - Server generates and sends OTP codes
- **Telegram Delivery** - OTP delivered via telegram message
- **Automatic Expiry** - Time-based code expiration (5 minutes default)
- **Resend Functionality** - Users can request new codes
- **Visual Feedback** - Countdown timers, shake animations, loading states
- **Set as Default** - Automatic configuration as primary 2FA method
- **Input Validation** - 6-digit code with auto-focus navigation
- **Error Handling** - Comprehensive error messages and recovery

### Supported Platforms

- **Telegram** - OTP delivered via telegram message

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
│       ├── 2FA-WhatsApp-SMS.md         # Disable method documentation
│       ├── 2FA-Telegram.md             # Telegram documentation
│       └── 2FA-Email.md             # Email documentation
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

#### Telegram TypeScript Interfaces

```typescript
export interface SendTelegramOTPRequest {
  telegram?: string;
}

export interface SendTelegramOTPResponse {
  message: string;
  expiresIn: string;
  telegram: string;
}

export interface VerifyTelegramOTPRequest {
  otp: string;
}

export interface VerifyTelegramOTPResponse {
  message: string;
  verified: boolean;
}

export interface SetTelegramDefaultResponse {
  message: string;
  method: string;
}
```

---

## API Endpoints

### Telegram Endpoints

#### 1. Send Telegram OTP

**Endpoint:** `POST /auth/2fa/telegram/send-otp`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "telegram": "user@example.com"  // Optional, uses user's telegram if not provided
}
```

**Response:**
```json
{
  "message": "Telegram OTP sent successfully",
  "expiresIn": "5 minutes",
  "telegram": "user@example.com"
}
```

**Implementation:**
```typescript
async sendTelegramOTP(telegram?: string): Promise<SendTelegramOTPResponse> {
  try {
    const response = await apiService.post<SendTelegramOTPResponse>(
      '/auth/2fa/telegram/send-otp',
      telegram ? { telegram } : {}
    );
    return response;
  } catch (error) {
    console.error('Error sending Telegram OTP:', error);
    throw error;
  }
}
```

---

#### 2. Verify Telegram OTP

**Endpoint:** `POST /auth/2fa/telegram/verify-otp`

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
  "message": "Telegram OTP verified successfully",
  "verified": true
}
```

**Implementation:**
```typescript
async verifyTelegramOTP(otp: string): Promise<VerifyTelegramOTPResponse> {
  try {
    const response = await apiService.post<VerifyTelegramOTPResponse>(
      '/auth/2fa/telegram/verify-otp',
      { otp }
    );
    return response;
  } catch (error) {
    console.error('Error verifying Telegram OTP:', error);
    throw error;
  }
}
```

---

#### 3. Set Telegram as Default

**Endpoint:** `POST /auth/2fa/telegram/set-as-default`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "Telegram set as default 2FA method",
  "method": "EMAIL"
}
```

**Implementation:**
```typescript
async setTelegramAsDefault(): Promise<SetTelegramDefaultResponse> {
  try {
    const response = await apiService.post<SetTelegramDefaultResponse>(
      '/auth/2fa/telegram/set-as-default',
      {}
    );
    return response;
  } catch (error) {
    console.error('Error setting Telegram as default:', error);
    throw error;
  }
}
```

---

## Component Implementation

### State Management

Located at: `src/components/2FASettingsDrawer/index.tsx`

#### Telegram State Variables

```typescript
const [telegramCode, setTelegramCode] = useState<string[]>(['', '', '', '', '', '']);
const [telegramSetupStep, setTelegramSetupStep] = useState<'setup' | 'verify'>('setup');
const [telegramSessionId, setTelegramSessionId] = useState<string>('');
const [telegramCodeExpiresAt, setTelegramCodeExpiresAt] = useState<number>(0);
const [telegramResendAvailable, setTelegramResendAvailable] = useState<boolean>(true);
const [telegramResendCountdown, setTelegramResendCountdown] = useState<number>(0);
const [telegramLoading, setTelegramLoading] = useState<boolean>(false);
const [telegramResendLoading, setTelegramResendLoading] = useState<boolean>(false);
const [telegramShake, setTelegramShake] = useState<boolean>(false);
```

---

### Telegram Handlers

#### Setup Handler

**Location:** Lines 498-536

```typescript
const handleSetupTelegram = async () => {
  if (!user?.telegram) {
    console.error('No telegram available');
    return;
  }

  setTelegramLoading(true);
  try {
    // Send Telegram OTP via backend
    const response = await apiAuth2FAService.sendTelegramOTP(user.telegram);
    
    // Parse expiry time (e.g., "5 minutes" -> milliseconds)
    const expiryMinutes = parseInt(response.expiresIn);
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    
    setTelegramCodeExpiresAt(expiresAt);
    setTelegramSetupStep('verify');
    setTelegramResendAvailable(false);
    setTwoFactorMethod('telegram');
    
    // Reset Telegram code inputs
    setTelegramCode(['', '', '', '', '', '']);
            
    alert('Telegram code sent successfully!');
  } catch (error) {
    console.error('Failed to send Telegram:', error);
    alert('Failed to send Telegram. Please try again.');
  } finally {
    setTelegramLoading(false);
  }
};
```

**Flow:**
1. Validates user has telegram address
2. Calls backend API to send OTP
3. Parses expiry time from response
4. Updates state and UI
5. Shows success message

---

#### Verification Handler

**Location:** Lines 539-579

```typescript
const handleVerifyTelegram = async () => {
  // Combine the 6-digit code from input fields
  const enteredCode = telegramCode.join('');
  
  if (!enteredCode || enteredCode.length !== 6) {
    return;
  }

  // Check if code has expired
  if (telegramCodeExpiresAt && Date.now() > telegramCodeExpiresAt) {
    alert('Verification code has expired. Please request a new code.');
    return;
  }

  setTelegramLoading(true);
  try {
    // Verify OTP with backend
    const response = await apiAuth2FAService.verifyTelegramOTP(enteredCode);
    
    if (response.verified) {
      // Set Telegram as default 2FA method
      await apiAuth2FAService.setTelegramAsDefault();
      
      setTwoFactorMethod('telegram');
      setTwoFactorEnabled(true);
      setTelegramSetupStep('setup');
      setTelegramCode(['', '', '', '', '', '']);
      setTelegramSessionId('');
      setTelegramCodeExpiresAt(0);
      setTelegramResendAvailable(true);
      setTelegramResendCountdown(0);
      
      alert('Telegram authentication enabled successfully!');
    } else {
      // Trigger shake effect
      setTelegramShake(true);
      setTimeout(() => setTelegramShake(false), 500);
      setTelegramCode(['', '', '', '', '', '']);
      alert('Invalid verification code. Please try again.');
    }
  } catch (error) {
    console.error('Telegram verification error:', error);
    
    // Trigger shake effect on error
    setTelegramShake(true);
    setTimeout(() => setTelegramShake(false), 500);
    setTelegramCode(['', '', '', '', '', '']);
    
    alert('Failed to verify code. Please try again.');
  } finally {
    setTelegramLoading(false);
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

**Location:** Lines 581-603

```typescript
const handleResendTelegram = async () => {
  if (!telegramResendAvailable) {
    return;
  }

  setTelegramResendLoading(true);
  try {
    // Resend Telegram OTP via backend
    const response = await apiAuth2FAService.sendTelegramOTP();
    
    // Parse expiry time
    const expiryMinutes = parseInt(response.expiresIn);
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    
    setTelegramCodeExpiresAt(expiresAt);
    setTelegramResendAvailable(false);
    setTelegramResendCountdown(60);
    setTelegramCode(['', '', '', '', '', '']);
    
    alert('New verification code sent successfully!');
  } catch (error) {
    console.error('Failed to resend Telegram OTP:', error);
    alert('Failed to resend code. Please try again.');
  } finally {
    setTelegramResendLoading(false);
  }
};
```

**Flow:**
1. Validates resend is available
2. Calls backend to send new OTP
3. Updates expiry time
4. Clears previous code
5. Starts countdown timer

---

## User Interface

### 6-Digit Code Input

Telegram uses the same input pattern as SMS and WhatsApp:

```tsx
<div className="code-input-container">
  {[0, 1, 2, 3, 4, 5].map((index) => (
    <Input
      key={index}
      ref={(el) => (telegramInputRefs.current[index] = el)}
      value={telegramCode[index]}
      onChange={(e) => handleTelegramCodeChange(index, e.target.value)}
      onKeyDown={(e) => handleTelegramKeyDown(index, e)}
      maxLength={1}
      className={`code-input ${telegramShake ? 'shake' : ''}`}
      disabled={telegramLoading}
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
    {telegramCodeExpiresAt && Date.now() > telegramCodeExpiresAt 
      ? 'Code expired' 
      : `Code expires in: ${telegramCodeExpiresAt ? formatRemainingTime(telegramCodeExpiresAt) : 'Loading...'}`
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
  <Button 
    type="primary" 
    size="large"
    onClick={handleVerifyTelegram}
    loading={telegramLoading}
    block
  >
    Verify
  </Button>
  <Button 
    type="default" 
    size="large"
    onClick={handleResendTelegram}
    loading={telegramResendLoading}
    disabled={!telegramResendAvailable}
    block
  >
    {telegramResendCountdown > 0 ? `Resend in ${telegramResendCountdown}s` : 'Resend Code'}
  </Button>
  <Button 
    type="text" 
    size="large"
    onClick={handleCancelTelegramSetup}
    block
  >
    Cancel
  </Button>
</div>
```

**Features:**
- Separate loading states for verify and resend
- Countdown timer for resend availability
- Cancel option

---

## Data Flow

### Setup Flow

```
User clicks "Enable Telegram Authentication"
    ↓
Component validates telegram address
    ↓
Call sendTelegramOTP()
    ↓
Backend generates OTP and sends via telegram
    ↓
Parse expiry time from response
    ↓
Update UI to verification step
    ↓
Start countdown timer
    ↓
User receives OTP telegram
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
Call verifyTelegramOTP()
    ↓
Backend validates OTP
    ↓
If valid:
    ├─ Call setTelegramAsDefault()
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
Call sendTelegramOTP()
    ↓
Backend generates new OTP
    ↓
Update expiry time
    ↓
Clear previous code
    ↓
Start countdown timer
    ↓
User receives new OTP telegram
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
  const response = await apiAuth2FAService.sendTelegramOTP(telegram);
  // Success handling
} catch (error) {
  console.error('Failed to send Telegram:', error);
  alert('Failed to send Telegram. Please try again.');
}
```

### Validation Errors

```typescript
// Code length validation
if (!enteredCode || enteredCode.length !== 6) {
  return;
}

// Expiry validation
if (telegramCodeExpiresAt && Date.now() > telegramCodeExpiresAt) {
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
  setTelegramShake(true);
  setTimeout(() => setTelegramShake(false), 500);
  setTelegramCode(['', '', '', '', '', '']);
  alert('Invalid verification code. Please try again.');
}
```

---

## Usage Guide

### For End Users

#### Enabling Telegram 2FA

1. Open 2FA Settings
2. Click "Enable Telegram Authentication"
3. Receive OTP code via telegram
4. Enter 6-digit code
5. Click "Verify"
6. Telegram 2FA is now enabled

#### Resending Code

1. Wait for countdown to reach 0 (or wait for code to expire)
2. Click "Resend Code"
3. Receive new OTP via telegram
4. Enter new code

---

### For Developers

#### Adding Telegram 2FA to Your Component

```typescript
import { apiAuth2FAService } from '@/services/apiAuth2FAService';

// Send OTP
const sendTelegramOTP = async (telegram: string) => {
  try {
    const response = await apiAuth2FAService.sendTelegramOTP(telegram);
    console.log('OTP sent:', response.message);
    console.log('Expires in:', response.expiresIn);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Verify OTP
const verifyTelegramOTP = async (otp: string) => {
  try {
    const response = await apiAuth2FAService.verifyTelegramOTP(otp);
    if (response.verified) {
      await apiAuth2FAService.setTelegramAsDefault();
      console.log('Telegram 2FA enabled!');
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

**Problem:** User doesn't receive telegram message

**Solutions:**
- Check telegram address is correct
- Verify telegram inbox (including spam folder)
- Wait up to 10 minutes for delivery
- Check telegram server status
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

#### Telegram 2FA

- [ ] Send OTP successfully
- [ ] Receive telegram message
- [ ] Verify valid code
- [ ] Reject invalid code
- [ ] Handle expired code
- [ ] Resend functionality works
- [ ] Countdown timer accurate
- [ ] Shake animation on error
- [ ] Loading states display
- [ ] Set as default works
- [ ] Cancel setup works
- [ ] Separate loading states for verify/resend

---

### Automated Testing

```typescript
describe('Telegram 2FA', () => {
  it('should send OTP successfully', async () => {
    const response = await apiAuth2FAService.sendTelegramOTP('user@example.com');
    expect(response.message).toBe('Telegram OTP sent successfully');
    expect(response.expiresIn).toBe('5 minutes');
  });

  it('should verify valid OTP', async () => {
    const response = await apiAuth2FAService.verifyTelegramOTP('123456');
    expect(response.verified).toBe(true);
  });

  it('should set Telegram as default', async () => {
    const response = await apiAuth2FAService.setTelegramAsDefault();
    expect(response.method).toBe('EMAIL');
  });
});
```

---

## Best Practices

### Development

1. **Always validate input**
   - Check code length before API calls
   - Validate telegram format
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

## Comparison: Telegram vs SMS vs WhatsApp

| Feature | Telegram | SMS | WhatsApp |
|---------|-------|-----|----------|
| **Delivery Speed** | Usually fast | Can be slower | Usually fastest |
| **Cost** | Free | May incur charges | Free (data required) |
| **Reliability** | Requires internet | Works without internet | Requires internet |
| **Security** | Varies by provider | Not encrypted | End-to-end encrypted |
| **Global Reach** | Universal | Universal | Requires app |
| **User Preference** | Professional fallback | Universal fallback | Popular in some regions |

---

## Future Enhancements

### Potential Improvements

1. **Auto-detection**
   - Telegram parsing for OTP codes
   - Clipboard monitoring
   - Auto-fill functionality

2. **Enhanced Security**
   - Biometric verification
   - Device fingerprinting
   - Anomaly detection

3. **Better UX**
   - Multiple language support
   - Accessibility improvements
   - Telegram template customization

4. **Analytics**
   - Delivery success rates
   - Verification attempts
   - User preferences

---

## Related Documentation

- [2FA WhatsApp & SMS](./2FA-WhatsApp-SMS.md)
- [2FA Authenticator App](./2FA-Auth.md)
- [2FA Backup Codes](./2FA-BackupCodes.md)
- [2FA Disable Method](./2FA-DisableMethod.md)

---

*Last Updated: February 6, 2026*
