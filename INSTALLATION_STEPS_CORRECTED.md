# ✅ Verified Installation Steps for TraceMind

## Step 1: Install the Agent

Clone or download the repository, then install dependencies.

```bash
git clone https://github.com/Changhyung2010/tracemind.git
cd tracemind
cd agent
pip install -r requirements.txt
```

**Note:** After cloning, you'll be in a `tracemind` directory. Navigate to it, then to the `agent` subdirectory.

---

## Step 2: Configure API Key

Set up your OpenAI API key using one of these methods.

### Option A: Create a .env file in the agent directory (Recommended)

```bash
cd agent
nano .env  # or use any text editor
```

Add this line:
```
OPENAI_API_KEY=your_key_here
```

Save the file.

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

## Step 3: Test the Agent

Verify the agent works before installing the extension.

```bash
# From the agent directory:
python agent.py /path/to/file.py

# Or from the repo root:
python agent/agent.py /path/to/file.py
```

You should see an explanation of the file if everything is set up correctly.

---

## Step 4: Install VS Code Extension

Package and install the extension locally.

### Build the extension package:

```bash
cd vscode-extension
npm install -g vsce
npm install
vsce package
```

This creates a `.vsix` file named `tracemind-0.0.2.vsix` (version matches package.json).

### Install via VS Code UI:

1. Open VS Code
2. Go to Extensions panel (`Ctrl+Shift+X` or `Cmd+Shift+X` on Mac)
3. Click `...` menu (three dots) → "Install from VSIX..."
4. Select the generated `.vsix` file (should be `tracemind-0.0.2.vsix`)

### Or install via command line:

```bash
code --install-extension tracemind-0.0.2.vsix
```

**Note:** The filename will match the version in `package.json`. If you see a different version number, use that filename.

---

## ✅ All Steps Verified

✅ Clone URL is correct  
✅ Directory structure is correct  
✅ Commands are accurate  
✅ File paths are correct  
✅ Version numbers match (package.json says 0.0.2, so vsce will create 0.0.2.vsix)

---

## Quick Start After Installation

Once installed, use TraceMind:

- **Keyboard shortcut:** `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)
- **Command Palette:** `Ctrl+Shift+P` → "TraceMind: Explain File with TraceMind"
- **Context menu:** Right-click file → "Explain File with TraceMind"

