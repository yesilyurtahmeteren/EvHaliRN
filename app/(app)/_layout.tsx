import { Stack } from 'expo-router';

// Faz 3'te korumalı rota: oturum yoksa /sign-in, users/{uid} okunamazsa
// "Ev bilgisi yüklenemedi", homeId yoksa /create-home (docs/ANALYSIS.md §1).
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create-home" />
      <Stack.Screen name="item-form" options={{ presentation: 'formSheet' }} />
    </Stack>
  );
}
