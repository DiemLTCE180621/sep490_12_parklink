import React, { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Share2,
  Clock,
  AlertCircle,
  Loader2,
  Send
} from 'lucide-react';
import complaintService from '../../services/complaintService';

const ForwardComplaintModal = memo(({
  isOpen,
  onClose,
  complaint,
  onSuccess
}) => {
  const { t } = useTranslation('admin');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (complaint && isOpen) {
      setNote('');
      setErrorMsg(null);
    }
  }, [complaint, isOpen]);

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

    if (!note || note.trim().length < 5) {
      setErrorMsg(t('complaints.forwardModal.validation'));
      return;
    }

    try {
      setLoading(true);
      const res = await complaintService.forwardToProvider(complaint.id, {
        note: note.trim()
      });

      const updated = res.data?.complaint || res.complaint || {
        ...complaint,
        status: 'WAITING_PROVIDER'
      };

      if (onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        t('complaints.errors.forward')
      );
    } finally {
      setLoading(false);
    }
  }, [complaint, note, onSuccess, onClose, t]);

  if (!isOpen || !complaint) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fadeIn"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden transform transition-all duration-200 animate-scaleUp flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/70 via-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                {t('complaints.forwardModal.title')}
              </h3>
              <p className="text-xs text-gray-500">
                {t('complaints.forwardModal.subtitle', { id: complaint.id })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition disabled:opacity-50"
            title={t('complaints.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {}
          <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="truncate">
              <span className="text-gray-500">{t('complaints.forwardModal.facilityLabel')}</span>{' '}
              <strong className="text-gray-800">{complaint.facility?.name || t('roles.provider')}</strong>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/70 text-blue-800 font-semibold text-[11px] shrink-0 self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {t('complaints.forwardModal.deadline')}
            </div>
          </div>

          {}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-gray-700">
                {t('complaints.forwardModal.instructionLabel')} <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${note.length > 2000 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {note.length}/2000
              </span>
            </div>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('complaints.forwardModal.instructionPlaceholder')}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-gray-800 text-sm leading-relaxed transition resize-none"
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
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs sm:text-sm font-bold transition disabled:opacity-50"
            >
              {t('complaints.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !note.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('complaints.forwardModal.submitting')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('complaints.forwardModal.submit')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default ForwardComplaintModal;
