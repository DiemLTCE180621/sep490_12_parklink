import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, CheckCircle2, ChevronRight, User, Building2, AlertCircle, RefreshCw } from 'lucide-react';
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

      if (identifier) {
        const found = list.find((p) => p.policy_type?.toLowerCase() === identifier.toLowerCase());
        if (found) {
          setActiveTab(found.policy_type);
        } else if (list.length > 0) {
          setActiveTab(list[0].policy_type);
        }
      } else if (list.length > 0) {
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

  useEffect(() => {
    if (identifier && policies.length > 0) {
      const match = policies.find((p) => p.policy_type?.toLowerCase() === identifier.toLowerCase());
      if (match) {
        setActiveTab(match.policy_type);
      }
    }
  }, [identifier, policies]);

  const currentPolicy = policies.find((p) => p.policy_type === activeTab) || policies[0];
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
    <div className="min-h-screen bg-gray-50 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 w-full">
      <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto space-y-6 sm:space-y-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 lg:p-10 relative overflow-hidden">
          <div className="relative z-10 space-y-3 sm:space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neighbor-50 text-neighbor-700 text-xs font-semibold border border-neighbor-200">
              <ShieldCheck className="w-4 h-4 text-neighbor-600" />
              <span>{t('policyPage.badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {t('policyPage.title')}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              {t('policyPage.subtitle')}
            </p>
          </div>
          <div className="absolute -right-8 -bottom-10 pointer-events-none opacity-[0.03] select-none text-gray-900">
            <ShieldCheck className="w-64 h-64" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-neighbor-50/70 border border-neighbor-200 shadow-2xs flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-white text-neighbor-700 border border-neighbor-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-neighbor-600" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <strong className="text-gray-900 font-bold block">{t('policyPage.noticeTitle')}</strong>
            <p className="italic text-gray-600">
              {t('policyPage.noticeBody')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-16 text-center border border-gray-200 shadow-xs space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-neighbor-600 mx-auto" />
            <p className="text-gray-600 text-sm font-medium">{t('policyPage.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-10 text-center border border-red-200 shadow-xs space-y-3 text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="font-semibold">{error === '__LOAD_ERROR__' ? t('policyPage.loadError') : error}</p>
            <button
              onClick={fetchPolicies}
              className="px-4 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white font-medium text-xs rounded-xl shadow-xs transition"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-2 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs lg:sticky lg:top-24">
              <div className="px-2 py-1 flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t('policyPage.sidebarTitle')}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {policies.length}
                </span>
              </div>

              {policies.map((pol) => {
                const isActive = activeTab === pol.policy_type;
                const isCustomer = pol.policy_type === 'CUSTOMER';
                const Icon = isCustomer ? User : Building2;
                const label = isCustomer ? t('policyPage.tabCustomer') : t('policyPage.tabProvider');
                const subtitle = isCustomer ? 'Khách thuê xe cá nhân & đối tác' : 'Chủ bãi & đơn vị vận hành bãi xe';

                return (
                  <button
                    key={pol.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(pol.policy_type);
                      navigate(`/policies/${pol.policy_type.toLowerCase()}`);
                    }}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-neighbor-600 text-white shadow-xs'
                        : 'bg-gray-50/70 hover:bg-gray-100 text-gray-700 border border-gray-200/80 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white text-neighbor-700 border border-gray-200 shadow-2xs'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className={`block text-sm font-bold whitespace-nowrap ${isActive ? 'text-white' : 'text-gray-900'}`}>
                          {label}
                        </span>
                        <span className={`block text-xs mt-0.5 truncate ${isActive ? 'text-neighbor-100' : 'text-gray-500'}`}>
                          {subtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white translate-x-0.5' : 'text-gray-400'}`} />
                  </button>
                );
              })}
            </div>

            <div className="flex-1 w-full min-w-0 bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs space-y-6 sm:space-y-8">
              <div className="border-b border-gray-100 pb-6 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neighbor-50 text-neighbor-800 text-xs font-bold uppercase tracking-wider border border-neighbor-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-neighbor-600" />
                    {currentPolicy?.policy_type === 'CUSTOMER' ? t('policyPage.audienceCustomer') : t('policyPage.audienceProvider')}
                  </span>
                  <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                    <Calendar className="w-3.5 h-3.5 text-neighbor-600" />
                    <span>
                      {t('policyPage.lastUpdated')} <strong className="text-gray-800 font-bold">{formatDate(localizedPolicy?.updated_at)}</strong>
                    </span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
                  {localizedPolicy?.title}
                </h2>
              </div>

              <div className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal space-y-4">
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
