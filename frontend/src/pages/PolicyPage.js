import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, CheckCircle2, ChevronRight, User, Building2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import policyService from '../services/policyService';
import { translateSystemPolicy } from '../utils/translations';

const PolicyPage = () => {
  const { t, i18n } = useTranslation('common');
  const { identifier } = useParams();
  const navigate = useNavigate();

  const [policies, setPolicies] = useState([]);
  const [activeTab, setActiveTab] = useState('CUSTOMER');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await policyService.getActivePolicies();
      const list = res?.data?.policies || [];
      setPolicies(list);

      if (!identifier && list.length > 0) {
        setActiveTab(list[0].policy_type);
      }
    } catch (err) {
      setError('__LOAD_ERROR__');
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const currentPolicy = policies.find(p => p.policy_type === activeTab) || policies[0];
  const localizedPolicy = translateSystemPolicy(currentPolicy, i18n.language);

  const formatDate = (dateStr) => {
    if (!dateStr) return t('policyPage.currentStatus');
    return new Date(dateStr).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Banner tiêu đề */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>{t('policyPage.badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {t('policyPage.title')}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              {t('policyPage.subtitle')}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-teal-200/80 shadow-sm flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <strong className="text-slate-900 font-bold block">{t('policyPage.noticeTitle')}</strong>
            <p>
              {t('policyPage.noticeBody')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-600 text-sm font-medium">{t('policyPage.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-red-100 shadow-sm space-y-3 text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p>{error === '__LOAD_ERROR__' ? t('policyPage.loadError') : error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            
            {/* Sidebar danh mục Tab chính sách */}
            <div className="md:col-span-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm space-y-1.5 sticky top-24">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 block">
                {t('policyPage.sidebarTitle')}
              </span>

              {policies.map((pol) => {
                const isActive = activeTab === pol.policy_type;
                const isCustomer = pol.policy_type === 'CUSTOMER';
                const Icon = isCustomer ? User : Building2;

                return (
                  <button
                    key={pol.id}
                    onClick={() => {
                      setActiveTab(pol.policy_type);
                      navigate(`/policies/${pol.policy_type.toLowerCase()}`);
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-between transition ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {isCustomer ? t('policyPage.tabCustomer') : t('policyPage.tabProvider')}
                      </span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* Khung nội dung chính sách tương ứng */}
            <div className="md:col-span-3 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              
              {/* Header nội dung */}
              <div className="border-b border-slate-100 pb-5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    {currentPolicy?.policy_type === 'CUSTOMER' ? t('policyPage.audienceCustomer') : t('policyPage.audienceProvider')}
                  </span>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {t('policyPage.lastUpdated')} <strong>{formatDate(localizedPolicy?.updated_at)}</strong>
                    </span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {localizedPolicy?.title}
                </h2>
              </div>

              {/* Văn bản nội dung */}
              <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {localizedPolicy?.content}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PolicyPage;
