import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Star, Heart, ShieldCheck, Car, Navigation } from 'lucide-react';

const FacilityCard = ({
  facility = {},
  isFavorite = false,
  onFavoriteToggle,
  onClick,
  showCompare = false,
  isSelectedCompare = false,
  onCompareToggle,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');

  const {
    id,
    name = isEn ? 'ParkLink Facility' : 'Bãi đỗ xe ParkLink',
    address = isEn ? 'Address updating' : 'Địa chỉ chưa cập nhật',
    images = [],
    price,
    price_per_month,
    pricing,
    avg_rating = 0,
    total_reviews = 0,
    available_slots,
    isOutOfSlots: propOutOfSlots,
    distance,
    facility_amenities = [],
    amenities = [],
  } = facility;

  const isOutOfSlots =
    propOutOfSlots !== undefined
      ? propOutOfSlots
      : available_slots !== undefined && available_slots !== null
      ? Number(available_slots) <= 0
      : false;

  const primaryImage =
    images?.find((img) => img.is_primary)?.image_url ||
    images?.[0]?.image_url ||
    images?.[0] ||
    null;

  const displayPrice = (() => {
    const rawPrice = price_per_month || price || pricing || 0;
    const numPrice = Number(rawPrice);
    if (!Number.isFinite(numPrice) || numPrice <= 0) return isEn ? 'Contact' : 'Liên hệ';
    return `${numPrice.toLocaleString(isEn ? 'en-US' : 'vi-VN')} đ`;
  })();

  const amenityList =
    facility_amenities.length > 0
      ? facility_amenities.map((a) => a.amenity?.name || a.name).filter(Boolean)
      : amenities.map((a) => (typeof a === 'string' ? a : a.name)).filter(Boolean);

  const displayRating = Number(avg_rating) > 0 ? Number(avg_rating).toFixed(1) : null;

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-neighbor-300 transition-all duration-200 flex flex-col cursor-pointer ${
        isSelectedCompare ? 'ring-2 ring-neighbor-500 border-neighbor-500' : ''
      } ${className}`}
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
            <Car className="w-10 h-10 stroke-[1.5]" />
            <span className="text-xs">{isEn ? 'No photo' : 'Chưa có ảnh'}</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10">
          {isOutOfSlots ? (
            <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              {isEn ? 'Full' : 'Hết chỗ'}
            </span>
          ) : available_slots !== undefined && available_slots !== null ? (
            <span className="bg-emerald-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
              {isEn ? `${available_slots} slots left` : `Còn ${available_slots} chỗ`}
            </span>
          ) : (
            <span className="bg-gray-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-neighbor-400" />
              {isEn ? 'Verified' : 'Đã kiểm định'}
            </span>
          )}

          {amenityList.length > 0 && !isOutOfSlots && (
            <span className="bg-gray-900/75 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
              {amenityList[0]}
            </span>
          )}
        </div>

        {onFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(id || facility);
            }}
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xs transition-transform active:scale-90"
            title={isFavorite ? (isEn ? 'Remove favorite' : 'Bỏ lưu') : (isEn ? 'Save' : 'Lưu bãi xe')}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-600 hover:text-rose-500'
              }`}
            />
          </button>
        )}

        {showCompare && onCompareToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCompareToggle(id);
            }}
            className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 text-xs text-gray-700 px-2 py-1 rounded-md shadow-xs flex items-center gap-1 font-medium hover:bg-white"
          >
            <input
              type="checkbox"
              checked={isSelectedCompare}
              onChange={() => {}}
              className="rounded text-neighbor-600 focus:ring-neighbor-500 cursor-pointer pointer-events-none"
            />
            <span>{isEn ? 'Compare' : 'So sánh'}</span>
          </button>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 text-base md:text-lg line-clamp-1 group-hover:text-neighbor-700 transition-colors">
            {name}
          </h3>

          <div className="flex items-start gap-1 text-sm text-gray-500 mt-1 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span className="truncate">{address}</span>
          </div>

          {distance && (
            <div className="flex items-center gap-1 text-xs text-neighbor-700 font-semibold mt-1">
              <Navigation className="w-3 h-3 text-neighbor-600" />
              <span>{isEn ? `${distance} away` : `Cách bạn ${distance}`}</span>
            </div>
          )}
        </div>

        <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {displayRating ? (
              <>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-gray-800">{displayRating}</span>
                {total_reviews > 0 && (
                  <span className="text-[11px] text-gray-400">({total_reviews})</span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-gray-400">{isEn ? 'New' : 'Mới'}</span>
            )}
          </div>

          <div className="text-right">
            <span className="font-extrabold text-gray-900 text-base md:text-lg">
              {displayPrice}
            </span>
            {displayPrice !== 'Liên hệ' && displayPrice !== 'Contact' && (
              <span className="text-xs font-normal text-gray-500 ml-1">
                {isEn ? '/ mo' : '/ tháng'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityCard;
