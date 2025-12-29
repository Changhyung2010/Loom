// Loom Design System - Theme Support
export const lightTheme = {
  colors: {
    // Backgrounds - all white with subtle hover
    bgBase: '#ffffff',
    bgSurface: '#ffffff',
    bgElevated: '#ffffff',
    bgHover: '#f5f5f5',
    bgContainer: '#ffffff',
    bgMain: '#ffffff',
    bgInput: '#ffffff',
    
    // Text
    textPrimary: '#1d1d1f',
    textSecondary: '#6e6e73',
    textMuted: '#86868b',
    
    // Accents
    accent: '#007aff',
    accentHover: '#0051d5',
    accentMuted: 'rgba(0, 122, 255, 0.1)',
    
    // Borders - very subtle
    border: 'rgba(0, 0, 0, 0.05)',
    borderSubtle: 'rgba(0, 0, 0, 0.02)',
    borderDefault: 'rgba(0, 0, 0, 0.05)',
    borderStrong: 'rgba(0, 0, 0, 0.1)',
    
    // Code - white background
    codeBg: '#ffffff',
    codeText: '#1d1d1f',
    
    // Errors
    errorBg: '#ffffff',
    errorBorder: '#f44336',
    errorText: '#c62828',
    
    // Special
    error: '#d32f2f',
    purple: '#8e24aa',
    green: '#43a047',
    yellow: '#f57c00',
  },
  
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Consolas", "Monaco", "Courier New", monospace',
  },
  
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '40px',
  },
  
  borderRadius: {
    sm: '5px',
    md: '8px',
    lg: '12px',
  },
  
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.15)',
    lg: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },
};

export const darkTheme = {
  colors: {
    // Backgrounds
    bgBase: '#000000',
    bgSurface: '#0a0a0a',
    bgElevated: '#141414',
    bgHover: '#1a1a1a',
    bgContainer: '#141414',
    bgMain: '#000000',
    bgInput: '#1a1a1a',
    
    // Text
    textPrimary: '#ffffff',
    textSecondary: '#b3b3b3',
    textMuted: '#808080',
    
    // Accents
    accent: '#ffffff',
    accentHover: '#e0e0e0',
    accentMuted: 'rgba(255, 255, 255, 0.1)',
    
    // Borders
    border: 'rgba(255, 255, 255, 0.12)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderDefault: 'rgba(255, 255, 255, 0.12)',
    borderStrong: 'rgba(255, 255, 255, 0.2)',
    
    // Code
    codeBg: '#1a1a1a',
    codeText: '#ce9178',
    
    // Errors
    errorBg: 'rgba(255, 68, 68, 0.1)',
    errorBorder: '#ff4444',
    errorText: '#ff8888',
    
    // Special
    error: '#ffffff',
    purple: '#ffffff',
    green: '#ffffff',
    yellow: '#ffffff',
  },
  
  fonts: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Consolas", "Monaco", "Courier New", monospace',
  },
  
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '40px',
  },
  
  borderRadius: {
    sm: '5px',
    md: '8px',
    lg: '12px',
  },
  
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 40px rgba(0, 0, 0, 0.5)',
  },
};

// Legacy export for backward compatibility
export const theme = darkTheme;
