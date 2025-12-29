import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/layout/Header';
import FileSelector from './components/layout/FileSelector';
import TabBar from './components/layout/TabBar';
import ExplanationPanel from './components/views/ExplanationPanel';
import SettingsModal from './components/modals/SettingsModal';
import AuthWindow from './components/modals/AuthWindow';
import TokenHistoryModal from './components/modals/TokenHistoryModal';
import LandingPage from './components/LandingPage';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function AppContent() {
  const { theme, themeMode } = useTheme();
  const COLORS = theme.colors;
  
  const [apiKey, setApiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [analysisMode, setAnalysisMode] = useState('senior');
  const [tabs, setTabs] = useState([{ id: 1, filePath: null, projectPath: null, githubUrl: '', explanation: '', loading: false, error: null, progress: '' }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [splitView, setSplitView] = useState(false);
  const [splitTabId, setSplitTabId] = useState(null);
  const [splitSide, setSplitSide] = useState('left'); // 'left' or 'right'
  const [splitPosition, setSplitPosition] = useState(50); // Percentage position of the divider (0-100)
  const [isResizing, setIsResizing] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);

  // Update body background and text color based on theme
  useEffect(() => {
    document.body.style.backgroundColor = COLORS.bgBase;
    document.body.style.color = COLORS.textPrimary;
  }, [COLORS.bgBase, COLORS.textPrimary]);

  // Handle split view resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const container = document.querySelector('.main-content');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      // Constrain between 15% and 85% to prevent panels from being too small
      const constrainedPosition = Math.max(15, Math.min(85, newPosition));
      setSplitPosition(constrainedPosition);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);
  const [showSettings, setShowSettings] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authData, setAuthData] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showAuthWindow, setShowAuthWindow] = useState(false);
  const [tokenUsage, setTokenUsage] = useState({ totalUsed: 0, lastReset: Date.now(), lastUsed: null });
  const [availableTokens, setAvailableTokens] = useState(null); // User's available tokens (null = unlimited for admin)
  const [tokenHistory, setTokenHistory] = useState([]);
  const [showTokenHistory, setShowTokenHistory] = useState(false);
  const ADMIN_EMAIL = 'makerchlee@outlook.kr';
  
  // Check if current user is admin
  const isAdmin = authData?.user?.email === ADMIN_EMAIL;
  


  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      if (token && token !== 'undefined' && token !== 'null') {
        setIsAuthenticated(true);
        setShowLandingPage(false);
        setShowAuthWindow(false);
        if (user) {
          try {
            const userData = JSON.parse(user);
            setAuthData({ token, user: userData });
          } catch (e) {
            setAuthData({ token });
          }
        } else {
          setAuthData({ token });
        }
      } else {
        setShowLandingPage(true);
        setShowAuthWindow(false);
      }
      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Load API key, model, and mode when authenticated
    if (isAuthenticated && window.electronAPI) {
      window.electronAPI.getApiKey().then(key => {
        if (key) {
          setApiKey(key);
        }
      }).catch(err => console.error('Failed to get API key:', err));
      
      window.electronAPI.getGithubToken().then(token => {
        if (token) {
          setGithubToken(token);
        }
      }).catch(err => console.error('Failed to get GitHub token:', err));
      
      window.electronAPI.getModel().then(model => {
        if (model) {
          setSelectedModel(model);
        }
      }).catch(err => console.error('Failed to get model:', err));
      
      window.electronAPI.getAnalysisMode().then(mode => {
        if (mode) {
          setAnalysisMode(mode);
        }
      }).catch(err => console.error('Failed to get analysis mode:', err));
      
      window.electronAPI.getTokenUsage().then(usage => {
        if (usage && typeof usage.totalUsed === 'number') {
          setTokenUsage(usage);
        }
      }).catch(err => console.error('Failed to get token usage:', err));
      
      window.electronAPI.getTokenHistory().then(history => {
        if (history && Array.isArray(history)) {
          setTokenHistory(history);
        }
      }).catch(err => console.error('Failed to get token history:', err));
      
      // Load available tokens (only for non-admin users)
      if (!isAdmin && window.electronAPI.getAvailableTokens) {
        window.electronAPI.getAvailableTokens().then(tokens => {
          setAvailableTokens(tokens);
        }).catch(err => console.error('Failed to get available tokens:', err));
      } else {
        // Admin has unlimited tokens
        setAvailableTokens(null);
      }
    }
  }, [isAuthenticated, isAdmin]);
  
  // Periodically refresh token usage
  useEffect(() => {
    if (!isAuthenticated || !window.electronAPI) return;
    
    const interval = setInterval(() => {
      window.electronAPI.getTokenUsage().then(usage => {
        if (usage && typeof usage.totalUsed === 'number') {
          setTokenUsage(usage);
        }
      }).catch(() => {
        // Silently ignore periodic token fetch errors
      });
    }, 5000); // Check every 5 seconds (reduced from 2s to be less aggressive)
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleAuthSuccess = (data) => {
    console.log('Auth success callback triggered:', data);
    setAuthData(data);
    setIsAuthenticated(true);
    setCheckingAuth(false);
    setShowLandingPage(false);
    setShowAuthWindow(false);
    
    // Small delay to ensure state updates
    setTimeout(() => {
      // Load API key and GitHub token after successful auth
      if (window.electronAPI) {
        window.electronAPI.getApiKey().then(key => {
          if (key) {
            setApiKey(key);
          } else {
            // Don't auto-show settings, let user use app first
          }
        });
        window.electronAPI.getGithubToken().then(token => {
          if (token) {
            setGithubToken(token);
          }
        });
      }
    }, 100);
  };

  const handleLoginClick = () => {
    setShowLandingPage(false);
    setShowAuthWindow(true);
  };

  const handleSelectFile = async (presetPath = null) => {
    if (!window.electronAPI) return;
    
    try {
      const filePath = presetPath 
        ? await window.electronAPI.setFilePath(presetPath)
        : await window.electronAPI.selectFile();
      if (filePath) {
        // Add to recent files
        if (window.electronAPI.addRecentFile) {
          await window.electronAPI.addRecentFile(filePath, 'file');
        }
        
        // Fetch file statistics
        const fileStats = await window.electronAPI.getFileStats(filePath);
        
        const activeTab = tabs.find(t => t.id === activeTabId);
        // If active tab is empty (no file/project), update it; otherwise create a new tab
        if (activeTab && !activeTab.filePath && !activeTab.projectPath) {
          setTabs(tabs.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, filePath: filePath, projectPath: null, githubUrl: tab.githubUrl || '', explanation: '', error: null, fileStats: fileStats }
              : tab
          ));
        } else {
          // Create a new tab with the selected file
          const newTabId = Math.max(...tabs.map(t => t.id), 0) + 1;
          const newTab = {
            id: newTabId,
            filePath: filePath,
            projectPath: null,
            githubUrl: '',
            explanation: '',
            loading: false,
            error: null,
            progress: '',
            fileStats: fileStats
          };
          setTabs([...tabs, newTab]);
          setActiveTabId(newTabId);
        }
      }
    } catch (err) {
      // Update active tab with error
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, error: 'Failed to select file: ' + err.message }
          : tab
      ));
    }
  };

  const handleSelectProject = async (presetPath = null) => {
    if (!window.electronAPI) return;
    
    try {
      const projectPath = presetPath
        ? await window.electronAPI.setProjectPath(presetPath)
        : await window.electronAPI.selectProject();
      if (projectPath) {
        // Add to recent files
        if (window.electronAPI.addRecentFile) {
          await window.electronAPI.addRecentFile(projectPath, 'project');
        }
        
        // Fetch project statistics
        const projectStats = await window.electronAPI.getProjectStats(projectPath);
        
        const activeTab = tabs.find(t => t.id === activeTabId);
        // If active tab is empty (no file/project), update it; otherwise create a new tab
        if (activeTab && !activeTab.filePath && !activeTab.projectPath) {
          setTabs(tabs.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, filePath: null, projectPath: projectPath, githubUrl: tab.githubUrl || '', explanation: '', error: null, projectStats: projectStats }
              : tab
          ));
        } else {
          // Create a new tab with the selected project
          const newTabId = Math.max(...tabs.map(t => t.id), 0) + 1;
          const newTab = {
            id: newTabId,
            filePath: null,
            projectPath: projectPath,
            githubUrl: '',
            explanation: '',
            loading: false,
            error: null,
            progress: '',
            projectStats: projectStats
          };
          setTabs([...tabs, newTab]);
          setActiveTabId(newTabId);
        }
      }
    } catch (err) {
      // Update active tab with error
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, error: 'Failed to select project: ' + err.message }
          : tab
      ));
    }
  };

  const handleGithubUrlChange = (githubUrl) => {
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, githubUrl: githubUrl }
        : tab
    ));
  };

  const handleNewTab = () => {
    const newTabId = Math.max(...tabs.map(t => t.id), 0) + 1;
          const newTab = {
            id: newTabId,
            filePath: null,
            projectPath: null,
            githubUrl: '',
            explanation: '',
            loading: false,
            error: null,
            progress: ''
          };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTabId);
  };

  const handleTabClick = (tabId) => {
    setActiveTabId(tabId);
  };

  const handleTabClose = (tabId) => {
    if (tabs.length === 1) {
      // Can't close the last tab, just reset it
      setTabs([{ id: 1, filePath: null, projectPath: null, githubUrl: '', explanation: '', loading: false, error: null, progress: '' }]);
      setActiveTabId(1);
      setSplitView(false);
      setSplitTabId(null);
    } else {
      const newTabs = tabs.filter(t => t.id !== tabId);
      setTabs(newTabs);
      // If we closed the active tab, switch to another one
      if (tabId === activeTabId) {
        const closedIndex = tabs.findIndex(t => t.id === tabId);
        const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
        setActiveTabId(newTabs[newActiveIndex].id);
      }
      // If we closed the split tab or there aren't exactly 2 tabs anymore, disable split view
      if (tabId === splitTabId || newTabs.length !== 2) {
        setSplitView(false);
        setSplitTabId(null);
        setSplitSide('left');
        setSplitPosition(50); // Reset to center
      }
    }
  };

  // Keyboard shortcuts for tabs and other actions
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input, textarea, or contenteditable
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Cmd+F for search even in inputs
        if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
          // Let the ExplanationPanel handle this
          return;
        }
        return;
      }

      // Cmd+R (Mac) or Ctrl+R (Windows/Linux) to show recent files
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        // Trigger recent files - we'll need to add a ref or state to control this
        // For now, this is handled in FileSelector
        return;
      }

      // Cmd+T (Mac) or Ctrl+T (Windows/Linux) to add new tab
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        const newTabId = Math.max(...tabs.map(t => t.id), 0) + 1;
        const newTab = {
          id: newTabId,
          filePath: null,
          projectPath: null,
          githubUrl: '',
          explanation: '',
          loading: false,
          error: null,
          progress: ''
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTabId);
      }
      // Cmd+W (Mac) or Ctrl+W (Windows/Linux) to close current tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        const tabId = activeTabId;
        if (tabs.length === 1) {
          // Can't close the last tab, just reset it
          setTabs([{ id: 1, filePath: null, projectPath: null, githubUrl: '', explanation: '', loading: false, error: null, progress: '' }]);
          setActiveTabId(1);
          setSplitView(false);
          setSplitTabId(null);
        } else {
          const newTabs = tabs.filter(t => t.id !== tabId);
          setTabs(newTabs);
          // If we closed the active tab, switch to another one
          if (tabId === activeTabId) {
            const closedIndex = tabs.findIndex(t => t.id === tabId);
            const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
            setActiveTabId(newTabs[newActiveIndex].id);
          }
          // If we closed the split tab or there aren't exactly 2 tabs anymore, disable split view
          if (tabId === splitTabId || newTabs.length !== 2) {
            setSplitView(false);
            setSplitTabId(null);
            setSplitSide('left');
            setSplitPosition(50); // Reset to center
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTabId, tabs, splitTabId]);

  const handleSplitTab = (tabId, side = 'left') => {
    // Only allow split when there are exactly 2 tabs
    if (tabs.length !== 2) {
      return;
    }
    
    if (splitView && splitTabId === tabId) {
      // Already split with this tab, disable split
      setSplitView(false);
      setSplitTabId(null);
      setSplitSide('left');
      setSplitPosition(50); // Reset to center
    } else {
      // Enable split view with this tab
      setSplitView(true);
      setSplitTabId(tabId);
      setSplitSide(side);
      setSplitPosition(50); // Start at center
    }
  };

  const handleExplain = async () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    // Allow GitHub-only analysis OR file/project analysis
    // Note: GitHub-only analysis doesn't require API key (it uses GitHub API, not OpenAI)
    if (!activeTab || (!activeTab.filePath && !activeTab.projectPath && !activeTab.githubUrl)) {
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, error: 'Please select a file, project, or enter a GitHub repository URL' }
          : tab
      ));
      return;
    }
    // Require API key only for file/project analysis (not for GitHub-only)
    if ((activeTab.filePath || activeTab.projectPath) && !apiKey) {
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, error: 'Please configure your API key in Settings for file/project analysis' }
          : tab
      ));
      return;
    }
    
    // If only GitHub URL is provided (no file/project), trigger GitHub analysis
    if (!activeTab.filePath && !activeTab.projectPath && activeTab.githubUrl) {
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, loading: true, error: null }
          : tab
      ));
      
      try {
        const githubData = await window.electronAPI.githubRepoAll(activeTab.githubUrl);
        if (githubData) {
          // Store the GitHub data in the tab state so it can be displayed in Origins tab
          setTabs(tabs.map(tab => 
            tab.id === activeTabId 
              ? { 
                  ...tab, 
                  loading: false, 
                  error: null,
                  githubData: githubData // Store data for display in Origins tab
                }
              : tab
          ));
        } else {
          setTabs(tabs.map(tab => 
            tab.id === activeTabId 
              ? { 
                  ...tab, 
                  loading: false, 
                  error: 'Failed to fetch GitHub repository data. Please check the URL and try again.' 
                }
              : tab
          ));
        }
      } catch (error) {
        console.error('Error analyzing GitHub repository:', error);
        setTabs(tabs.map(tab => 
          tab.id === activeTabId 
            ? { 
                ...tab, 
                loading: false, 
                error: error.message || 'Failed to analyze GitHub repository. Please check your API key and try again.' 
              }
            : tab
        ));
      }
      return;
    }
    
    // Check available tokens (unless admin)
    if (!isAdmin && availableTokens !== null && availableTokens <= 0) {
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, error: 'Not enough tokens. Please add more tokens to continue.' }
          : tab
      ));
      return;
    }

    // If both projectPath and githubUrl are provided:
    // - Use project analysis for text/map/chat tabs
    // - Use GitHub analysis for origins tab (fetch GitHub data separately)
    const hasProject = !!activeTab.projectPath;
    const hasGithub = !!activeTab.githubUrl;
    
    // If both are provided, fetch GitHub data first (for origins tab)
    if (hasProject && hasGithub) {
      try {
        const githubData = await window.electronAPI.githubRepoAll(activeTab.githubUrl);
        if (githubData) {
          setTabs(prevTabs => prevTabs.map(tab => 
            tab.id === activeTabId 
              ? { ...tab, githubData: githubData }
              : tab
          ));
        }
      } catch (error) {
        console.error('Error fetching GitHub data:', error);
        // Continue with project analysis even if GitHub fetch fails
      }
    }
    
    // Fetch stats if not already available (for backward compatibility)
    let currentTab = tabs.find(t => t.id === activeTabId);
    if (window.electronAPI) {
      if (hasProject && !currentTab?.projectStats && activeTab.projectPath) {
        const projectStats = await window.electronAPI.getProjectStats(activeTab.projectPath);
        setTabs(prevTabs => prevTabs.map(t => 
          t.id === activeTabId ? { ...t, projectStats } : t
        ));
        currentTab = { ...currentTab, projectStats };
      } else if (!hasProject && !currentTab?.fileStats && activeTab.filePath) {
        const fileStats = await window.electronAPI.getFileStats(activeTab.filePath);
        setTabs(prevTabs => prevTabs.map(t => 
          t.id === activeTabId ? { ...t, fileStats } : t
        ));
        currentTab = { ...currentTab, fileStats };
      }
    }
    
    // Update active tab with loading state
    // Keep existing explanation visible until new one arrives
    const isProject = hasProject;
    const startTime = Date.now();
    let progressInterval = null;
    
    // Get estimated time range (returns { min: seconds, max: seconds, display: string })
    const getEstimatedTimeRange = (tab = currentTab) => {
      if (isProject && tab?.projectStats) {
        const stats = tab.projectStats;
        // Estimate based on file count and total size
        // Adjusted to be more accurate: most time is spent in API calls, not file processing
        // Base: 10s + ~0.8s per file + ~0.5s per 50KB
        const minSeconds = Math.max(
          15, // Minimum 15 seconds
          Math.min(
            180, // Maximum 3 minutes
            Math.ceil(10 + (stats.fileCount * 0.8) + (stats.totalSize / 50000)) // More conservative estimate
          )
        );
        // Add 30% buffer for max estimate (API can be slower sometimes)
        const maxSeconds = Math.ceil(minSeconds * 1.3);
        
        let display;
        if (minSeconds < 60) {
          display = `${minSeconds}-${maxSeconds} seconds`;
        } else {
          const minMinutes = Math.floor(minSeconds / 60);
          const maxMinutes = Math.ceil(maxSeconds / 60);
          if (minMinutes === maxMinutes) {
            display = `~${minMinutes} minute${minMinutes !== 1 ? 's' : ''}`;
          } else {
            display = `${minMinutes}-${maxMinutes} minute${maxMinutes > 1 ? 's' : ''}`;
          }
        }
        
        return { min: minSeconds, max: maxSeconds, display };
      } else if (!isProject && tab?.fileStats) {
        const stats = tab.fileStats;
        // Estimate based on file size and line count
        // Adjusted: base time + processing time (most time is API call, not file reading)
        const minSeconds = Math.max(
          5, // Minimum 5 seconds
          Math.min(
            90, // Maximum 90 seconds for single files
            Math.ceil(5 + (stats.charCount / 5000) + (stats.lineCount / 200)) // More conservative: ~1s per 5KB + ~1s per 200 lines
          )
        );
        // Add 20-40% buffer for max
        const maxSeconds = minSeconds < 20 ? Math.ceil(minSeconds * 1.4) : Math.ceil(minSeconds * 1.3);
        
        let display;
        if (minSeconds < 30) {
          display = `${minSeconds}-${maxSeconds} seconds`;
        } else if (minSeconds < 60) {
          display = `${minSeconds}-${maxSeconds} seconds`;
        } else {
          const minMinutes = Math.floor(minSeconds / 60);
          const maxMinutes = Math.ceil(maxSeconds / 60);
          display = `${minMinutes}-${maxMinutes} minute${maxMinutes > 1 ? 's' : ''}`;
        }
        
        return { min: minSeconds, max: maxSeconds, display };
      }
      
      // Fallback if stats are not available
      if (isProject) {
        return { min: 30, max: 50, display: '30-50 seconds' };
      }
      return { min: 10, max: 15, display: '10-15 seconds' };
    };
    
    // Estimated time display string (for backward compatibility)
    const estimateTime = (tab = currentTab) => {
      return getEstimatedTimeRange(tab).display;
    };
    
    const initialEstimate = getEstimatedTimeRange(currentTab);
    setTabs(tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, loading: true, progress: `${isProject ? 'Analyzing project' : 'Analyzing file'}... (estimated: ${initialEstimate.display})`, error: null }
        : tab
    ));
    
    // Update progress with countdown timer
    progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTabs(prevTabs => {
        const currentTab = prevTabs.find(t => t.id === activeTabId);
        const timeRange = getEstimatedTimeRange(currentTab);
        const remaining = Math.max(0, timeRange.max - elapsed);
        
        let remainingDisplay;
        if (remaining === 0) {
          remainingDisplay = 'Finishing up...';
        } else if (remaining < 60) {
          remainingDisplay = `${remaining} second${remaining !== 1 ? 's' : ''} remaining`;
        } else {
          const minutes = Math.floor(remaining / 60);
          const seconds = remaining % 60;
          remainingDisplay = seconds > 0 
            ? `${minutes}m ${seconds}s remaining`
            : `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
        }
        
        return prevTabs.map(tab => 
          tab.id === activeTabId && tab.loading
            ? { ...tab, progress: `${isProject ? 'Analyzing project' : 'Analyzing file'}... (${remainingDisplay})` }
            : tab
        );
      });
    }, 1000);

    try {
      const result = isProject 
        ? await window.electronAPI.explainProject(activeTab.projectPath, apiKey, selectedModel, analysisMode, activeTab.githubUrl || '')
        : await window.electronAPI.explainFile(activeTab.filePath, apiKey, selectedModel, analysisMode, activeTab.githubUrl || '');
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Handle both old format (string) and new format (object with explanation and tokenUsage)
      const explanation = typeof result === 'string' ? result : (result.explanation || '');
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // Update active tab with result
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, loading: false, explanation: explanation, progress: `Complete! (took ${elapsed}s)`, error: null }
          : tab
      ));

      // Refresh token usage after explanation
      if (window.electronAPI) {
        const usage = await window.electronAPI.getTokenUsage();
        if (usage) {
          setTokenUsage(usage);
        }
        
        // Deduct tokens if not admin and tokens were used
        if (!isAdmin && availableTokens !== null && result.tokenUsage && result.tokenUsage.total_tokens) {
          const tokensUsed = result.tokenUsage.total_tokens;
          if (tokensUsed > 0 && window.electronAPI.deductAvailableTokens) {
            const newTotal = await window.electronAPI.deductAvailableTokens(tokensUsed);
            setAvailableTokens(newTotal);
          }
        }
      }

      // Clear progress after delay
      setTimeout(() => {
        setTabs(prevTabs => prevTabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, progress: '' }
            : tab
        ));
      }, 2000);
    } catch (err) {
      console.error('Explain error:', err);
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { 
              ...tab, 
              loading: false, 
              error: err.message || 'Failed to explain file. Please check that Python 3 and the Loom agent are installed.',
              progress: 'Error occurred'
            }
          : tab
      ));
      
      setTimeout(() => {
        setTabs(prevTabs => prevTabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, progress: '' }
            : tab
        ));
      }, 2000);
    }
  };

  const handleCancelAnalysis = async () => {
    if (window.electronAPI && window.electronAPI.cancelAnalysis) {
      try {
        await window.electronAPI.cancelAnalysis();
        setTabs(tabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, loading: false, progress: 'Cancelled', error: null }
            : tab
        ));
      } catch (err) {
        console.error('Error cancelling analysis:', err);
        setTabs(tabs.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, loading: false, progress: 'Cancel failed', error: err.message }
            : tab
        ));
      }
    }
  };

  const handleSaveSettings = async (newApiKey, newModel, newMode, newTheme, newGithubToken) => {
    if (window.electronAPI) {
      await window.electronAPI.saveApiKey(newApiKey);
      await window.electronAPI.saveGithubToken(newGithubToken || '');
      await window.electronAPI.saveModel(newModel);
      await window.electronAPI.saveAnalysisMode(newMode);
      if (newTheme) {
        await window.electronAPI.saveTheme(newTheme);
      }
      setApiKey(newApiKey);
      setGithubToken(newGithubToken || '');
      setSelectedModel(newModel);
      setAnalysisMode(newMode);
      setShowSettings(false);
    }
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    
    // Reset app state
    setIsAuthenticated(false);
    setAuthData(null);
    setApiKey('');
    setGithubToken('');
    setTabs([{ id: 1, filePath: null, projectPath: null, githubUrl: '', explanation: '', loading: false, error: null, progress: '' }]);
    setActiveTabId(1);
    setShowLandingPage(true);
    setShowAuthWindow(false);
    setCheckingAuth(false);
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="App" style={{ 
        backgroundColor: COLORS.bgBase, 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '2px solid ' + COLORS.borderDefault,
          borderTopColor: COLORS.accent,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ 
          color: COLORS.textMuted, 
          fontSize: '13px',
          fontWeight: '500',
          letterSpacing: '-0.01em'
        }}>
          Checking authentication...
        </div>
      </div>
    );
  }

  // Show landing page or auth window with smooth transition
  if (!isAuthenticated) {
    if (showLandingPage && !showAuthWindow) {
      return <LandingPage onLoginClick={handleLoginClick} />;
    }
    return <AuthWindow onAuthSuccess={handleAuthSuccess} />;
  }

  // Show main app if authenticated
  return (
    <div 
      className="App" 
      style={{ 
        backgroundColor: COLORS.bgBase, 
        height: '100vh',
        width: '100vw',
        display: 'flex', 
        flexDirection: 'column',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        color: COLORS.textPrimary,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        minWidth: 0,
        height: '100vh',
        position: 'relative'
      }}>
            <Header 
              onSettingsClick={() => setShowSettings(true)} 
              user={authData?.user || authData}
              onLogout={handleLogout}
              tokenUsage={tokenUsage}
              availableTokens={availableTokens}
              isAdmin={isAdmin}
              onShowTokenHistory={() => setShowTokenHistory(true)}
            />
            <TabBar 
              tabs={tabs}
              activeTabId={activeTabId}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
              onNewTab={handleNewTab}
              splitView={splitView}
              splitTabId={splitTabId}
              onSplitTab={handleSplitTab}
            />
            <div className="main-content" style={{
              display: 'flex',
              flexDirection: splitView ? 'row' : 'column',
              overflow: 'hidden',
              flex: 1,
              minHeight: 0,
              backgroundColor: COLORS.bgBase,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: fullscreenMode ? '0' : undefined
            }}>
              {(() => {
                const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
                const splitTab = splitView && splitTabId ? tabs.find(t => t.id === splitTabId) : null;
                
                const renderTabContent = (tab, isSplit = false) => {
                  const isThisTabFullscreen = !isSplit && fullscreenMode;
                  return (
            <div key={tab.id} style={{
              flex: isSplit ? '1' : '1',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              overflow: 'hidden',
              width: isSplit ? '100%' : 'auto',
              height: '100%',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: isThisTabFullscreen ? '0' : undefined
            }}>
              <div style={{
                opacity: isThisTabFullscreen ? 0 : 1,
                maxHeight: isThisTabFullscreen ? 0 : '1000px',
                overflow: 'hidden',
                transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: isThisTabFullscreen ? 'none' : 'auto',
                marginBottom: isThisTabFullscreen ? 0 : '16px'
              }}>
                <FileSelector
                  selectedFile={tab.filePath}
                  selectedProject={tab.projectPath}
                  githubUrl={tab.githubUrl}
                  onSelectFile={handleSelectFile}
                  onSelectProject={handleSelectProject}
                  onGithubUrlChange={handleGithubUrlChange}
                  onExplain={handleExplain}
                  onCancel={handleCancelAnalysis}
                  loading={tab.loading}
                  disabled={(!tab.filePath && !tab.projectPath && !tab.githubUrl) || ((tab.filePath || tab.projectPath) && !apiKey) || ((tab.filePath || tab.projectPath) && !isAdmin && availableTokens !== null && availableTokens <= 0)}
                  disabledReason={
                    !tab.filePath && !tab.projectPath && !tab.githubUrl
                      ? 'Please select a file, project folder, or enter a GitHub repository URL' 
                      : (tab.filePath || tab.projectPath) && !apiKey 
                      ? 'Please add your OpenAI API key in Settings' 
                      : (tab.filePath || tab.projectPath) && !isAdmin && availableTokens !== null && availableTokens <= 0
                      ? `Not enough tokens (${availableTokens || 0} available). Please add more tokens to continue.`
                      : null
                  }
                />
                
                {tab.progress && (
                  <div style={{ 
                    marginTop: '16px', 
                    color: COLORS.textMuted,
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: COLORS.accent,
                      animation: 'pulse 1s ease infinite'
                    }} />
                    {tab.progress}
                  </div>
                )}

                {tab.error && (
                  <div style={{
                    marginTop: '16px',
                        padding: '14px 16px',
                        backgroundColor: COLORS.errorBg,
                        border: `1px solid ${COLORS.errorBorder}`,
                        borderRadius: '8px',
                        color: COLORS.errorText,
                        transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
                        fontSize: '13px',
                    fontWeight: '500',
                    animation: 'slideDown 0.2s ease'
                  }}>
                    {tab.error}
                  </div>
                )}
              </div>
              
              {isSplit && (
                <div style={{
                  opacity: isThisTabFullscreen ? 0 : 1,
                  maxHeight: isThisTabFullscreen ? 0 : '1000px',
                  overflow: 'hidden',
                  transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  padding: isThisTabFullscreen ? '0px 16px' : '16px',
                  borderBottom: `1px solid ${COLORS.borderSubtle}`,
                  pointerEvents: isThisTabFullscreen ? 'none' : 'auto'
                }}>
                  <FileSelector
                    selectedFile={tab.filePath}
                    selectedProject={tab.projectPath}
                    githubUrl={tab.githubUrl}
                    onSelectFile={handleSelectFile}
                    onSelectProject={handleSelectProject}
                    onGithubUrlChange={handleGithubUrlChange}
                    onExplain={handleExplain}
                    onCancel={handleCancelAnalysis}
                    loading={tab.loading}
                    disabled={(!tab.filePath && !tab.projectPath) || !apiKey || (!isAdmin && availableTokens !== null && availableTokens <= 0)}
                    disabledReason={
                      !tab.filePath && !tab.projectPath 
                        ? 'Please select a file or project folder' 
                        : !apiKey 
                        ? 'Please add your OpenAI API key in Settings' 
                        : (!isAdmin && availableTokens !== null && availableTokens <= 0)
                        ? `Not enough tokens (${availableTokens || 0} available). Please add more tokens to continue.`
                        : null
                    }
                  />
                  
                  {tab.progress && (
                    <div style={{ 
                      marginTop: '12px', 
                      color: COLORS.textMuted,
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: COLORS.accent,
                        animation: 'pulse 1s ease infinite'
                      }} />
                      {tab.progress}
                    </div>
                  )}

                  {tab.error && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: COLORS.errorBg,
                      border: `1px solid ${COLORS.errorBorder}`,
                      borderRadius: '6px',
                      color: COLORS.errorText,
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {tab.error}
                    </div>
                  )}
                </div>
              )}

              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <ExplanationPanel 
                  key={`explanation-${tab.id}`} 
                  explanation={tab.explanation || ''} 
                  loading={tab.loading}
                  filePath={tab.filePath}
                  projectPath={tab.projectPath}
                  apiKey={apiKey}
                  model={selectedModel}
                  analysisMode={analysisMode}
                  githubUrl={tab.githubUrl}
                  githubData={tab.githubData}
                  projectStats={tab.projectStats}
                  onToggleFullscreen={() => setFullscreenMode(!fullscreenMode)}
                  isFullscreen={isThisTabFullscreen}
                />
              </div>
            </div>
                  );
                };
          
          if (splitView && splitTab) {
            const leftTab = splitSide === 'left' ? splitTab : activeTab;
            const rightTab = splitSide === 'left' ? activeTab : splitTab;
            
            const handleDividerMouseDown = (e) => {
              setIsResizing(true);
              e.preventDefault();
            };
            
            return (
              <>
                <div style={{
                  width: `${splitPosition}%`,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {renderTabContent(leftTab, true)}
                </div>
                <div 
                  onMouseDown={handleDividerMouseDown}
                  style={{
                    width: '4px',
                    backgroundColor: isResizing ? COLORS.accent : COLORS.borderDefault,
                    flexShrink: 0,
                    cursor: 'col-resize',
                    position: 'relative',
                    transition: isResizing ? 'none' : 'background-color 0.2s ease',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    if (!isResizing) {
                      e.currentTarget.style.backgroundColor = COLORS.accent;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isResizing) {
                      e.currentTarget.style.backgroundColor = COLORS.borderDefault;
                    }
                  }}
                />
                <div style={{
                  width: `${100 - splitPosition}%`,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {renderTabContent(rightTab, true)}
                </div>
              </>
            );
          }
          
                return renderTabContent(activeTab, false);
              })()}
            </div>
          </div>

      {showSettings && (
        <SettingsModal
          currentApiKey={apiKey}
          currentGithubToken={githubToken}
          currentModel={selectedModel}
          currentMode={analysisMode}
          currentTheme={themeMode}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          isAdmin={isAdmin}
          availableTokens={availableTokens}
          onAddTokens={async (amount) => {
            if (window.electronAPI && window.electronAPI.addAvailableTokens) {
              const newTotal = await window.electronAPI.addAvailableTokens(amount);
              setAvailableTokens(newTotal);
            }
          }}
        />
      )}

      {/* Token History Modal */}
      <TokenHistoryModal
        isOpen={showTokenHistory}
        onClose={() => setShowTokenHistory(false)}
        history={tokenHistory}
        isAdmin={isAdmin}
        totalUsed={tokenUsage.totalUsed || 0}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

