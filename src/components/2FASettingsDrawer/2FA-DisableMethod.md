# Two-Factor Authentication (2FA) - Disable Method

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Integration](#api-integration)
4. [Component Implementation](#component-implementation)
5. [Data Flow](#data-flow)
6. [Security Considerations](#security-considerations)
7. [Usage Guide](#usage-guide)
8. [Developer Guide](#developer-guide)
9. [Troubleshooting](#troubleshooting)
10. [Testing](#testing)

---

## Overview

The 2FA Disable Method feature allows users to disable their currently active two-factor authentication method. This is a critical security operation that requires user confirmation and proper backend validation.

### Supported Methods
- **SMS** - Text message-based authentication
- **WHATSAPP** - WhatsApp message-based authentication
- **EMAIL** - Email-based authentication
- **AUTHENTICATOR** - Authenticator app (TOTP) based authentication

### Key Features
- **Confirmation dialog** - Prevents accidental disabling
- **Backend validation** - Server-side verification of disable request
- **State cleanup** - Complete reset of method-specific data
- **Loading states** - Visual feedback during API calls
- **Error handling** - Graceful failure with user-friendly messages
- **Audit trail** - Backend logging of disable operations

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
│       └── 2FA-DisableMethod.md        # This documentation
└── services/
    └── apiAuth2FAService.ts            # API service for 2FA operations
```

### Technology Stack
- **React** (Functional Components with Hooks)
- **TypeScript** (Type-safe implementation)
- **Ant Design** (UI components - Modal, Button)
- **Axios** (HTTP client via apiService)

---

## API Integration

### Service: `apiAuth2FAService`

Located at: `src/services/apiAuth2FAService.ts`

#### TypeScript Interfaces

```typescript
export interface Disable2FAMethodRequest {
  method: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'AUTHENTICATOR';
}

export interface Disable2FAMethodResponse {
  message: string;
  method: string;
  disabled: boolean;
}
```

#### API Method

```typescript
/**
 * Disable a 2FA method
 * @param method - The 2FA method to disable (SMS, WHATSAPP, EMAIL, AUTHENTICATOR)
 * @returns Promise<Disable2FAMethodResponse>
 */
async disable2FAMethod(
  method: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'AUTHENTICATOR'
): Promise<Disable2FAMethodResponse> {
  try {
    const response = await apiService.post<Disable2FAMethodResponse>(
      '/v1/auth/2fa/disable',
      { method }
    );
    return response;
  } catch (error) {
    console.error(`Error disabling ${method} 2FA:`, error);
    throw error;
  }
}
```

---

## API Endpoint

### Disable 2FA Method

**Endpoint:** `POST /v1/auth/2fa/disable`

**Description:** Disables the specified 2FA method for the authenticated user.

**Authentication:** Required (Bearer token)

**Request:**
```http
POST /v1/auth/2fa/disable
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "method": "WHATSAPP"
}
```

**Request Body Parameters:**

| Parameter | Type | Required | Description | Valid Values |
|-----------|------|----------|-------------|--------------|
| `method` | string | Yes | The 2FA method to disable | `SMS`, `WHATSAPP`, `EMAIL`, `AUTHENTICATOR` |

**Response (Success - 200 OK):**
```json
{
  "message": "WHATSAPP 2FA has been disabled successfully",
  "method": "WHATSAPP",
  "disabled": true
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Human-readable success message |
| `method` | string | The method that was disabled (uppercase) |
| `disabled` | boolean | Confirmation that the method is now disabled |

**Error Responses:**

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired authentication token"
}
```

**400 Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Invalid 2FA method specified"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "No active 2FA method found for this user"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to disable 2FA method"
}
```

---

## Component Implementation

### State Management

Located in: `src/components/2FASettingsDrawer/index.tsx`

Each 2FA method has its own set of state variables:

```typescript
// SMS State
const [smsLoading, setSmsLoading] = useState(false);
const [smsSetupStep, setSmsSetupStep] = useState<'setup' | 'verify'>('setup');
const [smsCode, setSmsCode] = useState(['', '', '', '', '', '']);
const [smsSessionId, setSmsSessionId] = useState('');
const [smsCodeExpiresAt, setSmsCodeExpiresAt] = useState(0);
const [smsResendAvailable, setSmsResendAvailable] = useState(true);
const [smsResendCountdown, setSmsResendCountdown] = useState(0);

// WhatsApp State
const [whatsappLoading, setWhatsappLoading] = useState(false);
const [whatsappSetupStep, setWhatsappSetupStep] = useState<'setup' | 'verify'>('setup');
const [whatsappCode, setWhatsappCode] = useState(['', '', '', '', '', '']);
const [whatsappSessionId, setWhatsappSessionId] = useState('');
const [whatsappCodeExpiresAt, setWhatsappCodeExpiresAt] = useState(0);
const [whatsappResendAvailable, setWhatsappResendAvailable] = useState(true);
const [whatsappResendCountdown, setWhatsappResendCountdown] = useState(0);

// Email State
const [emailLoading, setEmailLoading] = useState(false);
const [emailSetupStep, setEmailSetupStep] = useState<'setup' | 'verify'>('setup');
const [emailCode, setEmailCode] = useState(['', '', '', '', '', '']);
const [emailSessionId, setEmailSessionId] = useState('');
const [emailCodeExpiresAt, setEmailCodeExpiresAt] = useState(0);
const [emailResendAvailable, setEmailResendAvailable] = useState(true);
const [emailResendCountdown, setEmailResendCountdown] = useState(0);

// Authenticator State
const [authenticatorLoading, setAuthenticatorLoading] = useState(false);
const [authenticatorSetupStep, setAuthenticatorSetupStep] = useState<'setup' | 'verify'>('setup');
const [authenticatorCode, setAuthenticatorCode] = useState(['', '', '', '', '', '']);
const [authenticatorSecret, setAuthenticatorSecret] = useState('');
const [authenticatorQRCode, setAuthenticatorQRCode] = useState('');

// Global 2FA State
const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'whatsapp' | 'email' | 'authenticator' | null>(null);
```

---

## Disable Handler Functions

### 1. Disable SMS Authentication

**Location:** Lines 794-819

```typescript
const handleDisableSMS = async () => {
  // Step 1: Show confirmation dialog
  if (!confirm('Are you sure you want to disable SMS authentication?')) {
    return;
  }

  // Step 2: Set loading state
  setSmsLoading(true);
  
  try {
    // Step 3: Call backend API
    const response = await apiAuth2FAService.disable2FAMethod('SMS');
    
    // Step 4: Verify response
    if (response.disabled) {
      // Step 5: Clear all SMS-related state
      setTwoFactorMethod(null);
      setSmsSetupStep('setup');
      setSmsCode(['', '', '', '', '', '']);
      setSmsSessionId('');
      setSmsCodeExpiresAt(0);
      setSmsResendAvailable(true);
      setSmsResendCountdown(0);
      
      // Step 6: Show success message
      alert('SMS authentication disabled successfully.');
    }
  } catch (error) {
    // Step 7: Handle errors
    console.error('Error disabling SMS 2FA:', error);
    alert('Failed to disable SMS authentication. Please try again.');
  } finally {
    // Step 8: Clear loading state
    setSmsLoading(false);
  }
};
```

**Flow Breakdown:**
1. **Confirmation** - User must confirm the action
2. **Loading State** - Button shows spinner, prevents duplicate clicks
3. **API Call** - Backend validates and disables the method
4. **Response Check** - Verify `disabled: true` in response
5. **State Cleanup** - Reset all SMS-specific variables
6. **User Feedback** - Success alert
7. **Error Handling** - Catch and display errors
8. **Cleanup** - Always clear loading state

---

### 2. Disable WhatsApp Authentication

**Location:** Lines 821-846

```typescript
const handleDisableWhatsApp = async () => {
  if (!confirm('Are you sure you want to disable WhatsApp authentication?')) {
    return;
  }

  setWhatsappLoading(true);
  try {
    const response = await apiAuth2FAService.disable2FAMethod('WHATSAPP');
    
    if (response.disabled) {
      setTwoFactorMethod(null);
      setWhatsappSetupStep('setup');
      setWhatsappCode(['', '', '', '', '', '']);
      setWhatsappSessionId('');
      setWhatsappCodeExpiresAt(0);
      setWhatsappResendAvailable(true);
      setWhatsappResendCountdown(0);
      alert('WhatsApp authentication disabled successfully.');
    }
  } catch (error) {
    console.error('Error disabling WhatsApp 2FA:', error);
    alert('Failed to disable WhatsApp authentication. Please try again.');
  } finally {
    setWhatsappLoading(false);
  }
};
```

**Same pattern as SMS**, but with WhatsApp-specific state variables.

---

### 3. Disable Email Authentication

**Location:** Lines 848-873

```typescript
const handleDisableEmail = async () => {
  if (!confirm('Are you sure you want to disable email authentication?')) {
    return;
  }

  setEmailLoading(true);
  try {
    const response = await apiAuth2FAService.disable2FAMethod('EMAIL');
    
    if (response.disabled) {
      setTwoFactorMethod(null);
      setEmailSetupStep('setup');
      setEmailCode(['', '', '', '', '', '']);
      setEmailSessionId('');
      setEmailCodeExpiresAt(0);
      setEmailResendAvailable(true);
      setEmailResendCountdown(0);
      alert('Email authentication disabled successfully.');
    }
  } catch (error) {
    console.error('Error disabling Email 2FA:', error);
    alert('Failed to disable email authentication. Please try again.');
  } finally {
    setEmailLoading(false);
  }
};
```

**Same pattern**, with Email-specific state variables.

---

### 4. Disable Authenticator App

**Location:** Lines 875-898

```typescript
const handleDisableAuthenticator = async () => {
  if (!confirm('Are you sure you want to disable authenticator app authentication?')) {
    return;
  }

  setAuthenticatorLoading(true);
  try {
    const response = await apiAuth2FAService.disable2FAMethod('AUTHENTICATOR');
    
    if (response.disabled) {
      setTwoFactorMethod(null);
      setAuthenticatorSetupStep('setup');
      setAuthenticatorCode(['', '', '', '', '', '']);
      setAuthenticatorSecret('');
      setAuthenticatorQRCode('');
      alert('Authenticator app authentication disabled successfully.');
    }
  } catch (error) {
    console.error('Error disabling Authenticator 2FA:', error);
    alert('Failed to disable authenticator authentication. Please try again.');
  } finally {
    setAuthenticatorLoading(false);
  }
};
```

**Same pattern**, with Authenticator-specific state variables (secret, QR code).

---

## Data Flow

### Complete Disable Flow

```
User clicks "Disable [Method]" button
    ↓
Confirmation dialog appears
    ↓
User confirms action
    ↓
Set loading state (button shows spinner)
    ↓
Call apiAuth2FAService.disable2FAMethod(METHOD)
    ↓
Backend validates request
    ↓
Backend disables method in database
    ↓
Backend returns success response
    ↓
Frontend verifies response.disabled === true
    ↓
Clear all method-specific state
    ↓
Set twoFactorMethod to null
    ↓
Show success alert
    ↓
Clear loading state
    ↓
UI updates (method shows as disabled)
```

### Error Flow

```
User clicks "Disable [Method]" button
    ↓
Confirmation dialog appears
    ↓
User confirms action
    ↓
Set loading state
    ↓
Call apiAuth2FAService.disable2FAMethod(METHOD)
    ↓
Backend error occurs (network, auth, validation)
    ↓
API throws error
    ↓
Catch block executes
    ↓
Log error to console
    ↓
Show error alert to user
    ↓
Clear loading state
    ↓
UI remains unchanged (method still active)
```

---

## Security Considerations

### Frontend Security

1. **Confirmation Dialog**
   - Prevents accidental clicks
   - Requires explicit user action
   - Cannot be bypassed programmatically

2. **Loading State**
   - Prevents duplicate requests
   - Disables button during operation
   - Visual feedback to user

3. **State Validation**
   - Verify `response.disabled === true`
   - Don't clear state on error
   - Maintain consistency

4. **Error Handling**
   - Don't expose sensitive error details
   - Log full errors to console (dev only)
   - Show user-friendly messages

### Backend Security

1. **Authentication Required**
   - All requests must include valid JWT token
   - Token must not be expired
   - User must own the 2FA method

2. **Authorization**
   - User can only disable their own 2FA
   - Validate user ID from token
   - Check method ownership

3. **Audit Logging**
   - Log all disable attempts
   - Include timestamp, user ID, method
   - Track success and failures

4. **Rate Limiting**
   - Limit disable requests per user
   - Prevent abuse/brute force
   - Implement cooldown periods

5. **Validation**
   - Verify method exists and is active
   - Check method type is valid
   - Ensure user has method enabled

### Best Practices

1. **Require Re-authentication**
   - Consider requiring password confirmation
   - Especially for critical accounts
   - Add extra security layer

2. **Backup Methods**
   - Warn if disabling last 2FA method
   - Suggest keeping backup codes
   - Prevent account lockout

3. **Notification**
   - Send email notification on disable
   - Alert user of security change
   - Include timestamp and IP address

4. **Recovery Options**
   - Provide account recovery process
   - Keep backup codes valid
   - Support contact support

---

## Usage Guide

### For End Users

#### How to Disable a 2FA Method

1. **Open 2FA Settings**
   - Navigate to Profile Settings
   - Click on "Two-Factor Authentication"

2. **Locate Active Method**
   - Find your currently active 2FA method
   - Look for the green checkmark or "Active" indicator

3. **Click Disable Button**
   - Click the red "Disable [Method] Authentication" button
   - Button is only visible if method is currently active

4. **Confirm Action**
   - Read the confirmation dialog carefully
   - Click "OK" to proceed or "Cancel" to abort

5. **Wait for Confirmation**
   - Button will show loading spinner
   - Wait for success message
   - Don't close the page during this time

6. **Verify Disable**
   - Success alert will appear
   - Method will no longer show as active
   - You can now enable a different method

#### Important Warnings

⚠️ **Before Disabling 2FA:**
- Make sure you have access to your password
- Consider keeping backup codes
- Understand the security implications
- Have a plan for re-enabling 2FA

⚠️ **After Disabling 2FA:**
- Your account is less secure
- Re-enable 2FA as soon as possible
- Consider using a different method
- Keep your password strong and unique

---

### For Developers

#### Adding a New 2FA Method

To add support for disabling a new 2FA method:

1. **Update TypeScript Types**
```typescript
// In apiAuth2FAService.ts
export interface Disable2FAMethodRequest {
  method: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'AUTHENTICATOR' | 'NEW_METHOD';
}
```

2. **Add State Variables**
```typescript
// In component
const [newMethodLoading, setNewMethodLoading] = useState(false);
const [newMethodSetupStep, setNewMethodSetupStep] = useState<'setup' | 'verify'>('setup');
// ... other method-specific state
```

3. **Create Disable Handler**
```typescript
const handleDisableNewMethod = async () => {
  if (!confirm('Are you sure you want to disable NEW_METHOD authentication?')) {
    return;
  }

  setNewMethodLoading(true);
  try {
    const response = await apiAuth2FAService.disable2FAMethod('NEW_METHOD');
    
    if (response.disabled) {
      setTwoFactorMethod(null);
      // Clear all NEW_METHOD-specific state
      alert('NEW_METHOD authentication disabled successfully.');
    }
  } catch (error) {
    console.error('Error disabling NEW_METHOD 2FA:', error);
    alert('Failed to disable NEW_METHOD authentication. Please try again.');
  } finally {
    setNewMethodLoading(false);
  }
};
```

4. **Add UI Button**
```tsx
<Button 
  type="primary" 
  size="large"
  onClick={handleDisableNewMethod}
  loading={newMethodLoading}
  block
  danger
>
  Disable NEW_METHOD Authentication
</Button>
```

---

#### Customizing Confirmation Dialog

**Replace `confirm()` with custom modal:**

```typescript
const [showDisableModal, setShowDisableModal] = useState(false);
const [methodToDisable, setMethodToDisable] = useState<string | null>(null);

const handleDisableSMS = async () => {
  setMethodToDisable('SMS');
  setShowDisableModal(true);
};

const confirmDisable = async () => {
  if (!methodToDisable) return;
  
  setShowDisableModal(false);
  setSmsLoading(true);
  
  try {
    const response = await apiAuth2FAService.disable2FAMethod(methodToDisable as any);
    // ... rest of logic
  } catch (error) {
    // ... error handling
  }
};

// In JSX
<Modal
  title="Disable 2FA Method"
  open={showDisableModal}
  onOk={confirmDisable}
  onCancel={() => setShowDisableModal(false)}
  okText="Disable"
  okButtonProps={{ danger: true }}
>
  <p>Are you sure you want to disable {methodToDisable} authentication?</p>
  <p>This will make your account less secure.</p>
</Modal>
```

---

#### Adding Email Notification

```typescript
const handleDisableSMS = async () => {
  if (!confirm('Are you sure you want to disable SMS authentication?')) {
    return;
  }

  setSmsLoading(true);
  try {
    const response = await apiAuth2FAService.disable2FAMethod('SMS');
    
    if (response.disabled) {
      // Clear state
      setTwoFactorMethod(null);
      // ... other state clearing
      
      // Send notification email
      await apiService.post('/notifications/2fa-disabled', {
        method: 'SMS',
        timestamp: new Date().toISOString()
      });
      
      alert('SMS authentication disabled successfully. A confirmation email has been sent.');
    }
  } catch (error) {
    console.error('Error disabling SMS 2FA:', error);
    alert('Failed to disable SMS authentication. Please try again.');
  } finally {
    setSmsLoading(false);
  }
};
```

---

## Troubleshooting

### Common Issues

#### 1. Disable Button Not Working

**Symptoms:** Clicking disable button does nothing

**Possible Causes:**
- Method is not actually active
- Button is in loading state
- JavaScript error in handler

**Debug Steps:**
```typescript
// Add console logs
const handleDisableSMS = async () => {
  console.log('Disable SMS clicked');
  
  if (!confirm('Are you sure you want to disable SMS authentication?')) {
    console.log('User cancelled');
    return;
  }
  
  console.log('User confirmed, calling API...');
  // ... rest of code
};
```

**Solutions:**
- Check browser console for errors
- Verify `twoFactorMethod === 'sms'`
- Ensure button is not disabled
- Check network tab for API calls

---

#### 2. API Call Fails

**Symptoms:** Error alert appears, method not disabled

**Possible Causes:**
- Network connectivity issues
- Authentication token expired
- Backend server error
- Invalid method type

**Debug Steps:**
```typescript
try {
  const response = await apiAuth2FAService.disable2FAMethod('SMS');
  console.log('API Response:', response);
} catch (error) {
  console.error('Full error:', error);
  console.error('Error response:', error.response);
  console.error('Error status:', error.response?.status);
  console.error('Error data:', error.response?.data);
}
```

**Solutions:**
- Check network connectivity
- Verify authentication token is valid
- Check backend server logs
- Ensure method name is uppercase ('SMS', not 'sms')
- Retry the request

---

#### 3. State Not Clearing

**Symptoms:** Method shows as disabled but state remains

**Possible Causes:**
- Missing state reset calls
- Error in state clearing logic
- Component not re-rendering

**Debug Steps:**
```typescript
if (response.disabled) {
  console.log('Before state clear:', {
    twoFactorMethod,
    smsSetupStep,
    smsCode,
    smsSessionId
  });
  
  setTwoFactorMethod(null);
  setSmsSetupStep('setup');
  setSmsCode(['', '', '', '', '', '']);
  setSmsSessionId('');
  // ... other state
  
  console.log('State clearing completed');
}
```

**Solutions:**
- Verify all state setters are called
- Check for typos in state variable names
- Ensure component re-renders after state change
- Use React DevTools to inspect state

---

#### 4. Loading State Stuck

**Symptoms:** Button shows spinner indefinitely

**Possible Causes:**
- API call never completes
- Error in finally block
- Network timeout

**Debug Steps:**
```typescript
const handleDisableSMS = async () => {
  console.log('Setting loading to true');
  setSmsLoading(true);
  
  try {
    console.log('Calling API...');
    const response = await apiAuth2FAService.disable2FAMethod('SMS');
    console.log('API call completed');
  } catch (error) {
    console.error('API call failed:', error);
  } finally {
    console.log('Setting loading to false');
    setSmsLoading(false);
  }
};
```

**Solutions:**
- Add timeout to API calls
- Ensure finally block always executes
- Check for network issues
- Verify loading state is properly managed

---

#### 5. Confirmation Dialog Not Showing

**Symptoms:** Method disables without confirmation

**Possible Causes:**
- Browser blocking confirm dialogs
- Typo in confirm condition
- Code bypassing confirmation

**Debug Steps:**
```typescript
const handleDisableSMS = async () => {
  const confirmed = confirm('Are you sure you want to disable SMS authentication?');
  console.log('User confirmed:', confirmed);
  
  if (!confirmed) {
    console.log('Aborting disable operation');
    return;
  }
  
  console.log('Proceeding with disable');
  // ... rest of code
};
```

**Solutions:**
- Check browser settings for dialog blocking
- Verify confirm() syntax is correct
- Use custom modal instead of native confirm
- Test in different browsers

---

## Testing

### Manual Testing Checklist

#### For Each Method (SMS, WhatsApp, Email, Authenticator)

**Setup:**
- [ ] Enable the 2FA method
- [ ] Verify method shows as active
- [ ] Verify disable button is visible

**Disable Flow:**
- [ ] Click disable button
- [ ] Verify confirmation dialog appears
- [ ] Click "Cancel" - verify nothing happens
- [ ] Click disable button again
- [ ] Click "OK" to confirm
- [ ] Verify loading spinner appears
- [ ] Wait for completion
- [ ] Verify success alert appears
- [ ] Verify method no longer shows as active
- [ ] Verify all method-specific state is cleared

**Error Handling:**
- [ ] Disconnect network
- [ ] Try to disable method
- [ ] Verify error alert appears
- [ ] Verify method remains active
- [ ] Verify loading state clears

**Edge Cases:**
- [ ] Try disabling when already disabled
- [ ] Try disabling with expired token
- [ ] Try rapid clicking disable button
- [ ] Try disabling multiple methods quickly

---

### Automated Testing

#### Unit Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TwoFASettingsDrawer } from './index';
import { apiAuth2FAService } from '../../services/apiAuth2FAService';

jest.mock('../../services/apiAuth2FAService');

describe('2FA Disable Method', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show confirmation dialog when disable is clicked', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    
    render(<TwoFASettingsDrawer visible={true} onClose={() => {}} user={mockUser} />);
    
    const disableButton = screen.getByText('Disable SMS Authentication');
    fireEvent.click(disableButton);
    
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to disable SMS authentication?');
  });

  it('should call API when user confirms', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    (apiAuth2FAService.disable2FAMethod as jest.Mock).mockResolvedValue({
      message: 'SMS 2FA has been disabled successfully',
      method: 'SMS',
      disabled: true
    });
    
    render(<TwoFASettingsDrawer visible={true} onClose={() => {}} user={mockUser} />);
    
    const disableButton = screen.getByText('Disable SMS Authentication');
    fireEvent.click(disableButton);
    
    await waitFor(() => {
      expect(apiAuth2FAService.disable2FAMethod).toHaveBeenCalledWith('SMS');
    });
  });

  it('should show error alert on API failure', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.spyOn(window, 'alert').mockImplementation();
    (apiAuth2FAService.disable2FAMethod as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<TwoFASettingsDrawer visible={true} onClose={() => {}} user={mockUser} />);
    
    const disableButton = screen.getByText('Disable SMS Authentication');
    fireEvent.click(disableButton);
    
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to disable SMS authentication. Please try again.');
    });
  });

  it('should clear state on successful disable', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    (apiAuth2FAService.disable2FAMethod as jest.Mock).mockResolvedValue({
      message: 'SMS 2FA has been disabled successfully',
      method: 'SMS',
      disabled: true
    });
    
    const { rerender } = render(<TwoFASettingsDrawer visible={true} onClose={() => {}} user={mockUser} />);
    
    const disableButton = screen.getByText('Disable SMS Authentication');
    fireEvent.click(disableButton);
    
    await waitFor(() => {
      // Verify state is cleared
      expect(screen.queryByText('Disable SMS Authentication')).not.toBeInTheDocument();
    });
  });
});
```

---

## API Reference Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/v1/auth/2fa/disable` | POST | Disable a 2FA method | Yes |

### Request Body
```typescript
{
  method: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'AUTHENTICATOR'
}
```

### Response
```typescript
{
  message: string;
  method: string;
  disabled: boolean;
}
```

### Status Codes
- `200` - Success
- `400` - Bad request (invalid method)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not found (method not active)
- `500` - Internal server error

---

## Best Practices

### Do's ✅

1. **Always show confirmation dialog**
   - Prevents accidental disabling
   - Gives user chance to reconsider

2. **Use loading states**
   - Provides visual feedback
   - Prevents duplicate requests

3. **Clear all related state**
   - Prevents data inconsistencies
   - Ensures clean slate for re-enabling

4. **Handle errors gracefully**
   - Show user-friendly messages
   - Log details for debugging

5. **Verify response**
   - Check `disabled: true` before clearing state
   - Don't trust network success alone

### Don'ts ❌

1. **Don't skip confirmation**
   - Even for "advanced" users
   - Security > convenience

2. **Don't ignore loading states**
   - Users need feedback
   - Prevents confusion

3. **Don't expose error details**
   - Keep technical errors in console
   - Show friendly messages to users

4. **Don't forget cleanup**
   - Always clear loading state
   - Use finally blocks

5. **Don't disable without backend**
   - Frontend state must match backend
   - Always call API first

---

## Future Enhancements

### Potential Features

1. **Password Confirmation**
   - Require password before disabling
   - Extra security layer
   - Prevent unauthorized disable

2. **Email Notification**
   - Send email when method disabled
   - Include timestamp and IP
   - Security audit trail

3. **Cooldown Period**
   - Prevent rapid enable/disable
   - Reduce abuse potential
   - Add rate limiting

4. **Backup Method Warning**
   - Warn if disabling last method
   - Suggest keeping backup codes
   - Prevent account lockout

5. **Audit Log UI**
   - Show history of 2FA changes
   - Display timestamps and IPs
   - User transparency

6. **Batch Operations**
   - Disable multiple methods at once
   - Useful for account migration
   - Admin functionality

---

## Support

### For Users
- **Help Center:** [Link to help documentation]
- **Support Email:** support@example.com
- **FAQ:** [Link to FAQ page]

### For Developers
- **API Documentation:** [Link to API docs]
- **GitHub Issues:** [Link to repository]
- **Slack Channel:** #2fa-development

---

## Changelog

### Version 1.0.0 (2026-02-05)
- Initial implementation
- Support for SMS, WhatsApp, Email, and Authenticator methods
- Confirmation dialogs
- Loading states
- Error handling
- API integration

---

## License

[Your License Information]

---

## Contributors

- [Your Name/Team]
- [Additional Contributors]

---

**Last Updated:** February 5, 2026  
**Document Version:** 1.0.0
