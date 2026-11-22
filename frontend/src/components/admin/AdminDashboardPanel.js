import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Clock3,
  DollarSign,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  RefreshCw,
  Users
} from 'lucide-react';
import adminService from '../../services/adminService';

const STAT_CARDS = [
  { key: 'totalUsers', label: 'Tổng người dùng', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { key: 'activeFacilities', label: 'Bãi xe đang hoạt động', icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
  { key: 'pendingFacilities', label: 'Bãi xe đăng ký chưa được duyệt', icon: Clock3, color: 'text-amber-600 bg-amber-50' },
  { key: 'totalReservations', label: 'Tổng yêu cầu thuê', icon: CalendarDays, color: 'text-violet-600 bg-violet-50' },
  { key: 'totalContracts', label: 'Tổng hợp đồng thuê', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
  { key: 'pendingComplaints', label: 'Khiếu nại chờ tiếp nhận', icon: MessageCircle, color: 'text-rose-600 bg-rose-50' },
  { key: 'paidPlatformFees', label: 'Phí nền tảng đã thu', icon: DollarSign, color: 'text-neighbor-600 bg-neighbor-50', currency: true }
];

const ACTIVITY_SERIES = [
  { key: 'facilities', label: 'Bãi xe đăng ký', color: 'bg-neighbor-500', chartColor: '#14b8a6' },
  { key: 'reservations', label: 'Yêu cầu thuê', color: 'bg-indigo-500', chartColor: '#6366f1' },
  { key: 'contracts', label: 'Hợp đồng thuê', color: 'bg-blue-500', chartColor: '#3b82f6' },
  { key: 'complaints', label: 'Khiếu nại', color: 'bg-amber-500', chartColor: '#f59e0b' }
];

const formatNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('vi-VN').format(number) : '—';
};
const formatCurrency = (value) => {
  const formatted = formatNumber(value);
  return formatted === '—' ? formatted : `${formatted} VNĐ`;
};
const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
};
const formatMonthLabel = (month) => `T${Number(month.slice(5, 7))}`;

const AdminDashboardPanel = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedActivityKey, setSelectedActivityKey] = useState(null);
  const [selectedFeeMonth, setSelectedFeeMonth] = useState(null);
  const [feeTransactions, setFeeTransactions] = useState([]);
  const [feeDetailLoading, setFeeDetailLoading] = useState(false);
  const [feeDetailError, setFeeDetailError] = useState('');
  const [selectedFeeYear, setSelectedFeeYear] = useState('');
  const feeRequestId = useRef(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminService.getDashboardOverview();
      if (response?.status !== 'success' || !response.data) {
        throw new Error('Dữ liệu tổng quan không hợp lệ.');
      }
      setOverview(response.data);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu tổng quan.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = async () => {
    try {
      setExportLoading(true);
      setExportError('');

      const blobData = await adminService.exportRevenueReport();
      const blob = new Blob([blobData], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStamp = new Date().toISOString().slice(0, 10);
      link.download = `ParkLink_Bao_Cao_Doanh_Thu_Toan_Bo_${dateStamp}.xls`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      setExportError(err.message || 'Lỗi khi xuất file báo cáo doanh thu.');
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const loadFeeTransactions = async (month) => {
    const requestId = feeRequestId.current + 1;
    feeRequestId.current = requestId;
    setSelectedFeeMonth(month);
    setFeeTransactions([]);
    setFeeDetailError('');
    setFeeDetailLoading(true);

    try {
      const response = await adminService.getDashboardPlatformFeeTransactionsByMonth(month);
      if (response?.status !== 'success' || !Array.isArray(response.data)) {
        throw new Error('Dữ liệu giao dịch tháng không hợp lệ.');
      }
      if (requestId === feeRequestId.current) setFeeTransactions(response.data);
    } catch (err) {
      if (requestId === feeRequestId.current) {
        setFeeDetailError(err.message || 'Không thể tải lịch sử giao dịch tháng này.');
      }
    } finally {
      if (requestId === feeRequestId.current) setFeeDetailLoading(false);
    }
  };

  const selectedFeeTotal = feeTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const platformFeeMonths = overview?.platformFeeMonths || [];
  const currentYear = String(new Date().getFullYear());
  const feeYears = Array.from(new Set([
    currentYear,
    ...platformFeeMonths.map(({ month }) => month.slice(0, 4))
  ])).sort((a, b) => Number(b) - Number(a));
  const defaultFeeYear = platformFeeMonths.length
    ? platformFeeMonths[platformFeeMonths.length - 1].month.slice(0, 4)
    : currentYear;
  const displayedFeeYear = selectedFeeYear || defaultFeeYear;
  const platformFeesByMonth = new Map(platformFeeMonths.map((month) => [month.month, Number(month.platform_fees) || 0]));
  const feeChartMonths = Array.from({ length: 12 }, (_, index) => {
    const month = `${displayedFeeYear}-${String(index + 1).padStart(2, '0')}`;
    return { month, platform_fees: platformFeesByMonth.get(month) || 0 };
  });
  const activityTotals = ACTIVITY_SERIES.map((series) => ({
    ...series,
    value: (overview?.monthlyActivity || []).reduce(
      (total, month) => total + (Number(month[series.key]) || 0),
      0
    )
  }));
  const totalActivity = activityTotals.reduce((total, series) => total + series.value, 0);
  let activityPercentage = 0;
  const activitySlices = activityTotals
    .filter((series) => series.value > 0)
    .map((series) => {
      const start = activityPercentage;
      activityPercentage += (series.value / totalActivity) * 100;

      return {
        ...series,
        start,
        end: activityPercentage,
        percentage: Math.round((series.value / totalActivity) * 100)
      };
    });
  const activityGradient = activitySlices.length
    ? `conic-gradient(${activitySlices.map((slice) => `${slice.chartColor} ${slice.start}% ${slice.end}%`).join(', ')})`
    : 'conic-gradient(#e2e8f0 0% 100%)';
  const selectedActivity = activityTotals.find((series) => series.key === selectedActivityKey);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('admin:dashboard.title', 'Tổng quan hệ thống')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('admin:dashboard.subtitle', 'Tình hình hoạt động hiện tại của ParkLink')}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-neighbor-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neighbor-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileSpreadsheet className={`h-4 w-4 ${exportLoading ? 'animate-bounce' : ''}`} />
            {exportLoading ? t('admin:dashboard.exporting', 'Đang xuất file...') : t('admin:dashboard.exportBtn', 'Xuất báo cáo tổng quan')}
          </button>
          <button
            type="button"
            onClick={loadOverview}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {exportError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {exportError}
          </span>
          <button type="button" onClick={() => setExportError('')} className="shrink-0 font-semibold underline">
            Đóng
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <button type="button" onClick={loadOverview} className="shrink-0 font-semibold underline">
            Thử lại
          </button>
        </div>
      )}

      <div className="order-1 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, currency }) => (
          <article key={key} className={`p-4 sm:p-5 ${currency ? 'bg-neighbor-50/70' : 'bg-white'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="min-h-9 text-xs font-medium leading-4 text-gray-500">{t(`admin:dashboard.statCards.${key}`, label)}</p>
                <p className={`mt-2 font-bold text-gray-900 ${currency ? 'text-xl' : 'text-2xl'}`}>
                  {overview ? (currency ? formatCurrency(overview[key]) : formatNumber(overview[key])) : '—'}
                </p>
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="order-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Hoạt động hệ thống</h3>
            <p className="mt-1 text-sm text-gray-500">Tỷ trọng 6 tháng gần nhất · Chọn loại để xem số liệu ở giữa</p>
          </div>
        </div>

        {overview?.monthlyActivity?.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 items-center gap-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:justify-center">
            <div
              role="img"
              aria-label={selectedActivity
                ? `${selectedActivity.label}: ${totalActivity ? Math.round((selectedActivity.value / totalActivity) * 100) : 0}%`
                : `Tổng ${formatNumber(totalActivity)} hoạt động trong 6 tháng gần nhất`}
              className="relative mx-auto h-44 w-44 rounded-full"
              style={{ backgroundImage: activityGradient }}
            >
              <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full border border-white/70 bg-white text-center shadow-sm transition-all">
                {selectedActivity ? (
                  <>
                    <span className="text-2xl font-extrabold text-gray-900">
                      {totalActivity ? `${Math.round((selectedActivity.value / totalActivity) * 100)}%` : '0%'}
                    </span>
                    <span className="mt-1 px-2 text-xs font-semibold text-gray-700">{selectedActivity.label}</span>
                    <span className="mt-0.5 text-[11px] text-gray-500">
                      {formatNumber(selectedActivity.value)} phát sinh
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold text-gray-900">{formatNumber(totalActivity)}</span>
                    <span className="mt-1 text-xs font-medium text-gray-500">Tổng hoạt động</span>
                  </>
                )}
              </div>
            </div>
            <div className="grid gap-2 sm:max-w-md">
              {activityTotals.map((series) => {
                const percentage = totalActivity ? Math.round((series.value / totalActivity) * 100) : 0;
                const isSelected = selectedActivityKey === series.key;

                return (
                  <button
                    key={series.key}
                    type="button"
                    onClick={() => setSelectedActivityKey(isSelected ? null : series.key)}
                    aria-pressed={isSelected}
                    className={`flex items-center justify-between gap-4 rounded-xl border-2 px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neighbor-600 focus-visible:ring-offset-2 ${isSelected ? 'bg-gray-50 shadow-sm' : 'border-transparent bg-white hover:bg-gray-50'}`}
                    style={{ borderColor: isSelected ? series.chartColor : undefined }}
                  >
                    <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-gray-700">
                      <span className={`h-3 w-3 shrink-0 rounded-sm ${series.color}`} />
                      <span className="truncate">{series.label}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <strong className="text-sm text-gray-900">{formatNumber(series.value)}</strong>
                      <span className="ml-2 text-xs text-gray-500">{percentage}%</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">
            {loading ? 'Đang tải biểu đồ...' : 'Chưa có dữ liệu hoạt động trong giai đoạn này.'}
          </div>
        )}
      </section>

      <section className="order-2 rounded-xl border-2 border-neighbor-200 bg-gradient-to-br from-white via-white to-neighbor-50/60 p-5 shadow-lg shadow-neighbor-100/70 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-neighbor-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neighbor-100 text-neighbor-700 ring-1 ring-neighbor-200">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Phí nền tảng đã thu
              </h3>
              <p className="mt-1 max-w-3xl text-sm leading-5 text-gray-600">
                Tổng giao dịch phí thành công, phân theo tháng thanh toán. Bấm vào cột để xem chi tiết.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-neighbor-200 bg-white/90 px-4 py-2.5 shadow-sm sm:min-w-[13rem] sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-neighbor-700">Tổng giao dịch thành công</p>
            <p className="mt-0.5 text-base font-extrabold text-neighbor-950 sm:text-lg">
              {overview ? formatCurrency(overview.paidPlatformFees) : '—'}
            </p>
          </div>
        </div>

        {overview ? (
          (() => {
            const maxValue = Math.max(
              1,
              ...feeChartMonths.map((month) => month.platform_fees)
            );
            const axisMax = feeChartMonths.some((month) => month.platform_fees > 0)
              ? Math.ceil(maxValue / 4) * 4
              : 0;

            return (
              <div className="mt-4">
                <div className="mb-2 flex flex-wrap items-center justify-end gap-3 text-[11px]">
                  <label className="flex items-center gap-2 font-semibold text-gray-600">
                    Năm
                    <select
                      value={displayedFeeYear}
                      onChange={(event) => {
                        feeRequestId.current += 1;
                        setSelectedFeeYear(event.target.value);
                        setSelectedFeeMonth(null);
                        setFeeTransactions([]);
                        setFeeDetailError('');
                        setFeeDetailLoading(false);
                      }}
                      className="rounded-lg border border-neighbor-200 bg-white px-2.5 py-1.5 text-xs font-bold text-neighbor-800 focus:outline-none focus:ring-2 focus:ring-neighbor-500"
                    >
                      {feeYears.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </label>
                </div>
                <div className="min-w-0 overflow-x-auto pb-2">
                  <div className="relative h-48 min-w-[36rem] sm:min-w-0">
                    <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((line) => (
                        <div key={line} className="border-t border-dashed border-neighbor-100" />
                      ))}
                    </div>
                    <div className="relative grid h-full grid-cols-12 gap-1 sm:gap-2">
                      {feeChartMonths.map((month) => {
                        const value = month.platform_fees;
                        const barHeight = value ? Math.max((value / axisMax) * 100, 1) : 0;

                        return (
                          <div key={month.month} className="flex min-w-0 flex-col items-center">
                            <button
                              type="button"
                              onClick={() => loadFeeTransactions(month.month)}
                              aria-pressed={selectedFeeMonth === month.month}
                              aria-label={`Tháng ${Number(month.month.slice(5, 7))} năm ${displayedFeeYear}: ${formatCurrency(value)}. Xem giao dịch`}
                              title={`Xem giao dịch tháng ${formatMonthLabel(month.month)} năm ${displayedFeeYear}`}
                              className={`flex h-full w-full flex-col items-center rounded-lg px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neighbor-600 ${selectedFeeMonth === month.month ? 'bg-neighbor-50 ring-1 ring-neighbor-200' : 'hover:bg-neighbor-50/60'}`}
                            >
                              <div className="flex h-[calc(100%-1.5rem)] w-full items-end justify-center">
                                <div className={`flex h-full w-9 items-end justify-center rounded-t-lg sm:w-12 ${selectedFeeMonth === month.month ? 'bg-neighbor-100' : 'bg-neighbor-50/80'}`}>
                                  <div
                                    className={`w-6 rounded-t-md bg-gradient-to-t from-neighbor-600 to-neighbor-400 shadow-sm transition-all hover:brightness-95 sm:w-8 ${value ? '' : 'min-h-1 bg-neighbor-200 from-neighbor-200 to-neighbor-200 shadow-none'}`}
                                    style={{ height: `${barHeight}%` }}
                                  />
                                </div>
                              </div>
                              <span className="mt-2 text-[11px] font-semibold text-gray-600">{formatMonthLabel(month.month)}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">
            {loading ? 'Đang tải biểu đồ phí...' : 'Chưa có dữ liệu phí nền tảng.'}
          </div>
        )}

        <div className="mt-4 flex h-36 flex-col rounded-xl border border-neighbor-100 bg-white p-3 sm:p-4" aria-live="polite">
          {selectedFeeMonth ? (
            <>
              <div className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-gray-200 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    Giao dịch phí nền tảng tháng {Number(selectedFeeMonth.slice(5, 7))}
                  </h4>
                  {!feeDetailLoading && !feeDetailError && (
                    <p className="mt-0.5 text-xs text-gray-500">{feeTransactions.length} giao dịch thành công</p>
                  )}
                </div>
                {!feeDetailLoading && !feeDetailError && (
                  <p className="text-sm font-extrabold text-neighbor-800">{formatCurrency(selectedFeeTotal)}</p>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {feeDetailLoading ? (
                  <p className="flex h-full items-center justify-center text-sm text-gray-500">Đang tải giao dịch...</p>
                ) : feeDetailError ? (
                  <p role="alert" className="py-3 text-sm text-red-600">{feeDetailError}</p>
                ) : feeTransactions.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-center text-sm text-gray-500">
                    Tháng này chưa có giao dịch phí nền tảng thành công.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {feeTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800">{transaction.facility_name}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.provider_name} · {formatDateTime(transaction.created_at)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-neighbor-800">+{formatCurrency(transaction.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="flex h-full items-center justify-center text-center text-sm text-gray-400">
              Bấm vào một tháng trên biểu đồ để xem giao dịch.
            </p>
          )}
        </div>
      </section>
    </section>
  );
};

export default AdminDashboardPanel;
