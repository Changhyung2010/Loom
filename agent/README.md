# TraceMind Agent

Local Python agent that explains code files using OpenAI API.

## Installation

1. Install Python 3.8 or higher
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Setup

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Set the environment variable:
   
   **Linux/Mac:**
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```
   
   **Windows:**
   ```cmd
   set OPENAI_API_KEY=your_api_key_here
   ```
   
   Or create a `.env` file in this directory:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Usage

```bash
python agent.py /path/to/your/file.py
```

The agent will:
1. Read the file content
2. Extract imports/dependencies
3. Get git history (if in a git repo)
4. Send to OpenAI API for explanation
5. Print the explanation

## Supported File Types

- Python (.py)
- JavaScript/TypeScript (.js, .jsx, .ts, .tsx)
- Java (.java)
- Go (.go)

More file types can be added by extending the `extract_imports` function.

## Cost Estimate

- Uses `gpt-4o-mini` model (cheap)
- Approximately $0.001-0.002 per file explanation
- Limit of ~3000 characters of code sent per request

## Troubleshooting

- **"OPENAI_API_KEY not set"**: Make sure you've set the environment variable
- **"openai package not installed"**: Run `pip install -r requirements.txt`
- **Git history not found**: File must be in a git repository for history

