import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from './locales/tr';

// Flutter sürümü yalnızca Türkçe. Cihaz dili ne olursa olsun tr'ye düşülür;
// yeni dil eklenirse supportedLngs'e eklenip getLocales() eşleşmesi çalışır.
export const supportedLanguages = ['tr'] as const;
export const defaultNS = 'translation';
export const resources = { tr: { translation: tr } } as const;

function detectLanguage(): string {
  const deviceLanguage = getLocales()[0]?.languageCode ?? 'tr';
  return (supportedLanguages as readonly string[]).includes(deviceLanguage) ? deviceLanguage : 'tr';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'tr',
  defaultNS,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
