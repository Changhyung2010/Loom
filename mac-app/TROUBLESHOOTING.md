# Troubleshooting the Mac App

## Error: "macOS 26 (2602) or later required, have instead 16 (1602)"

This error occurs because Python 3.9.6's bundled Tk library doesn't properly recognize newer macOS versions (like macOS 26.2).

### Solution 1: Use a Newer Python Version (Recommended)

**Option A: Install Python 3.11 or 3.12 via Homebrew**
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.12
brew install python@3.12

# Run the app with the newer Python
python3.12 tracemind_app.py
```

**Option B: Use pyenv to manage Python versions**
```bash
# Install pyenv
brew install pyenv

# Install Python 3.12
pyenv install 3.12.0
pyenv local 3.12.0

# Run the app
python3 tracemind_app.py
```

### Solution 2: Update System Python (if possible)

If you're using the system Python, you might need to update macOS or use a different Python installation.

### Solution 3: Use the VS Code Extension Instead

If updating Python is not feasible, you can use the VS Code extension which doesn't have this GUI dependency:

```bash
cd ../vscode-extension
# Follow the VS Code extension installation instructions
```

## Other Common Issues

### "Could not find agent.py"
- Make sure you're running from the `mac-app` directory
- Verify `../agent/agent.py` exists
- Check the file path in the error message

### "API key not set"
- Click the Settings button (⚙️) in the app
- Or set it manually: `export OPENAI_API_KEY=your_key`

### App crashes on startup
- Check Python version: `python3 --version`
- Try with a different Python version (see Solution 1 above)
- Check error messages in the terminal

### GUI looks wrong or doesn't load
- Try running without the aqua theme (the code now falls back automatically)
- Check if tkinter is installed: `python3 -c "import tkinter; print('OK')"`

