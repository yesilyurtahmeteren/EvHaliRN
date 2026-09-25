import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';

import { fixedColors } from '@/shared/theme';
import type { ColorValue } from '@/shared/theme/use-theme-color';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';
import { PressScale } from './press-scale';
import { Spinner } from './spinner';

export type ButtonVariant = 'primary' | 'outline' | 'well' | 'danger' | 'mint';

const look: Record<ButtonVariant, { bg: ColorValue; fg: ColorValue; border?: ColorValue }> = {
  // "İhtiyaç Ekle", "Listeye Ekle", "Gönder"
  primary: { bg: 'btn', fg: fixedColors.onBtn },
  // "Kopyala", "Google ile Giriş Yap"
  outline: { bg: 'card', fg: 'ink', border: 'line' },
  // Profil > Hesap satırları, "Kapat"
  well: { bg: 'well', fg: 'ink' },
  danger: { bg: 'dangerBg', fg: 'dangerFg' },
  mint: { bg: 'mint', fg: 'mintFg' },
};

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  icon?: IconName;
  iconStrokeWidth?: number;
  height?: number;
  radius?: number;
  fontSize?: number;
  weight?: 'bold' | 'extrabold';
  loading?: boolean;
  // Birincil düğmenin yeşil gölgesi (Main.dc.html 0 10px 22px -8px).
  raised?: boolean;
  trailing?: ReactNode;
  align?: 'center' | 'start';
  flex?: boolean;
};

// Tasarımdaki yazılı düğmeler. Basınca scale(.96). Yükleniyorken dönen
// halka gösterilir ve tekrar basılamaz.
export function Button({
  label,
  variant = 'primary',
  icon,
  iconStrokeWidth = 2,
  height = 64,
  radius = 20,
  fontSize = 19,
  weight = 'bold',
  loading = false,
  raised = variant === 'primary',
  trailing,
  align = 'center',
  flex = false,
  disabled,
  ...rest
}: ButtonProps) {
  const { bg, fg, border } = look[variant];
  const inactive = disabled === true || loading;

  return (
    <PressScale
      {...rest}
      bg={bg}
      border={border}
      accessibilityRole="button"
      accessibilityLabel={rest.accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={{
        height,
        borderRadius: radius,
        borderWidth: border === undefined ? 0 : 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: align === 'center' ? 10 : 12,
        paddingHorizontal: 16,
        opacity: disabled === true ? 0.5 : 1,
        flex: flex ? 1 : undefined,
        boxShadow: raised ? `0px 10px 22px -8px ${fixedColors.primaryShadow}` : undefined,
      }}
    >
      {loading ? (
        <Spinner size={22} />
      ) : (
        icon !== undefined && (
          <Icon
            name={icon}
            size={fontSize > 18 ? 24 : 20}
            color={fg}
            strokeWidth={iconStrokeWidth}
          />
        )
      )}
      <AppText
        size={fontSize}
        weight={weight}
        tone={fg}
        numberOfLines={1}
        style={align === 'start' ? { flex: 1 } : undefined}
      >
        {label}
      </AppText>
      {trailing}
    </PressScale>
  );
}
