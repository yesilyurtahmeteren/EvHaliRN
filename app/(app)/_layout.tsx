import { Stack } from 'expo-router';

// Buraya yalnızca oturum açıkken gelinir (app/_layout.tsx, Stack.Protected).
// Faz 4 "home-onboarding": users/{uid} okunamazsa "Ev bilgisi yüklenemedi",
// homeId yoksa /create-home, varsa sekmeler (docs/ANALYSIS.md §1).
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create-home" />
      <Stack.Screen name="item-form" options={{ presentation: 'formSheet' }} />
    </Stack>
  );
}
