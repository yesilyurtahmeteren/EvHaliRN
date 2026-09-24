export type FontWeightName = 'regular' | 'medium' | 'semibold' | 'bold';
export type TypeRole =
  | 'display-lg'
  | 'display-md'
  | 'display-sm'
  | 'headline-lg'
  | 'headline-md'
  | 'headline-sm'
  | 'title-lg'
  | 'title-md'
  | 'title-sm'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'label-lg'
  | 'label-md'
  | 'label-sm';

export const spacing: Record<
  'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'screen' | 'touch' | 'row',
  number
>;
export const radii: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full', number>;
export const fontFamilies: Record<FontWeightName, string>;
export const typeScale: Record<TypeRole, [number, number, number, FontWeightName]>;
