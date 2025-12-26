# App Icon Setup Instructions

## Add Your TraceMind Brain Logo

To use your brain logo as the app icon:

### Option 1: Use PNG (Recommended)

1. Save your brain logo as `assets/icon.png`
   - Size: 1024x1024 pixels
   - Format: PNG with transparency
   - The teal brain on black background works perfectly

2. Electron-builder will automatically generate:
   - `.icns` for macOS
   - All required sizes

### Option 2: Use ICNS directly

1. Convert your logo to `.icns` format
2. Save as `assets/icon.icns`
3. Update `package.json` to use `icon.icns`

### Quick Conversion (if needed)

If you have the PNG but need ICNS:

```bash
# Install iconutil (comes with macOS)
# Convert PNG folder to ICNS
mkdir icon.iconset
# Copy your icon.png as icon_512x512.png
# Then:
iconutil -c icns icon.iconset -o assets/icon.icns
```

Or use online converters or Image2icon app.

### Current Logo Description

Based on your logo:
- Teal brain outline (#4fc3f7 or similar)
- Black background
- Top-down perspective
- Two hemispheres with smooth contours
- Clean, minimalist design

This will look great as an app icon! 🧠

