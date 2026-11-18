import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  APP_THEMES,
  AppScheme,
  THEMES,
  ThemeColors,
  ThemeId,
} from '@/constants/Themes';
import type { AppThemeMode, ThemeMode } from '@/types/library';
import { StorageService } from '@/services/storage';

interface ThemeContextType {
  // App-level chrome theme (system | light | dark)
  appThemeMode: AppThemeMode;
  appScheme: AppScheme;
  isDark: boolean;
  theme: ThemeColors;
  themeId: ThemeId | AppScheme;
  setAppThemeMode: (mode: AppThemeMode) => void;

  // Reader-only theme (4 themes + auto)
  readerThemeMode: ThemeMode;
  readerThemeId: ThemeId;
  readerTheme: ThemeColors;
  setReaderThemeMode: (mode: ThemeMode) => void;

  // Backwards-compatible aliases
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  appThemeMode: 'system',
  appScheme: 'light',
  isDark: false,
  theme: APP_THEMES.light,
  themeId: 'light',
  setAppThemeMode: () => {},
  readerThemeMode: 'paper-beige',
  readerThemeId: 'paper-beige',
  readerTheme: THEMES['paper-beige'],
  setReaderThemeMode: () => {},
  themeMode: 'paper-beige',
  setThemeMode: () => {},
  setThemeId: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [appThemeMode, setAppThemeModeState] = useState<AppThemeMode>('system');
  const [readerThemeMode, setReaderThemeModeState] = useState<ThemeMode>('paper-beige');

  useEffect(() => {
    StorageService.getAppThemeMode().then((saved) => {
      setAppThemeModeState(saved);
    });
    StorageService.getThemeMode().then((saved) => {
      setReaderThemeModeState(saved);
    });
  }, []);

  const setAppThemeMode = (mode: AppThemeMode) => {
    setAppThemeModeState(mode);
    StorageService.saveAppThemeMode(mode);
  };

  const setReaderThemeMode = (mode: ThemeMode) => {
    setReaderThemeModeState(mode);
    StorageService.saveThemeMode(mode);
  };

  const setThemeId = (newTheme: ThemeId) => {
    setReaderThemeMode(newTheme);
  };

  const appScheme: AppScheme =
    appThemeMode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : appThemeMode;

  const appTheme = APP_THEMES[appScheme];

  const resolvedReaderThemeId: ThemeId =
    readerThemeMode === 'auto'
      ? appScheme === 'dark'
        ? 'deep-forest'
        : 'paper-beige'
      : readerThemeMode;

  const readerTheme = THEMES[resolvedReaderThemeId];

  return (
    <ThemeContext.Provider
      value={{
        appThemeMode,
        appScheme,
        isDark: appScheme === 'dark',
        theme: appTheme,
        themeId: appScheme,
        setAppThemeMode,
        readerThemeMode,
        readerThemeId: resolvedReaderThemeId,
        readerTheme,
        setReaderThemeMode,
        themeMode: readerThemeMode,
        setThemeMode: setReaderThemeMode,
        setThemeId,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function usePathshalaTheme() {
  return useContext(ThemeContext);
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  return {
    appThemeMode: ctx.appThemeMode,
    appScheme: ctx.appScheme,
    isDark: ctx.isDark,
    theme: ctx.theme,
    setAppThemeMode: ctx.setAppThemeMode,
  };
}

export function useReaderTheme() {
  const ctx = useContext(ThemeContext);
  return {
    theme: ctx.readerTheme,
    themeId: ctx.readerThemeId,
    themeMode: ctx.readerThemeMode,
    setThemeMode: ctx.setReaderThemeMode,
    setThemeId: ctx.setThemeId,
    isDark: ctx.readerThemeId === 'deep-forest',
  };
}
