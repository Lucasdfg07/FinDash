'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type DarkMode = 'light' | 'dark' | 'system';

interface DarkModeContextType {
  isDark: boolean;
  mode: DarkMode;
  toggle: () => void;
  setMode: (mode: DarkMode) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

const getInitialDarkMode = (): [boolean, DarkMode] => {
  if (typeof window === 'undefined') return [false, 'system'];

  const savedMode = (localStorage.getItem('darkMode') || 'system') as DarkMode;
  let shouldBeDark = false;

  if (savedMode === 'system') {
    shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    shouldBeDark = savedMode === 'dark';
  }

  return [shouldBeDark, savedMode];
};

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => getInitialDarkMode()[0]);
  const [mode, setMode] = useState<DarkMode>(() => getInitialDarkMode()[1]);
  const initRef = useRef(false);

  // Initialize theme application and listen to system preference changes
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const updateDarkMode = () => {
      const isDarkMode = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkMode);
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    };

    // Apply initial theme
    updateDarkMode();

    // Listen to system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateDarkMode);
    return () => mediaQuery.removeEventListener('change', updateDarkMode);
  }, [mode]);

  const toggle = () => {
    const newMode: DarkMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    setMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const handleSetMode = (newMode: DarkMode) => {
    setMode(newMode);
    localStorage.setItem('darkMode', newMode);

    let shouldBeDark = false;
    if (newMode === 'system') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      shouldBeDark = newMode === 'dark';
    }

    setIsDark(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  };

  return (
    <DarkModeContext.Provider value={{ isDark, mode, toggle, setMode: handleSetMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within DarkModeProvider');
  }
  return context;
}
