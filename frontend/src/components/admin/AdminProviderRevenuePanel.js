import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  TrendingUp,
  Building2,
  FileText,
  Calendar,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Eye,
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react';
import adminService from '../../services/adminService';

const formatMoney = (value, locale) => `${Number(value || 0).toLocaleString(locale)} ${locale === 'en-US' ? 'VND' : 'đ'}`;
const formatDate = (val, locale) => {
  if (!val) return '';
  return new Date(val).toLocaleDateString(locale, { timeZone: 'UTC' });
};

const AdminProviderRevenuePanel = () => {
  const { t, i18n } = useTranslation('admin');
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';
  const money = (value) => formatMoney(value, locale);
  const date = (value) => formatDate(value, locale);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedFacilityId, setExpandedFacilityId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getProviderRevenueStatistics({
        year: selectedYear,
        month: selectedMonth,
        facility_id: selectedFacilityId || undefined
      });

      const payload = res?.data || res;
      setData(payload);
    } catch (err) {
      console.error('Lỗi tải thống kê doanh thu:', err);
      setError(t('providerRevenue.ui.loadError'));
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedFacilityId, t]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const maxTrendRevenue = useMemo(() => {
    if (!data?.monthly_trend?.length) return 1;
    return Math.max(1, ...data.monthly_trend.map((m) => m.revenue));
  }, [data]);

  const filteredFacilities = useMemo(() => {
    if (!data?.facilities) return [];
    if (!searchTerm.trim()) return data.facilities;
    const lower = searchTerm.trim().toLowerCase();
    return data.facilities.filter(
      (f) =>
        f.facility_name?.toLowerCase().includes(lower) ||
        f.provider_name?.toLowerCase().includes(lower) ||
        f.facility_address?.toLowerCase().includes(lower) ||
        f.provider_phone?.includes(lower)
    );
  }, [data, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredFacilities.length / itemsPerPage));

  const paginatedFacilities = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFacilities.slice(start, start + itemsPerPage);
  }, [filteredFacilities, currentPage, itemsPerPage]);

  const availableYearsList = useMemo(() => {
    if (data?.available_years?.length) {
      return data.available_years;
    }
    return [currentYear - 1, currentYear, currentYear + 1];
  }, [data, currentYear]);

  const isCurrentOrPast = !data?.summary?.is_future;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-5 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neighbor-600 to-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-neighbor-600/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  {t('providerRevenue.ui.title')}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    isCurrentOrPast
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {isCurrentOrPast ? (
                    <>
                      <CheckCircle className="w-3 h-3" /> {t('providerRevenue.ui.actualData')}
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" /> {t('providerRevenue.ui.forecastByContracts')}
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('providerRevenue.ui.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={fetchRevenueData}
              disabled={loading}
              className="px-4 py-2 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-300 transition-all flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              {t('providerRevenue.ui.refresh')}
            </button>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {t('providerRevenue.ui.reportYear')}
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neighbor-500 transition cursor-pointer"
              >
                {availableYearsList.map((yr) => (
                  <option key={yr} value={yr}>
                    {t(yr > currentYear ? 'providerRevenue.ui.yearFuture' : 'providerRevenue.ui.year', { year: yr })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {t('providerRevenue.ui.reportMonth')}
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neighbor-500 transition cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {t('providerRevenue.ui.month', { month: m, year: selectedYear })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {t('providerRevenue.ui.filterFacility')}
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedFacilityId}
                onChange={(e) => {
                  setSelectedFacilityId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neighbor-500 transition truncate cursor-pointer"
              >
                <option value="">{t('providerRevenue.ui.allFacilities', { count: data?.filter_options?.facilities?.length || 0 })}</option>
                {(data?.filter_options?.facilities || []).map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} {fac.provider_name ? `(${fac.provider_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              {t('providerRevenue.ui.searchLabel')}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('providerRevenue.ui.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neighbor-500 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {t(isCurrentOrPast ? 'providerRevenue.ui.monthRevenue' : 'providerRevenue.ui.projectedRevenue', { month: selectedMonth, year: selectedYear })}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
            {money(data?.summary?.total_revenue)}
          </div>
          <div className="mt-1.5 text-[11px] text-gray-500 flex items-center gap-1">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isCurrentOrPast ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
            />
            {isCurrentOrPast
              ? t('providerRevenue.ui.actualAmountHint')
              : t('providerRevenue.ui.forecastAmountHint')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {t('providerRevenue.ui.activeContracts')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
            {data?.summary?.total_active_contracts || 0}
            <span className="text-xs font-semibold text-gray-400 ml-1.5">{t('providerRevenue.ui.contractsUnit')}</span>
          </div>
          <div className="mt-1.5 text-[11px] text-gray-500">
            {t('providerRevenue.ui.activeContractsHint')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {t('providerRevenue.ui.earningFacilities')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-neighbor-50 text-neighbor-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight">
            {data?.summary?.facilities_with_revenue_count || 0}
            <span className="text-xs font-semibold text-gray-400 ml-1.5">
              / {t('providerRevenue.ui.facilityCount', { count: data?.summary?.total_facilities_count || 0 })}
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-gray-500">
            {t('providerRevenue.ui.activityRate')}{' '}
            {data?.summary?.total_facilities_count > 0
              ? Math.round(
                  (data.summary.facilities_with_revenue_count /
                    data.summary.total_facilities_count) *
                    100
                )
              : 0}
            %
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {t('providerRevenue.ui.averageRevenue')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-gray-900 tracking-tight text-purple-700">
            {money(data?.summary?.average_revenue_per_facility)}
          </div>
          <div className="mt-1.5 text-[11px] text-gray-500">
            {t('providerRevenue.ui.averageHint')}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-neighbor-600" />
              {t('providerRevenue.ui.chartTitle', { year: selectedYear })}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('providerRevenue.ui.chartHint')}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <span className="w-3 h-3 rounded bg-neighbor-500 inline-block" />
              <span>{t('providerRevenue.ui.actual')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 font-medium">
              <span className="w-3 h-3 rounded bg-indigo-400 inline-block" />
              <span>{t('providerRevenue.ui.future')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1.5 sm:gap-3 pt-6 pb-2 items-end min-h-[200px] border-b border-gray-200">
          {(data?.monthly_trend || []).map((item) => {
            const isSelected = item.month === selectedMonth;
            const heightPercent = Math.max(10, Math.round((item.revenue / maxTrendRevenue) * 100));

            return (
              <button
                key={item.month}
                type="button"
                onClick={() => setSelectedMonth(item.month)}
                className="group flex flex-col items-center justify-end h-full gap-2 focus:outline-none cursor-pointer"
              >
                <div
                  className={`text-[10px] font-bold transition-all truncate px-1 rounded ${
                    isSelected
                      ? 'text-neighbor-700 bg-neighbor-100/70 font-extrabold'
                      : 'text-gray-400 group-hover:text-gray-800'
                  }`}
                  title={t('providerRevenue.ui.contractTooltip', { count: item.contract_count, amount: money(item.revenue), kind: t(item.is_future ? 'providerRevenue.ui.projected' : 'providerRevenue.ui.actual') })}
                >
                  {item.revenue > 0
                    ? item.revenue >= 1000000
                      ? `${(item.revenue / 1000000).toFixed(1)}M`
                      : `${(item.revenue / 1000).toFixed(0)}k`
                    : '0'}
                </div>

                <div className="w-full max-w-[42px] bg-gray-100 rounded-t-xl overflow-hidden flex items-end h-[125px] transition group-hover:bg-gray-200">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full transition-all duration-500 rounded-t-lg ${
                      isSelected
                        ? item.is_future
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-sm'
                          : 'bg-gradient-to-t from-neighbor-600 to-emerald-400 shadow-sm'
                        : item.revenue > 0
                        ? item.is_future
                          ? 'bg-indigo-300 group-hover:bg-indigo-400'
                          : 'bg-neighbor-400 group-hover:bg-neighbor-700'
                        : 'bg-gray-200'
                    }`}
                  />
                </div>

                <span
                  className={`text-[11px] font-bold transition ${
                    isSelected
                      ? 'text-neighbor-700 font-extrabold scale-110'
                      : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                >
                  {t('providerRevenue.ui.monthShort', { month: item.month })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-neighbor-600" />
              {t('providerRevenue.ui.facilityDetails', { month: selectedMonth, year: selectedYear })}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('providerRevenue.ui.facilityList', { count: filteredFacilities.length })}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">{t('providerRevenue.ui.facility')}</th>
                <th className="py-3 px-4">{t('providerRevenue.ui.provider')}</th>
                <th className="py-3 px-4 text-center">{t('providerRevenue.ui.occupancy')}</th>
                <th className="py-3 px-4 text-center">{t('providerRevenue.ui.occupancyRate')}</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  {t(isCurrentOrPast ? 'providerRevenue.ui.monthRevenueShort' : 'providerRevenue.ui.projectedRevenueShort', { month: selectedMonth })}
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap min-w-[100px]">{t('providerRevenue.ui.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                    {t('providerRevenue.ui.empty')}
                  </td>
                </tr>
              ) : (
                paginatedFacilities.map((fac) => {
                  const isExpanded = expandedFacilityId === fac.facility_id;
                  return (
                    <React.Fragment key={fac.facility_id}>
                      <tr className="hover:bg-gray-50/70 transition group">
                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-neighbor-50 text-neighbor-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block group-hover:text-neighbor-600 transition">
                                {fac.facility_name}
                              </span>
                              <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                                {fac.facility_address || t('providerRevenue.ui.notUpdated')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {fac.provider_name}
                            </span>
                            <span className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {fac.provider_phone || t('providerRevenue.ui.notUpdated')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-gray-900 text-sm">
                            {fac.active_contracts_count}
                          </span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-600 font-medium">
                            {t('providerRevenue.ui.capacity', { count: fac.capacity })}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                fac.occupancy_rate >= 80
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : fac.occupancy_rate >= 40
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {fac.occupancy_rate}%
                            </span>
                            <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                              <div
                                style={{ width: `${Math.min(100, fac.occupancy_rate)}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${
                                  fac.occupancy_rate >= 80
                                    ? 'bg-emerald-500'
                                    : fac.occupancy_rate >= 40
                                    ? 'bg-blue-500'
                                    : 'bg-gray-400'
                                }`}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-black text-sm tracking-tight ${
                              fac.monthly_revenue > 0 ? 'text-neighbor-700' : 'text-gray-400'
                            }`}
                          >
                            {money(fac.monthly_revenue)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedFacilityId(isExpanded ? null : fac.facility_id)
                            }
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                              isExpanded
                                ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 shadow-xs'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5 text-neighbor-600 shrink-0" />
                            <span className="whitespace-nowrap">{t('providerRevenue.ui.contractCount', { count: fac.contracts?.length || 0 })}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-50/90 border-b border-gray-200">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-neighbor-600" />
                                  {t('providerRevenue.ui.facilityContracts', { name: fac.facility_name, month: selectedMonth, year: selectedYear })}
                                </h4>
                                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                  {t('providerRevenue.ui.totalContracts', { count: fac.contracts?.length || 0 })}
                                </span>
                              </div>

                              {(!fac.contracts || fac.contracts.length === 0) ? (
                                <p className="text-xs text-gray-400 italic py-2">
                                  {t('providerRevenue.ui.emptyContracts')}
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-gray-200 text-[10px] font-bold uppercase text-gray-400">
                                        <th className="py-2 px-3">{t('providerRevenue.ui.code')}</th>
                                        <th className="py-2 px-3">{t('providerRevenue.ui.customer')}</th>
                                        <th className="py-2 px-3">{t('providerRevenue.ui.phone')}</th>
                                        <th className="py-2 px-3">{t('providerRevenue.ui.contractTerm')}</th>
                                        <th className="py-2 px-3 text-right">{t('providerRevenue.ui.monthlyRent')}</th>
                                        <th className="py-2 px-3 text-center">{t('providerRevenue.ui.status')}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {fac.contracts.map((ct) => (
                                        <tr key={ct.id} className="hover:bg-gray-50/80">
                                          <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                                            {ct.contract_code}
                                          </td>
                                          <td className="py-2.5 px-3 font-semibold text-gray-800">
                                            {ct.customer_name}
                                          </td>
                                          <td className="py-2.5 px-3 text-gray-600 font-mono">
                                            {ct.customer_phone || '—'}
                                          </td>
                                          <td className="py-2.5 px-3 text-gray-600">
                                            <span className="font-medium text-gray-800">
                                              {date(ct.start_date)}
                                            </span>
                                            <span className="text-gray-400 mx-1">→</span>
                                            <span className="font-medium text-gray-800">
                                              {date(ct.end_date)}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-black text-neighbor-700">
                                            {money(ct.agreed_price)}
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            <span
                                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                ct.status === 'ACTIVE'
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                              }`}
                                            >
                                              {t(ct.status === 'ACTIVE' ? 'providerRevenue.ui.active' : 'providerRevenue.ui.terminated')}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredFacilities.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div className="text-xs text-gray-600">
              {t('providerRevenue.ui.pageSummary', { current: currentPage, total: totalPages, count: filteredFacilities.length })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold text-gray-700 shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> {t('providerRevenue.ui.previous')}
                </button>
                <div className="px-2.5 py-1 text-xs font-bold text-gray-700">
                  {currentPage} / {totalPages}
                </div>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold text-gray-700 shadow-xs cursor-pointer"
                >
                  {t('providerRevenue.ui.next')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProviderRevenuePanel;
