# Adding Your Brain Logo Icon

## Quick Steps

1. **Save your brain logo** (teal brain outline) as:
   - File: `assets/icon.png`
   - Size: 1024x1024 pixels
   - Format: PNG

2. **Update package.json** to use the icon:
   - In the `"mac"` section, add: `"icon": "assets/icon.png",`
   - In the `"dmg"` section, add: `"icon": "assets/icon.png",`

3. **Rebuild:**
   ```bash
   npm run electron-build:mac
   ```

## Current Status

✅ DMG files are being created successfully!
📝 Icon is optional - you can add it anytime

The build works without the icon (uses default Electron icon), but adding your brain logo will make it look professional!

