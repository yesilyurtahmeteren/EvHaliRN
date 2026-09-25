// TanStack Query durum bildirimlerini varsayılan olarak setTimeout(0) ile
// topluyor; testte bu, act() dışında kalan güncellemelere ve "not wrapped in
// act" uyarılarına yol açıyor. Testlerde bildirimler eşzamanlı yapılıyor.
import { notifyManager } from '@tanstack/react-query';

notifyManager.setScheduler((callback) => callback());

// FlashList testte yerleşim ölçemez; ölçümler sabit bir ekran boyutu döner
// ki tüm satırlar render edilsin. (@shopify/flash-list/jestSetup 2.0.2'de
// artık dışa aktarılmayan RecyclerView'ı kullandığı için doğrudan
// kullanılamıyor; buradaki yalnızca onun ölçüm kısmı.)
jest.mock('@shopify/flash-list/dist/recyclerview/utils/measureLayout', () => {
  const actual = jest.requireActual('@shopify/flash-list/dist/recyclerview/utils/measureLayout');
  const screen = { x: 0, y: 0, width: 400, height: 900 };
  return {
    ...actual,
    measureParentSize: jest.fn(() => screen),
    measureFirstChildLayout: jest.fn(() => screen),
    measureItemLayout: jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  };
});

// MMKV (Nitro) testte yok: bellek içi basit depo.
jest.mock('react-native-mmkv', () => {
  const store = new Map<string, string | boolean>();
  return {
    createMMKV: () => ({
      getString: (key: string) => store.get(key) as string | undefined,
      getBoolean: (key: string) => store.get(key) as boolean | undefined,
      set: (key: string, value: string | boolean) => store.set(key, value),
      remove: (key: string) => store.delete(key),
    }),
  };
});

// Konuşma tanıma native modülü testte yok.
jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    isRecognitionAvailable: () => false,
    requestPermissionsAsync: () => Promise.resolve({ granted: false }),
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
  },
  useSpeechRecognitionEvent: () => undefined,
}));

// expo-blur: testte yalnızca düz View.
jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native');
  return { BlurView: View, BlurTargetView: View };
});
