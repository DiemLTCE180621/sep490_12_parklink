import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Clock3,
  DollarSign,
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
  { key: 'pendingComplaints', label: 'Khiếu nại chờ tiếp nhận', icon: MessageCircle, color: 'text-rose-600 bg-rose-50' },
  { key: 'paidPlatformFees', label: 'Phí nền tảng đã thu (ước tính)', icon: DollarSign, color: 'text-teal-600 bg-teal-50', currency: true }
];

const ACTIVITY_SERIES = [
  { key: 'facilities', label: 'Bãi xe đăng ký', color: 'bg-teal-500' },
  { key: 'reservations', label: 'Yêu cầu thuê', color: 'bg-indigo-500' },
  { key: 'complaints', label: 'Khiếu nại', color: 'bg-amber-500' }
];

const formatNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('vi-VN').format(number) : '—';
};
const formatCurrency = (value) => {
  const formatted = formatNumber(value);
  return formatted === '—' ? formatted : `${formatted} VNĐ`;
};

const formatMonth = (month) => {
  const [, year, monthNumber] = month.match(/^(\d{4})-(\d{2})$/) || [];
  return year ? `${monthNumber}/${year.slice(-2)}` : month;
};

const AdminDashboardPanel = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tổng quan hệ thống</h2>
          <p className="mt-1 text-sm text-slate-500">Tình hình hoạt động hiện tại của ParkLink</p>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

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

      <div className="order-1 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm sm:grid-cols-2 xl:grid-cols-3">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, currency }) => (
          <article key={key} className={`p-4 sm:p-5 ${currency ? 'bg-teal-50/70' : 'bg-white'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="min-h-9 text-xs font-medium leading-4 text-slate-500">{label}</p>
                <p className={`mt-2 font-bold text-slate-900 ${currency ? 'text-xl' : 'text-2xl'}`}>
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

      <section className="order-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Hoạt động hệ thống</h3>
            <p className="mt-1 text-sm text-slate-500">Số phát sinh theo tháng trong 6 tháng gần nhất</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {ACTIVITY_SERIES.map((series) => (
              <span key={series.key} className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className={`h-2.5 w-2.5 rounded-sm ${series.color}`} />
                {series.label}
              </span>
            ))}
          </div>
        </div>

        {overview?.monthlyActivity?.length > 0 ? (
          (() => {
            const maxValue = Math.max(
              1,
              ...overview.monthlyActivity.flatMap((month) =>
                ACTIVITY_SERIES.map((series) => month[series.key])
              )
            );
            const axisMax = Math.ceil(maxValue / 4) * 4 || 4;

            return (
              <div className="mt-6 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
                <div className="flex h-56 flex-col justify-between pb-7 text-right text-[11px] text-slate-400" aria-hidden="true">
                  {[4, 3, 2, 1, 0].map((step) => (
                    <span key={step}>{formatNumber(Math.round((axisMax * step) / 4))}</span>
                  ))}
                </div>
                <div className="relative h-56">
                  <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((line) => (
                      <div key={line} className="border-t border-dashed border-slate-200" />
                    ))}
                  </div>
                  <div className="relative grid h-full grid-cols-6 gap-2 sm:gap-4">
                    {overview.monthlyActivity.map((month) => (
                      <div key={month.month} className="flex min-w-0 flex-col items-center">
                        <div className="flex h-[calc(100%-1.75rem)] w-full items-end justify-center gap-1 sm:gap-2">
                          {ACTIVITY_SERIES.map((series) => {
                            const value = Number(month[series.key]) || 0;
                            const barHeight = value ? Math.max((value / axisMax) * 100, 1) : 0;

                            return (
                              <div
                                key={series.key}
                                title={`${series.label}: ${formatNumber(value)}`}
                                aria-label={`${series.label}: ${formatNumber(value)}`}
                                className={`w-2.5 rounded-t-sm transition-opacity hover:opacity-75 sm:w-4 ${series.color}`}
                                style={{ height: `${barHeight}%` }}
                              />
                            );
                          })}
                        </div>
                        <span className="mt-2 text-[11px] font-medium text-slate-500">{formatMonth(month.month)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-slate-500">
            {loading ? 'Đang tải biểu đồ...' : 'Chưa có dữ liệu hoạt động trong giai đoạn này.'}
          </div>
        )}
      </section>

      <section className="order-2 rounded-2xl border border-teal-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <DollarSign className="h-5 w-5 text-teal-600" />
              Phí nền tảng đã thu (ước tính)
            </h3>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Tổng phí hệ thống ghi nhận của các bãi đã thanh toán, chia theo tháng đăng ký bãi — không phải tháng nhận tiền.
            </p>
          </div>
          <p className="shrink-0 rounded-xl bg-teal-50 px-4 py-2 text-sm font-bold text-teal-800">
            Tổng: {overview ? formatCurrency(overview.paidPlatformFees) : '—'}
          </p>
        </div>

        {overview?.monthlyActivity?.length > 0 ? (
          (() => {
            const maxValue = Math.max(
              1,
              ...overview.monthlyActivity.map((month) => Number(month.platform_fees) || 0)
            );
            const axisMax = Math.ceil(maxValue / 4) * 4 || 4;

            return (
              <div className="mt-6 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
                <div className="flex h-56 flex-col justify-between pb-7 text-right text-[11px] text-slate-400" aria-hidden="true">
                  {[4, 3, 2, 1, 0].map((step) => (
                    <span key={step}>{formatNumber(Math.round((axisMax * step) / 4))}</span>
                  ))}
                </div>
                <div className="relative h-56">
                  <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((line) => (
                      <div key={line} className="border-t border-dashed border-slate-200" />
                    ))}
                  </div>
                  <div className="relative grid h-full grid-cols-6 gap-2 sm:gap-4">
                    {overview.monthlyActivity.map((month) => {
                      const value = Number(month.platform_fees) || 0;
                      const barHeight = value ? Math.max((value / axisMax) * 100, 1) : 0;

                      return (
                        <div key={month.month} className="flex min-w-0 flex-col items-center">
                          <div className="flex h-[calc(100%-1.75rem)] w-full items-end justify-center">
                            <div
                              title={`${formatMonth(month.month)}: ${formatCurrency(value)}`}
                              aria-label={`${formatMonth(month.month)}: ${formatCurrency(value)}`}
                              className="w-7 rounded-t-md bg-teal-500 transition-colors hover:bg-teal-600 sm:w-10"
                              style={{ height: `${barHeight}%` }}
                            />
                          </div>
                          <span className="mt-2 text-[11px] font-medium text-slate-500">{formatMonth(month.month)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-slate-500">
            {loading ? 'Đang tải biểu đồ phí...' : 'Chưa có phí thanh toán trong 6 tháng gần nhất.'}
          </div>
        )}
      </section>
    </section>
  );
};

export default AdminDashboardPanel;
