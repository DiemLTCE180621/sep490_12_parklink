import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Star, MapPin, CarFront, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import facilityService from '../../services/facilityService';
import { translateAmenityName } from '../../utils/translations';

/**
 * CompareModal – Modal so sánh 2–4 bãi đỗ xe theo bảng tiêu chí (Function 3.41)
 *
 * Props:
 *  - selectedIds: number[]      – Danh sách ID bãi đỗ xe đang được chọn so sánh
 *  - isOpen: boolean            – Trạng thái hiển thị modal
 *  - onClose: () => void        – Callback đóng modal
 *  - onRemove: (id) => void     – Callback xóa 1 bãi khỏi danh sách so sánh
 */
const CompareModal = ({ selectedIds, isOpen, onClose, onRemove, comparisonLocation }) => {
  const { t, i18n } = useTranslation('facility');
  const tRef = useRef(t);
  tRef.current = t;
  const navigate = useNavigate();

  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Gọi API so sánh mỗi khi danh sách selectedIds thay đổi
   * và modal đang mở
   */
  const fetchComparisonData = useCallback(async () => {
    if (!isOpen || selectedIds.length < 2) return;
    try {
      setLoading(true);
      setError('');
      const res = await facilityService.compareFacilities(selectedIds, comparisonLocation);
      if (res.status === 'success') {
        // Giữ thứ tự theo selectedIds gốc
        const ordered = selectedIds
          .map(id => res.data.find(f => f.id === id))
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

  // Đặt lại data khi đóng modal
  useEffect(() => {
    if (!isOpen) setComparisonData([]);
  }, [isOpen]);

  if (!isOpen) return null;

  // ─── Tìm bãi có giá thấp nhất (highlight) ───
  // Chỉ highlight khi có DUY NHẤT 1 bãi có giá thấp nhất (không đồng giá)
  const minPrice = comparisonData.length > 0
    ? Math.min(...comparisonData.map(f => f.price_per_month))
    : null;
  const facilitiesWithMinPrice = comparisonData.filter(f => f.price_per_month === minPrice);
  // Chỉ đặt lowestPriceId khi duy nhất 1 bãi có giá thấp nhất
  const lowestPriceId = facilitiesWithMinPrice.length === 1 ? facilitiesWithMinPrice[0].id : null;

  const validRatings = comparisonData.filter(f => f.avg_rating !== null && f.avg_rating !== undefined && Number(f.avg_rating) > 0);
  const maxRating = validRatings.length > 0 ? Math.max(...validRatings.map(f => Number(f.avg_rating))) : null;
  const topRatingFacilities = validRatings.filter(f => Number(f.avg_rating) === maxRating);
  const highestRatingId = topRatingFacilities.length === 1 ? topRatingFacilities[0].id : null;

  const validDistances = comparisonData.filter(f => f.distance !== null && f.distance !== undefined);
  const minDistance = validDistances.length > 0 ? Math.min(...validDistances.map(f => Number(f.distance))) : null;
  const nearestFacilities = validDistances.filter(f => Number(f.distance) === minDistance);
  const nearestId = nearestFacilities.length === 1 ? nearestFacilities[0].id : null;



  const numberLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('compareModal.dialogLabel')}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative w-full max-w-8xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-teal-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <CarFront className="w-4 h-4 text-teal-300" />
            </div>
            <h2 className="text-white font-extrabold text-lg tracking-tight">{t('compareModal.title')}</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
              {t('compareModal.countBadge', { count: selectedIds.length })}
            </span>
          </div>
          <button
            id="compare-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition"
            aria-label={t('compareModal.closeAria')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
              <p className="font-semibold">{t('compareModal.loading')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="font-semibold text-red-600">{error}</p>
              <button
                onClick={fetchComparisonData}
                className="mt-2 px-5 py-2 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition"
              >
                {t('compareModal.retry')}
              </button>
            </div>
          ) : comparisonData.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
              <CarFront className="w-12 h-12 text-slate-300" />
              <p className="font-semibold">{t('compareModal.minSelection')}</p>
            </div>
          ) : (
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                {/* Cột tiêu chí */}
                <col className="w-44" />
                {/* Các cột bãi xe */}
                {comparisonData.map(f => (
                  <col key={f.id} />
                ))}
              </colgroup>

              {/* ─── THEAD: Thông tin tổng quan từng bãi ─── */}
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  {/* Ô tiêu chí header */}
                  <th className="p-4 text-left align-top border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-tight">{t('compareModal.criteriaHeader')}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">{t('compareModal.criteriaSubheader')}</p>
                  </th>

                  {comparisonData.map((fac) => {
                    const isCheapest = fac.id === lowestPriceId;
                    const isNearest = fac.id === nearestId;
                    const isHighestRated = fac.id === highestRatingId;
                    return (
                      <th
                        key={fac.id}
                        className="p-4 text-center align-top bg-white border-b-2 border-l border-slate-100"
                        style={isCheapest ? { borderBottomColor: '#14b8a6' } : {}}
                      >
                        {/* Nút xóa bãi khỏi so sánh */}
                        <div className="flex justify-end mb-2">
                          <button
                            id={`compare-remove-btn-${fac.id}`}
                            onClick={() => onRemove(fac.id)}
                            title={t('compareModal.removeTitle')}
                            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="min-h-6 flex flex-wrap items-center justify-center gap-1 mb-1">
                          {isCheapest && (
                            <span className="inline-block px-2 py-0.5 bg-teal-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {t('compareModal.badges.lowestPrice')}
                            </span>
                          )}
                          {isNearest && (
                            <span className="inline-block px-2 py-0.5 bg-sky-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {t('compareModal.badges.nearest')}
                            </span>
                          )}
                          {isHighestRated && (
                            <span className="inline-block px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {t('compareModal.badges.highestRated')}
                            </span>
                          )}
                        </div>

                        {/* Ảnh đại diện — cố định kích thước */}
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 mb-2">
                          {fac.image_url ? (
                            <img src={fac.image_url} alt={fac.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <CarFront className="w-7 h-7" />
                            </div>
                          )}
                        </div>

                        {/* Tên bãi — cố định 2 dòng để các cột đều nhau */}
                        <p className="font-extrabold text-slate-900 text-sm leading-tight" style={{ minHeight: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {fac.name}
                        </p>

                        {/* Địa chỉ — icon canh giữa, text clamp 2 dòng */}
                        <div className="mt-1 flex items-start justify-center gap-0.5" style={{ minHeight: '2.5rem' }}>
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400 mt-0.5" />
                          <p className="text-[11px] text-slate-400 text-left line-clamp-2 leading-tight">
                            {fac.address}
                          </p>
                        </div>

                        {/* Giá nổi bật */}
                        <p className={`mt-2 text-base font-extrabold ${isCheapest ? 'text-teal-600' : 'text-slate-800'}`}>
                          {fac.price_per_month.toLocaleString(numberLocale)} {t('compareModal.priceShortSuffix')}
                        </p>

                        {/* Nút Xem Chi Tiết — tất cả cùng style tối */}
                        <button
                          id={`compare-detail-btn-${fac.id}`}
                          onClick={() => { onClose(); navigate(`/facility/${fac.id}`); }}
                          className="mt-3 w-full py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition bg-slate-900 hover:bg-slate-700 text-white"
                        >
                          {t('compareModal.viewDetails')} <ArrowRight className="w-3 h-3" />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* ─── TBODY: Ma trận tiêu chí ─── */}
              <tbody>
                {/* ── Hàng 1: Giá thuê hàng tháng ── */}
                <CompareRow
                  label={t('compareModal.rows.monthlyPrice')}
                  sublabel={t('compareModal.rows.monthlyPriceSub')}
                  cells={comparisonData.map(fac => ({
                    id: fac.id,
                    isBest: fac.id === lowestPriceId,
                    content: (
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {fac.price_per_month.toLocaleString(numberLocale)} {t('search.results.currencySuffix')}
                        </p>
                        <p className="text-xs text-slate-400">{t('compareModal.rows.perMonth')}</p>
                        {/* Chỉ hiện "Rẻ nhất" khi duy nhất 1 bãi có giá thấp nhất */}
                        {lowestPriceId && fac.id === lowestPriceId && (
                          <span className="mt-1 inline-block text-[10px] text-teal-600 font-semibold bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-100">
                            {t('compareModal.rows.cheapestTag')}
                          </span>
                        )}
                      </div>
                    )
                  }))}
                />

                {/* ── Hàng 2: Tổng sức chứa ── */}
                <CompareRow
                  label={t('compareModal.rows.totalCapacity')}
                  sublabel={t('compareModal.rows.totalCapacitySub')}
                  cells={comparisonData.map(fac => ({
                    id: fac.id,
                    isBest: false,
                    content: (
                      <p className="font-semibold text-slate-700 text-sm">
                        {t('compareModal.rows.carsUnit', { count: fac.capacity })}
                      </p>
                    )
                  }))}
                />

                {/* ── Hàng 3: Số chỗ còn trống ── */}
                <CompareRow
                  label={t('compareModal.rows.availableSlots')}
                  sublabel={t('compareModal.rows.availableSlotsSub')}
                  cells={comparisonData.map(fac => ({
                    id: fac.id,
                    isBest: false,
                    content: (
                      <p className="font-semibold text-slate-700 text-sm">
                        {fac.available_slots !== null
                          ? <span className="text-teal-600">{t('compareModal.rows.slotsOpen', { count: fac.available_slots })}</span>
                          : <span className="text-slate-400 text-xs italic">{t('compareModal.rows.notUpdated')}</span>
                        }
                      </p>
                    )
                  }))}
                />

                {/* ── Hàng 4: Khoảng cách ── */}
                <CompareRow
                  label={t('compareModal.rows.distance')}
                  sublabel={t('compareModal.rows.distanceSub')}
                  cells={comparisonData.map(fac => ({
                    id: fac.id,
                    isBest: nearestId && fac.id === nearestId,
                    content: (
                      <div className="flex flex-col items-center gap-0.5">
                        {fac.distance !== null && fac.distance !== undefined ? (
                          <>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-red-400" />
                              <span className="font-bold text-slate-800">{Number(fac.distance).toFixed(1)} km</span>
                            </div>
                            {nearestId && fac.id === nearestId && (
                              <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-100">
                                {t('compareModal.rows.nearestTag')}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs italic">{t('compareModal.rows.unknownDistance')}</span>
                        )}
                      </div>
                    )
                  }))}
                />

                {/* ── Hàng 5: Điểm đánh giá ── */}
                <CompareRow
                  label={t('compareModal.rows.rating')}
                  sublabel={t('compareModal.rows.ratingSub')}
                  cells={comparisonData.map(fac => ({
                    id: fac.id,
                    isBest: highestRatingId && fac.id === highestRatingId,
                    content: (
                      <div className="flex flex-col items-center gap-0.5">
                        {fac.avg_rating !== null ? (
                          <>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="font-extrabold text-slate-900">{fac.avg_rating}</span>
                              <span className="text-xs text-slate-400">/5.0</span>
                            </div>
                            <p className="text-[10px] text-slate-400">{t('compareModal.rows.reviewsCount', { count: fac.total_reviews })}</p>
                            {highestRatingId && fac.id === highestRatingId && (
                              <span className="mt-1 inline-block text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                {t('compareModal.rows.highestRatedTag')}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs italic">{t('compareModal.rows.noReviews')}</span>
                        )}
                      </div>
                    )
                  }))}
                />

                {/* ── Hàng 6: Tiện ích & An ninh ── */}
                <CompareRow
                  label={t('compareModal.rows.amenities')}
                  sublabel={t('compareModal.rows.amenitiesSub')}
                  isLast
                  cells={comparisonData.map(fac => ({
                    id: fac.id,
                    isBest: false,
                    content: (
                      <div className="flex flex-col items-start gap-1 text-left">
                        {fac.amenities.length > 0 ? (
                          fac.amenities.map((amenity, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                              <CheckCircle className="w-3 h-3 text-teal-500 shrink-0" />
                              <span>{translateAmenityName(amenity, i18n.language)}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">{t('compareModal.rows.noAmenities')}</span>
                        )}
                      </div>
                    )
                  }))}
                />
              </tbody>
            </table>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="shrink-0 px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            {t('compareModal.footerComparing', { count: comparisonData.length })}
          </p>
          <button
            id="compare-modal-close-footer-btn"
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
          >
            {t('compareModal.closeWindow')}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * CompareRow – Hàng tiêu chí trong bảng so sánh
 * Props:
 *  - label: string       – Tên tiêu chí
 *  - sublabel: string    – Tên tiêu chí tiếng Anh
 *  - isLast: boolean     – Hàng cuối cùng (bỏ border-bottom)
 *  - cells: Array<{
 *      id: number,
 *      isBest: boolean,
 *      content: JSX
 *    }>
 */
const CompareRow = ({ label, sublabel, cells, isLast = false }) => (
  <tr className={`group ${!isLast ? 'border-b border-slate-100' : ''}`}>
    {/* Cột nhãn tiêu chí — nền xám nhạt, border phải */}
    <td className="p-4 align-middle bg-slate-50 border-r border-slate-100" style={{ minWidth: '160px' }}>
      <p className="text-xs font-bold text-slate-700 leading-tight">{label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>
    </td>

    {/* Các ô dữ liệu — tất cả đồng đều, chỉ dùng bg trắng, không highlight bg */}
    {cells.map(cell => (
      <td
        key={cell.id}
        className="p-4 text-center align-middle bg-white border-l border-slate-100"
      >
        {cell.content}
      </td>
    ))}
  </tr>
);

export default CompareModal;
