import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  MessageSquareReply,
  Loader2,
  Send,
  AlertCircle
} from 'lucide-react';
import complaintService from '../../services/complaintService';
import { validateReplyComplaint } from '../../validations/complaintValidation';

const ReplyComplaintModal = memo(({
  isOpen,
  onClose,
  complaint,
  onSuccess
}) => {
  const { t } = useTranslation('provider');
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const myPreviousReply = useMemo(() => {
    if (!complaint) return null;
    const history = Array.isArray(complaint.response_history) ? complaint.response_history : [];
    return [...history].reverse().find((h) => h.sender_role === 'PROVIDER');
  }, [complaint]);

  const latestInstruction = useMemo(() => {
    if (!complaint) return null;
    const history = Array.isArray(complaint.response_history) ? complaint.response_history : [];
    return [...history].reverse().find((h) => h.action === 'FORWARDED_TO_PROVIDER' || h.sender_role === 'ADMIN');
  }, [complaint]);

  const isEditing = Boolean(myPreviousReply);

  useEffect(() => {
    if (complaint && isOpen) {
      setResponseText(myPreviousReply ? (myPreviousReply.message || '') : '');
      setErrorMsg(null);
    }
  }, [complaint, isOpen, myPreviousReply]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateReplyComplaint({
      response: responseText,
      status: 'RESOLVED'
    });

    if (!validation.isValid) {
      setErrorMsg(t(`complaints.replyModal.errors.${validation.errors.response}`));
      return;
    }

    try {
      setLoading(true);
      const res = await complaintService.replyToComplaint(complaint.id, {
        response: responseText.trim(),
        status: 'RESOLVED'
      });

      const updated = res.data?.complaint || res.data || res.complaint || {
        ...complaint,
        admin_response: responseText.trim(),
        status: 'RESOLVED'
      };

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || t('reviews.toasts.replyError'));
    } finally {
      setLoading(false);
    }
  }, [complaint, responseText, onSuccess, onClose, t]);

  if (!isOpen || !complaint) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden transform transition-all duration-200 animate-scaleUp flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center shrink-0">
              <MessageSquareReply className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                {t('complaints.replyModal.title')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('complaints.replyModal.subtitle', { id: complaint.id })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition disabled:opacity-50"
            title={t('portal.menu.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500">{t('complaints.card.customerLabel')} <strong className="text-gray-800">{complaint.customer?.full_name || t('reviews.item.defaultCustomer')}</strong></span>
              <span className="font-bold text-gray-500">#{complaint.id}</span>
            </div>
            <p className="font-bold text-gray-900 truncate">
              {complaint.title}
            </p>
          </div>

          {}
          {latestInstruction && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-0.5">
              <span className="font-semibold block text-slate-800">{t('complaints.card.adminInstruction')}</span>
              <p className="leading-relaxed line-clamp-2">{latestInstruction.message || latestInstruction.note}</p>
            </div>
          )}

          {}
          <div className="p-3 bg-neighbor-50/60 border border-neighbor-100 rounded-xl text-xs text-gray-700 flex items-center gap-2">
            <MessageSquareReply className="w-4 h-4 text-neighbor-600 shrink-0" />
            <span>{t('complaints.replyModal.notice')}</span>
          </div>

          {}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-gray-700">
                {t('complaints.replyModal.responseLabel')} <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${responseText.length > 3000 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {responseText.length}/3000
              </span>
            </div>
            <textarea
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder={t('complaints.replyModal.responsePlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neighbor-500/10 focus:border-neighbor-500 text-gray-800 text-sm leading-relaxed transition resize-none"
              disabled={loading}
              autoFocus
            />
          </div>

          {}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-xs sm:text-sm transition disabled:opacity-50"
            >
              {t('reviews.item.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !responseText.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neighbor-600 hover:bg-neighbor-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('reviews.item.sending')}
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {t(isEditing ? 'complaints.actions.updateReply' : 'complaints.actions.submitReply')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

ReplyComplaintModal.displayName = 'ReplyComplaintModal';

export default ReplyComplaintModal;
