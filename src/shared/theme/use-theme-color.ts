// Temaya bağlı renkleri tek progress değerinden türeten yardımcılar
// (HANDOFF §3, React Native yolu). Bir bileşen rengi bir token adıyla ya da
// sabit bir renkle ister; token ise aydınlık/koyu arasında interpolateColor
// ile akar, sabit renk olduğu gibi kalır.
import {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';

import { darkColors, lightColors, type ColorToken } from './colors';
import { useAppTheme } from './theme-provider';

// Token adı ya da düz renk ("#ffffff", "rgba(...)", "transparent").
export type ColorValue = ColorToken | (string & {});

export function colorPair(value: ColorValue): readonly [string, string] {
  if (value in lightColors) {
    const token = value as ColorToken;
    return [lightColors[token], darkColors[token]];
  }
  return [value, value];
}

type StyleColorProp =
  'backgroundColor' | 'borderColor' | 'color' | 'borderTopColor' | 'borderBottomColor';

export type ThemedColors = Partial<Record<StyleColorProp, ColorValue | undefined>>;

function toEntries(spec: ThemedColors) {
  return (Object.keys(spec) as StyleColorProp[])
    .filter((prop) => spec[prop] !== undefined)
    .map((prop) => {
      const [light, dark] = colorPair(spec[prop] as ColorValue);
      return { prop, light, dark };
    });
}

// Animated.View / Animated.Text için renk stili.
export function useThemedStyle(spec: ThemedColors) {
  const { progress } = useAppTheme();
  const entries = toEntries(spec);
  const key = entries.map((e) => `${e.prop}:${e.light}:${e.dark}`).join('|');
  return useAnimatedStyle(() => {
    const style: Record<string, string> = {};
    for (const { prop, light, dark } of entries) {
      style[prop] =
        light === dark
          ? light
          : (interpolateColor(progress.value, [0, 1], [light, dark]) as string);
    }
    return style;
  }, [key]);
}

// Tek bir rengin akan değeri (SVG çizgisi, TextInput vb. için).
export function useThemedColor(value: ColorValue) {
  const { progress } = useAppTheme();
  const [light, dark] = colorPair(value);
  return useDerivedValue(
    () =>
      light === dark ? light : (interpolateColor(progress.value, [0, 1], [light, dark]) as string),
    [light, dark],
  );
}

// react-native-svg <G> için stroke/fill animasyonlu özellikleri.
export function useThemedSvgProps(stroke?: ColorValue, fill?: ColorValue) {
  const { progress } = useAppTheme();
  const [sl, sd] = stroke === undefined ? ['', ''] : colorPair(stroke);
  const [fl, fd] = fill === undefined ? ['', ''] : colorPair(fill);
  return useAnimatedProps(() => {
    const props: { stroke?: string; fill?: string } = {};
    if (sl !== '') {
      props.stroke =
        sl === sd ? sl : (interpolateColor(progress.value, [0, 1], [sl, sd]) as string);
    }
    if (fl !== '') {
      props.fill = fl === fd ? fl : (interpolateColor(progress.value, [0, 1], [fl, fd]) as string);
    }
    return props;
  }, [sl, sd, fl, fd]);
}
