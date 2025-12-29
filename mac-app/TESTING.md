# Testing the TraceMind Mac App

## Quick Start

1. **Navigate to the mac-app directory:**
   ```bash
   cd mac-app
   ```

2. **Run the app:**
   ```bash
   python3 tracemind_app.py
   ```
   
   Or use the launcher script:
   ```bash
   ./run.sh
   ```

3. **The app window should open!**

## Testing Steps

### Step 1: First Launch
- The app should open with a welcome message
- You should see a prompt to configure your API key (if not already set)

### Step 2: Configure API Key
1. Click the **"⚙️ Settings"** button (top right)
2. Enter your OpenAI API key
3. Click **"Save"**
4. The key will be saved to `../agent/.env`

### Step 3: Select a Test File
1. Click **"Browse..."** button
2. Select any code file (Python, JavaScript, TypeScript, Java, Go)
   - You can test with `../agent/agent.py` as a sample file
3. The file name should appear next to "📄"

### Step 4: Explain the File
1. Click the **"🔍 Explain File"** button
2. Watch the progress indicator at the bottom
3. You should see updates like:
   - "Reading file..."
   - "Extracting imports..."
   - "Checking git history..."
   - "Generating explanation with AI..."
   - "Complete!"

### Step 5: View Results
- The explanation should appear in the output area
- It should be nicely formatted with headers and content
- You can scroll through the explanation

## Troubleshooting Tests

### Test 1: API Key Missing
- Don't set an API key
- Try to explain a file
- Should show a warning message

### Test 2: File Not Selected
- Don't select any file
- Try to click "Explain File"
- Should show a warning message

### Test 3: Agent Not Found
- Temporarily rename the agent directory
- App should show an error when trying to explain
- Rename it back

### Test 4: Invalid API Key
- Enter an invalid API key
- Try to explain a file
- Should show an error from OpenAI

## Expected Behavior

✅ App opens without errors  
✅ Settings dialog works  
✅ File browser opens correctly  
✅ File selection updates UI  
✅ Progress indicators show during analysis  
✅ Explanation appears formatted in output area  
✅ Error messages are helpful and clear  

## Sample Test File

You can test with the agent itself:
```
../agent/agent.py
```

This is a good test because:
- It's a Python file (supported)
- It has imports (will test import extraction)
- It's in a git repo (will test git history)
- It's not too large

## Notes

- Make sure you have an internet connection (uses OpenAI API)
- The first run might take a few seconds
- Each explanation costs ~$0.001-0.002 (uses gpt-4o-mini)
- The app uses the same agent.py script as the CLI version

