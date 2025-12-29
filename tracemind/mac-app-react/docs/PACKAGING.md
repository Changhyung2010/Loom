# Packaging TraceMind for Distribution

## Quick Start

To build and package TraceMind:

```bash
cd mac-app-react
npm run electron-build:mac
```

This will create installers in the `dist/` folder.

## Prerequisites

1. **Node.js 16+** installed
2. **Python 3.8+** installed (for agent dependencies)
3. All npm dependencies installed (`npm install`)

## Build Process

### 1. Build React App

```bash
npm run build
```

Creates optimized production build in `build/` folder.

### 2. Package for macOS

```bash
npm run electron-build:mac
```

Creates:
- `dist/TraceMind-1.0.0.dmg` - Installer disk image
- `dist/TraceMind-1.0.0-mac.zip` - Zip archive (for direct distribution)

### 3. Verify Package Contents

The packaged app includes:
- Electron runtime
- React app build
- Python agent (from `../agent` folder)
- All necessary dependencies

## App Icon (Optional but Recommended)

To add a custom app icon:

1. Create a 1024x1024 PNG image
2. Save as `assets/icon.png`
3. Rebuild the app

Electron-builder will automatically generate all required icon sizes.

## Testing the Package

Before distributing:

1. **Test on clean system**: Install on a Mac without development tools
2. **Verify agent**: Make sure Python agent is accessible
3. **Test all features**:
   - File selection
   - API key configuration
   - Code explanation
   - Mind map visualization
   - Model selection
   - Authentication flow

## Code Signing (Optional)

For distribution outside Mac App Store:

1. Get Apple Developer certificate
2. Update `assets/entitlements.mac.plist` if needed
3. Set environment variables for auto-signing:
   ```bash
   export CSC_LINK="path/to/certificate.p12"
   export CSC_KEY_PASSWORD="password"
   ```

Or sign manually after build:
```bash
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  dist/mac/TraceMind.app
```

## Notarization (Optional)

For macOS Gatekeeper compatibility:

```bash
xcrun altool --notarize-app \
  --primary-bundle-id "com.tracemind.app" \
  --username "your@email.com" \
  --password "app-specific-password" \
  --file "dist/TraceMind-1.0.0.dmg"
```

## Distribution

### GitHub Releases

1. Create a new release tag: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. Create release on GitHub
4. Upload `.dmg` file

### Direct Distribution

- Upload to your website
- Share via cloud storage
- Email to users

## Troubleshooting

### Build Fails

- Check Node version: `node --version` (need 16+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check Python: `python3 --version` (need 3.8+)

### Agent Not Found

- Verify `extraFiles` in `package.json` includes agent
- Check agent exists in `../agent` folder
- Test agent path resolution in packaged app

### App Won't Open

- Right-click app → Open (bypasses Gatekeeper on first run)
- Check Console.app for errors
- Verify entitlements file exists

## Version Bumping

To release a new version:

1. Update version in `package.json`
2. Commit changes
3. Tag release: `git tag v1.0.1`
4. Build: `npm run electron-build:mac`
5. Create GitHub release with new `.dmg`

## Next Steps

After building:
1. Test thoroughly
2. Create release notes
3. Upload to distribution platform
4. Announce release

