import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Star, MapPin, CarFront, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import facilityService from '../../services/facilityService';
import { translateAmenityName } from '../../utils/translations';

const CompareModal = ({ selectedIds, isOpen, onClose, onRemove, comparisonLocation }) => {
  const { t, i18n } = useTranslation('facility');
  const tRef = useRef(t);
  tRef.current = t;
  const navigate = useNavigate();

  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComparisonData = useCallback(async () => {
    if (!isOpen || selectedIds.length < 2) return;
    try {
      setLoading(true);
      setError('');
      const res = await facilityService.compareFacilities(selectedIds, comparisonLocation);
      if (res.status === 'success') {
        const ordered = selectedIds
          .map((id) => res.data.find((f) => f.id === id))
          .filter(Boolean);
        setComparisonData(ordered);
      } else {
        setComparisonData([]);
        setError(tRef.current('compareModal.loadError'));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || tRef.current('compareModal.loadError'));
    } finally {
      setLoading(false);
    }
  }, [selectedIds, isOpen, comparisonLocation]);

  useEffect(() => {
    fetchComparisonData();
  }, [fetchComparisonData]);

  useEffect(() => {
    if (!isOpen) setComparisonData([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const minPrice = comparisonData.length > 0
    ? Math.min(...comparisonData.map((f) => f.price_per_month))
    : null;
  const facilitiesWithMinPrice = comparisonData.filter((f) => f.price_per_month === minPrice);
  const lowestPriceId = facilitiesWithMinPrice.length === 1 ? facilitiesWithMinPrice[0].id : null;

  const validRatings = comparisonData.filter(
    (f) => f.avg_rating !== null && f.avg_rating !== undefined && Number(f.avg_rating) > 0
  );
  const maxRating = validRatings.length > 0 ? Math.max(...validRatings.map((f) => Number(f.avg_rating))) : null;
  const topRatingFacilities = validRatings.filter((f) => Number(f.avg_rating) === maxRating);
  const highestRatingId = topRatingFacilities.length === 1 ? topRatingFacilities[0].id : null;

  const validDistances = comparisonData.filter((f) => f.distance !== null && f.distance !== undefined);
  const minDistance = validDistances.length > 0 ? Math.min(...validDistances.map((f) => Number(f.distance))) : null;
  const nearestFacilities = validDistances.filter((f) => Number(f.distance) === minDistance);
  const nearestId = nearestFacilities.length === 1 ? nearestFacilities[0].id : null;

  const numberLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('compareModal.dialogLabel')}
    >
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neighbor-50 border border-neighbor-100 flex items-center justify-center">
              <CarFront className="w-4.5 h-4.5 text-neighbor-600" />
            </div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-gray-900 font-bold text-base sm:text-lg tracking-tight">
                {t('compareModal.title')}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-neighbor-50 text-neighbor-700 border border-neighbor-200 rounded-full">
                {t('compareModal.countBadge', { count: selectedIds.length })}
              </span>
            </div>
          </div>
          <button
            id="compare-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label={t('compareModal.closeAria')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
              <Loader2 className="w-9 h-9 text-neighbor-600 animate-spin" />
              <p className="text-sm font-medium text-gray-600">{t('compareModal.loading')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-sm font-semibold text-red-600">{error}</p>
              <button
                onClick={fetchComparisonData}
                className="mt-2 px-5 py-2 bg-neighbor-600 text-white text-sm font-semibold rounded-lg hover:bg-neighbor-700 transition-colors cursor-pointer"
              >
                {t('compareModal.retry')}
              </button>
            </div>
          ) : comparisonData.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-2">
              <CarFront className="w-12 h-12 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">{t('compareModal.minSelection')}</p>
            </div>
          ) : (
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col className="w-48" />
                {comparisonData.map((f) => (
                  <col key={f.id} />
                ))}
              </colgroup>

              <thead className="sticky top-0 z-10 bg-white shadow-2xs">
                <tr>
                  <th className="p-4 text-left align-top bg-gray-50 border-b border-r border-gray-200/80">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider leading-tight">
                      {t('compareModal.criteriaHeader')}
                    </p>
                    <p className="text-[11px] font-normal text-gray-500 mt-1 leading-snug">
                      {t('compareModal.criteriaSubheader')}
                    </p>
                  </th>

                  {comparisonData.map((fac) => {
                    const isCheapest = fac.id === lowestPriceId;
                    const isNearest = fac.id === nearestId;
                    const isHighestRated = fac.id === highestRatingId;
                    return (
                      <th
                        key={fac.id}
                        className={`p-4 text-center align-top bg-white border-b-2 border-l border-gray-100 ${
                          isCheapest ? 'border-b-neighbor-500' : 'border-b-gray-200/80'
                        }`}
                      >
                        <div className="flex justify-end mb-1.5">
                          <button
                            id={`compare-remove-btn-${fac.id}`}
                            onClick={() => onRemove(fac.id)}
                            title={t('compareModal.removeTitle')}
                            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="min-h-6 flex flex-wrap items-center justify-center gap-1.5 mb-2.5">
                          {isCheapest && (
                            <span className="inline-block px-2 py-0.5 bg-neighbor-50 text-neighbor-700 border border-neighbor-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {t('compareModal.badges.lowestPrice')}
                            </span>
                          )}
                          {isNearest && (
                            <span className="inline-block px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {t('compareModal.badges.nearest')}
                            </span>
                          )}
                          {isHighestRated && (
                            <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {t('compareModal.badges.highestRated')}
                            </span>
                          )}
                        </div>

                        <div className="w-16 h-16 mx-auto rounded-xl bg-gray-100 overflow-hidden border border-gray-200 mb-2.5 shadow-2xs">
                          {fac.image_url ? (
                            <img src={fac.image_url} alt={fac.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <CarFront className="w-7 h-7" />
                            </div>
                          )}
                        </div>

                        <p
                          className="font-bold text-gray-900 text-sm leading-snug"
                          style={{
                            minHeight: '2.5rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {fac.name}
                        </p>

                        <div className="mt-1 flex items-start justify-center gap-1 px-2" style={{ minHeight: '2.25rem' }}>
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400 mt-0.5" />
                          <p className="text-xs font-normal text-gray-500 text-left line-clamp-2 leading-snug">
                            {fac.address}
                          </p>
                        </div>

                        <p className={`mt-2 text-base font-bold ${isCheapest ? 'text-neighbor-600' : 'text-gray-900'}`}>
                          {fac.price_per_month.toLocaleString(numberLocale)} {t('compareModal.priceShortSuffix')}
                        </p>

                        <button
                          id={`compare-detail-btn-${fac.id}`}
                          onClick={() => {
                            onClose();
                            navigate(`/facility/${fac.id}`);
                          }}
                          className="mt-3 w-full py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white shadow-xs cursor-pointer"
                        >
                          {t('compareModal.viewDetails')} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                <CompareRow
                  label={t('compareModal.rows.monthlyPrice')}
                  sublabel={t('compareModal.rows.monthlyPriceSub')}
                  cells={comparisonData.map((fac) => ({
                    id: fac.id,
                    isBest: fac.id === lowestPriceId,
                    content: (
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {fac.price_per_month.toLocaleString(numberLocale)} {t('search.results.currencySuffix')}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{t('compareModal.rows.perMonth')}</p>
                        {lowestPriceId && fac.id === lowestPriceId && (
                          <span className="mt-1.5 inline-block text-[11px] text-neighbor-700 font-semibold bg-neighbor-50 px-2 py-0.5 rounded-full border border-neighbor-200">
                            {t('compareModal.rows.cheapestTag')}
                          </span>
                        )}
                      </div>
                    ),
                  }))}
                />

                <CompareRow
                  label={t('compareModal.rows.totalCapacity')}
                  sublabel={t('compareModal.rows.totalCapacitySub')}
                  cells={comparisonData.map((fac) => ({
                    id: fac.id,
                    isBest: false,
                    content: (
                      <p className="font-semibold text-gray-800 text-sm">
                        {t('compareModal.rows.carsUnit', { count: fac.capacity })}
                      </p>
                    ),
                  }))}
                />

                <CompareRow
                  label={t('compareModal.rows.availableSlots')}
                  sublabel={t('compareModal.rows.availableSlotsSub')}
                  cells={comparisonData.map((fac) => ({
                    id: fac.id,
                    isBest: false,
                    content: (
                      <p className="font-semibold text-gray-800 text-sm">
                        {fac.available_slots !== null ? (
                          <span className="text-neighbor-600">
                            {t('compareModal.rows.slotsOpen', { count: fac.available_slots })}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">{t('compareModal.rows.notUpdated')}</span>
                        )}
                      </p>
                    ),
                  }))}
                />

                <CompareRow
                  label={t('compareModal.rows.distance')}
                  sublabel={t('compareModal.rows.distanceSub')}
                  cells={comparisonData.map((fac) => ({
                    id: fac.id,
                    isBest: nearestId && fac.id === nearestId,
                    content: (
                      <div className="flex flex-col items-center gap-1">
                        {fac.distance !== null && fac.distance !== undefined ? (
                          <>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span className="font-semibold text-gray-900 text-sm">
                                {Number(fac.distance).toFixed(1)} km
                              </span>
                            </div>
                            {nearestId && fac.id === nearestId && (
                              <span className="text-[11px] text-neighbor-700 font-semibold bg-neighbor-50 px-2 py-0.5 rounded-full border border-neighbor-200">
                                {t('compareModal.rows.nearestTag')}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs italic">{t('compareModal.rows.unknownDistance')}</span>
                        )}
                      </div>
                    ),
                  }))}
                />

                <CompareRow
                  label={t('compareModal.rows.rating')}
                  sublabel={t('compareModal.rows.ratingSub')}
                  cells={comparisonData.map((fac) => ({
                    id: fac.id,
                    isBest: highestRatingId && fac.id === highestRatingId,
                    content: (
                      <div className="flex flex-col items-center gap-1">
                        {fac.avg_rating !== null ? (
                          <>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="font-bold text-gray-900 text-sm">{fac.avg_rating}</span>
                              <span className="text-xs text-gray-500">/5.0</span>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              {t('compareModal.rows.reviewsCount', { count: fac.total_reviews })}
                            </p>
                            {highestRatingId && fac.id === highestRatingId && (
                              <span className="mt-0.5 inline-block text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                {t('compareModal.rows.highestRatedTag')}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs italic">{t('compareModal.rows.noReviews')}</span>
                        )}
                      </div>
                    ),
                  }))}
                />

                <CompareRow
                  label={t('compareModal.rows.amenities')}
                  sublabel={t('compareModal.rows.amenitiesSub')}
                  isLast
                  cells={comparisonData.map((fac) => ({
                    id: fac.id,
                    isBest: false,
                    content: (
                      <div className="inline-flex flex-col items-start gap-1.5 text-left mx-auto">
                        {fac.amenities.length > 0 ? (
                          fac.amenities.map((amenity, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-700">
                              <CheckCircle className="w-3.5 h-3.5 text-neighbor-600 shrink-0" />
                              <span>{translateAmenityName(amenity, i18n.language)}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs italic">{t('compareModal.rows.noAmenities')}</span>
                        )}
                      </div>
                    ),
                  }))}
                />
              </tbody>
            </table>
          )}
        </div>

        <div className="shrink-0 px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            {t('compareModal.footerComparing', { count: comparisonData.length })}
          </p>
          <button
            id="compare-modal-close-footer-btn"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
          >
            {t('compareModal.closeWindow')}
          </button>
        </div>
      </div>
    </div>
  );
};

const CompareRow = ({ label, sublabel, cells, isLast = false }) => (
  <tr className={`group transition-colors hover:bg-gray-50/40 ${!isLast ? 'border-b border-gray-100' : ''}`}>
    <td className="p-4 align-middle bg-gray-50 border-r border-gray-200/80" style={{ minWidth: '160px' }}>
      <p className="text-xs font-semibold text-gray-800 leading-tight">{label}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{sublabel}</p>
    </td>

    {cells.map((cell) => (
      <td
        key={cell.id}
        className="p-4 text-center align-middle bg-white border-l border-gray-100 group-hover:bg-gray-50/40 transition-colors"
      >
        {cell.content}
      </td>
    ))}
  </tr>
);

export default CompareModal;
