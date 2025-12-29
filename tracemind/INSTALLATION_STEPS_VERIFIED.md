# TraceMind Installation Steps - Verified

## ✅ Step 1: Install the Agent

Clone or download the repository, then install dependencies.

```bash
git clone https://github.com/Changhyung2010/tracemind.git
cd tracemind
cd agent
pip install -r requirements.txt
```

**Note:** After cloning, you'll be in the `tracemind` directory, so you need to `cd tracemind` first (if the clone creates a subdirectory) OR the clone will put you directly in the repo root. Actually, `git clone` creates a directory with the repo name, so:

**Corrected:**
```bash
git clone https://github.com/Changhyung2010/tracemind.git
cd tracemind
cd agent
pip install -r requirements.txt
```

---

## ✅ Step 2: Configure API Key

Set up your OpenAI API key using one of these methods.

### Option A: Create a .env file in the agent directory (Recommended)

```bash
cd agent
nano .env
```

Add this line:
```
OPENAI_API_KEY=your_key_here
```

Save and exit (Ctrl+X, then Y, then Enter for nano).

### Option B: Set environment variable

**Linux/Mac:**
```bash
export OPENAI_API_KEY=your_key_here
```

**Windows (Command Prompt):**
```cmd
set OPENAI_API_KEY=your_key_here
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY="your_key_here"
```

**Get your API key:** https://platform.openai.com/api-keys

---

## ✅ Step 3: Test the Agent

Verify the agent works before installing the extension.

```bash
cd agent
python agent.py /path/to/file.py
```

Or if you're in the repo root:
```bash
python agent/agent.py /path/to/file.py
```

You should see an explanation of the file if everything is set up correctly.

---

## ✅ Step 4: Install VS Code Extension

Package and install the extension locally.

### Build the extension package:

```bash
cd vscode-extension
npm install -g vsce
npm install
vsce package
```

This creates a `.vsix` file. The version number will match what's in `package.json` (currently 0.0.2).

**Important:** The generated file will be named `tracemind-0.0.2.vsix` (or whatever version is in package.json).

### Install via VS Code UI:

1. Open VS Code
2. Go to Extensions panel (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac)
3. Click `...` menu (three dots) → "Install from VSIX..."
4. Select the generated `.vsix` file (will be `tracemind-0.0.2.vsix` or whatever version you packaged)

### Or install via command line:

```bash
code --install-extension tracemind-0.0.2.vsix
```

(Replace with the actual filename if different)

---

## ✅ Step 5: Verify Installation

1. Open any code file in VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "TraceMind: Explain File with TraceMind"
4. Or use keyboard shortcut: `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)

---

## ⚠️ Important Notes

1. **Python version:** Make sure you have Python 3.8+ installed
2. **VS Code version:** Requires VS Code 1.60.0 or higher
3. **Node.js:** Required for packaging the extension (`npm` comes with Node.js)
4. **File path:** The extension looks for the agent at `../agent/agent.py` relative to where VS Code is running, or in the same repo structure
5. **The .vsix file in the repo:** There's an old `tracemind-0.0.1.vsix` file, but you should build a fresh one with `vsce package` to get the latest version (0.0.2)

---

## 🐛 Troubleshooting

- **"agent.py not found"**: Make sure you cloned the repo and the agent is in the correct location
- **"Python not found"**: Ensure Python 3.8+ is installed and in your PATH
- **"npm not found"**: Install Node.js from nodejs.org
- **Extension not working**: Check VS Code Developer Console (Help → Toggle Developer Tools) for errors

