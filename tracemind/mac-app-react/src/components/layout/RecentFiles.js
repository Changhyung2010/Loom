import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function RecentFiles({ onSelectFile, onSelectProject, onClose }) {
  const { theme } = useTheme();
  const COLORS = theme.colors;
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const loadRecentFiles = async () => {
    if (window.electronAPI && window.electronAPI.getRecentFiles) {
      try {
        const files = await window.electronAPI.getRecentFiles();
        setRecentFiles(files);
      } catch (error) {
        console.error('Error loading recent files:', error);
      }
    }
    setLoading(false);
  };

  const handleSelect = async (item) => {
    if (item.type === 'file' && onSelectFile) {
      await onSelectFile(item.path);
    } else if (item.type === 'project' && onSelectProject) {
      await onSelectProject(item.path);
    }
    if (onClose) onClose();
  };

  const handleClear = async () => {
    if (window.electronAPI && window.electronAPI.clearRecentFiles) {
      await window.electronAPI.clearRecentFiles();
      setRecentFiles([]);
    }
  };

  const formatPath = (path) => {
    const parts = path.split('/');
    if (parts.length <= 2) return path;
    return `.../${parts.slice(-2).join('/')}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: '13px'
      }}>
        Loading...
      </div>
    );
  }

  if (recentFiles.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: COLORS.textMuted
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: COLORS.textSecondary }}>
          No recent files
        </div>
        <div style={{ fontSize: '12px', color: COLORS.textMuted }}>
          Files you analyze will appear here
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '12px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: `1px solid ${COLORS.borderSubtle}`
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: COLORS.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Recent Files
        </div>
        <button
          onClick={handleClear}
          style={{
            background: 'transparent',
            border: 'none',
            color: COLORS.textMuted,
            fontSize: '11px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
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
          Clear
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {recentFiles.map((item, index) => (
          <button
            key={index}
            onClick={() => handleSelect(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: COLORS.bgInput,
              border: `1px solid ${COLORS.borderDefault}`,
              borderRadius: '6px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = COLORS.bgHover;
              e.target.style.borderColor = COLORS.accent;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = COLORS.bgInput;
              e.target.style.borderColor = COLORS.borderDefault;
            }}
          >
            <div style={{
              fontSize: '16px',
              flexShrink: 0
            }}>
              {item.type === 'file' ? '📄' : '📁'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: COLORS.textPrimary,
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {item.path.split('/').pop()}
              </div>
              <div style={{
                fontSize: '11px',
                color: COLORS.textMuted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: '"SF Mono", "JetBrains Mono", monospace'
              }}>
                {formatPath(item.path)}
              </div>
            </div>
            <div style={{
              fontSize: '11px',
              color: COLORS.textMuted,
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}>
              {formatTime(item.timestamp)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default RecentFiles;

