import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import tw from '../locales/tw.json';
import ha from '../locales/ha.json';
import ee from '../locales/ee.json';
import ga from '../locales/ga.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'tw', label: 'Twi', native: 'Twi' },
  { code: 'ga', label: 'Ga', native: 'Gã' },
  { code: 'ee', label: 'Ewe', native: 'Eʋegbe' },
  { code: 'ha', label: 'Hausa', native: 'Hausa' },
] as const;

export type LangCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/** Maps legacy display-name IDs (stored in old store) to proper locale codes */
export const LEGACY_LANG_MAP: Record<string, LangCode> = {
  English: 'en',
  Twi: 'tw',
  Ga: 'ga',
  Ewe: 'ee',
  Hausa: 'ha',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tw: { translation: tw },
      ha: { translation: ha },
      ee: { translation: ee },
      ga: { translation: ga },
    },
    fallbackLng: 'en',
    lng: localStorage.getItem('i18nextLng') ?? 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
