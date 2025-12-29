# TraceMind Mac App

A beautiful native macOS application for explaining code files using AI.

## Features

- 🎨 Clean, modern macOS-native interface
- 📁 Easy file selection with file browser
- ⚙️ Built-in API key configuration
- 🔍 Real-time progress updates
- 📝 Formatted explanation output
- 🚀 No command-line needed!

## Installation

### Option 1: Run directly with Python

1. Make sure you have Python 3.8+ installed
2. Install dependencies:
   ```bash
   pip install -r ../agent/requirements.txt
   ```
3. Run the app (easiest method):
   ```bash
   ./run_tracemind.sh
   ```
   
   This script automatically:
   - Detects if you need Python 3.12 (for macOS 26+ compatibility)
   - Installs Python 3.12 and tkinter if needed
   - Runs the app with the correct Python version
   
   Or run directly:
   ```bash
   python3.12 tracemind_app.py
   ```
   
   **Note:** If you're on macOS 26+ and using Python 3.9, you'll need Python 3.12.
   The launcher script handles this automatically!

### Option 2: Create a macOS App Bundle

1. Install PyInstaller:
   ```bash
   pip install pyinstaller
   ```

2. Create the app bundle:
   ```bash
   pyinstaller --name TraceMind --windowed --icon=icon.icns --add-data "../agent:agent" tracemind_app.py
   ```

3. The app will be in the `dist/` folder

## Usage

1. Launch TraceMind
2. Click "⚙️ Settings" to configure your OpenAI API key (first time only)
3. Click "Browse..." to select a code file
4. Click "🔍 Explain File" to get an AI-powered explanation
5. View the explanation in the output area

## Requirements

- macOS 10.13 or later
- Python 3.8 or higher
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Internet connection

## Troubleshooting

**"Could not find agent.py script"**
- Make sure the `agent` directory is in the parent directory of this app
- Or update the `find_agent_script()` method to point to your agent location

**"API key not set"**
- Click "⚙️ Settings" and enter your OpenAI API key
- The key is saved locally in `../agent/.env`

**App won't start**
- Make sure Python 3.8+ is installed: `python3 --version`
- Check that all dependencies are installed: `pip install -r ../agent/requirements.txt`

