import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Building2, User, MapPin } from 'lucide-react';

const FacilityDetailsModal = ({ facility, onClose, title }) => {
  const { t, i18n } = useTranslation('admin');
  if (!facility) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-3xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-gray-100">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-neighbor-600" /> {title || t('facilities.detailsTitle')}
        </h3>
        
        <div className="space-y-6">
          {}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3 text-sm">
              <User className="w-4 h-4 text-neighbor-600" /> {t('facilities.details.providerInfo')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">{t('facilities.details.fullName')}:</span>
                <span className="font-semibold text-gray-900 text-sm">{facility.provider?.full_name || t('facilities.details.notUpdated')}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">{t('facilities.details.phone')}:</span>
                <span className="font-semibold text-gray-900 text-sm font-mono">{facility.provider?.phone_number || t('facilities.details.notUpdated')}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 block mb-1">{t('facilities.details.email')}:</span>
                <span className="font-semibold text-gray-900 text-sm">{facility.provider?.email || t('facilities.details.notUpdated')}</span>
              </div>
            </div>
          </div>

          {}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3 text-sm">
              <MapPin className="w-4 h-4 text-neighbor-600" /> {t('facilities.details.facilityInfo')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <span className="text-gray-500 block mb-1">{t('facilities.details.name')}:</span>
                <span className="font-bold text-gray-900 text-base">{facility.name}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 block mb-1">{t('facilities.details.address')}:</span>
                <span className="font-semibold text-gray-800 text-sm">{facility.address}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">{t('facilities.details.capacity')}:</span>
                <span className="font-semibold text-gray-900 text-sm">{t('facilities.details.vehicles', { count: facility.capacity || 0 })}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">{t('facilities.details.rentalPrice')}:</span>
                <span className="font-extrabold text-neighbor-700 text-sm">
                  {facility.price_per_month ? t('facilities.details.pricePerMonth', { price: Number(facility.price_per_month).toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN') }) : t('facilities.details.notPriced')}
                </span>
              </div>
            </div>
          </div>

          {}
          {facility.images && facility.images.length > 0 && (
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-800 mb-3 text-sm">
                {t('facilities.details.images', { count: facility.images.length })}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {facility.images.map((img, idx) => (
                  <a
                    key={img.id || idx}
                    href={img.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-video rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition group relative"
                  >
                    <img
                      src={img.image_url}
                      alt={`facility-${idx}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {img.is_primary && (
                      <span className="absolute top-1 left-1 bg-neighbor-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        {t('facilities.details.primaryImage')}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-xs"
          >
            {t('facilities.details.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailsModal;
