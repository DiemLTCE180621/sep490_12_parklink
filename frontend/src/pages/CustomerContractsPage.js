import React, { useEffect, useState, useCallback } from 'react';
import { getMyConfirmationRecords } from '../services/confirmationRecordService';
import ContractDetailModal from '../components/ContractDetailModal';
import Toast from '../components/common/Toast';
import { Link } from 'react-router-dom';
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
  ArrowLeft,
  ShieldCheck,
  Eye,
  PenTool
} from 'lucide-react';

const CustomerContractsPage = () => {
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
      const res = await getMyConfirmationRecords();
      const list = res.data?.confirmation_records || res.confirmation_records || [];
      setContracts(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách hợp đồng điện tử của bạn!');
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
      const facilityName = item.reservation?.facility?.name?.toLowerCase() || '';
      const vehicleInfo = item.reservation?.vehicle_info?.toLowerCase() || '';
      matchesSearch = code.includes(query) || facilityName.includes(query) || vehicleInfo.includes(query);
    }

    return matchesTab && matchesSearch;
  });

  const totalCount = contracts.length;
  const pendingCount = contracts.filter((c) => c.status === 'PENDING_SIGNATURE').length;
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 w-full">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="w-full space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <Link
              to="/my-reservations"
              className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline mb-2 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Yêu cầu thuê xe của tôi
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hợp Đồng Điện Tử Của Tôi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Quản lý, xem và ký điện tử các biên bản xác nhận đăng ký thuê bãi đỗ xe theo tháng.
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
            <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Tất Cả Hợp Đồng
            </div>
            <div className="text-2xl font-black">{totalCount}</div>
          </div>

          <div
            onClick={() => setActiveTab('PENDING_SIGNATURE')}
            className={`p-5 rounded-2xl border cursor-pointer transition ${
              activeTab === 'PENDING_SIGNATURE'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                : 'bg-white text-amber-900 border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Chờ Ký / Chấp Nhận
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

        {/* TABS & SEARCH BAR */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
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
              Chờ Ký ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTab === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Đã Ký / Hiệu Lực ({activeCount})
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã hợp đồng, bãi đỗ xe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* CONTENT CONTRACT LIST */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
            <p className="text-slate-600 font-semibold text-sm">
              Đang tải danh sách hợp đồng điện tử...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-sm text-center space-y-4">
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
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Chưa có hợp đồng nào</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm
                ? 'Không tìm thấy hợp đồng phù hợp với từ khóa tìm kiếm.'
                : 'Chưa có hợp đồng điện tử nào được tạo cho bạn.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item.id)}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                        {item.contract_code}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        • Ngày lập {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div>
                      {item.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã Ký - Có Hiệu Lực
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5" /> Chờ Ký Điện Tử
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block">Bãi Đỗ Xe</span>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                        {item.reservation?.facility?.name}
                      </p>
                      <p className="text-slate-500 flex items-start gap-1 mt-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        {item.reservation?.facility?.address}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block">Thời Hạn Thuê</span>
                      <p className="font-bold text-teal-900 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        {new Date(item.start_date).toLocaleDateString('vi-VN')} - {new Date(item.end_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block">Giá Thuê / Tháng</span>
                      <p className="font-black text-teal-700 text-base mt-0.5">
                        {Number(item.agreed_price || 0).toLocaleString('vi-VN')} VNĐ/tháng
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {item.status === 'PENDING_SIGNATURE' ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(item.id);
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <PenTool className="w-4 h-4 text-slate-950" /> Xem & Ký Hợp Đồng
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(item.id);
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> Xem Chi Tiết
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONTRACT DETAIL & SIGN MODAL */}
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

export default CustomerContractsPage;
