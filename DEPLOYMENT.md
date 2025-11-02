# Her Law Family Court Organizer - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- For iOS: macOS with Xcode 14+
- For Android: Android Studio with SDK 33+
- Vercel or Netlify account (for web deployment)

## Phase 1: Web Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.production` and update with your production values:

```bash
cp .env.production .env.production.local
```

**CRITICAL**: Update `VITE_ENCRYPTION_KEY` with a secure 32-byte key:

```bash
# Generate a secure key (Unix/Mac)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Build for Production

```bash
npm run build
```

### 4A. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### 4B. Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Add environment variables in Netlify dashboard
```

### Environment Variables to Set on Platform:

- `VITE_ENCRYPTION_KEY` - Your generated 32-byte key
- `VITE_APP_ENVIRONMENT=production`

## Phase 2: Mobile Deployment (Capacitor)

### 1. Initialize Capacitor

```bash
npm run cap:init
```

When prompted:
- App name: `Her Law Family Court Organizer`
- App ID: `com.herlaw.familycourt`
- Web directory: `build`

### 2. Add Mobile Platforms

```bash
# Add iOS (macOS only)
npm run cap:add:ios

# Add Android
npm run cap:add:android
```

### 3. Sync Web Code to Native

```bash
npm run cap:sync
```

## Phase 3: iOS Deployment

### 1. Open in Xcode

```bash
npm run cap:open:ios
```

### 2. Configure iOS Project

1. **Update Bundle Identifier**: Set to `com.herlaw.familycourt`
2. **Configure Signing**: Select your development team
3. **Update Info.plist**: Add privacy descriptions

```xml
<key>NSCameraUsageDescription</key>
<string>Take photos for evidence documentation</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Select photos for evidence records</string>
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to secure your evidence data</string>
```

### 3. Add App Icons

- Add app icons to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Required sizes: 1024x1024, 60x60@2x, 60x60@3x, etc.

### 4. Build & Archive

1. Select "Any iOS Device" as target
2. Product → Archive
3. Distribute App → App Store Connect
4. Upload to TestFlight

## Phase 4: Android Deployment

### 1. Open in Android Studio

```bash
npm run cap:open:android
```

### 2. Configure Android Project

1. **Update `AndroidManifest.xml`** at `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

2. **Set Application ID**: Update `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.herlaw.familycourt"
    minSdkVersion 22
    targetSdkVersion 33
}
```

### 3. Generate Signing Key

```bash
keytool -genkey -v -keystore her-law-release-key.keystore -alias her-law-key -keyalg RSA -keysize 2048 -validity 10000
```

**CRITICAL**: Store this keystore file securely and never commit to git!

### 4. Configure Signing

Create `android/key.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=her-law-key
storeFile=../her-law-release-key.keystore
```

### 5. Build Release APK/AAB

```bash
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease    # For AAB (Play Store)
```

Output:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### 6. Upload to Play Console

1. Go to Google Play Console
2. Create new app
3. Upload AAB file
4. Complete store listing

## Security Checklist

- [ ] Encryption key generated and set in environment
- [ ] Privacy screen enabled on both platforms
- [ ] Biometric authentication tested
- [ ] Screenshot protection verified on Android
- [ ] SSL/TLS enabled for all API calls (if any)
- [ ] Keystore and signing keys secured
- [ ] `.env` files not committed to git
- [ ] App permissions minimized and justified

## PWA Features (Web Only)

The web deployment includes:
- Offline support via service workers
- Install prompt for "Add to Home Screen"
- Responsive design for all devices
- Encrypted local storage

## Troubleshooting

### iOS Build Fails

- Verify Xcode version (14+)
- Check provisioning profiles
- Clean build folder: Product → Clean Build Folder

### Android Build Fails

- Check SDK version in `build.gradle`
- Sync Gradle files
- Invalidate caches: File → Invalidate Caches

### PWA Not Installing

- Verify HTTPS is enabled
- Check manifest.json is accessible
- Service worker registered correctly

## Support

For issues:
1. Check console logs in browser/Xcode/Android Studio
2. Verify all dependencies installed correctly
3. Ensure environment variables are set

## Next Steps After Deployment

1. Set up crash reporting (Sentry, Firebase Crashlytics)
2. Add analytics (privacy-focused)
3. Configure app store metadata and screenshots
4. Test on real devices
5. Submit for review
