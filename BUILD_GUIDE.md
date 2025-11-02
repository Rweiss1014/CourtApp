# Build & Distribution Guide

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Platform-Specific Builds

### Web (Vercel/Netlify)

#### Build Command
```bash
npm run build
```

#### Output Directory
```
build/
```

#### Environment Variables (Set in Dashboard)

```
VITE_ENCRYPTION_KEY=<your-32-byte-base64-key>
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_BIOMETRIC_AUTH=false
VITE_ENABLE_PRIVACY_SCREEN=false
VITE_ENABLE_PDF_EXPORT=true
VITE_ENABLE_OFFLINE_MODE=true
```

Note: Biometric and privacy screen features are mobile-only.

#### Deployment

**Vercel:**
```bash
vercel --prod
```

**Netlify:**
```bash
netlify deploy --prod --dir=build
```

### iOS

#### Prerequisites

- macOS 12+ (Monterey or later)
- Xcode 14+
- Apple Developer Account ($99/year)
- CocoaPods installed

#### Initial Setup

```bash
# Build web assets
npm run build

# Initialize Capacitor (first time only)
npm run cap:init

# Add iOS platform
npm run cap:add:ios

# Sync web code to native
npm run cap:sync
```

#### Open in Xcode

```bash
npm run cap:open:ios
```

#### Xcode Configuration

1. **Select Development Team**
   - Open project in Xcode
   - Select "App" target
   - Signing & Capabilities → Select your team

2. **Update Bundle Identifier**
   - Change from `com.herlaw.familycourt` if needed
   - Must be unique across App Store

3. **Configure App Icons**
   - Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Required sizes:
     - 1024×1024 (App Store)
     - 180×180 (iPhone 3x)
     - 120×120 (iPhone 2x)
     - 167×167 (iPad Pro)
     - 152×152 (iPad 2x)
     - 76×76 (iPad)

4. **Update Info.plist**

   Location: `ios/App/App/Info.plist`

   ```xml
   <key>CFBundleDisplayName</key>
   <string>Her Law</string>

   <key>NSCameraUsageDescription</key>
   <string>Take photos for evidence documentation</string>

   <key>NSPhotoLibraryUsageDescription</key>
   <string>Select photos for evidence records</string>

   <key>NSFaceIDUsageDescription</key>
   <string>Use Face ID to secure your evidence data</string>
   ```

5. **Configure Capabilities**
   - Signing & Capabilities tab
   - Click "+ Capability"
   - Add "Background Modes" (if needed)

#### Build & Archive

1. Select "Any iOS Device (arm64)" as build target
2. Product → Archive
3. Wait for archive to complete
4. Organizer window opens automatically

#### Distribute to TestFlight

1. Click "Distribute App"
2. Select "App Store Connect"
3. Next → Upload
4. Wait for processing (10-30 minutes)
5. TestFlight available after processing
6. Add internal/external testers

#### Submit to App Store

1. Go to App Store Connect
2. My Apps → Her Law Family Court Organizer
3. Create new version
4. Fill in metadata:
   - **App Name**: Her Law Family Court Organizer
   - **Subtitle**: Secure Evidence Documentation
   - **Category**: Productivity
   - **Keywords**: evidence, court, organizer, legal, documentation
   - **Description**: [See below]
   - **Screenshots**: 6.5", 5.5", 12.9" required

5. Submit for review
6. Review time: 1-3 days typically

### Android

#### Prerequisites

- Android Studio Electric Eel or later
- JDK 11+
- Android SDK 33+

#### Initial Setup

```bash
# Build web assets
npm run build

# Add Android platform
npm run cap:add:android

# Sync web code to native
npm run cap:sync
```

#### Open in Android Studio

```bash
npm run cap:open:android
```

#### Android Studio Configuration

1. **Update Application ID**

   File: `android/app/build.gradle`

   ```gradle
   defaultConfig {
       applicationId "com.herlaw.familycourt"
       minSdkVersion 22
       targetSdkVersion 33
       versionCode 1
       versionName "1.0.0"
   }
   ```

2. **Update App Name**

   File: `android/app/src/main/res/values/strings.xml`

   ```xml
   <resources>
       <string name="app_name">Her Law</string>
       <string name="title_activity_main">Her Law Family Court Organizer</string>
   </resources>
   ```

3. **Add App Icons**

   Place icons in `android/app/src/main/res/`:
   - `mipmap-mdpi/ic_launcher.png` (48×48)
   - `mipmap-hdpi/ic_launcher.png` (72×72)
   - `mipmap-xhdpi/ic_launcher.png` (96×96)
   - `mipmap-xxhdpi/ic_launcher.png` (144×144)
   - `mipmap-xxxhdpi/ic_launcher.png` (192×192)

4. **Update Permissions**

   File: `android/app/src/main/AndroidManifest.xml`

   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.USE_BIOMETRIC" />
   ```

5. **Enable Privacy Screen**

   File: `android/app/src/main/java/com/herlaw/familycourt/MainActivity.java`

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

#### Generate Signing Key

**CRITICAL**: Do this ONCE and store securely!

```bash
keytool -genkey -v -keystore her-law-release-key.keystore \
  -alias her-law-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Prompts:
- **Password**: Use strong password, SAVE IT!
- **Name**: Your name or company
- **Organization**: Your organization
- **City, State, Country**: Fill in

**Store keystore file securely!** If lost, you cannot update your app!

#### Configure Signing

Create file: `android/key.properties`

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=her-law-key
storeFile=../her-law-release-key.keystore
```

**DO NOT COMMIT THIS FILE TO GIT!**

Update `android/app/build.gradle`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Build APK (For Testing)

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

Install on device:
```bash
adb install app-release.apk
```

#### Build AAB (For Play Store)

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

#### Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app (first time)
3. Fill in Store Listing:
   - **App name**: Her Law Family Court Organizer
   - **Short description**: Secure evidence documentation for family law cases
   - **Full description**: [See below]
   - **Category**: Productivity
   - **Graphics**: Icon, feature graphic, screenshots

4. Production → Create new release
5. Upload AAB file
6. Fill in release notes
7. Review and rollout

### App Store Assets

#### Description Template

```
Her Law Family Court Organizer is a secure, private evidence documentation app designed for individuals navigating family law cases.

KEY FEATURES:

📱 Secure Evidence Tracking
• Document incidents with timestamps
• Add photos and detailed notes
• Tag entries for easy organization (#Harassment, #Custody, etc.)
• Court-ready PDF reports with integrity verification

🔒 Privacy & Security
• Biometric authentication (Face ID/Touch ID/Fingerprint)
• Encrypted local storage
• Screenshot prevention
• No cloud sync - your data stays on YOUR device

📊 Professional Reports
• Generate PDF evidence reports
• Chronological timeline view
• Filter by date range or tags
• Cryptographic hashing for tamper evidence
• Professional formatting for court submission

✨ Designed for Safety
• Offline-first - works without internet
• Privacy screen protection
• Decoy mode (coming soon)
• No tracking, no ads, no data collection

Perfect for documenting:
• Harassment incidents
• Custody violations
• Medical neglect
• Financial abuse
• Communication records
• Pattern of behavior

Your evidence. Your device. Your control.

PRIVACY POLICY: We don't collect ANY user data. Everything stays on your device.
```

#### Screenshot Captions

1. "Document evidence securely with timestamps and tags"
2. "Generate court-ready PDF reports instantly"
3. "Protected by biometric authentication"
4. "Offline-first - no internet required"
5. "Filter and organize by tags and dates"

## Continuous Integration

### GitHub Actions (Example)

Create `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: web-build
          path: build/

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run cap:sync
      - uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
      - run: cd android && ./gradlew assembleRelease
```

## Version Management

Update version in:
1. `package.json` - "version": "1.0.0"
2. `android/app/build.gradle` - versionCode & versionName
3. `ios/App/App.xcodeproj` - Version & Build number

## Troubleshooting

### iOS Build Fails

```bash
# Clean Xcode build
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean Capacitor
npx cap sync ios --clean
```

### Android Build Fails

```bash
# Clean Gradle cache
cd android
./gradlew clean

# Invalidate Android Studio caches
# File → Invalidate Caches → Invalidate and Restart
```

### Capacitor Sync Issues

```bash
# Remove and re-add platform
npx cap sync --clean
```

## Pre-Release Checklist

- [ ] Version numbers updated
- [ ] Environment variables configured
- [ ] App icons generated (all sizes)
- [ ] Screenshots captured
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] App Store descriptions written
- [ ] Build tested on real devices
- [ ] Security audit completed
- [ ] Legal review completed
- [ ] Backup of signing keys secured
