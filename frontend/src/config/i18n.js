import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonVi from '../locales/vi/common.json';
import commonEn from '../locales/en/common.json';
import homeVi from '../locales/vi/home.json';
import homeEn from '../locales/en/home.json';
import profileVi from '../locales/vi/profile.json';
import profileEn from '../locales/en/profile.json';
import registerVi from '../locales/vi/register.json';
import registerEn from '../locales/en/register.json';
import loginVi from '../locales/vi/login.json';
import loginEn from '../locales/en/login.json';
import providerVi from '../locales/vi/provider.json';
import providerEn from '../locales/en/provider.json';
import customerVi from '../locales/vi/customer.json';
import customerEn from '../locales/en/customer.json';
import facilityVi from '../locales/vi/facility.json';
import facilityEn from '../locales/en/facility.json';
import chatVi from '../locales/vi/chat.json';
import chatEn from '../locales/en/chat.json';
import adminVi from '../locales/vi/admin.json';
import adminEn from '../locales/en/admin.json';
import inspectorVi from '../locales/vi/inspector.json';
import inspectorEn from '../locales/en/inspector.json';

export const LANGUAGE_STORAGE_KEY = 'parklink_language';
export const SUPPORTED_LANGUAGES = ['vi', 'en'];

const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }
  } catch (error) {
  }
  return 'vi';
};

const syncDocumentLanguage = (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch (error) {
  }
};

const initialLanguage = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        common: commonVi,
        home: homeVi,
        profile: profileVi,
        register: registerVi,
        login: loginVi,
        provider: providerVi,
        customer: customerVi,
        facility: facilityVi,
        chat: chatVi,
        admin: adminVi,
        inspector: inspectorVi,
      },
      en: {
        common: commonEn,
        home: homeEn,
        profile: profileEn,
        register: registerEn,
        login: loginEn,
        provider: providerEn,
        customer: customerEn,
        facility: facilityEn,
        chat: chatEn,
        admin: adminEn,
        inspector: inspectorEn,
      },
    },
    lng: initialLanguage,
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: ['common', 'home', 'profile', 'register', 'login', 'provider', 'customer', 'facility', 'chat', 'admin', 'inspector'],
    interpolation: {
      escapeValue: false,
    },
  });

syncDocumentLanguage(initialLanguage);
i18n.on('languageChanged', syncDocumentLanguage);

export default i18n;
