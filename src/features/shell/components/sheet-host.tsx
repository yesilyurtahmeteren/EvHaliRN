import type { RefObject } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { View } from 'react-native';

import { ItemSheetContent } from '@/features/item-form/components/item-sheet-content';
import { MemberSheetContent } from '@/features/home-dashboard/components/member-sheet-content';
import { Sheet } from '@/shared/components/sheet';

import { useShellUi } from '../ui-store';

// Kabuğun üstünde açılan alt sayfalar (İhtiyaç Ekle / düzenle, üye rolü).
export function SheetHost({ blurTarget }: { blurTarget: RefObject<View | null> }) {
  const { t } = useTranslation();
  const sheet = useShellUi((s) => s.sheet);
  const closing = useShellUi((s) => s.closing);
  const requestClose = useShellUi((s) => s.requestCloseSheet);
  const closed = useShellUi((s) => s.sheetClosed);
  const onClosed = useCallback(() => closed(), [closed]);

  if (sheet === null) {
    return null;
  }

  return (
    <Sheet
      closing={closing}
      onRequestClose={requestClose}
      onClosed={onClosed}
      blurTarget={blurTarget}
      accessibilityLabel={
        sheet.kind === 'item'
          ? sheet.itemId === null
            ? t('itemForm.addTitle')
            : t('itemForm.editTitle')
          : t('members.roleTitle')
      }
    >
      {sheet.kind === 'item' ? (
        <ItemSheetContent itemId={sheet.itemId} onClose={requestClose} />
      ) : (
        <MemberSheetContent uid={sheet.uid} onClose={requestClose} />
      )}
    </Sheet>
  );
}
