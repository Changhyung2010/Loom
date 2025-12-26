import React from 'react';
import './FileSelector.css';
import { useTheme } from '../../contexts/ThemeContext';

function FileSelector({ selectedFile, selectedProject, githubUrl, onSelectFile, onSelectProject, onGithubUrlChange, onExplain, onCancel, loading, disabled, disabledReason }) {
  const { theme } = useTheme();
  const COLORS = theme.colors;
  const fileName = selectedFile ? selectedFile.split('/').pop() : null;
  const filePath = selectedFile ? selectedFile.replace(/\/[^/]+$/, '') : null;
  const projectName = selectedProject ? selectedProject.split('/').pop() : null;

  return (
    <div className="file-selector" style={{
      marginBottom: '24px',
      animation: 'fadeIn 0.3s ease'
    }}>
      {/* Section label */}
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {githubUrl && (!selectedFile && !selectedProject) 
          ? 'GitHub Repository (Optional: Select File or Project)' 
          : 'Select File, Project, or GitHub Repository'}
      </div>
      
      {/* File selector container */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'stretch'
      }}>
        {/* File display */}
        <div 
          onClick={onSelectFile}
          className="file-display"
          style={{
            flex: 1,
            backgroundColor: COLORS.bgInput,
            border: `1px solid ${COLORS.borderDefault}`,
            borderRadius: '8px',
            padding: '12px 14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '52px'
          }}
        >
          {selectedProject ? (
            <>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: COLORS.textPrimary,
                fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: COLORS.accent, flexShrink: 0 }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                📁 {projectName || 'Project'}
              </div>
              <div style={{
                fontSize: '11px',
                color: COLORS.textMuted,
                marginTop: '4px',
                fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {selectedProject}
              </div>
            </>
          ) : fileName ? (
            <>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: COLORS.textPrimary,
                fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: COLORS.accent, flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                {fileName}
              </div>
              {filePath && (
                <div style={{
                  fontSize: '11px',
                  color: COLORS.textMuted,
                  marginTop: '4px',
                  fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {filePath}
                </div>
              )}
            </>
          ) : (
            <div style={{
              fontSize: '13px',
              color: COLORS.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {githubUrl ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                  GitHub Repository Mode
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  Click to select a file...
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Browse file button */}
        <button
          onClick={onSelectFile}
          className="browse-btn"
          style={{
            backgroundColor: COLORS.bgInput,
            border: `1px solid ${COLORS.borderDefault}`,
            borderRadius: '8px',
            padding: '12px 16px',
            color: COLORS.textSecondary,
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Select a file"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          File
        </button>
        
        {/* Browse folder button */}
        <button
          onClick={onSelectProject}
          className="browse-btn"
          style={{
            backgroundColor: COLORS.bgInput,
            border: `1px solid ${COLORS.borderDefault}`,
            borderRadius: '8px',
            padding: '12px 16px',
            color: COLORS.textSecondary,
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Select a project folder"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Project
        </button>
      </div>

      {/* GitHub URL input */}
      <div style={{ marginTop: '16px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '600',
          color: COLORS.textMuted,
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {selectedFile || selectedProject ? 'GitHub Repository (Optional)' : 'GitHub Repository'}
        </div>
        <input
          type="text"
          value={githubUrl || ''}
          onChange={(e) => onGithubUrlChange(e.target.value)}
          placeholder="https://github.com/owner/repo"
          style={{
            width: '100%',
            backgroundColor: COLORS.bgInput,
            border: `1px solid ${COLORS.borderDefault}`,
            borderRadius: '8px',
            padding: '12px 14px',
            color: COLORS.textPrimary,
            fontSize: '13px',
            fontFamily: '"SF Mono", "JetBrains Mono", monospace',
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = COLORS.accent;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = COLORS.borderDefault;
          }}
        />
        <div style={{
          marginTop: '6px',
          fontSize: '11px',
          color: COLORS.textMuted
        }}>
          {selectedFile || selectedProject 
            ? 'Used for GitHub origins analysis. Leave empty if not available.'
            : 'Enter a GitHub repository URL to view repository analysis and origins.'}
        </div>
      </div>

      {/* Explain button or Cancel button */}
      {loading && onCancel ? (
        <button
          onClick={onCancel}
          style={{
            marginTop: '16px',
            width: '100%',
            backgroundColor: COLORS.errorBg || 'rgba(255, 107, 107, 0.1)',
            border: `1px solid ${COLORS.errorBorder || 'rgba(255, 107, 107, 0.3)'}`,
            borderRadius: '8px',
            padding: '14px 20px',
            color: COLORS.errorText || '#ff6b6b',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = COLORS.errorBg || 'rgba(255, 107, 107, 0.2)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = COLORS.errorBg || 'rgba(255, 107, 107, 0.1)';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          <span>✕</span>
          Cancel Analysis
        </button>
      ) : (
        <button
          onClick={onExplain}
          disabled={disabled}
          className={`explain-btn ${disabled ? 'disabled' : ''}`}
          style={{
            marginTop: '16px',
            width: '100%',
            backgroundColor: disabled ? COLORS.bgInput : COLORS.accent,
            border: 'none',
            borderRadius: '8px',
            padding: '14px 20px',
            color: disabled ? COLORS.textMuted : '#000000',
            fontSize: '13px',
            fontWeight: '600',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: disabled ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {(!selectedFile && !selectedProject && githubUrl) ? 'Analyze GitHub Repository' : 'Explain Code'}
        </button>
      )}

      {/* Disabled reason / Helper text */}
      {disabled && disabledReason ? (
        <div style={{
          marginTop: '12px',
          fontSize: '11px',
          color: '#ff6b6b',
          textAlign: 'center',
          padding: '8px 12px',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '6px',
          border: `1px solid rgba(255, 107, 107, 0.2)`
        }}>
          {disabledReason}
        </div>
      ) : !selectedFile && !selectedProject && !githubUrl ? (
        <div style={{
          marginTop: '12px',
          fontSize: '11px',
          color: COLORS.textMuted,
          textAlign: 'center'
        }}>
          Select a code file, project folder, or enter a GitHub repository URL
        </div>
      ) : !selectedFile && !selectedProject && githubUrl ? (
        <div style={{
          marginTop: '12px',
          fontSize: '11px',
          color: COLORS.textMuted,
          textAlign: 'center'
        }}>
          GitHub repository detected. Switch to "Origins" tab to view repository analysis.
        </div>
      ) : null}
    </div>
  );
}

export default FileSelector;
