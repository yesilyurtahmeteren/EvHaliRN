// Tasarım handoff'u §4 "Hareket kataloğu" ve tokens.json > motion. Eğriler
// Main.dc.html'deki cubic-bezier değerleriyle birebir; süreler ms.
//
// "Hareketi azalt" açıkken Reanimated'ın varsayılanı (ReduceMotion.System)
// zamanlı animasyonları anında bitirir; sonsuz döngüler (çan, parıltı, yüzen
// daire) ayrıca useReducedMotion ile hiç başlatılmaz.
import {
  Easing,
  withSequence,
  withTiming,
  type EasingFunction,
  type EasingFunctionFactory,
} from 'react-native-reanimated';

type Curve = EasingFunction | EasingFunctionFactory;

export const Ease: Record<
  'spring' | 'softSpring' | 'easeOut' | 'easeIn' | 'fill' | 'knob' | 'ease' | 'easeInOut',
  Curve
> = {
  spring: Easing.bezier(0.34, 1.56, 0.64, 1),
  softSpring: Easing.bezier(0.34, 1.3, 0.64, 1),
  easeOut: Easing.bezier(0.22, 1, 0.36, 1),
  easeIn: Easing.bezier(0.4, 0, 1, 1),
  // İlerleme çubuğu dolgusu ve anahtar topuzu.
  fill: Easing.bezier(0.34, 1.25, 0.64, 1),
  knob: Easing.bezier(0.34, 1.4, 0.64, 1),
  // CSS "ease" ve "ease-in-out".
  ease: Easing.bezier(0.25, 0.1, 0.25, 1),
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
};

export const Durations = {
  theme: 800,
  screenEnter: 420,
  rise: 550,
  stagger: 70,
  pop: 600,
  bump: 500,
  press: 150,
  checkbox: 300,
  tick: 350,
  checkOff: 600,
  progressGrow: 1300,
  progressGrowDelay: 300,
  progressFill: 900,
  sheetOpen: 500,
  sheetClose: 260,
  scrimFade: 300,
  dropdown: 280,
  knob: 450,
  segment: 550,
  bellRing: 3200,
  toast: 2600,
  shake: 450,
  navPill: 300,
  fab: 300,
  chevron: 350,
  flash: 1800,
  textScale: 450,
  copied: 1800,
  statsCount: 900,
  ring: 1400,
  dot: 300,
} as const;

export function timing(target: number, duration: number, easing: Curve = Ease.easeOut) {
  return withTiming(target, { duration, easing });
}

// CSS @keyframes bump: 1 -> 1.28 (%35) -> 1, spring eğrisi her aralığa ayrı.
export function bumpSequence() {
  return withSequence(
    withTiming(1.28, { duration: Durations.bump * 0.35, easing: Ease.spring }),
    withTiming(1, { duration: Durations.bump * 0.65, easing: Ease.spring }),
  );
}
