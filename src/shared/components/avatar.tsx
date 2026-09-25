import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';

// Flutter CircleAvatar karşılığı: Google profil fotoğrafı, yoksa
// primary-container zemin üzerinde kişi ikonu.
export function Avatar({ photoUrl, size }: { photoUrl: string | null; size: number }) {
  const { colors } = useAppTheme();

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
  return (
    <View
      className="items-center justify-center bg-primary-container"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <MaterialIcons name="person" size={size / 2} color={colors['on-primary-container']} />
    </View>
  );
}
