import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceholderScreen } from '@/shared/components/placeholder-screen';

export default function CreateHomeScreen() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <PlaceholderScreen title={t('screens.createHome')} />
    </SafeAreaView>
  );
}
