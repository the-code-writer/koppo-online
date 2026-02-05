# Two-Factor Authentication (2FA) Backup Codes

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

---

## Overview

The 2FA Backup Codes feature provides users with a set of one-time-use recovery codes that can be used to access their account when their primary 2FA method (SMS, WhatsApp, Email, or Authenticator App) is unavailable.

### Key Features
- **10 unique backup codes** per generation
- **8-character alphanumeric codes** (e.g., `A1B2C3D4`)
- **One-time use** - each code becomes invalid after use
- **Persistent storage** - codes are stored on the backend
- **Regeneration capability** - users can generate new codes (invalidates old ones)
- **Download functionality** - export codes as a text file
- **Copy to clipboard** - quick copy individual codes
- **Creation timestamps** - track when codes were generated

---

## Architecture

### File Structure
```
src/
├── components/
│   └── 2FASettingsDrawer/
│       ├── index.tsx                 # Main component
│       ├── styles.scss               # Component styles
│       └── 2FA-BackupCodes.md       # This documentation
├── services/
│   └── apiAuth2FAService.ts         # API service for 2FA operations
└── types/
    └── (BackupCode interface defined in apiAuth2FAService.ts)
```

### Technology Stack
- **React** (Functional Components with Hooks)
- **TypeScript** (Type-safe implementation)
- **Ant Design** (UI components)
- **Axios** (HTTP client via apiService)

---

## API Integration

### Service: `apiAuth2FAService`

Located at: `src/services/apiAuth2FAService.ts`

#### Class Structure
```typescript
class Auth2FAService {
  private static instance: Auth2FAService;
  
  public static getInstance(): Auth2FAService;
  async generateBackupCodes(): Promise<GenerateBackupCodesResponse>;
  async listBackupCodes(): Promise<ListBackupCodesResponse>;
}

export const apiAuth2FAService = Auth2FAService.getInstance();
```

### TypeScript Interfaces

```typescript
export interface BackupCode {
  code: string;           // The 8-character backup code
  createdAt: string;      // ISO 8601 timestamp
}

export interface GenerateBackupCodesResponse {
  message: string;        // Success message
  codes: string[];        // Array of 10 new codes
  count: number;          // Total count (always 10)
}

export interface ListBackupCodesResponse {
  message: string;        // Success message
  codes: BackupCode[];    // Array of active codes with metadata
  count: number;          // Number of remaining unused codes
}
```

---

## API Endpoints

### 1. Generate Backup Codes

**Endpoint:** `POST /auth/2fa/backup-codes/generate`

**Description:** Generates 10 new backup codes and invalidates any previously generated codes.

**Request:**
```http
POST /auth/2fa/backup-codes/generate
Content-Type: application/json
Authorization: Bearer <token>

{}
```

**Response:**
```json
{
  "message": "Backup codes generated successfully",
  "codes": [
    "A1B2C3D4",
    "E5F6G7H8",
    "I9J0K1L2",
    "M3N4O5P6",
    "Q7R8S9T0",
    "U1V2W3X4",
    "Y5Z6A7B8",
    "C9D0E1F2",
    "G3H4I5J6",
    "K7L8M9N0"
  ],
  "count": 10
}
```

**Status Codes:**
- `200 OK` - Codes generated successfully
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error during generation

**Implementation:**
```typescript
const response = await apiAuth2FAService.generateBackupCodes();
// response.codes contains the 10 new backup codes
```

**When to Use:**
- User clicks "Generate Recovery Codes" button
- User clicks "Regenerate" to replace existing codes
- First-time setup of backup codes

**Important Notes:**
- ⚠️ **Invalidates all previous codes** - warn users before regenerating
- Codes should be displayed immediately and user prompted to save them
- Consider showing a confirmation dialog before regeneration

---

### 2. List Active Backup Codes

**Endpoint:** `GET /auth/2fa/backup-codes/list`

**Description:** Retrieves all active (unused) backup codes for the authenticated user.

**Request:**
```http
GET /auth/2fa/backup-codes/list
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Active backup codes retrieved successfully",
  "codes": [
    {
      "code": "E5F6G7H8",
      "createdAt": "2026-02-05T13:00:00.000Z"
    },
    {
      "code": "I9J0K1L2",
      "createdAt": "2026-02-05T13:00:00.000Z"
    }
  ],
  "count": 9
}
```

**Status Codes:**
- `200 OK` - Codes retrieved successfully (may return empty array)
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - No backup codes exist for this user
- `500 Internal Server Error` - Server error during retrieval

**Implementation:**
```typescript
const response = await apiAuth2FAService.listBackupCodes();
// response.codes contains active codes with creation timestamps
// response.count shows how many codes remain unused
```

**When to Use:**
- When backup codes modal opens (automatic fetch)
- After user uses a code (to show remaining codes)
- To check if user has existing codes before showing generate button

**Important Notes:**
- Returns only **unused codes** (used codes are not included)
- `count` field shows remaining codes (useful for UI warnings)
- Empty array means user needs to generate new codes
- All codes in response have the same `createdAt` timestamp (generation time)

---

## Component Implementation

### State Management

Located in: `src/components/2FASettingsDrawer/index.tsx`

```typescript
// Backup Codes State
const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
const [backupCodesGenerated, setBackupCodesGenerated] = useState(false);
const [backupCodesLoading, setBackupCodesLoading] = useState(false);
const [backupCodesModalVisible, setBackupCodesModalVisible] = useState(false);
```

### Key Functions

#### 1. Generate Backup Codes
```typescript
const generateBackupCodes = async () => {
  setBackupCodesLoading(true);
  
  try {
    const response = await apiAuth2FAService.generateBackupCodes();
    
    // Convert string codes to BackupCode objects with current timestamp
    const codesWithTimestamp: BackupCode[] = response.codes.map(code => ({
      code,
      createdAt: new Date().toISOString()
    }));
    
    setBackupCodes(codesWithTimestamp);
    setBackupCodesGenerated(true);
    
    alert('Backup codes generated successfully! Please save them in a secure location.');
  } catch (error) {
    console.error('Error generating backup codes:', error);
    alert('Failed to generate backup codes. Please try again.');
  } finally {
    setBackupCodesLoading(false);
  }
};
```

**Flow:**
1. Set loading state
2. Call API to generate codes
3. Transform response to include timestamps
4. Update state with new codes
5. Show success message
6. Handle errors gracefully

---

#### 2. Fetch Existing Codes (useEffect)
```typescript
useEffect(() => {
  const fetchBackupCodes = async () => {
    if (backupCodesModalVisible && !backupCodesGenerated) {
      setBackupCodesLoading(true);
      try {
        const response = await apiAuth2FAService.listBackupCodes();
        
        if (response.codes && response.codes.length > 0) {
          setBackupCodes(response.codes);
          setBackupCodesGenerated(true);
        }
      } catch (error) {
        console.error('Error fetching backup codes:', error);
        // Don't show error alert, just leave it empty to allow generation
      } finally {
        setBackupCodesLoading(false);
      }
    }
  };

  fetchBackupCodes();
}, [backupCodesModalVisible, backupCodesGenerated]);
```

**Trigger:** Runs when modal opens

**Flow:**
1. Check if modal is visible and codes not already loaded
2. Fetch existing codes from backend
3. If codes exist, display them
4. If no codes or error, show generation screen
5. Silent error handling (allows fresh generation)

---

#### 3. Download Backup Codes
```typescript
const downloadBackupCodes = () => {
  if (backupCodes.length === 0) {
    alert('No backup codes to download. Please generate backup codes first.');
    return;
  }

  const content = `Two-Factor Authentication Backup Codes\n` +
    `Generated on: ${new Date(backupCodes[0].createdAt).toLocaleString()}\n` +
    `User: ${user?.email || 'N/A'}\n` +
    `\nKeep these codes in a safe and secure location.\n` +
    `Each code can only be used once.\n` +
    `\nBackup Codes:\n` +
    backupCodes.map((item, index) => `${index + 1}. ${item.code}`).join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `2fa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

**Output Format:**
```
Two-Factor Authentication Backup Codes
Generated on: 2/5/2026, 1:00:00 PM
User: user@example.com

Keep these codes in a safe and secure location.
Each code can only be used once.

Backup Codes:
1. A1B2C3D4
2. E5F6G7H8
3. I9J0K1L2
...
```

---

#### 4. Regenerate Backup Codes
```typescript
const regenerateBackupCodes = () => {
  if (confirm('Are you sure you want to regenerate backup codes? The old codes will no longer be valid.')) {
    generateBackupCodes();
  }
};
```

**Safety Feature:** Confirmation dialog prevents accidental regeneration

---

## User Interface

### Modal Structure

The backup codes feature uses an Ant Design Drawer component with two states:

#### State 1: Setup/Introduction Screen
Shown when:
- No codes exist
- User hasn't generated codes yet

**Elements:**
- Download icon
- "Backup Codes" title
- Description text
- Feature benefits (Offline Recovery, Secure & Unique)
- "Generate Recovery Codes" button

#### State 2: Codes Display Screen
Shown when:
- Codes have been generated
- Existing codes were fetched

**Elements:**
- Success checkmark icon
- "Codes Generated" title
- Warning text about one-time use
- Grid of backup code cards (2 columns)
- Download button
- Regenerate button

---

### Code Card Design

Each backup code is displayed in a modern card with:

**Visual Features:**
- **Gradient background** (`#f8f9fa` to `#e9ecef`)
- **2px border** (gray, turns blue on hover)
- **12px border radius** (rounded corners)
- **Card number** (#1, #2, etc.) in top-left corner
- **Monospace font** for the code (Monaco, Menlo, Courier New)
- **Copy icon** on the right
- **Creation date** at the bottom
- **Hover effects:**
  - Lifts up 2px (`translateY(-2px)`)
  - Blue border (`#00adff`)
  - Drop shadow (`0 4px 12px rgba(0,0,0,0.1)`)

**Layout:**
```
┌─────────────────────────────┐
│ #1                          │
│                             │
│  A1B2C3D4            [📋]   │
│                             │
│  Created: 2/5/2026          │
└─────────────────────────────┘
```

**Interaction:**
- **Click anywhere** on card to copy code
- **Visual feedback** via alert message
- **Smooth transitions** (0.2s ease)

---

### Grid Layout

```css
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 12px;
```

**Responsive Behavior:**
- 2 columns on desktop
- Adapts to drawer width (400px)
- 12px gap between cards

---

## Data Flow

### 1. Modal Opens
```
User clicks "Backup Codes" button
    ↓
setBackupCodesModalVisible(true)
    ↓
useEffect triggers
    ↓
apiAuth2FAService.listBackupCodes()
    ↓
Backend returns existing codes (or empty)
    ↓
Display codes OR show generation screen
```

### 2. Generate New Codes
```
User clicks "Generate Recovery Codes"
    ↓
generateBackupCodes() called
    ↓
setBackupCodesLoading(true)
    ↓
apiAuth2FAService.generateBackupCodes()
    ↓
Backend generates 10 new codes
    ↓
Transform to BackupCode[] with timestamps
    ↓
setBackupCodes(codesWithTimestamp)
    ↓
setBackupCodesGenerated(true)
    ↓
Display codes in grid
    ↓
User can copy/download
```

### 3. Copy Code
```
User clicks on code card
    ↓
navigator.clipboard.writeText(item.code)
    ↓
Alert: "Code #X copied to clipboard!"
```

### 4. Download Codes
```
User clicks "Download as Text File"
    ↓
downloadBackupCodes() called
    ↓
Generate formatted text content
    ↓
Create Blob and download link
    ↓
Trigger download
    ↓
File saved: 2fa-backup-codes-2026-02-05.txt
```

---

## Security Considerations

### Backend Security
1. **Authentication Required**
   - All endpoints require valid JWT token
   - Codes are user-specific (no cross-user access)

2. **Code Generation**
   - Cryptographically secure random generation
   - 8-character alphanumeric (62^8 = 218 trillion combinations)
   - One-time use enforcement

3. **Code Storage**
   - Codes should be hashed in database (like passwords)
   - Store creation timestamp for audit trails
   - Mark codes as "used" rather than deleting

4. **Rate Limiting**
   - Limit generation requests (e.g., once per hour)
   - Prevent brute force attempts on code verification

### Frontend Security
1. **No Persistent Storage**
   - Codes are never stored in localStorage/sessionStorage
   - Only kept in component state (memory)
   - Cleared when modal closes

2. **HTTPS Required**
   - All API calls must use HTTPS
   - Prevents man-in-the-middle attacks

3. **User Warnings**
   - Alert before regeneration (invalidates old codes)
   - Prompt to save codes securely
   - Emphasize one-time use

### Best Practices
1. **User Education**
   - Explain what backup codes are for
   - Warn about keeping them secure
   - Suggest offline storage (not cloud)

2. **Code Lifecycle**
   - Generate → Display → Save → Use → Invalidate
   - Track usage for security audits
   - Notify user when codes are running low

3. **Recovery Process**
   - Backup codes should bypass 2FA
   - Log all backup code usage
   - Consider requiring password + backup code

---

## Usage Guide

### For End Users

#### Generating Backup Codes

1. **Open 2FA Settings**
   - Navigate to Profile Settings
   - Click on "Two-Factor Authentication"

2. **Access Backup Codes**
   - Scroll to "Backup Codes" option
   - Click the "Backup Codes" button

3. **Generate Codes**
   - Click "Generate Recovery Codes" button
   - Wait for codes to be generated
   - **Important:** Save these codes immediately!

4. **Save Your Codes**
   - **Option 1:** Click "Download as Text File"
     - Saves as `2fa-backup-codes-YYYY-MM-DD.txt`
     - Store file in secure location (not cloud)
   
   - **Option 2:** Click individual codes to copy
     - Paste into password manager
     - Or write down on paper
   
   - **Option 3:** Take a screenshot
     - Store securely (encrypted folder)

5. **Store Securely**
   - ✅ Password manager (encrypted vault)
   - ✅ Offline text file (encrypted drive)
   - ✅ Physical paper (safe/lockbox)
   - ❌ Cloud storage (Google Drive, Dropbox)
   - ❌ Email to yourself
   - ❌ Unencrypted notes app

#### Using a Backup Code

1. **When You Need It**
   - Lost phone (can't receive SMS/WhatsApp)
   - Authenticator app unavailable
   - Email access issues
   - Emergency account access

2. **Login Process**
   - Enter username and password
   - When prompted for 2FA code
   - Select "Use backup code" option
   - Enter one of your 8-character codes
   - Code will be validated and invalidated

3. **After Using a Code**
   - Code becomes invalid (one-time use)
   - You have 9 remaining codes
   - Consider generating new codes when low

#### Regenerating Codes

**When to Regenerate:**
- Running low on codes (< 3 remaining)
- Suspect codes may be compromised
- Lost access to saved codes
- Regular security maintenance

**How to Regenerate:**
1. Open Backup Codes modal
2. Click "Regenerate" button
3. Confirm warning dialog
4. **All old codes become invalid**
5. Save new codes immediately

---

### For Developers

#### Adding Backup Code Support

1. **Import the Service**
```typescript
import { apiAuth2FAService, BackupCode } from '../../services/apiAuth2FAService';
```

2. **Set Up State**
```typescript
const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
const [loading, setLoading] = useState(false);
```

3. **Fetch Codes**
```typescript
const fetchCodes = async () => {
  setLoading(true);
  try {
    const response = await apiAuth2FAService.listBackupCodes();
    setBackupCodes(response.codes);
  } catch (error) {
    console.error('Error fetching codes:', error);
  } finally {
    setLoading(false);
  }
};
```

4. **Generate Codes**
```typescript
const generateCodes = async () => {
  setLoading(true);
  try {
    const response = await apiAuth2FAService.generateBackupCodes();
    const codesWithTimestamp = response.codes.map(code => ({
      code,
      createdAt: new Date().toISOString()
    }));
    setBackupCodes(codesWithTimestamp);
  } catch (error) {
    console.error('Error generating codes:', error);
  } finally {
    setLoading(false);
  }
};
```

#### Customizing the UI

**Change Grid Columns:**
```typescript
gridTemplateColumns: 'repeat(3, 1fr)' // 3 columns instead of 2
```

**Modify Card Colors:**
```typescript
background: 'linear-gradient(135deg, #your-color-1, #your-color-2)'
border: '2px solid #your-border-color'
```

**Adjust Hover Effects:**
```typescript
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'scale(1.05)'; // Scale instead of lift
  e.currentTarget.style.borderColor = '#your-accent-color';
}}
```

#### Error Handling

**Network Errors:**
```typescript
try {
  const response = await apiAuth2FAService.generateBackupCodes();
} catch (error) {
  if (error.response?.status === 401) {
    // Redirect to login
  } else if (error.response?.status === 429) {
    // Rate limit exceeded
    alert('Too many requests. Please try again later.');
  } else {
    // Generic error
    alert('Failed to generate codes. Please try again.');
  }
}
```

**Validation:**
```typescript
// Check if codes exist before operations
if (backupCodes.length === 0) {
  alert('No backup codes available. Please generate codes first.');
  return;
}

// Validate code format (8 alphanumeric characters)
const isValidCode = (code: string) => /^[A-Z0-9]{8}$/.test(code);
```

---

## Troubleshooting

### Common Issues

#### 1. Codes Not Loading
**Symptoms:** Modal opens but shows loading spinner indefinitely

**Possible Causes:**
- Network connectivity issues
- Backend server down
- Authentication token expired
- CORS issues

**Solutions:**
```typescript
// Add timeout to fetch
const fetchWithTimeout = async (timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await apiAuth2FAService.listBackupCodes();
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};
```

#### 2. Generate Button Not Working
**Symptoms:** Clicking generate does nothing or shows error

**Possible Causes:**
- Rate limiting (too many requests)
- Server error during generation
- Invalid authentication

**Debug Steps:**
1. Check browser console for errors
2. Verify network tab shows request
3. Check response status code
4. Verify token is valid

**Solution:**
```typescript
// Add detailed error logging
try {
  const response = await apiAuth2FAService.generateBackupCodes();
} catch (error) {
  console.error('Generation failed:', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data
  });
  
  // Show user-friendly message
  if (error.response?.status === 429) {
    alert('You can only generate codes once per hour. Please try again later.');
  }
}
```

#### 3. Copy to Clipboard Fails
**Symptoms:** Clicking code doesn't copy or shows error

**Possible Causes:**
- Browser doesn't support Clipboard API
- Page not served over HTTPS
- User denied clipboard permission

**Solution:**
```typescript
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('Code copied!');
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Code copied!');
    } catch (err) {
      alert('Failed to copy. Please copy manually: ' + text);
    }
    document.body.removeChild(textArea);
  }
};
```

#### 4. Download Not Working
**Symptoms:** Download button doesn't trigger file download

**Possible Causes:**
- Browser blocking downloads
- Popup blocker active
- Blob creation failed

**Solution:**
```typescript
// Add error handling to download
try {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Ensure link is in DOM for Firefox
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
} catch (error) {
  console.error('Download failed:', error);
  alert('Download failed. Please try copying codes manually.');
}
```

#### 5. Codes Show Wrong Date
**Symptoms:** Creation date shows incorrect time or "Invalid Date"

**Possible Causes:**
- Invalid ISO 8601 timestamp from backend
- Timezone conversion issues
- Missing createdAt field

**Solution:**
```typescript
// Validate and format date safely
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return date.toLocaleDateString();
  } catch (error) {
    return 'Unknown date';
  }
};

// Usage
<div>Created: {formatDate(item.createdAt)}</div>
```

---

## Testing

### Manual Testing Checklist

#### Generation Flow
- [ ] Open backup codes modal
- [ ] Click "Generate Recovery Codes"
- [ ] Verify 10 codes are displayed
- [ ] Check codes are 8 characters each
- [ ] Verify all codes are unique
- [ ] Confirm creation date is shown
- [ ] Test copy functionality on each code
- [ ] Download codes as text file
- [ ] Verify file contents are correct

#### Fetch Flow
- [ ] Generate codes
- [ ] Close modal
- [ ] Reopen modal
- [ ] Verify codes are fetched from backend
- [ ] Check codes match previously generated
- [ ] Verify creation date is preserved

#### Regeneration Flow
- [ ] Generate initial codes
- [ ] Click "Regenerate" button
- [ ] Confirm warning dialog appears
- [ ] Accept confirmation
- [ ] Verify new codes are different
- [ ] Check old codes are invalidated
- [ ] Verify new creation date

#### Error Handling
- [ ] Test with network disconnected
- [ ] Test with invalid auth token
- [ ] Test with backend down
- [ ] Verify error messages are user-friendly
- [ ] Check console for detailed errors

#### UI/UX
- [ ] Test hover effects on code cards
- [ ] Verify responsive layout
- [ ] Check loading states
- [ ] Test modal open/close
- [ ] Verify button states (enabled/disabled)

### Automated Testing

```typescript
// Example Jest test
describe('Backup Codes', () => {
  it('should generate 10 codes', async () => {
    const response = await apiAuth2FAService.generateBackupCodes();
    expect(response.codes).toHaveLength(10);
    expect(response.count).toBe(10);
  });

  it('should format codes correctly', async () => {
    const response = await apiAuth2FAService.generateBackupCodes();
    response.codes.forEach(code => {
      expect(code).toMatch(/^[A-Z0-9]{8}$/);
    });
  });

  it('should fetch existing codes', async () => {
    const response = await apiAuth2FAService.listBackupCodes();
    expect(Array.isArray(response.codes)).toBe(true);
    response.codes.forEach(item => {
      expect(item).toHaveProperty('code');
      expect(item).toHaveProperty('createdAt');
    });
  });
});
```

---

## API Reference Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/auth/2fa/backup-codes/generate` | POST | Generate 10 new backup codes | Yes |
| `/auth/2fa/backup-codes/list` | GET | List active backup codes | Yes |

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Response Codes
- `200` - Success
- `401` - Unauthorized (invalid/missing token)
- `404` - Not found (no codes exist)
- `429` - Too many requests (rate limited)
- `500` - Internal server error

---

## Future Enhancements

### Potential Features
1. **Code Usage Tracking**
   - Show which codes have been used
   - Display usage timestamp
   - Track remaining codes count

2. **Low Code Warning**
   - Alert when < 3 codes remain
   - Prompt to regenerate
   - Email notification

3. **Print Functionality**
   - Printer-friendly format
   - QR codes for mobile scanning
   - Branded PDF export

4. **Batch Operations**
   - Generate multiple sets
   - Export to password managers
   - Bulk invalidation

5. **Enhanced Security**
   - Require password confirmation before viewing
   - Time-limited code display
   - Automatic regeneration schedule

6. **Analytics**
   - Track generation frequency
   - Monitor usage patterns
   - Security audit logs

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
- Generate and list backup codes
- Modern card-based UI
- Copy and download functionality
- API integration with backend

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
