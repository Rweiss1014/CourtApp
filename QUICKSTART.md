# Quick Start Guide - Her Law Family Court Organizer

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Capacitor plugins.

### Step 2: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.production.local
```

**Generate a secure encryption key:**

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Edit `.env.production.local` and replace `VITE_ENCRYPTION_KEY` with your generated key.

### Step 3: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 📱 Deploy to Mobile (Optional)

### For iOS (macOS only)

```bash
# Build web assets
npm run build

# Initialize Capacitor (first time only)
npm run cap:init

# Add iOS platform
npm run cap:add:ios

# Sync and open in Xcode
npm run cap:sync
npm run cap:open:ios
```

In Xcode:
1. Select your development team
2. Click "Play" to run on simulator or device

### For Android

```bash
# Build web assets
npm run build

# Add Android platform
npm run cap:add:android

# Sync and open in Android Studio
npm run cap:sync
npm run cap:open:android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Click "Run" to run on emulator or device

---

## 🌐 Deploy to Web

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   - `VITE_ENCRYPTION_KEY` = your secure key
   - `VITE_APP_ENVIRONMENT` = production

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Netlify

1. **Install Netlify CLI**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=build
   ```

4. **Set Environment Variables** in Netlify Dashboard

---

## 🔐 Security Features Overview

### Already Configured

✅ **Biometric Authentication** - Face ID/Touch ID/Fingerprint (mobile only)
✅ **Encrypted Storage** - SQLCipher on mobile, Web Crypto API on web
✅ **Privacy Screen** - Prevents screenshots (mobile only)
✅ **PDF Export** - Court-ready reports with integrity hashes
✅ **Security Headers** - XSS, clickjacking protection (web)

### How to Use Security Features

#### 1. Initialize Security (in your App.tsx or main.tsx)

```typescript
import { encryptedStorage } from '@/lib/security/encryptedStorage';
import { biometricAuth } from '@/lib/security/biometricAuth';

// Initialize encrypted storage
await encryptedStorage.initialize();

// Optional: Require biometric auth on app launch
const result = await biometricAuth.authenticate('Access your evidence');
if (!result.success) {
  // Redirect to lock screen or show error
}
```

#### 2. Save Evidence

```typescript
import { encryptedStorage } from '@/lib/security/encryptedStorage';

const recordId = await encryptedStorage.saveRecord({
  timestamp: Date.now(),
  type: 'Incident',
  content: 'Description of incident...',
  tags: '#Harassment,#Workplace',
  attachments: 'photo.jpg'
});
```

#### 3. Generate PDF Report

```typescript
import { pdfExport } from '@/lib/pdfExport';
import { encryptedStorage } from '@/lib/security/encryptedStorage';

const records = await encryptedStorage.getAllRecords();

await pdfExport.downloadReport(records, 'evidence-report.pdf', {
  title: 'Evidence Report',
  includeIntegrityHash: true
});
```

---

## 📚 Documentation

- **[README.md](README.md)** - Project overview and features
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Full deployment guide
- **[BUILD_GUIDE.md](BUILD_GUIDE.md)** - Build instructions for all platforms
- **[SECURITY.md](SECURITY.md)** - Security implementation details
- **[ASSETS.md](ASSETS.md)** - App icons and asset generation

---

## 🆘 Troubleshooting

### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Capacitor sync issues

```bash
# Clean and resync
npx cap sync --clean
```

### Build fails

```bash
# Clean build directory
rm -rf build dist

# Rebuild
npm run build
```

### iOS build fails in Xcode

```bash
# Clean Xcode build
rm -rf ~/Library/Developer/Xcode/DerivedData

# Re-sync
npx cap sync ios --clean
```

### Android build fails

```bash
# Clean Gradle
cd android
./gradlew clean
cd ..

# Re-sync
npx cap sync android --clean
```

---

## 📦 What's Included

### Security Implementations

- `src/lib/security/biometricAuth.ts` - Biometric authentication service
- `src/lib/security/encryptedStorage.ts` - Encrypted database service
- `src/lib/security/privacyScreen.ts` - Privacy screen protection

### PDF Export

- `src/lib/pdfExport.ts` - Professional PDF report generation

### Configuration Files

- `capacitor.config.ts` - Capacitor configuration
- `vite.config.ts` - Vite + PWA configuration
- `vercel.json` - Vercel deployment config
- `netlify.toml` - Netlify deployment config
- `.env.example` - Environment variables template

### Documentation

- Complete deployment guides
- Security best practices
- Asset generation instructions
- Build and distribution guides

---

## 🎯 Next Steps

1. **Customize the UI** - Modify components in `src/components/`
2. **Add Features** - Extend functionality in `src/lib/`
3. **Generate Icons** - See [ASSETS.md](ASSETS.md) for icon generation
4. **Test Security** - Review [SECURITY.md](SECURITY.md) for testing checklist
5. **Deploy** - Follow [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

---

## 💡 Tips

- **Development**: Use `npm run dev` for hot reload
- **Mobile Testing**: Use real devices for biometric/privacy testing
- **Security**: Never commit `.env` files with real keys
- **Deployment**: Test on staging before production
- **Updates**: Run `npm run cap:sync` after web code changes

---

## 🤝 Need Help?

- **Documentation**: Check the `/docs` directory
- **Issues**: Create a GitHub issue
- **Security**: Email security concerns (don't create public issues)

---

**You're all set! Start building your secure evidence documentation app.**

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).
