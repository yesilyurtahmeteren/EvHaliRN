// Yerel depolama sarmalayıcısı. Flutter sürümünde yerel depolama hiç yoktu
// (docs/ANALYSIS.md §5). Yeni anahtar eklerken buraya StorageKey olarak
// ekle; dağınık string anahtar kullanma.
//   themeMode - Profil'deki Aydınlık/Koyu seçimi (theme-store.ts)
import * as SecureStore from 'expo-secure-store';
import { createMMKV } from 'react-native-mmkv';
import type { z } from 'zod';

export type StorageKey = 'themeMode';
export type SecureStorageKey = never;

const mmkv = createMMKV({ id: 'evhali' });

export const storage = {
  getString(key: StorageKey): string | undefined {
    return mmkv.getString(key);
  },
  setString(key: StorageKey, value: string): void {
    mmkv.set(key, value);
  },
  getBoolean(key: StorageKey): boolean | undefined {
    return mmkv.getBoolean(key);
  },
  setBoolean(key: StorageKey, value: boolean): void {
    mmkv.set(key, value);
  },
  // Bozuk ya da eski biçimdeki veri sessizce kabul edilmez: şemaya
  // uymuyorsa undefined döner (çağıran varsayılana düşer).
  getJSON<T>(key: StorageKey, schema: z.ZodType<T>): T | undefined {
    const raw = mmkv.getString(key);
    if (raw === undefined) {
      return undefined;
    }
    try {
      const parsed = schema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : undefined;
    } catch {
      return undefined;
    }
  },
  setJSON<T>(key: StorageKey, value: T): void {
    mmkv.set(key, JSON.stringify(value));
  },
  remove(key: StorageKey): void {
    mmkv.remove(key);
  },
};

// Hassas değerler (token vb.) için Android Keystore destekli depolama.
// Firebase oturumu kendi kalıcılığını yönettiği için şu an kullanılmıyor.
export const secureStorage = {
  get(key: SecureStorageKey): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  set(key: SecureStorageKey, value: string): Promise<void> {
    return SecureStore.setItemAsync(key, value);
  },
  remove(key: SecureStorageKey): Promise<void> {
    return SecureStore.deleteItemAsync(key);
  },
};
