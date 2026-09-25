import { Image } from 'expo-image';

import { memberColorsFor } from '@/shared/theme';

import { AppText } from './app-text';
import { Box } from './box';

// Profil fotoğrafı; yoksa üyeye özgü pastel zeminde adın baş harfi
// (Main.dc.html "Aile Bireyleri": 20/800 harf). ring: fotoğraf çevresinde
// kenarlık (başlıkta 2 px `card`, Profil'de 4 px `well`).
export function Avatar({
  uid,
  name,
  photoUrl,
  size,
  ring,
}: {
  uid: string;
  name: string;
  photoUrl: string | null;
  size: number;
  ring?: { width: number; color: 'card' | 'well' };
}) {
  if (photoUrl !== null && photoUrl.length > 0) {
    const image = (
      <Image
        source={{ uri: photoUrl }}
        accessible={false}
        contentFit="cover"
        style={{
          width: ring === undefined ? size : size - ring.width * 2,
          height: ring === undefined ? size : size - ring.width * 2,
          borderRadius: size / 2,
        }}
      />
    );
    if (ring === undefined) {
      return image;
    }
    return (
      <Box
        border={ring.color}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: ring.width }}
      >
        {image}
      </Box>
    );
  }

  // Baş harf: birleşik karakterleri bölmemek için kod noktası bazında.
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase('tr') ?? '?';
  const [bg, fg] = memberColorsFor(uid);
  return (
    <Box
      bg={bg}
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText size={Math.round(size * 0.385)} weight="extrabold" tone={fg}>
        {initial}
      </AppText>
    </Box>
  );
}
