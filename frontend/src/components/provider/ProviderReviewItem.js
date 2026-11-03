import React, { useState, memo, useCallback } from 'react';
import StarRating from '../common/StarRating';
import { validateReplyForm } from '../../validations/reviewValidation';
import {
  Calendar,
  Building2,
  CornerDownRight,
  Send,
  Edit3,
  Loader2,
  X
} from 'lucide-react';

const ProviderReviewItem = memo(({ review, onReplySubmit, submittingId }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.provider_reply || '');
  const [valError, setValError] = useState(null);

  const isCurrentSubmitting = submittingId === review.id;

  const handleStartReply = useCallback(() => {
    setReplyText(review.provider_reply || '');
    setValError(null);
    setIsReplying(true);
  }, [review.provider_reply]);

  const handleCancelReply = useCallback(() => {
    setReplyText(review.provider_reply || '');
    setValError(null);
    setIsReplying(false);
  }, [review.provider_reply]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const error = validateReplyForm(replyText);
    if (error) {
      setValError(error);
      return;
    }
    setValError(null);
    const success = await onReplySubmit(review.id, replyText.trim());
    if (success) {
      setIsReplying(false);
    }
  }, [replyText, review.id, onReplySubmit]);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-4">
      {/* Header review */}
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

      {/* Nội dung đánh giá */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
        {review.comment}
      </div>

      {/* Khu vực phản hồi của Provider */}
      {review.provider_reply && !isReplying && (
        <div className="ml-4 sm:ml-8 pl-4 border-l-2 border-teal-500 bg-teal-50/50 p-4 rounded-r-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-teal-800 flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-teal-600" />
              Phản hồi từ chủ bãi xe
            </span>
            <button
              onClick={handleStartReply}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-teal-700 font-medium transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              Chỉnh sửa
            </button>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {review.provider_reply}
          </p>
        </div>
      )}

      {/* Form viết / sửa phản hồi */}
      {isReplying ? (
        <form onSubmit={handleSubmit} className="ml-4 sm:ml-8 space-y-3 pt-2">
          <div className="relative">
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Nhập nội dung phản hồi gửi đến khách hàng..."
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-slate-50/50 transition-all resize-y"
              autoFocus
            />
            <span className="absolute right-3 bottom-3 text-xs text-slate-400">
              {replyText.length}/1000
            </span>
          </div>

          {valError && (
            <p className="text-xs text-rose-500 font-medium">{valError}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelReply}
              disabled={isCurrentSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCurrentSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isCurrentSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Gửi phản hồi
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        !review.provider_reply && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleStartReply}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              Phản hồi đánh giá này
            </button>
          </div>
        )
      )}
    </div>
  );
});

export default ProviderReviewItem;

