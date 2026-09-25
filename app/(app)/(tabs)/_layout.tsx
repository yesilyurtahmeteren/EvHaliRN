import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { ShellHeader } from '@/features/shell/components/shell-header';
import { ShellTabBar } from '@/features/shell/components/shell-tab-bar';

// Flutter MainShell: tek kalıcı kabuk, üç sekme. Alışveriş listesi
// uygulamanın kalbi, varsayılan sekme. Ziyaret edilen sekmeler bağlı kalır
// (Flutter IndexedStack gibi, sekme durumu korunur).
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <ShellTabBar {...props} />}
      screenOptions={{
        header: ({ options, route, navigation }) => (
          <ShellHeader
            title={options.title ?? route.name}
            profileSelected={route.name === 'profile'}
            onAvatarPress={() => navigation.navigate('profile')}
          />
        ),
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('nav.home') }} />
      <Tabs.Screen name="index" options={{ title: t('nav.shopping') }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile') }} />
    </Tabs>
  );
}
