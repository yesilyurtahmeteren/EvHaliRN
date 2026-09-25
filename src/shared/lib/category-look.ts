// Bölüm görünümü (HANDOFF §2.2 tablo): ikon zemini / rengi ve ikon.
import type { IconName } from '@/shared/components/icon';
import type { ItemCategory } from '@/shared/schemas';
import type { ColorToken } from '@/shared/theme';

export const categoryLook: Record<
  ItemCategory,
  { bg: ColorToken; fg: ColorToken; icon: IconName }
> = {
  food: { bg: 'honey', fg: 'honeyFg', icon: 'apple' },
  clean: { bg: 'sky', fg: 'skyFg', icon: 'sparkle' },
  care: { bg: 'peach', fg: 'peachFg', icon: 'drop' },
  other: { bg: 'well2', fg: 'ink2', icon: 'box' },
};
