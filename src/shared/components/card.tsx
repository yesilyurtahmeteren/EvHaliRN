import type { BoxProps } from './box';
import { Box } from './box';
import { useAppTheme } from '@/shared/theme/theme-provider';

// Main.dc.html kartları: `card` zemin, yumuşak marka tonlu gölge.
//   card: 0 6px 24px -6px {shadow}   (büyük kartlar, radius 28/24)
//   row:  0 4px 18px -6px {shadow}   (liste satırları, radius 20)
// Gölge rengi temayla değişir ama akmaz (RN boxShadow canlandırılamıyor);
// 800 ms'lik geçişte yalnızca zemin ve yazı akar.
export function useShadow(kind: 'card' | 'row' = 'card'): string {
  const { colors } = useAppTheme();
  return kind === 'card'
    ? `0px 6px 24px -6px ${colors.shadow}`
    : `0px 4px 18px -6px ${colors.shadow}`;
}

export function Card({
  shadow = 'card',
  bg = 'card',
  style,
  ...rest
}: BoxProps & { shadow?: 'card' | 'row' | 'none' }) {
  const card = useShadow('card');
  const row = useShadow('row');
  const boxShadow = shadow === 'none' ? undefined : shadow === 'card' ? card : row;
  return <Box {...rest} bg={bg} style={[{ boxShadow }, style]} />;
}
