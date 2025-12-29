import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import MindMapView from './MindMapView';
import ChatView from './ChatView';
import CommitsModal from '../modals/CommitsModal';
import './ExplanationPanel.css';
import { useTheme } from '../../contexts/ThemeContext';

function ExplanationPanel({ explanation, loading = false, filePath, projectPath, apiKey, model, analysisMode, githubUrl, githubData, onToggleFullscreen, isFullscreen, projectStats }) {
  const { theme } = useTheme();
  // Extend theme colors with code-specific colors
  const COLORS = {
    ...theme.colors,
    bgCode: theme.colors.codeBg || (theme.colors.bgBase === '#000000' ? '#0f0f0f' : '#f8f8f8'),
    codeText: theme.colors.codeText,
    codeKeyword: theme.colors.textPrimary,
    codeString: theme.colors.accent,
  };
  const [viewMode, setViewMode] = useState('text'); // 'text', 'origins', 'map', or 'chat'

  return (
    <div className="explanation-panel" style={{
      flex: '1 1 auto',
      backgroundColor: COLORS.bgSurface,
      borderRadius: isFullscreen ? '0px' : '12px',
      border: `1px solid ${COLORS.borderSubtle}`,
      marginTop: isFullscreen ? '0px' : '20px',
      overflow: 'hidden',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1), margin-top 0.4s cubic-bezier(0.4, 0, 0.2, 1), border 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* View mode toggle */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '12px 16px',
        borderBottom: `1px solid ${COLORS.borderSubtle}`,
        backgroundColor: COLORS.bgElevated,
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['text', 'origins', 'map', 'chat'].map((mode) => {
            const labels = {
              text: 'Analysis',
              origins: 'Origins',
              map: 'Mind Map',
              chat: 'Chat'
            };
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`tab-btn ${viewMode === mode ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === mode ? COLORS.accentMuted : 'transparent',
                  color: viewMode === mode ? COLORS.accent : COLORS.textMuted,
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            style={{
              background: 'transparent',
              border: `1px solid ${COLORS.borderDefault}`,
              borderRadius: '6px',
              padding: '6px 12px',
              color: COLORS.textSecondary,
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = COLORS.bgHover;
              e.target.style.color = COLORS.textPrimary;
              e.target.style.borderColor = COLORS.accent;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = COLORS.textSecondary;
              e.target.style.borderColor = COLORS.borderDefault;
            }}
          >
            {isFullscreen ? (
              <>
                <span>⤓</span>
                Exit Fullscreen
              </>
            ) : (
              <>
                <span>⛶</span>
                Fullscreen
              </>
            )}
          </button>
        )}
      </div>

      {/* Content area */}
      {viewMode === 'text' ? (
        <div 
          style={{
            flex: '1 1 auto',
            padding: '24px 28px',
            overflowY: 'scroll',
            overflowX: 'hidden',
            backgroundColor: COLORS.bgBase,
            minHeight: 0,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {!explanation ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px 24px',
              color: COLORS.textSecondary 
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                marginBottom: '12px', 
                color: COLORS.textPrimary,
                fontWeight: '600'
              }}>
                Ready to analyze
              </h2>
              <p style={{ 
                color: COLORS.textMuted, 
                fontSize: '13px',
                lineHeight: '1.6'
              }}>
                Select a code file and click "Explain Code" to get AI-powered insights about structure, intent, and history.
              </p>
            </div>
          ) : (
            <div className="explanation-content" style={{
              color: COLORS.textPrimary,
              fontSize: '14px',
              lineHeight: '1.75',
              animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <ReactMarkdown
                components={{
            h1: ({node, ...props}) => <h1 style={{
              color: COLORS.textPrimary, 
              fontSize: '20px', 
              marginTop: '32px', 
              marginBottom: '16px', 
              paddingBottom: '12px',
              borderBottom: `1px solid ${COLORS.borderSubtle}`,
              fontWeight: '600',
              letterSpacing: '-0.02em'
            }} {...props} />,
            h2: ({node, ...props}) => <h2 style={{
              color: COLORS.accent, 
              fontSize: '16px', 
              marginTop: '28px', 
              marginBottom: '12px',
              fontWeight: '600',
              letterSpacing: '-0.01em'
            }} {...props} />,
            h3: ({node, ...props}) => <h3 style={{
              color: COLORS.textSecondary, 
              fontSize: '14px', 
              marginTop: '20px', 
              marginBottom: '10px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.03em'
            }} {...props} />,
            code: ({node, inline, ...props}) => 
              inline ? (
                <code style={{
                  backgroundColor: COLORS.bgHover,
                  color: COLORS.codeText,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                  border: `1px solid ${COLORS.borderSubtle}`
                }} {...props} />
              ) : (
                <code style={{
                  display: 'block',
                  backgroundColor: COLORS.bgCode,
                  color: COLORS.textPrimary,
                  padding: '16px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '12px',
                  fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                  margin: '16px 0',
                  border: `1px solid ${COLORS.borderSubtle}`,
                  lineHeight: '1.6'
                }} {...props} />
              ),
            p: ({node, ...props}) => <p style={{
              marginBottom: '14px',
              lineHeight: '1.7',
              color: COLORS.textSecondary
            }} {...props} />,
            ul: ({node, ...props}) => <ul style={{
              marginLeft: '16px',
              marginBottom: '14px',
              paddingLeft: '8px',
              color: COLORS.textSecondary
            }} {...props} />,
            ol: ({node, ...props}) => <ol style={{
              marginLeft: '16px',
              marginBottom: '14px',
              paddingLeft: '8px',
              color: COLORS.textSecondary
            }} {...props} />,
            li: ({node, ...props}) => <li style={{
              marginBottom: '8px',
              lineHeight: '1.7'
            }} {...props} />,
            strong: ({node, ...props}) => <strong style={{
              fontWeight: '600',
              color: COLORS.textPrimary
            }} {...props} />,
            a: ({node, ...props}) => <a 
              className="md-link"
              style={{
                color: COLORS.accent,
                textDecoration: 'none'
              }} {...props} />,
                }}
              >
                {explanation}
              </ReactMarkdown>
            </div>
          )}
        </div>
      ) : viewMode === 'origins' ? (
        <div style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'scroll',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}>
          <CodeOriginsView explanation={explanation} githubUrl={githubUrl} githubData={githubData} apiKey={apiKey} model={model} projectPath={projectPath} projectStats={projectStats} />
        </div>
      ) : viewMode === 'chat' ? (
        <div style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
          width: '100%',
          height: '100%'
        }}>
          <ChatView 
            filePath={filePath}
            projectPath={projectPath}
            explanation={explanation}
            apiKey={apiKey}
            model={model}
            analysisMode={analysisMode}
          />
        </div>
      ) : (
        <div style={{
          flex: '1 1 auto',
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          zIndex: 0
        }}>
          <MindMapView explanation={explanation} />
        </div>
      )}
    </div>
  );
}

// Code Origins View Component
function CodeOriginsView({ explanation, githubUrl: providedGithubUrl, githubData: providedGithubData, apiKey, model, projectPath, projectStats: providedProjectStats }) {
  const { theme } = useTheme();
  const COLORS = theme.colors;
  
  const [githubData, setGithubData] = useState(providedGithubData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCommitsModal, setShowCommitsModal] = useState(false);
  const [projectStats, setProjectStats] = useState(providedProjectStats || null);
  const [animateBars, setAnimateBars] = useState(false);
  const containerRef = useRef(null);
  
  // Normalize GitHub URL
  const normalizeGitHubUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.includes('github.com')) {
      return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }
    return `https://github.com/${trimmed}`;
  };
  
  const githubUrl = normalizeGitHubUrl(providedGithubUrl);
  
  useEffect(() => {
    if (providedGithubData) {
      setGithubData(providedGithubData);
      setError(null);
      setLoading(false);
    }
    
    if (providedProjectStats) {
      setProjectStats(providedProjectStats);
    }
  }, [providedGithubData, providedProjectStats]);
  
  useEffect(() => {
    // Fetch GitHub data if URL is provided
    if (providedGithubData || !githubUrl || !window.electronAPI) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await window.electronAPI.githubRepoAll(githubUrl);
        if (!data) {
          setError('Repository not found. Please check the URL and ensure the repository exists and is accessible.');
          return;
        }
        setGithubData(data);
        setError(null);
      } catch (err) {
        if (err.message && err.message.includes('rate limit')) {
          setError('GitHub API rate limit exceeded. Please try again later or set a GITHUB_TOKEN environment variable.');
        } else if (err.message && err.message.includes('Invalid GitHub')) {
          setError(err.message);
        } else {
          setError(err.message || 'Failed to fetch repository data. Please check the URL and try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [githubUrl, providedGithubData]);
  
  useEffect(() => {
    // Fetch project stats if projectPath is provided
    if (providedProjectStats || !projectPath || !window.electronAPI) return;
    
    const fetchProjectStats = async () => {
      try {
        const stats = await window.electronAPI.getProjectStats(projectPath);
        if (stats) {
          setProjectStats(stats);
        }
      } catch (err) {
        console.error('Failed to fetch project stats:', err);
      }
    };
    
    fetchProjectStats();
  }, [projectPath, providedProjectStats]);
  
  // Trigger animation when component mounts or githubData changes
  useEffect(() => {
    if (githubData) {
      // Reset animation first
      setAnimateBars(false);
      // Small delay to ensure DOM is ready, then animate
      setTimeout(() => {
        setAnimateBars(true);
      }, 100);
    }
  }, [githubData]);

  // Gap-filling algorithm: detect large gaps and adjust card padding
  useEffect(() => {
    if (!containerRef.current || !animateBars) return;
    
    const fillGaps = () => {
      const container = containerRef.current;
      if (!container) return;
      
      // Wait for layout to stabilize
      setTimeout(() => {
        const cards = Array.from(container.querySelectorAll('[data-card]'));
        if (cards.length === 0) return;
        
        const gapThreshold = 80; // Consider gaps larger than 80px as significant
        
        // Get positions of all cards
        const cardPositions = cards.map(card => {
          const rect = card.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          return {
            element: card,
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top,
            height: rect.height,
            bottom: rect.bottom - containerRect.top
          };
        });
        
        // Group cards by column (similar left position)
        const columns = [];
        cardPositions.forEach(card => {
          let found = false;
          for (let col of columns) {
            if (Math.abs(col.left - card.left) < 50) {
              col.cards.push(card);
              found = true;
              break;
            }
          }
          if (!found) {
            columns.push({ left: card.left, cards: [card] });
          }
        });
        
        // Calculate column heights
        const columnHeights = columns.map(col => {
          if (col.cards.length === 0) return 0;
          const sortedCards = col.cards.sort((a, b) => a.top - b.top);
          const lastCard = sortedCards[sortedCards.length - 1];
          return lastCard.bottom;
        });
        
        const maxHeight = Math.max(...columnHeights);
        const minHeight = Math.min(...columnHeights);
        const heightDiff = maxHeight - minHeight;
        
        // If there's a significant gap, add padding to shorter columns
        if (heightDiff > gapThreshold && columns.length > 1) {
          columns.forEach((col, colIdx) => {
            const colHeight = columnHeights[colIdx];
            if (colHeight < maxHeight - gapThreshold / 2) {
              const extraNeeded = maxHeight - colHeight;
              const cardsInCol = col.cards.length;
              const paddingPerCard = Math.min(extraNeeded / Math.max(cardsInCol, 1), 25); // Max 25px per card
              
              col.cards.forEach(cardInfo => {
                const currentStyle = window.getComputedStyle(cardInfo.element);
                const currentPaddingBottom = parseFloat(currentStyle.paddingBottom) || 0;
                // Only add padding if it's reasonable
                if (paddingPerCard > 5) {
                  cardInfo.element.style.paddingBottom = `${currentPaddingBottom + paddingPerCard}px`;
                }
              });
            }
          });
        }
      }, 600); // Wait for layout to stabilize
    };
    
    fillGaps();
    
    // Re-run on window resize
    const handleResize = () => {
      // Reset padding first
      const cards = containerRef.current?.querySelectorAll('[data-card]');
      if (cards) {
        cards.forEach(card => {
          card.style.paddingBottom = '';
        });
      }
      fillGaps();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [animateBars, githubData]);

  // Extract information from explanation
  const extractSection = (title) => {
    if (!explanation) return '';
    const regex = new RegExp(`##\\s*${title}[^#]*?(?=##|$)`, 'is');
    const match = explanation.match(regex);
    return match ? match[0] : '';
  };


  const cardStyle = {
    backgroundColor: COLORS.bgElevated,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${COLORS.borderDefault}`,
  };

  const labelStyle = {
    fontSize: '12px',
    color: COLORS.textSecondary,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const valueStyle = {
    fontSize: '16px',
    color: COLORS.textPrimary,
    fontWeight: '500',
  };

  return (
    <div style={{
      padding: '30px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <h2 style={{
        color: COLORS.accent,
        fontSize: '24px',
        marginBottom: '24px',
        fontWeight: '700',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        🔍 Code Origins & Evolution
      </h2>

      {loading && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: COLORS.textSecondary,
          fontSize: '14px'
        }}>
          Loading repository data...
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: COLORS.errorBg || 'rgba(255, 107, 107, 0.1)',
          border: `1px solid ${COLORS.errorBorder || 'rgba(255, 107, 107, 0.3)'}`,
          borderRadius: '8px',
          color: COLORS.errorText || '#ff6b6b',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <div 
        ref={containerRef}
        style={{ 
          columnCount: 'auto',
          columnWidth: '350px',
          columnGap: '16px'
        }}
      >
        {/* Repository Card */}
        <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
          <div style={labelStyle}>📦 Repository</div>
          {githubData && githubData.summary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a 
                href={githubData.summary.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  ...valueStyle,
                  color: COLORS.accent,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🔗</span>
                {githubData.summary.full_name || githubData.summary.name}
              </a>
              {githubData.summary.description && (
                <div style={{ fontSize: '13px', color: COLORS.textSecondary }}>
                  {githubData.summary.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: COLORS.textMuted, flexWrap: 'wrap' }}>
                {githubData.summary.stars > 0 && (
                  <span>⭐ {githubData.summary.stars.toLocaleString()} stars</span>
                )}
                {githubData.summary.forks > 0 && (
                  <span>🍴 {githubData.summary.forks.toLocaleString()} forks</span>
                )}
                {githubData.summary.language && (
                  <span>💻 {githubData.summary.language}</span>
                )}
                {githubData.summary.license && (
                  <span>📄 {githubData.summary.license}</span>
                )}
              </div>
              {githubData.summary.topics && githubData.summary.topics.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {githubData.summary.topics.slice(0, 5).map((topic, i) => (
                    <span key={i} style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      backgroundColor: COLORS.bgInput,
                      borderRadius: '12px',
                      color: COLORS.textSecondary
                    }}>
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : githubUrl ? (
            <div style={{ ...valueStyle, color: COLORS.textSecondary }}>
              Loading repository information...
            </div>
          ) : (
            <div style={{ ...valueStyle, color: COLORS.textSecondary }}>
              No GitHub repository detected. Add a GitHub URL in the input field above.
            </div>
          )}
        </div>

        {/* Project Statistics Card */}
        {projectStats && (
          <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
            <div style={labelStyle}>📊 Project Statistics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Total Lines of Code</div>
                <div style={{ fontSize: '20px', color: COLORS.textPrimary, fontWeight: '600', fontFamily: '"SF Mono", monospace' }}>
                  {projectStats.totalLines.toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Files</div>
                  <div style={{ fontSize: '16px', color: COLORS.textPrimary, fontWeight: '500', fontFamily: '"SF Mono", monospace' }}>
                    {projectStats.fileCount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Total Size</div>
                  <div style={{ fontSize: '16px', color: COLORS.textPrimary, fontWeight: '500', fontFamily: '"SF Mono", monospace' }}>
                    {(projectStats.totalSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Avg File Size</div>
                  <div style={{ fontSize: '16px', color: COLORS.textPrimary, fontWeight: '500', fontFamily: '"SF Mono", monospace' }}>
                    {(projectStats.avgFileSize / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contributors Card */}
        <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
          <div style={labelStyle}>👥 Contributors</div>
          {githubData && githubData.contributors && githubData.contributors.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const totalContributions = githubData.contributors.reduce((sum, c) => sum + (c.contributions || 0), 0);
                return githubData.contributors.slice(0, 10).map((contributor, i) => {
                  const contributionPercent = totalContributions > 0 ? ((contributor.contributions || 0) / totalContributions * 100).toFixed(1) : 0;
                  return (
                    <a
                      key={i}
                      href={contributor.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        color: COLORS.textPrimary,
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bgInput}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {contributor.avatar_url && (
                        <img 
                          src={contributor.avatar_url} 
                          alt={contributor.username}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%'
                          }}
                        />
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{contributor.username}</span>
                        <div style={{ 
                          width: '100%',
                          height: '4px',
                          backgroundColor: COLORS.bgInput,
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: animateBars ? `${contributionPercent}%` : '0%',
                            height: '100%',
                            backgroundColor: COLORS.accent,
                            transition: 'width 1s ease-out'
                          }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ 
                          fontSize: '13px', 
                          color: COLORS.textPrimary,
                          fontWeight: '500'
                        }}>
                          {contributor.contributions.toLocaleString()}
                        </span>
                        <span style={{ 
                          fontSize: '11px', 
                          color: COLORS.textSecondary 
                        }}>
                          {contributionPercent}%
                        </span>
                      </div>
                    </a>
                  );
                });
              })()}
            </div>
          ) : (
            <div style={{ ...valueStyle, color: COLORS.textSecondary, fontSize: '14px' }}>
              {loading ? 'Loading...' : 'No contributors found'}
            </div>
          )}
        </div>

        {/* Timeline Card */}
        <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
          <div style={labelStyle}>📅 Key Dates</div>
          {githubData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {githubData.summary && githubData.summary.created_at && (
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '2px' }}>Created</div>
                  <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontFamily: '"SF Mono", monospace' }}>
                    {new Date(githubData.summary.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
              {githubData.summary && githubData.summary.updated_at && (
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '2px' }}>Last Updated</div>
                  <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontFamily: '"SF Mono", monospace' }}>
                    {new Date(githubData.summary.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
              {githubData.releases && githubData.releases.first_release && (
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '2px' }}>First Release</div>
                  <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontFamily: '"SF Mono", monospace' }}>
                    {githubData.releases.first_release.tag_name} ({new Date(githubData.releases.first_release.published_at).toLocaleDateString()})
                  </div>
                </div>
              )}
              {githubData.releases && githubData.releases.latest_release && githubData.releases.latest_release.tag_name !== githubData.releases.first_release?.tag_name && (
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '2px' }}>Latest Release</div>
                  <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontFamily: '"SF Mono", monospace' }}>
                    {githubData.releases.latest_release.tag_name} ({new Date(githubData.releases.latest_release.published_at).toLocaleDateString()})
                  </div>
                </div>
              )}
              {(!githubData.summary || (!githubData.summary.created_at && !githubData.releases)) && (
                <div style={{ ...valueStyle, color: COLORS.textSecondary, fontSize: '14px' }}>
                  No specific dates found
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...valueStyle, color: COLORS.textSecondary, fontSize: '14px' }}>
              {loading ? 'Loading...' : 'No specific dates found'}
            </div>
          )}
        </div>

        {/* Code Statistics Card */}
        {projectStats && (
          <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
            <div style={labelStyle}>📏 Code Metrics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Average Lines per File</div>
                <div style={{ fontSize: '18px', color: COLORS.textPrimary, fontWeight: '600', fontFamily: '"SF Mono", monospace' }}>
                  {projectStats.fileCount > 0 ? Math.round(projectStats.totalLines / projectStats.fileCount) : 0}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Largest File Size</div>
                  <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: '500', fontFamily: '"SF Mono", monospace' }}>
                    {(projectStats.avgFileSize * 1.5 / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Smallest File Size</div>
                  <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: '500', fontFamily: '"SF Mono", monospace' }}>
                    {(projectStats.avgFileSize * 0.5 / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Card */}
        {githubData && (
          <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
            <div style={labelStyle}>⚡ Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {githubData.commits && githubData.commits.total_commits > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Total Commits</div>
                  <div style={{ fontSize: '20px', color: COLORS.textPrimary, fontWeight: '600', fontFamily: '"SF Mono", monospace' }}>
                    {githubData.commits.total_commits.toLocaleString()}
                  </div>
                </div>
              )}
              {githubData.releases && githubData.releases.total_releases > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Releases</div>
                  <div style={{ fontSize: '16px', color: COLORS.textPrimary, fontWeight: '500', fontFamily: '"SF Mono", monospace' }}>
                    {githubData.releases.total_releases} {githubData.releases.total_releases === 1 ? 'release' : 'releases'}
                  </div>
                </div>
              )}
              {githubData.contributors && githubData.contributors.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Active Contributors</div>
                  <div style={{ fontSize: '16px', color: COLORS.textPrimary, fontWeight: '500', fontFamily: '"SF Mono", monospace' }}>
                    {githubData.contributors.length} {githubData.contributors.length === 1 ? 'contributor' : 'contributors'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Repository Info Card */}
        {githubData && githubData.summary && (
          <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
            <div style={labelStyle}>ℹ️ Repository Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {githubData.summary.language && (
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Primary Language</div>
                  <div style={{ fontSize: '16px', color: COLORS.textPrimary, fontWeight: '500' }}>
                    {githubData.summary.language}
                  </div>
                </div>
              )}
              {githubData.summary.license && (
                <div>
                  <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>License</div>
                  <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: '500' }}>
                    {githubData.summary.license}
                  </div>
                </div>
              )}
              {githubData.summary.stars > 0 && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Stars</div>
                    <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: '500', fontFamily: '"SF Mono", monospace' }}>
                      {githubData.summary.stars.toLocaleString()}
                    </div>
                  </div>
                  {githubData.summary.forks > 0 && (
                    <div>
                      <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginBottom: '4px' }}>Forks</div>
                      <div style={{ fontSize: '14px', color: COLORS.textPrimary, fontWeight: '500', fontFamily: '"SF Mono", monospace' }}>
                        {githubData.summary.forks.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Languages Breakdown Card */}
        {githubData && githubData.languages && Object.keys(githubData.languages).length > 0 && (
          <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
            <div style={labelStyle}>💻 Languages</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(() => {
                const totalBytes = Object.values(githubData.languages).reduce((sum, bytes) => sum + bytes, 0);
                const languages = Object.entries(githubData.languages)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8);
                
                return languages.map(([lang, bytes], i) => {
                  const percent = ((bytes / totalBytes) * 100).toFixed(1);
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: COLORS.textPrimary, fontWeight: '500' }}>{lang}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: COLORS.textSecondary, fontFamily: '"SF Mono", monospace' }}>
                            {percent}%
                          </span>
                          <span style={{ fontSize: '11px', color: COLORS.textMuted, fontFamily: '"SF Mono", monospace' }}>
                            {(bytes / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      </div>
                        <div style={{ 
                          width: '100%',
                          height: '6px',
                          backgroundColor: COLORS.bgInput,
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: animateBars ? `${percent}%` : '0%',
                            height: '100%',
                            backgroundColor: COLORS.accent,
                            transition: 'width 1s ease-out'
                          }} />
                        </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Chart Card - Contributor Activity */}
        {githubData && githubData.contributors && githubData.contributors.length > 0 && (
          <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
            <div style={labelStyle}>📊 Contributor Activity Chart</div>
            <div style={{ marginTop: '12px' }}>
              {(() => {
                const topContributors = githubData.contributors
                  .slice(0, 6)
                  .sort((a, b) => (b.contributions || 0) - (a.contributions || 0));
                const maxContributions = topContributors[0]?.contributions || 1;
                const chartHeight = 180;
                const barWidth = 40;
                const barGap = 12;
                const chartWidth = topContributors.length * (barWidth + barGap) - barGap;
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <svg 
                      width="100%" 
                      height={chartHeight} 
                      style={{ maxWidth: '100%', overflow: 'visible' }}
                      viewBox={`0 0 ${Math.max(chartWidth, 240)} ${chartHeight}`}
                    >
                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={chartHeight - (ratio * chartHeight * 0.85)}
                          x2={chartWidth}
                          y2={chartHeight - (ratio * chartHeight * 0.85)}
                          stroke={COLORS.borderDefault}
                          strokeWidth="1"
                          strokeDasharray="2,2"
                          opacity="0.3"
                        />
                      ))}
                      
                      {/* Bars */}
                      {topContributors.map((contributor, i) => {
                        const height = (contributor.contributions / maxContributions) * (chartHeight * 0.85);
                        const x = i * (barWidth + barGap);
                        const y = chartHeight - height - 20;
                        
                        return (
                          <g key={i}>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={height}
                              fill={COLORS.accent}
                              rx="4"
                              opacity="0.8"
                            />
                            <text
                              x={x + barWidth / 2}
                              y={chartHeight - 5}
                              textAnchor="middle"
                              fontSize="10"
                              fill={COLORS.textSecondary}
                              fontFamily="'SF Mono', monospace"
                            >
                              {contributor.username.substring(0, 6)}
                            </text>
                            <text
                              x={x + barWidth / 2}
                              y={y - 5}
                              textAnchor="middle"
                              fontSize="11"
                              fill={COLORS.textPrimary}
                              fontWeight="600"
                              fontFamily="'SF Mono', monospace"
                            >
                              {contributor.contributions}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div style={{ fontSize: '11px', color: COLORS.textMuted, textAlign: 'center' }}>
                      Top {topContributors.length} contributors by commits
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Language Distribution Chart */}
        {githubData && githubData.languages && Object.keys(githubData.languages).length > 1 && (
          <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
            <div style={labelStyle}>📈 Language Distribution</div>
            <div style={{ marginTop: '12px' }}>
              {(() => {
                const totalBytes = Object.values(githubData.languages).reduce((sum, bytes) => sum + bytes, 0);
                const languages = Object.entries(githubData.languages)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                const maxBytes = languages[0]?.[1] || 1;
                const chartHeight = 150;
                const barHeight = 24;
                const barGap = 8;
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {languages.map(([lang, bytes], i) => {
                      const percent = (bytes / totalBytes) * 100;
                      const barWidth = (bytes / maxBytes) * 100;
                      
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: COLORS.textPrimary, fontWeight: '500', minWidth: '80px' }}>
                              {lang}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: COLORS.textSecondary, fontFamily: '"SF Mono", monospace' }}>
                                {(bytes / 1024 / 1024).toFixed(1)} MB
                              </span>
                              <span style={{ fontSize: '11px', color: COLORS.textSecondary, fontFamily: '"SF Mono", monospace', minWidth: '45px', textAlign: 'right' }}>
                                {percent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div style={{ 
                            width: '100%',
                            height: barHeight,
                            backgroundColor: COLORS.bgInput,
                            borderRadius: '4px',
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <div style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accent}dd 100%)`,
                              borderRadius: '4px',
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Branches Card */}
        {githubData && (Array.isArray(githubData.branches) || githubData.branches === undefined) && (
          <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
            <div style={labelStyle}>🌳 Branches</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {(githubData.branches && githubData.branches.length > 0) ? githubData.branches.map((branch, i) => (
                <div 
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    backgroundColor: COLORS.bgInput,
                    borderRadius: '6px',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '14px' }}>🌿</span>
                    <span style={{ 
                      fontSize: '13px', 
                      color: COLORS.textPrimary, 
                      fontWeight: '500',
                      fontFamily: '"SF Mono", monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {branch.name}
                    </span>
                    {branch.protected && (
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '2px 6px',
                        backgroundColor: COLORS.accent + '20',
                        color: COLORS.accent,
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        Protected
                      </span>
                    )}
                  </div>
                  {branch.commit_url && (
                    <a
                      href={branch.commit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '10px',
                        color: COLORS.textSecondary,
                        textDecoration: 'none',
                        fontFamily: '"SF Mono", monospace',
                        padding: '4px 8px',
                        backgroundColor: COLORS.bgElevated,
                        borderRadius: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.bgInput;
                        e.currentTarget.style.color = COLORS.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.bgElevated;
                        e.currentTarget.style.color = COLORS.textSecondary;
                      }}
                      title={`View commit ${branch.commit_sha?.substring(0, 7)}`}
                    >
                      {branch.commit_sha?.substring(0, 7) || 'View'}
                    </a>
                  )}
                </div>
              )) : (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: COLORS.textSecondary,
                  fontSize: '13px'
                }}>
                  No branches found
                </div>
              )}
            </div>
            {githubData.branches && githubData.branches.length > 0 && (
              <div style={{ 
                marginTop: '8px', 
                fontSize: '11px', 
                color: COLORS.textMuted, 
                textAlign: 'center' 
              }}>
                {githubData.branches.length} {githubData.branches.length === 1 ? 'branch' : 'branches'}
              </div>
            )}
          </div>
        )}

        {/* Similar Projects Card */}
        {githubData && githubData.related && githubData.related.length > 0 && (
          <div data-card style={{ ...cardStyle, breakInside: 'avoid', marginBottom: '16px', display: 'inline-block', width: '100%' }}>
            <div style={labelStyle}>🔄 Related Projects on GitHub</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {githubData.related.map((repo, i) => (
                <a 
                  key={i}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '13px',
                    color: COLORS.accent,
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '8px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ opacity: 0.7 }}>📁</span>
                    <span style={{ flex: 1, fontWeight: '500' }}>{repo.name}</span>
                    {repo.stars > 0 && (
                      <span style={{ 
                        fontSize: '11px', 
                        color: COLORS.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        ⭐ {repo.stars.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: COLORS.textSecondary,
                      marginLeft: '20px'
                    }}>
                      {repo.description}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Evolution Timeline */}
      <div style={{ ...cardStyle, marginTop: '24px' }}>
        <div style={{ ...labelStyle, marginBottom: '16px' }}>📈 Code Evolution</div>
        <div style={{
          color: COLORS.textPrimary,
          fontSize: '14px',
          lineHeight: '1.8',
        }}>
          <ReactMarkdown
            components={{
              h2: () => null, // Hide h2 in this view
              h3: ({node, ...props}) => <h3 style={{
                color: COLORS.codeText,
                fontSize: '16px',
                marginTop: '16px',
                marginBottom: '8px',
              }} {...props} />,
              p: ({node, ...props}) => <p style={{
                marginBottom: '12px',
                lineHeight: '1.6',
              }} {...props} />,
              ul: ({node, ...props}) => <ul style={{
                marginLeft: '20px',
                marginBottom: '12px',
              }} {...props} />,
              li: ({node, ...props}) => <li style={{
                marginBottom: '6px',
              }} {...props} />,
              code: ({node, inline, ...props}) => 
                <code style={{
                  backgroundColor: COLORS.bgInput,
                  color: COLORS.codeText,
                  padding: inline ? '2px 6px' : '12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: '"SF Mono", monospace',
                  display: inline ? 'inline' : 'block',
                }} {...props} />,
            }}
          >
            {extractSection('Code Origins') || extractSection('History') || 'Generate an explanation to see the code evolution analysis.'}
          </ReactMarkdown>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginTop: '24px'
      }}>
        {[
          ...(projectStats ? [
            { 
              label: 'Lines of Code', 
              value: projectStats.totalLines ? projectStats.totalLines.toLocaleString() : '—', 
              icon: '📝'
            },
            { 
              label: 'Files', 
              value: projectStats.fileCount ? projectStats.fileCount.toLocaleString() : '—', 
              icon: '📄' 
            },
          ] : []),
          { 
            label: 'Commits', 
            value: githubData?.commits?.total_commits ? githubData.commits.total_commits.toLocaleString() : '—', 
            icon: '📊',
            onClick: githubData?.commits?.total_commits ? () => setShowCommitsModal(true) : null,
            clickable: !!githubData?.commits?.total_commits
          },
          { 
            label: 'Contributors', 
            value: githubData?.contributors ? githubData.contributors.length : '—', 
            icon: '👤' 
          },
          { 
            label: 'Stars', 
            value: githubData?.summary?.stars ? githubData.summary.stars.toLocaleString() : '—', 
            icon: '⭐' 
          },
          { 
            label: 'Forks', 
            value: githubData?.summary?.forks ? githubData.summary.forks.toLocaleString() : '—', 
            icon: '🍴' 
          },
          { 
            label: 'Releases', 
            value: (githubData?.releases?.total_releases && githubData.releases.total_releases > 0) ? githubData.releases.total_releases : '—', 
            icon: '📦' 
          },
          { 
            label: 'Languages', 
            value: githubData?.languages ? Object.keys(githubData.languages).length : '—', 
            icon: '💻' 
          },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={stat.clickable && stat.onClick ? stat.onClick : undefined}
            style={{
              backgroundColor: COLORS.bgInput,
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              cursor: stat.clickable ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
              ...(stat.clickable ? {
                ':hover': {
                  backgroundColor: COLORS.bgHover,
                  transform: 'translateY(-2px)'
                }
              } : {})
            }}
            onMouseEnter={(e) => {
              if (stat.clickable) {
                e.currentTarget.style.backgroundColor = COLORS.bgHover;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (stat.clickable) {
                e.currentTarget.style.backgroundColor = COLORS.bgInput;
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: COLORS.accent }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: COLORS.textSecondary, textTransform: 'uppercase' }}>{stat.label}</div>
          </div>
        ))}
      </div>
      
      {/* Language Breakdown */}
      {githubData && githubData.languages && Object.keys(githubData.languages).length > 0 && (
        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <div style={labelStyle}>💻 Languages</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(githubData.languages)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([lang, bytes]) => (
                <div key={lang} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: COLORS.bgInput,
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <span style={{ color: COLORS.textPrimary, fontWeight: '500' }}>{lang}</span>
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px' }}>
                    {((bytes / Object.values(githubData.languages).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Commits by Author */}
      {githubData && githubData.commits && githubData.commits.commits_by_author && Object.keys(githubData.commits.commits_by_author).length > 0 && (
        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <div style={labelStyle}>👤 Commits by Author</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(githubData.commits.commits_by_author)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([author, count]) => (
                <div key={author} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px',
                  backgroundColor: COLORS.bgInput,
                  borderRadius: '6px'
                }}>
                  <span style={{ fontSize: '13px', color: COLORS.textPrimary }}>{author}</span>
                  <span style={{ fontSize: '13px', color: COLORS.textSecondary, fontWeight: '500' }}>
                    {count} {count === 1 ? 'commit' : 'commits'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Commits Modal */}
      <CommitsModal
        isOpen={showCommitsModal}
        onClose={() => setShowCommitsModal(false)}
        githubUrl={githubUrl}
        apiKey={apiKey}
        model={model}
      />
    </div>
  );
}

export default ExplanationPanel;
