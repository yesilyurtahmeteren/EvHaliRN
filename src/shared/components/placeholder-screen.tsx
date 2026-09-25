import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from './app-text';

// Geçici ekran: başlık ve (oturum açıkken) diğer ekranlara bağlantılar.
// Faz 4'te her feature taşındıkça gerçek ekranla değiştirilir. Faz 3'ten
// beri /sign-in ile (app) korumalı rotalarla ayrıldığı için giriş ekranına
// bağlantı yok; (app)'e ancak giriş yapılarak geçilir.
const routes: { href: Href; label: string }[] = [
  { href: '/create-home', label: 'create-home' },
  { href: '/', label: '(tabs)/index · Alışveriş' },
  { href: '/home', label: '(tabs)/home · Ev' },
  { href: '/profile', label: '(tabs)/profile · Profil' },
  { href: '/item-form', label: 'item-form (modal)' },
];

export function PlaceholderScreen({
  title,
  showLinks = true,
  children,
}: {
  title: string;
  showLinks?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="p-screen gap-md">
      <AppText variant="display-lg">{title}</AppText>
      <AppText variant="body-md" tone="on-surface-variant">
        {t('dev.placeholder')}
      </AppText>
      {children}
      {showLinks && (
        <View className="mt-md gap-sm">
          <AppText variant="label-lg" tone="primary">
            {t('dev.goTo')}
          </AppText>
          {routes.map((route) => (
            <Link key={route.label} href={route.href} asChild>
              <Pressable
                accessibilityRole="link"
                className="rounded-full bg-surface-container-high px-md py-sm"
              >
                <AppText variant="label-lg">{route.label}</AppText>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
