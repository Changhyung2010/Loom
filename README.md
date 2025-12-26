# TraceMind - AI-Powered Code Explanation Tool

TraceMind is a developer-focused MVP tool that explains code files using AI. It analyzes your code, imports, dependencies, and git history to provide clear, contextual explanations.

## 🎯 What is TraceMind?

TraceMind helps you understand code by:
- Analyzing file content and structure
- Extracting imports and dependencies
- Reading git commit history for context
- Using OpenAI's API to generate explanations
- Working entirely locally (your code processing happens on your machine)

Perfect for understanding legacy code, onboarding new team members, or getting quick overviews of unfamiliar files.

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- VS Code 1.60.0+ (optional, for extension)
- Git (optional, for git history)

### Installation

1. **Set up the Agent:**
   ```bash
   cd agent
   pip install -r requirements.txt
   export OPENAI_API_KEY=your_api_key_here
   ```

2. **Install VS Code Extension (Optional):**
   ```bash
   cd vscode-extension
   npm install -g vsce
   npm install
   vsce package
   # Then install the .vsix file in VS Code
   ```

3. **Test it:**
   ```bash
   python agent/agent.py /path/to/your/file.py
   ```

## 📁 Project Structure

```
tracemind-mvp/
├── agent/              # Python agent that does the analysis
│   ├── agent.py        # Main agent script
│   ├── requirements.txt
│   └── README.md
├── vscode-extension/   # VS Code extension
│   ├── extension.js
│   ├── package.json
│   └── README.md
├── website/            # Simple website/docs
│   ├── index.html
│   ├── downloads.html
│   └── style.css
└── README.md
```

## 💡 Usage

### Using the Agent Directly

```bash
python agent/agent.py /path/to/file.py
```

The agent will:
1. Read the file content
2. Extract imports/dependencies
3. Get git history (if in a git repo)
4. Send to OpenAI API
5. Print the explanation

### Using VS Code Extension

1. Open any file in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type: `TraceMind: Explain Current File`
4. View the explanation in the Output panel

## 🔧 Configuration

### Environment Variables

Set your OpenAI API key:
```bash
# Linux/Mac
export OPENAI_API_KEY=your_key_here

# Windows
set OPENAI_API_KEY=your_key_here
```

Or create a `.env` file in the `agent/` directory:
```
OPENAI_API_KEY=your_key_here
```

### Supported File Types

Currently supports:
- Python (.py)
- JavaScript/TypeScript (.js, .jsx, .ts, .tsx)
- Java (.java)
- Go (.go)

More file types can be added by extending the `extract_imports` function in `agent.py`.

## 💰 Cost Estimate

TraceMind uses OpenAI's `gpt-4o-mini` model:
- Approximately **$0.001-0.002 per file explanation**
- Very affordable for personal use
- API calls only made when you request an explanation
- Limited to ~3000 characters of code per request

## 🛡️ Safety & Privacy

- ✅ **Never hardcodes API keys** - uses environment variables
- ✅ **Only sends current file** - not entire repository
- ✅ **Local processing** - your code analysis happens on your machine
- ✅ **Optional git history** - only if file is in a git repo
- ✅ **User-controlled** - API calls only when you explicitly request

## 🔍 Troubleshooting

### "OPENAI_API_KEY not set"
Make sure you've set the environment variable. Check with:
```bash
echo $OPENAI_API_KEY  # Linux/Mac
echo %OPENAI_API_KEY% # Windows
```

### "agent.py not found" (VS Code Extension)
Ensure the agent is installed. The extension looks for `agent.py` in `../agent/agent.py` relative to the extension folder.

### "Python not found"
Ensure Python 3 is installed and in your PATH. Test with:
```bash
python3 --version
```

### "No git history found"
This is normal if the file isn't in a git repository. The agent will still work without git history.

## 📝 Limitations

This is an **MVP (Minimum Viable Product)**:
- Basic file type support
- Simple git history extraction
- No caching or history
- No multi-file analysis
- No configuration files
- No user accounts or cloud sync

## 🚧 Future Work

Potential enhancements:
- More file type support
- Better import analysis
- Caching explanations
- Multi-file/project analysis
- Configuration files
- Better error handling
- Web interface
- CLI improvements

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🤝 Contributing

This is a learning MVP project. Feel free to fork, experiment, and improve!

## ⚠️ Disclaimer

This tool uses OpenAI's API which costs money. Use responsibly and monitor your API usage. The tool is provided as-is for educational and development purposes.

---

**Built for developers, by developers** 🚀

For detailed setup instructions, see the README files in each component directory.

