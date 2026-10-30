import React, { useEffect, useState, useCallback, useMemo } from 'react';
import reviewService from '../../services/reviewService';
import { useSocket } from '../../context/SocketContext';
import StarRating from '../common/StarRating';
import { 
  Star, 
  RotateCw, 
  MessageSquare, 
  Calendar, 
  ThumbsUp, 
  Award,
  Search,
  Building2
} from 'lucide-react';

const ProviderReviewsPanel = () => {
  const socket = useSocket();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError(err.message || 'Không thể tải danh sách đánh giá từ khách hàng!');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews(true);
  }, [fetchReviews]);

  // LẮNG NGHE SỰ KIỆN SOCKET REALTIME: Tự động cập nhật cho Provider khi có review mới
  useEffect(() => {
    if (!socket) return;

    const handleReviewUpdate = (payload) => {
      console.log('[Provider Socket] Nhận sự kiện cập nhật đánh giá:', payload);
      fetchReviews(false);
    };

    socket.on('review_updated', handleReviewUpdate);

    return () => {
      socket.off('review_updated', handleReviewUpdate);
    };
  }, [socket, fetchReviews]);

  // Thống kê số liệu
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { total: 0, avg: 0, fiveStar: 0, satisfactionRate: 100 };
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = (sum / total).toFixed(1);
    const fiveStar = reviews.filter(r => r.rating === 5).length;
    const positive = reviews.filter(r => r.rating >= 4).length;
    const satisfactionRate = Math.round((positive / total) * 100);
    return { total, avg, fiveStar, satisfactionRate };
  }, [reviews]);

  // Lọc đánh giá
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch =
        searchTerm.trim() === '' ||
        (r.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.comment?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStar =
        starFilter === 'ALL' || String(r.rating) === String(starFilter);

      return matchSearch && matchStar;
    });
  }, [reviews, searchTerm, starFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER PANEL */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            Đánh Giá Từ Khách Hàng
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi trải nghiệm và mức độ hài lòng của khách hàng đối với cơ sở bãi đỗ xe của bạn.
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

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchReviews(true)} className="underline hover:text-rose-900 text-xs font-semibold">
            Thử lại
          </button>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Tổng lượt đánh giá</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">{stats.total}</div>
          <span className="text-xs text-slate-400 mt-1 block">Lượt phản hồi</span>
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
          <span className="text-xs text-slate-400 mt-1 block">Điểm uy tín bãi xe</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Đánh giá 5 Sao</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.fiveStar}</div>
          <span className="text-xs text-slate-400 mt-1 block">Đạt chuẩn tuyệt đối</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Tỷ lệ hài lòng</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600">{stats.satisfactionRate}%</div>
          <span className="text-xs text-slate-400 mt-1 block">Khách hàng tích cực</span>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên khách hàng hoặc nội dung phản hồi..."
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
            <option value="ALL">Tất cả số sao</option>
            <option value="5">5 Sao</option>
            <option value="4">4 Sao</option>
            <option value="3">3 Sao</option>
            <option value="2">2 Sao</option>
            <option value="1">1 Sao</option>
          </select>
        </div>
      </div>

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
            <h4 className="font-bold text-slate-700 text-base">Chưa có đánh giá nào</h4>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              {searchTerm || starFilter !== 'ALL'
                ? 'Không tìm thấy đánh giá phù hợp với bộ lọc.'
                : 'Bãi xe của bạn hiện tại chưa có đánh giá nào từ khách hàng.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {review.customer?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {review.customer?.full_name || 'Khách hàng'}
                    </h4>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(review.created_at).toLocaleDateString('vi-VN')}
                      {review.facility?.name && (
                        <>
                          <span>•</span>
                          <span className="text-teal-700 font-medium inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {review.facility.name}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="self-start sm:self-center">
                  <StarRating value={review.rating} disabled={true} />
                </div>
              </div>

              {/* Bình luận */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
                {review.comment}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProviderReviewsPanel;
