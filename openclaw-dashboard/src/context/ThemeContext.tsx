import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemeConfig, FontConfig, BentoConfig } from '../types';

interface ThemeContextType {
  theme: ThemeConfig;
  font: FontConfig;
  bento: BentoConfig;
  isDark: boolean;
  toggleTheme: () => void;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  updateFont: (updates: Partial<FontConfig>) => void;
  updateBento: (updates: Partial<BentoConfig>) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

function applyThemeToDOM(theme: ThemeConfig, font: FontConfig, bento: BentoConfig) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty('--color-primary', c.primary);
  root.style.setProperty('--color-primary-light', c.primaryLight);
  root.style.setProperty('--color-primary-lighter', c.primaryLighter);
  root.style.setProperty('--color-accent', c.accent);
  root.style.setProperty('--color-bg', c.background);
  root.style.setProperty('--color-card-bg', c.cardBackground);
  root.style.setProperty('--color-text', c.text);
  root.style.setProperty('--color-text-secondary', c.textSecondary);
  root.style.setProperty('--color-border', c.border);
  root.style.setProperty('--color-header-bg', c.headerBackground);
  root.style.setProperty('--font-family', font.family);
  root.style.setProperty('--font-mono', font.monoFamily);
  root.style.setProperty('--font-title-size', font.titleSize);
  root.style.setProperty('--font-body-size', font.bodySize);
  root.style.setProperty('--bento-gap', `${bento.gap}px`);
  root.style.setProperty('--bento-padding', `${bento.padding}px`);
  root.style.setProperty('--bento-radius', `${bento.borderRadius}px`);
}

interface Props {
  lightTheme: ThemeConfig;
  darkTheme: ThemeConfig;
  font: FontConfig;
  bento: BentoConfig;
  children: React.ReactNode;
}

export function ThemeProvider({ lightTheme, darkTheme, font: initialFont, bento: initialBento, children }: Props) {
  const [isDark, setIsDark] = useState(false);
  const [light, setLight] = useState(lightTheme);
  const [dark, setDark] = useState(darkTheme);
  const [font, setFont] = useState(initialFont);
  const [bento, setBento] = useState(initialBento);

  const theme = isDark ? dark : light;

  useEffect(() => {
    applyThemeToDOM(theme, font, bento);
  }, [theme, font, bento]);

  const toggleTheme = useCallback(() => setIsDark(v => !v), []);

  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    if (isDark) {
      setDark(prev => ({ ...prev, ...updates }));
    } else {
      setLight(prev => ({ ...prev, ...updates }));
    }
  }, [isDark]);

  const updateFont = useCallback((updates: Partial<FontConfig>) => {
    setFont(prev => ({ ...prev, ...updates }));
  }, []);

  const updateBento = useCallback((updates: Partial<BentoConfig>) => {
    setBento(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, font, bento, isDark, toggleTheme, updateTheme, updateFont, updateBento }}>
      {children}
    </ThemeContext.Provider>
  );
}
