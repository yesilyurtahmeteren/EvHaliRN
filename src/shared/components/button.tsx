import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';

import { AppText } from './app-text';
import { LoadingBar } from './loading-bar';

export type ButtonVariant = 'filled' | 'secondary' | 'text';
type IconName = ComponentProps<typeof MaterialIcons>['name'];

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  icon?: IconName;
  // Flutter'daki desen: işlem sürerken buton yerine LoadingBar gösterilir,
  // böylece çift dokunma da engellenir.
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
};

// Flutter theme.dart buton temaları (DESIGN.md "Pill"):
// filled    -> FilledButton: primary zemin, 52 yükseklik
// secondary -> OutlinedButton: kenarlıksız soluk zemin (surface-container-high)
// text      -> TextButton: zeminsiz, primary metin
const containerClass: Record<ButtonVariant, string> = {
  filled: 'min-h-[52px] bg-primary px-lg',
  secondary: 'min-h-[52px] bg-surface-container-high px-lg',
  text: 'min-h-touch px-md',
};

const toneFor = { filled: 'on-primary', secondary: 'on-surface', text: 'primary' } as const;

export function Button({
  label,
  variant = 'filled',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const { colors } = useAppTheme();

  if (loading) {
    return (
      <View
        className={`justify-center ${variant === 'text' ? 'min-h-touch' : 'min-h-[52px]'} ${
          fullWidth ? 'self-stretch' : ''
        } ${className ?? ''}`}
      >
        <LoadingBar width={fullWidth ? undefined : 160} />
      </View>
    );
  }

  const tone = toneFor[variant];
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      // İkon glifi de bir Text olduğu için ad yalnızca etiketten gelsin.
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled === true }}
      disabled={disabled}
      className={`flex-row items-center justify-center gap-sm rounded-full ${containerClass[variant]} ${
        fullWidth ? 'self-stretch' : 'self-start'
      } ${disabled === true ? 'opacity-40' : 'active:opacity-80'} ${className ?? ''}`}
    >
      {icon !== undefined && <MaterialIcons name={icon} size={20} color={colors[tone]} />}
      <AppText variant="label-lg" tone={tone}>
        {label}
      </AppText>
    </Pressable>
  );
}
