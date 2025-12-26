const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const Store = require('electron-store');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const store = new Store();

let mainWindow;
// Store active analysis process per renderer window (we only support one active process at a time)
const activeProcesses = new Map();

function createWindow() {
  const isDev = process.env.ELECTRON_IS_DEV === '1';
  
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      sandbox: false  // Required for Python subprocess
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    show: true,
    // icon: path.join(__dirname, '..', 'assets', 'icon.png')  // App icon (optional)
  });
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('get-api-key', () => {
  return store.get('apiKey', '');
});

ipcMain.handle('save-api-key', (event, apiKey) => {
  store.set('apiKey', apiKey);
  return true;
});

ipcMain.handle('get-github-token', () => {
  return store.get('githubToken', '');
});

ipcMain.handle('save-github-token', (event, token) => {
  store.set('githubToken', token);
  return true;
});

ipcMain.handle('get-model', () => {
  return store.get('aiModel', 'gpt-4o-mini');
});

ipcMain.handle('save-model', (event, model) => {
  store.set('aiModel', model);
  return true;
});

ipcMain.handle('get-analysis-mode', () => {
  return store.get('analysisMode', 'senior');
});

ipcMain.handle('save-analysis-mode', (event, mode) => {
  store.set('analysisMode', mode);
  return true;
});

ipcMain.handle('get-theme', () => {
  return store.get('theme', 'dark');
});

ipcMain.handle('save-theme', (event, theme) => {
  store.set('theme', theme);
  return true;
});

ipcMain.handle('get-layout', () => {
  return store.get('layout', 'top'); // 'top' or 'sidebar'
});

ipcMain.handle('save-layout', (event, layout) => {
  store.set('layout', layout);
  return true;
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
  return true;
});

ipcMain.handle('get-token-usage', () => {
  return store.get('tokenUsage', { totalUsed: 0, lastReset: Date.now(), lastUsed: null });
});

ipcMain.handle('get-token-history', () => {
  return store.get('tokenHistory', []);
});

ipcMain.handle('add-token-history', (event, entry) => {
  const history = store.get('tokenHistory', []);
  history.unshift({
    ...entry,
    timestamp: entry.timestamp || Date.now(),
  });
  // Keep only last 100 entries
  if (history.length > 100) {
    history.splice(100);
  }
  store.set('tokenHistory', history);
  return history;
});

ipcMain.handle('reset-token-usage', () => {
  store.set('tokenUsage', { totalUsed: 0, lastReset: Date.now(), lastUsed: null });
  return true;
});

ipcMain.handle('get-available-tokens', () => {
  return store.get('availableTokens', null);
});

ipcMain.handle('add-available-tokens', (event, amount) => {
  const current = store.get('availableTokens', null);
  if (current === null) return null; // Admin/unlimited
  const newTotal = (current || 0) + amount;
  store.set('availableTokens', newTotal);
  return newTotal;
});

ipcMain.handle('deduct-available-tokens', (event, amount) => {
  const current = store.get('availableTokens', null);
  if (current === null) return null; // Admin/unlimited
  const newTotal = Math.max(0, current - amount);
  store.set('availableTokens', newTotal);
  return newTotal;
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { 
        name: 'All Supported Code Files', 
        extensions: [
          // Tier 1 - Core Languages
          'js', 'jsx', 'mjs', 'cjs',           // JavaScript
          'ts', 'tsx',                         // TypeScript
          'py', 'pyw', 'pyx',                  // Python
          'java',                              // Java
          'cpp', 'cxx', 'cc', 'c++',          // C++
          'c', 'h',                            // C
          
          // Tier 2 - Very Strong Additions
          'go',                                // Go
          'rs',                                // Rust
          'cs',                                // C#
          'php', 'phtml',                      // PHP
          'rb', 'rbw',                         // Ruby
          'swift',                             // Swift
          'kt', 'kts',                         // Kotlin
          
          // Tier 3 - Frontend & Config
          'html', 'htm', 'xhtml',              // HTML
          'css',                               // CSS
          'scss', 'sass',                      // SCSS/SASS
          'json',                              // JSON
          'yaml', 'yml',                       // YAML
          'toml',                              // TOML
          'xml',                               // XML
          'ini', 'cfg', 'conf',                // INI
          
          // Tier 4 - Scripting & Shell
          'sh', 'bash', 'zsh', 'fish',         // Shell scripts
          'ps1', 'psm1',                       // PowerShell
          'makefile', 'mk',                    // Makefile
          'dockerfile',                        // Dockerfile
          
          // Tier 5 - Advanced/Optional
          'scala', 'sc',                       // Scala
          'hs', 'lhs',                         // Haskell
          'ex', 'exs',                         // Elixir
          'lua',                               // Lua
          'r',                                 // R
          'm',                                 // MATLAB
          'pl', 'pm',                          // Perl
          
          // Additional common extensions
          'dart',                              // Dart
          'vue', 'svelte',                     // Frontend frameworks
          'md', 'markdown',                    // Markdown
          'txt',                               // Plain text
          'clj', 'cljs', 'cljc',               // Clojure
          'hpp', 'hxx', 'hh',                  // C++ headers
          'less',                              // LESS
          'styl', 'stylus',                    // Stylus
          'jsx',                               // JSX (already listed but ensuring)
          'tsx',                               // TSX (already listed but ensuring)
          'graphql', 'gql',                    // GraphQL
          'sql',                               // SQL
          'plist',                             // Property List (macOS/iOS)
        ]
      },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-project', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Get file statistics (size, line count)
ipcMain.handle('get-file-stats', async (event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
    const fileSize = stats.size; // in bytes
    
    // Count lines (read file content)
    const content = fs.readFileSync(filePath, 'utf-8');
    const lineCount = content.split('\n').length;
    const charCount = content.length;
    
    return {
      size: fileSize,
      lineCount: lineCount,
      charCount: charCount
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return null;
  }
});

// Get project statistics (file count, total size, average file size)
ipcMain.handle('get-project-stats', async (event, projectPath) => {
  try {
    if (!projectPath || !fs.existsSync(projectPath)) {
      return null;
    }
    
    const codeExtensions = [
      // Common code file extensions
      'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'py', 'pyw', 'pyx',
      'java', 'cpp', 'cxx', 'cc', 'c', 'h', 'go', 'rs', 'cs',
      'php', 'phtml', 'rb', 'rbw', 'swift', 'kt', 'kts',
      'html', 'htm', 'xhtml', 'css', 'scss', 'sass', 'json',
      'yaml', 'yml', 'toml', 'xml', 'sh', 'bash', 'zsh', 'fish',
      'ps1', 'psm1', 'makefile', 'mk', 'dockerfile', 'scala', 'sc',
      'hs', 'lhs', 'ex', 'exs', 'lua', 'r', 'm', 'pl', 'pm',
      'dart', 'vue', 'svelte', 'md', 'markdown', 'txt', 'clj', 'cljs',
      'cljc', 'hpp', 'hxx', 'hh', 'less', 'styl', 'stylus',
      'graphql', 'gql', 'sql'
    ];
    
    let totalFiles = 0;
    let totalSize = 0;
    let totalLines = 0;
    const ignoredDirs = ['node_modules', '.git', 'dist', 'build', '.next', 
                         '__pycache__', '.venv', 'venv', 'env', '.env',
                         'vendor', 'bin', 'obj', '.vs', '.idea', '.vscode',
                         'coverage', '.nyc_output', 'target', 'out'];
    
    function walkDir(dir, callback) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip ignored directories
          if (!ignoredDirs.includes(file)) {
            walkDir(fullPath, callback);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(file).slice(1).toLowerCase();
          if (codeExtensions.includes(ext) || ext === '') {
            callback(fullPath, stat);
          }
        }
      }
    }
    
    walkDir(projectPath, (filePath, stat) => {
      totalFiles++;
      totalSize += stat.size;
      
      // Count lines for code files
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        totalLines += content.split('\n').length;
      } catch (e) {
        // Skip binary files or files we can't read
      }
    });
    
    return {
      fileCount: totalFiles,
      totalSize: totalSize,
      totalLines: totalLines,
      avgFileSize: totalFiles > 0 ? totalSize / totalFiles : 0
    };
  } catch (error) {
    console.error('Error getting project stats:', error);
    return null;
  }
});

ipcMain.handle('find-agent-script', async () => {
  const appPath = app.getAppPath();
  const isPackaged = app.isPackaged;
  
  const agentPaths = [];
  
  if (isPackaged) {
    // In packaged app, agent should be in extraFiles
    agentPaths.push(
      path.join(process.resourcesPath, 'agent', 'agent.py'),
      path.join(appPath, 'agent', 'agent.py'),
      path.join(path.dirname(process.execPath), 'agent', 'agent.py')
    );
  } else {
    // Development paths
    agentPaths.push(
      path.join(appPath, '..', '..', 'agent', 'agent.py'),
      path.join(__dirname, '..', '..', 'agent', 'agent.py')
    );
  }
  
  // User home paths (for standalone installation)
  agentPaths.push(
    path.join(process.env.HOME, 'tracemind', 'agent', 'agent.py'),
    path.join('/usr/local', 'tracemind', 'agent', 'agent.py'),
    path.join('/opt', 'tracemind', 'agent', 'agent.py')
  );

  for (const agentPath of agentPaths) {
    try {
      if (fs.existsSync(agentPath)) {
        store.set('agentPath', agentPath);
        console.log('Found agent at:', agentPath);
        return agentPath;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  console.error('Agent script not found in any of these paths:', agentPaths);
  return null;
});

// GitHub API Utility Functions
function parseGitHubUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  // Handle various URL formats
  let normalized = trimmed;
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    if (normalized.includes('github.com')) {
      normalized = `https://${normalized}`;
    } else {
      normalized = `https://github.com/${normalized}`;
    }
  }
  
  // Remove query parameters, fragments, and trailing slashes
  normalized = normalized.split('?')[0].split('#')[0].replace(/\/+$/, '');
  
  // Extract owner/repo - more permissive regex to handle various formats
  const match = normalized.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (match && match[1] && match[2]) {
    const owner = match[1];
    let repo = match[2].replace(/\.git$/, '');
    
    return {
      owner: owner,
      repo: repo,
      fullName: `${owner}/${repo}`
    };
  }
  
  return null;
}

// GitHub Web Scraper Functions
function fetchGitHubPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'github.com',
      path: url,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else if (res.statusCode === 404) {
          resolve(null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

function extractJSONFromHTML(html, pattern) {
  const match = html.match(pattern);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.warn('Failed to parse JSON from HTML:', e);
      return null;
    }
  }
  return null;
}

function parseRepoSummary(html, owner, repo) {
  try {
    const result = {
      name: repo,
      full_name: `${owner}/${repo}`,
      description: '',
      url: `https://github.com/${owner}/${repo}`,
      stars: 0,
      forks: 0,
      language: null,
      license: null,
      created_at: null,
      updated_at: null,
      topics: []
    };
    
    // Try to extract JSON-LD structured data first (most reliable)
    const jsonLdMatch = html.match(/<script[^>]*type="application\/json"[^>]*data-target="react-app\.embeddedData"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        // Navigate through the nested structure to find repo data
        if (jsonData.payload && jsonData.payload.repository) {
          const repoData = jsonData.payload.repository;
          if (repoData.description) result.description = repoData.description;
          if (repoData.stargazerCount !== undefined) result.stars = repoData.stargazerCount;
          if (repoData.forkCount !== undefined) result.forks = repoData.forkCount;
          if (repoData.primaryLanguage && repoData.primaryLanguage.name) result.language = repoData.primaryLanguage.name;
          if (repoData.repositoryTopics && repoData.repositoryTopics.nodes) {
            result.topics = repoData.repositoryTopics.nodes.map(node => node.topic.name);
          }
          if (repoData.createdAt) result.created_at = repoData.createdAt;
          if (repoData.updatedAt) result.updated_at = repoData.updatedAt;
          if (repoData.licenseInfo && repoData.licenseInfo.name) result.license = repoData.licenseInfo.name;
          console.log('GitHub Scraper: Extracted data from JSON-LD:', result);
          return result;
        }
      } catch (e) {
        console.warn('Failed to parse JSON-LD:', e);
      }
    }
    
    // Extract description from meta tag or page title
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (descMatch && descMatch[1] !== `${owner}/${repo}`) {
      result.description = descMatch[1];
    }
    
    // Extract stars - multiple patterns to try
    const starsPatterns = [
      /href="[^"]*\/stargazers[^"]*"[^>]*>[\s\n]*(?:<svg[^>]*>[\s\S]*?<\/svg>)?[\s\n]*(?:<span[^>]*>)?[\s\n]*<strong[^>]*>([\d,]+)</i,
      /href="[^"]*\/stargazers[^"]*"[^>]*>[\s\n]*([\d,]+)[\s\n]*<\/a>/i,
      /<a[^>]*href="[^"]*\/stargazers[^"]*"[^>]*>[\s\S]*?([\d,]+)[\s\S]*?<\/a>/i,
      /(\d+[\d,]*)\s+stars/i,
      /"stargazers_count":\s*(\d+)/i
    ];
    for (const pattern of starsPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const stars = parseInt(match[1].replace(/,/g, '').replace(/[^\d]/g, ''));
        if (stars > 0) {
          result.stars = stars;
          break;
        }
      }
    }
    
    // Extract forks - multiple patterns to try
    const forksPatterns = [
      /href="[^"]*\/network\/members[^"]*"[^>]*>[\s\n]*(?:<svg[^>]*>[\s\S]*?<\/svg>)?[\s\n]*(?:<span[^>]*>)?[\s\n]*<strong[^>]*>([\d,]+)</i,
      /href="[^"]*\/network\/members[^"]*"[^>]*>[\s\n]*([\d,]+)[\s\n]*<\/a>/i,
      /<a[^>]*href="[^"]*\/network\/members[^"]*"[^>]*>[\s\S]*?([\d,]+)[\s\S]*?<\/a>/i,
      /(\d+[\d,]*)\s+forks/i,
      /"forks_count":\s*(\d+)/i
    ];
    for (const pattern of forksPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const forks = parseInt(match[1].replace(/,/g, '').replace(/[^\d]/g, ''));
        if (forks > 0) {
          result.forks = forks;
          break;
        }
      }
    }
    
    // Extract language
    const langMatch1 = html.match(/<span[^>]*itemprop="programmingLanguage"[^>]*>([^<]+)</i);
    const langMatch2 = html.match(/<a[^>]*href="[^"]*\/languages"[^>]*>([^<]+)</i);
    if (langMatch1) {
      result.language = langMatch1[1].trim();
    } else if (langMatch2) {
      result.language = langMatch2[1].trim().split('\n')[0].trim();
    }
    
    // Extract topics/tags
    const topicMatches = html.matchAll(/<a[^>]*href="[^"]*\/topics\/[^"]*"[^>]*class="[^"]*topic-tag[^"]*"[^>]*>[\s\n]*([^<\n]+)/gi);
    for (const match of topicMatches) {
      const topic = match[1].trim();
      if (topic && !result.topics.includes(topic)) {
        result.topics.push(topic);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing repo summary:', error);
    return null;
  }
}

function parseContributors(html) {
  const contributors = [];
  try {
    // Extract contributor data from HTML - look for user profile links
    const contributorMatches = html.matchAll(/<a[^>]*href="\/([a-zA-Z0-9_.-]+)"[^>]*data-hovercard-user-id[^>]*>/gi);
    const seen = new Set();
    for (const match of contributorMatches) {
      const username = match[1];
      if (username && !seen.has(username) && username !== 'sponsors' && username !== 'login' && username !== 'signup') {
        seen.add(username);
        contributors.push({
          username: username,
          contributions: 0,
          avatar_url: `https://github.com/${username}.png`,
          profile_url: `https://github.com/${username}`
        });
        if (contributors.length >= 10) break;
      }
    }
    return contributors;
  } catch (error) {
    console.error('Error parsing contributors:', error);
    return [];
  }
}

function parseCommits(html) {
  try {
    const commitsByAuthor = {};
    const commitMatches = html.matchAll(/<a[^>]*class="[^"]*Link--primary[^"]*"[^>]*>([^<]+)<\/a>/gi);
    let count = 0;
    for (const match of commitMatches) {
      const text = match[1].trim();
      // Try to extract author names from commit messages or links
      if (text.length > 0 && text.length < 50) {
        count++;
      }
    }
    return {
      total_commits: Math.min(count, 100),
      commits_by_author: {}
    };
  } catch (error) {
    console.error('Error parsing commits:', error);
    return { total_commits: 0, commits_by_author: {} };
  }
}

function parseReleases(html) {
  try {
    const releases = [];
    const releaseMatches = html.matchAll(/<a[^>]*href="[^"]*\/releases\/tag\/([^"]+)"[^>]*>([^<]+)</gi);
    for (const match of releaseMatches) {
      releases.push({
        tag_name: match[1],
        published_at: new Date().toISOString() // Can't easily get from HTML
      });
    }
    return {
      first_release: releases.length > 0 ? releases[releases.length - 1] : null,
      latest_release: releases.length > 0 ? releases[0] : null,
      total_releases: releases.length
    };
  } catch (error) {
    console.error('Error parsing releases:', error);
    return { total_releases: 0 };
  }
}

ipcMain.handle('explain-file', async (event, filePath, apiKey, model, analysisMode, githubUrl = '') => {
  return new Promise((resolve, reject) => {
    const isDev = process.env.ELECTRON_IS_DEV === '1';
    let agentPath = null;
    
    // In development mode, always use the development agent path (don't use cached path)
    if (!isDev) {
      agentPath = store.get('agentPath');
    }
    
    // If not stored or in dev mode, try to find it
    if (!agentPath || !fs.existsSync(agentPath)) {
      const appPath = app.getAppPath();
      const isPackaged = app.isPackaged;
      
      const agentPaths = [];
      
      if (isPackaged) {
        agentPaths.push(
          path.join(process.resourcesPath, 'agent', 'agent.py'),
          path.join(appPath, 'agent', 'agent.py'),
          path.join(path.dirname(process.execPath), 'agent', 'agent.py')
        );
      } else {
        // In dev mode, prioritize the development agent path
        agentPaths.push(
          path.join(__dirname, '..', '..', 'agent', 'agent.py'),
          path.join(appPath, '..', '..', 'agent', 'agent.py')
        );
      }
      
      agentPaths.push(
        path.join(process.env.HOME, 'tracemind', 'agent', 'agent.py'),
        path.join('/usr/local', 'tracemind', 'agent', 'agent.py'),
        path.join('/opt', 'tracemind', 'agent', 'agent.py')
      );

      for (const pathToCheck of agentPaths) {
        try {
          if (fs.existsSync(pathToCheck)) {
            agentPath = pathToCheck;
            store.set('agentPath', agentPath);
            console.log('Found agent at:', agentPath);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    if (!agentPath || !fs.existsSync(agentPath)) {
      reject(new Error('Agent script not found. Please ensure Loom agent is installed.'));
      return;
    }

    // Get settings from store if not provided
    const aiModel = model || store.get('aiModel', 'gpt-4o-mini');
    const mode = analysisMode || store.get('analysisMode', 'senior');
    
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const env = { 
      ...process.env, 
      OPENAI_API_KEY: apiKey, 
      OPENAI_MODEL: aiModel,
      TRACEMIND_MODE: mode
    };
    
    // Add GitHub URL to environment if provided
    if (githubUrl && githubUrl.trim()) {
      env.GITHUB_URL = githubUrl.trim();
    }

    const childProcess = spawn(pythonCmd, [agentPath, filePath], {
      env: env,
      cwd: path.dirname(agentPath)
    });

    // Store process reference for cancellation (per renderer window)
    const senderId = event.sender.id;
    activeProcesses.set(senderId, childProcess);

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      activeProcesses.delete(senderId);
      if (code !== 0) {
        // Provide more detailed error information
        let errorMessage = 'Unknown error occurred';
        if (stderr) {
          errorMessage = stderr.trim();
        } else if (stdout) {
          // Sometimes errors go to stdout
          errorMessage = stdout.trim();
        }
        console.error('Python process error:', { code, stderr, stdout });
        reject(new Error(errorMessage || 'Unknown error occurred'));
      } else {
        // Parse output - check for JSON token usage at the end
        let explanation = stdout.trim().replace(/^=+\s*$/gm, '').trim();
        let tokenUsage = null;
        
        // Try to extract JSON token usage from the end
        const jsonMatch = explanation.match(/<!--TOKEN_USAGE_START-->\s*\n(.*?)\n\s*<!--TOKEN_USAGE_END-->/s);
        if (jsonMatch) {
          try {
            tokenUsage = JSON.parse(jsonMatch[1].trim());
            // Remove the token usage JSON from explanation
            explanation = explanation.replace(/<!--TOKEN_USAGE_START-->.*?<!--TOKEN_USAGE_END-->/s, '').trim();
          } catch (e) {
            console.error('Failed to parse token usage:', e);
          }
        }
        
        // Store token usage if available
        if (tokenUsage && tokenUsage.total_tokens) {
          const currentUsage = store.get('tokenUsage', { totalUsed: 0, lastReset: Date.now() });
          currentUsage.totalUsed += tokenUsage.total_tokens;
          currentUsage.lastUsed = Date.now();
          store.set('tokenUsage', currentUsage);
        }
        
        // Return explanation as string for backward compatibility, but include tokenUsage separately
        resolve({ explanation, tokenUsage });
      }
    });

    childProcess.on('error', (error) => {
      activeProcesses.delete(senderId);
      console.error('Child process error:', error);
      reject(new Error(`Failed to start Python process: ${error.message}. Make sure Python 3 is installed.`));
    });
  });
});

ipcMain.handle('explain-project', async (event, projectPath, apiKey, model, analysisMode, githubUrl = '') => {
  return new Promise((resolve, reject) => {
    const isDev = process.env.ELECTRON_IS_DEV === '1';
    let agentPath = null;
    
    // In development mode, always use the development agent path (don't use cached path)
    if (!isDev) {
      agentPath = store.get('agentPath');
    }
    
    // If not stored or in dev mode, try to find it
    if (!agentPath || !fs.existsSync(agentPath)) {
      const appPath = app.getAppPath();
      const isPackaged = app.isPackaged;
      
      const agentPaths = [];
      
      if (isPackaged) {
        agentPaths.push(
          path.join(process.resourcesPath, 'agent', 'agent.py'),
          path.join(appPath, 'agent', 'agent.py'),
          path.join(path.dirname(process.execPath), 'agent', 'agent.py')
        );
      } else {
        // In dev mode, prioritize the development agent path
        agentPaths.push(
          path.join(__dirname, '..', '..', 'agent', 'agent.py'),
          path.join(appPath, '..', '..', 'agent', 'agent.py')
        );
      }
      
      agentPaths.push(
        path.join(process.env.HOME, 'tracemind', 'agent', 'agent.py'),
        path.join('/usr/local', 'tracemind', 'agent', 'agent.py'),
        path.join('/opt', 'tracemind', 'agent', 'agent.py')
      );

      for (const pathToCheck of agentPaths) {
        try {
          if (fs.existsSync(pathToCheck)) {
            agentPath = pathToCheck;
            store.set('agentPath', agentPath);
            console.log('Found agent at:', agentPath);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    if (!agentPath || !fs.existsSync(agentPath)) {
      reject(new Error('Agent script not found. Please ensure Loom agent is installed.'));
      return;
    }

    // Get settings from store if not provided
    const aiModel = model || store.get('aiModel', 'gpt-4o-mini');
    const mode = analysisMode || store.get('analysisMode', 'senior');
    
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const env = { 
      ...process.env, 
      OPENAI_API_KEY: apiKey, 
      OPENAI_MODEL: aiModel,
      TRACEMIND_MODE: mode
    };
    
    // Add GitHub URL to environment if provided
    if (githubUrl && githubUrl.trim()) {
      env.GITHUB_URL = githubUrl.trim();
    }

    const childProcess = spawn(pythonCmd, [agentPath, projectPath, '--project'], {
      env: env,
      cwd: path.dirname(agentPath)
    });

    // Store process reference for cancellation (per renderer window)
    const senderId = event.sender.id;
    activeProcesses.set(senderId, childProcess);

    let stdout = '';
    let stderr = '';

    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    childProcess.on('close', (code) => {
      activeProcesses.delete(senderId);
      if (code !== 0) {
        let errorMessage = 'Unknown error occurred';
        if (stderr) {
          errorMessage = stderr.trim();
        } else if (stdout) {
          errorMessage = stdout.trim();
        }
        console.error('Python process error:', { code, stderr, stdout });
        reject(new Error(errorMessage || 'Unknown error occurred'));
      } else {
        let explanation = stdout.trim().replace(/^=+\s*$/gm, '').trim();
        let tokenUsage = null;
        
        const jsonMatch = explanation.match(/<!--TOKEN_USAGE_START-->\s*\n(.*?)\n\s*<!--TOKEN_USAGE_END-->/s);
        if (jsonMatch) {
          try {
            tokenUsage = JSON.parse(jsonMatch[1].trim());
            explanation = explanation.replace(/<!--TOKEN_USAGE_START-->.*?<!--TOKEN_USAGE_END-->/s, '').trim();
          } catch (e) {
            console.error('Failed to parse token usage:', e);
          }
        }
        
        if (tokenUsage && tokenUsage.total_tokens) {
          const currentUsage = store.get('tokenUsage', { totalUsed: 0, lastReset: Date.now() });
          currentUsage.totalUsed += tokenUsage.total_tokens;
          currentUsage.lastUsed = Date.now();
          store.set('tokenUsage', currentUsage);
          
          // Add to history
          const history = store.get('tokenHistory', []);
          history.unshift({
            amount: tokenUsage.total_tokens,
            description: `Project analysis: ${path.basename(projectPath)}`,
            timestamp: Date.now(),
          });
          if (history.length > 100) history.splice(100);
          store.set('tokenHistory', history);
        }
        
        resolve({ explanation, tokenUsage });
      }
    });

    childProcess.on('error', (error) => {
      activeProcesses.delete(senderId);
      console.error('Child process error:', error);
      reject(new Error(`Failed to start Python process: ${error.message}. Make sure Python 3 is installed.`));
    });
  });
});

// Cancel analysis handler
ipcMain.handle('cancel-analysis', async (event) => {
  try {
    const senderId = event.sender.id;
    const process = activeProcesses.get(senderId);
    if (process) {
      process.kill('SIGTERM');
      activeProcesses.delete(senderId);
      return { success: true };
    }
    return { success: false, error: 'No active process to cancel' };
  } catch (error) {
    console.error('Error cancelling analysis:', error);
    return { success: false, error: error.message };
  }
});

// Chat handler - direct OpenAI API call for interactive chat
ipcMain.handle('chat-about-code', async (event, question, codePath, codeType, apiKey, model, analysisMode, existingExplanation) => {
  return new Promise((resolve, reject) => {
    try {
      // Read the code content
      let codeContent = '';
      let context = '';
      
      if (codeType === 'file' && codePath && fs.existsSync(codePath)) {
        try {
          codeContent = fs.readFileSync(codePath, 'utf-8');
          // Limit file size for context
          if (codeContent.length > 10000) {
            codeContent = codeContent.substring(0, 10000) + '\n\n... (file truncated)';
          }
          context = `Here is the code from ${codePath}:\n\n\`\`\`\n${codeContent}\n\`\`\``;
        } catch (e) {
          context = `The user is asking about a file located at ${codePath}`;
        }
      } else if (codeType === 'project' && existingExplanation) {
        context = `Here is the existing analysis of the project:\n\n${existingExplanation}`;
      } else {
        context = `The user is asking about ${codeType === 'file' ? 'a file' : 'a project'} located at ${codePath || 'unknown location'}`;
      }
      
      const systemPrompt = analysisMode === 'beginner' 
        ? `You are a helpful coding assistant. Answer questions about code clearly and concisely. Be brief and direct - provide only the essential information needed to answer the question. Do not repeat the full analysis. Keep responses under 300 words unless the question requires more detail.`
        : `You are a senior software engineer. Answer questions about code with precision and depth, but be concise. Provide only the information directly relevant to the question. Do not repeat the full analysis unless specifically asked. Keep responses focused and under 400 words unless the question requires extensive explanation.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${context}\n\nUser question: ${question}\n\nPlease provide a concise, direct answer to this specific question. Do not provide a full code analysis unless specifically requested.` }
      ];
      
      const requestData = JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
      });
      
      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(requestData)
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.error) {
              reject(new Error(response.error.message || 'OpenAI API error'));
              return;
            }
            
            const answer = response.choices[0].message.content;
            
            // Track token usage
            if (response.usage) {
              const currentUsage = store.get('tokenUsage', { totalUsed: 0, lastReset: Date.now() });
              currentUsage.totalUsed += response.usage.total_tokens;
              currentUsage.lastUsed = Date.now();
              store.set('tokenUsage', currentUsage);
              
              // Deduct tokens for non-admin users
              const availableTokens = store.get('availableTokens', null);
              if (availableTokens !== null) {
                store.set('availableTokens', Math.max(0, availableTokens - response.usage.total_tokens));
              }
              
              // Add to history
              const history = store.get('tokenHistory', []);
              history.unshift({
                amount: response.usage.total_tokens,
                description: `Chat: ${codeType === 'file' && codePath ? path.basename(codePath) : 'project question'}`,
                timestamp: Date.now(),
              });
              if (history.length > 100) history.splice(100);
              store.set('tokenHistory', history);
            }
            
            resolve(answer);
          } catch (e) {
            reject(new Error(`Failed to parse OpenAI response: ${e.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`OpenAI API request failed: ${error.message}`));
      });
      
      req.write(requestData);
      req.end();
      
    } catch (error) {
      reject(new Error(error.message || 'Failed to get chat response'));
    }
  });
});

// GitHub API request helper
function githubApiRequest(endpoint, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'User-Agent': 'TraceMind-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `token ${token}`;
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse GitHub API response: ${e.message}`));
          }
        } else if (res.statusCode === 404) {
          resolve(null);
        } else if (res.statusCode === 403 || res.statusCode === 429) {
          reject(new Error('GitHub API rate limit exceeded. Please try again later.'));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`GitHub API request failed: ${error.message}`));
    });
    
    req.end();
  });
}

// GitHub Repository Analysis using GitHub REST API
ipcMain.handle('github-repo-all', async (event, url) => {
  try {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      throw new Error('Invalid GitHub repository URL. Please use format: https://github.com/owner/repo or owner/repo');
    }
    
    const { owner, repo } = parsed;
    // Use stored token from settings, fallback to environment variable
    const token = store.get('githubToken', '') || process.env.GITHUB_TOKEN || null;
    
    // Fetch all data in parallel
    const [repoData, contributorsData, releasesData, languagesData, branchesData] = await Promise.allSettled([
      githubApiRequest(`/repos/${owner}/${repo}`, token),
      githubApiRequest(`/repos/${owner}/${repo}/contributors?per_page=100`, token),
      githubApiRequest(`/repos/${owner}/${repo}/releases?per_page=100`, token),
      githubApiRequest(`/repos/${owner}/${repo}/languages`, token),
      githubApiRequest(`/repos/${owner}/${repo}/branches?per_page=100`, token)
    ]);
    
    // Check if repo data fetch failed with an error (not 404)
    if (repoData.status === 'rejected') {
      throw new Error(repoData.reason?.message || 'Failed to fetch repository data');
    }
    
    // Process repository summary
    const summary = repoData.value ? {
      name: repoData.value.name,
      full_name: repoData.value.full_name,
      description: repoData.value.description || '',
      url: repoData.value.html_url,
      stars: repoData.value.stargazers_count || 0,
      forks: repoData.value.forks_count || 0,
      language: repoData.value.language || null,
      license: repoData.value.license?.name || null,
      created_at: repoData.value.created_at || null,
      updated_at: repoData.value.updated_at || null,
      topics: repoData.value.topics || []
    } : null;
    
    if (!summary) {
      return null;
    }
    
    // Process contributors
    const contributors = contributorsData.status === 'fulfilled' && contributorsData.value 
      ? contributorsData.value.map(c => ({
          username: c.login,
          contributions: c.contributions,
          avatar_url: c.avatar_url,
          profile_url: c.html_url
        }))
      : [];
    
    // Process commits (use contributors' contribution counts)
    let totalCommits = 0;
    let commitsByAuthor = {};
    contributors.forEach(c => {
      commitsByAuthor[c.username] = c.contributions;
      totalCommits += c.contributions;
    });
    
    // Process releases
    let firstRelease = null;
    let latestRelease = null;
    let totalReleases = 0;
    if (releasesData.status === 'fulfilled' && releasesData.value && releasesData.value.length > 0) {
      totalReleases = releasesData.value.length;
      latestRelease = releasesData.value[0] ? {
        tag_name: releasesData.value[0].tag_name,
        published_at: releasesData.value[0].published_at
      } : null;
      firstRelease = releasesData.value[releasesData.value.length - 1] ? {
        tag_name: releasesData.value[releasesData.value.length - 1].tag_name,
        published_at: releasesData.value[releasesData.value.length - 1].published_at
      } : null;
    }
    
    // Process languages
    const languages = languagesData.status === 'fulfilled' && languagesData.value 
      ? languagesData.value 
      : {};
    
    // Process branches
    const branches = branchesData.status === 'fulfilled' && branchesData.value && Array.isArray(branchesData.value)
      ? branchesData.value.map(b => ({
          name: b.name,
          protected: b.protected || false,
          commit_sha: b.commit?.sha || null,
          commit_url: b.commit?.url ? b.commit.url.replace('api.github.com/repos', 'github.com').replace('/git/commits', '/commit') : null
        }))
      : [];
    
    const result = {
      summary,
      contributors,
      commits: {
        total_commits: totalCommits,
        commits_by_author: commitsByAuthor
      },
      releases: {
        first_release: firstRelease,
        latest_release: latestRelease,
        total_releases: totalReleases
      },
      languages,
      branches,
      related: []
    };
    
    return result;
    
  } catch (error) {
    console.error('GitHub API error:', error);
    throw error;
  }
});

// Fetch detailed commit history with file changes
ipcMain.handle('github-repo-commits', async (event, url, page = 1, perPage = 50) => {
  try {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return null;
    }
    
    const { owner, repo } = parsed;
    // Use stored token from settings, fallback to environment variable
    const token = store.get('githubToken', '') || process.env.GITHUB_TOKEN || null;
    
    // Fetch commits list
    const commitsData = await githubApiRequest(
      `/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}`,
      token
    );
    
    if (!commitsData || !Array.isArray(commitsData)) {
      return { commits: [], hasMore: false };
    }
    
    // Fetch detailed information for each commit (including stats and files)
    // Limit to 30 commits per page for performance
    const commitsToFetch = commitsData.slice(0, 30);
    const commitsWithDetails = await Promise.allSettled(
      commitsToFetch.map(async (commit) => {
        try {
          // Fetch detailed commit information including stats and files
          const commitDetail = await githubApiRequest(
            `/repos/${owner}/${repo}/commits/${commit.sha}`,
            token
          );
          
          if (commitDetail) {
            return {
              sha: commit.sha,
              message: commitDetail.commit.message,
              author: {
                name: commitDetail.commit.author.name,
                username: commitDetail.author?.login || commitDetail.commit.author.name,
                avatar_url: commitDetail.author?.avatar_url || null,
                email: commitDetail.commit.author.email,
                profile_url: commitDetail.author?.html_url || null
              },
              date: commitDetail.commit.author.date,
              url: commitDetail.html_url,
              stats: commitDetail.stats ? {
                additions: commitDetail.stats.additions || 0,
                deletions: commitDetail.stats.deletions || 0,
                total: commitDetail.stats.total || 0
              } : null,
              files: commitDetail.files ? commitDetail.files.map(file => ({
                filename: file.filename,
                status: file.status,
                additions: file.additions || 0,
                deletions: file.deletions || 0,
                changes: file.changes || 0
              })) : []
            };
          }
        } catch (e) {
          // Fallback to basic commit info if detailed fetch fails
          return {
            sha: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author.name,
              username: commit.author?.login || commit.commit.author.name,
              avatar_url: commit.author?.avatar_url || null,
              email: commit.commit.author.email,
              profile_url: commit.author?.html_url || null
            },
            date: commit.commit.author.date,
            url: commit.html_url,
            stats: null,
            files: []
          };
        }
        return null;
      })
    );
    
    const commits = commitsWithDetails
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
    
    return {
      commits,
      hasMore: commitsData.length === perPage
    };
    
  } catch (error) {
    console.error('GitHub commits API error:', error);
    throw error;
  }
});

// Summarize commit using AI
ipcMain.handle('summarize-commit', async (event, url, sha, apiKey, model = 'gpt-4o-mini') => {
  try {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      throw new Error('Invalid GitHub URL');
    }
    
    const { owner, repo } = parsed;
    // Use stored token from settings, fallback to environment variable
    const token = store.get('githubToken', '') || process.env.GITHUB_TOKEN || null;
    
    // Fetch commit details including diff
    const commitDetail = await githubApiRequest(`/repos/${owner}/${repo}/commits/${sha}`, token);
    
    if (!commitDetail) {
      throw new Error('Commit not found');
    }
    
    // Build context from commit data
    const filesChanged = commitDetail.files ? commitDetail.files.map(f => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions || 0,
      deletions: f.deletions || 0,
      changes: f.changes || 0,
      patch: f.patch ? f.patch.substring(0, 2000) : null // Limit patch size
    })) : [];
    
    // Build summary prompt
    const filesSummary = filesChanged.map(f => {
      let summary = `${f.status.toUpperCase()}: ${f.filename}`;
      if (f.additions > 0 || f.deletions > 0) {
        summary += ` (+${f.additions}/-${f.deletions})`;
      }
      if (f.patch) {
        summary += `\n  Patch preview: ${f.patch.substring(0, 500)}...`;
      }
      return summary;
    }).join('\n');
    
    const commitMessage = commitDetail.commit.message;
    const commitContext = `Commit: ${commitMessage}
Author: ${commitDetail.commit.author.name}
Date: ${commitDetail.commit.author.date}
Files Changed: ${filesChanged.length}

Files:
${filesSummary}`;
    
    // Use OpenAI API to summarize
    const systemPrompt = `You are a code review assistant. Analyze the commit changes and provide a concise, clear summary explaining:
1. What the commit does (the main purpose)
2. Key changes made (what was added, removed, or modified)
3. Why these changes might be important (brief impact analysis)

Keep the summary under 200 words. Be specific about the changes but avoid overly technical jargon unless necessary.`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please summarize this commit:\n\n${commitContext}` }
    ];
    
    const requestData = JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 400,
      temperature: 0.7,
    });
    
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.error) {
              reject(new Error(response.error.message || 'OpenAI API error'));
              return;
            }
            
            const summary = response.choices[0].message.content;
            
            // Track token usage
            if (response.usage) {
              const currentUsage = store.get('tokenUsage', { totalUsed: 0, lastReset: Date.now() });
              currentUsage.totalUsed += response.usage.total_tokens;
              currentUsage.lastUsed = Date.now();
              store.set('tokenUsage', currentUsage);
              
              // Add to history
              const history = store.get('tokenHistory', []);
              history.unshift({
                amount: response.usage.total_tokens,
                description: `Commit summary: ${sha.substring(0, 7)}`,
                timestamp: Date.now(),
              });
              if (history.length > 100) history.splice(100);
              store.set('tokenHistory', history);
            }
            
            resolve(summary);
          } catch (e) {
            reject(new Error(`Failed to parse OpenAI response: ${e.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(new Error(`OpenAI API request failed: ${error.message}`));
      });
      
      req.write(requestData);
      req.end();
    });
    
  } catch (error) {
    console.error('Commit summary error:', error);
    throw error;
  }
});
