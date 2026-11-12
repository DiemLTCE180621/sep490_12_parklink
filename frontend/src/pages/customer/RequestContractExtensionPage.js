import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Car,
  AlertCircle,
  Loader2,
  Send,
  ChevronRight,
  RotateCcw,
  Check
} from 'lucide-react';
import {
  getConfirmationRecordDetail,
  requestLeaseExtension,
  cancelLeaseExtension
} from '../../services/confirmationRecordService';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/modals/ConfirmModal';

const PRESET_OPTIONS = [
  { months: 1, label: '1 tháng', note: 'Gia hạn ngắn hạn' },
  { months: 3, label: '3 tháng', note: 'Phổ biến nhất' },
  { months: 6, label: '6 tháng', note: 'Kỳ hạn nửa năm' },
  { months: 12, label: '12 tháng', note: 'Gia hạn 1 năm' }
];

const RequestContractExtensionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  const [extensionMonths, setExtensionMonths] = useState(3);
  const [customMonths, setCustomMonths] = useState('');
  const [reason, setReason] = useState('');

  const [changeVehicle, setChangeVehicle] = useState(false);
  const [vehicleType, setVehicleType] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  const [changeContact, setChangeContact] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const safeParseSnapshot = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return raw;
  };

  const fetchContractDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getConfirmationRecordDetail(id);
      const data = res.data?.confirmation_record || res.confirmation_record;
      if (!data) {
        throw new Error('Không tìm thấy thông tin hợp đồng điện tử!');
      }
      setContract(data);

      const snapshot = safeParseSnapshot(data.contract_snapshot);
      const currentVeh = snapshot.vehicle_info || {};
      const currentCust = snapshot.customer_info || {};

      setVehicleType(currentVeh.vehicle_type || '');
      setLicensePlate(currentVeh.license_plate || '');
      setCustomerPhone(currentCust.customer_phone || data.reservation?.customer?.phone_number || '');
      setCustomerAddress(currentCust.customer_address || data.reservation?.customer?.address || '');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải thông tin hợp đồng!');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchContractDetail();
    }
  }, [id, fetchContractDetail]);

  const snapshot = safeParseSnapshot(contract?.contract_snapshot);
  const pendingExtension = snapshot.extension_request && snapshot.extension_request.status === 'PENDING'
    ? snapshot.extension_request
    : null;

  const activeMonths = customMonths ? (parseInt(customMonths, 10) || 1) : extensionMonths;
  const currentEndDate = contract?.end_date ? new Date(contract.end_date) : new Date();
  const calculatedEndDate = new Date(currentEndDate);
  calculatedEndDate.setMonth(calculatedEndDate.getMonth() + Number(activeMonths));

  const monthlyPrice = Number(contract?.reservation?.facility?.price_per_month || contract?.agreed_price || 0);
  const estimatedTotalAmount = monthlyPrice * Number(activeMonths);

  const handleSelectPreset = (months) => {
    setExtensionMonths(months);
    setCustomMonths('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setCustomMonths('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 24) {
      setCustomMonths(num.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeMonths || activeMonths < 1 || activeMonths > 24) {
      setToastInfo({ message: 'Vui lòng chọn thời gian gia hạn từ 1 đến 24 tháng!', type: 'error' });
      return;
    }

    if (changeVehicle && (!vehicleType.trim() || !licensePlate.trim())) {
      setToastInfo({ message: 'Vui lòng nhập đầy đủ Loại xe và Biển số xe mới!', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        extension_months: Number(activeMonths),
        reason: reason.trim() || undefined
      };

      if (changeVehicle) {
        payload.vehicle_type = vehicleType.trim();
        payload.license_plate = licensePlate.trim().toUpperCase();
      }

      if (changeContact) {
        if (customerPhone.trim()) payload.customer_phone = customerPhone.trim();
        if (customerAddress.trim()) payload.customer_address = customerAddress.trim();
      }

      await requestLeaseExtension(id, payload);
      setToastInfo({
        message: 'Gửi yêu cầu gia hạn hợp đồng thành công! Vui lòng chờ chủ bãi phê duyệt.',
        type: 'success'
      });
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || 'Gửi yêu cầu gia hạn thất bại!',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteCancel = async () => {
    try {
      setCancelling(true);
      await cancelLeaseExtension(id);
      setToastInfo({
        message: 'Đã hủy yêu cầu gia hạn hợp đồng thành công!',
        type: 'success'
      });
      setConfirmCancelOpen(false);
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || 'Hủy yêu cầu gia hạn thất bại!',
        type: 'error'
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-sm text-slate-500">Đang tải thông tin hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Không thể thực hiện yêu cầu</h2>
          <p className="text-xs text-slate-600">{error || 'Không tìm thấy dữ liệu hợp đồng!'}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/my-contracts')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
            >
              Về danh sách hợp đồng
            </button>
            <button
              onClick={fetchContractDetail}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (contract.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Không thể yêu cầu gia hạn</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hợp đồng này hiện ở trạng thái <strong>{contract.status === 'TERMINATED' ? 'Đã chấm dứt' : contract.status === 'PENDING_SIGNATURE' ? 'Chờ xác nhận' : contract.status}</strong>. Chỉ những hợp đồng đang có hiệu lực mới có thể gia hạn thời gian thuê.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/my-contracts')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
            >
              Quay lại danh sách hợp đồng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const facility = contract.reservation?.facility;
  const currentVeh = snapshot.vehicle_info || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />

      
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-900 transition">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/my-contracts" className="hover:text-slate-900 transition">Hợp đồng của tôi</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to={`/contracts/${id}`} className="font-mono hover:text-slate-900 transition font-medium">
              {contract.contract_code}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Gia hạn hợp đồng</span>
          </div>

          <button
            onClick={() => navigate(`/contracts/${id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại chi tiết hợp đồng
          </button>
        </div>
      </div>

      
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Gia hạn hợp đồng thuê bãi xe
              </h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {contract.contract_code}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Đang hiệu lực
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Điền thời gian gia hạn và cập nhật các thông tin xe nếu cần thay đổi cho kỳ thuê tiếp theo.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">Đơn giá hiện tại của bãi</span>
              <strong className="text-teal-700 text-sm font-bold">
                {monthlyPrice.toLocaleString('vi-VN')} đ/tháng
              </strong>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[11px]">Hạn kết thúc hiện tại</span>
              <strong className="text-slate-800 text-sm font-semibold">
                {new Date(contract.end_date).toLocaleDateString('vi-VN')}
              </strong>
            </div>
          </div>
        </div>

        
        {pendingExtension ? (
          <div className="bg-white rounded-xl border border-amber-300 overflow-hidden shadow-xs">
            <div className="p-6 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Yêu cầu gia hạn đang chờ chủ bãi phê duyệt
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-200/80 text-amber-900">
                      Chờ duyệt
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Gửi lúc {new Date(pendingExtension.requested_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(pendingExtension.requested_at).toLocaleDateString('vi-VN')}. Bạn có thể hủy yêu cầu nếu muốn thay đổi mốc thời gian khác.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmCancelOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Hủy yêu cầu này
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Thời gian xin gia hạn thêm</span>
                  <strong className="text-base font-bold text-slate-900 mt-1 block">
                    +{pendingExtension.extension_months} tháng
                  </strong>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Thời hạn mới đề xuất</span>
                  <strong className="text-base font-bold text-teal-700 mt-1 block">
                    {pendingExtension.requested_end_date ? new Date(pendingExtension.requested_end_date).toLocaleDateString('vi-VN') : '---'}
                  </strong>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Tổng chi phí dự kiến (+{pendingExtension.extension_months} thg)</span>
                  <strong className="text-base font-bold text-emerald-700 mt-1 block">
                    {Number(pendingExtension.total_estimated_amount || 0).toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              </div>

              {pendingExtension.reason && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block">Lý do từ khách hàng:</span>
                  <p className="text-slate-700 italic">"{pendingExtension.reason}"</p>
                </div>
              )}

              {pendingExtension.vehicle_info?.is_changed && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-semibold text-slate-800 block flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-slate-500" />
                    Đăng ký thay đổi phương tiện gửi bãi:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">Loại xe mới</span>
                      <strong className="text-slate-900 font-semibold">{pendingExtension.vehicle_info.vehicle_type}</strong>
                    </div>
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">Biển số mới</span>
                      <strong className="text-teal-700 font-semibold font-mono">{pendingExtension.vehicle_info.license_plate}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-8">
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Thời gian gia hạn thêm
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Chọn gói tháng định kỳ hoặc nhập số tháng linh hoạt từ 1 đến 24 tháng.
                      </p>
                    </div>

                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {PRESET_OPTIONS.map((opt) => {
                        const isSelected = !customMonths && extensionMonths === opt.months;
                        return (
                          <button
                            key={opt.months}
                            type="button"
                            onClick={() => handleSelectPreset(opt.months)}
                            className={`p-3.5 rounded-lg border text-left transition ${
                              isSelected
                                ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 text-slate-900'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-base font-bold text-slate-900">+{opt.label}</span>
                              {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">{opt.note}</span>
                          </button>
                        );
                      })}
                    </div>

                    
                    <div className="pt-1">
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Hoặc nhập số tháng tùy chọn (từ 1 đến 24 tháng)
                      </label>
                      <div className="relative max-w-xs">
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={customMonths}
                          onChange={handleCustomChange}
                          placeholder="Nhập số tháng..."
                          className="w-full pl-3 pr-16 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 transition"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          tháng
                        </span>
                      </div>
                    </div>
                  </div>

                  
                  <div className="divide-y divide-slate-100">
                    <div className="p-6 flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label htmlFor="change-vehicle-toggle" className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer block">
                          Thay đổi phương tiện gửi bãi
                        </label>
                        <p className="text-xs text-slate-500">
                          Bật nếu bạn đổi loại xe hoặc biển số xe khác cho kỳ thuê tiếp theo.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          id="change-vehicle-toggle"
                          type="checkbox"
                          checked={changeVehicle}
                          onChange={(e) => setChangeVehicle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {changeVehicle && (
                      <div className="p-6 bg-slate-50/60 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              Loại phương tiện mới <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={vehicleType}
                              onChange={(e) => setVehicleType(e.target.value)}
                              placeholder="Ví dụ: Xe 5 chỗ Sedan, SUV 7 chỗ..."
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              Biển số xe mới <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={licensePlate}
                              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                              placeholder="Ví dụ: 65A-123.45"
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 uppercase font-mono font-medium"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 italic">
                          * Chủ bãi xe sẽ kiểm tra xem kích thước và loại xe mới có phù hợp với chỗ đỗ của hợp đồng trước khi phê duyệt.
                        </p>
                      </div>
                    )}
                  </div>

                  
                  <div className="divide-y divide-slate-100">
                    <div className="p-6 flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label htmlFor="change-contact-toggle" className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer block">
                          Cập nhật số điện thoại hoặc địa chỉ liên hệ
                        </label>
                        <p className="text-xs text-slate-500">
                          Cập nhật thông tin nhận thông báo và thông tin đại diện Bên B trên phụ lục hợp đồng.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          id="change-contact-toggle"
                          type="checkbox"
                          checked={changeContact}
                          onChange={(e) => setChangeContact(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {changeContact && (
                      <div className="p-6 bg-slate-50/60 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              Số điện thoại mới
                            </label>
                            <input
                              type="text"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="Nhập số điện thoại..."
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              Địa chỉ thường trú mới
                            </label>
                            <input
                              type="text"
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              placeholder="Nhập số nhà, tên đường, phường/xã..."
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  
                  <div className="p-6 space-y-3">
                    <label className="text-xs sm:text-sm font-bold text-slate-900 block">
                      Lời nhắn gửi chủ bãi xe (Tùy chọn)
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ví dụ: Tôi tiếp tục công tác tại Cần Thơ thêm 3 tháng nên muốn gia hạn tiếp hợp đồng..."
                      className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 transition"
                    />
                    <p className="text-[11px] text-slate-400">
                      Lời nhắn sẽ được gửi kèm trong thông báo phê duyệt tới chủ bãi xe.
                    </p>
                  </div>
                </div>
              </div>

              
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-16">
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    Tóm tắt gia hạn hợp đồng
                  </h3>

                  
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 block text-[11px]">Bãi đỗ xe</span>
                    <p className="font-semibold text-slate-800">{facility?.name || 'Bãi đỗ xe'}</p>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{facility?.address}</p>
                  </div>

                  
                  <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                    <span className="text-slate-400 block text-[11px]">Phương tiện đang gửi</span>
                    <p className="font-medium text-slate-800">
                      {currentVeh.vehicle_type || 'Ô tô'}{' '}
                      <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {currentVeh.license_plate || contract.reservation?.vehicle_info || 'Chưa cập nhật'}
                      </span>
                    </p>
                  </div>

                  
                  <div className="space-y-2.5 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Thời gian gia hạn thêm:</span>
                      <strong className="text-slate-900 font-semibold">+{activeMonths} tháng</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Hạn kết thúc cũ:</span>
                      <span className="font-mono text-slate-700">{new Date(contract.end_date).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-teal-800 bg-teal-50/70 p-2.5 rounded-lg border border-teal-200">
                      <span className="font-medium">Hạn kết thúc mới:</span>
                      <strong className="font-mono text-sm font-bold text-teal-700">
                        {calculatedEndDate.toLocaleDateString('vi-VN')}
                      </strong>
                    </div>
                  </div>

                  
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Đơn giá hợp đồng:</span>
                      <span>{monthlyPrice.toLocaleString('vi-VN')} đ/tháng</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-slate-900 font-bold block text-sm">Tổng chi phí dự kiến</span>
                        <span className="text-[11px] text-slate-400">({activeMonths} tháng x {monthlyPrice.toLocaleString('vi-VN')} đ)</span>
                      </div>
                      <span className="text-xl font-bold text-teal-700">
                        {estimatedTotalAmount.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                    * Khi chủ bãi chấp thuận gia hạn, hệ thống sẽ khởi tạo hợp đồng mới theo đơn giá hiện tại của bãi xe để bạn kiểm tra và ký xác nhận (hợp đồng cũ được giữ nguyên).
                  </p>

                  
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang gửi yêu cầu...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi yêu cầu gia hạn</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/contracts/${id}`)}
                      className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      Hủy bỏ & quay lại
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      
      <ConfirmModal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={handleExecuteCancel}
        title="Xác nhận hủy yêu cầu gia hạn"
        message="Bạn có chắc chắn muốn hủy yêu cầu gia hạn đang chờ này không? Sau khi hủy, hợp đồng sẽ giữ nguyên thời hạn kết thúc cũ."
        confirmText="Hủy yêu cầu"
        cancelText="Đóng"
        type="danger"
        loading={cancelling}
      />
    </div>
  );
};

export default RequestContractExtensionPage;
