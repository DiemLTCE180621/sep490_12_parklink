import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProviderConfirmationRecords } from '../../services/confirmationRecordService';
import Toast from '../common/Toast';
import {
  FileText,
  Calendar,
  MapPin,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
  User,
  Phone,
  Mail,
  Car,
  Eye,
  Users
} from 'lucide-react';

const ProviderContractsPanel = ({ onNavigateToActiveCustomers }) => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING_SIGNATURE, ACTIVE
  const [searchTerm, setSearchTerm] = useState('');

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
    navigate(`/contracts/${id}`);
  };

  const cleanVehicleDisplay = (rawVehicle = '') => {
    return rawVehicle.replace(/\s*\[CCCD:[^\]]+\]/i, '').trim() || 'Chưa cập nhật';
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ khách xác nhận
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đang hiệu lực
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
        {/* 1. HEADER */}
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Quản lý hợp đồng cho thuê bãi xe
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Danh sách các hợp đồng điện tử đã khởi tạo với khách thuê.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={
                onNavigateToActiveCustomers
                  ? onNavigateToActiveCustomers
                  : () => navigate('/provider/active-customers')
              }
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-medium rounded-lg border border-teal-200 transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              Khách đang thuê
            </button>

            <button
              onClick={fetchContracts}
              disabled={loading}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* 2. FILTER TABS & SEARCH BAR */}
        <div className="px-6 py-3.5 bg-slate-50/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Tất cả ({totalCount})
            </button>

            <button
              onClick={() => setActiveTab('PENDING_SIGNATURE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'PENDING_SIGNATURE'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Chờ khách xác nhận ({pendingCount})
            </button>

            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'ACTIVE'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Đang hiệu lực ({activeCount})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã HĐ, tên khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
            />
          </div>
        </div>

        {/* 3. LIST OF CONTRACTS */}
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600 mx-auto mb-2.5" />
            <p className="text-slate-500 text-sm">Đang tải danh sách hợp đồng...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Không thể tải dữ liệu</h3>
            <p className="text-sm text-slate-600">{error}</p>
            <button
              onClick={fetchContracts}
              className="px-4 py-2 bg-teal-600 text-white font-medium text-xs rounded-lg hover:bg-teal-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">Không tìm thấy hợp đồng nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Không có hợp đồng nào khớp với từ khóa tìm kiếm.'
                : 'Bạn chưa tạo hợp đồng điện tử nào cho các yêu cầu thuê được duyệt.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredContracts.map((item) => {
              const customer = item.reservation?.customer;
              const facility = item.reservation?.facility;
              const displayVehicle = cleanVehicleDisplay(item.reservation?.vehicle_info);

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item.id)}
                  className="p-6 hover:bg-slate-50/70 transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.contract_code}
                      </span>
                      <span>•</span>
                      <span>Lập ngày {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pt-1">
                      {/* CUSTOMER INFO */}
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 block">Khách thuê (Bên B)</span>
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{customer?.full_name || 'Khách hàng'}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {customer?.phone_number || 'Chưa cập nhật'}
                          </span>
                          {customer?.email && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* RENTAL INFO */}
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 block">Chi phí & thời hạn</span>
                        <p className="font-bold text-teal-700">
                          {Number(item.agreed_price).toLocaleString('vi-VN')}{' '}
                          <span className="text-xs font-normal text-slate-500">đ/tháng</span>
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(item.start_date).toLocaleDateString('vi-VN')} – {new Date(item.end_date).toLocaleDateString('vi-VN')}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Hạn thanh toán: Ngày {item.payment_deadline_day || 5} hàng tháng
                        </p>
                      </div>

                      {/* FACILITY & VEHICLE */}
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 block">Bãi đỗ & phương tiện</span>
                        <p className="font-semibold text-slate-900 truncate">
                          {facility?.name}
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                          <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{displayVehicle}</span>
                        </p>
                        <p className="text-xs text-slate-500 flex items-start gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate">{facility?.address}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="flex items-center justify-end shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(item.id);
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem hợp đồng
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderContractsPanel;
