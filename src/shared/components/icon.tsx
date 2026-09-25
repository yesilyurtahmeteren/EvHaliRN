// Main.dc.html'deki SVG ikonlarının birebir yolları (viewBox 24). Çizgi
// rengi (ya da dolgu) temayla akar: <G> üzerinde animatedProps, çocuk
// yollar rengi ondan devralır.
import Animated from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useThemedSvgProps, type ColorValue } from '@/shared/theme/use-theme-color';

const AnimatedG = Animated.createAnimatedComponent(G);

const shapes = {
  plus: <Path d="M12 5v14M5 12h14" />,
  minus: <Path d="M5 12h14" />,
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  check: <Path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevronDown: <Path d="m6 9 6 6 6-6" />,
  chevronRight: <Path d="m9 6 6 6-6 6" />,
  chevronLeft: <Path d="m15 6-6 6 6 6" />,
  // Gıda / Temizlik / Kişisel Bakım / Diğer
  apple: (
    <>
      <Path d="M12 8c-2.2-2.8-7-1.8-7 3 0 5 3.2 10 7 10s7-5 7-10c0-4.8-4.8-5.8-7-3z" />
      <Path d="M12 8c0-2.2 1.2-4 3.5-4.5" />
    </>
  ),
  sparkle: (
    <>
      <Path d="M11 3l1.8 4.2L17 9l-4.2 1.8L11 15l-1.8-4.2L5 9l4.2-1.8z" />
      <Path d="M18 14l.9 2.1 2.1.9-2.1.9L18 20l-.9-2.1-2.1-.9 2.1-.9z" />
    </>
  ),
  drop: <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  box: (
    <>
      <Path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <Path d="M4 8l8 4 8-4M12 12v8" />
    </>
  ),
  circleCheck: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="m8 12.5 2.8 2.8L16 10" />
    </>
  ),
  undo: (
    <>
      <Path d="M9 14 4 9l5-5" />
      <Path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </>
  ),
  bell: (
    <>
      <Path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <Path d="M10 21h4" />
    </>
  ),
  home: (
    <>
      <Path d="M3 10.5 12 3l9 7.5" />
      <Path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </>
  ),
  basket: (
    <>
      <Path d="M5 10h14l-1.4 9.1a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9z" />
      <Path d="M9 10 12 4l3 6" />
      <Path d="M3 10h18" />
      <Path d="M10 14v3M14 14v3" />
    </>
  ),
  person: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  personAdd: (
    <>
      <Circle cx={10} cy={8} r={4} />
      <Path d="M3 21c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" />
      <Path d="M19 8v6M16 11h6" />
    </>
  ),
  people: (
    <>
      <Circle cx={9} cy={8} r={3.5} />
      <Path d="M2.5 20c1-3.3 3.4-5 6.5-5s5.5 1.7 6.5 5" />
      <Path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.3 3.8 5" />
    </>
  ),
  flame: (
    <Path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-1.5 2-2 3.5-2 5-1-1-1.5-2-1.5-3C8 9 6 11.5 6 15a6 6 0 0 0 6 6z" />
  ),
  mic: (
    <>
      <Rect x={9} y={3} width={6} height={11} rx={3} />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  shield: (
    <>
      <Path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z" />
      <Path d="m9 12 2 2 4-4" />
    </>
  ),
  copy: (
    <>
      <Rect x={9} y={9} width={11} height={11} rx={2.5} />
      <Path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </>
  ),
  share: (
    <>
      <Circle cx={18} cy={5} r={2.5} />
      <Circle cx={6} cy={12} r={2.5} />
      <Circle cx={18} cy={19} r={2.5} />
      <Path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
    </>
  ),
  logout: (
    <>
      <Path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <Path d="M10 16l-4-4 4-4M6 12h10" />
    </>
  ),
  warning: (
    <>
      <Path d="M12 3 2 20h20z" />
      <Path d="M12 10v4M12 17h.01" />
    </>
  ),
  sun: (
    <>
      <Circle cx={12} cy={12} r={4.2} />
      <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  bag: (
    <>
      <Path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
      <Path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </>
  ),
  clock: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  // Tasarımda yok; evden ayrılma ve rol düzenleme için aynı çizgi dilinde.
  door: (
    <>
      <Path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8" />
      <Path d="M14 3l5 2v14l-5 2z" />
      <Path d="M11.5 12h.01" />
    </>
  ),
  pencil: (
    <>
      <Path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <Path d="m13.5 6.5 4 4" />
    </>
  ),
  refresh: (
    <>
      <Path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <Path d="M20 4v7h-7" />
    </>
  ),
} as const;

export type IconName = keyof typeof shapes;

// Yalnızca dolgulu çizilen ikonlar (alev).
const filled: ReadonlySet<IconName> = new Set(['flame']);

export function Icon({
  name,
  size = 24,
  color = 'ink',
  strokeWidth = 1.9,
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
}) {
  const isFilled = filled.has(name);
  const animatedProps = useThemedSvgProps(
    isFilled ? undefined : color,
    isFilled ? color : undefined,
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <AnimatedG
        animatedProps={animatedProps}
        fill={isFilled ? undefined : 'none'}
        strokeWidth={isFilled ? 0 : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {shapes[name]}
      </AnimatedG>
    </Svg>
  );
}

// "Google ile Giriş Yap" düğmesindeki çok renkli logo (viewBox 48).
export function GoogleLogo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}
