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
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-neighbor-500 hover:text-neighbor-700 text-sm font-semibold transition-colors duration-150 ${className}`}
    >
      <Globe className="w-4 h-4 text-neighbor-600 shrink-0" />
      <span className="inline-block w-[18px] text-center">{isVietnamese ? 'VI' : 'EN'}</span>
    </button>
  );
};

export default LanguageSwitcher;
