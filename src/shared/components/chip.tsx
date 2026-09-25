import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, type PressableProps } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';

import { AppText } from './app-text';

// Flutter ChoiceChip + theme.dart chipTheme: kenarlıksız pil; seçiliyken
// primary zemin, on-primary metin ve aynı renkte tik (Flutter'da tik rengi
// sonradan kullanıcı geri bildirimiyle metinle eşitlenmişti).
export function Chip({
  label,
  selected,
  className,
  ...rest
}: Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  selected: boolean;
  className?: string;
}) {
  const { colors } = useAppTheme();
  const tone = selected ? 'on-primary' : 'on-surface';

  return (
    <Pressable
      {...rest}
      accessibilityRole="radio"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ checked: selected }}
      className={`min-h-[40px] flex-row items-center gap-xs rounded-full px-md ${
        selected ? 'bg-primary' : 'bg-surface-container-high'
      } active:opacity-80 ${className ?? ''}`}
    >
      {selected && <MaterialIcons name="check" size={18} color={colors[tone]} />}
      <AppText variant="label-lg" tone={tone}>
        {label}
      </AppText>
    </Pressable>
  );
}
