import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import type { CatalogItem } from '@/shared/schemas';

// Flutter widgets/quick_add_bar.dart: en sık 12 ürün, tek dokunuşla ekler.
// Zaten listede olan ürünün çipi soluk ve devre dışı. Katalog boşsa satır yok.
export function QuickAddBar({
  catalogItems,
  neededNames,
  onAdd,
}: {
  catalogItems: readonly CatalogItem[];
  // Listede olan ürünlerin normalize adları (katalog ID'leriyle karşılaştırılır).
  neededNames: ReadonlySet<string>;
  onAdd: (name: string) => void;
}) {
  if (catalogItems.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      className="max-h-touch grow-0"
      contentContainerClassName="items-center gap-sm px-md"
    >
      {catalogItems.map((entry) => {
        const alreadyInList = neededNames.has(entry.id);
        return (
          <Pressable
            key={entry.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: alreadyInList }}
            disabled={alreadyInList}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAdd(entry.name);
            }}
            className={`min-h-[36px] justify-center rounded-full bg-surface-container-lowest px-md ${
              alreadyInList ? 'opacity-40' : 'active:opacity-70'
            }`}
          >
            <AppText variant="label-lg">{entry.name}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
