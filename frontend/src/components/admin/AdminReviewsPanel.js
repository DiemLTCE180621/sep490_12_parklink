import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import reviewService from '../../services/reviewService';
import { useSocket } from '../../context/SocketContext';
import StarRating from '../common/StarRating';
import Toast from '../common/Toast';
import ConfirmModal from '../modals/ConfirmModal';
import { 
  Star, 
  Building2, 
  Search, 
  RotateCw, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  Eye,
  EyeOff,
  ShieldAlert,
  Check,
  Filter,
  ChevronDown
} from 'lucide-react';

const AdminReviewsPanel = () => {
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
      setError(err.message || 'Không thể tải danh sách đánh giá của hệ thống!');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

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
    if (total === 0) return { total: 0, avg: 0, positive: 0, negative: 0, flagged: 0, hidden: 0 };
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = (sum / total).toFixed(1);
    const positive = reviews.filter(r => r.rating >= 4).length;
    const negative = reviews.filter(r => r.rating <= 2).length;
    const flagged = reviews.filter(r => r.is_flagged).length;
    const hidden = reviews.filter(r => r.status === 'HIDDEN').length;
    return { total, avg, positive, negative, flagged, hidden };
  }, [reviews]);

  
  const statusOptions = useMemo(() => [
    { value: 'ALL', label: 'Tất cả trạng thái', icon: Filter, color: 'text-gray-600', badge: null },
    { value: 'FLAGGED', label: 'Bị AI cắm cờ', icon: ShieldAlert, color: 'text-rose-600', badge: stats.flagged, badgeColor: 'bg-rose-100 text-rose-700' },
    { value: 'HIDDEN', label: 'Đã bị ẩn', icon: EyeOff, color: 'text-gray-600', badge: stats.hidden, badgeColor: 'bg-gray-200 text-gray-700' },
    { value: 'VISIBLE', label: 'Đang hiển thị', icon: Eye, color: 'text-emerald-600', badge: null }
  ], [stats.flagged, stats.hidden]);

  const currentStatus = statusOptions.find(o => o.value === statusFilter) || statusOptions[0];
  const CurrentStatusIcon = currentStatus.icon;





  
  const handleDismissFlag = async (review) => {
    try {
      setActionLoadingId(review.id);
      
      const res = await reviewService.updateReviewStatus(review.id, { 
        is_flagged: false, 
        status: 'VISIBLE' 
      });
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_flagged: false, status: 'VISIBLE' } : r));
        setToast({ message: 'Đã gỡ cắm cờ và hiển thị lại đánh giá thành công!', type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.message || 'Lỗi khi gỡ cắm cờ', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  
  const [unhideModal, setUnhideModal] = useState({
    isOpen: false,
    review: null,
    loading: false
  });

  const handleOpenUnhideModal = (review) => {
    setUnhideModal({
      isOpen: true,
      review,
      loading: false
    });
  };

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
        setToast({ message: 'Bỏ ẩn đánh giá thành công! Đánh giá đã được hiển thị công khai.', type: 'success' });
        setUnhideModal({ isOpen: false, review: null, loading: false });
      }
    } catch (err) {
      setToast({ message: err.message || 'Lỗi khi bỏ ẩn đánh giá', type: 'error' });
      setUnhideModal(prev => ({ ...prev, loading: false }));
    }
  };

  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    review: null,
    loading: false
  });

  const handleOpenPermanentHideModal = (review) => {
    setConfirmModal({
      isOpen: true,
      review,
      loading: false
    });
  };

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
        setToast({ message: 'Đã xác nhận và ẩn vĩnh viễn đánh giá thành công!', type: 'success' });
        setConfirmModal({ isOpen: false, review: null, loading: false });
      }
    } catch (err) {
      setToast({ message: err.message || 'Lỗi khi ẩn vĩnh viễn đánh giá', type: 'error' });
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            Quản Lý & Kiểm Duyệt Đánh Giá
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi, kiểm duyệt nội dung tự động bằng AI và quản lý quyền ẩn/hiện đánh giá của toàn bộ hệ thống.
          </p>
        </div>
        <button
          onClick={fetchReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-neighbor-700 hover:bg-gray-50 text-sm font-semibold transition-all disabled:opacity-50 self-start sm:self-center"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-neighbor-600' : ''}`} />
          Làm mới
        </button>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Tổng đánh giá</span>
            <div className="w-8 h-8 rounded-lg bg-neighbor-50 text-neighbor-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-800">{stats.total}</div>
          <span className="text-xs text-gray-400 mt-1 block">Toàn bộ hệ thống</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Điểm trung bình</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1">
            {stats.avg} <span className="text-xs font-semibold text-gray-400">/ 5.0</span>
          </div>
          <span className="text-xs text-gray-400 mt-1 block">Chỉ số hài lòng</span>
        </div>

        {}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'FLAGGED' ? 'ALL' : 'FLAGGED')}
          className={`p-5 rounded-xl border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'FLAGGED' 
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400' 
              : 'bg-white border-gray-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-600 uppercase">AI Cảnh báo vi phạm</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.flagged}</div>
          <span className="text-xs text-rose-500/80 mt-1 block">
            {stats.flagged > 0 ? 'Cần Admin duyệt ngay' : 'Không có vi phạm'}
          </span>
        </div>

        {}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'HIDDEN' ? 'ALL' : 'HIDDEN')}
          className={`p-5 rounded-xl border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'HIDDEN' 
              ? 'bg-gray-100 border-gray-300 ring-2 ring-gray-400' 
              : 'bg-white border-gray-200 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Đang bị ẩn</span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-700">{stats.hidden}</div>
          <span className="text-xs text-gray-400 mt-1 block">Đã chặn hiển thị ra ngoài</span>
        </div>
      </div>

      {}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        {}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên bãi xe, khách hàng hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-neighbor-500 focus:ring-1 focus:ring-neighbor-500 bg-gray-50/50"
          />
        </div>

        {}
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

        {}
        <div className="md:w-56">
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-neighbor-500 bg-gray-50/50 text-gray-700 font-medium"
          >
            <option value="ALL">Tất cả cơ sở bãi xe</option>
            {facilityOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {}
        <div className="md:w-40">
          <select
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-neighbor-500 bg-gray-50/50 text-gray-700 font-medium"
          >
            <option value="ALL">Tất cả số sao</option>
            <option value="5">5 Sao</option>
            <option value="4">4 Sao</option>
            <option value="3">3 Sao</option>
            <option value="2">2 Sao</option>
            <option value="1">1 Sao</option>
          </select>
        </div>
      </div>

      {}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {}
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
            <h4 className="font-bold text-gray-700 text-base">Không tìm thấy đánh giá nào</h4>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {searchTerm || facilityFilter !== 'ALL' || starFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Không có đánh giá nào phù hợp với bộ lọc hiện tại. Vui lòng thử lại.'
                : 'Hệ thống hiện tại chưa ghi nhận đánh giá nào từ khách hàng.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const isHidden = review.status === 'HIDDEN';
            const isFlagged = Boolean(review.is_flagged);
            const isActionLoading = actionLoadingId === review.id;

            return (
              <div
                key={review.id}
                className={`bg-white p-5 sm:p-6 rounded-xl border shadow-sm hover:shadow-md transition-all space-y-3.5 ${
                  isHidden 
                    ? 'border-gray-300 bg-gray-50/70 opacity-90' 
                    : isFlagged 
                      ? 'border-rose-200 ring-1 ring-rose-200' 
                      : 'border-gray-200/90'
                }`}
              >
                {}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isHidden 
                        ? 'bg-gray-100 border-gray-200 text-gray-500' 
                        : 'bg-neighbor-50 border-neighbor-100 text-neighbor-700'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                        {review.facility?.name || `Bãi xe #${review.facility_id}`}
                      </h4>
                      <p className="text-xs text-gray-400 truncate max-w-md">
                        {review.facility?.address || 'Chưa cập nhật địa chỉ'}
                      </p>
                    </div>
                  </div>

                  {}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    {}
                    {isHidden ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 border border-gray-300">
                        <EyeOff className="w-3.5 h-3.5" />
                        Đã bị ẩn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đang hiển thị
                      </span>
                    )}

                    {}
                    {isFlagged && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        AI Cắm cờ
                      </span>
                    )}

                    {}
                    {!isHidden ? (
                      
                      <button
                        onClick={() => handleOpenPermanentHideModal(review)}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all disabled:opacity-50"
                        title="Ẩn vĩnh viễn đánh giá này khỏi hệ thống"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Ẩn vĩnh viễn
                      </button>
                    ) : (
                      
                      <>
                        {}
                        <button
                          onClick={() => handleOpenUnhideModal(review)}
                          disabled={isActionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-700 border border-neighbor-200 transition-all disabled:opacity-50"
                          title="Bỏ ẩn và hiển thị lại đánh giá này"
                        >
                          {isActionLoading ? (
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          Bỏ ẩn đánh giá
                        </button>

                        {}
                        {isFlagged && (
                          <>
                            <button
                              onClick={() => handleDismissFlag(review)}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all disabled:opacity-50"
                              title="Xác nhận đánh giá an toàn, gỡ cờ và hiển thị lại"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Gỡ cờ
                            </button>

                            <button
                              onClick={() => handleOpenPermanentHideModal(review)}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all disabled:opacity-50"
                              title="Xác nhận vi phạm và ẩn vĩnh viễn đánh giá này"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              Ẩn vĩnh viễn
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                      {review.customer?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-800 block leading-tight">
                        {review.customer?.full_name || 'Khách hàng'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {review.customer?.email || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <StarRating value={review.rating} disabled={true} />
                    <span className="text-xs text-gray-400 inline-flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {}
                {isFlagged && (
                  <div className="flex items-start gap-2.5 bg-rose-50/90 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">AI phát hiện vi phạm: </span>
                      <span>{review.flagged_reason || 'Nội dung chứa ngôn từ không phù hợp'}</span>
                    </div>
                  </div>
                )}

                {}
                <div className={`p-3.5 rounded-xl border text-sm leading-relaxed ${
                  isHidden 
                    ? 'bg-gray-100/70 border-gray-200 text-gray-500 italic' 
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  {review.comment}
                </div>
              </div>
            );
          })
        )}
      </div>

      {}
      <ConfirmModal
        isOpen={unhideModal.isOpen}
        onClose={handleCloseUnhideModal}
        onConfirm={handleConfirmUnhide}
        title="Xác Nhận Bỏ Ẩn Đánh Giá"
        message={
          unhideModal.review
            ? `Bạn có chắc chắn muốn bỏ ẩn và hiển thị lại đánh giá của khách hàng "${unhideModal.review.customer?.full_name || 'Khách hàng'}" không? Bài viết sẽ xuất hiện công khai trở lại tại bãi đỗ xe.`
            : 'Bạn có chắc chắn muốn bỏ ẩn đánh giá này không?'
        }
        confirmText="Bỏ Ẩn Ngay"
        cancelText="Hủy Bỏ"
        type="success"
        loading={unhideModal.loading}
      />

      {}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmPermanentHide}
        title="Xác Nhận Ẩn Vĩnh Viễn Đánh Giá"
        message={
          confirmModal.review
            ? `Bạn có chắc chắn muốn ẩn vĩnh viễn đánh giá của khách hàng "${confirmModal.review.customer?.full_name || 'Khách hàng'}" không? Hành động này sẽ khóa hiển thị đánh giá này hoàn toàn khỏi bãi đỗ xe.`
            : 'Bạn có chắc chắn muốn ẩn vĩnh viễn đánh giá này không?'
        }
        confirmText="Ẩn Vĩnh Viễn"
        cancelText="Hủy Bỏ"
        type="danger"
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default AdminReviewsPanel;
