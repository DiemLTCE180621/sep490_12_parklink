import React, { useState, useEffect, useCallback } from 'react';
import { X, ShieldCheck, Calendar, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import policyService from '../../services/policyService';
import { translateSystemPolicy } from '../../utils/translations';

const PolicyDetailModal = ({ isOpen, onClose, policyType = 'CUSTOMER' }) => {
  const { t, i18n } = useTranslation('common');
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPolicy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await policyService.getPolicyByTypeOrId(policyType);
      if (res?.data?.policy) {
        setPolicy(res.data.policy);
      }
    } catch (err) {
      setError(err?.response?.data?.message || '__LOAD_ERROR__');
    } finally {
      setLoading(false);
    }
  }, [policyType]);

  useEffect(() => {
    if (isOpen && policyType) {
      fetchPolicy();
    }
  }, [isOpen, policyType, fetchPolicy]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return t('policyModal.currentStatus');
    return new Date(dateStr).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const localizedPolicy = translateSystemPolicy(policy, i18n.language);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {localizedPolicy?.title || t('policyModal.fallbackTitle')}
              </h3>
              <p className="text-xs text-teal-300 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{t('policyModal.lastUpdated')} {formatDate(localizedPolicy?.updated_at)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-700 text-sm leading-relaxed">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-500 text-xs font-medium">{t('policyModal.loading')}</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-center text-sm">
              {error === '__LOAD_ERROR__' ? t('policyModal.loadError') : error}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Thông báo pháp lý chuẩn (Phương án 1) */}
              <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-100/80 text-teal-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{t('policyModal.noticeTitle')}</strong> {t('policyModal.noticeBody')}
                </span>
              </div>

              {/* Nội dung chính sách */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 whitespace-pre-line font-normal text-slate-800">
                {localizedPolicy?.content || t('policyModal.emptyContent')}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition"
          >
            {t('policyModal.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetailModal;
