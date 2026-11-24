import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Calendar,
  Check,
  Eye,
  EyeOff,
  RotateCw,
  AlertTriangle
} from 'lucide-react';
import StarRating from '../common/StarRating';

const AdminReviewCard = React.memo(({
  review,
  actionLoading,
  onDismissFlag,
  onOpenUnhide,
  onOpenPermanentHide
}) => {
  const { t, i18n } = useTranslation('admin');
  const isHidden = review.status === 'HIDDEN';
  const isFlagged = Boolean(review.is_flagged);

  return (
    <div
      className={`bg-white p-5 sm:p-6 rounded-xl border shadow-sm hover:shadow-md transition-all space-y-3.5 ${
        isHidden
          ? 'border-gray-300 bg-gray-50/70 opacity-90'
          : isFlagged
            ? 'border-rose-200 ring-1 ring-rose-200'
            : 'border-gray-200/90'
      }`}
    >
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
              {review.facility?.name || t('reviews.card.facilityFallback', { id: review.facility_id })}
            </h4>
            <p className="text-xs text-gray-400 truncate max-w-md">
              {review.facility?.address || t('reviews.card.addressFallback')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {!isHidden ? (
            <button
              onClick={() => onOpenPermanentHide(review)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all disabled:opacity-50"
              title={t('reviews.card.hideTitle')}
            >
              <EyeOff className="w-3.5 h-3.5" />
              {t('reviews.card.hide')}
            </button>
          ) : (
            <>
              <button
                onClick={() => onOpenUnhide(review)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-700 border border-neighbor-200 transition-all disabled:opacity-50"
                title={t('reviews.card.unhideTitle')}
              >
                {actionLoading ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {t('reviews.card.unhide')}
              </button>

              {isFlagged && (
                <>
                  <button
                    onClick={() => onDismissFlag(review)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all disabled:opacity-50"
                    title={t('reviews.card.dismissFlagTitle')}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t('reviews.card.dismissFlag')}
                  </button>

                  <button
                    onClick={() => onOpenPermanentHide(review)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all disabled:opacity-50"
                    title={t('reviews.card.confirmViolationTitle')}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    {t('reviews.card.confirmViolation')}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
            {review.customer?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <span className="text-sm font-bold text-gray-800 block leading-tight">
              {review.customer?.full_name || t('reviews.card.defaultCustomer')}
            </span>
            <span className="text-xs text-gray-400">
              {review.customer?.email || t('reviews.card.noEmail')}
            </span>
          </div>
        </div>

        <div className="text-right">
          <StarRating value={review.rating} disabled />
          <span className="text-xs text-gray-400 inline-flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            {new Date(review.created_at).toLocaleDateString(
              i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN'
            )}
          </span>
        </div>
      </div>

      {isFlagged && (
        <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 text-gray-700 p-3 rounded-xl text-xs">
          <AlertTriangle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{t('reviews.card.reviewReason')} </span>
            <span>{review.flagged_reason || t('reviews.card.defaultReason')}</span>
          </div>
        </div>
      )}

      <div className={`p-3.5 rounded-xl border text-sm leading-relaxed ${
        isHidden
          ? 'bg-gray-100/70 border-gray-200 text-gray-500 italic'
          : 'bg-gray-50 border-gray-200 text-gray-700'
      }`}>
        {review.comment}
      </div>
    </div>
  );
});

export default AdminReviewCard;
