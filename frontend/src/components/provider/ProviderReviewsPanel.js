import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import reviewService from '../../services/reviewService';
import { useSocket } from '../../context/SocketContext';
import ProviderReviewItem from './ProviderReviewItem';
import Toast from '../common/Toast';
import { 
  Star, 
  RotateCw, 
  MessageSquare, 
  ThumbsUp, 
  Award,
  Search
} from 'lucide-react';

const ProviderReviewsPanel = () => {
  const { t } = useTranslation('provider');
  const socket = useSocket();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [submittingId, setSubmittingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState('ALL');

  const fetchReviews = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await reviewService.getProviderReviews();
      if (res.success) {
        setReviews(res.data || []);
      }
    } catch (err) {
      setError(err.message || '__LOAD_ERROR__');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(true);
  }, [fetchReviews]);

  useEffect(() => {
    if (!socket) return;

    const handleReviewUpdate = () => {
      fetchReviews(false);
    };

    socket.on('review_updated', handleReviewUpdate);
    return () => {
      socket.off('review_updated', handleReviewUpdate);
    };
  }, [socket, fetchReviews]);

  // Xử lý gửi phản hồi
  const handleReplySubmit = useCallback(async (reviewId, replyText) => {
    try {
      setSubmittingId(reviewId);
      const res = await reviewService.replyToReview(reviewId, replyText);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, provider_reply: replyText } : r
          )
        );
        setToastInfo({ message: t('reviews.toasts.replySuccess'), type: 'success' });
        return true;
      }
      return false;
    } catch (err) {
      setToastInfo({
        message: err.message || t('reviews.toasts.replyError'),
        type: 'error'
      });
      return false;
    } finally {
      setSubmittingId(null);
    }
  }, [t]);

  // Thống kê số liệu
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { total: 0, avg: 0, fiveStar: 0, satisfactionRate: 0 };
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = (sum / total).toFixed(1);
    const fiveStar = reviews.filter((r) => r.rating === 5).length;
    const positive = reviews.filter((r) => r.rating >= 4).length;
    const satisfactionRate = Math.round((positive / total) * 100);
    return { total, avg, fiveStar, satisfactionRate };
  }, [reviews]);

  // Lọc đánh giá
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        r.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.comment?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStar =
        starFilter === 'ALL' || String(r.rating) === String(starFilter);

      return matchSearch && matchStar;
    });
  }, [reviews, searchTerm, starFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header panel */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            {t('reviews.title')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t('reviews.subtitle')}
          </p>
        </div>

        <button
          onClick={() => fetchReviews(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-50 text-sm font-semibold transition-all disabled:opacity-50 self-start sm:self-center"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          {t('reviews.refresh')}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center justify-between">
          <span>{error === '__LOAD_ERROR__' ? t('reviews.loadError') : error}</span>
          <button onClick={() => fetchReviews(true)} className="underline hover:text-rose-900 text-xs font-semibold">
            {t('reviews.retry')}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">{t('reviews.kpis.totalReviews')}</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.total}</div>
          <span className="text-xs text-slate-400 mt-1 block">{t('reviews.kpis.repliedCount')}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">{t('reviews.kpis.avgRating')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1">
            {stats.avg} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
          </div>
          <span className="text-xs text-slate-400 mt-1 block">{t('reviews.kpis.reputationSub')}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">{t('reviews.kpis.fiveStar')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.fiveStar}</div>
          <span className="text-xs text-slate-400 mt-1 block">{t('reviews.kpis.fiveStarSub')}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">{t('reviews.kpis.satisfactionRate')}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600">{stats.satisfactionRate}%</div>
          <span className="text-xs text-slate-400 mt-1 block">{t('reviews.kpis.satisfactionSub')}</span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('reviews.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        <div className="sm:w-52">
          <select
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500 bg-slate-50/50 text-slate-700 font-medium"
          >
            <option value="ALL">{t('reviews.allStarsOption')}</option>
            <option value="5">{t('reviews.starOption', { count: 5 })}</option>
            <option value="4">{t('reviews.starOption', { count: 4 })}</option>
            <option value="3">{t('reviews.starOption', { count: 3 })}</option>
            <option value="2">{t('reviews.starOption', { count: 2 })}</option>
            <option value="1">{t('reviews.starOption', { count: 1 })}</option>
          </select>
        </div>
      </div>

      {/* Danh sách Review */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse flex flex-col gap-3">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                <div className="h-12 bg-slate-50 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-700 text-base">{t('reviews.empty.title')}</h4>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              {searchTerm || starFilter !== 'ALL'
                ? t('reviews.empty.filterEmpty')
                : t('reviews.empty.defaultEmpty')}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <ProviderReviewItem
              key={review.id}
              review={review}
              onReplySubmit={handleReplySubmit}
              submittingId={submittingId}
            />
          ))
        )}
      </div>

      {/* Toast thông báo */}
      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default ProviderReviewsPanel;
