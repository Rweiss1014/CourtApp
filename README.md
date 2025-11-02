# Her Law Family Court Organizer

A secure, privacy-focused evidence documentation app designed for individuals navigating family law cases. Document incidents, organize evidence with tags, and generate court-ready PDF reports — all while keeping your data encrypted and private on your device.

## Features

### 🔒 Security & Privacy
- **Biometric Authentication**: Face ID, Touch ID, or fingerprint protection
- **Encrypted Storage**: SQLCipher-encrypted database on mobile, Web Crypto API on web
- **Privacy Screen**: Prevents screenshots and screen recording on mobile
- **No Cloud Sync**: Your data never leaves your device
- **Integrity Verification**: Cryptographic hashing proves data hasn't been tampered with

### 📱 Evidence Documentation
- **Timestamp Everything**: Automatic timestamping of all entries
- **Photo Attachments**: Add visual evidence securely
- **Tag Organization**: Categorize with hashtags (#Harassment, #Custody, #Financial, etc.)
- **Search & Filter**: Find records by date, tag, or content
- **Offline-First**: Works without internet connection

### 📄 Professional Reports
- **PDF Export**: Generate court-ready evidence reports
- **Timeline View**: Chronological listing of all evidence
- **Integrity Hashes**: Each record includes cryptographic hash
- **Certification Page**: Professional formatting for legal submission
- **Filter by Date/Tags**: Export only relevant evidence

### 🌐 Multi-Platform
- **Web**: PWA with offline support (Vercel/Netlify)
- **iOS**: Native app with Face ID/Touch ID
- **Android**: Native app with fingerprint/biometric auth

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Mobile Development

```bash
# Build web assets
npm run build

# Add iOS (macOS only)
npm run cap:add:ios

# Add Android
npm run cap:add:android

# Sync code to native platforms
npm run cap:sync

# Open in Xcode
npm run cap:open:ios

# Open in Android Studio
npm run cap:open:android
```

## Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide for web, iOS, and Android
- **[BUILD_GUIDE.md](BUILD_GUIDE.md)** - Detailed build instructions and app store submission
- **[SECURITY.md](SECURITY.md)** - Security implementation and best practices
- **[ASSETS.md](ASSETS.md)** - Asset generation guide (icons, screenshots, etc.)

## Project Structure

```
Verity/
├── src/
│   ├── components/        # React components
│   ├── lib/
│   │   ├── security/      # Security implementations
│   │   │   ├── biometricAuth.ts
│   │   │   ├── encryptedStorage.ts
│   │   │   └── privacyScreen.ts
│   │   ├── pdfExport.ts   # PDF generation
│   │   ├── hashtagTaxonomy.ts
│   │   └── reportGenerator.ts
│   └── main.tsx           # App entry point
├── public/
│   ├── icons/             # PWA icons
│   ├── manifest.json      # PWA manifest
│   └── _redirects         # Netlify redirects
├── android/               # Android native project
├── ios/                   # iOS native project
├── capacitor.config.ts    # Capacitor configuration
├── vite.config.ts         # Vite configuration
├── vercel.json            # Vercel deployment config
├── netlify.toml           # Netlify deployment config
└── package.json
```

## Environment Variables

Create `.env.production.local`:

```bash
# Generate secure key:
# openssl rand -base64 32

VITE_APP_NAME="Her Law Family Court Organizer"
VITE_APP_VERSION="0.1.0"
VITE_APP_ENVIRONMENT="production"
VITE_ENCRYPTION_KEY="<your-secure-32-byte-key>"
VITE_SESSION_TIMEOUT=300000
VITE_LOCAL_STORAGE_ENCRYPTED=true
VITE_ENABLE_BIOMETRIC_AUTH=true
VITE_ENABLE_PRIVACY_SCREEN=true
VITE_ENABLE_PDF_EXPORT=true
```

## Usage Examples

### Initialize Security

```typescript
import { encryptedStorage } from '@/lib/security/encryptedStorage';
import { biometricAuth } from '@/lib/security/biometricAuth';
import { privacyScreen } from '@/lib/security/privacyScreen';

// Initialize on app startup
await encryptedStorage.initialize();

// Authenticate user
const result = await biometricAuth.authenticate();
if (!result.success) {
  // Handle authentication failure
}
```

### Save Evidence Record

```typescript
const recordId = await encryptedStorage.saveRecord({
  timestamp: Date.now(),
  type: 'Incident',
  content: 'Detailed description of incident...',
  tags: '#Harassment,#Workplace,#Verbal',
  attachments: 'photo_001.jpg'
});
```

### Generate PDF Report

```typescript
import { pdfExport } from '@/lib/pdfExport';

const records = await encryptedStorage.getAllRecords();

await pdfExport.downloadReport(records, 'evidence-report.pdf', {
  title: 'Evidence Report for Case #12345',
  tags: ['#Harassment'],
  includeIntegrityHash: true
});
```

## Deployment

### Web (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard.

### Web (Netlify)

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

Set environment variables in Netlify dashboard.

### iOS

1. Open in Xcode: `npm run cap:open:ios`
2. Configure signing & capabilities
3. Archive: Product → Archive
4. Upload to App Store Connect
5. Submit for review

### Android

1. Generate release key (see [BUILD_GUIDE.md](BUILD_GUIDE.md))
2. Configure signing
3. Build AAB: `cd android && ./gradlew bundleRelease`
4. Upload to Google Play Console
5. Submit for review

## Security Considerations

### Protected Against
✅ Screenshot/screen recording
✅ Data tampering (hash verification)
✅ Unauthorized access (biometric)
✅ App switcher data leakage
✅ XSS attacks
✅ Clickjacking
✅ Data at rest (encryption)

### NOT Protected Against
⚠️ Device compromise (rooted/jailbroken)
⚠️ Physical device access with unlock
⚠️ Shoulder surfing during use

See [SECURITY.md](SECURITY.md) for complete threat model.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Mobile**: Capacitor 6
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **Database**: SQLite with SQLCipher (mobile), IndexedDB (web)
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Biometrics**: @aparajita/capacitor-biometric-auth
- **Privacy**: @capacitor-community/privacy-screen
- **State**: React Hooks
- **PWA**: Vite PWA Plugin

## Dependencies

```json
{
  "dependencies": {
    "@capacitor/core": "^6.2.0",
    "@capacitor/camera": "^6.0.2",
    "@capacitor/filesystem": "^6.0.1",
    "@capacitor-community/sqlite": "^6.0.2",
    "@capacitor-community/privacy-screen": "^6.0.0",
    "@aparajita/capacitor-biometric-auth": "^6.0.0",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.2.0",
    "@vitejs/plugin-react-swc": "^3.10.2",
    "vite": "6.3.5",
    "vite-plugin-pwa": "^0.21.1",
    "typescript": "^5.3.0"
  }
}
```

## Contributing

This is a community-driven safety project. Contributions welcome!

### Development Guidelines

1. **Security First**: All features must maintain security standards
2. **Privacy by Design**: No tracking, analytics, or cloud dependencies
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Performance**: Keep bundle size minimal
5. **Documentation**: Document all security-critical code

### Testing

```bash
# Run tests (when available)
npm test

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

## Support

### Issues
Report bugs and request features at [GitHub Issues](https://github.com/yourusername/her-law/issues)

### Security Vulnerabilities
For security issues, email: security@herlaw.app (do not create public issues)

### Documentation
- Full docs: [DEPLOYMENT.md](DEPLOYMENT.md), [BUILD_GUIDE.md](BUILD_GUIDE.md), [SECURITY.md](SECURITY.md)
- Video tutorials: Coming soon

## License

MIT License - See [LICENSE](LICENSE) for details

## Acknowledgments

Built for survivors and advocates navigating family law systems.

Inspired by the need for secure, private, user-controlled evidence documentation tools that prioritize safety and legal validity.

## Roadmap

- [x] Biometric authentication
- [x] Encrypted storage
- [x] PDF export with hashes
- [x] Privacy screen protection
- [x] Multi-platform support
- [ ] Decoy mode (fake PIN loads dummy data)
- [ ] Timeline visualization
- [ ] Photo metadata extraction
- [ ] Audio recording support
- [ ] Encrypted backups (user-controlled)
- [ ] Legal resource directory
- [ ] Multi-language support

## Legal Disclaimer

This app is provided as-is for personal documentation purposes. It is not a substitute for legal advice. Consult with a qualified attorney for your specific situation.

The cryptographic hashing and timestamp features are designed to demonstrate data integrity but may require expert testimony for court admissibility in your jurisdiction.

---

**Your evidence. Your device. Your control.**

For more information, visit [herlaw.app](https://herlaw.app) (coming soon)
