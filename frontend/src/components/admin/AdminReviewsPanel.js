import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import reviewService from '../../services/reviewService';
import { useSocket } from '../../context/SocketContext';
import Toast from '../common/Toast';
import ConfirmModal from '../modals/ConfirmModal';
import { 
  Star, 
  Search, 
  RotateCw, 
  MessageSquare, 
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldAlert,
  Check,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AdminReviewCard from './AdminReviewCard';

const REVIEWS_PER_PAGE = 12;

const AdminReviewsPanel = () => {
  const { t } = useTranslation('admin');
  const socket = useSocket();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  
  const [searchTerm, setSearchTerm] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [starFilter, setStarFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReviews = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await reviewService.getAllReviewsAdmin();
      if (res.success) {
        setReviews(res.data || []);
      }
    } catch (err) {
      setError(err.message || t('reviews.errors.load'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReviews(true);
  }, [fetchReviews]);

  
  useEffect(() => {
    if (!socket) return;

    const handleReviewUpdate = (payload) => {
      console.log('[Admin Socket] Nhận sự kiện cập nhật đánh giá:', payload);
      
      fetchReviews(false);
    };

    socket.on('review_updated', handleReviewUpdate);

    return () => {
      socket.off('review_updated', handleReviewUpdate);
    };
  }, [socket, fetchReviews]);

  
  const facilityOptions = useMemo(() => {
    const map = new Map();
    reviews.forEach(r => {
      if (r.facility && !map.has(r.facility.id)) {
        map.set(r.facility.id, r.facility.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reviews]);

  
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { total: 0, avg: 0, flagged: 0, hidden: 0 };
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = (sum / total).toFixed(1);
    const flagged = reviews.filter(r => r.is_flagged).length;
    const hidden = reviews.filter(r => r.status === 'HIDDEN').length;
    return { total, avg, flagged, hidden };
  }, [reviews]);

  
  const statusOptions = useMemo(() => [
    { value: 'ALL', label: t('reviews.filters.allStatuses'), icon: Filter, color: 'text-gray-600', badge: null },
    { value: 'FLAGGED', label: t('reviews.filters.flagged'), icon: ShieldAlert, color: 'text-rose-600', badge: stats.flagged, badgeColor: 'bg-rose-100 text-rose-700' },
    { value: 'HIDDEN', label: t('reviews.filters.hidden'), icon: EyeOff, color: 'text-gray-600', badge: stats.hidden, badgeColor: 'bg-gray-200 text-gray-700' },
    { value: 'VISIBLE', label: t('reviews.filters.visible'), icon: Eye, color: 'text-emerald-600', badge: null }
  ], [stats.flagged, stats.hidden, t]);

  const currentStatus = statusOptions.find(o => o.value === statusFilter) || statusOptions[0];
  const CurrentStatusIcon = currentStatus.icon;





  
  const handleDismissFlag = useCallback(async (review) => {
    try {
      setActionLoadingId(review.id);
      
      const res = await reviewService.updateReviewStatus(review.id, { 
        is_flagged: false, 
        status: 'VISIBLE' 
      });
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_flagged: false, status: 'VISIBLE' } : r));
        setToast({ message: t('reviews.toasts.dismissSuccess'), type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.message || t('reviews.toasts.dismissError'), type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  }, [t]);

  
  const [unhideModal, setUnhideModal] = useState({
    isOpen: false,
    review: null,
    loading: false
  });

  const handleOpenUnhideModal = useCallback((review) => {
    setUnhideModal({
      isOpen: true,
      review,
      loading: false
    });
  }, []);

  const handleCloseUnhideModal = () => {
    if (!unhideModal.loading) {
      setUnhideModal({ isOpen: false, review: null, loading: false });
    }
  };

  const handleConfirmUnhide = async () => {
    if (!unhideModal.review) return;
    const review = unhideModal.review;

    try {
      setUnhideModal(prev => ({ ...prev, loading: true }));
      const res = await reviewService.unhideReview(review.id);
      if (res.success) {
        setReviews(prev =>
          prev.map(r => r.id === review.id ? { ...r, status: 'VISIBLE', is_flagged: false, flagged_reason: null } : r)
        );
        setToast({ message: t('reviews.toasts.unhideSuccess'), type: 'success' });
        setUnhideModal({ isOpen: false, review: null, loading: false });
      }
    } catch (err) {
      setToast({ message: err.message || t('reviews.toasts.unhideError'), type: 'error' });
      setUnhideModal(prev => ({ ...prev, loading: false }));
    }
  };

  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    review: null,
    loading: false
  });

  const handleOpenPermanentHideModal = useCallback((review) => {
    setConfirmModal({
      isOpen: true,
      review,
      loading: false
    });
  }, []);

  const handleCloseConfirmModal = () => {
    if (!confirmModal.loading) {
      setConfirmModal({ isOpen: false, review: null, loading: false });
    }
  };

  const handleConfirmPermanentHide = async () => {
    if (!confirmModal.review) return;
    const review = confirmModal.review;

    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      
      const res = await reviewService.updateReviewStatus(review.id, { 
        status: 'HIDDEN',
        is_flagged: false 
      });
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: 'HIDDEN', is_flagged: false } : r));
        setToast({ message: t('reviews.toasts.hideSuccess'), type: 'success' });
        setConfirmModal({ isOpen: false, review: null, loading: false });
      }
    } catch (err) {
      setToast({ message: err.message || t('reviews.toasts.hideError'), type: 'error' });
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch = 
        searchTerm.trim() === '' ||
        (r.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.facility?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.comment?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchFacility = 
        facilityFilter === 'ALL' || String(r.facility_id) === String(facilityFilter);

      const matchStar = 
        starFilter === 'ALL' || String(r.rating) === String(starFilter);

      const matchStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'FLAGGED' && r.is_flagged) ||
        (statusFilter === 'HIDDEN' && r.status === 'HIDDEN') ||
        (statusFilter === 'VISIBLE' && r.status === 'VISIBLE');

      return matchSearch && matchFacility && matchStar && matchStatus;
    });
  }, [reviews, searchTerm, facilityFilter, starFilter, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    return filteredReviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, facilityFilter, starFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <div className="bg-white p-6 sm:p-7 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            {t('reviews.title')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('reviews.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-neighbor-700 hover:bg-gray-50 text-sm font-semibold transition-all disabled:opacity-50 self-start sm:self-center"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-neighbor-600' : ''}`} />
          {t('common.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="min-w-0 border-b border-r border-gray-200 p-5 lg:border-b-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">{t('reviews.kpis.total')}</span>
            <div className="w-8 h-8 rounded-lg bg-neighbor-50 text-neighbor-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-800">{stats.total}</div>
          <span className="text-xs text-gray-400 mt-1 block">{t('reviews.kpis.totalSub')}</span>
        </div>

        <div className="min-w-0 border-b border-gray-200 p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">{t('reviews.kpis.average')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1">
            {stats.avg} <span className="text-xs font-semibold text-gray-400">/ 5.0</span>
          </div>
          <span className="text-xs text-gray-400 mt-1 block">{t('reviews.kpis.averageSub')}</span>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'FLAGGED' ? 'ALL' : 'FLAGGED')}
          className={`min-w-0 border-r border-gray-200 p-5 cursor-pointer transition-colors ${
            statusFilter === 'FLAGGED'
              ? 'bg-rose-50'
              : 'hover:bg-rose-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase">{t('reviews.kpis.flagged')}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.flagged}</div>
          <span className="text-xs text-rose-500/80 mt-1 block">
            {stats.flagged > 0 ? t('reviews.kpis.flaggedPending') : t('reviews.kpis.flaggedClear')}
          </span>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'HIDDEN' ? 'ALL' : 'HIDDEN')}
          className={`min-w-0 p-5 cursor-pointer transition-colors ${
            statusFilter === 'HIDDEN'
              ? 'bg-gray-100'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">{t('reviews.kpis.hidden')}</span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-700">{stats.hidden}</div>
          <span className="text-xs text-gray-400 mt-1 block">{t('reviews.kpis.hiddenSub')}</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('reviews.filters.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-neighbor-500 focus:ring-1 focus:ring-neighbor-500 bg-gray-50/50"
          />
        </div>

        <div className="relative md:w-60" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => setStatusDropdownOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50/50 hover:bg-gray-100/70 focus:outline-none focus:border-neighbor-500 focus:ring-1 focus:ring-neighbor-500 transition-all font-medium text-gray-700"
          >
            <div className="flex items-center gap-2 truncate">
              <CurrentStatusIcon className={`w-4 h-4 shrink-0 ${currentStatus.color}`} />
              <span className="truncate">{currentStatus.label}</span>
              {currentStatus.badge !== null && currentStatus.badge > 0 && (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${currentStatus.badgeColor}`}>
                  {currentStatus.badge}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-1.5 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {statusDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-fadeIn">
              {statusOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option.value);
                      setStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
                      isSelected ? 'bg-neighbor-50 text-neighbor-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className={`w-4 h-4 shrink-0 ${option.color}`} />
                      <span className="truncate">{option.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {option.badge !== null && option.badge > 0 && (
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${option.badgeColor}`}>
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-neighbor-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="md:w-56">
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-neighbor-500 bg-gray-50/50 text-gray-700 font-medium"
          >
            <option value="ALL">{t('reviews.filters.allFacilities')}</option>
            {facilityOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:w-40">
          <select
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-neighbor-500 bg-gray-50/50 text-gray-700 font-medium"
          >
            <option value="ALL">{t('reviews.filters.allRatings')}</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {t('reviews.filters.starOption', { count: rating })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse flex flex-col gap-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-12 bg-gray-50 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-gray-200 text-center space-y-3">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-700 text-base">{t('reviews.empty.title')}</h4>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {searchTerm || facilityFilter !== 'ALL' || starFilter !== 'ALL' || statusFilter !== 'ALL'
                ? t('reviews.empty.filtered')
                : t('reviews.empty.default')}
            </p>
          </div>
        ) : (
          paginatedReviews.map((review) => (
            <AdminReviewCard
              key={review.id}
              review={review}
              actionLoading={actionLoadingId === review.id}
              onDismissFlag={handleDismissFlag}
              onOpenUnhide={handleOpenUnhideModal}
              onOpenPermanentHide={handleOpenPermanentHideModal}
            />
          ))
        )}
      </div>

      {!loading && filteredReviews.length > 0 && (
        <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
          <span>
            {t('reviews.pagination.range', {
              from: (currentPage - 1) * REVIEWS_PER_PAGE + 1,
              to: Math.min(currentPage * REVIEWS_PER_PAGE, filteredReviews.length),
              total: filteredReviews.length
            })}
          </span>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"
                aria-label={t('reviews.pagination.previous')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{t('common.pagination', { current: currentPage, total: pageCount })}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                disabled={currentPage === pageCount}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"
                aria-label={t('reviews.pagination.next')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={unhideModal.isOpen}
        onClose={handleCloseUnhideModal}
        onConfirm={handleConfirmUnhide}
        title={t('reviews.confirm.unhideTitle')}
        message={
          unhideModal.review
            ? t('reviews.confirm.unhideMessage', {
                customer: unhideModal.review.customer?.full_name || t('reviews.card.defaultCustomer')
              })
            : t('reviews.confirm.unhideFallback')
        }
        confirmText={t('reviews.confirm.unhideConfirm')}
        cancelText={t('reviews.confirm.cancel')}
        type="success"
        loading={unhideModal.loading}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmPermanentHide}
        title={t('reviews.confirm.hideTitle')}
        message={
          confirmModal.review
            ? t('reviews.confirm.hideMessage', {
                customer: confirmModal.review.customer?.full_name || t('reviews.card.defaultCustomer')
              })
            : t('reviews.confirm.hideFallback')
        }
        confirmText={t('reviews.confirm.hideConfirm')}
        cancelText={t('reviews.confirm.cancel')}
        type="danger"
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default AdminReviewsPanel;
