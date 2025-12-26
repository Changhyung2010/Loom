# Creating the TraceMind App Icon

## Quick Steps

1. **Save your brain logo** (the teal brain outline on black background) as:
   - File: `assets/icon.png`
   - Size: 1024x1024 pixels
   - Format: PNG (preferably with transparency)

2. **If you only have the logo as an image file:**
   - Open it in an image editor (Preview, Photoshop, GIMP, etc.)
   - Resize to 1024x1024 pixels
   - Save as PNG
   - Place in `mac-app-react/assets/icon.png`

3. **Build the app:**
   ```bash
   npm run electron-build:mac
   ```
   
   Electron-builder will automatically:
   - Convert PNG to ICNS format
   - Generate all required icon sizes
   - Apply it to the app bundle
   - Use it in the DMG

## Icon Specifications

- **Size**: 1024x1024 pixels (square)
- **Format**: PNG recommended (will be converted to ICNS)
- **Background**: Can be transparent or solid color
- **Design**: Your teal brain logo works perfectly

## Logo Description

Your logo features:
- Teal/cyan brain outline (#4fc3f7 color)
- Black or transparent background
- Top-down view showing two hemispheres
- Clean, minimalist design
- Professional appearance

This design is perfect for an app icon! 🧠

## Verification

After adding the icon and building:

1. The `.app` bundle should show your brain icon
2. The DMG file should show the icon
3. When installed, the app in Applications folder shows the icon
4. Dock icon displays correctly

## Notes

- The icon will be automatically resized for different contexts
- macOS uses multiple sizes (16x16 to 1024x1024)
- Electron-builder handles all conversions automatically
- You only need to provide the 1024x1024 PNG source

