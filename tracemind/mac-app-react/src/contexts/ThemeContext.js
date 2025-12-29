import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '../styles/theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Function to detect system color scheme preference
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  // Default to dark if we can't detect
  return 'dark';
};

export const ThemeProvider = ({ children }) => {
  // Initialize with system theme as default
  const [themeMode, setThemeMode] = useState(() => getSystemTheme());
  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  useEffect(() => {
    // Load theme from storage first
    if (window.electronAPI && window.electronAPI.getTheme) {
      window.electronAPI.getTheme().then(savedTheme => {
        if (savedTheme) {
          // Use saved theme if it exists
          setThemeMode(savedTheme);
        } else {
          // If no saved theme, use system preference
          const systemTheme = getSystemTheme();
          setThemeMode(systemTheme);
        }
      }).catch(err => {
        console.warn('Failed to load theme from storage:', err);
        // Fall back to system theme if loading fails
        const systemTheme = getSystemTheme();
        setThemeMode(systemTheme);
      });
    } else {
      // If no electron API, use system theme
      const systemTheme = getSystemTheme();
      setThemeMode(systemTheme);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        // Only update if user hasn't manually set a preference
        // Check if there's a saved theme preference
        if (window.electronAPI && window.electronAPI.getTheme) {
          window.electronAPI.getTheme().then(savedTheme => {
            // Only auto-update if no saved preference exists
            if (!savedTheme) {
              const newSystemTheme = e.matches ? 'dark' : 'light';
              setThemeMode(newSystemTheme);
            }
          }).catch(() => {
            // If we can't check saved theme, update based on system
            const newSystemTheme = e.matches ? 'dark' : 'light';
            setThemeMode(newSystemTheme);
          });
        } else {
          // No electron API, so update based on system
          const newSystemTheme = e.matches ? 'dark' : 'light';
          setThemeMode(newSystemTheme);
        }
      };

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } 
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSystemThemeChange);
        return () => mediaQuery.removeListener(handleSystemThemeChange);
      }
    }
  }, []);

  const setTheme = async (mode) => {
    if (mode !== themeMode) {
      setThemeMode(mode);
      if (window.electronAPI && window.electronAPI.saveTheme) {
        await window.electronAPI.saveTheme(mode);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

