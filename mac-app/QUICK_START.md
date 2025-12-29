# Quick Start - TraceMind Mac App

## Fastest Way to Run

Just use the smart launcher - it handles everything automatically:

```bash
cd mac-app
./run_tracemind.sh
```

That's it! The script will:
- ✅ Check if you have a compatible Python version
- ✅ Install Python 3.12 + tkinter if needed (requires Homebrew)
- ✅ Run the app automatically

## Manual Setup (if needed)

If you prefer to do it manually:

```bash
# Install Python 3.12 with tkinter support
brew install python@3.12 python-tk@3.12

# Run the app
cd mac-app
python3.12 tracemind_app.py
```

## First Time Setup

1. **Run the app** (see above)
2. **Configure API Key**:
   - Click "⚙️ Settings" button
   - Enter your OpenAI API key
   - Click "Save"
3. **Select a file**:
   - Click "Browse..." 
   - Choose any code file (.py, .js, .ts, etc.)
4. **Get explanation**:
   - Click "🔍 Explain File"
   - Wait a few seconds
   - View the AI-generated explanation!

## Troubleshooting

**App won't start?**
- Make sure you have Homebrew installed
- Try: `brew install python@3.12 python-tk@3.12`

**"agent.py not found"?**
- Make sure you're in the `mac-app` directory
- Verify `../agent/agent.py` exists

**Need help?**
- See `TROUBLESHOOTING.md` for detailed help
- Or use the VS Code extension instead (no GUI needed)

