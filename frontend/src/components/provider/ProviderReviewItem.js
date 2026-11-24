import React, { useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation('provider');
  const isEnglish = i18n.language?.startsWith('en');
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
    const error = validateReplyForm(replyText, {
      required: t('reviews.item.validation.required'),
      maxLength: t('reviews.item.validation.maxLength')
    });
    if (error) {
      setValError(error);
      return;
    }
    setValError(null);
    const success = await onReplySubmit(review.id, replyText.trim());
    if (success) {
      setIsReplying(false);
    }
  }, [replyText, review.id, onReplySubmit, t]);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200/90 shadow-sm hover:shadow-md transition-shadow space-y-4">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neighbor-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {review.customer?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm sm:text-base">
              {review.customer?.full_name || t('reviews.item.defaultCustomer')}
            </h4>
            <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(review.created_at).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN')}
              {review.facility?.name && (
                <>
                  <span>•</span>
                  <span className="text-neighbor-700 font-medium inline-flex items-center gap-1">
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

      {}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed">
        {review.comment}
      </div>

      {}
      {review.provider_reply && !isReplying && (
        <div className="ml-4 sm:ml-8 pl-4 border-l-2 border-neighbor-500 bg-neighbor-50/50 p-4 rounded-r-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neighbor-800 flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-neighbor-600" />
              {t('reviews.item.providerReplyLabel')}
            </span>
            <button
              onClick={handleStartReply}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-neighbor-700 font-medium transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              {t('reviews.item.editReply')}
            </button>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {review.provider_reply}
          </p>
        </div>
      )}

      {}
      {isReplying ? (
        <form onSubmit={handleSubmit} className="ml-4 sm:ml-8 space-y-3 pt-2">
          <div className="relative">
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('reviews.item.replyPlaceholder')}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-neighbor-500 focus:ring-1 focus:ring-neighbor-500 bg-gray-50/50 transition-all resize-y"
              autoFocus
            />
            <span className="absolute right-3 bottom-3 text-xs text-gray-400">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              {t('reviews.item.cancel')}
            </button>
            <button
              type="submit"
              disabled={isCurrentSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-neighbor-600 hover:bg-neighbor-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isCurrentSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t('reviews.item.sending')}
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {t('reviews.item.sendReply')}
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neighbor-700 hover:text-neighbor-800 bg-neighbor-50 hover:bg-neighbor-100 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              {t('reviews.item.replyAction')}
            </button>
          </div>
        )
      )}
    </div>
  );
});

export default ProviderReviewItem;

