import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import reviewService from '../../services/reviewService';
import { validateReviewForm } from '../../validations/reviewValidation';
import StarRating from './StarRating';
import { Edit, Trash2, Send } from 'lucide-react';

const ReviewSection = ({ facilityId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewService.getReviewsByFacilityId(facilityId);
      if (res.success) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateReviewForm(rating, comment);
    if (error) {
      setErrorMsg(error);
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg('');
      await reviewService.createReview({
        facility_id: facilityId,
        rating,
        comment
      });
      // Reset form & reload
      setRating(5);
      setComment('');
      fetchReviews();
    } catch (err) {
      setErrorMsg(err.message || err.errors?.[0] || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const error = validateReviewForm(editRating, editComment);
    if (error) {
      setErrorMsg(error);
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg('');
      await reviewService.updateReview(editingId, {
        rating: editRating,
        comment: editComment
      });
      setEditingId(null);
      fetchReviews();
    } catch (err) {
      setErrorMsg(err.message || err.errors?.[0] || 'Lỗi khi cập nhật đánh giá');
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
      await reviewService.deleteReview(deleteConfirmId);
      setDeleteConfirmId(null);
      fetchReviews();
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa đánh giá');
    }
  };

  const startEdit = (review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setErrorMsg('');
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
        Đánh giá bãi đỗ xe
        <span className="bg-teal-50 text-teal-700 text-xs py-1 px-2.5 rounded-full">
          {reviews.length} đánh giá
        </span>
      </h3>

      {/* ERROR MESSAGE ALERT */}
      {errorMsg && (
        <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100">
          {errorMsg}
        </div>
      )}

      {/* CHỈ CÓ ROLE CUSTOMER MỚI ĐƯỢC PHÉP ĐÁNH */}
      {user && user?.role?.name === 'CUSTOMER' && (
        <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h4 className="font-semibold text-slate-800 mb-4">Viết đánh giá của bạn</h4>
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Đánh giá sao</label>
            <StarRating value={rating} onChange={setRating} />
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
                    <StarRating value={editRating} onChange={setEditRating} />
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
                      onClick={() => { setEditingId(null); setErrorMsg(''); }}
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
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-red-200"
                >
                  Đồng ý xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
