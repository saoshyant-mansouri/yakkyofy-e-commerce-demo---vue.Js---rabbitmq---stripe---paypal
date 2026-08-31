import Vue from 'vue';
import VueI18n from 'vue-i18n';
import en from './locales/en';

Vue.use(VueI18n);

export const i18n = new VueI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en },
  numberFormats: {
    en: {
      currency: { style: 'currency', currency: 'EUR' },
    },
  },
});

/** Formats an integer minor-unit amount (cents) as a currency string. */
export function formatMinor(amountMinor, currency) {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(
    (amountMinor || 0) / 100
  );
}
