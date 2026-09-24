import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { fontFamilies } from '@/shared/theme';
import { useAppTheme } from '@/shared/theme/theme-provider';

// Faz 2: varsayılan sekme çubuğu. Figma'daki ortada taşan sepet düğmeli
// özel çubuk + üst çubuk (logo/avatar) Faz 4 "shell" adımında gelecek.
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors['on-surface-variant'],
        tabBarStyle: { backgroundColor: colors['surface-container-lowest'] },
        tabBarLabelStyle: { fontFamily: fontFamilies.medium },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.shopping'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="shopping-basket" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
