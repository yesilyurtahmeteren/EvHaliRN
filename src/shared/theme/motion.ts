// Flutter lib/theme/motion.dart (motor paketinin MaterialSpringMotion
// sabitleri) karşılığı. M3 "standard" hareket şeması: sönüm oranı + sertlik.
// Reanimated withSpring sönüm KATSAYISI istediği için oran burada çevriliyor:
// damping = oran * 2 * sqrt(sertlik * kütle).
import type { WithSpringConfig } from 'react-native-reanimated';

function spring(dampingRatio: number, stiffness: number): WithSpringConfig {
  const mass = 1;
  return { mass, stiffness, damping: dampingRatio * 2 * Math.sqrt(stiffness * mass) };
}

export const AppMotion = {
  // Konum/boyut/şekil değişimleri - hafif sekme.
  spatialFast: spring(0.9, 1400),
  spatialDefault: spring(0.9, 700),
  spatialSlow: spring(0.9, 300),
  // Renk/opaklık değişimleri - sekme yok.
  effectsFast: spring(1, 3800),
  effectsDefault: spring(1, 1600),
  effectsSlow: spring(1, 800),

  // K5 bekleme süreleri (animasyon değil, zamanlayıcı): işaretlenen ürün
  // geri alınabilir kalsın diye hemen kaybolmaz.
  beforeFadeOutDelayMs: 250,
  itemFadeOutDurationMs: 200,

  // "Hareketi azalt" açıkken yaylar yerine kısa lineer geçiş.
  reducedMotionDurationMs: 100,
} as const;
