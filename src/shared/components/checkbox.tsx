import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, View } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';

// DESIGN.md "custom circular organic toggles" (Flutter checkboxTheme:
// CircleBorder, outline-variant 2px kenar). Dokunma alanı 48, görünen daire 28.
export function Checkbox({
  checked,
  onPress,
  accessibilityLabel,
}: {
  checked: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      onPress={onPress}
      hitSlop={10}
      className="h-touch w-touch items-center justify-center"
    >
      <View
        className="h-[28px] w-[28px] items-center justify-center rounded-full"
        style={{
          borderWidth: 2,
          borderColor: checked ? colors.primary : colors['outline-variant'],
          backgroundColor: checked ? colors.primary : 'transparent',
        }}
      >
        {checked && <MaterialIcons name="check" size={18} color={colors['on-primary']} />}
      </View>
    </Pressable>
  );
}
