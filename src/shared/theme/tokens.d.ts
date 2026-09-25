export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

export const spacing: Record<
  'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'section' | 'screen' | 'touch',
  number
>;
export const radii: Record<'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'sheet' | 'full', number>;
export const fontFamilies: Record<FontWeightName, string>;
export const sizes: Record<
  | 'headerHeight'
  | 'bottomNavHeight'
  | 'fab'
  | 'touchMin'
  | 'primaryButton'
  | 'listRowMin'
  | 'checkbox'
  | 'contentBottom',
  number
>;
