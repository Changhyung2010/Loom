# TraceMind VS Code Extension - Installation Guide

Complete step-by-step instructions to install and use TraceMind in VS Code.

---

## Prerequisites

Before installing the extension, make sure you have:

- ✅ **VS Code 1.60.0 or higher** - [Download VS Code](https://code.visualstudio.com/)
- ✅ **Python 3.8 or higher** - [Download Python](https://www.python.org/downloads/)
- ✅ **Node.js** (for packaging the extension) - [Download Node.js](https://nodejs.org/)
- ✅ **OpenAI API Key** - [Get your API key](https://platform.openai.com/api-keys)
- ✅ **Git** (optional, for git history analysis)

---

## Step 1: Install the TraceMind Agent

The VS Code extension requires the TraceMind agent to be installed on your system.

### Option A: Download from GitHub

1. **Clone or download the repository:**
   ```bash
   git clone https://github.com/tracemind/tracemind-mvp.git
   cd tracemind-mvp
   ```

   Or download the ZIP file and extract it.

2. **Navigate to the agent directory:**
   ```bash
   cd agent
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

   This installs:
   - `openai` - For API calls
   - `python-dotenv` - For loading .env files

### Option B: Install from Source

If you have the source code, simply run:
```bash
cd agent
pip install -r requirements.txt
```

---

## Step 2: Configure Your OpenAI API Key

You need to set your OpenAI API key so the agent can make API calls.

### Method 1: Environment Variable (Recommended for CLI)

**Linux/Mac:**
```bash
export OPENAI_API_KEY=your_api_key_here
```

To make this permanent, add it to your `~/.bashrc` or `~/.zshrc`:
```bash
echo 'export OPENAI_API_KEY=your_api_key_here' >> ~/.zshrc
source ~/.zshrc
```

**Windows (Command Prompt):**
```cmd
set OPENAI_API_KEY=your_api_key_here
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="your_api_key_here"
```

### Method 2: .env File (Recommended for Extension)

Create a `.env` file in the `agent` directory:

1. Navigate to the agent directory:
   ```bash
   cd agent
   ```

2. Create a `.env` file:
   ```bash
   # Linux/Mac
   nano .env
   
   # Windows
   notepad .env
   ```

3. Add your API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Save the file.

**Note:** The `.env` file is ignored by git, so your API key stays private.

---

## Step 3: Test the Agent

Before installing the extension, verify the agent works:

```bash
cd agent
python agent.py /path/to/any/code/file.py
```

You should see:
1. Status messages (Reading file, Extracting imports, etc.)
2. An AI-generated explanation of the file

If this works, proceed to Step 4.

---

## Step 4: Install the VS Code Extension

### Option A: Install from VSIX File (Easiest)

1. **Package the extension** (if you have the source):
   ```bash
   cd vscode-extension
   npm install -g vsce  # VS Code Extension Manager
   npm install
   vsce package
   ```
   
   This creates a `tracemind-0.0.2.vsix` file.

2. **Install in VS Code:**
   
   **Method 1 - Via UI:**
   - Open VS Code
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac) to open Extensions
   - Click the `...` menu (three dots) in the Extensions view
   - Select "Install from VSIX..."
   - Navigate to and select `tracemind-0.0.2.vsix`
   - Click "Install"
   - Reload VS Code when prompted

   **Method 2 - Via Command Line:**
   ```bash
   code --install-extension tracemind-0.0.2.vsix
   ```

### Option B: Manual Installation

1. **Locate your VS Code extensions directory:**
   - **Windows**: `%USERPROFILE%\.vscode\extensions\`
   - **Mac**: `~/.vscode/extensions/`
   - **Linux**: `~/.vscode/extensions/`

2. **Copy the extension folder:**
   ```bash
   # Create the extension directory
   mkdir -p ~/.vscode/extensions/tracemind-0.0.2
   
   # Copy all files from vscode-extension folder
   cp -r vscode-extension/* ~/.vscode/extensions/tracemind-0.0.2/
   ```

3. **Reload VS Code:**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Reload Window"
   - Press Enter

---

## Step 5: Verify Installation

1. **Open VS Code**
2. **Check Extensions:**
   - Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
   - Search for "TraceMind"
   - You should see "TraceMind" installed and enabled

3. **Verify agent is accessible:**
   - The extension looks for the agent at `../agent/agent.py` relative to the extension folder
   - Or you can verify by opening any code file and trying to explain it

---

## Step 6: Using TraceMind

Once installed, you can use TraceMind in three ways:

### Method 1: Command Palette

1. Open any code file in VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "TraceMind: Explain File with TraceMind"
4. Press Enter
5. Wait a few seconds for the analysis
6. View the explanation in the webview panel

### Method 2: Keyboard Shortcut

1. Open any code file in VS Code
2. Press `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)
3. The explanation will appear automatically

### Method 3: Context Menu

1. Right-click on a file in the Explorer sidebar
2. Select "Explain File with TraceMind"
3. Or right-click in an open editor tab
4. Select "Explain File with TraceMind"

---

## Troubleshooting

### "agent.py not found"

**Problem:** The extension can't find the agent script.

**Solutions:**
1. Make sure the agent is installed in the correct location
2. The extension looks for `../agent/agent.py` relative to the extension folder
3. If installed elsewhere, you can modify `extension.js` to point to the correct path
4. Or create a symlink to the expected location

**Verify agent location:**
```bash
# Check if agent exists
ls -la agent/agent.py

# If you installed it elsewhere, create a symlink or update the path
```

### "Python not found"

**Problem:** Python isn't in your system PATH.

**Solutions:**
1. Make sure Python 3.8+ is installed
2. Verify it's in your PATH:
   ```bash
   python3 --version  # Mac/Linux
   python --version   # Windows
   ```

3. **Mac/Linux:** Add Python to PATH in `~/.bashrc` or `~/.zshrc`:
   ```bash
   export PATH="/usr/local/bin:$PATH"
   ```

4. **Windows:** Add Python to PATH in System Environment Variables

### "API key error" or "OPENAI_API_KEY not set"

**Problem:** The API key isn't configured.

**Solutions:**
1. Check if the `.env` file exists in the agent directory
2. Verify the API key is correct (no extra spaces, quotes, etc.)
3. Try setting it as an environment variable:
   ```bash
   export OPENAI_API_KEY=your_key_here  # Mac/Linux
   set OPENAI_API_KEY=your_key_here      # Windows CMD
   ```

4. Get a new API key from [OpenAI](https://platform.openai.com/api-keys)

### "OpenAI package not installed"

**Problem:** Missing Python dependencies.

**Solution:**
```bash
cd agent
pip install -r requirements.txt
```

### Extension not working / No explanation appears

**Solutions:**
1. Check VS Code Developer Console for errors:
   - Help → Toggle Developer Tools
   - Look for error messages in the Console tab

2. Make sure the file is saved (not untitled)

3. Verify the agent works from command line:
   ```bash
   cd agent
   python agent.py /path/to/test/file.py
   ```

4. Check your internet connection (needed for OpenAI API calls)

5. Reload VS Code window:
   - `Ctrl+Shift+P` → "Reload Window"

### File type not supported

TraceMind supports:
- Python (.py)
- JavaScript/TypeScript (.js, .jsx, .ts, .tsx)
- Java (.java)
- Go (.go)

For other file types, the agent will still try to explain them, but import extraction may not work perfectly.

---

## Quick Reference

### File Locations

- **Agent**: `tracemind-mvp/agent/agent.py`
- **Extension**: `tracemind-mvp/vscode-extension/`
- **VSIX File**: `tracemind-mvp/vscode-extension/tracemind-0.0.2.vsix`
- **.env File**: `tracemind-mvp/agent/.env`

### Keyboard Shortcuts

- **Explain File**: `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)
- **Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
- **Extensions**: `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)

### Supported File Types

- ✅ Python (.py)
- ✅ JavaScript (.js, .jsx)
- ✅ TypeScript (.ts, .tsx)
- ✅ Java (.java)
- ✅ Go (.go)

---

## Cost Information

TraceMind uses OpenAI's `gpt-4o-mini` model:

- **Cost per explanation**: ~$0.001-0.002
- **Very affordable** for personal use
- **API calls only** when you request an explanation
- **No subscription fees** - pay only for what you use

Get your API key: https://platform.openai.com/api-keys

---

## Need Help?

- Check the README files in the `agent` and `vscode-extension` directories
- Review the troubleshooting section above
- Check VS Code Developer Console for error messages
- Verify each step was completed correctly

---

**Happy coding with TraceMind! 🚀**

