/**
 * TraceMind VS Code Extension
 * Explains the current file using the local Python agent
 */

const vscode = require('vscode');
const { exec } = require('child_process');
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
 * Execute the agent and get explanation
 */
function explainFile(filePath, progress) {
    return new Promise((resolve, reject) => {
        const agentPath = findAgentScript();
        
        if (!agentPath) {
            reject(new Error('agent.py not found. Please ensure TraceMind agent is installed in the parent directory.'));
            return;
        }
        
        // Determine Python command
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        
        // Build command with proper escaping
        const command = `"${pythonCmd}" "${agentPath}" "${filePath}"`;
        
        // Show loading message
        vscode.window.setStatusBarMessage('TraceMind: Analyzing file...', 1000);
        
        if (progress) {
            progress.report({ increment: 10, message: "Reading file..." });
        }
        
        const childProcess = exec(command, { 
            maxBuffer: 1024 * 1024 * 10,
            cwd: path.dirname(agentPath),
            env: { ...process.env }
        }, (error, stdout, stderr) => {
            if (error) {
                // Parse error messages for better user experience
                let errorMessage = error.message;
                
                if (stderr) {
                    if (stderr.includes('OPENAI_API_KEY')) {
                        errorMessage = 'OpenAI API key not set. Please set OPENAI_API_KEY environment variable or create a .env file.';
                    } else if (stderr.includes('not found') || stderr.includes('No such file')) {
                        errorMessage = 'Python or agent script not found. Please ensure Python 3.8+ is installed and agent.py is accessible.';
                    } else if (stderr.includes('openai')) {
                        errorMessage = 'OpenAI package not installed. Run: pip install -r requirements.txt';
                    } else {
                        errorMessage = `Error: ${stderr.split('\n').filter(l => l.trim()).join(' ')}`;
                    }
                }
                
                reject(new Error(errorMessage));
                return;
            }
            
            // Extract explanation (remove separator lines)
            let output = stdout.trim();
            // Remove the === separator lines that agent.py adds
            output = output.replace(/^=+\s*$/gm, '').trim();
            
            if (output) {
                resolve(output);
            } else {
                reject(new Error('No output from agent. Check that OPENAI_API_KEY is set and your file is valid.'));
            }
        });
        
        // Monitor stderr for progress updates
        if (childProcess.stderr) {
            let stderrBuffer = '';
            childProcess.stderr.on('data', (data) => {
                stderrBuffer += data.toString();
                const lines = stderrBuffer.split('\n');
                stderrBuffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (progress) {
                        if (line.includes('Reading file')) {
                            progress.report({ increment: 20, message: "Reading file..." });
                        } else if (line.includes('Extracting imports')) {
                            progress.report({ increment: 30, message: "Extracting imports..." });
                        } else if (line.includes('git repo')) {
                            progress.report({ increment: 40, message: "Checking git history..." });
                        } else if (line.includes('Calling OpenAI API')) {
                            progress.report({ increment: 50, message: "Generating explanation with AI..." });
                        }
                    }
                }
            });
        }
    });
}

/**
 * Show explanation in a webview panel with markdown rendering
 */
function showExplanationInPanel(explanation, filePath) {
    const panel = vscode.window.createWebviewPanel(
        'tracemindExplanation',
        `TraceMind: ${path.basename(filePath)}`,
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );
    
    // Convert markdown to HTML (simple but effective conversion)
    const markdownToHtml = (md) => {
        let html = md;
        
        // Escape HTML first
        html = html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Code blocks (triple backticks) - do this before other replacements
        html = html.replace(/```[\s\S]*?```/g, (match) => {
            const code = match.replace(/```/g, '').trim();
            return '<pre><code>' + code + '</code></pre>';
        });
        
        // Headers (must be before other replacements)
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // Bold and italic (bold first)
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Inline code (but not code blocks)
        html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
        
        // Lists - handle numbered lists
        html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
        
        // Wrap consecutive <li> in <ol>
        html = html.replace(/(<li>.*?<\/li>\s*)+/g, (match) => {
            if (match.trim()) {
                return '<ol>' + match + '</ol>';
            }
            return match;
        });
        
        // Bullet lists
        html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
        
        // Wrap consecutive <li> in <ul> if not already in <ol>
        html = html.replace(/(<li>.*?<\/li>\s*)+/g, (match) => {
            if (match.trim() && !match.includes('<ol>')) {
                return '<ul>' + match + '</ul>';
            }
            return match;
        });
        
        // Paragraphs - split by double newlines and wrap
        const parts = html.split(/\n\n+/);
        html = parts.map(p => {
            p = p.trim();
            if (!p) return '';
            if (p.startsWith('<')) return p; // Already formatted
            return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
        }).join('\n\n');
        
        return html;
    };
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TraceMind Explanation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            max-width: 900px;
            margin: 0 auto;
        }
        h1 {
            color: var(--vscode-textLink-foreground);
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            padding-bottom: 10px;
            margin-top: 30px;
        }
        h2 {
            color: var(--vscode-textLink-foreground);
            margin-top: 25px;
        }
        h3 {
            color: var(--vscode-foreground);
            margin-top: 20px;
        }
        code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        ul, ol {
            margin-left: 20px;
        }
        li {
            margin: 5px 0;
        }
        .header {
            background: var(--vscode-textBlockQuote-background);
            padding: 15px;
            border-left: 4px solid var(--vscode-textLink-foreground);
            margin-bottom: 20px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 TraceMind Explanation</h1>
        <p><strong>File:</strong> ${path.basename(filePath)}</p>
    </div>
    <div class="content">
        ${markdownToHtml(explanation)}
    </div>
</body>
</html>`;
    
    panel.webview.html = htmlContent;
    return panel;
}

/**
 * Activate the extension
 */
function activate(context) {
    console.log('TraceMind extension is now active');
    
    // Shared function to explain a file
    const explainCurrentFile = async (document) => {
        if (!document) {
            vscode.window.showWarningMessage('No active editor. Please open a file first.');
            return;
        }
        
        const filePath = document.fileName;
        
        // Check if file is saved
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
        
        try {
            // Show progress
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "TraceMind",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Starting analysis..." });
                
                const explanation = await explainFile(filePath, progress);
                
                progress.report({ increment: 100, message: "Complete!" });
                
                // Show in both webview panel and output channel
                const panel = showExplanationInPanel(explanation, filePath);
                
                // Also add to output channel for reference
                const outputChannel = vscode.window.createOutputChannel('TraceMind');
                outputChannel.clear();
                outputChannel.appendLine(`TraceMind Explanation for: ${path.basename(filePath)}`);
                outputChannel.appendLine('='.repeat(70));
                outputChannel.appendLine(explanation);
                
                // Show notification
                const action = await vscode.window.showInformationMessage(
                    `TraceMind: Explanation ready for ${path.basename(filePath)}!`,
                    'View in Output Panel'
                );
                
                if (action === 'View in Output Panel') {
                    outputChannel.show();
                }
            });
            
        } catch (error) {
            vscode.window.showErrorMessage(`TraceMind Error: ${error.message}`);
            console.error('TraceMind error:', error);
            
            // Show helpful troubleshooting tips
            if (error.message.includes('API key') || error.message.includes('OPENAI_API_KEY')) {
                vscode.window.showInformationMessage(
                    'Tip: Set OPENAI_API_KEY environment variable or create a .env file in the agent directory.',
                    'Learn More'
                ).then(selection => {
                    if (selection === 'Learn More') {
                        vscode.env.openExternal(vscode.Uri.parse('https://platform.openai.com/api-keys'));
                    }
                });
            }
        }
    };
    
    // Register the main command
    let explainCommand = vscode.commands.registerCommand('tracemind.explainFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await explainCurrentFile(editor.document);
        }
    });
    
    context.subscriptions.push(explainCommand);
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

