# Building TraceMind for Distribution

This guide explains how to build and package TraceMind for distribution.

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+ (for the agent)
- macOS (for building Mac apps)
- Code signing certificate (optional, for distribution outside Mac App Store)

## Build Steps

### 1. Install Dependencies

```bash
cd mac-app-react
npm install
```

### 2. Install Python Agent Dependencies

```bash
cd ../agent
pip install -r requirements.txt
cd ../mac-app-react
```

### 3. Build React App

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### 4. Package the App

#### For macOS:

```bash
npm run electron-build:mac
```

This creates:
- `dist/TraceMind-<version>.dmg` - Installer disk image
- `dist/TraceMind-<version>-mac.zip` - Zip archive

#### For Windows:

```bash
npm run electron-build:win
```

Creates `dist/TraceMind Setup <version>.exe`

#### For Linux:

```bash
npm run electron-build:linux
```

Creates `dist/TraceMind-<version>.AppImage`

### 5. Code Signing (macOS)

For distribution outside the Mac App Store, you need to code sign the app:

1. Get an Apple Developer certificate
2. Update `assets/entitlements.mac.plist` if needed
3. Set environment variables:
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_ID_PASSWORD="app-specific-password"
   export APPLE_TEAM_ID="your-team-id"
   ```

Or manually sign:
```bash
codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" dist/mac/TraceMind.app
```

### 6. Notarization (macOS)

For macOS distribution, you should notarize the app:

```bash
xcrun altool --notarize-app \
  --primary-bundle-id "com.tracemind.app" \
  --username "your@email.com" \
  --password "app-specific-password" \
  --file "dist/TraceMind-<version>.dmg"
```

## Build Configuration

The build configuration is in `package.json` under the `build` section. Key settings:

- **appId**: `com.tracemind.app` - Unique identifier
- **productName**: `TraceMind` - App name
- **directories.output**: `dist` - Output folder
- **extraFiles**: Includes the Python agent in the package

## Customization

### App Icon

Replace `assets/icon.png` with your app icon (1024x1024px PNG). The build process will generate all required sizes.

For macOS, you can also provide:
- `assets/icon.icns` - macOS icon format
- `assets/icon.ico` - Windows icon format

### App Metadata

Update in `package.json`:
- `name`: Package name
- `version`: App version
- `description`: App description
- `author`: Your name/company

## Testing the Built App

Before distributing:

1. Test on a clean macOS system (not your dev machine)
2. Verify all features work:
   - File selection
   - API key configuration
   - Code explanation
   - Mind map visualization
   - Model selection
3. Check that Python agent is accessible
4. Test with different file types

## Distribution

### GitHub Releases

1. Create a new release on GitHub
2. Upload the `.dmg` file
3. Add release notes
4. Tag the release

### Direct Distribution

- Upload to your website
- Share via cloud storage
- Include installation instructions

## Troubleshooting

### Build Fails

- Check Node.js version: `node --version` (need 16+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Python version: `python3 --version` (need 3.8+)

### Agent Not Found in Packaged App

- Verify `extraFiles` in `package.json` includes the agent
- Check that agent folder exists in `dist/mac/TraceMind.app/Contents/Resources/`
- Test agent path resolution in packaged app

### Code Signing Issues

- Ensure certificate is installed: `security find-identity -v -p codesigning`
- Check entitlements file exists
- Verify Team ID matches your certificate

## Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run electron-build:mac
      - uses: softprops/action-gh-release@v1
        with:
          files: dist/*.dmg
```

## Next Steps

After building:

1. Test thoroughly
2. Create release notes
3. Upload to distribution platform
4. Announce the release
5. Gather user feedback

