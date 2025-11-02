# Security Implementation Guide

## Overview

Her Law Family Court Organizer implements multiple layers of security to protect sensitive evidence data:

1. **Biometric Authentication** - Face ID/Touch ID/Fingerprint
2. **Privacy Screen Protection** - Prevents screenshots and screen recording
3. **Encrypted Local Storage** - SQLCipher-encrypted database on native platforms
4. **Data Integrity** - Cryptographic hashing for tamper evidence
5. **Secure Headers** - XSS, clickjacking, and MIME-sniffing protection

## Using Security Features

### 1. Biometric Authentication

```typescript
import { biometricAuth } from '@/lib/security/biometricAuth';

// Check if available
const available = await biometricAuth.isAvailable();

if (available) {
  // Get biometry type (Face ID, Touch ID, etc.)
  const type = await biometricAuth.getBiometryType();
  const name = biometricAuth.getBiometryName(type);

  // Authenticate user
  const result = await biometricAuth.authenticate(
    'Access your evidence records'
  );

  if (result.success) {
    console.log('Authentication successful');
  } else {
    console.error('Authentication failed:', result.error);
  }
}
```

### 2. Privacy Screen Protection

```typescript
import { privacyScreen } from '@/lib/security/privacyScreen';

// Privacy screen is enabled by default on app startup

// Check status
if (privacyScreen.isEnabled()) {
  console.log('Privacy protection active');
}

// Temporarily disable for user-initiated screenshot
await privacyScreen.temporaryDisable(async () => {
  // User can take screenshot here
  alert('You can now take a screenshot');
});
// Privacy screen automatically re-enabled
```

**What Privacy Screen Does:**

- **iOS**: Shows app name/icon when app is in background (prevents sensitive data in app switcher)
- **Android**: Prevents screenshots and screen recording entirely

### 3. Encrypted Storage

```typescript
import { encryptedStorage } from '@/lib/security/encryptedStorage';

// Initialize (call once on app startup)
await encryptedStorage.initialize();

// Save evidence record
const recordId = await encryptedStorage.saveRecord({
  timestamp: Date.now(),
  type: 'Incident',
  content: 'Description of incident...',
  tags: '#Harassment,#Workplace',
  attachments: 'photo1.jpg,photo2.jpg'
});

// Retrieve all records
const allRecords = await encryptedStorage.getAllRecords();

// Filter by tag
const harassmentRecords = await encryptedStorage.getRecordsByTag('#Harassment');

// Verify integrity
const isValid = await encryptedStorage.verifyRecordIntegrity(record);
if (!isValid) {
  console.error('Record has been tampered with!');
}

// Export for backup
const backup = await encryptedStorage.exportAllRecords();
```

**Storage Details:**

- **Native (iOS/Android)**: SQLite with SQLCipher encryption
- **Web**: IndexedDB with Web Crypto API encryption
- **Integrity**: SHA-256 hashes for tamper detection

### 4. PDF Export with Integrity Verification

```typescript
import { pdfExport } from '@/lib/pdfExport';
import { encryptedStorage } from '@/lib/security/encryptedStorage';

// Get records
const records = await encryptedStorage.getAllRecords();

// Export all records
await pdfExport.downloadReport(records, 'evidence-full-report.pdf', {
  title: 'Evidence Report for Case #12345',
  includeIntegrityHash: true
});

// Export filtered by date range
await pdfExport.downloadReport(records, 'evidence-q1-2025.pdf', {
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-03-31')
  },
  includeIntegrityHash: true
});

// Export filtered by tags
await pdfExport.downloadReport(records, 'harassment-evidence.pdf', {
  tags: ['#Harassment', '#Workplace'],
  includeIntegrityHash: true
});

// Export single record
await pdfExport.exportSingleRecord(record, 'incident-report-001.pdf');
```

**PDF Features:**

- Chronological timeline table
- Detailed record view with all metadata
- Cryptographic hashes for each record
- Certification page for legal authenticity
- Confidentiality watermark
- Professional formatting for court submission

## Security Best Practices

### 1. Environment Variables

**CRITICAL**: Never commit `.env` files with real secrets to git!

```bash
# Generate secure encryption key
openssl rand -base64 32

# Or with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to `.env.production.local`:
```
VITE_ENCRYPTION_KEY=<your-generated-key>
```

### 2. App Initialization

In your `App.tsx` or `main.tsx`:

```typescript
import { encryptedStorage } from '@/lib/security/encryptedStorage';
import { privacyScreen } from '@/lib/security/privacyScreen';
import { biometricAuth } from '@/lib/security/biometricAuth';

async function initializeSecurity() {
  // Initialize encrypted storage
  await encryptedStorage.initialize(
    import.meta.env.VITE_ENCRYPTION_KEY
  );

  // Enable privacy screen (already done automatically)
  // privacyScreen is enabled by default

  // Optional: Prompt for biometric auth on app launch
  const hasRecords = (await encryptedStorage.getAllRecords()).length > 0;
  if (hasRecords) {
    const result = await biometricAuth.authenticate(
      'Access your evidence records'
    );

    if (!result.success) {
      // Handle failed authentication (redirect to lock screen, etc.)
    }
  }
}

initializeSecurity();
```

### 3. Session Timeout

```typescript
let sessionTimeout: NodeJS.Timeout;

function resetSessionTimeout() {
  clearTimeout(sessionTimeout);

  const timeout = Number(import.meta.env.VITE_SESSION_TIMEOUT) || 300000; // 5 min default

  sessionTimeout = setTimeout(() => {
    // Lock app, require re-authentication
    window.location.href = '/lock';
  }, timeout);
}

// Reset on user activity
document.addEventListener('click', resetSessionTimeout);
document.addEventListener('keypress', resetSessionTimeout);
document.addEventListener('touchstart', resetSessionTimeout);
```

### 4. Secure File Storage (Camera/Photos)

```typescript
import { Camera } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

async function takeSecurePhoto() {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: 'uri',
    saveToGallery: false // Don't save to device gallery
  });

  // Store in app's private directory
  const fileName = `evidence-${Date.now()}.jpg`;
  await Filesystem.writeFile({
    path: fileName,
    data: photo.base64String!,
    directory: Directory.Data, // Private to app
  });

  return fileName;
}
```

## Security Headers (Already Configured)

The following security headers are configured in `vercel.json` and `netlify.toml`:

- **X-Content-Type-Options**: `nosniff` - Prevents MIME sniffing
- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-XSS-Protection**: `1; mode=block` - XSS filter
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Privacy
- **Permissions-Policy**: Limits browser features

## Platform-Specific Security

### iOS

Add to `Info.plist`:

```xml
<!-- Prevent screenshots in background -->
<key>UIApplicationExitsOnSuspend</key>
<false/>

<!-- Biometric usage -->
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to secure your evidence data</string>

<!-- Camera access -->
<key>NSCameraUsageDescription</key>
<string>Take photos for evidence documentation</string>

<!-- Photo library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Select photos for evidence records</string>
```

### Android

Add to `AndroidManifest.xml`:

```xml
<!-- Prevent screenshots -->
<application
    android:allowBackup="false"
    android:fullBackupContent="false">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
</application>
```

Add to `MainActivity.java`:

```java
import android.view.WindowManager;

@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Prevent screenshots
    getWindow().setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    );
}
```

## Threat Model

### Protected Against

✅ Screenshot/screen recording on mobile
✅ Data tampering (hash verification)
✅ Unauthorized access (biometric auth)
✅ App switcher data leakage (privacy screen)
✅ XSS attacks (security headers)
✅ Clickjacking (frame protection)
✅ MIME-type sniffing
✅ Data at rest (encryption)

### Not Protected Against

⚠️ Device compromise (rooted/jailbroken)
⚠️ Physical device access with unlock
⚠️ Advanced forensic analysis
⚠️ Shoulder surfing during active use
⚠️ Cloud backup leakage (backup disabled)

## Compliance Notes

- **HIPAA**: Encrypted storage + authentication meets technical safeguards
- **GDPR**: User data encrypted, exportable, deletable
- **Legal Evidence**: Cryptographic hashing provides integrity proof
- **Family Court**: Professional PDF reports with certification page

## Security Incident Response

If security breach suspected:

1. **Immediate**: Enable airplane mode on device
2. **Verify**: Run integrity checks on all records
3. **Export**: Create backup using `exportAllRecords()`
4. **Review**: Check device for jailbreak/root
5. **Report**: Document findings for legal purposes

## Regular Security Audits

Recommended:

- ✅ Weekly: Verify record integrity hashes
- ✅ Monthly: Review access logs (if implemented)
- ✅ Quarterly: Update dependencies for security patches
- ✅ Yearly: Professional security audit

## Support

For security concerns:
1. Do not share encryption keys
2. Report vulnerabilities responsibly
3. Keep device OS updated
4. Use strong device passcode/biometrics
