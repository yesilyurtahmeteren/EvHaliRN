import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/shared/components/placeholder-screen';

// Faz 4 "shopping-list" adımında gerçek ekranla değişecek.
export default function IndexTabScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('nav.shopping')} />;
}
