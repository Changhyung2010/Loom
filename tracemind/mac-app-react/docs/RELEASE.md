# Release Checklist

Before releasing a new version of TraceMind:

## Pre-Release

- [ ] Update version number in `package.json`
- [ ] Update CHANGELOG.md with new features and fixes
- [ ] Test all features in development mode
- [ ] Verify authentication flow works
- [ ] Test with different file types and languages
- [ ] Verify model selection works correctly
- [ ] Test mind map visualization
- [ ] Check for any console errors or warnings

## Build

- [ ] Build React app: `npm run build`
- [ ] Verify build succeeds without errors
- [ ] Package for macOS: `npm run electron-build:mac`
- [ ] Verify DMG and ZIP files are created in `dist/` folder
- [ ] Check file sizes are reasonable

## Testing Package

- [ ] Install DMG on clean macOS system (no dev tools)
- [ ] Verify app opens without errors
- [ ] Test authentication flow
- [ ] Configure API key
- [ ] Select and explain a code file
- [ ] Verify mind map displays correctly
- [ ] Test model selection
- [ ] Verify agent.py is accessible
- [ ] Test with multiple file types

## Code Signing (Optional)

- [ ] Code sign the app (if distributing outside App Store)
- [ ] Notarize the DMG (for Gatekeeper)
- [ ] Verify signed app opens without warnings

## Release

- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Create GitHub release
- [ ] Upload DMG file to release
- [ ] Write release notes highlighting new features
- [ ] Announce release

## Post-Release

- [ ] Monitor for user feedback
- [ ] Address any critical issues
- [ ] Update documentation if needed

