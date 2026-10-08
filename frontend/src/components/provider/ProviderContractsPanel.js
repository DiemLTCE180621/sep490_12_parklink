import React, { useEffect, useState, useCallback } from 'react';
import { getProviderConfirmationRecords } from '../../services/confirmationRecordService';
import ContractDetailModal from '../ContractDetailModal';
import Toast from '../common/Toast';
import {
  FileText,
  Calendar,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
  User,
  Phone,
  Mail,
  Car,
  ShieldCheck,
  Eye
} from 'lucide-react';

const ProviderContractsPanel = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING_SIGNATURE, ACTIVE
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedContractId, setSelectedContractId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProviderConfirmationRecords();
      const list = res.data?.confirmation_records || res.confirmation_records || [];
      setContracts(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách hợp đồng điện tử!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleOpenDetail = (id) => {
    setSelectedContractId(id);
    setIsDetailOpen(true);
  };

  const filteredContracts = contracts.filter((item) => {
    let matchesTab = true;
    if (activeTab === 'PENDING_SIGNATURE') matchesTab = item.status === 'PENDING_SIGNATURE';
    else if (activeTab === 'ACTIVE') matchesTab = item.status === 'ACTIVE';

    const query = searchTerm.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      const code = item.contract_code?.toLowerCase() || '';
      const customerName = item.reservation?.customer?.full_name?.toLowerCase() || '';
      const customerPhone = item.reservation?.customer?.phone_number?.toLowerCase() || '';
      const vehicleInfo = item.reservation?.vehicle_info?.toLowerCase() || '';
      const facilityName = item.reservation?.facility?.name?.toLowerCase() || '';

      matchesSearch =
        code.includes(query) ||
        customerName.includes(query) ||
        customerPhone.includes(query) ||
        vehicleInfo.includes(query) ||
        facilityName.includes(query);
    }

    return matchesTab && matchesSearch;
  });

  const totalCount = contracts.length;
  const pendingCount = contracts.filter((c) => c.status === 'PENDING_SIGNATURE').length;
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_SIGNATURE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Chờ Khách Hàng Ký
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Ký - Có Hiệu Lực
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      {/* PANEL HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" /> Quản Lý Hợp Đồng Cho Thuê Bãi Xe
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Danh sách tất cả hợp đồng & biên bản xác nhận điện tử đã khởi tạo với khách thuê.
          </p>
        </div>

        <button
          onClick={fetchContracts}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition flex items-center gap-2 border border-slate-200 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Tải Lại Danh Sách
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Tất Cả Hợp Đồng</div>
          <div className="text-2xl font-black">{totalCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('PENDING_SIGNATURE')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeTab === 'PENDING_SIGNATURE'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-amber-900 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Chờ Khách Ký
          </div>
          <div className="text-2xl font-black">{pendingCount}</div>
        </div>

        <div
          onClick={() => setActiveTab('ACTIVE')}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            activeTab === 'ACTIVE'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white text-emerald-900 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Đã Ký - Có Hiệu Lực
          </div>
          <div className="text-2xl font-black">{activeCount}</div>
        </div>
      </div>

      {/* CONTROLS: TABS & SEARCH BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'ALL'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất Cả ({totalCount})
          </button>

          <button
            onClick={() => setActiveTab('PENDING_SIGNATURE')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'PENDING_SIGNATURE'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Chờ Khách Ký ({pendingCount})
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Đã Ký - Có Hiệu Lực ({activeCount})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã HĐ, tên khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* CONTENT LIST */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-md space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
          <p className="text-slate-600 font-semibold text-sm">Đang tải danh sách hợp đồng điện tử...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Không thể tải dữ liệu</h3>
          <p className="text-sm text-slate-600">{error}</p>
          <button
            onClick={fetchContracts}
            className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-teal-700 transition"
          >
            Thử Lại
          </button>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-md space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy hợp đồng nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? 'Không có hợp đồng nào khớp với từ khóa tìm kiếm.'
              : 'Bạn chưa tạo hợp đồng điện tử nào cho các yêu cầu thuê được duyệt.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((item) => {
            const customer = item.reservation?.customer;
            const facility = item.reservation?.facility;
            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item.id)}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md hover:shadow-lg transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-100">
                        {item.contract_code}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        • Lập ngày {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div>{getStatusBadge(item.status)}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* CUSTOMER INFO */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                        Khách Thuê (Bên B)
                      </span>
                      <p className="font-bold text-slate-900 flex items-center gap-2 text-base">
                        <User className="w-4 h-4 text-teal-600 shrink-0" />
                        {customer?.full_name || 'Khách hàng'}
                      </p>
                      <p className="text-xs text-slate-600 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {customer?.phone_number || 'Chưa cập nhật SĐT'}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {customer?.email}
                      </p>
                    </div>

                    {/* RENTAL INFO */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                        Chi Phí & Thời Hạn Hợp Đồng
                      </span>
                      <p className="font-extrabold text-teal-800 text-base">
                        {Number(item.agreed_price).toLocaleString('vi-VN')} VNĐ / tháng
                      </p>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Hiệu lực: {new Date(item.start_date).toLocaleDateString('vi-VN')} - {new Date(item.end_date).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-amber-800 font-medium">
                        Hạn thanh toán: Ngày {item.payment_deadline_day || 5} hàng tháng
                      </p>
                    </div>

                    {/* FACILITY & VEHICLE */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                        Bãi Đỗ & Phương Tiện
                      </span>
                      <p className="font-bold text-slate-900 flex items-center gap-2 truncate">
                        <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                        {facility?.name}
                      </p>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                        <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.reservation?.vehicle_info}
                      </p>
                      <p className="text-xs text-slate-500 flex items-start gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        {facility?.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(item.id);
                    }}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> Xem Văn Bản Hợp Đồng
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTRACT DETAIL MODAL */}
      <ContractDetailModal
        contractId={selectedContractId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedContractId(null);
        }}
        onRefresh={fetchContracts}
      />
    </div>
  );
};

export default ProviderContractsPanel;
