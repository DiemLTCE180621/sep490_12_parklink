import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import reviewService from '../../services/reviewService';
import { validateReviewForm } from '../../validations/reviewValidation';
import StarRating from './StarRating';
import Toast from './Toast';
import { Edit, Trash2, Send, AlertTriangle } from 'lucide-react';

const ReviewSection = ({ facilityId }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra xem khách hàng hiện tại đã có bài đánh giá ở bãi xe này chưa (kể cả đang bị ẩn chờ duyệt)
  const effectiveUserReview = myReview || (user 
    ? reviews.find(r => String(r.customer_id) === String(user.id))
    : null);

  // Form states
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toast state
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  // Lắng nghe sự kiện socket để tự động cập nhật khi Admin ẩn hoặc có review mới
  useEffect(() => {
    if (!socket) return;

    const handleReviewChange = () => {
      fetchReviews(false);
    };

    socket.on('review_updated', handleReviewChange);

    return () => {
      socket.off('review_updated', handleReviewChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, facilityId]);

  const fetchReviews = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await reviewService.getReviewsByFacilityId(facilityId);
      if (res.success) {
        setReviews(res.data);
      }
      // Nếu là khách hàng, tải thông tin đánh giá riêng (kể cả đang bị ẩn chờ duyệt)
      if (user && user?.role?.name === 'CUSTOMER') {
        try {
          const myRes = await reviewService.getMyReview(facilityId);
          if (myRes.success) {
            setMyReview(myRes.data || null);
          }
        } catch {
          // Bỏ qua nếu lỗi
        }
      } else {
        setMyReview(null);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách review:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateReviewForm(rating, comment);
    if (error) {
      setToastInfo({ message: error, type: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      const res = await reviewService.createReview({
        facility_id: facilityId,
        rating,
        comment
      });
      // Reset form & reload
      setRating(0);
      setComment('');
      // Cập nhật ngay myReview để ẩn form tạo mới ngay lập tức
      setMyReview(res.data);

      if (res.data?.is_flagged || res.data?.status === 'HIDDEN') {
        setToastInfo({
          message: 'Đánh giá của bạn đã được ghi nhận và đang chờ Admin duyệt.',
          type: 'info'
        });
      } else {
        setToastInfo({
          message: 'Gửi đánh giá thành công!',
          type: 'success'
        });
      }
      await fetchReviews(false);
    } catch (err) {
      const msg = err.message || err.errors?.[0] || 'Lỗi khi gửi đánh giá';
      setToastInfo({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const error = validateReviewForm(editRating, editComment);
    if (error) {
      setToastInfo({ message: error, type: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      const res = await reviewService.updateReview(editingId, {
        rating: editRating,
        comment: editComment
      });

      setEditingId(null);
      if (res.data) {
        setMyReview(res.data);
      }

      if (res.data?.is_flagged || res.data?.status === 'HIDDEN') {
        // Tạm ẩn khỏi danh sách hiển thị
        setReviews(prev => prev.filter(r => r.id !== editingId));
        setToastInfo({
          message: 'Đánh giá vi phạm tiêu chuẩn cộng đồng và đã bị tạm ẩn để Admin kiểm duyệt.',
          type: 'info'
        });
      } else {
        setReviews(prev =>
          prev.map(r => (r.id === editingId ? { ...r, rating: editRating, comment: editComment } : r))
        );
        setToastInfo({ message: 'Cập nhật đánh giá thành công!', type: 'success' });
      }

      await fetchReviews(false);
    } catch (err) {
      const msg = err.message || err.errors?.[0] || 'Lỗi khi cập nhật đánh giá';
      setToastInfo({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const confirmDelete = (reviewId) => {
    setDeleteConfirmId(reviewId);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      setSubmitting(true);
      await reviewService.deleteReview(deleteConfirmId);
      // Xóa ngay lập tức khỏi local state để giao diện mất ngay
      setReviews(prev => prev.filter(r => r.id !== deleteConfirmId));
      if (myReview?.id === deleteConfirmId) {
        setMyReview(null);
      }
      setDeleteConfirmId(null);
      setToastInfo({ message: 'Xóa đánh giá thành công!', type: 'success' });
      await fetchReviews(false);
    } catch (err) {
      setDeleteConfirmId(null);
      const msg = err.message || err.errors?.[0] || 'Lỗi khi xóa đánh giá';
      setToastInfo({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
        Đánh giá bãi đỗ xe
        <span className="bg-teal-50 text-teal-700 text-xs py-1 px-2.5 rounded-full">
          {reviews.length} đánh giá
        </span>
      </h3>

      {/* TRƯỜNG HỢP: ĐÁNH GIÁ ĐANG ĐƯỢC ADMIN DUYỆT (TẠM ẨN) -> KHÔNG CHO VIẾT BÀI KHÁC VÀ HIỂN THỊ THÔNG BÁO RÕ RÀNG */}
      {user && user?.role?.name === 'CUSTOMER' && effectiveUserReview?.status === 'HIDDEN' && (
        <div className="mb-8 p-5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-4 animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm sm:text-base">
              <AlertTriangle className={`w-5 h-5 shrink-0 ${effectiveUserReview.is_flagged ? 'text-amber-600' : 'text-rose-600'}`} />
              <span>
                {effectiveUserReview.is_flagged 
                  ? 'Đánh giá của bạn đang chờ Quản trị viên duyệt' 
                  : 'Đánh giá của bạn đã bị Quản trị viên ẩn vĩnh viễn'}
              </span>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
              effectiveUserReview.is_flagged 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-rose-100 text-rose-800'
            }`}>
              {effectiveUserReview.is_flagged ? 'Tạm ẩn chờ duyệt' : 'Đã ẩn vĩnh viễn'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
            {effectiveUserReview.flagged_reason 
              ? `Lý do vi phạm: "${effectiveUserReview.flagged_reason}". Đánh giá này không được hiển thị công khai trên hệ thống.`
              : 'Đánh giá này không tuân thủ tiêu chuẩn cộng đồng và đã bị ẩn khỏi hệ thống.'}
          </p>

          {/* Form chỉnh sửa nếu đang edit bài bị ẩn này */}
          {editingId === effectiveUserReview.id ? (
            <form onSubmit={handleUpdate} className="bg-white p-4 rounded-xl border border-amber-200 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Chỉnh sửa lại nội dung đánh giá
                </label>
                <StarRating value={editRating} onChange={setEditRating} showLabel={true} size={22} />
              </div>
              <textarea
                rows="3"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none bg-slate-50 text-sm"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white/90 p-4 rounded-xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <StarRating value={effectiveUserReview.rating} disabled={true} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(effectiveUserReview)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                  </button>
                  <button
                    onClick={() => confirmDelete(effectiveUserReview.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 hover:underline ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "{effectiveUserReview.comment}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* CHỈ HIỂN THỊ FORM VIẾT MỚI KHI CUSTOMER CHƯA TỪNG ĐÁNH GIÁ (NẾU ĐÃ ĐÁNH GIÁ HOẶC ĐANG CHỜ DUYỆT THÌ ẨN HOÀN TOÀN) */}
      {user && user?.role?.name === 'CUSTOMER' && !effectiveUserReview && (
        <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-800 mb-2.5">
              Đánh giá trải nghiệm
            </label>
            <StarRating value={rating} onChange={setRating} showLabel={true} size={24} />
          </div>
          <div className="mb-4">
            <textarea
              rows="3"
              placeholder="Chia sẻ trải nghiệm của bạn tại bãi đỗ xe này..."
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none resize-none bg-white"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              <Send size={18} />
            </button>
          </div>
        </form>
      )}

      {/* DANH SÁCH REVIEW */}
      <div className="space-y-6">
        {loading ? (
          <div className="animate-pulse flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">

              {/* CHẾ ĐỘ CHỈNH SỬA (NẾU ĐANG CHỌN REVIEW NÀY) */}
              {editingId === review.id ? (
                <form onSubmit={handleUpdate}>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      Đánh giá trải nghiệm
                    </label>
                    <StarRating value={editRating} onChange={setEditRating} showLabel={true} size={22} />
                  </div>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 mb-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-gray-50"
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                      {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              ) : (
                /* CHẾ ĐỘ XEM THƯỜNG */
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {review.customer?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">{review.customer?.full_name || 'Người dùng ẩn danh'}</h5>
                        <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>

                    {/* Các nút hành động (Chỉ hiện nếu là bài của chính user) */}
                    {user && String(user.id) === String(review.customer_id) && (
                      <div className="flex gap-2 transition-opacity">
                        <button
                          onClick={() => startEdit(review)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => confirmDelete(review.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <StarRating value={review.rating} disabled={true} />
                  </div>
                  <p className="text-slate-700 leading-relaxed bg-white p-4 rounded-lg border border-slate-100">
                    {review.comment}
                  </p>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Xóa đánh giá?</h3>
              <p className="text-slate-500 mb-6">
                Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-red-200 disabled:opacity-50"
                >
                  {submitting ? 'Đang xóa...' : 'Đồng ý xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION CHUYÊN NGHIỆP */}
      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default ReviewSection;
