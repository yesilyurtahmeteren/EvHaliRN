import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSignOut } from '@/features/auth/hooks/use-auth-actions';
import { AppIconMark } from '@/shared/components/app-icon-mark';
import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { Icon } from '@/shared/components/icon';
import { Rise } from '@/shared/components/motion';
import { PressScale } from '@/shared/components/press-scale';
import { TextField } from '@/shared/components/text-field';

import { useCreateHome, useJoinHome } from '../hooks/use-home-onboarding';
import { createHomeFormSchema, homeNameMaxLength, joinHomeFormSchema } from '../schemas';

// Paylaşılan biçim "AB7K-9TQX" (9 karakter) yapıştırılabilsin.
const inviteCodeInputMaxLength = 9;

// Evi olmayan kullanıcı: yeni ev kur ya da ev koduyla katıl. Tasarımda bu
// ekran yok; giriş ve Evim ekranlarının kart diliyle yazıldı. Boş alanla
// gönderince alan sallanır.
export function CreateHomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const signOut = useSignOut();
  const createHome = useCreateHome();
  const joinHome = useJoinHome();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [nameShake, setNameShake] = useState(0);
  const [codeShake, setCodeShake] = useState(0);
  const busy = createHome.isPending || joinHome.isPending;

  const submitCreate = () => {
    const parsed = createHomeFormSchema.safeParse({ name });
    if (!parsed.success) {
      setNameShake((k) => k + 1);
      return;
    }
    void createHome.run(parsed.data.name);
  };
  const submitJoin = () => {
    const parsed = joinHomeFormSchema.safeParse({ code });
    if (!parsed.success) {
      setCodeShake((k) => k + 1);
      return;
    }
    void joinHome.run(parsed.data.code);
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 20,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <AppIconMark size={38} radius={11} />
        <AppText size={20} weight="extrabold" tracking={-0.02} style={{ flex: 1 }}>
          {t('common.appName')}
        </AppText>
        <PressScale
          bg="well"
          accessibilityRole="button"
          accessibilityLabel={t('profile.signOut')}
          disabled={signOut.isPending}
          onPress={() => void signOut.run()}
          style={{
            height: 48,
            paddingHorizontal: 14,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="logout" size={20} />
          <AppText size={15} weight="bold">
            {t('profile.signOut')}
          </AppText>
        </PressScale>
      </View>

      <Rise delay={80} style={{ marginTop: 24 }}>
        <Card style={{ padding: 20, borderRadius: 28 }}>
          <AppText size={26} weight="extrabold" tracking={-0.02} accessibilityRole="header">
            {t('onboarding.title')}
          </AppText>
          <AppText size={16} tone="ink2" scaled lineHeight={1.5} style={{ marginTop: 6 }}>
            {t('onboarding.createHomeDescription')}
          </AppText>
          <AppText size={16} weight="bold" style={{ marginTop: 16, marginBottom: 8 }}>
            {t('onboarding.homeNameLabel')}
          </AppText>
          <TextField
            value={name}
            onChangeText={setName}
            placeholder={t('onboarding.homeNamePlaceholder')}
            accessibilityLabel={t('onboarding.homeNameLabel')}
            maxLength={homeNameMaxLength}
            returnKeyType="done"
            editable={!busy}
            onSubmitEditing={submitCreate}
            shakeKey={nameShake}
          />
          <View style={{ marginTop: 14 }}>
            <Button
              label={t('onboarding.createHomeButton')}
              icon="home"
              loading={createHome.isPending}
              disabled={joinHome.isPending}
              onPress={submitCreate}
            />
          </View>
        </Card>
      </Rise>

      <Rise delay={200}>
        <AppText
          size={16}
          weight="semibold"
          tone="ink2"
          style={{ marginVertical: 18, textAlign: 'center' }}
        >
          {t('onboarding.orDivider')}
        </AppText>
      </Rise>

      <Rise delay={320}>
        <Card style={{ padding: 20, borderRadius: 28 }}>
          <AppText size={20} weight="bold" accessibilityRole="header">
            {t('onboarding.joinHomeTitle')}
          </AppText>
          <AppText size={16} tone="ink2" scaled lineHeight={1.5} style={{ marginTop: 6 }}>
            {t('onboarding.joinHomeDescription')}
          </AppText>
          <AppText size={16} weight="bold" style={{ marginTop: 16, marginBottom: 8 }}>
            {t('onboarding.inviteCodeLabel')}
          </AppText>
          <TextField
            value={code}
            onChangeText={setCode}
            placeholder={t('onboarding.inviteCodePlaceholder')}
            accessibilityLabel={t('onboarding.inviteCodeLabel')}
            maxLength={inviteCodeInputMaxLength}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="done"
            editable={!busy}
            onSubmitEditing={submitJoin}
            shakeKey={codeShake}
          />
          <View style={{ marginTop: 14 }}>
            <Button
              label={t('onboarding.joinHomeButton')}
              variant="outline"
              icon="personAdd"
              loading={joinHome.isPending}
              disabled={createHome.isPending}
              onPress={submitJoin}
            />
          </View>
        </Card>
      </Rise>
    </ScrollView>
  );
}
