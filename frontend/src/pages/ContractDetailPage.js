import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getConfirmationRecordDetail,
  acceptConfirmationRecord,
  respondToLeaseExtension,
  confirmContractTermination,
  cancelEarlyTermination
} from '../services/confirmationRecordService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/modals/ConfirmModal';
import Toast from '../components/common/Toast';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
  Printer,
  Clock,
  RotateCcw
} from 'lucide-react';

const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [processingExtension, setProcessingExtension] = useState(false);
  const [processingTermination, setProcessingTermination] = useState(false);
  const [cancellingTermination, setCancellingTermination] = useState(false);
  const [terminationProviderNote, setTerminationProviderNote] = useState('');
  const [terminationRefund, setTerminationRefund] = useState('');
  const [error, setError] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const [customerAddress, setCustomerAddress] = useState('');
  const [customerIdCard, setCustomerIdCard] = useState('');

  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmTerminationModalOpen, setConfirmTerminationModalOpen] = useState(false);
  const [cancelTerminationModalOpen, setCancelTerminationModalOpen] = useState(false);
  const [rejectTerminationModalOpen, setRejectTerminationModalOpen] = useState(false);
  const [rejectExtensionModalOpen, setRejectExtensionModalOpen] = useState(false);

  const providerId = contract?.reservation?.facility?.provider_id || contract?.reservation?.facility?.provider?.id;
  const isProvider = user?.role?.name === 'PROVIDER' || user?.role === 'PROVIDER' || (contract && user?.id === providerId);
  const isCustomer = !isProvider;

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getConfirmationRecordDetail(id);
      const data = res.data?.confirmation_record || res.confirmation_record;
      if (!data) {
        throw new Error('Không tìm thấy thông tin hợp đồng điện tử này.');
      }
      setContract(data);
      const custInfo = data?.contract_snapshot?.customer_info || {};
      const rawVeh = data?.reservation?.vehicle_info || data?.contract_snapshot?.vehicle_info?.vehicle_info_raw || '';
      const cccdM = rawVeh.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
      const dcM = rawVeh.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);

      const parsedCccd =
        custInfo.customer_id_card && custInfo.customer_id_card !== 'Chưa cập nhật' && custInfo.customer_id_card.trim() !== ''
          ? custInfo.customer_id_card
          : cccdM ? cccdM[1].trim() : localStorage.getItem('customer_id_card') || '';

      const parsedAddress =
        custInfo.customer_address && custInfo.customer_address !== 'Chưa cập nhật' && custInfo.customer_address.trim() !== ''
          ? custInfo.customer_address
          : dcM ? dcM[1].trim() : localStorage.getItem('customer_address') || data?.reservation?.customer?.address || '';

      setCustomerAddress(parsedAddress);
      setCustomerIdCard(parsedCccd);
      if (data?.status === 'ACTIVE' || data?.customer_agreed_at) {
        setIsTermsAgreed(true);
      } else {
        setIsTermsAgreed(false);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết hợp đồng điện tử!');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id, fetchDetail]);

  const snapshot = contract?.contract_snapshot || {};
  const contractInfo = snapshot.contract_info || {};
  const ownerInfo = snapshot.owner_info || {};
  const customerInfo = snapshot.customer_info || {};
  const vehicleInfo = snapshot.vehicle_info || {};
  const rentalInfo = snapshot.rental_info || {};
  const terms = snapshot.terms_and_conditions || {};

  const isPendingSignature = contract?.status === 'PENDING_SIGNATURE';
  const isActive = contract?.status === 'ACTIVE';

  const rawVehicle = contract?.reservation?.vehicle_info || snapshot?.vehicle_info?.vehicle_info_raw || '';
  const cccdMatch = rawVehicle.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
  const dcMatch = rawVehicle.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);
  const fallbackCccd = cccdMatch ? cccdMatch[1].trim() : '';
  const fallbackAddress = dcMatch ? dcMatch[1].trim() : '';

  const displayIdCard =
    customerInfo.customer_id_card &&
      customerInfo.customer_id_card !== 'Chưa cập nhật' &&
      customerInfo.customer_id_card.trim() !== ''
      ? customerInfo.customer_id_card
      : fallbackCccd || customerIdCard || localStorage.getItem('customer_id_card') || 'Chưa cập nhật';

  const displayAddress =
    customerInfo.customer_address &&
      customerInfo.customer_address !== 'Chưa cập nhật' &&
      customerInfo.customer_address.trim() !== ''
      ? customerInfo.customer_address
      : fallbackAddress || customerAddress || localStorage.getItem('customer_address') || contract?.reservation?.customer?.address || 'Chưa cập nhật';

  const handleExecuteAccept = async () => {
    try {
      setAccepting(true);
      const payload = {
        customer_address: (displayAddress && displayAddress !== 'Chưa cập nhật') ? displayAddress : (customerAddress?.trim() || ''),
        customer_id_card: (displayIdCard && displayIdCard !== 'Chưa cập nhật') ? displayIdCard : (customerIdCard?.trim() || '')
      };
      const res = await acceptConfirmationRecord(id, payload);
      const updated = res.data?.confirmation_record || res.confirmation_record;
      setToastInfo({
        message: 'Đã xác nhận ký hợp đồng điện tử thành công! Hợp đồng chính thức có hiệu lực.',
        type: 'success'
      });
      setContract(updated);
      setConfirmModalOpen(false);
    } catch (err) {
      setToastInfo({
        message: err.message || 'Chấp nhận hợp đồng thất bại!',
        type: 'error'
      });
    } finally {
      setAccepting(false);
    }
  };

  const pendingExtension = snapshot.extension_request && snapshot.extension_request.status === 'PENDING'
    ? snapshot.extension_request
    : null;

  const pendingTermination = snapshot.termination_request && snapshot.termination_request.status === 'PENDING'
    ? snapshot.termination_request
    : null;

  const executeTermination = async (status) => {
    try {
      setProcessingTermination(true);
      const isConfirmed = status === 'CONFIRMED';

      await confirmContractTermination(id, {
        status,
        provider_note: terminationProviderNote ? terminationProviderNote.trim() : (pendingTermination?.provider_note || undefined),
        refund_amount: terminationRefund ? Number(terminationRefund) : (pendingTermination?.refund_amount !== null && pendingTermination?.refund_amount !== undefined ? Number(pendingTermination.refund_amount) : undefined)
      });

      setToastInfo({
        message: isConfirmed
          ? 'Đã xác nhận chấm dứt hợp đồng và thu hồi chỗ đỗ xe thành công!'
          : 'Đã từ chối yêu cầu chấm dứt hợp đồng của khách hàng.',
        type: 'success'
      });
      setConfirmTerminationModalOpen(false);
      setRejectTerminationModalOpen(false);
      fetchDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || 'Xử lý yêu cầu chấm dứt thất bại!',
        type: 'error'
      });
    } finally {
      setProcessingTermination(false);
    }
  };

  const handleExecuteCancelTermination = async () => {
    try {
      setCancellingTermination(true);
      await cancelEarlyTermination(id);
      setToastInfo({
        message: 'Đã hủy yêu cầu chấm dứt hợp đồng thành công! Hợp đồng tiếp tục có hiệu lực.',
        type: 'success'
      });
      setCancelTerminationModalOpen(false);
      fetchDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || 'Hủy yêu cầu chấm dứt thất bại!',
        type: 'error'
      });
    } finally {
      setCancellingTermination(false);
    }
  };

  const handleRespondExtension = async (status) => {
    if (status === 'REJECTED') {
      setRejectExtensionModalOpen(true);
      return;
    }
    await executeExtensionResponse('APPROVED');
  };

  const executeExtensionResponse = async (status) => {
    try {
      setProcessingExtension(true);
      const isApproved = status === 'APPROVED';

      const res = await respondToLeaseExtension(id, {
        status,
        provider_note: isApproved ? undefined : 'Chủ bãi không thể gia hạn thêm cho kỳ thuê này.'
      });

      const newContract = res?.data?.new_confirmation_record || res?.new_confirmation_record;

      setToastInfo({
        message: isApproved
          ? `Đã chấp thuận gia hạn và tạo hợp đồng mới ${newContract?.contract_code ? `(${newContract.contract_code})` : ''} theo giá hiện tại của bãi xe!`
          : 'Đã từ chối yêu cầu gia hạn hợp đồng.',
        type: 'success'
      });
      setRejectExtensionModalOpen(false);

      if (isApproved && newContract?.id) {
        setTimeout(() => {
          navigate(`/contracts/${newContract.id}`);
        }, 1200);
      } else {
        fetchDetail();
      }
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || 'Phản hồi yêu cầu gia hạn thất bại!',
        type: 'error'
      });
    } finally {
      setProcessingExtension(false);
    }
  };

  const contractIssueDate = contract?.created_at ? new Date(contract.created_at) : new Date();

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8 print:bg-white print:p-0 print:m-0">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="w-full max-w-[1400px] mx-auto space-y-6 print:m-0 print:p-0 print:max-w-none">
        
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4 sm:max-w-[900px] mx-auto">
          <button
            onClick={() => {
              if (isCustomer) {
                navigate('/my-contracts');
              } else {
                navigate(-1);
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {isCustomer ? 'Quay lại danh sách hợp đồng' : 'Quay lại trang trước'}
          </button>

          <div className="flex items-center gap-2.5">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Đang hiệu lực
              </span>
            ) : contract?.status === 'TERMINATED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Đã chấm dứt
              </span>
            ) : contract?.status === 'CANCELLED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Đã hủy (Hết chỗ)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Chờ xác nhận
              </span>
            )}

            {isCustomer && isActive && (
              <>
                {pendingExtension ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/extend`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-300 transition shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    Xem gia hạn
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/extend`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Gia hạn
                  </button>
                )}

                {pendingTermination ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg border border-rose-300 transition shadow-sm"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    Xem trả chỗ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 transition shadow-sm"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Chấm dứt trước hạn
                  </button>
                )}
              </>
            )}

            {isProvider && isActive && (
              <>
                {pendingTermination ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg border border-rose-300 transition shadow-sm"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    Xem chấm dứt
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 transition shadow-sm"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Chấm dứt trước hạn
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition"
              title="In văn bản hợp đồng hoặc lưu dưới dạng file PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              In / Xuất PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-16 text-center border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-slate-600 text-sm">Đang tải văn bản hợp đồng #{id}...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Không thể tải hợp đồng</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchDetail}
              className="px-4 py-2 bg-teal-600 text-white font-medium text-xs rounded-lg hover:bg-teal-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : contract ? (
          <div className="space-y-6">
            
            {isCustomer && pendingExtension && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                      Yêu cầu gia hạn hợp đồng đang chờ chủ bãi phê duyệt (+{pendingExtension.extension_months} tháng)
                    </h4>
                    <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5">
                      Thời hạn mới đề xuất: <strong>{pendingExtension.requested_end_date ? new Date(pendingExtension.requested_end_date).toLocaleDateString('vi-VN') : '---'}</strong> • Chi phí dự kiến: <strong>{Number(pendingExtension.total_estimated_amount || 0).toLocaleString('vi-VN')} đ</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/contracts/${id}/extend`)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition shrink-0 self-end sm:self-auto"
                >
                  Xem chi tiết / Hủy
                </button>
              </div>
            )}

            
            {snapshot.extension_request?.status === 'APPROVED' && snapshot.extension_request?.new_contract_id && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-teal-50 border border-teal-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4 text-teal-700" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-teal-900">
                      Đã khởi tạo hợp đồng gia hạn mới ({snapshot.extension_request.new_contract_code || `#${snapshot.extension_request.new_contract_id}`})
                    </h4>
                    <p className="text-[11px] sm:text-xs text-teal-700 mt-0.5">
                      Hợp đồng cũ này được giữ nguyên làm lịch sử đối soát. Vui lòng chuyển sang hợp đồng mới để xem và ký xác nhận!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      isCustomer
                        ? `/my-contracts/${snapshot.extension_request.new_contract_id}`
                        : `/contracts/${snapshot.extension_request.new_contract_id}`
                    )
                  }
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition shrink-0 self-end sm:self-auto"
                >
                  Xem hợp đồng mới
                </button>
              </div>
            )}

            
            {isProvider && pendingExtension && (
              <div className="print:hidden bg-white rounded-xl p-5 sm:p-6 border-2 border-amber-400 sm:max-w-[900px] mx-auto space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        Khách hàng yêu cầu gia hạn hợp đồng
                      </h4>
                      <p className="text-xs text-slate-500">
                        Vui lòng kiểm tra thông tin thay đổi và phản hồi yêu cầu của khách hàng.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                    Chờ bạn duyệt
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                  <div>
                    <span className="text-slate-500 block">Số tháng xin gia hạn:</span>
                    <strong className="text-slate-900 text-sm">+{pendingExtension.extension_months} tháng</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ngày kết thúc mới đề xuất:</span>
                    <strong className="text-teal-700 text-sm">
                      {pendingExtension.requested_end_date ? new Date(pendingExtension.requested_end_date).toLocaleDateString('vi-VN') : '---'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tổng doanh thu dự kiến (+{pendingExtension.extension_months} tháng):</span>
                    <strong className="text-emerald-700 text-sm font-bold">
                      {Number(pendingExtension.total_estimated_amount || 0).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ngày gửi yêu cầu:</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(pendingExtension.requested_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {pendingExtension.reason && (
                    <div className="sm:col-span-2 pt-2 border-t border-amber-200/60">
                      <span className="text-slate-500 block font-medium">Lý do từ khách hàng:</span>
                      <p className="text-slate-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-amber-200">
                        "{pendingExtension.reason}"
                      </p>
                    </div>
                  )}

                  
                  {pendingExtension.vehicle_info?.is_changed && (
                    <div className="sm:col-span-2 pt-2 border-t border-amber-200/60">
                      <span className="text-slate-700 font-bold block mb-1">
                        Khách hàng có đăng ký thay đổi thông tin xe:
                      </span>
                      <div className="p-2.5 bg-white rounded-lg border border-teal-200 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Loại xe mới</span>
                          <strong className="text-slate-900 font-semibold">{pendingExtension.vehicle_info.vehicle_type}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Biển số mới</span>
                          <strong className="text-teal-700 font-semibold">{pendingExtension.vehicle_info.license_plate}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={processingExtension}
                    onClick={() => handleRespondExtension('REJECTED')}
                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                  >
                    Từ chối gia hạn
                  </button>
                  <button
                    type="button"
                    disabled={processingExtension}
                    onClick={() => handleRespondExtension('APPROVED')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                  >
                    {processingExtension ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Chấp thuận & Tạo hợp đồng gia hạn mới
                  </button>
                </div>
              </div>
            )}

            
            {contract.status === 'TERMINATED' && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-3 text-xs text-slate-700 shadow-sm">
                <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Hợp đồng này đã được thanh lý & chấm dứt hiệu lực</h4>
                  <p className="text-slate-600 mt-0.5">
                    Vị trí đỗ xe đã được hoàn trả lại cho bãi xe. Văn bản hợp đồng dưới đây được lưu trữ phục vụ việc đối soát và tra cứu.
                  </p>
                </div>
              </div>
            )}

            
            {contract.status === 'CANCELLED' && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-3 text-xs text-slate-700 shadow-sm">
                <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Hợp đồng này đã tự động hủy do bãi xe hết chỗ trống</h4>
                  <p className="text-slate-600 mt-0.5">
                    Chỗ trống cuối cùng tại bãi xe đã được chủ bãi và khách hàng khác hoàn tất ký kết hợp đồng trước đó.
                  </p>
                </div>
              </div>
            )}

            
            {isCustomer && pendingTermination && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-5 bg-white border-2 border-rose-400 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-rose-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
                      <Clock className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {pendingTermination.requested_by === 'PROVIDER'
                          ? 'Chủ bãi xe đã gửi yêu cầu chấm dứt hợp đồng trước hạn'
                          : 'Yêu cầu chấm dứt hợp đồng đang chờ chủ bãi xác nhận'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pendingTermination.requested_by === 'PROVIDER'
                          ? 'Chủ bãi đã thông báo dừng thuê trước hạn. Vui lòng kiểm tra lý do, tiền hoàn trả và bàn giao lại vị trí đỗ.'
                          : 'Yêu cầu trả chỗ trước hạn của bạn đang chờ chủ bãi xe kiểm tra và xác nhận thu hồi.'}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                    {pendingTermination.requested_by === 'PROVIDER' ? 'Bên A (Chủ bãi) gửi' : 'Đang chờ xử lý'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                  <div>
                    <span className="text-slate-500 block">
                      {pendingTermination.requested_by === 'PROVIDER' ? 'Ngày dừng gửi dự kiến:' : 'Ngày đề xuất trả chỗ:'}
                    </span>
                    <strong className="text-rose-700 text-sm font-bold">
                      {pendingTermination.requested_termination_date ? new Date(pendingTermination.requested_termination_date).toLocaleDateString('vi-VN') : '---'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hạn hợp đồng ban đầu:</span>
                    <strong className="text-slate-800 text-sm font-semibold">
                      {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ngày gửi yêu cầu:</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(pendingTermination.requested_at).toLocaleDateString('vi-VN')} {new Date(pendingTermination.requested_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {pendingTermination.requested_by === 'PROVIDER' && pendingTermination.refund_amount !== null && pendingTermination.refund_amount !== undefined && (
                    <div>
                      <span className="text-slate-500 block">Số tiền chủ bãi hoàn lại (thỏa thuận):</span>
                      <strong className="text-emerald-700 font-mono text-sm font-bold">
                        {Number(pendingTermination.refund_amount).toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                  )}

                  {pendingTermination.bank_account_info && (
                    <div>
                      <span className="text-slate-500 block">Tài khoản nhận tiền hoàn lại (thỏa thuận):</span>
                      <strong className="text-slate-900 font-mono text-xs">{pendingTermination.bank_account_info}</strong>
                    </div>
                  )}

                  {pendingTermination.reason && (
                    <div className="sm:col-span-2 pt-2 border-t border-rose-200/60">
                      <span className="text-slate-500 block font-medium">
                        {pendingTermination.requested_by === 'PROVIDER' ? 'Lý do từ chủ bãi xe:' : 'Lý do từ bạn:'}
                      </span>
                      <p className="text-slate-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-rose-200">
                        "{pendingTermination.reason}"
                      </p>
                    </div>
                  )}

                  {pendingTermination.requested_by === 'PROVIDER' && pendingTermination.provider_note && (
                    <div className="sm:col-span-2 pt-2 border-t border-rose-200/60">
                      <span className="text-slate-500 block font-medium">Ghi chú hướng dẫn từ chủ bãi:</span>
                      <p className="text-slate-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-rose-200">
                        "{pendingTermination.provider_note}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {pendingTermination.requested_by === 'CUSTOMER' && (
                    <button
                      type="button"
                      disabled={cancellingTermination}
                      onClick={() => setCancelTerminationModalOpen(true)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                    >
                      {cancellingTermination ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      Hủy yêu cầu chấm dứt
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                  >
                    {pendingTermination.requested_by === 'PROVIDER' ? 'Xem chi tiết & Bàn giao chỗ' : 'Xem chi tiết'}
                  </button>
                </div>
              </div>
            )}

            
            {isProvider && pendingTermination && (
              <div className="print:hidden bg-white rounded-xl p-5 sm:p-6 border-2 border-rose-400 sm:max-w-[900px] mx-auto space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-rose-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
                      <Clock className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {pendingTermination.requested_by === 'PROVIDER'
                          ? 'Yêu cầu chấm dứt hợp đồng do bạn khởi tạo'
                          : 'Khách hàng yêu cầu chấm dứt hợp đồng & Trả chỗ trước hạn'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {pendingTermination.requested_by === 'PROVIDER'
                          ? 'Yêu cầu đã gửi tới khách hàng. Khi khách hàng di chuyển xe và bàn giao vị trí, bạn hãy xác nhận đã thu hồi chỗ đỗ.'
                          : 'Kiểm tra ngày bàn giao vị trí đỗ và thực hiện xác nhận để thanh lý hợp đồng & thu hồi lại chỗ đỗ xe.'}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                    {pendingTermination.requested_by === 'PROVIDER' ? 'Chờ thu hồi chỗ' : 'Chờ bạn xác nhận'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                  <div>
                    <span className="text-slate-500 block">
                      {pendingTermination.requested_by === 'PROVIDER' ? 'Ngày dừng gửi dự kiến:' : 'Ngày đề xuất trả chỗ:'}
                    </span>
                    <strong className="text-rose-700 text-sm font-bold">
                      {pendingTermination.requested_termination_date ? new Date(pendingTermination.requested_termination_date).toLocaleDateString('vi-VN') : '---'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hạn hợp đồng ban đầu:</span>
                    <strong className="text-slate-800 text-sm font-semibold">
                      {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ngày gửi yêu cầu:</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(pendingTermination.requested_at).toLocaleDateString('vi-VN')} {new Date(pendingTermination.requested_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {pendingTermination.bank_account_info && (
                    <div>
                      <span className="text-slate-500 block">Tài khoản nhận tiền hoàn lại (thỏa thuận):</span>
                      <strong className="text-slate-900 font-mono text-xs">{pendingTermination.bank_account_info}</strong>
                    </div>
                  )}

                  {pendingTermination.requested_by === 'PROVIDER' && pendingTermination.refund_amount !== null && pendingTermination.refund_amount !== undefined && (
                    <div>
                      <span className="text-slate-500 block">Số tiền hoàn trả dự kiến cho khách:</span>
                      <strong className="text-emerald-700 font-mono text-sm font-bold">
                        {Number(pendingTermination.refund_amount).toLocaleString('vi-VN')} đ
                      </strong>
                    </div>
                  )}

                  {pendingTermination.reason && (
                    <div className="sm:col-span-2 pt-2 border-t border-rose-200/60">
                      <span className="text-slate-500 block font-medium">
                        {pendingTermination.requested_by === 'PROVIDER' ? 'Lý do từ chủ bãi xe (Bạn):' : 'Lý do từ khách hàng:'}
                      </span>
                      <p className="text-slate-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-rose-200">
                        "{pendingTermination.reason}"
                      </p>
                    </div>
                  )}

                  {pendingTermination.requested_by === 'PROVIDER' && pendingTermination.provider_note && (
                    <div className="sm:col-span-2 pt-2 border-t border-rose-200/60">
                      <span className="text-slate-500 block font-medium">Ghi chú hướng dẫn cho khách hàng:</span>
                      <p className="text-slate-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-rose-200">
                        "{pendingTermination.provider_note}"
                      </p>
                    </div>
                  )}
                </div>

                
                {pendingTermination.requested_by === 'CUSTOMER' ? (
                  <>
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block">
                            Số tiền hoàn trả cho khách (nếu có thỏa thuận):
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={terminationRefund}
                            onChange={(e) => setTerminationRefund(e.target.value)}
                            placeholder="Ví dụ: 500000..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 font-mono"
                          />
                          <span className="text-[11px] text-slate-400 block">Hai bên tự chuyển khoản / thanh toán trực tiếp ngoài web.</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block">
                            Ghi chú xác nhận / Phản hồi của chủ bãi:
                          </label>
                          <input
                            type="text"
                            value={terminationProviderNote}
                            onChange={(e) => setTerminationProviderNote(e.target.value)}
                            placeholder="Nhập ghi chú hoặc lý do nếu từ chối..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        disabled={processingTermination}
                        onClick={() => setRejectTerminationModalOpen(true)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
                      >
                        Từ chối chấm dứt
                      </button>
                      <button
                        type="button"
                        disabled={processingTermination}
                        onClick={() => setConfirmTerminationModalOpen(true)}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        {processingTermination ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Xác nhận chấm dứt & Thu hồi chỗ đỗ
                      </button>
                    </div>
                  </>
                ) : (
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rose-100">
                    <p className="text-[11px] text-slate-500 italic">
                      * Bạn có thể hủy yêu cầu nếu muốn tiếp tục duy trì hợp đồng với khách hàng.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={cancellingTermination || processingTermination}
                        onClick={() => setCancelTerminationModalOpen(true)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                      >
                        {cancellingTermination ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        Hủy yêu cầu chấm dứt này
                      </button>
                      <button
                        type="button"
                        disabled={cancellingTermination || processingTermination}
                        onClick={() => setConfirmTerminationModalOpen(true)}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        {processingTermination ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Xác nhận đã thu hồi chỗ đỗ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            
            <div
              className="contract-paper-canvas bg-white border border-slate-300 shadow-md sm:rounded-lg p-6 sm:p-14 sm:max-w-[900px] mx-auto text-black print:p-0 print:border-none print:shadow-none print:max-w-none print:m-0"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              
              <div className="text-center space-y-1 mb-8">
                <p className="font-bold uppercase text-sm sm:text-base tracking-wide text-black">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-bold text-sm sm:text-base text-black">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="w-44 border-b border-black mx-auto mt-1 mb-6"></div>

                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black mt-4">
                  HỢP ĐỒNG GỬI GIỮ XE Ô TÔ
                </h1>
                <p className="text-sm font-semibold text-black mt-1">
                  Số: {contract.contract_code || contractInfo.contract_code} / HĐDV-PL
                </p>
              </div>

              
              <p className="text-xs sm:text-sm leading-relaxed text-black mb-4">
                Hôm nay, ngày {contractIssueDate.getDate()} tháng {contractIssueDate.getMonth() + 1} năm {contractIssueDate.getFullYear()}, tại {ownerInfo.facility_name || contract.reservation?.facility?.name} (Địa chỉ: {ownerInfo.facility_address || contract.reservation?.facility?.address}), hai bên gồm có:
              </p>

              
              <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-black mb-6">
                
                <div className="space-y-1 pl-1">
                  <p className="font-bold uppercase text-black">1. BÊN A (BÊN NHẬN GỬI GIỮ XE Ô TÔ):</p>
                  <p className="pl-4">- Cơ sở bãi đỗ xe: <strong>{ownerInfo.facility_name || contract.reservation?.facility?.name}</strong></p>
                  <p className="pl-4">- Đại diện bởi: <strong>Ông (Bà) {ownerInfo.provider_name || contract.reservation?.facility?.provider?.full_name}</strong></p>
                  <p className="pl-4">- Địa chỉ bãi xe: {ownerInfo.facility_address || contract.reservation?.facility?.address}</p>
                  <p className="pl-4">- Điện thoại liên hệ: {ownerInfo.provider_phone || contract.reservation?.facility?.provider?.phone_number || 'Chưa cập nhật'}</p>
                  {ownerInfo.provider_email && (
                    <p className="pl-4">- Email: {ownerInfo.provider_email}</p>
                  )}
                </div>

                
                <div className="space-y-1 pl-1">
                  <p className="font-bold uppercase text-black">2. BÊN B (BÊN GỬI XE Ô TÔ):</p>
                  <p className="pl-4">- Ông (Bà): <strong>{customerInfo.customer_name || contract.reservation?.customer?.full_name}</strong></p>
                  <p className="pl-4">- Số CMND / Thẻ CCCD: <strong>{displayIdCard}</strong></p>
                  <p className="pl-4">- Địa chỉ thường trú / liên hệ: {displayAddress}</p>
                  <p className="pl-4">- Điện thoại liên hệ: {customerInfo.customer_phone || contract.reservation?.customer?.phone_number || 'Chưa cập nhật'}</p>
                  <p className="pl-4">- Email: {customerInfo.customer_email || contract.reservation?.customer?.email || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-black mb-6 italic">
                Sau khi bàn bạc và thống nhất trên tinh thần tự nguyện, bình đẳng, hai bên nhất trí ký kết Hợp đồng gửi giữ xe ô tô với các điều khoản cụ thể sau đây:
              </p>

              
              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 1. Đối tượng gửi, giữ</p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  1.1. Bên A đồng ý nhận trông giữ và Bên B đồng ý gửi phương tiện xe ô tô theo đúng quy cách thông tin sau:
                </p>
                <p className="pl-8 text-xs sm:text-sm text-black">- Loại phương tiện / Dòng xe: <strong>{vehicleInfo.vehicle_type || 'Ô tô'}</strong></p>
                <p className="pl-8 text-xs sm:text-sm text-black">- Biển kiểm soát: <strong>{vehicleInfo.license_plate || vehicleInfo.vehicle_info_raw || contract.reservation?.vehicle_info}</strong></p>
                <p className="pl-8 text-xs sm:text-sm text-black">- Vị trí gửi đỗ: <strong>{rentalInfo.parking_spot || 'Vị trí đỗ tự do trong bãi'}</strong> tại {ownerInfo.facility_name || contract.reservation?.facility?.name}.</p>
              </div>

              
              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 2. Thời hạn, giá cả và phương thức thanh toán</p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  2.1. <strong>Thời hạn gửi giữ:</strong> Kể từ ngày <strong>{new Date(contract.start_date).toLocaleDateString('vi-VN')}</strong> đến hết ngày <strong>{new Date(contract.end_date).toLocaleDateString('vi-VN')}</strong>.
                </p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  2.2. <strong>Giá dịch vụ trông giữ xe:</strong> <strong>{Number(contract.agreed_price || rentalInfo.agreed_price || 0).toLocaleString('vi-VN')} đồng/tháng/xe</strong>.
                </p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  2.3. <strong>Thời hạn thanh toán:</strong> Bên B thực hiện thanh toán tiền dịch vụ định kỳ trước ngày <strong>{contract.payment_deadline_day || rentalInfo.payment_deadline_day || 5}</strong> hàng tháng.
                </p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  2.4. <strong>Phương thức thanh toán:</strong> Thanh toán trực tuyến qua cổng hệ thống ParkLink hoặc nộp chuyển khoản/tiền mặt cho Bên A.
                </p>
              </div>

              
              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 3. Quyền và nghĩa vụ của Bên A</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {terms.owner_obligations ||
                    '- Yêu cầu bên gửi trả tiền dịch vụ trông giữ xe theo thỏa thuận.\n- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên B ít nhất 15 ngày.\n- Bảo quản xe ô tô theo đúng thỏa thuận, trả lại xe ô tô cho bên gửi theo đúng tình trạng như khi nhận giữ.\n- Chỉ được thay đổi cách bảo quản xe ô tô nếu việc thay đổi là cần thiết nhằm bảo quản tốt hơn xe ô tô đó, nhưng phải báo ngay cho bên gửi biết về việc thay đổi.\n- Thông báo kịp thời cho bên gửi biết về nguy cơ hư hỏng, tiêu hủy xe ô tô do tính chất của xe ô tô đó và yêu cầu bên gửi cho biết cách giải quyết trong một thời hạn; nếu hết thời hạn đó mà bên gửi không trả lời thì bên giữ có quyền thực hiện các biện pháp cần thiết để bảo quản và yêu cầu bên gửi thanh toán chi phí.\n- Quá thời gian thanh toán, bên A có quyền thu hồi vị trí gửi xe và yêu cầu bên B trả phí giữ xe.\n- Phải bồi thường thiệt hại, nếu làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Bảo quản cẩn thận xe gửi giữ, không được sử dụng xe trong thời gian bảo quản.'}
                </div>
              </div>

              
              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 4. Quyền và nghĩa vụ của Bên B</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {terms.customer_obligations ||
                    '- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên A ít nhất 15 ngày.\n- Yêu cầu bồi thường thiệt hại, nếu bên giữ làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Phải trả đủ tiền dịch vụ trông giữ xe đúng thời hạn và đúng phương thức đã thỏa thuận. Trường hợp đóng tiền trễ so với thời gian quy định hợp đồng quá 3 lần/năm thì mặc định thanh lý hợp đồng trước thời hạn và khách hàng phải nộp tiền nợ (nếu có).\n- Trả phí giữ xe khi hết hạn hợp đồng mà không kịp thời nhận lại xe đã gửi.\n- Bên B tự bảo quản chìa khoá xe, thẻ xe, tài sản, tư trang trong xe ô tô.\n- Thực hiện theo đúng nội quy của bãi đậu xe.'}
                </div>
              </div>

              
              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 5. Giải quyết tranh chấp</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {terms.dispute_resolution ||
                    '- Hai bên cần chủ động thông báo cho nhau biết tình hình thực hiện hợp đồng, nếu có gì bất lợi phát sinh, các bên phải kịp thời thông báo cho nhau biết và tích cực giải quyết trên cơ sở thương lượng, bình đẳng, có lợi (có lập biên bản).\n- Trường hợp các bên không tự giải quyết được mới đưa việc tranh chấp ra Tòa án có thẩm quyền để giải quyết.'}
                </div>
              </div>

              
              <div className="space-y-1 mb-8">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 6. Điều khoản chung và hiệu lực hợp đồng</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {terms.termination_conditions ||
                    `- Hợp đồng này có hiệu lực kể từ ngày hai bên hoàn tất ký xác nhận điện tử đến ngày ${new Date(contract.end_date).toLocaleDateString('vi-VN')}. Hợp đồng đương nhiên được thanh lý khi hai bên hoàn thành toàn bộ các nghĩa vụ theo nội dung Hợp đồng và hai bên không có nhu cầu thỏa thuận gia hạn hợp đồng.\n- Mỗi bên có quyền chấm dứt hợp đồng trước thời hạn nhưng phải báo trước cho bên kia ít nhất 15 ngày.\n- Hợp đồng này được lập dưới dạng hợp đồng điện tử có giá trị pháp lý theo quy định của Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam; mỗi bên lưu giữ một bản có giá trị như nhau để thực hiện.`}
                </div>
              </div>

              
              <div className="pt-6 border-t border-black mt-8">
                <div className="grid grid-cols-2 gap-8 text-center text-xs sm:text-sm text-black">
                  
                  <div className="space-y-1">
                    <p className="font-bold uppercase">ĐẠI DIỆN BÊN A</p>
                    <p className="text-xs italic">(Ký, ghi rõ họ tên hoặc xác nhận điện tử)</p>
                    <div className="h-24 flex flex-col items-center justify-center">
                      <div className="border border-black px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                        XÁC NHẬN ĐIỆN TỬ
                      </div>
                      <p className="text-[11px] text-black mt-1">
                        Ngày: {new Date(contract.provider_agreed_at || contract.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <p className="font-bold text-xs sm:text-sm pt-2">
                      {ownerInfo.provider_name || contract.reservation?.facility?.provider?.full_name}
                    </p>
                  </div>

                  
                  <div className="space-y-1">
                    <p className="font-bold uppercase">ĐẠI DIỆN BÊN B</p>
                    <p className="text-xs italic">(Ký, ghi rõ họ tên hoặc xác nhận điện tử)</p>
                    <div className="h-24 flex flex-col items-center justify-center">
                      {isActive || contract.customer_agreed_at ? (
                        <>
                          <div className="border border-black px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                            XÁC NHẬN ĐIỆN TỬ
                          </div>
                          <p className="text-[11px] text-black mt-1">
                            Ngày: {new Date(contract.customer_agreed_at).toLocaleDateString('vi-VN')}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs italic text-black">(Chờ khách hàng xác nhận điện tử)</p>
                      )}
                    </div>
                    <p className="font-bold text-xs sm:text-sm pt-2">
                      {customerInfo.customer_name || contract.reservation?.customer?.full_name}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            
            {isCustomer && isPendingSignature && (
              <div className="print:hidden bg-white rounded-xl p-6 border border-slate-200 sm:max-w-[900px] mx-auto space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-base font-bold text-slate-900">
                    Xác nhận hợp đồng điện tử
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vui lòng kiểm tra kỹ nội dung và điều khoản hợp đồng phía trên trước khi xác nhận.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-1">
                  <button
                    type="button"
                    onClick={() => setIsTermsAgreed(!isTermsAgreed)}
                    className="mt-0.5 text-teal-600 focus:outline-none shrink-0"
                  >
                    {isTermsAgreed ? (
                      <CheckSquare className="w-5 h-5 text-teal-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Tôi là <strong>{customerInfo.customer_name || contract.reservation?.customer?.full_name}</strong>,
                    xác nhận thông tin cá nhân trên là chính xác, đã đọc kỹ và đồng ý với toàn bộ nội dung, quyền và nghĩa vụ trong hợp đồng này.
                  </span>
                </label>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!isTermsAgreed || accepting}
                    onClick={() => setConfirmModalOpen(true)}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition inline-flex items-center justify-center gap-2"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Đang xác nhận...
                      </>
                    ) : (
                      'Xác nhận hợp đồng điện tử'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleExecuteAccept}
        title="Xác Nhận Ký Hợp Đồng Điện Tử"
        message="Bạn có chắc chắn muốn chấp nhận ký hợp đồng đỗ xe theo tháng này không? Hợp đồng sau khi ký sẽ chính thức có hiệu lực pháp lý."
        confirmText="Đồng Ý Ký Ngay"
        cancelText="Bỏ Qua"
        type="primary"
        loading={accepting}
      />

      
      <ConfirmModal
        isOpen={confirmTerminationModalOpen}
        onClose={() => setConfirmTerminationModalOpen(false)}
        onConfirm={() => executeTermination('CONFIRMED')}
        title={pendingTermination?.requested_by === 'PROVIDER' ? 'Xác Nhận Đã Thu Hồi Chỗ Đỗ' : 'Xác Nhận Chấm Dứt Hợp Đồng & Thu Hồi Chỗ Đỗ'}
        message={
          pendingTermination?.requested_by === 'PROVIDER'
            ? 'Bạn có chắc chắn muốn xác nhận đã thu hồi lại chỗ đỗ xe? Sau khi xác nhận, hợp đồng sẽ chính thức được thanh lý và vị trí đỗ xe sẽ được mở lại cho khách hàng mới.'
            : 'Bạn có chắc chắn muốn xác nhận chấm dứt hợp đồng này? Sau khi xác nhận, hợp đồng sẽ chính thức được thanh lý và hệ thống sẽ tự động thu hồi lại vị trí đỗ xe trống để đón khách mới.'
        }
        confirmText={pendingTermination?.requested_by === 'PROVIDER' ? 'Xác Nhận Đã Thu Hồi' : 'Xác Nhận Chấm Dứt'}
        cancelText="Bỏ Qua"
        type="danger"
        loading={processingTermination}
      />

      
      <ConfirmModal
        isOpen={cancelTerminationModalOpen}
        onClose={() => setCancelTerminationModalOpen(false)}
        onConfirm={handleExecuteCancelTermination}
        title="Hủy Yêu Cầu Chấm Dứt Hợp Đồng"
        message="Bạn có chắc chắn muốn hủy yêu cầu chấm dứt hợp đồng này không? Hợp đồng sẽ tiếp tục có hiệu lực theo thời hạn đã ký ban đầu."
        confirmText="Đồng Ý Hủy"
        cancelText="Bỏ Qua"
        type="warning"
        loading={cancellingTermination}
      />

      
      <ConfirmModal
        isOpen={rejectTerminationModalOpen}
        onClose={() => setRejectTerminationModalOpen(false)}
        onConfirm={() => executeTermination('REJECTED')}
        title="Từ Chối Yêu Cầu Chấm Dứt Hợp Đồng"
        message="Bạn có chắc chắn muốn từ chối yêu cầu chấm dứt trước hạn này của khách hàng? Hợp đồng sẽ tiếp tục có hiệu lực theo thời hạn đã ký ban đầu."
        confirmText="Từ Chối Yêu Cầu"
        cancelText="Bỏ Qua"
        type="warning"
        loading={processingTermination}
      />

      
      <ConfirmModal
        isOpen={rejectExtensionModalOpen}
        onClose={() => setRejectExtensionModalOpen(false)}
        onConfirm={() => executeExtensionResponse('REJECTED')}
        title="Từ Chối Yêu Cầu Gia Hạn Hợp Đồng"
        message="Bạn có chắc chắn muốn từ chối yêu cầu gia hạn thời gian thuê của khách hàng không?"
        confirmText="Từ Chối Gia Hạn"
        cancelText="Bỏ Qua"
        type="warning"
        loading={processingExtension}
      />
    </div>
  );
};

export default ContractDetailPage;
