import { View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';

// Flutter widgets/soft_card.dart karşılığı (DESIGN.md "Pebble Cards"):
// beyaz zemin, 24 köşe, soğuk siyah yerine adaçayı tonlu yumuşak çift gölge.
export function Card({
  className,
  padded = true,
  style,
  ...rest
}: ViewProps & { className?: string; padded?: boolean }) {
  const { colors } = useAppTheme();

  return (
    <View
      {...rest}
      className={`rounded-lg bg-surface-container-lowest ${padded ? 'p-lg' : ''} ${className ?? ''}`}
      style={[
        {
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 4,
              blurRadius: 20,
              spreadDistance: -2,
              color: withAlpha(colors.primary, 0.06),
            },
            {
              offsetX: 0,
              offsetY: 2,
              blurRadius: 6,
              spreadDistance: -1,
              color: withAlpha(colors['on-surface'], 0.04),
            },
          ],
        },
        style,
      ]}
    />
  );
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
