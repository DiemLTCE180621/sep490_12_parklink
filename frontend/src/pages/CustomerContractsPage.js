import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyConfirmationRecords } from '../services/confirmationRecordService';
import SubmitComplaintModal from '../components/common/SubmitComplaintModal';
import Toast from '../components/common/Toast';
import {
  FileText,
  Calendar,
  MapPin,
  Search,
  AlertCircle,
  RefreshCw,
  Loader2,
  Eye,
  PenTool
} from 'lucide-react';

const CustomerContractsPage = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING_SIGNATURE, ACTIVE
  const [searchTerm, setSearchTerm] = useState('');

  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);
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
    navigate(`/my-contracts/${id}`);
  };

  const handleOpenComplaint = (facilityId, e) => {
    e.stopPropagation();
    setSelectedFacilityId(facilityId);
    setIsComplaintModalOpen(true);
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
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Hợp đồng điện tử của tôi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý, xem và xác nhận các hợp đồng thuê bãi đỗ xe theo tháng.
            </p>
          </div>

          <button
            onClick={fetchContracts}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* FILTER TABS & SEARCH BAR */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('PENDING_SIGNATURE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'PENDING_SIGNATURE'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Chờ xác nhận ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === 'ACTIVE'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Đang hiệu lực ({activeCount})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã hợp đồng, bãi đỗ xe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition"
            />
          </div>
        </div>

        {/* CONTRACT LIST */}
        {loading ? (
          <div className="bg-white rounded-xl p-16 text-center border border-slate-200">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600 mx-auto mb-2.5" />
            <p className="text-slate-500 text-sm">
              Đang tải danh sách hợp đồng...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-3">
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
          <div className="bg-white rounded-xl py-14 px-6 text-center border border-slate-200 space-y-2.5">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">Chưa có hợp đồng nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? 'Không tìm thấy hợp đồng phù hợp với từ khóa tìm kiếm.'
                : 'Chưa có hợp đồng điện tử nào được tạo cho bạn.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
            {filteredContracts.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item.id)}
                className="p-5 hover:bg-slate-50/70 transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.contract_code}
                    </span>
                    <span>•</span>
                    <span>Ngày lập: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    {item.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đang hiệu lực
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Chờ xác nhận
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {item.reservation?.facility?.name || 'Bãi đỗ xe'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.reservation?.facility?.address}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Thời hạn:{' '}
                        <strong className="font-medium text-slate-800">
                          {new Date(item.start_date).toLocaleDateString('vi-VN')} – {new Date(item.end_date).toLocaleDateString('vi-VN')}
                        </strong>
                      </span>
                    </span>
                  </div>
                </div>

                {/* PRICE & ACTIONS */}
                <div className="flex sm:flex-row lg:flex-row items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left lg:text-right lg:mr-2">
                    <span className="text-[11px] text-slate-400 block">Giá thuê</span>
                    <span className="text-base font-bold text-teal-700">
                      {Number(item.agreed_price || 0).toLocaleString('vi-VN')}{' '}
                      <span className="text-xs font-normal text-slate-500">đ/tháng</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'PENDING_SIGNATURE' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item.id);
                        }}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition inline-flex items-center gap-1.5"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Xem & xác nhận
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleOpenComplaint(item.reservation?.facility_id, e)}
                          className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200 transition"
                        >
                          Khiếu nại
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item.id);
                          }}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT COMPLAINT MODAL */}
      <SubmitComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => {
          setIsComplaintModalOpen(false);
          setSelectedFacilityId(null);
        }}
        facilityId={selectedFacilityId}
      />
    </div>
  );
};

export default CustomerContractsPage;
