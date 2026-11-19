import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import providerService from '../../services/providerService';
import { RefreshCw } from 'lucide-react';

const currentMonth = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year').value;
  const month = parts.find((part) => part.type === 'month').value;
  return `${year}-${month}`;
};

const ProviderMonthlyRevenuePanel = () => {
  const { t, i18n } = useTranslation('provider');
  const isEnglish = i18n.language?.startsWith('en');
  const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ${t('monthlyRevenue.currency')}`;
  const date = (value) => new Date(value).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN', { timeZone: 'UTC' });
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(selectedMonth)) return;
    let active = true;
    setLoading(true);
    setError('');
    const [year, month] = selectedMonth.split('-').map(Number);
    providerService.getMonthlyRevenue(year, month)
      .then((response) => { if (active) setReport(response.data); })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || '__LOAD_ERROR__');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedMonth, refreshCount]);

  const maxRevenue = Math.max(1, ...(report?.monthly_trend || []).map((item) => item.revenue));
  const yearlyRevenue = (report?.monthly_trend || []).reduce((sum, item) => sum + item.revenue, 0);
  const [selectedYear, selectedMonthNumber] = selectedMonth.split('-').map(Number);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-200">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('monthlyRevenue.title')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('monthlyRevenue.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <span role="status" className="min-w-32 text-right text-xs text-slate-500">{loading ? t('monthlyRevenue.updating') : ''}</span>
          <button type="button" onClick={() => setRefreshCount((count) => count + 1)} disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition border border-slate-300 flex items-center gap-1.5 shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} /> {t('monthlyRevenue.refresh')}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="p-6 text-sm text-red-700">{error === '__LOAD_ERROR__' ? t('monthlyRevenue.loadError') : error}</div>}
      {report && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="p-5">
              <span className="text-xs text-slate-500 block">{t('monthlyRevenue.kpis.monthRevenue.label', { month: report.month })}</span>
              <div className="text-2xl font-bold text-teal-700 mt-1">{money(report.total_revenue)}</div>
              <p className="text-xs text-slate-400 mt-0.5">{t('monthlyRevenue.kpis.monthRevenue.hint')}</p>
            </div>
            <div className="p-5">
              <span className="text-xs text-slate-500 block">{t('monthlyRevenue.kpis.contractCount.label')}</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{report.contract_count}</div>
              <p className="text-xs text-slate-400 mt-0.5">{t('monthlyRevenue.kpis.contractCount.hint')}</p>
            </div>
            <div className="p-5">
              <span className="text-xs text-slate-500 block">{t('monthlyRevenue.kpis.avgPerContract.label')}</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{money(report.contract_count ? report.total_revenue / report.contract_count : 0)}</div>
              <p className="text-xs text-slate-400 mt-0.5">{t('monthlyRevenue.kpis.avgPerContract.hint')}</p>
            </div>
            <div className="p-5">
              <span className="text-xs text-slate-500 block">{t('monthlyRevenue.kpis.annualProjected.label', { year: selectedYear })}</span>
              <div className="text-2xl font-bold text-teal-700 mt-1">{money(yearlyRevenue)}</div>
              <p className="text-xs text-slate-400 mt-0.5">{t('monthlyRevenue.kpis.annualProjected.hint')}</p>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-900">{t('monthlyRevenue.chart.title', { year: selectedYear })}</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">{t('monthlyRevenue.chart.subtitle')}</p>
            <div className="grid h-48 grid-cols-12 items-end gap-1 sm:gap-3">
              {(report.monthly_trend || []).map((item) => (
                <button key={item.month} type="button" onClick={() => setSelectedMonth(`${selectedYear}-${String(item.month).padStart(2, '0')}`)}
                  aria-label={t('monthlyRevenue.chart.barAria', { month: item.month, amount: money(item.revenue) })}
                  title={t('monthlyRevenue.chart.barAria', { month: item.month, amount: money(item.revenue) })}
                  className="flex h-full min-w-0 flex-col items-center justify-end gap-2 group">
                  <span className={`w-full max-w-12 rounded-t-lg transition-all group-hover:bg-teal-500 ${item.month === selectedMonthNumber ? 'bg-teal-600' : 'bg-teal-200'}`}
                    style={{ height: `${Math.max(4, item.revenue / maxRevenue * 100)}%` }} />
                  <span className={`text-[10px] sm:text-xs ${item.month === selectedMonthNumber ? 'font-bold text-teal-700' : 'text-slate-500'}`}>{item.month}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="px-6 py-3.5 bg-slate-50/60 text-xs text-slate-500 font-medium">{t('monthlyRevenue.table.title', { month: report.month, year: report.year, count: report.contract_count })}</div>
          <div className="h-80 overflow-auto" aria-label={t('monthlyRevenue.table.ariaLabel')}>
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">{t('monthlyRevenue.table.columns.contract')}</th>
                  <th className="px-4 py-3">{t('monthlyRevenue.table.columns.customer')}</th>
                  <th className="px-4 py-3">{t('monthlyRevenue.table.columns.duration')}</th>
                  <th className="px-4 py-3 text-right">{t('monthlyRevenue.table.columns.monthlyAmount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.contracts.map((contract) => (
                  <tr key={contract.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{contract.contract_code}</td>
                    <td className="px-4 py-3">{contract.customer_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{date(contract.start_date)} – {date(contract.end_date)}</td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{money(contract.monthly_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.contract_count === 0 && <p className="p-8 text-center text-slate-500">{t('monthlyRevenue.table.empty')}</p>}
          </div>
          <p className="px-6 py-4 text-xs text-slate-500">{t('monthlyRevenue.table.disclaimer')}</p>
        </>
      )}
    </div>
  );
};

export default ProviderMonthlyRevenuePanel;
