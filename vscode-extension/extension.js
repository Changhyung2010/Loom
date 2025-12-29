/**
 * TraceMind VS Code Extension
 * Full-featured code explanation with settings, token tracking, and code origins
 */

const vscode = require('vscode');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Find the git repository root
 */
function findGitRoot(filePath) {
    let currentDir = path.dirname(filePath);
    
    while (currentDir !== path.dirname(currentDir)) {
        const gitDir = path.join(currentDir, '.git');
        if (fs.existsSync(gitDir)) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    
    return null;
}

/**
 * Find the agent.py script
 */
function findAgentScript() {
    // Try to find agent.py relative to extension location
    const extensionPath = __dirname;
    const agentPath = path.join(extensionPath, '..', 'agent', 'agent.py');
    
    if (fs.existsSync(agentPath)) {
        return agentPath;
    }
    
    // Try common locations
    const commonPaths = [
        path.join(extensionPath, 'agent.py'),
        path.join(process.env.HOME || process.env.USERPROFILE, 'tracemind', 'agent', 'agent.py'),
    ];
    
    for (const p of commonPaths) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    
    return null;
}

/**
 * Get stored settings
 */
function getSettings(context) {
    const apiKey = context.globalState.get('tracemind.apiKey', '');
    const model = context.globalState.get('tracemind.model', 'gpt-4o-mini');
    const analysisMode = context.globalState.get('tracemind.analysisMode', 'senior');
    const tokenUsage = context.globalState.get('tracemind.tokenUsage', { totalUsed: 0, lastReset: Date.now(), lastUsed: null });
    return { apiKey, model, analysisMode, tokenUsage };
}

/**
 * Save settings
 */
function saveSettings(context, settings) {
    if (settings.apiKey !== undefined) {
        context.globalState.update('tracemind.apiKey', settings.apiKey);
    }
    if (settings.model !== undefined) {
        context.globalState.update('tracemind.model', settings.model);
    }
    if (settings.analysisMode !== undefined) {
        context.globalState.update('tracemind.analysisMode', settings.analysisMode);
    }
    if (settings.tokenUsage !== undefined) {
        context.globalState.update('tracemind.tokenUsage', settings.tokenUsage);
    }
}

/**
 * Execute the agent and get explanation
 */
function explainFile(filePath, apiKey, model, analysisMode, progress, context) {
    return new Promise((resolve, reject) => {
        const agentPath = findAgentScript();
        
        if (!agentPath) {
            reject(new Error('agent.py not found. Please ensure TraceMind agent is installed in the parent directory.'));
            return;
        }
        
        if (!apiKey || !apiKey.trim()) {
            reject(new Error('OpenAI API key not set. Please configure it in TraceMind settings.'));
            return;
        }
        
        // Determine Python command
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        
        // Set environment variables for model and mode
        const env = { 
            ...process.env, 
            OPENAI_API_KEY: apiKey.trim(),
            OPENAI_MODEL: model || 'gpt-4o-mini',
            TRACEMIND_MODE: analysisMode || 'senior'
        };
        
        if (progress) {
            progress.report({ increment: 10, message: "Starting analysis..." });
        }
        
        const childProcess = spawn(pythonCmd, [agentPath, filePath], {
            env: env,
            cwd: path.dirname(agentPath),
            maxBuffer: 1024 * 1024 * 10
        });
        
        let stdout = '';
        let stderr = '';
        
        childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        childProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            // Update progress from stderr messages
            const stderrStr = data.toString();
            if (progress) {
                if (stderrStr.includes('Reading file')) {
                    progress.report({ increment: 20, message: "Reading file..." });
                } else if (stderrStr.includes('Extracting imports')) {
                    progress.report({ increment: 30, message: "Extracting imports..." });
                } else if (stderrStr.includes('git')) {
                    progress.report({ increment: 40, message: "Checking git history..." });
                } else if (stderrStr.includes('OpenAI API') || stderrStr.includes('Calling')) {
                    progress.report({ increment: 50, message: "Generating explanation..." });
                }
            }
        });
        
        childProcess.on('close', (code) => {
            if (code !== 0) {
                let errorMessage = 'Unknown error occurred';
                if (stderr) {
                    if (stderr.includes('OPENAI_API_KEY') || stderr.includes('API key')) {
                        errorMessage = 'OpenAI API key invalid or not set.';
                    } else if (stderr.includes('not found') || stderr.includes('No such file')) {
                        errorMessage = 'Python or agent script not found.';
                    } else {
                        errorMessage = stderr.split('\n').filter(l => l.trim()).join(' ').substring(0, 200);
                    }
                }
                reject(new Error(errorMessage));
                return;
            }
            
            // Parse output - extract explanation and token usage
            let explanation = stdout.trim().replace(/^=+\s*$/gm, '').trim();
            
            // Extract token usage from JSON comment at the end
            const tokenUsageMatch = explanation.match(/<!--\s*{"tokensUsed":\s*(\d+)}\s*-->/);
            if (tokenUsageMatch) {
                const tokensUsed = parseInt(tokenUsageMatch[1], 10);
                explanation = explanation.replace(/<!--\s*{"tokensUsed":\s*\d+}\s*-->/, '').trim();
                
                // Update token usage
                const currentUsage = context.globalState.get('tracemind.tokenUsage', { totalUsed: 0, lastReset: Date.now() });
                const newUsage = {
                    totalUsed: (currentUsage.totalUsed || 0) + tokensUsed,
                    lastReset: currentUsage.lastReset || Date.now(),
                    lastUsed: tokensUsed
                };
                saveSettings(context, { tokenUsage: newUsage });
            }
            
            if (explanation) {
                resolve(explanation);
            } else {
                reject(new Error('No output from agent.'));
            }
        });
        
        childProcess.on('error', (error) => {
            reject(new Error(`Failed to start Python process: ${error.message}`));
        });
    });
}

/**
 * Get webview HTML content
 */
function getWebviewContent(explanation, filePath, context, panel) {
    const settings = getSettings(context);
    const COLORS = {
        bgBase: '#000000',
        bgSurface: '#0a0a0a',
        bgElevated: '#141414',
        bgHover: '#1a1a1a',
        bgInput: '#1a1a1a',
        textPrimary: '#ffffff',
        textSecondary: '#b3b3b3',
        textMuted: '#808080',
        accent: '#ffffff',
        borderSubtle: 'rgba(255, 255, 255, 0.08)',
        borderDefault: 'rgba(255, 255, 255, 0.12)',
    };
    
    // Escape HTML in explanation
    const escapedExplanation = explanation
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Convert markdown to HTML
    let htmlContent = escapedExplanation
        // Code blocks first (must be before other replacements)
        .replace(/```([a-z]+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const codeEscaped = code.trim()
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return '<pre><code>' + codeEscaped + '</code></pre>';
        })
        // Headers
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold and italic (bold first)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Inline code (but not code blocks)
        .replace(/`([^`\n]+)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // Paragraphs
        .split(/\n\n+/)
        .map(p => {
            p = p.trim();
            if (!p || p.startsWith('<')) return p;
            return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
        })
        .join('\n');
    
    // Store original explanation for origins view
    const explanationForOrigins = explanation;
    
    const tokenUsage = settings.tokenUsage || { totalUsed: 0 };
    const tokenDisplay = tokenUsage.totalUsed ? ` | Tokens: ${tokenUsage.totalUsed.toLocaleString()}` : '';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TraceMind Explanation</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${COLORS.bgBase};
            color: ${COLORS.textPrimary};
            padding: 0;
            margin: 0;
            overflow-x: hidden;
        }
        .header {
            background-color: ${COLORS.bgSurface};
            border-bottom: 1px solid ${COLORS.borderSubtle};
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .header h1 {
            font-size: 16px;
            font-weight: 600;
            color: ${COLORS.textPrimary};
        }
        .header-info {
            font-size: 12px;
            color: ${COLORS.textMuted};
        }
        .tabs {
            display: flex;
            gap: 8px;
            padding: 16px 24px;
            background-color: ${COLORS.bgSurface};
            border-bottom: 1px solid ${COLORS.borderSubtle};
        }
        .tab {
            padding: 8px 16px;
            background: transparent;
            border: 1px solid transparent;
            border-radius: 6px;
            color: ${COLORS.textSecondary};
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }
        .tab:hover {
            background-color: ${COLORS.bgElevated};
            color: ${COLORS.textPrimary};
        }
        .tab.active {
            background-color: ${COLORS.bgElevated};
            border-color: ${COLORS.borderDefault};
            color: ${COLORS.textPrimary};
        }
        .content {
            padding: 24px;
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.7;
        }
        .content h1 {
            color: ${COLORS.accent};
            font-size: 24px;
            margin: 24px 0 16px;
            border-bottom: 2px solid ${COLORS.borderDefault};
            padding-bottom: 8px;
        }
        .content h2 {
            color: ${COLORS.accent};
            font-size: 20px;
            margin: 24px 0 12px;
        }
        .content h3 {
            color: ${COLORS.textSecondary};
            font-size: 16px;
            margin: 20px 0 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        .content p {
            margin: 12px 0;
            color: ${COLORS.textPrimary};
        }
        .content code {
            background-color: ${COLORS.bgInput};
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', 'Monaco', monospace;
            font-size: 0.9em;
            color: ${COLORS.textSecondary};
        }
        .content pre {
            background-color: ${COLORS.bgElevated};
            border: 1px solid ${COLORS.borderSubtle};
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 16px 0;
        }
        .content pre code {
            background: transparent;
            padding: 0;
            color: ${COLORS.textPrimary};
        }
        .content a {
            color: ${COLORS.accent};
            text-decoration: none;
        }
        .content a:hover {
            text-decoration: underline;
        }
        .content strong {
            color: ${COLORS.textPrimary};
            font-weight: 600;
        }
        .content ul, .content ol {
            margin: 12px 0 12px 24px;
        }
        .content li {
            margin: 6px 0;
            color: ${COLORS.textPrimary};
        }
        .typing-cursor {
            display: inline-block;
            width: 2px;
            height: 1em;
            background-color: ${COLORS.accent};
            margin-left: 2px;
            animation: blink 0.8s infinite;
            vertical-align: text-bottom;
        }
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        .controls {
            padding: 12px 24px;
            background-color: ${COLORS.bgSurface};
            border-bottom: 1px solid ${COLORS.borderSubtle};
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .btn {
            padding: 6px 12px;
            background-color: ${COLORS.bgElevated};
            border: 1px solid ${COLORS.borderDefault};
            border-radius: 6px;
            color: ${COLORS.textPrimary};
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        .btn:hover {
            background-color: ${COLORS.bgHover};
            border-color: ${COLORS.accent};
        }
        .origins-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            margin-top: 24px;
        }
        .origins-card {
            background-color: ${COLORS.bgElevated};
            border: 1px solid ${COLORS.borderDefault};
            border-radius: 12px;
            padding: 20px;
        }
        .origins-label {
            font-size: 12px;
            color: ${COLORS.textSecondary};
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .origins-value {
            font-size: 16px;
            color: ${COLORS.textPrimary};
            font-weight: 500;
        }
        .origins-value a {
            color: ${COLORS.accent};
        }
        .empty-state {
            text-align: center;
            padding: 64px 24px;
            color: ${COLORS.textMuted};
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <h1>🔍 TraceMind</h1>
            <div class="header-info">${path.basename(filePath)}${tokenDisplay}</div>
        </div>
        <button class="btn" onclick="vscode.postMessage({ command: 'openSettings' })">⚙️ Settings</button>
    </div>
    
    <div class="tabs">
        <button class="tab active" onclick="switchTab('text')">📝 Explanation</button>
        <button class="tab" onclick="switchTab('origins')">🔍 Code Origins</button>
    </div>
    
    <div class="controls" id="controls" style="display: none;">
        <button class="btn" onclick="skipTyping()">Skip</button>
        <button class="btn" onclick="toggleTyping()" id="typingToggle">Typing: On</button>
    </div>
    
    <div class="content" id="content">
        <div id="textView">${htmlContent}</div>
        <div id="originsView" style="display: none;"></div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let typingEnabled = true;
        let fullText = ${JSON.stringify(htmlContent)};
        let displayedText = '';
        let typingInterval = null;
        let currentView = 'text';
        
        function switchTab(view) {
            currentView = view;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById('textView').style.display = view === 'text' ? 'block' : 'none';
            document.getElementById('originsView').style.display = view === 'origins' ? 'block' : 'none';
            document.getElementById('controls').style.display = view === 'text' ? 'flex' : 'none';
            
            if (view === 'text' && typingEnabled && !displayedText) {
                startTyping();
            } else if (view === 'origins') {
                renderOriginsView();
            }
        }
        
        function startTyping() {
            if (typingInterval) clearInterval(typingInterval);
            displayedText = '';
            const contentDiv = document.getElementById('textView');
            const speed = fullText.length > 2000 ? 2 : fullText.length > 1000 ? 5 : 8;
            const chunkSize = fullText.length > 2000 ? 20 : fullText.length > 1000 ? 10 : 3;
            let index = 0;
            
            typingInterval = setInterval(() => {
                index += chunkSize;
                if (index >= fullText.length) {
                    displayedText = fullText;
                    contentDiv.innerHTML = displayedText;
                    if (typingEnabled) {
                        contentDiv.innerHTML += '<span class="typing-cursor"></span>';
                    }
                    clearInterval(typingInterval);
                    typingInterval = null;
                } else {
                    let endIndex = index;
                    while (endIndex < fullText.length && fullText[endIndex] !== ' ' && fullText[endIndex] !== '\n') {
                        endIndex++;
                        if (endIndex - index > 20) break;
                    }
                    displayedText = fullText.substring(0, endIndex);
                    contentDiv.innerHTML = displayedText + (typingEnabled ? '<span class="typing-cursor"></span>' : '');
                    contentDiv.scrollTop = contentDiv.scrollHeight;
                }
            }, speed);
        }
        
        function skipTyping() {
            if (typingInterval) {
                clearInterval(typingInterval);
                typingInterval = null;
            }
            displayedText = fullText;
            document.getElementById('textView').innerHTML = displayedText;
        }
        
        function toggleTyping() {
            typingEnabled = !typingEnabled;
            document.getElementById('typingToggle').textContent = 'Typing: ' + (typingEnabled ? 'On' : 'Off');
            if (!typingEnabled && typingInterval) {
                clearInterval(typingInterval);
                typingInterval = null;
                displayedText = fullText;
                document.getElementById('textView').innerHTML = displayedText;
            } else if (typingEnabled && !displayedText) {
                startTyping();
            }
        }
        
        function renderOriginsView() {
            const explanation = ${JSON.stringify(explanationForOrigins)};
            const originsDiv = document.getElementById('originsView');
            
            // Extract GitHub URL
            const githubMatch = explanation.match(/github\\.com\\/([a-zA-Z0-9_-]+\\/[a-zA-Z0-9_-]+)/i);
            const githubUrl = githubMatch ? 'https://github.com/' + githubMatch[1] : null;
            
            // Extract similar repos
            const relatedSection = explanation.match(/##\\s*Related Projects[^#]*?(?=##|$)/is) || 
                                  explanation.match(/##\\s*Similar Projects[^#]*?(?=##|$)/is);
            const similarRepos = [];
            if (relatedSection) {
                const repoMatches = Array.from(relatedSection[0].matchAll(/-\\s+([a-zA-Z0-9_-]+\\/[a-zA-Z0-9_.-]+)\\s*\\(([0-9,]+)\\s*stars?\\)/gi));
                for (const match of repoMatches) {
                    similarRepos.push({ name: match[1], stars: match[2], url: 'https://github.com/' + match[1] });
                }
            }
            
            let html = '<h1>🔍 Code Origins & Evolution</h1><div class="origins-grid">';
            
            if (githubUrl) {
                html += '<div class="origins-card"><div class="origins-label">📦 Repository</div><div class="origins-value"><a href="' + githubUrl + '" target="_blank">' + githubMatch[1] + '</a></div></div>';
            }
            
            if (similarRepos.length > 0) {
                html += '<div class="origins-card"><div class="origins-label">🔗 Similar Projects</div>';
                similarRepos.forEach(function(repo) {
                    html += '<div class="origins-value" style="margin-bottom: 8px;"><a href="' + repo.url + '" target="_blank">' + repo.name + '</a> (⭐ ' + repo.stars + ')</div>';
                });
                html += '</div>';
            }
            
            html += '</div>';
            originsDiv.innerHTML = html;
        }
        
        // Start typing animation if enabled
        if (typingEnabled) {
            startTyping();
        } else {
            displayedText = fullText;
            document.getElementById('textView').innerHTML = displayedText;
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateContent') {
                fullText = message.content;
                if (currentView === 'text') {
                    startTyping();
                }
            }
        });
    </script>
</body>
</html>`;
}

/**
 * Show settings UI
 */
async function showSettings(context) {
    const settings = getSettings(context);
    const apiKey = await vscode.window.showInputBox({
        prompt: 'OpenAI API Key',
        password: true,
        value: settings.apiKey,
        placeHolder: 'sk-...'
    });
    
    if (apiKey !== undefined) {
        const models = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
        const model = await vscode.window.showQuickPick(
            models.map(m => ({ label: m, description: m === 'gpt-4o-mini' ? 'Fast' : m === 'gpt-4o' ? 'Recommended' : '' })),
            { placeHolder: 'Select AI Model', value: settings.model }
        );
        
        if (model) {
            const modes = [
                { label: 'Senior Developer', value: 'senior', description: 'Concise, direct explanations' },
                { label: 'Beginner Friendly', value: 'beginner', description: 'Detailed, step-by-step' }
            ];
            const mode = await vscode.window.showQuickPick(
                modes,
                { placeHolder: 'Select Analysis Mode', value: settings.analysisMode }
            );
            
            if (mode) {
                saveSettings(context, {
                    apiKey: apiKey,
                    model: model.label,
                    analysisMode: mode.value
                });
                vscode.window.showInformationMessage('TraceMind settings saved!');
            }
        }
    }
}

/**
 * Show explanation in webview panel
 */
function showExplanationInPanel(explanation, filePath, context) {
    const panel = vscode.window.createWebviewPanel(
        'tracemindExplanation',
        `TraceMind: ${path.basename(filePath)}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    panel.webview.html = getWebviewContent(explanation, filePath, context, panel);
    
    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'openSettings') {
                showSettings(context).then(() => {
                    // Refresh webview with updated settings
                    panel.webview.html = getWebviewContent(explanation, filePath, context, panel);
                });
            }
        },
        undefined,
        context.subscriptions
    );
    
    return panel;
}

/**
 * Activate the extension
 */
function activate(context) {
    console.log('TraceMind extension is now active');
    
    // Command: Explain current file
    let explainCommand = vscode.commands.registerCommand('tracemind.explainFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor. Please open a file first.');
            return;
        }
        
        const document = editor.document;
        const filePath = document.fileName;
        
        if (document.isUntitled) {
            const action = await vscode.window.showWarningMessage(
                'Please save the file before explaining it.',
                'Save'
            );
            if (action === 'Save') {
                await document.save();
            } else {
                return;
            }
        }
        
        const settings = getSettings(context);
        
        if (!settings.apiKey || !settings.apiKey.trim()) {
            const action = await vscode.window.showWarningMessage(
                'OpenAI API key not configured. Please set it up first.',
                'Configure'
            );
            if (action === 'Configure') {
                await showSettings(context);
                return;
            }
        }
        
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "TraceMind",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Starting analysis..." });
                
                const explanation = await explainFile(
                    filePath, 
                    settings.apiKey, 
                    settings.model, 
                    settings.analysisMode, 
                    progress, 
                    context
                );
                
                progress.report({ increment: 100, message: "Complete!" });
                
                showExplanationInPanel(explanation, filePath, context);
            });
            
        } catch (error) {
            vscode.window.showErrorMessage(`TraceMind Error: ${error.message}`);
            console.error('TraceMind error:', error);
        }
    });
    
    // Command: Open settings
    let settingsCommand = vscode.commands.registerCommand('tracemind.settings', async () => {
        await showSettings(context);
    });
    
    // Command: Reset token usage
    let resetTokensCommand = vscode.commands.registerCommand('tracemind.resetTokens', async () => {
        saveSettings(context, {
            tokenUsage: { totalUsed: 0, lastReset: Date.now(), lastUsed: null }
        });
        vscode.window.showInformationMessage('Token usage reset!');
    });
    
    context.subscriptions.push(explainCommand, settingsCommand, resetTokensCommand);
}

/**
 * Deactivate the extension
 */
function deactivate() {
    console.log('TraceMind extension is now deactivated');
}

module.exports = {
    activate,
    deactivate
};
