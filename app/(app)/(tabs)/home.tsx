import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/shared/components/placeholder-screen';

// Faz 4 "home-dashboard" adımında gerçek ekranla değişecek.
export default function HomeTabScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('nav.home')} />;
}
