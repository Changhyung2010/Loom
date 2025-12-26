# TraceMind - Mac App

AI-powered code explanation tool for macOS. Get intelligent, detailed explanations of your code files with interactive visualizations.

## Features

- 🤖 **AI-Powered Analysis**: Deep code analysis using OpenAI's GPT models
- 🗺️ **Interactive Mind Maps**: Visual representation of code structure and relationships
- 🎨 **Modern UI**: Beautiful dark theme matching the TraceMind website
- 🔄 **Multiple AI Models**: Choose from GPT-4o, GPT-4 Turbo, GPT-4, GPT-4o Mini, or GPT-3.5 Turbo
- 📁 **Multi-Language Support**: Works with 50+ programming languages
- 🔐 **Secure**: API keys stored locally, never shared
- ⚡ **Fast**: Optimized for performance and responsiveness

## Prerequisites

Before using TraceMind, you need:

1. **Python 3.8+** - For running the code analysis agent
   ```bash
   python3 --version  # Check if installed
   ```

2. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

3. **Node.js 16+** (for building from source) - Only needed if building the app yourself

## Installation

### Option 1: Download Pre-built App (Recommended)

1. Download the latest release from the [Releases page](../../releases)
2. Open the `.dmg` file
3. Drag TraceMind to your Applications folder
4. Open TraceMind from Applications
5. Sign in with your TraceMind account
6. Configure your OpenAI API key in Settings

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/Changhyung2010/tracemind.git
cd tracemind/mac-app-react

# Install dependencies
npm install

# Install Python dependencies for the agent
cd ../agent
pip install -r requirements.txt

# Build the app
cd ../mac-app-react
npm run build

# Package the app
npm run electron-build
```

The packaged app will be in the `dist` folder.

## Usage

### First Time Setup

1. **Sign In**: The app will open to the authentication page. Sign in with your TraceMind account.

2. **Configure API Key**:
   - Click the "Settings" button in the header
   - Enter your OpenAI API key (starts with `sk-`)
   - Select your preferred AI model
   - Click "Save"

3. **Select a Code File**:
   - Click "Browse..." to select a code file
   - The app supports 50+ programming languages

4. **Get Explanation**:
   - Click "Explain File"
   - Wait for the AI analysis (usually 10-30 seconds)
   - View the explanation in text or interactive mind map format

### Features Guide

#### View Modes

- **Text View**: Read the detailed markdown explanation
- **Mind Map**: Interactive visual diagram showing code structure, functions, and relationships

Switch between views using the toggle buttons at the top of the explanation panel.

#### AI Models

Choose from different models based on your needs:

- **GPT-4o Mini** (Default): Fast and cost-effective for quick explanations
- **GPT-4o**: Recommended balance of speed and quality
- **GPT-4 Turbo**: Higher quality analysis with enhanced reasoning
- **GPT-4**: Maximum quality, best for complex codebases
- **GPT-3.5 Turbo**: Fastest option, basic quality

Change your model preference in Settings.

## Supported Languages

TraceMind supports 50+ programming languages including:

**Web**: HTML, CSS, SCSS, JavaScript, TypeScript, JSX, TSX, Vue, Svelte  
**Backend**: Python, Java, Kotlin, C/C++, C#, Go, Rust, Ruby, PHP, Swift  
**Scripting**: Lua, Perl, R, Dart, Elixir, F#, OCaml  
**Data**: JSON, XML, YAML, SQL  
**And many more...**

## Troubleshooting

### Agent Script Not Found

If you see "Agent script not found":

1. Make sure Python 3.8+ is installed
2. Install the agent dependencies:
   ```bash
   cd agent
   pip install -r requirements.txt
   ```
3. For packaged app: The agent should be included. If not, try:
   ```bash
   # Install agent manually
   mkdir -p ~/tracemind
   cp -r agent ~/tracemind/
   cd ~/tracemind/agent
   pip install -r requirements.txt
   ```

### API Key Errors

- Ensure your API key is valid and has credits
- Check that you've copied the full key (starts with `sk-`)
- Verify your OpenAI account has API access enabled

### App Won't Start

- Check macOS version (macOS 10.13 or later required)
- Try right-clicking the app and selecting "Open" (to bypass Gatekeeper)
- Check Console.app for error messages

### Explanation Not Generating

- Verify your OpenAI API key is correct
- Check your internet connection
- Try selecting a different model in Settings
- Ensure the file you selected is readable

## Development

### Running in Development Mode

```bash
# Start React dev server
npm start

# In another terminal, start Electron
npm run electron-dev
```

### Project Structure

```
mac-app-react/
├── public/
│   ├── electron.js      # Electron main process
│   └── preload.js       # Preload script for IPC
├── src/
│   ├── components/      # React components
│   ├── App.js          # Main app component
│   └── index.js        # React entry point
├── assets/             # App icons and resources
└── package.json        # Dependencies and build config
```

## Security & Privacy

- Your API key is stored locally on your device using Electron's secure storage
- Code files are analyzed locally by the Python agent
- Only code content is sent to OpenAI API for analysis
- No code is stored or logged by TraceMind
- All communication uses HTTPS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See the main repository LICENSE file.

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check the [Documentation](../../README.md)

## Credits

Built with:
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://reactjs.org/) - UI framework
- [ReactFlow](https://reactflow.dev/) - Interactive diagrams
- [OpenAI API](https://openai.com/) - AI code analysis
