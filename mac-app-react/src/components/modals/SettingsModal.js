import React, { useState, useEffect } from 'react';
import './SettingsModal.css';
import { useTheme } from '../../contexts/ThemeContext';

const AI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', tag: 'Fast' },
  { value: 'gpt-4o', label: 'GPT-4o', tag: 'Recommended' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', tag: 'Quality' },
  { value: 'gpt-4', label: 'GPT-4', tag: 'Premium' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', tag: 'Budget' },
];

const ANALYSIS_MODES = [
  { value: 'senior', label: 'Senior', icon: '⚡', description: 'Concise, direct explanations' },
  { value: 'beginner', label: 'Beginner', icon: '📚', description: 'Detailed, step-by-step' },
];

const THEMES = [
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'light', label: 'Light', icon: '☀️' },
];

function SettingsModal({ currentApiKey, currentModel, currentMode, currentTheme, currentGithubToken, onSave, onClose, isAdmin, availableTokens, onAddTokens }) {
  const { theme, themeMode, setTheme } = useTheme();
  const COLORS = theme.colors;
  
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [githubToken, setGithubToken] = useState(currentGithubToken || '');
  const [githubTokenError, setGithubTokenError] = useState('');
  const [selectedModel, setSelectedModel] = useState(currentModel || 'gpt-4o-mini');
  const [selectedMode, setSelectedMode] = useState(currentMode || 'senior');
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || themeMode || 'dark');
  const [tokenAmount, setTokenAmount] = useState('10000');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setApiKey(currentApiKey);
    setGithubToken(currentGithubToken || '');
    setGithubTokenError(''); // Clear any previous errors when modal opens
    setSelectedModel(currentModel || 'gpt-4o-mini');
    setSelectedMode(currentMode || 'senior');
    setSelectedTheme(currentTheme || themeMode || 'dark');
  }, [currentApiKey, currentGithubToken, currentModel, currentMode, currentTheme, themeMode]);

  const handleSave = () => {
    // Validate GitHub token if provided
    const trimmedToken = githubToken.trim();
    if (trimmedToken && !trimmedToken.startsWith('ghp_')) {
      setGithubTokenError('GitHub token must start with "ghp_"');
      return;
    }
    
    // Clear error if validation passes
    setGithubTokenError('');
    
    if (apiKey.trim()) {
      onSave(apiKey.trim(), selectedModel, selectedMode, selectedTheme, trimmedToken);
      if (selectedTheme !== themeMode) {
        setTheme(selectedTheme);
      }
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: isClosing ? 'fadeOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={handleClose}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: COLORS.bgSurface,
          borderRadius: '12px',
          width: '90%',
          maxWidth: '420px',
          maxHeight: '90vh',
          border: `1px solid ${COLORS.borderSubtle}`,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
          animation: isClosing ? 'modalZoomOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'modalZoomIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'background-color 0.3s ease, border-color 0.3s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 16px 24px',
          flexShrink: 0
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: COLORS.textPrimary,
            letterSpacing: '-0.02em'
          }}>
            Settings
          </h2>
          <button
            onClick={handleClose}
            className="close-btn"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: COLORS.textMuted,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px 24px 24px',
          minHeight: 0
        }}>
        {/* API Key Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: COLORS.textSecondary,
            marginBottom: '8px'
          }}>
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="sk-..."
            className="input-field"
            style={{
              width: '100%',
              backgroundColor: COLORS.bgInput,
              border: `1px solid ${COLORS.borderDefault}`,
              borderRadius: '8px',
              padding: '10px 12px',
              color: COLORS.textPrimary,
              fontSize: '13px',
              fontFamily: '"SF Mono", "JetBrains Mono", monospace',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
            autoFocus
          />
          <p style={{
            fontSize: '11px',
            color: COLORS.textMuted,
            marginTop: '8px',
            lineHeight: '1.5'
          }}>
            Get your key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: COLORS.accent, textDecoration: 'none' }}
            >
              platform.openai.com
            </a>
          </p>
        </div>

        {/* GitHub Token Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: COLORS.textSecondary,
            marginBottom: '8px'
          }}>
            GitHub Token (Optional)
          </label>
          <input
            type="password"
            value={githubToken}
            onChange={(e) => {
              setGithubToken(e.target.value);
              // Clear error when user starts typing
              if (githubTokenError) {
                setGithubTokenError('');
              }
            }}
            onKeyDown={handleKeyPress}
            placeholder="ghp_..."
            className="input-field"
            style={{
              width: '100%',
              backgroundColor: COLORS.bgInput,
              border: `1px solid ${githubTokenError ? COLORS.errorBorder : COLORS.borderDefault}`,
              borderRadius: '8px',
              padding: '10px 12px',
              color: COLORS.textPrimary,
              fontSize: '13px',
              fontFamily: '"SF Mono", "JetBrains Mono", monospace',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
          />
          {githubTokenError ? (
            <p style={{
              fontSize: '11px',
              color: COLORS.errorText || '#ff4444',
              marginTop: '8px',
              lineHeight: '1.5'
            }}>
              {githubTokenError}
            </p>
          ) : (
            <p style={{
              fontSize: '11px',
              color: COLORS.textMuted,
              marginTop: '8px',
              lineHeight: '1.5'
            }}>
              Increases GitHub API rate limits. Get your token from{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: COLORS.accent, textDecoration: 'none' }}
              >
                github.com/settings/tokens
              </a>
            </p>
          )}
        </div>

        {/* Model Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: COLORS.textSecondary,
            marginBottom: '8px'
          }}>
            AI Model
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {AI_MODELS.map((model) => (
              <button
                key={model.value}
                onClick={() => setSelectedModel(model.value)}
                className={`model-option ${selectedModel === model.value ? 'selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: selectedModel === model.value 
                    ? `1px solid ${COLORS.accent}` 
                    : `1px solid ${COLORS.borderDefault}`,
                  backgroundColor: selectedModel === model.value 
                    ? COLORS.accentMuted
                    : 'transparent',
                  color: selectedModel === model.value 
                    ? COLORS.textPrimary 
                    : COLORS.textSecondary,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
              >
                <span>{model.label}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: selectedModel === model.value 
                    ? 'rgba(34, 211, 238, 0.2)' 
                    : COLORS.bgHover,
                  color: selectedModel === model.value 
                    ? COLORS.accent 
                    : COLORS.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}>
                  {model.tag}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Mode */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: COLORS.textSecondary,
            marginBottom: '8px'
          }}>
            Analysis Mode
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {ANALYSIS_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setSelectedMode(mode.value)}
                className={`mode-btn ${selectedMode === mode.value ? 'selected' : ''}`}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedMode === mode.value 
                    ? `1px solid ${COLORS.accent}` 
                    : `1px solid ${COLORS.borderDefault}`,
                  backgroundColor: selectedMode === mode.value 
                    ? COLORS.accentMuted
                    : 'transparent',
                  color: selectedMode === mode.value 
                    ? COLORS.textPrimary 
                    : COLORS.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '18px' }}>{mode.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{mode.label}</span>
                <span style={{ 
                  fontSize: '10px', 
                  color: selectedMode === mode.value ? COLORS.textSecondary : COLORS.textMuted 
                }}>
                  {mode.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '500',
            color: COLORS.textSecondary,
            marginBottom: '8px'
          }}>
            Theme
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {THEMES.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => setSelectedTheme(themeOption.value)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedTheme === themeOption.value 
                    ? `1px solid ${COLORS.accent}` 
                    : `1px solid ${COLORS.borderDefault}`,
                  backgroundColor: selectedTheme === themeOption.value 
                    ? COLORS.accentMuted
                    : 'transparent',
                  color: selectedTheme === themeOption.value 
                    ? COLORS.textPrimary 
                    : COLORS.textSecondary,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                <span style={{ fontSize: '16px' }}>{themeOption.icon}</span>
                <span>{themeOption.label}</span>
              </button>
            ))}
          </div>
        </div>


        {/* Admin Token Management */}
        {isAdmin && (
          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            paddingBottom: '24px',
            borderTop: `1px solid ${COLORS.borderSubtle}`
          }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: COLORS.textSecondary,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Admin: Add Tokens
            </label>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="10000"
                  style={{
                    width: '100%',
                    backgroundColor: COLORS.bgInput,
                    border: `1px solid ${COLORS.borderDefault}`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: COLORS.textPrimary,
                    fontSize: '13px',
                    fontFamily: '"SF Mono", "JetBrains Mono", monospace'
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const amount = parseInt(tokenAmount, 10);
                  if (amount > 0 && onAddTokens) {
                    onAddTokens(amount);
                    setTokenAmount('10000');
                  }
                }}
                style={{
                  backgroundColor: COLORS.accent,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: '#000000',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Add Tokens
              </button>
            </div>
            {availableTokens !== null && (
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: COLORS.textMuted
              }}>
                Available: {availableTokens.toLocaleString()} tokens
              </div>
            )}
          </div>
        )}
        </div>

        {/* Actions - Fixed at bottom */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          padding: '16px 24px 24px 24px',
          flexShrink: 0,
          borderTop: `1px solid ${COLORS.borderSubtle}`
        }}>
          <button
            onClick={handleClose}
            className="cancel-btn"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${COLORS.borderDefault}`,
              borderRadius: '8px',
              padding: '10px 16px',
              color: COLORS.textSecondary,
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="save-btn"
            style={{
              backgroundColor: apiKey.trim() ? COLORS.accent : COLORS.bgInput,
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              color: apiKey.trim() ? '#000000' : COLORS.textMuted,
              fontSize: '13px',
              fontWeight: '600',
              cursor: apiKey.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
              opacity: apiKey.trim() ? 1 : 0.5
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
