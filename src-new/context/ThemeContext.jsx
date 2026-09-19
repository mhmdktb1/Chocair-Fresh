import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Theme locked to Light Mode & Language locked to English for now
  const theme = 'light';
  const language = 'en';

  useEffect(() => {
    try {
      localStorage.setItem('cf_theme', 'light');
      localStorage.setItem('cf_lang', 'en');
    } catch (e) {
      // ignore
    }

    const root = document.documentElement;
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark-theme');

    root.setAttribute('lang', 'en');
    root.setAttribute('dir', 'ltr');
    root.classList.remove('rtl-mode');
  }, []);

  const toggleTheme = () => {};
  const toggleLanguage = () => {};
  const setTheme = () => {};
  const setLanguage = () => {};

  return (
    <ThemeContext.Provider
      value={{
        theme: 'light',
        setTheme,
        toggleTheme,
        isDark: false,
        language: 'en',
        setLanguage,
        toggleLanguage,
        isRTL: false
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
