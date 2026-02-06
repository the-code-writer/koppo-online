# 2FA Email Implementation Documentation

## Overview

This document provides comprehensive documentation for the **Email** Two-Factor Authentication (2FA) implementation in the Koppo App. Email 2FA follows the same patterns as SMS and WhatsApp methods, delivering OTP codes via email messages.

### Key Features

- **Backend OTP Generation** - Server generates and sends OTP codes
- **Email Delivery** - OTP delivered via email message
- **Automatic Expiry** - Time-based code expiration (5 minutes default)
- **Resend Functionality** - Users can request new codes
- **Visual Feedback** - Countdown timers, shake animations, loading states
- **Set as Default** - Automatic configuration as primary 2FA method
- **Input Validation** - 6-digit code with auto-focus navigation
- **Error Handling** - Comprehensive error messages and recovery

### Supported Platforms

- **Email** - OTP delivered via email message

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
│       ├── 2FA-WhatsApp-SMS.md         # WhatsApp & SMS documentation
│       └── 2FA-Email.md                # This documentation
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

#### Email TypeScript Interfaces

```typescript
export interface SendEmailOTPRequest {
  email?: string;
}

export interface SendEmailOTPResponse {
  message: string;
  expiresIn: string;
  email: string;
}

export interface VerifyEmailOTPRequest {
  otp: string;
}

export interface VerifyEmailOTPResponse {
  message: string;
  verified: boolean;
}

export interface SetEmailDefaultResponse {
  message: string;
  method: string;
}
```

---

## API Endpoints

### Email Endpoints

#### 1. Send Email OTP

**Endpoint:** `POST /auth/2fa/email/send-otp`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"  // Optional, uses user's email if not provided
}
```

**Response:**
```json
{
  "message": "Email OTP sent successfully",
  "expiresIn": "5 minutes",
  "email": "user@example.com"
}
```

**Implementation:**
```typescript
async sendEmailOTP(email?: string): Promise<SendEmailOTPResponse> {
  try {
    const response = await apiService.post<SendEmailOTPResponse>(
      '/auth/2fa/email/send-otp',
      email ? { email } : {}
    );
    return response;
  } catch (error) {
    console.error('Error sending Email OTP:', error);
    throw error;
  }
}
```

---

#### 2. Verify Email OTP

**Endpoint:** `POST /auth/2fa/email/verify-otp`

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
  "message": "Email OTP verified successfully",
  "verified": true
}
```

**Implementation:**
```typescript
async verifyEmailOTP(otp: string): Promise<VerifyEmailOTPResponse> {
  try {
    const response = await apiService.post<VerifyEmailOTPResponse>(
      '/auth/2fa/email/verify-otp',
      { otp }
    );
    return response;
  } catch (error) {
    console.error('Error verifying Email OTP:', error);
    throw error;
  }
}
```

---

#### 3. Set Email as Default

**Endpoint:** `POST /auth/2fa/email/set-as-default`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "Email set as default 2FA method",
  "method": "EMAIL"
}
```

**Implementation:**
```typescript
async setEmailAsDefault(): Promise<SetEmailDefaultResponse> {
  try {
    const response = await apiService.post<SetEmailDefaultResponse>(
      '/auth/2fa/email/set-as-default',
      {}
    );
    return response;
  } catch (error) {
    console.error('Error setting Email as default:', error);
    throw error;
  }
}
```

---

## Component Implementation

### State Management

Located at: `src/components/2FASettingsDrawer/index.tsx`

#### Email State Variables

```typescript
const [emailCode, setEmailCode] = useState<string[]>(['', '', '', '', '', '']);
const [emailSetupStep, setEmailSetupStep] = useState<'setup' | 'verify'>('setup');
const [emailSessionId, setEmailSessionId] = useState<string>('');
const [emailCodeExpiresAt, setEmailCodeExpiresAt] = useState<number>(0);
const [emailResendAvailable, setEmailResendAvailable] = useState<boolean>(true);
const [emailResendCountdown, setEmailResendCountdown] = useState<number>(0);
const [emailLoading, setEmailLoading] = useState<boolean>(false);
const [emailResendLoading, setEmailResendLoading] = useState<boolean>(false);
const [emailShake, setEmailShake] = useState<boolean>(false);
```

---

### Email Handlers

#### Setup Handler

**Location:** Lines 498-536

```typescript
const handleSetupEmail = async () => {
  if (!user?.email) {
    console.error('No email available');
    return;
  }

  setEmailLoading(true);
  try {
    // Send Email OTP via backend
    const response = await apiAuth2FAService.sendEmailOTP(user.email);
    
    // Parse expiry time (e.g., "5 minutes" -> milliseconds)
    const expiryMinutes = parseInt(response.expiresIn);
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    
    setEmailCodeExpiresAt(expiresAt);
    setEmailSetupStep('verify');
    setEmailResendAvailable(false);
    setTwoFactorMethod('email');
    
    // Reset Email code inputs
    setEmailCode(['', '', '', '', '', '']);
            
    alert('Email code sent successfully!');
  } catch (error) {
    console.error('Failed to send Email:', error);
    alert('Failed to send Email. Please try again.');
  } finally {
    setEmailLoading(false);
  }
};
```

**Flow:**
1. Validates user has email address
2. Calls backend API to send OTP
3. Parses expiry time from response
4. Updates state and UI
5. Shows success message

---

#### Verification Handler

**Location:** Lines 539-579

```typescript
const handleVerifyEmail = async () => {
  // Combine the 6-digit code from input fields
  const enteredCode = emailCode.join('');
  
  if (!enteredCode || enteredCode.length !== 6) {
    return;
  }

  // Check if code has expired
  if (emailCodeExpiresAt && Date.now() > emailCodeExpiresAt) {
    alert('Verification code has expired. Please request a new code.');
    return;
  }

  setEmailLoading(true);
  try {
    // Verify OTP with backend
    const response = await apiAuth2FAService.verifyEmailOTP(enteredCode);
    
    if (response.verified) {
      // Set Email as default 2FA method
      await apiAuth2FAService.setEmailAsDefault();
      
      setTwoFactorMethod('email');
      setTwoFactorEnabled(true);
      setEmailSetupStep('setup');
      setEmailCode(['', '', '', '', '', '']);
      setEmailSessionId('');
      setEmailCodeExpiresAt(0);
      setEmailResendAvailable(true);
      setEmailResendCountdown(0);
      
      alert('Email authentication enabled successfully!');
    } else {
      // Trigger shake effect
      setEmailShake(true);
      setTimeout(() => setEmailShake(false), 500);
      setEmailCode(['', '', '', '', '', '']);
      alert('Invalid verification code. Please try again.');
    }
  } catch (error) {
    console.error('Email verification error:', error);
    
    // Trigger shake effect on error
    setEmailShake(true);
    setTimeout(() => setEmailShake(false), 500);
    setEmailCode(['', '', '', '', '', '']);
    
    alert('Failed to verify code. Please try again.');
  } finally {
    setEmailLoading(false);
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
const handleResendEmail = async () => {
  if (!emailResendAvailable) {
    return;
  }

  setEmailResendLoading(true);
  try {
    // Resend Email OTP via backend
    const response = await apiAuth2FAService.sendEmailOTP();
    
    // Parse expiry time
    const expiryMinutes = parseInt(response.expiresIn);
    const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
    
    setEmailCodeExpiresAt(expiresAt);
    setEmailResendAvailable(false);
    setEmailResendCountdown(60);
    setEmailCode(['', '', '', '', '', '']);
    
    alert('New verification code sent successfully!');
  } catch (error) {
    console.error('Failed to resend Email OTP:', error);
    alert('Failed to resend code. Please try again.');
  } finally {
    setEmailResendLoading(false);
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

Email uses the same input pattern as SMS and WhatsApp:

```tsx
<div className="code-input-container">
  {[0, 1, 2, 3, 4, 5].map((index) => (
    <Input
      key={index}
      ref={(el) => (emailInputRefs.current[index] = el)}
      value={emailCode[index]}
      onChange={(e) => handleEmailCodeChange(index, e.target.value)}
      onKeyDown={(e) => handleEmailKeyDown(index, e)}
      maxLength={1}
      className={`code-input ${emailShake ? 'shake' : ''}`}
      disabled={emailLoading}
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
    {emailCodeExpiresAt && Date.now() > emailCodeExpiresAt 
      ? 'Code expired' 
      : `Code expires in: ${emailCodeExpiresAt ? formatRemainingTime(emailCodeExpiresAt) : 'Loading...'}`
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
    onClick={handleVerifyEmail}
    loading={emailLoading}
    block
  >
    Verify
  </Button>
  <Button 
    type="default" 
    size="large"
    onClick={handleResendEmail}
    loading={emailResendLoading}
    disabled={!emailResendAvailable}
    block
  >
    {emailResendCountdown > 0 ? `Resend in ${emailResendCountdown}s` : 'Resend Code'}
  </Button>
  <Button 
    type="text" 
    size="large"
    onClick={handleCancelEmailSetup}
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
User clicks "Enable Email Authentication"
    ↓
Component validates email address
    ↓
Call sendEmailOTP()
    ↓
Backend generates OTP and sends via email
    ↓
Parse expiry time from response
    ↓
Update UI to verification step
    ↓
Start countdown timer
    ↓
User receives OTP email
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
Call verifyEmailOTP()
    ↓
Backend validates OTP
    ↓
If valid:
    ├─ Call setEmailAsDefault()
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
Call sendEmailOTP()
    ↓
Backend generates new OTP
    ↓
Update expiry time
    ↓
Clear previous code
    ↓
Start countdown timer
    ↓
User receives new OTP email
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
  const response = await apiAuth2FAService.sendEmailOTP(email);
  // Success handling
} catch (error) {
  console.error('Failed to send Email:', error);
  alert('Failed to send Email. Please try again.');
}
```

### Validation Errors

```typescript
// Code length validation
if (!enteredCode || enteredCode.length !== 6) {
  return;
}

// Expiry validation
if (emailCodeExpiresAt && Date.now() > emailCodeExpiresAt) {
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
  setEmailShake(true);
  setTimeout(() => setEmailShake(false), 500);
  setEmailCode(['', '', '', '', '', '']);
  alert('Invalid verification code. Please try again.');
}
```

---

## Usage Guide

### For End Users

#### Enabling Email 2FA

1. Open 2FA Settings
2. Click "Enable Email Authentication"
3. Receive OTP code via email
4. Enter 6-digit code
5. Click "Verify"
6. Email 2FA is now enabled

#### Resending Code

1. Wait for countdown to reach 0 (or wait for code to expire)
2. Click "Resend Code"
3. Receive new OTP via email
4. Enter new code

---

### For Developers

#### Adding Email 2FA to Your Component

```typescript
import { apiAuth2FAService } from '@/services/apiAuth2FAService';

// Send OTP
const sendEmailOTP = async (email: string) => {
  try {
    const response = await apiAuth2FAService.sendEmailOTP(email);
    console.log('OTP sent:', response.message);
    console.log('Expires in:', response.expiresIn);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Verify OTP
const verifyEmailOTP = async (otp: string) => {
  try {
    const response = await apiAuth2FAService.verifyEmailOTP(otp);
    if (response.verified) {
      await apiAuth2FAService.setEmailAsDefault();
      console.log('Email 2FA enabled!');
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

**Problem:** User doesn't receive email message

**Solutions:**
- Check email address is correct
- Verify email inbox (including spam folder)
- Wait up to 10 minutes for delivery
- Check email server status
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

#### Email 2FA

- [ ] Send OTP successfully
- [ ] Receive email message
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
describe('Email 2FA', () => {
  it('should send OTP successfully', async () => {
    const response = await apiAuth2FAService.sendEmailOTP('user@example.com');
    expect(response.message).toBe('Email OTP sent successfully');
    expect(response.expiresIn).toBe('5 minutes');
  });

  it('should verify valid OTP', async () => {
    const response = await apiAuth2FAService.verifyEmailOTP('123456');
    expect(response.verified).toBe(true);
  });

  it('should set Email as default', async () => {
    const response = await apiAuth2FAService.setEmailAsDefault();
    expect(response.method).toBe('EMAIL');
  });
});
```

---

## Best Practices

### Development

1. **Always validate input**
   - Check code length before API calls
   - Validate email format
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

## Comparison: Email vs SMS vs WhatsApp

| Feature | Email | SMS | WhatsApp |
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
   - Email parsing for OTP codes
   - Clipboard monitoring
   - Auto-fill functionality

2. **Enhanced Security**
   - Biometric verification
   - Device fingerprinting
   - Anomaly detection

3. **Better UX**
   - Multiple language support
   - Accessibility improvements
   - Email template customization

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
