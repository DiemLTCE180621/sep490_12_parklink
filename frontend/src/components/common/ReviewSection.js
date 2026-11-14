import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import reviewService from '../../services/reviewService';
import { validateReviewForm } from '../../validations/reviewValidation';
import StarRating from './StarRating';
import Toast from './Toast';
import ConfirmModal from '../modals/ConfirmModal';
import { Edit, Trash2, Send, AlertTriangle, CornerDownRight } from 'lucide-react';

const EditReviewForm = ({
  rating,
  setRating,
  comment,
  setComment,
  onCancel,
  onSubmit,
  submitting
}) => (
  <form onSubmit={onSubmit} className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
    <div>
      <label className="block text-sm font-bold text-slate-800 mb-2">
        Chỉnh sửa lại nội dung đánh giá
      </label>
      <StarRating value={rating} onChange={setRating} showLabel={true} size={22} />
    </div>
    <textarea
      rows="3"
      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none bg-slate-50 text-sm"
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      placeholder="Chia sẻ trải nghiệm của bạn..."
    />
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
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
);

const ReviewSection = ({ facilityId, onReviewChanged }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // check customer có đánh giá chưa
  const effectiveUserReview = myReview || (user
    ? reviews.find(r => String(r.customer_id) === String(user.id))
    : null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const fetchReviews = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await reviewService.getReviewsByFacilityId(facilityId);
      if (res.success) {
        setReviews(res.data);
      }
      if (user && user?.role?.name === 'CUSTOMER') {
        try {
          const myRes = await reviewService.getMyReview(facilityId);
          if (myRes.success) {
            setMyReview(myRes.data || null);
          }
        } catch {
        }
      } else {
        setMyReview(null);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách review:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [facilityId, user]);

  useEffect(() => {
    fetchReviews(true);
  }, [fetchReviews]);

  useEffect(() => {
    if (!socket) return;

    const handleReviewChange = () => {
      fetchReviews(false);
      onReviewChanged?.();
    };

    socket.on('review_updated', handleReviewChange);

    return () => {
      socket.off('review_updated', handleReviewChange);
    };
  }, [socket, fetchReviews, onReviewChanged]);

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
      setRating(0);
      setComment('');
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
      onReviewChanged?.();
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
      onReviewChanged?.();
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
      setReviews(prev => prev.filter(r => r.id !== deleteConfirmId));
      if (myReview?.id === deleteConfirmId) {
        setMyReview(null);
      }
      setDeleteConfirmId(null);
      setToastInfo({ message: 'Xóa đánh giá thành công!', type: 'success' });
      await fetchReviews(false);
      onReviewChanged?.();
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
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${effectiveUserReview.is_flagged
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
            <EditReviewForm
              rating={editRating}
              setRating={setEditRating}
              comment={editComment}
              setComment={setEditComment}
              onCancel={() => setEditingId(null)}
              onSubmit={handleUpdate}
              submitting={submitting}
            />
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

      {/* CHỈ HIỆN THỊ NẾU CHƯA REVIEW NẾU ĐÃ ĐÁNH GIÁ HOẶC ĐANG CHỜ DUYỆT THÌ ẨN HOÀN TOÀN) */}
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

              {/* CHẾ ĐỘ CHỈNH SỬA*/}
              {editingId === review.id ? (
                <EditReviewForm
                  rating={editRating}
                  setRating={setEditRating}
                  comment={editComment}
                  setComment={setEditComment}
                  onCancel={() => setEditingId(null)}
                  onSubmit={handleUpdate}
                  submitting={submitting}
                />
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

                    {/* nút hiện nếu là bài của chính user) */}
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
                  {review.provider_reply && (
                    <div className="mt-3 ml-2 sm:ml-4 pl-3.5 border-l-2 border-teal-500 bg-teal-50/50 p-3.5 rounded-r-xl">
                      <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5 mb-1">
                        <CornerDownRight className="w-3.5 h-3.5 text-teal-600" />
                        Phản hồi từ chủ bãi xe
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {review.provider_reply}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL XÁC NHẬN XÓA DÙNG CHUNG */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={cancelDelete}
        onConfirm={handleDelete}
        title="Xóa đánh giá?"
        message="Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác."
        confirmText="Đồng ý xóa"
        cancelText="Hủy bỏ"
        type="danger"
        loading={submitting}
      />

      {/* TOAST NOTIFICATION*/}
      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default ReviewSection;
