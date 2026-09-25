import { Image } from 'expo-image';

import logo from '@/assets/images/logo.png';

// Tasarım handoff'undaki logo (assets/logo-512.png, köşeleri yuvarlatılmış).
// radius: başlıkta 38/11, girişte 156/42, boş durumda 76/22.
export function AppIconMark({ size = 38, radius }: { size?: number; radius?: number }) {
  return (
    <Image
      source={logo}
      accessibilityIgnoresInvertColors
      accessible={false}
      contentFit="cover"
      style={{ width: size, height: size, borderRadius: radius ?? size * 0.29 }}
    />
  );
}
