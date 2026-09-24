import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/shared/components/placeholder-screen';

export default function ItemFormScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('screens.itemForm')} />;
}
