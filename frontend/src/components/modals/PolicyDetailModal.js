import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ShieldCheck, Calendar, CheckCircle2, Check } from 'lucide-react';
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

  const localizedPolicy = useMemo(() => {
    return translateSystemPolicy(policy, i18n.language);
  }, [policy, i18n.language]);

  const sections = useMemo(() => {
    if (!localizedPolicy?.content) return [];
    return localizedPolicy.content
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [localizedPolicy]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return t('policyModal.currentStatus');
    return new Date(dateStr).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl max-w-3xl lg:max-w-4xl w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-neighbor-900 via-neighbor-800 to-neighbor-900 text-white flex items-center justify-between shrink-0 border-b border-neighbor-800">
          <div className="flex items-center gap-3.5 min-w-0 pr-4">
            <div className="w-11 h-11 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 border border-white/15 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-neighbor-200" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-bold tracking-tight text-white leading-snug truncate">
                {localizedPolicy?.title || t('policyModal.fallbackTitle')}
              </h3>
              <p className="text-xs text-neighbor-200 flex items-center gap-1.5 mt-0.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-neighbor-300 shrink-0" />
                <span>{t('policyModal.lastUpdated')} {formatDate(localizedPolicy?.updated_at)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5 text-slate-700 leading-relaxed text-sm bg-white">
          <div className="p-4 sm:p-5 rounded-2xl bg-neighbor-50 border border-neighbor-200/80 text-neighbor-900 flex items-start gap-3.5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-neighbor-100 text-neighbor-700 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-neighbor-600" />
            </div>
            <div className="space-y-0.5 text-xs sm:text-sm">
              <strong className="font-bold text-slate-900 block">{t('policyModal.noticeTitle')}</strong>
              <p className="text-slate-700 leading-relaxed">{t('policyModal.noticeBody')}</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-neighbor-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-500 text-xs font-medium">{t('policyModal.loading')}</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center text-sm font-medium">
              {error === '__LOAD_ERROR__' ? t('policyModal.loadError') : error}
            </div>
          ) : sections.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-sm">
              {t('policyModal.emptyContent')}
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, idx) => {
                const lines = section.split('\n');
                const firstLine = lines[0].trim();
                const isHeading = /^\d+\.\s+/.test(firstLine);

                if (isHeading) {
                  const headingText = firstLine;
                  const bodyLines = lines.slice(1);
                  return (
                    <div
                      key={idx}
                      className="bg-slate-50/70 hover:bg-slate-50 p-5 rounded-2xl border border-slate-200/80 transition-colors space-y-2.5"
                    >
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-neighbor-600 shrink-0 mt-2"></span>
                        <span>{headingText}</span>
                      </h4>
                      {bodyLines.length > 0 && (
                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pl-4 space-y-1">
                          {bodyLines.join('\n')}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line"
                  >
                    {section}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{t('policyModal.closeButton')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetailModal;
