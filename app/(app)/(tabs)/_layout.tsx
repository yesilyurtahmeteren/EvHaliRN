import { BlurTargetView } from 'expo-blur';
import { Tabs } from 'expo-router/js-tabs';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useHomeEvents } from '@/features/notifications/events';
import { ShellHeader } from '@/features/shell/components/shell-header';
import { ShellTabBar, type ShellTab } from '@/features/shell/components/shell-tab-bar';
import { SheetHost } from '@/features/shell/components/sheet-host';
import { useRequiredHomeId } from '@/shared/hooks/home-id';

const shellTabs: readonly string[] = ['home', 'index', 'profile'];

// Uygulama kabuğu (HANDOFF §1): üstte sabit başlık, ortada ekran, altta
// gezinme. Bildirimler çandan açılan dördüncü ekran; gezinmede sekmesi yok,
// tekrar çana ya da "Geri"ye basınca önceki ekrana dönülür (history).
// İhtiyaç Ekle ve üye alt sayfaları kabuğun üstünde açılır; arka plan
// BlurTargetView sayesinde bulanıklaşır.
export default function TabsLayout() {
  const { t } = useTranslation();
  const homeId = useRequiredHomeId();
  const { unread } = useHomeEvents(homeId);
  const blurTarget = useRef<View>(null);

  return (
    <View style={{ flex: 1 }}>
      <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
        <Tabs
          initialRouteName="index"
          backBehavior="history"
          tabBar={({ state, navigation }) => {
            const current = state.routes[state.index]?.name ?? 'index';
            return (
              <ShellTabBar
                active={shellTabs.includes(current) ? (current as ShellTab) : null}
                onNavigate={(tab) => {
                  if (tab !== current) {
                    navigation.navigate(tab);
                  }
                }}
              />
            );
          }}
          screenOptions={{
            sceneStyle: { backgroundColor: 'transparent' },
            header: ({ options, route, navigation }) => {
              const onNotifications = route.name === 'notifications';
              return (
                <ShellHeader
                  title={options.title ?? route.name}
                  unreadCount={unread.length}
                  notificationsOpen={onNotifications}
                  onNotifications={() =>
                    onNotifications ? navigation.goBack() : navigation.navigate('notifications')
                  }
                  onProfile={() => navigation.navigate('profile')}
                />
              );
            },
          }}
        >
          <Tabs.Screen name="home" options={{ title: t('shell.titles.home') }} />
          <Tabs.Screen name="index" options={{ title: t('shell.titles.list') }} />
          <Tabs.Screen name="profile" options={{ title: t('shell.titles.profile') }} />
          <Tabs.Screen
            name="notifications"
            options={{ title: t('shell.titles.notifications'), href: null }}
          />
        </Tabs>
      </BlurTargetView>
      <SheetHost blurTarget={blurTarget} />
    </View>
  );
}
