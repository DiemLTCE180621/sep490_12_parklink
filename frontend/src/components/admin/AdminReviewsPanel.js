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

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [starFilter, setStarFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'FLAGGED' | 'HIDDEN' | 'VISIBLE'
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

  // LẮNG NGHE SỰ KIỆN SOCKET REALTIME: Tự động cập nhật ngay lập tức khi có review mới hoặc thay đổi
  useEffect(() => {
    if (!socket) return;

    const handleReviewUpdate = (payload) => {
      console.log('[Admin Socket] Nhận sự kiện cập nhật đánh giá:', payload);
      // Cập nhật ngầm trong nền không gây nháy màn hình
      fetchReviews(false);
    };

    socket.on('review_updated', handleReviewUpdate);

    return () => {
      socket.off('review_updated', handleReviewUpdate);
    };
  }, [socket, fetchReviews]);

  // Danh sách các bãi xe duy nhất để hiển thị dropdown filter
  const facilityOptions = useMemo(() => {
    const map = new Map();
    reviews.forEach(r => {
      if (r.facility && !map.has(r.facility.id)) {
        map.set(r.facility.id, r.facility.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reviews]);

  // Tính toán số liệu thống kê
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

  // Cấu hình các trạng thái với icon Lucide chính thức (không dùng emoji cứng)
  const statusOptions = useMemo(() => [
    { value: 'ALL', label: 'Tất cả trạng thái', icon: Filter, color: 'text-slate-600', badge: null },
    { value: 'FLAGGED', label: 'Bị AI cắm cờ', icon: ShieldAlert, color: 'text-rose-600', badge: stats.flagged, badgeColor: 'bg-rose-100 text-rose-700' },
    { value: 'HIDDEN', label: 'Đã bị ẩn', icon: EyeOff, color: 'text-slate-600', badge: stats.hidden, badgeColor: 'bg-slate-200 text-slate-700' },
    { value: 'VISIBLE', label: 'Đang hiển thị', icon: Eye, color: 'text-emerald-600', badge: null }
  ], [stats.flagged, stats.hidden]);

  const currentStatus = statusOptions.find(o => o.value === statusFilter) || statusOptions[0];
  const CurrentStatusIcon = currentStatus.icon;

  // Thao tác Admin: Ẩn hoặc Hiện đánh giá
  const handleToggleHide = async (review) => {
    const newStatus = review.status === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN';
    const actionLabel = newStatus === 'HIDDEN' ? 'Ẩn' : 'Bỏ ẩn';

    try {
      setActionLoadingId(review.id);
      const res = await reviewService.updateReviewStatus(review.id, { status: newStatus });
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: newStatus } : r));
        setToast({ message: `${actionLabel} đánh giá thành công!`, type: 'success' });
      }
    } catch (err) {
      setToast({ message: err.message || `Lỗi khi ${actionLabel.toLowerCase()} đánh giá`, type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Thao tác Admin: Gỡ cắm cờ (xác nhận đánh giá an toàn & hiển thị lại)
  const handleDismissFlag = async (review) => {
    try {
      setActionLoadingId(review.id);
      // Gỡ cờ đồng nghĩa với việc xác nhận đánh giá hợp lệ -> Tự động khôi phục hiển thị (VISIBLE)
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

  // State và hàm quản lý Modal Xác Nhận Ẩn Vĩnh Viễn
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
      // Xác nhận ẩn vĩnh viễn: set status = 'HIDDEN', gỡ cờ vì Admin đã trực tiếp duyệt vi phạm
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

  // Lọc dữ liệu theo tìm kiếm & bộ lọc
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
      {/* TOAST NOTIFICATION */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* HEADER PANEL */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            Quản Lý & Kiểm Duyệt Đánh Giá
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi, kiểm duyệt nội dung tự động bằng AI và quản lý quyền ẩn/hiện đánh giá của toàn bộ hệ thống.
          </p>
        </div>
        <button
          onClick={fetchReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-slate-50 text-sm font-semibold transition-all disabled:opacity-50 self-start sm:self-center"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Tổng đánh giá</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.total}</div>
          <span className="text-xs text-slate-400 mt-1 block">Toàn bộ hệ thống</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Điểm trung bình</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 flex items-baseline gap-1">
            {stats.avg} <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Chỉ số hài lòng</span>
        </div>

        {/* AI Cắm cờ */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'FLAGGED' ? 'ALL' : 'FLAGGED')}
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'FLAGGED' 
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400' 
              : 'bg-white border-slate-100 hover:border-rose-200'
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

        {/* Đã bị ẩn */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'HIDDEN' ? 'ALL' : 'HIDDEN')}
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'HIDDEN' 
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400' 
              : 'bg-white border-slate-100 hover:border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Đang bị ẩn</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-700">{stats.hidden}</div>
          <span className="text-xs text-slate-400 mt-1 block">Đã chặn hiển thị ra ngoài</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên bãi xe, khách hàng hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Status / AI Filter Custom Dropdown with Lucide Icons */}
        <div className="relative md:w-60" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => setStatusDropdownOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 hover:bg-slate-100/70 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium text-slate-700"
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
            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-1.5 transition-transform duration-200 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {statusDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-full bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-fadeIn">
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
                      isSelected ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
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
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Facility Dropdown */}
        <div className="md:w-56">
          <select
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500 bg-slate-50/50 text-slate-700 font-medium"
          >
            <option value="ALL">Tất cả cơ sở bãi xe</option>
            {facilityOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Star Rating Dropdown */}
        <div className="md:w-40">
          <select
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500 bg-slate-50/50 text-slate-700 font-medium"
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

      {/* ERROR ALERT */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* REVIEW LIST */}
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
            <h4 className="font-bold text-slate-700 text-base">Không tìm thấy đánh giá nào</h4>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
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
                className={`bg-white p-5 sm:p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all space-y-3.5 ${
                  isHidden 
                    ? 'border-slate-300 bg-slate-50/70 opacity-90' 
                    : isFlagged 
                      ? 'border-rose-200 ring-1 ring-rose-200' 
                      : 'border-slate-200/90'
                }`}
              >
                {/* Header bãi xe & Khách hàng & Nút hành động của Admin */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isHidden 
                        ? 'bg-slate-100 border-slate-200 text-slate-500' 
                        : 'bg-teal-50 border-teal-100 text-teal-700'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {review.facility?.name || `Bãi xe #${review.facility_id}`}
                      </h4>
                      <p className="text-xs text-slate-400 truncate max-w-md">
                        {review.facility?.address || 'Chưa cập nhật địa chỉ'}
                      </p>
                    </div>
                  </div>

                  {/* Badges trạng thái & Nút thao tác của Admin */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    {/* Badge Trạng thái hiển thị */}
                    {isHidden ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
                        <EyeOff className="w-3.5 h-3.5" />
                        Đã bị ẩn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đang hiển thị
                      </span>
                    )}

                    {/* Badge Cắm cờ từ AI nếu có */}
                    {isFlagged && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        AI Cắm cờ
                      </span>
                    )}

                    {/* NÚT THAO TÁC CỦA ADMIN: ẨN VĨNH VIỄN / HIỆN ĐÁNH GIÁ / GỠ CỜ */}
                    {!isHidden ? (
                      /* Nếu bài đang hiển thị công khai: Có nút Ẩn vĩnh viễn (kèm modal xác nhận) */
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
                      /* Nếu bài đang bị ẩn */
                      <>
                        {/* Nút Hiện đánh giá: Cho phép Admin khôi phục hiển thị */}
                        <button
                          onClick={() => handleToggleHide(review)}
                          disabled={isActionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-all disabled:opacity-50"
                          title="Hiển thị lại đánh giá này cho khách xem"
                        >
                          {isActionLoading ? (
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          Hiện đánh giá
                        </button>

                        {/* Nếu đang có cờ vi phạm: Admin có thể Gỡ cờ (cho hiện) hoặc Xác nhận ẩn vĩnh viễn */}
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

                {/* Thông tin Customer & Rating */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {review.customer?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 block leading-tight">
                        {review.customer?.full_name || 'Khách hàng'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {review.customer?.email || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <StarRating value={review.rating} disabled={true} />
                    <span className="text-xs text-slate-400 inline-flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* HỘP CẢNH BÁO AI NẾU BỊ CẮM CỜ */}
                {isFlagged && (
                  <div className="flex items-start gap-2.5 bg-rose-50/90 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">AI phát hiện vi phạm: </span>
                      <span>{review.flagged_reason || 'Nội dung chứa ngôn từ không phù hợp'}</span>
                    </div>
                  </div>
                )}

                {/* Nội dung bình luận */}
                <div className={`p-3.5 rounded-xl border text-sm leading-relaxed ${
                  isHidden 
                    ? 'bg-slate-100/70 border-slate-200 text-slate-500 italic' 
                    : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}>
                  {review.comment}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL XÁC NHẬN ẨN VĨNH VIỄN */}
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
