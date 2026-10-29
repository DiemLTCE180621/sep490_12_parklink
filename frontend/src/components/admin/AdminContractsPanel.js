import React, { useEffect, useState, useCallback } from 'react';
import { getAdminConfirmationRecords } from '../../services/confirmationRecordService';
import ContractDetailModal from '../ContractDetailModal';
import Toast from '../common/Toast';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Car,
  Calendar
} from 'lucide-react';

const AdminContractsPanel = () => {
  // State quản lý danh sách hợp đồng
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State thống kê & phân trang
  const [summary, setSummary] = useState({
    total_all: 0,
    total_active: 0,
    total_pending_signature: 0,
    total_matching: 0
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1
  });

  // State bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State Modal xem chi tiết
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Toast
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  // Gọi API lấy dữ liệu
  const fetchContracts = useCallback(
    async (
      page = pagination.page,
      limit = pagination.limit,
      status = statusFilter,
      search = searchTerm,
      start = startDate,
      end = endDate
    ) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          limit,
          search: search.trim(),
          status: status || undefined,
          start_date: start || undefined,
          end_date: end || undefined
        };

        const res = await getAdminConfirmationRecords(params);
        const data = res.data || res;

        setContracts(data.confirmation_records || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.summary) setSummary(data.summary);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách hợp đồng!');
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, statusFilter, searchTerm, startDate, endDate]
  );

  useEffect(() => {
    fetchContracts(1, pagination.limit, statusFilter, searchTerm, startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, pagination.limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchContracts(1, pagination.limit, statusFilter, searchTerm, startDate, endDate);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    fetchContracts(1, pagination.limit, '', '', '', '');
  };

  const handleOpenDetailModal = (contractId) => {
    setSelectedContractId(contractId);
    setIsDetailModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchContracts(newPage, pagination.limit, statusFilter, searchTerm, startDate, endDate);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đang hiệu lực
          </span>
        );
      case 'PENDING_SIGNATURE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Chờ khách ký
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Hết hạn
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Quản Lý Hợp Đồng Thuê
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Danh sách tất cả hợp đồng và biên bản xác nhận điện tử được lưu trữ trên hệ thống.
          </p>
        </div>

        <button
          onClick={() => fetchContracts(pagination.page, pagination.limit, statusFilter, searchTerm, startDate, endDate)}
          disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-300 shadow-sm flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* THỐNG KÊ (3 KPI CARDS - KHÔNG HIỂN THỊ DOANH THU THUÊ) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Tổng hợp đồng</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_all || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Toàn bộ trên hệ thống</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Đang hiệu lực</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.total_active || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Hợp đồng đang thực hiện</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Chờ khách ký</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{summary.total_pending_signature || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Chờ xác nhận từ người thuê</p>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã HĐ, khách hàng, bãi xe, biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-16 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
            >
              Tìm
            </button>
          </form>

          {/* Bộ lọc trạng thái & Ngày */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hiệu lực (ACTIVE)</option>
              <option value="PENDING_SIGNATURE">Chờ khách ký (PENDING)</option>
              <option value="EXPIRED">Hết hạn (EXPIRED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>

            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <button
              onClick={() => fetchContracts(1, pagination.limit, statusFilter, searchTerm, startDate, endDate)}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition"
            >
              Lọc
            </button>

            {(searchTerm || statusFilter || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-2 text-slate-500 hover:text-slate-800 font-semibold rounded-lg transition flex items-center gap-1"
                title="Đặt lại bộ lọc"
              >
                <X className="w-3.5 h-3.5" /> Xóa lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DANH SÁCH HỢP ĐỒNG - DẠNG TABLE CHUẨN DASHBOARD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500">Đang tải danh sách hợp đồng...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-rose-600 font-medium mb-3">{error}</p>
            <button
              onClick={() => fetchContracts(pagination.page, pagination.limit, statusFilter, searchTerm, startDate, endDate)}
              className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg"
            >
              Thử lại
            </button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">Không tìm thấy hợp đồng nào</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Mã Hợp Đồng</th>
                  <th scope="col" className="px-4 py-3">Khách Thuê (Bên B)</th>
                  <th scope="col" className="px-4 py-3">Bãi Đỗ Xe (Bên A)</th>
                  <th scope="col" className="px-4 py-3">Phương Tiện / Ô Đỗ</th>
                  <th scope="col" className="px-4 py-3">Thời Hạn</th>
                  <th scope="col" className="px-4 py-3">Trạng Thái</th>
                  <th scope="col" className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {contracts.map((item) => {
                  const customer = item.customer || item.reservation?.customer;
                  const facility = item.facility || item.reservation?.facility;
                  const provider = item.provider || item.reservation?.facility?.provider;
                  const vehicle = item.vehicle || {};
                  const rental = item.rental || {};

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Mã HĐ & Ngày lập */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.contract_code}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Lập: {formatDate(item.created_at)}
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {customer?.full_name || 'Khách hàng'}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{customer?.phone_number || customer?.email}</div>
                      </td>

                      {/* Bãi xe & Chủ bãi */}
                      <td className="px-4 py-3.5 max-w-[240px]">
                        <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5" title={facility?.name}>
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {facility?.name || 'Bãi đỗ xe'}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate mt-0.5" title={facility?.address}>
                          {facility?.address}
                        </div>
                        {provider?.full_name && (
                          <div className="text-[11px] text-slate-400">Chủ bãi: {provider.full_name}</div>
                        )}
                      </td>

                      {/* Xe & Vị trí đỗ */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {vehicle.license_plate || 'Chưa rõ biển số'}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Ô đỗ: <span className="font-medium text-slate-700">{rental.parking_spot || 'Tự do'}</span>
                        </div>
                      </td>

                      {/* Thời hạn */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenDetailModal(item.id)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 shadow-sm transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PHÂN TRANG */}
        {!loading && contracts.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị <b>{contracts.length}</b> / <b>{pagination.total}</b> hợp đồng (Trang <b>{pagination.page}</b> / <b>{pagination.total_pages}</b>)
            </div>

            {pagination.total_pages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Trước
                </button>

                <span className="px-2 py-1 font-semibold text-slate-700">
                  {pagination.page} / {pagination.total_pages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1"
                >
                  Sau <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedContractId && (
        <ContractDetailModal
          contractId={selectedContractId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedContractId(null);
          }}
          onRefresh={() => fetchContracts(pagination.page, pagination.limit, statusFilter, searchTerm, startDate, endDate)}
        />
      )}
    </div>
  );
};

export default AdminContractsPanel;
