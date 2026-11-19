import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation('common');
  const isVietnamese = i18n.language?.startsWith('vi');

  const handleToggleLanguage = () => {
    const nextLang = isVietnamese ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={handleToggleLanguage}
      title={isVietnamese ? t('language.switchToEn') : t('language.switchToVi')}
      aria-label={isVietnamese ? t('language.switchToEn') : t('language.switchToVi')}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-teal-500 hover:text-teal-700 text-xs font-semibold transition duration-150 ${className}`}
    >
      <Globe className="w-4 h-4 text-teal-600 shrink-0" />
      <span className="inline-block w-[18px] text-center">{isVietnamese ? 'VI' : 'EN'}</span>
    </button>
  );
};

export default LanguageSwitcher;
