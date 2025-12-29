import React from 'react';
import './Header.css';
import { useTheme } from '../../contexts/ThemeContext';

function Header({ onSettingsClick, user, onLogout, tokenUsage, onResetTokens, availableTokens, isAdmin, onShowTokenHistory }) {
  const { theme } = useTheme();
  const COLORS = theme.colors;
  
  return (
    <header className="app-header" style={{
      backgroundColor: COLORS.bgSurface,
      transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
      paddingLeft: '78px', // Space for macOS traffic light buttons (aligned with dots)
      paddingRight: '24px',
      paddingTop: '0',
      paddingBottom: '0',
      height: '52px',
      borderBottom: `1px solid ${COLORS.borderSubtle}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      WebkitAppRegion: 'drag',
      flexShrink: 0
    }}>
      {/* Left section - Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{
          fontSize: '15px',
          fontWeight: '600',
          color: COLORS.textPrimary,
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          lineHeight: '1'
        }}>
          Loom
        </div>

        {/* Separator */}
        <div style={{
          width: '1px',
          height: '20px',
          backgroundColor: COLORS.borderDefault
        }} />

        {/* User info */}
        {user && (
          <div style={{
            fontSize: '12px',
            color: COLORS.textMuted,
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
              transition: 'background-color 0.3s ease'
            }} />
            {user.name || user.email || 'Signed in'}
          </div>
        )}
      </div>

      {/* Right section - Actions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        WebkitAppRegion: 'no-drag'
      }}>
        {/* Token usage / Available tokens */}
        {(!isAdmin && availableTokens !== null) ? (
          <div style={{
            fontSize: '11px',
            color: COLORS.textMuted,
            padding: '5px 10px',
            backgroundColor: COLORS.bgHover,
            borderRadius: '6px',
            fontWeight: '500',
            fontFamily: '"SF Mono", "JetBrains Mono", monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: `1px solid ${COLORS.borderSubtle}`
          }}>
            <span style={{ color: COLORS.accent }}>
              {availableTokens.toLocaleString()}
            </span>
            <span>available</span>
          </div>
        ) : tokenUsage && typeof tokenUsage.totalUsed === 'number' ? (
          <div style={{
            fontSize: '11px',
            color: COLORS.textMuted,
            padding: '5px 10px',
            backgroundColor: COLORS.bgHover,
            borderRadius: '6px',
            fontWeight: '500',
            fontFamily: '"SF Mono", "JetBrains Mono", monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: `1px solid ${COLORS.borderSubtle}`
          }}>
            <span style={{ color: COLORS.accent }}>
              {(tokenUsage.totalUsed || 0).toLocaleString()}
            </span>
            <span>tokens used</span>
            {onShowTokenHistory && (
              <button
                onClick={onShowTokenHistory}
                className="history-btn"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: COLORS.textMuted,
                  fontSize: '14px',
                  padding: '2px 6px',
                  marginLeft: '4px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = COLORS.bgHover;
                  e.target.style.color = COLORS.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = COLORS.textMuted;
                }}
                title="View token usage history"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            )}
          </div>
        ) : null}

        {/* Settings button */}
        <button
          onClick={onSettingsClick}
          className="header-btn"
          style={{
            backgroundColor: 'transparent',
            border: `1px solid ${COLORS.borderDefault}`,
            color: COLORS.textSecondary,
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </button>

        {/* Logout button */}
        {user && (
          <button
            onClick={onLogout}
            className="header-btn"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${COLORS.borderDefault}`,
              color: COLORS.textMuted,
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.15s ease'
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
