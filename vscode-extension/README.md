# TraceMind VS Code Extension

VS Code extension that integrates with the TraceMind agent to explain code files using AI.

## Features

- 🔍 **One-click file explanation** - Explain any code file with a single click
- 📝 **Beautiful webview panel** - View explanations in a formatted, readable panel
- ⌨️ **Keyboard shortcut** - Quick access with `Cmd+Shift+E` (Mac) or `Ctrl+Shift+E` (Windows/Linux)
- 📂 **Context menu integration** - Right-click any file in the explorer or editor
- 🎨 **Progress indicators** - Real-time progress updates during analysis
- 📊 **Output channel** - Also logs explanations to the output panel for reference
- ⚡ **Smart error handling** - Helpful error messages and troubleshooting tips

## Installation

### From Source

1. Make sure you have Node.js installed
2. Install VS Code extension dependencies:
   ```bash
   npm install -g vsce  # VS Code Extension Manager
   cd vscode-extension
   npm install
   ```
3. Package the extension:
   ```bash
   vsce package
   ```
4. Install in VS Code:
   - Open VS Code
   - Go to Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
   - Click "..." menu → "Install from VSIX..."
   - Select the generated `.vsix` file

### Manual Installation

1. Copy the `vscode-extension` folder to your VS Code extensions directory:
   - **Windows**: `%USERPROFILE%\.vscode\extensions\tracemind-0.0.2\`
   - **Mac**: `~/.vscode/extensions/tracemind-0.0.2/`
   - **Linux**: `~/.vscode/extensions/tracemind-0.0.2/`
2. Reload VS Code

## Setup

1. Make sure the TraceMind agent is installed (see `../agent/README.md`)
   - The agent should be in `../agent/agent.py` relative to this extension
2. Set `OPENAI_API_KEY` environment variable or create a `.env` file in the agent directory:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
3. Ensure Python 3.8+ is installed and accessible via `python3` (Mac/Linux) or `python` (Windows)

## Usage

### Method 1: Command Palette
1. Open any file in VS Code
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Type "TraceMind: Explain File with TraceMind"
4. Press Enter

### Method 2: Keyboard Shortcut
1. Open any file in VS Code
2. Press `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)

### Method 3: Context Menu
1. Right-click on a file in the Explorer sidebar
2. Select "Explain File with TraceMind"
3. Or right-click in an open editor and select the command

The explanation will appear in a beautiful webview panel next to your code, and also be logged to the TraceMind output channel.

## Requirements

- VS Code 1.60.0 or higher
- Python 3.8+ installed and in PATH
- TraceMind agent installed (see `../agent/README.md`)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Troubleshooting

### "agent.py not found"
- Make sure the agent is installed in `../agent/agent.py` relative to this extension
- Or update the `findAgentScript()` function in `extension.js` to point to your agent location

### "Python not found"
- Ensure Python 3.8+ is installed
- Make sure `python3` (Mac/Linux) or `python` (Windows) is in your system PATH
- Test by running `python3 --version` in your terminal

### "API key error" or "OPENAI_API_KEY not set"
- Set the environment variable: `export OPENAI_API_KEY=your_key` (Mac/Linux) or `set OPENAI_API_KEY=your_key` (Windows)
- Or create a `.env` file in the agent directory with: `OPENAI_API_KEY=your_key`
- Get an API key from https://platform.openai.com/api-keys

### "OpenAI package not installed"
- Navigate to the agent directory and run: `pip install -r requirements.txt`

### Extension not working
- Check the VS Code Developer Console (Help → Toggle Developer Tools) for error messages
- Make sure the file you're trying to explain is saved (not untitled)
- Verify the agent script runs correctly from the command line: `python3 agent/agent.py /path/to/file.py`

