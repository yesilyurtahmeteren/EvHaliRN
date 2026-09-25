import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSignOut } from '@/features/auth/hooks/use-auth-actions';
import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { TextField } from '@/shared/components/text-field';
import { useAppTheme } from '@/shared/theme/theme-provider';

import { useCreateHome, useJoinHome } from '../hooks/use-home-onboarding';
import {
  createHomeFormSchema,
  homeNameMaxLength,
  joinHomeFormSchema,
  type CreateHomeForm,
  type JoinHomeForm,
} from '../schemas';

// Davet kodu 8 karakter; paylaşılan biçim "AB7K 9TQX" boşluklu olduğu için
// yapıştırılabilsin diye 9. (Flutter'da maxLength 8'di ve boşluklu kodun son
// karakterini kesiyordu.)
const inviteCodeInputMaxLength = 9;

// Flutter screens/create_home_screen.dart karşılığı. Geçersiz form (boş ad /
// boş kod) Flutter'daki gibi sessizce yok sayılır.
export function CreateHomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const signOut = useSignOut();
  const createHome = useCreateHome();
  const joinHome = useJoinHome();

  const createForm = useForm<CreateHomeForm, unknown, { name: string }>({
    resolver: zodResolver(createHomeFormSchema),
    defaultValues: { name: '' },
  });
  const joinForm = useForm<JoinHomeForm>({
    resolver: zodResolver(joinHomeFormSchema),
    defaultValues: { code: '' },
  });

  const submitCreate = createForm.handleSubmit(({ name }) => createHome.run(name));
  const submitJoin = joinForm.handleSubmit(({ code }) => joinHome.run(code));
  const busy = createHome.isPending || joinHome.isPending;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="min-h-[64px] flex-row items-center pl-screen pr-sm">
        <AppText variant="title-lg" accessibilityRole="header" className="flex-1">
          {t('onboarding.title')}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('auth.signOut')}
          disabled={signOut.isPending}
          onPress={() => void signOut.run()}
          className="h-touch w-touch items-center justify-center rounded-full active:bg-surface-container-high"
        >
          <MaterialIcons name="logout" size={24} color={colors['on-surface-variant']} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="items-center px-screen pb-xl pt-md"
      >
        <AppText variant="body-lg" className="text-center">
          {t('onboarding.createHomeDescription')}
        </AppText>
        <Controller
          control={createForm.control}
          name="name"
          render={({ field }) => (
            <TextField
              label={t('onboarding.homeNameLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              maxLength={homeNameMaxLength}
              returnKeyType="done"
              editable={!busy}
              onSubmitEditing={() => void submitCreate()}
              className="mt-xl self-stretch"
            />
          )}
        />
        <Button
          label={t('onboarding.createHomeButton')}
          loading={createHome.isPending}
          disabled={joinHome.isPending}
          onPress={() => void submitCreate()}
          className="mt-sm self-center"
        />

        <AppText variant="body-md" tone="on-surface-variant" className="my-xxl">
          {t('onboarding.orDivider')}
        </AppText>

        <AppText variant="body-lg" className="text-center">
          {t('onboarding.joinHomeDescription')}
        </AppText>
        <Controller
          control={joinForm.control}
          name="code"
          render={({ field }) => (
            <TextField
              label={t('onboarding.inviteCodeLabel')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              maxLength={inviteCodeInputMaxLength}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
              editable={!busy}
              onSubmitEditing={() => void submitJoin()}
              className="mt-xl self-stretch"
            />
          )}
        />
        <Button
          label={t('onboarding.joinHomeButton')}
          variant="secondary"
          loading={joinHome.isPending}
          disabled={createHome.isPending}
          onPress={() => void submitJoin()}
          className="mt-sm self-center"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
