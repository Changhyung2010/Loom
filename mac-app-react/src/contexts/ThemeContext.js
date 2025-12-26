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

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('dark');
  const theme = themeMode === 'light' ? lightTheme : darkTheme;

  useEffect(() => {
    // Load theme from storage
    if (window.electronAPI && window.electronAPI.getTheme) {
      window.electronAPI.getTheme().then(savedTheme => {
        if (savedTheme) {
          setThemeMode(savedTheme);
        }
      }).catch(err => {
        console.warn('Failed to load theme from storage:', err);
        // Use default dark theme if loading fails
      });
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

