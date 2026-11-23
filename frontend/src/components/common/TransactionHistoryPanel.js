import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import transactionService from '../../services/transactionService';

const TransactionHistoryPanel = ({ role }) => {
  const { t, i18n } = useTranslation('provider');
  const isProviderEn = role !== 'ADMIN' && i18n.language?.startsWith('en');
  const tp = (viText, key, opts) => (role !== 'ADMIN' ? t(key, opts) : viText);
  const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ${tp('đ', 'transactions.currency')}`;
  const dateTime = (value) => new Date(value).toLocaleString(isProviderEn ? 'en-GB' : 'vi-VN', { timeZone: 'Asia/Bangkok' });
  const statusLabels = {
    COMPLETED: tp('Thành công', 'transactions.statuses.COMPLETED'),
    PENDING: tp('Đang xử lý', 'transactions.statuses.PENDING'),
    FAILED: tp('Thất bại', 'transactions.statuses.FAILED'),
  };
  const typeLabels = {
    PLATFORM_FEE: tp('Phí nền tảng', 'transactions.typeLabels.PLATFORM_FEE'),
  };
  const [filters, setFilters] = useState({ status: '', from: '', to: '' });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    transactionService.getHistory(role, { ...appliedFilters, page, limit: 10 }, controller.signal)
      .then((response) => { if (!controller.signal.aborted) setData(response.data); })
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.response?.data?.message || requestError.message || 'LOAD_ERROR');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [role, appliedFilters, page, refresh]);

  const applyFilters = (event) => {
    event.preventDefault();
    if (filters.from && filters.to && filters.from > filters.to) {
      setError(tp('Ngày bắt đầu không được sau ngày kết thúc.', 'transactions.errors.invalidDateRange'));
      return;
    }
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-200">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{tp('Lịch sử giao dịch thanh toán', 'transactions.title')}</h2>
          <p className="text-xs text-gray-500 mt-1">{role === 'ADMIN' ? 'Theo dõi các giao dịch phí nền tảng trên hệ thống.' : t('transactions.providerSubtitle')}</p>
        </div>
        <button type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg border border-gray-300 flex items-center gap-1.5 self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {tp('Làm mới', 'transactions.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-200">
        <div className="p-5">
          <span className="text-xs text-gray-500">{tp('Số giao dịch', 'transactions.kpis.totalCount')}</span>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data?.summary.total ?? '—'}</p>
        </div>
        <div className="p-5">
          <span className="text-xs text-gray-500">{tp('Tổng thanh toán thành công', 'transactions.kpis.totalPaid')}</span>
          <p className="mt-1 text-2xl font-bold text-neighbor-700">{data ? money(data.summary.completed_amount) : '—'}</p>
        </div>
      </div>

      <form onSubmit={applyFilters} className="p-4 bg-gray-50/60 flex flex-wrap items-end gap-3 text-xs text-gray-600">
        <label>{tp('Trạng thái', 'transactions.filters.statusLabel')}
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="block mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800">
            <option value="">{tp('Tất cả', 'transactions.filters.allStatuses')}</option><option value="COMPLETED">{tp('Thành công', 'transactions.statuses.COMPLETED')}</option><option value="PENDING">{tp('Đang xử lý', 'transactions.statuses.PENDING')}</option><option value="FAILED">{tp('Thất bại', 'transactions.statuses.FAILED')}</option>
          </select>
        </label>
        <label>{tp('Từ ngày', 'transactions.filters.fromDate')}
          <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} className="block mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800" />
        </label>
        <label>{tp('Đến ngày', 'transactions.filters.toDate')}
          <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} className="block mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800" />
        </label>
        <button type="submit" className="rounded-lg bg-neighbor-700 px-4 py-2 text-white font-semibold hover:bg-neighbor-800">{tp('Lọc', 'transactions.filters.filterButton')}</button>
      </form>

      {error && <div role="alert" className="px-5 py-3 text-sm text-red-700">{error === '__LOAD_ERROR__' ? tp('Không tải được lịch sử giao dịch.', 'transactions.errors.loadFailed') : error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">{tp('Mã GD', 'transactions.table.transactionId')}</th><th className="px-4 py-3">{tp('Thời gian', 'transactions.table.paymentTime')}</th>
              {role === 'ADMIN' && <th className="px-4 py-3">Chủ bãi</th>}
              <th className="px-4 py-3">{tp('Bãi xe', 'transactions.table.facilityName')}</th><th className="px-4 py-3">{tp('Loại', 'transactions.table.transactionType')}</th>
              <th className="px-4 py-3 text-right">{tp('Số tiền', 'transactions.table.amount')}</th><th className="px-4 py-3">{tp('Trạng thái', 'transactions.table.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data?.transactions || []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-semibold text-gray-900">#{item.id}</td>
                <td className="px-4 py-3 whitespace-nowrap">{dateTime(item.created_at)}</td>
                {role === 'ADMIN' && <td className="px-4 py-3">{item.provider_name}<span className="block text-xs text-gray-400">{item.provider_email}</span></td>}
                <td className="px-4 py-3">{item.facility_name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{typeLabels[item.transaction_type] || item.transaction_type}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">{money(item.amount)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{statusLabels[item.status] || item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data?.transactions.length === 0 && <p className="p-8 text-center text-sm text-gray-500">{tp('Chưa có giao dịch được ghi nhận trong khoảng thời gian này.', 'transactions.empty')}</p>}
        {loading && !data && <p className="p-8 text-center text-sm text-gray-500">{tp('Đang tải giao dịch...', 'transactions.loading')}</p>}
      </div>
      <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs text-gray-500">
        <span>{loading && data ? tp('Đang cập nhật...', 'transactions.updating') : tp(`Trang ${data?.pagination.page || 1} / ${Math.max(1, data?.pagination.total_pages || 1)}`, 'transactions.pageLabel', { page: data?.pagination.page || 1, total: Math.max(1, data?.pagination.total_pages || 1) })}</span>
        <div className="flex gap-2">
          <button type="button" aria-label={tp('Trang trước', 'transactions.prevAria')} onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1} className="rounded-lg border border-gray-300 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label={tp('Trang sau', 'transactions.nextAria')} onClick={() => setPage((value) => value + 1)} disabled={loading || !data || page >= data.pagination.total_pages} className="rounded-lg border border-gray-300 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryPanel;
