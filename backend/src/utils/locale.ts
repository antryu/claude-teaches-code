import { Language } from '../types';
import enLocale from '../locales/en.json';
import koLocale from '../locales/ko.json';

const locales = {
  en: enLocale,
  ko: koLocale,
};

export function loadLocale(language: Language) {
  return locales[language] || locales.en;
}

export function getDefaultLanguage(): Language {
  return (process.env.DEFAULT_LANGUAGE as Language) || 'en';
}
