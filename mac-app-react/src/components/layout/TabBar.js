import React, { useState, useRef } from 'react';
import './TabBar.css';
import { useTheme } from '../../contexts/ThemeContext';

function TabBar({ tabs, activeTabId, onTabClick, onTabClose, onNewTab, splitView, splitTabId, onSplitTab }) {
  const { theme } = useTheme();
  const COLORS = theme.colors;
  const [draggedTab, setDraggedTab] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragPreview, setDragPreview] = useState(null);
  const tabBarRef = useRef(null);
  const dragStateRef = useRef({ isDragging: false, tab: null, hasMoved: false });
  const getTabName = (tab) => {
    if (tab.filePath) {
      const fileName = tab.filePath.split(/[/\\]/).pop();
      return fileName.length > 25 ? fileName.substring(0, 22) + '...' : fileName;
    }
    if (tab.projectPath) {
      const projectName = tab.projectPath.split(/[/\\]/).pop();
      return projectName.length > 25 ? projectName.substring(0, 22) + '...' : projectName;
    }
    return 'New Tab';
  };

  const handleMouseDown = (e, tab) => {
    if (tabs.length !== 2) return; // Can only split with exactly 2 tabs
    if (e.target.closest('button')) return; // Don't drag if clicking buttons
    
    const startX = e.clientX;
    const startY = e.clientY;
    const tabElement = e.currentTarget;
    
    dragStateRef.current = { isDragging: false, tab: tab, hasMoved: false };
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = Math.abs(moveEvent.clientX - startX);
      const deltaY = Math.abs(moveEvent.clientY - startY);
      
      // Only start dragging if mouse moved significantly (prevents accidental drags)
      if (deltaX > 5 || deltaY > 5) {
        if (!dragStateRef.current.isDragging) {
          dragStateRef.current.isDragging = true;
          dragStateRef.current.hasMoved = true;
          setDraggedTab(tab);
          const rect = tabElement.getBoundingClientRect();
          setDragPreview({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            tabName: getTabName(tab)
          });
        }
        
        setDragPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
        
        // Detect if dragged to left or right edge (within 250px of edge)
        const windowWidth = window.innerWidth;
        const edgeThreshold = 250;
        const isNearLeftEdge = moveEvent.clientX < edgeThreshold;
        const isNearRightEdge = moveEvent.clientX > windowWidth - edgeThreshold;
        
        if (isNearLeftEdge || isNearRightEdge) {
          document.body.style.cursor = 'col-resize';
        } else {
          document.body.style.cursor = 'grabbing';
        }
      }
    };

    const handleMouseUp = (upEvent) => {
      document.body.style.cursor = 'default';
      
      // Only trigger split if we actually dragged (not just clicked)
      if (dragStateRef.current.hasMoved && dragStateRef.current.tab) {
        const windowWidth = window.innerWidth;
        const edgeThreshold = 250;
        const isNearLeftEdge = upEvent.clientX < edgeThreshold;
        const isNearRightEdge = upEvent.clientX > windowWidth - edgeThreshold;
        
        if ((isNearLeftEdge || isNearRightEdge) && onSplitTab) {
          // Trigger split view with the appropriate side
          const side = isNearLeftEdge ? 'left' : 'right';
          onSplitTab(dragStateRef.current.tab.id, side);
          // Prevent click from firing
          dragStateRef.current.hasMoved = true; // Keep it true to prevent click
        }
      }
      
      setDraggedTab(null);
      setDragPreview(null);
      // Don't reset hasMoved here - let click handler check it first
      dragStateRef.current.isDragging = false;
      dragStateRef.current.tab = null;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Reset hasMoved after click event has had time to fire
      setTimeout(() => {
        dragStateRef.current.hasMoved = false;
      }, 200);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      ref={tabBarRef}
      className="tab-bar" 
      style={{
      backgroundColor: COLORS.bgSurface,
      borderBottom: `1px solid ${COLORS.borderSubtle}`,
      display: 'flex',
      alignItems: 'center',
      overflowX: 'auto',
      overflowY: 'hidden',
      minHeight: '40px',
      paddingLeft: '8px',
      paddingRight: '8px'
    }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
          onMouseDown={(e) => handleMouseDown(e, tab)}
          onClick={(e) => {
            // Only trigger click if we didn't drag
            if (!dragStateRef.current.hasMoved) {
              onTabClick(tab.id);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            marginRight: '4px',
            backgroundColor: tab.id === activeTabId ? COLORS.bgBase : 'transparent',
            borderTop: tab.id === activeTabId ? `2px solid ${COLORS.accent}` : '2px solid transparent',
            borderLeft: `1px solid ${tab.id === activeTabId ? COLORS.borderDefault : 'transparent'}`,
            borderRight: `1px solid ${tab.id === activeTabId ? COLORS.borderDefault : 'transparent'}`,
            cursor: draggedTab?.id === tab.id ? 'grabbing' : (tabs.length === 2 ? 'grab' : 'pointer'),
            WebkitUserSelect: 'none',
            userSelect: 'none',
            position: 'relative',
            minWidth: '120px',
            maxWidth: '250px',
            transition: draggedTab?.id === tab.id ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '8px 8px 0 0',
            opacity: draggedTab?.id === tab.id ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (tab.id !== activeTabId) {
              e.currentTarget.style.backgroundColor = COLORS.bgElevated;
            }
          }}
          onMouseLeave={(e) => {
            if (tab.id !== activeTabId) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span style={{
            fontSize: '12px',
            fontWeight: tab.id === activeTabId ? '500' : '400',
            color: tab.id === activeTabId ? COLORS.textPrimary : COLORS.textSecondary,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0
          }}>
            {getTabName(tab)}
          </span>
          
          {tab.loading && (
            <div style={{
              width: '10px',
              height: '10px',
              border: `2px solid ${COLORS.borderSubtle}`,
              borderTopColor: COLORS.accent,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              flexShrink: 0
            }} />
          )}
          
          {onSplitTab && tabs.length === 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Default to left side when clicking the button
                onSplitTab(tab.id, 'left');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: 'none',
                background: splitView && splitTabId === tab.id ? COLORS.bgElevated : 'transparent',
                color: splitView && splitTabId === tab.id ? COLORS.accent : COLORS.textMuted,
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                if (!(splitView && splitTabId === tab.id)) {
                  e.currentTarget.style.backgroundColor = COLORS.bgHover;
                  e.currentTarget.style.color = COLORS.textPrimary;
                }
              }}
              onMouseLeave={(e) => {
                if (!(splitView && splitTabId === tab.id)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = COLORS.textMuted;
                }
              }}
              title={splitView && splitTabId === tab.id ? 'Unsplit' : 'Split view'}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="1" x2="6" y2="11" />
                <line x1="1" y1="6" x2="11" y2="6" />
                <line x1="2" y1="2" x2="2" y2="10" />
                <line x1="10" y1="2" x2="10" y2="10" />
              </svg>
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              border: 'none',
              background: 'transparent',
              color: COLORS.textMuted,
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.bgHover;
              e.currentTarget.style.color = COLORS.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = COLORS.textMuted;
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="9" y2="9" />
              <line x1="9" y1="3" x2="3" y2="9" />
            </svg>
          </button>
        </div>
      ))}
      
      <button
        onClick={onNewTab}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: `1px solid ${COLORS.borderSubtle}`,
          background: 'transparent',
          color: COLORS.textSecondary,
          cursor: 'pointer',
          marginLeft: '4px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.bgElevated;
          e.currentTarget.style.borderColor = COLORS.borderDefault;
          e.currentTarget.style.color = COLORS.textPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = COLORS.borderSubtle;
          e.currentTarget.style.color = COLORS.textSecondary;
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="7" y1="2" x2="7" y2="12" />
          <line x1="2" y1="7" x2="12" y2="7" />
        </svg>
      </button>
      
      {/* Drag preview overlay */}
      {dragPreview && (
        <div
          style={{
            position: 'fixed',
            left: dragPosition.x - 20,
            top: dragPosition.y - 10,
            backgroundColor: COLORS.bgElevated,
            border: `2px solid ${COLORS.accent}`,
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            color: COLORS.textPrimary,
            pointerEvents: 'none',
            zIndex: 10000,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            opacity: 0.9,
            whiteSpace: 'nowrap'
          }}
        >
          {dragPreview.tabName}
        </div>
      )}
      
      {/* Edge drop zones */}
      {draggedTab && (
        <>
          <div
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: '100px',
              height: '100%',
              backgroundColor: dragPosition.x < 100 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: dragPosition.x < 100 ? `2px dashed ${COLORS.accent}` : 'none',
              pointerEvents: 'none',
              zIndex: 9999,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: COLORS.accent,
              fontWeight: '600'
            }}
          >
            {dragPosition.x < 250 && '← Split'}
          </div>
          <div
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              width: '250px',
              height: '100%',
              backgroundColor: dragPosition.x > window.innerWidth - 250 ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: dragPosition.x > window.innerWidth - 250 ? `2px dashed ${COLORS.accent}` : 'none',
              pointerEvents: 'none',
              zIndex: 9999,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: COLORS.accent,
              fontWeight: '600'
            }}
          >
            {dragPosition.x > window.innerWidth - 250 && 'Split →'}
          </div>
        </>
      )}
    </div>
  );
}

export default TabBar;

