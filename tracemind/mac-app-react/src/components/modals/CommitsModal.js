import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function CommitsModal({ isOpen, onClose, githubUrl, apiKey, model }) {
  const { theme } = useTheme();
  const COLORS = theme.colors;
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitSummary, setCommitSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen && githubUrl && window.electronAPI) {
      setIsClosing(false);
      fetchCommits(1);
    }
  }, [isOpen, githubUrl]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const fetchCommits = async (pageNum) => {
    if (!githubUrl || !window.electronAPI) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await window.electronAPI.githubRepoCommits(githubUrl, pageNum, 50);
      if (data && data.commits) {
        if (pageNum === 1) {
          setCommits(data.commits);
        } else {
          setCommits(prev => [...prev, ...data.commits]);
        }
        setHasMore(data.hasMore || false);
        setPage(pageNum);
      } else {
        setError('No commits found');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch commits');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchCommits(page + 1);
    }
  };

  const fetchCommitSummary = async (commit) => {
    if (!apiKey || !githubUrl || !window.electronAPI) {
      return;
    }
    
    setLoadingSummary(true);
    setCommitSummary(null);
    try {
      const summary = await window.electronAPI.summarizeCommit(githubUrl, commit.sha, apiKey, model || 'gpt-4o-mini');
      setCommitSummary(summary);
    } catch (err) {
      console.error('Error fetching commit summary:', err);
      setCommitSummary({ error: err.message || 'Failed to generate summary' });
    } finally {
      setLoadingSummary(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'added': return '#28a745';
      case 'removed': return '#dc3545';
      case 'modified': return '#ffc107';
      case 'renamed': return '#17a2b8';
      default: return COLORS.textSecondary;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
        animation: isClosing ? 'fadeOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: COLORS.bgSurface,
          borderRadius: '12px',
          border: `1px solid ${COLORS.borderDefault}`,
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: isClosing ? 'modalZoomOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'modalZoomIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${COLORS.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '600',
            color: COLORS.textPrimary
          }}>
            📊 Commit History
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.textSecondary,
              cursor: 'pointer',
              fontSize: '24px',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = COLORS.bgHover;
              e.target.style.color = COLORS.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = COLORS.textSecondary;
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          minHeight: 0
        }}>
          {loading && commits.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: COLORS.textSecondary
            }}>
              Loading commits...
            </div>
          ) : error ? (
            <div style={{
              padding: '20px',
              backgroundColor: COLORS.errorBg || 'rgba(255, 107, 107, 0.1)',
              border: `1px solid ${COLORS.errorBorder || 'rgba(255, 107, 107, 0.3)'}`,
              borderRadius: '8px',
              color: COLORS.errorText || '#ff6b6b'
            }}>
              {error}
            </div>
          ) : commits.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: COLORS.textSecondary
            }}>
              No commits found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {commits.map((commit, index) => (
                <div
                  key={commit.sha}
                  style={{
                    backgroundColor: COLORS.bgElevated,
                    borderRadius: '8px',
                    border: `1px solid ${selectedCommit?.sha === commit.sha ? COLORS.accent : COLORS.borderSubtle}`,
                    padding: '16px',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (selectedCommit?.sha === commit.sha) {
                      setSelectedCommit(null);
                      setCommitSummary(null);
                    } else {
                      setSelectedCommit(commit);
                      fetchCommitSummary(commit);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCommit?.sha !== commit.sha) {
                      e.currentTarget.style.borderColor = COLORS.borderDefault;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCommit?.sha !== commit.sha) {
                      e.currentTarget.style.borderColor = COLORS.borderSubtle;
                    }
                  }}
                >
                  {/* Commit Header */}
                  <div style={{ marginBottom: '12px' }}>
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: '15px',
                        fontWeight: '500',
                        color: COLORS.accent,
                        textDecoration: 'none',
                        marginBottom: '8px',
                        display: 'block',
                        wordBreak: 'break-word'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.textDecoration = 'none';
                      }}
                    >
                      {commit.message.split('\n')[0]}
                    </a>
                    <div style={{
                      fontSize: '12px',
                      color: COLORS.textSecondary,
                      fontFamily: '"SF Mono", monospace',
                      marginTop: '4px'
                    }}>
                      {commit.sha.substring(0, 7)}
                    </div>
                  </div>

                  {/* Author Info */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    {commit.author.avatar_url && (
                      <img
                        src={commit.author.avatar_url}
                        alt={commit.author.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        color: COLORS.textPrimary,
                        fontWeight: '500'
                      }}>
                        {commit.author.username || commit.author.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: COLORS.textSecondary
                      }}>
                        {formatDate(commit.date)}
                      </div>
                    </div>
                    {commit.stats && (
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '12px'
                      }}>
                        <span style={{ color: '#28a745' }}>
                          +{commit.stats.additions}
                        </span>
                        <span style={{ color: '#dc3545' }}>
                          -{commit.stats.deletions}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Changed Files */}
                  {commit.files && commit.files.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${COLORS.borderSubtle}`
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: COLORS.textSecondary,
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Changed Files ({commit.files.length})
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        maxHeight: '150px',
                        overflowY: 'auto'
                      }}>
                        {commit.files.slice(0, 10).map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12px',
                              padding: '4px 8px',
                              backgroundColor: COLORS.bgInput,
                              borderRadius: '4px'
                            }}
                          >
                            <span style={{
                              color: getStatusColor(file.status),
                              fontWeight: '500',
                              minWidth: '60px',
                              textTransform: 'capitalize'
                            }}>
                              {file.status}
                            </span>
                            <span style={{
                              color: COLORS.textPrimary,
                              flex: 1,
                              fontFamily: '"SF Mono", monospace',
                              wordBreak: 'break-all'
                            }}>
                              {file.filename}
                            </span>
                            {file.changes > 0 && (
                              <span style={{ color: COLORS.textSecondary }}>
                                {file.additions > 0 && `+${file.additions} `}
                                {file.deletions > 0 && `-${file.deletions}`}
                              </span>
                            )}
                          </div>
                        ))}
                        {commit.files.length > 10 && (
                          <div style={{
                            fontSize: '11px',
                            color: COLORS.textMuted,
                            fontStyle: 'italic',
                            padding: '4px 8px'
                          }}>
                            ... and {commit.files.length - 10} more files
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Summary - Expanded View */}
                  {selectedCommit?.sha === commit.sha && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: `1px solid ${COLORS.borderDefault}`
                    }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: COLORS.textPrimary,
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>🤖</span>
                        AI Summary
                      </div>
                      {loadingSummary ? (
                        <div style={{
                          padding: '16px',
                          backgroundColor: COLORS.bgInput,
                          borderRadius: '6px',
                          color: COLORS.textSecondary,
                          fontSize: '13px',
                          textAlign: 'center'
                        }}>
                          Generating AI summary...
                        </div>
                      ) : commitSummary?.error ? (
                        <div style={{
                          padding: '12px',
                          backgroundColor: COLORS.errorBg || 'rgba(255, 107, 107, 0.1)',
                          border: `1px solid ${COLORS.errorBorder || 'rgba(255, 107, 107, 0.3)'}`,
                          borderRadius: '6px',
                          color: COLORS.errorText || '#ff6b6b',
                          fontSize: '13px'
                        }}>
                          {commitSummary.error}
                        </div>
                      ) : commitSummary ? (
                        <div style={{
                          padding: '16px',
                          backgroundColor: COLORS.bgInput,
                          borderRadius: '6px',
                          color: COLORS.textPrimary,
                          fontSize: '13px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {commitSummary}
                        </div>
                      ) : !apiKey ? (
                        <div style={{
                          padding: '12px',
                          backgroundColor: COLORS.bgInput,
                          borderRadius: '6px',
                          color: COLORS.textMuted,
                          fontSize: '13px',
                          fontStyle: 'italic'
                        }}>
                          API key required to generate AI summaries. Please configure it in Settings.
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: COLORS.bgElevated,
                    border: `1px solid ${COLORS.borderDefault}`,
                    borderRadius: '8px',
                    color: COLORS.textPrimary,
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                    marginTop: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.backgroundColor = COLORS.bgHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.backgroundColor = COLORS.bgElevated;
                    }
                  }}
                >
                  {loading ? 'Loading...' : 'Load More Commits'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommitsModal;

