import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { vars } from 'nativewind';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';

import { darkColors, lightColors, paletteToCssVars, type Palette } from './colors';
import { useThemeStore } from './theme-store';

export type ResolvedScheme = 'light' | 'dark';

type ThemeContextValue = { scheme: ResolvedScheme; colors: Palette };

const ThemeContext = createContext<ThemeContextValue>({ scheme: 'light', colors: lightColors });

const lightVars = vars(paletteToCssVars(lightColors));
const darkVars = vars(paletteToCssVars(darkColors));

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const scheme: ResolvedScheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.surface,
        card: colors['surface-container-lowest'],
        text: colors['on-surface'],
        border: colors['outline-variant'],
        notification: colors.secondary,
      },
    };
  }, [scheme, colors]);

  const value = useMemo(() => ({ scheme, colors }), [scheme, colors]);

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navigationTheme}>
        <View style={[{ flex: 1 }, scheme === 'dark' ? darkVars : lightVars]}>{children}</View>
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}
