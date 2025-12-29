# Quick Start - Build TraceMind DMG

## Step 1: Navigate to the Project Folder

Open Terminal and run:

```bash
cd /Users/changhyunglee/projects/tracemind-mvp/mac-app-react
```

Or if you're already in the workspace:
```bash
cd mac-app-react
```

## Step 2: Add Your Icon (One-Time Setup)

1. Save your brain logo as: `assets/icon.png`
   - Size: 1024x1024 pixels
   - Format: PNG

2. Make sure the file exists:
```bash
ls -la assets/icon.png
```

## Step 3: Build the DMG

Run this command:

```bash
npm run electron-build:mac
```

This will:
- Build the React app
- Package everything into a Mac app
- Create a DMG installer file

## Step 4: Find Your DMG

After the build completes, your DMG file will be in:

```
dist/TraceMind-1.0.0.dmg
```

You can double-click it to test, or share it with users!

## Full Path

If you want the absolute path to run from anywhere:

```bash
cd /Users/changhyunglee/projects/tracemind-mvp/mac-app-react
npm run electron-build:mac
```

## Troubleshooting

**If you get "command not found":**
- Make sure you're in the `mac-app-react` folder
- Run `npm install` first if you haven't

**If build fails:**
- Check that `icon.png` exists in `assets/` folder
- Make sure you ran `npm install` before

## What Gets Created

After building, you'll find in the `dist/` folder:
- `TraceMind-1.0.0.dmg` ← This is what you distribute!
- `TraceMind-1.0.0-mac.zip` ← Alternative format

That's it! 🚀

