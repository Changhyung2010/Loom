import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function TokenHistoryModal({ isOpen, onClose, history, isAdmin, totalUsed }) {
  const { theme } = useTheme();
  const COLORS = theme.colors;
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  React.useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div
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
        zIndex: 1000,
        animation: isClosing ? 'fadeOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: COLORS.bgSurface,
          borderRadius: '12px',
          border: `1px solid ${COLORS.borderDefault}`,
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: isClosing ? 'modalZoomOut 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'modalZoomIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${COLORS.borderSubtle}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: COLORS.textPrimary,
              margin: 0,
            }}
          >
            Token Usage History
          </h2>
          <button
            onClick={handleClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: COLORS.textMuted,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = COLORS.bgHover;
              e.target.style.color = COLORS.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = COLORS.textMuted;
            }}
          >
            ×
          </button>
        </div>

        {/* Summary */}
        {isAdmin && (
          <div
            style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${COLORS.borderSubtle}`,
              backgroundColor: COLORS.bgElevated,
            }}
          >
            <div
              style={{
                fontSize: '14px',
                color: COLORS.textSecondary,
                marginBottom: '4px',
              }}
            >
              Total Tokens Used
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: COLORS.accent,
                fontFamily: '"SF Mono", "JetBrains Mono", monospace',
              }}
            >
              {totalUsed.toLocaleString()}
            </div>
          </div>
        )}

        {/* History List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 0',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {history && history.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: `3px solid ${COLORS.accent}`,
                    backgroundColor: COLORS.bgElevated,
                    margin: '0 16px',
                    borderRadius: '4px',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.bgHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.bgElevated;
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        color: COLORS.textPrimary,
                        fontWeight: '500',
                      }}
                    >
                      {entry.description || 'Token usage'}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: COLORS.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>{formatDate(entry.timestamp)}</span>
                      <span>•</span>
                      <span>{formatTime(entry.timestamp)}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: COLORS.accent,
                      fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                      marginLeft: '16px',
                    }}
                  >
                    -{entry.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: COLORS.textMuted,
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
              <div style={{ fontSize: '14px', marginBottom: '4px', color: COLORS.textSecondary }}>
                No token usage history yet
              </div>
              <div style={{ fontSize: '12px' }}>
                Your token usage will appear here as you use the app
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TokenHistoryModal;

