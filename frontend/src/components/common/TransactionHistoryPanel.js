import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import transactionService from '../../services/transactionService';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const dateTime = (value) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' });
const statusLabels = { COMPLETED: 'Thành công', PENDING: 'Đang xử lý', FAILED: 'Thất bại' };
const typeLabels = { PLATFORM_FEE: 'Phí nền tảng' };

const TransactionHistoryPanel = ({ role }) => {
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
        if (!controller.signal.aborted) setError(requestError.response?.data?.message || requestError.message || 'Không tải được lịch sử giao dịch.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [role, appliedFilters, page, refresh]);

  const applyFilters = (event) => {
    event.preventDefault();
    if (filters.from && filters.to && filters.from > filters.to) {
      setError('Ngày bắt đầu không được sau ngày kết thúc.');
      return;
    }
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-200">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lịch sử giao dịch thanh toán</h2>
          <p className="text-xs text-slate-500 mt-1">{role === 'ADMIN' ? 'Theo dõi các giao dịch phí nền tảng trên hệ thống.' : 'Theo dõi các giao dịch phí nền tảng của bãi xe bạn quản lý.'}</p>
        </div>
        <button type="button" onClick={() => setRefresh((value) => value + 1)} disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 flex items-center gap-1.5 self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200">
        <div className="p-5">
          <span className="text-xs text-slate-500">Số giao dịch</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{data?.summary.total ?? '—'}</p>
        </div>
        <div className="p-5">
          <span className="text-xs text-slate-500">Tổng thanh toán thành công</span>
          <p className="mt-1 text-2xl font-bold text-teal-700">{data ? money(data.summary.completed_amount) : '—'}</p>
        </div>
      </div>

      <form onSubmit={applyFilters} className="p-4 bg-slate-50/60 flex flex-wrap items-end gap-3 text-xs text-slate-600">
        <label>Trạng thái
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="block mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800">
            <option value="">Tất cả</option><option value="COMPLETED">Thành công</option><option value="PENDING">Đang xử lý</option><option value="FAILED">Thất bại</option>
          </select>
        </label>
        <label>Từ ngày
          <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} className="block mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800" />
        </label>
        <label>Đến ngày
          <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} className="block mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800" />
        </label>
        <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 text-white font-semibold hover:bg-teal-800">Lọc</button>
      </form>

      {error && <div role="alert" className="px-5 py-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã GD</th><th className="px-4 py-3">Thời gian</th>
              {role === 'ADMIN' && <th className="px-4 py-3">Chủ bãi</th>}
              <th className="px-4 py-3">Bãi xe</th><th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3 text-right">Số tiền</th><th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(data?.transactions || []).map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-semibold text-slate-900">#{item.id}</td>
                <td className="px-4 py-3 whitespace-nowrap">{dateTime(item.created_at)}</td>
                {role === 'ADMIN' && <td className="px-4 py-3">{item.provider_name}<span className="block text-xs text-slate-400">{item.provider_email}</span></td>}
                <td className="px-4 py-3">{item.facility_name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{typeLabels[item.transaction_type] || item.transaction_type}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">{money(item.amount)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{statusLabels[item.status] || item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data?.transactions.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Chưa có giao dịch được ghi nhận trong khoảng thời gian này.</p>}
        {loading && !data && <p className="p-8 text-center text-sm text-slate-500">Đang tải giao dịch...</p>}
      </div>
      <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{loading && data ? 'Đang cập nhật...' : `Trang ${data?.pagination.page || 1} / ${Math.max(1, data?.pagination.total_pages || 1)}`}</span>
        <div className="flex gap-2">
          <button type="button" aria-label="Trang trước" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Trang sau" onClick={() => setPage((value) => value + 1)} disabled={loading || !data || page >= data.pagination.total_pages} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryPanel;
