import { Image } from 'expo-image';

import logo from '@/assets/images/logo.png';

// Flutter widgets/app_icon_mark.dart karşılığı: gerçek logo ("EvHali Logo 3"),
// giriş ekranında ve üst çubukta. Köşe yuvarlaklığı boyutla orantılı (%22).
export function AppIconMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={logo}
      accessibilityIgnoresInvertColors
      accessible={false}
      contentFit="cover"
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
    />
  );
}
