# Asset Generation Guide

## App Icons

### Required Sizes

#### iOS
- **App Store**: 1024×1024px (PNG, no transparency)
- **iPhone**: 180×180, 120×120, 87×87, 80×80, 60×60, 58×58, 40×40, 29×29
- **iPad**: 167×167, 152×152, 76×76, 40×40, 29×29
- **Spotlight**: 120×120, 80×80
- **Settings**: 87×87, 58×58, 29×29

#### Android
- **Play Store**: 512×512px (PNG)
- **mdpi**: 48×48px (1x)
- **hdpi**: 72×72px (1.5x)
- **xhdpi**: 96×96px (2x)
- **xxhdpi**: 144×144px (3x)
- **xxxhdpi**: 192×192px (4x)

#### Web/PWA
- 72×72, 96×96, 128×128, 144×144, 152×152, 192×192, 384×384, 512×512

### Icon Design Guidelines

**Theme**: Legal, Professional, Secure

**Color Palette**:
- Primary: Deep blue (#1A1F71) - Trust, authority
- Secondary: Gold/amber (#D4AF37) - Justice, value
- Accent: White (#FFFFFF) - Clarity

**Design Elements**:
- Balance scales (justice symbol)
- Shield (protection/security)
- Folder/document (evidence organization)
- Minimalist, professional

**Do NOT include**:
- Gendered symbols
- Weapons
- Controversial imagery
- Text (hard to read at small sizes)

### Icon Generation Tools

#### Option 1: Figma/Adobe Illustrator
1. Design at 1024×1024px
2. Export as PNG
3. Use app icon generator

#### Option 2: App Icon Generator Services
- **iOS**: [App Icon Generator](https://appicon.co/)
- **Android**: [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)
- **All platforms**: [Icon Kitchen](https://icon.kitchen/)

#### Option 3: Command Line (ImageMagick)

```bash
# Install ImageMagick
brew install imagemagick  # macOS
# or
sudo apt install imagemagick  # Linux

# Generate iOS icons from 1024×1024 source
convert icon-1024.png -resize 180×180 icon-180.png
convert icon-1024.png -resize 120×120 icon-120.png
convert icon-1024.png -resize 87×87 icon-87.png
# ... repeat for all sizes

# Generate Android icons
convert icon-1024.png -resize 48×48 ic_launcher-mdpi.png
convert icon-1024.png -resize 72×72 ic_launcher-hdpi.png
convert icon-1024.png -resize 96×96 ic_launcher-xhdpi.png
convert icon-1024.png -resize 144×144 ic_launcher-xxhdpi.png
convert icon-1024.png -resize 192×192 ic_launcher-xxxhdpi.png
```

### Icon Placement

#### iOS
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
├── icon-1024.png
├── icon-180.png
├── icon-120.png
└── ... (all sizes)
```

Update `Contents.json` in that directory.

#### Android
```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png
├── mipmap-hdpi/ic_launcher.png
├── mipmap-xhdpi/ic_launcher.png
├── mipmap-xxhdpi/ic_launcher.png
└── mipmap-xxxhdpi/ic_launcher.png
```

#### Web
```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

## Splash Screens

### iOS Launch Screen

iOS uses a storyboard for launch screens. Configure in Xcode:

1. Open `ios/App/App/Base.lproj/LaunchScreen.storyboard`
2. Design launch screen:
   - Background: Black (#000000)
   - App name text: White
   - Optional: Small logo centered

**Best Practice**: Keep it simple, matches app's initial screen.

### Android Splash Screen

Create `android/app/src/main/res/drawable/splash.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/ic_launcher"/>
    </item>
</layer-list>
```

Create `android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#000000</color>
</resources>
```

## Screenshots

### Required Sizes

#### iOS App Store
- **6.5" Display** (iPhone 14 Pro Max, etc.): 1290×2796px
- **5.5" Display** (iPhone 8 Plus): 1242×2208px
- **12.9" Display** (iPad Pro): 2048×2732px

Minimum: 3-10 screenshots per device size.

#### Google Play Store
- **Phone**: 1080×1920px minimum (16:9 or 9:16)
- **7" Tablet**: 1920×1200px
- **10" Tablet**: 2560×1600px

Minimum: 2-8 screenshots.

### Screenshot Content Ideas

1. **Main Dashboard**
   - Show evidence timeline
   - Tag filtering
   - Professional, clean UI

2. **Add Evidence Screen**
   - Timestamp visible
   - Tag input
   - Photo attachment option

3. **PDF Export Preview**
   - Show "Generate Report" button
   - Sample PDF preview
   - Professional formatting

4. **Security Features**
   - Biometric authentication screen
   - "Protected" indicator
   - Privacy messaging

5. **Tag Organization**
   - Show tag categories
   - Filter results
   - Easy navigation

### Screenshot Guidelines

**Do's**:
- Use realistic demo data (not personal info)
- Show key features
- Professional, clean UI
- Good lighting/contrast
- Localize if targeting multiple regions

**Don'ts**:
- Real personal information
- Offensive content
- Competitor mentions
- Low-quality/blurry images
- Inconsistent design

### Capture Tools

#### iOS
```bash
# Using iOS Simulator
xcrun simctl io booted screenshot screenshot.png

# On device: Press Volume Up + Side button
```

#### Android
```bash
# Using Android Emulator or device
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# On device: Press Power + Volume Down
```

#### Web
- Browser DevTools (F12) → Device toolbar
- Responsive Design Mode (Ctrl+Shift+M)
- Screenshot tools like [Responsively](https://responsively.app/)

### Screenshot Enhancement

Use tools like Figma or Photoshop to add:
- Device frames (optional)
- Text overlays explaining features
- Consistent backgrounds
- Annotations

**Tools**:
- [MockUPhone](https://mockuphone.com/)
- [Shotsnapp](https://shotsnapp.com/)
- [Screenshot.rocks](https://screenshot.rocks/)

## Feature Graphic (Android)

**Size**: 1024×500px

Create a banner showcasing:
- App name: "Her Law"
- Tagline: "Secure Evidence Documentation"
- Key visual elements (scales, shield)
- Color scheme matching app

Place at: `android/app/src/main/res/drawable-nodpi/feature_graphic.png`

## App Store Marketing Assets

### iOS

**Promotional Text** (170 chars):
```
Secure evidence documentation for family law cases. Biometric protection,
encrypted storage, and court-ready PDF reports. Your data stays on YOUR device.
```

**Keywords** (100 chars):
```
evidence,court,organizer,legal,documentation,harassment,custody,family,law,secure
```

### Android

**Promo Graphic** (Optional): 180×120px

**Promo Video** (Optional): YouTube link, <30 seconds

## Branding Guidelines

### Colors

```css
/* Primary palette */
--primary: #1A1F71;        /* Deep blue */
--secondary: #D4AF37;      /* Gold */
--background: #000000;     /* Black */
--text: #FFFFFF;           /* White */
--accent: #3B82F6;         /* Bright blue */

/* Semantic colors */
--danger: #EF4444;         /* Red for delete */
--success: #10B981;        /* Green for success */
--warning: #F59E0B;        /* Amber for warnings */
```

### Typography

```css
/* Font families */
--font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "SF Mono", Monaco, "Courier New", monospace;

/* Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
```

### Logo Usage

- Minimum clear space: 10px around logo
- Minimum size: 32×32px
- Background: Always black or white for contrast
- Never distort/stretch
- Never rotate
- Never apply gradients (unless part of design)

## Asset Checklist

Before submission:

- [ ] App icon (all sizes)
- [ ] iOS icons (App Store + all device sizes)
- [ ] Android icons (Play Store + all densities)
- [ ] Web/PWA icons (all sizes)
- [ ] iOS launch screens configured
- [ ] Android splash screen configured
- [ ] Screenshots (iOS: 3 sizes, Android: 1 size minimum)
- [ ] Feature graphic (Android)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Marketing assets prepared

## Tools & Resources

### Icon Generation
- [App Icon Generator](https://appicon.co/)
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)
- [Icon Kitchen](https://icon.kitchen/)

### Screenshot Tools
- [MockUPhone](https://mockuphone.com/)
- [Shotsnapp](https://shotsnapp.com/)
- [Screenshot.rocks](https://screenshot.rocks/)

### Design Tools
- [Figma](https://figma.com) - UI design
- [Canva](https://canva.com) - Marketing graphics
- [GIMP](https://gimp.org) - Free image editor
- [Inkscape](https://inkscape.org) - Free vector editor

### Color Tools
- [Coolors](https://coolors.co/) - Palette generator
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Accessibility

## Automated Asset Generation Script

Create `scripts/generate-assets.sh`:

```bash
#!/bin/bash

# Generate all app icons from single source
SOURCE="assets/icon-source.png"

# iOS sizes
for size in 1024 180 120 87 80 60 58 40 29; do
  convert "$SOURCE" -resize ${size}x${size} "ios/App/App/Assets.xcassets/AppIcon.appiconset/icon-${size}.png"
done

# Android sizes
convert "$SOURCE" -resize 48x48 "android/app/src/main/res/mipmap-mdpi/ic_launcher.png"
convert "$SOURCE" -resize 72x72 "android/app/src/main/res/mipmap-hdpi/ic_launcher.png"
convert "$SOURCE" -resize 96x96 "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png"
convert "$SOURCE" -resize 144x144 "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png"
convert "$SOURCE" -resize 192x192 "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"

# PWA sizes
for size in 72 96 128 144 152 192 384 512; do
  convert "$SOURCE" -resize ${size}x${size} "public/icons/icon-${size}x${size}.png"
done

echo "✅ All icons generated!"
```

Make executable:
```bash
chmod +x scripts/generate-assets.sh
./scripts/generate-assets.sh
```
