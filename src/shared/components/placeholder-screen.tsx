import { Link, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Faz 2 geçici ekranı: yalnızca başlık ve diğer ekranlara bağlantılar.
// Faz 4'te her feature taşındıkça gerçek ekranla değiştirilir.
const routes: { href: Href; label: string }[] = [
  { href: '/sign-in', label: 'sign-in' },
  { href: '/create-home', label: 'create-home' },
  { href: '/', label: '(tabs)/index · Alışveriş' },
  { href: '/home', label: '(tabs)/home · Ev' },
  { href: '/profile', label: '(tabs)/profile · Profil' },
  { href: '/item-form', label: 'item-form (modal)' },
];

export function PlaceholderScreen({ title }: { title: string }) {
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="p-screen gap-md">
      <Text className="font-bold text-display-lg text-on-surface">{title}</Text>
      <Text className="font-regular text-body-md text-on-surface-variant">
        {t('dev.placeholder')}
      </Text>
      <View className="mt-md gap-sm">
        <Text className="font-semibold text-label-lg text-primary">{t('dev.goTo')}</Text>
        {routes.map((route) => (
          <Link key={route.label} href={route.href} asChild>
            <Pressable
              accessibilityRole="link"
              className="rounded-full bg-surface-container-high px-md py-sm"
            >
              <Text className="font-semibold text-label-lg text-on-surface">{route.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}
