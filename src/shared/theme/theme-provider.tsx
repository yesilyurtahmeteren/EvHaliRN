import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { darkColors, lightColors, type Palette } from './colors';
import { Durations, Ease } from './motion';
import { useTextScaleStore } from './text-scale-store';
import { useThemeStore } from './theme-store';

export type ResolvedScheme = 'light' | 'dark';

type ThemeContextValue = {
  scheme: ResolvedScheme;
  // Hareketsiz yerler için (StatusBar, TextInput imleci, gölge) o anki palet.
  colors: Palette;
  // 0 = aydınlık, 1 = koyu. Renkler buradan interpolateColor ile türetilir.
  progress: SharedValue<number>;
  // Büyük yazı çarpanı (1 ya da 1.14), 450 ms'de akar.
  textScale: SharedValue<number>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useAppTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (value === null) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }
  return value;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const multiplier = useTextScaleStore((s) => s.multiplier);
  const scheme: ResolvedScheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const progress = useSharedValue(scheme === 'dark' ? 1 : 0);
  const textScale = useSharedValue(multiplier);

  useEffect(() => {
    progress.value = withTiming(scheme === 'dark' ? 1 : 0, {
      duration: Durations.theme,
      easing: Ease.ease,
    });
  }, [scheme, progress]);

  useEffect(() => {
    textScale.value = withTiming(multiplier, {
      duration: Durations.textScale,
      easing: Ease.easeOut,
    });
  }, [multiplier, textScale]);

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.brand,
        // Ekran zeminleri saydam: kökteki Animated.View rengi 800 ms'de
        // akarken navigasyon kendi zeminini anında değiştirmesin.
        background: 'transparent',
        card: 'transparent',
        text: colors.ink,
        border: colors.line,
        notification: colors.brand,
      },
    };
  }, [scheme, colors]);

  const value = useMemo(
    () => ({ scheme, colors, progress, textScale }),
    [scheme, colors, progress, textScale],
  );

  const rootStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [lightColors.bg, darkColors.bg]),
  }));

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navigationTheme}>
        <Animated.View style={[{ flex: 1 }, rootStyle]}>{children}</Animated.View>
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}
