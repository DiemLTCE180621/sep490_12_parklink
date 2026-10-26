import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProviderActiveCustomers } from '../../services/confirmationRecordService';
import ContractDetailModal from '../ContractDetailModal';
import Toast from '../common/Toast';
import {
  Users,
  Car,
  Clock,
  Phone,
  Mail,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  TrendingUp,
  Percent
} from 'lucide-react';

const ProviderActiveCustomersPanel = () => {
  const navigate = useNavigate();

  // State danh sách khách hàng đang hoạt động
  const [activeCustomers, setActiveCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State thống kê & phân trang
  const [summary, setSummary] = useState({
    total_active_customers: 0,
    total_matching: 0,
    total_monthly_revenue: 0,
    facility_capacity: null,
    occupied_slots: 0,
    available_slots: null,
    occupancy_rate: 0
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1
  });

  // State tìm kiếm từ khóa
  const [searchTerm, setSearchTerm] = useState('');

  // State Modal xem chi tiết hợp đồng
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // State Toast thông báo
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  // Gọi API lấy danh sách khách hàng hoạt động tại bãi
  const fetchActiveCustomers = useCallback(
    async (page = pagination.page, limit = pagination.limit, search = searchTerm) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          limit,
          search: search.trim()
        };

        const res = await getProviderActiveCustomers(params);
        const data = res.data || res;

        setActiveCustomers(data.active_customers || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.summary) setSummary(data.summary);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách khách hàng đang thuê tại bãi xe!');
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, searchTerm]
  );

  useEffect(() => {
    fetchActiveCustomers(1, pagination.limit, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchActiveCustomers(1, pagination.limit, searchTerm);
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    fetchActiveCustomers(1, pagination.limit, '');
  };

  const handleOpenDetailModal = (contractId) => {
    setSelectedContractId(contractId);
    setIsDetailModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchActiveCustomers(newPage, pagination.limit, searchTerm);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getDaysRemainingBadge = (daysRemaining, isExpired) => {
    if (isExpired || daysRemaining <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <Clock className="w-3 h-3" /> Đã hết hạn
        </span>
      );
    }

    if (daysRemaining <= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <Clock className="w-3 h-3" /> Còn {daysRemaining} ngày
        </span>
      );
    }

    if (daysRemaining <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" /> Còn {daysRemaining} ngày
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Clock className="w-3 h-3" /> Còn {daysRemaining} ngày
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Khách Hàng Đang Thuê Tại Bãi
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi danh sách khách hàng đang có hợp đồng hiệu lực (ACTIVE), phương tiện và thời hạn thuê còn lại.
          </p>
        </div>

        <button
          onClick={() => fetchActiveCustomers(pagination.page, pagination.limit, searchTerm)}
          disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-300 shadow-sm flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* KPI DASHBOARD CARDS - THIẾT KẾ ĐỒNG BỘ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Khách đang gửi xe</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_active_customers || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Hợp đồng đang hiệu lực</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Chỗ đỗ còn trống</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold text-emerald-600">
              {summary.available_slots !== null ? summary.available_slots : '---'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {summary.facility_capacity !== null ? `${summary.facility_capacity} chỗ` : '---'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Đã nhận {summary.occupied_slots || 0} xe</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Tỷ lệ lấp đầy</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.occupancy_rate || 0}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (summary.occupancy_rate || 0) >= 90
                  ? 'bg-rose-500'
                  : (summary.occupancy_rate || 0) >= 70
                  ? 'bg-amber-500'
                  : 'bg-teal-600'
              }`}
              style={{ width: `${Math.min(100, summary.occupancy_rate || 0)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>Doanh thu thuê / tháng</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-700 mt-2">
            {formatCurrency(summary.total_monthly_revenue)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Từ các khách hàng Active</p>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="text-xs text-slate-500 font-medium">
          Danh sách khách hàng đang thuê theo hợp đồng còn hiệu lực:
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, SĐT, biển số..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-16 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* DANH SÁCH KHÁCH HÀNG */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Đang tải danh sách khách hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm text-slate-700 mb-3">{error}</p>
          <button
            onClick={() => fetchActiveCustomers(pagination.page, pagination.limit, searchTerm)}
            className="px-3 py-1.5 bg-teal-600 text-white font-medium text-xs rounded-lg"
          >
            Thử lại
          </button>
        </div>
      ) : activeCustomers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800">Không tìm thấy khách hàng nào</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Không có khách hàng nào khớp với từ khóa tìm kiếm.'
              : 'Hiện chưa có khách hàng nào có hợp đồng thuê xe đang có hiệu lực (ACTIVE).'}
          </p>
          {searchTerm && (
            <button
              onClick={handleResetSearch}
              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
            >
              Xem tất cả
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activeCustomers.map((item) => {
            const customer = item.customer || {};
            const vehicle = item.vehicle || {};
            const rental = item.rental || {};

            return (
              <div
                key={item.contract_id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition"
              >
                {/* DÒNG TIÊU ĐỀ: TÊN KHÁCH HÀNG + MÃ HỢP ĐỒNG + BADGE */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-sm border border-teal-100">
                      {customer?.full_name ? customer.full_name.charAt(0).toUpperCase() : 'K'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {customer?.full_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                          {item.contract_code}
                        </span>
                        <span>• Hiệu lực: {formatDate(item.start_date)} - {formatDate(item.end_date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getDaysRemainingBadge(item.days_remaining, item.is_expired)}

                    <button
                      onClick={() => handleOpenDetailModal(item.contract_id)}
                      className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 shadow-sm transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> Xem hợp đồng
                    </button>
                  </div>
                </div>

                {/* THÔNG TIN CHI TIẾT 3 CỘT */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3">
                  {/* CỘT 1: LIÊN HỆ */}
                  <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Liên hệ
                    </span>
                    <p className="text-slate-800 font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${customer.phone_number}`} className="hover:text-teal-600">
                        {customer.phone_number || 'Chưa cập nhật SĐT'}
                      </a>
                    </p>
                    <p className="text-slate-500 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {customer.email}
                    </p>
                    {customer.id_card && customer.id_card !== 'Chưa cập nhật' && (
                      <p className="text-slate-500 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        CCCD: <span className="text-slate-700 font-medium">{customer.id_card}</span>
                      </p>
                    )}
                    {customer.address && customer.address !== 'Chưa cập nhật' && (
                      <p className="text-slate-500 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {customer.address}
                      </p>
                    )}
                  </div>

                  {/* CỘT 2: XE & VỊ TRÍ ĐỖ */}
                  <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Phương tiện & Vị trí đỗ
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {vehicle.license_plate || 'Chưa rõ biển số'}
                    </p>
                    <p className="text-slate-500">{vehicle.vehicle_type || 'Phương tiện đăng ký đỗ'}</p>
                    <p className="text-slate-600 pt-1 border-t border-slate-200/60">
                      Vị trí: <span className="font-semibold text-teal-700">{rental.parking_spot || 'Tự do'}</span>
                    </p>
                  </div>

                  {/* CỘT 3: GIÁ THUÊ & HẠN THANH TOÁN */}
                  <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Giá thuê & Thanh toán
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {formatCurrency(rental.agreed_price)} / tháng
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Hạn thu: ngày {rental.payment_deadline_day || 5} hàng tháng
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => navigate('/chat')}
                        className="w-full py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-xs transition flex items-center justify-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Nhắn tin với khách
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PHÂN TRANG */}
      {!loading && activeCustomers.length > 0 && pagination.total_pages > 1 && (
        <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-sm">
          <div>
            Hiển thị <b>{activeCustomers.length}</b> / <b>{pagination.total}</b> khách hàng
          </div>

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
        </div>
      )}

      {/* MODAL XEM CHI TIẾT */}
      {selectedContractId && (
        <ContractDetailModal
          contractId={selectedContractId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedContractId(null);
          }}
          onRefresh={() => fetchActiveCustomers(pagination.page, pagination.limit, searchTerm)}
        />
      )}
    </div>
  );
};

export default ProviderActiveCustomersPanel;
