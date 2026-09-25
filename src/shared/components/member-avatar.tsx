import { Image } from 'expo-image';
import { View } from 'react-native';

import { memberColorFor, memberOnColorFor } from '@/shared/theme';
import { useAppTheme } from '@/shared/theme/theme-provider';

import { AppText } from './app-text';

// Flutter'daki üye CircleAvatar'ı: fotoğraf yoksa üyeye özgü pastel renk
// üzerinde adın baş harfi (Ev sekmesi üye listesi, ürün satırları).
export function MemberAvatar({
  uid,
  displayName,
  photoUrl,
  size,
}: {
  uid: string;
  displayName: string;
  photoUrl: string | null;
  size: number;
}) {
  const { scheme } = useAppTheme();

  if (photoUrl !== null && photoUrl.length > 0) {
    return (
      <Image
        source={{ uri: photoUrl }}
        accessible={false}
        contentFit="cover"
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  // Baş harf: birleşik karakterleri bölmemek için kod noktası bazında.
  const initial = Array.from(displayName.trim())[0]?.toLocaleUpperCase('tr') ?? '?';
  return (
    <View
      accessible={false}
      className="items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: memberColorFor(uid, scheme),
      }}
    >
      <AppText
        variant="title-md"
        style={{ color: memberOnColorFor(scheme), fontSize: size * 0.4, lineHeight: size * 0.5 }}
      >
        {initial}
      </AppText>
    </View>
  );
}
