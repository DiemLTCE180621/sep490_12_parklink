import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  CreditCard,
  Info,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import {
  getConfirmationRecordDetail,
  requestEarlyTermination,
  cancelEarlyTermination,
  confirmContractTermination
} from '../../services/confirmationRecordService';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { useAuth } from '../../context/AuthContext';

const RequestContractTerminationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [error, setError] = useState(null);

  const [terminationDate, setTerminationDate] = useState('');
  const [reason, setReason] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [providerNote, setProviderNote] = useState('');

  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmAcceptModalOpen, setConfirmAcceptModalOpen] = useState(false);

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

      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 15);
      const contractEnd = new Date(data.end_date);
      const chosen = defaultDate < contractEnd ? defaultDate : contractEnd;
      setTerminationDate(chosen.toISOString().slice(0, 10));
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
  const pendingTermination = snapshot.termination_request && snapshot.termination_request.status === 'PENDING'
    ? snapshot.termination_request
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!terminationDate) {
      setToastInfo({ message: 'Vui lòng chọn ngày dự kiến chấm dứt hợp đồng!', type: 'error' });
      return;
    }

    if (!reason.trim()) {
      setToastInfo({ message: 'Vui lòng nhập lý do chấm dứt hợp đồng trước hạn!', type: 'error' });
      return;
    }

    let combinedBankInfo = '';
    if (isCustomer && bankAccountNumber.trim()) {
      combinedBankInfo = `${bankName.trim() || 'Ngân hàng'} - STK: ${bankAccountNumber.trim()}${bankAccountHolder.trim() ? ` - Tên: ${bankAccountHolder.trim().toUpperCase()}` : ''}`;
    }

    try {
      setSubmitting(true);
      const payload = {
        termination_date: terminationDate,
        reason: reason.trim(),
        bank_account_info: isCustomer ? (combinedBankInfo || undefined) : undefined,
        refund_amount: isProvider && refundAmount ? Number(refundAmount) : undefined,
        provider_note: isProvider && providerNote ? providerNote.trim() : undefined
      };

      await requestEarlyTermination(id, payload);
      setToastInfo({
        message: isProvider
          ? 'Gửi yêu cầu chấm dứt hợp đồng thành công! Đã gửi thông báo tới khách hàng.'
          : 'Gửi yêu cầu chấm dứt hợp đồng thành công! Vui lòng chờ chủ bãi xe xác nhận.',
        type: 'success'
      });
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || 'Gửi yêu cầu chấm dứt thất bại!',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteCancel = async () => {
    try {
      setCancelling(true);
      await cancelEarlyTermination(id);
      setToastInfo({
        message: 'Đã hủy yêu cầu chấm dứt hợp đồng thành công! Hợp đồng tiếp tục có hiệu lực.',
        type: 'success'
      });
      setConfirmCancelOpen(false);
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || 'Hủy yêu cầu chấm dứt thất bại!',
        type: 'error'
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleExecuteConfirm = async () => {
    try {
      setConfirmingAction(true);
      await confirmContractTermination(id, {
        status: 'CONFIRMED',
        provider_note: isProvider && providerNote ? providerNote.trim() : undefined,
        refund_amount: isProvider && refundAmount ? Number(refundAmount) : undefined
      });
      setToastInfo({
        message: 'Đã xác nhận chấm dứt hợp đồng thành công! Vị trí đỗ xe đã được hoàn trả.',
        type: 'success'
      });
      setConfirmAcceptModalOpen(false);
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || 'Xác nhận chấm dứt thất bại!',
        type: 'error'
      });
    } finally {
      setConfirmingAction(false);
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
              onClick={() => navigate(isProvider ? '/provider/dashboard?tab=contracts' : '/my-contracts')}
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
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Hợp đồng không còn hiệu lực</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hợp đồng này hiện ở trạng thái <strong>{contract.status === 'TERMINATED' ? 'Đã chấm dứt' : contract.status === 'PENDING_SIGNATURE' ? 'Chờ xác nhận' : contract.status}</strong>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate(isProvider ? '/provider/dashboard?tab=contracts' : '/my-contracts')}
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
  const todayStr = new Date().toISOString().slice(0, 10);
  const contractEndStr = contract.end_date ? new Date(contract.end_date).toISOString().slice(0, 10) : '';

  const isProvider = user?.role === 'PROVIDER' || (contract && user?.id === contract.reservation?.facility?.provider_id);
  const isCustomer = !isProvider;
  const requesterRole = pendingTermination?.requested_by || 'CUSTOMER';
  const isMyRequest = (requesterRole === 'PROVIDER' && isProvider) || (requesterRole === 'CUSTOMER' && isCustomer);

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
            <Link
              to={isProvider ? '/provider/dashboard?tab=contracts' : '/my-contracts'}
              className="hover:text-slate-900 transition"
            >
              {isProvider ? 'Quản lý hợp đồng' : 'Hợp đồng của tôi'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to={`/contracts/${id}`} className="font-mono hover:text-slate-900 transition font-medium">
              {contract.contract_code}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Chấm dứt hợp đồng</span>
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
                {isProvider
                  ? 'Yêu cầu chấm dứt hợp đồng từ Chủ bãi xe'
                  : 'Chấm dứt hợp đồng & Trả chỗ trước thời hạn'}
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
              {isProvider
                ? 'Chủ bãi xe gửi yêu cầu dừng cung cấp chỗ đỗ và thanh lý hợp đồng trước ngày kết thúc thỏa thuận ban đầu.'
                : 'Khách hàng gửi yêu cầu trả lại vị trí đỗ xe và thanh lý hợp đồng trước ngày kết thúc thỏa thuận ban đầu.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">Đơn giá thuê</span>
              <strong className="text-slate-900 text-sm font-bold">
                {Number(contract.agreed_price || 0).toLocaleString('vi-VN')} đ/tháng
              </strong>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[11px]">Hạn kết thúc gốc</span>
              <strong className="text-slate-800 text-sm font-semibold">
                {new Date(contract.end_date).toLocaleDateString('vi-VN')}
              </strong>
            </div>
          </div>
        </div>

        
        {pendingTermination ? (
          <div className="bg-white rounded-xl border border-rose-300 overflow-hidden shadow-xs">
            <div className="p-6 bg-rose-50/70 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5 text-rose-700">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {isMyRequest
                        ? 'Yêu cầu chấm dứt do bạn gửi đang chờ xử lý'
                        : requesterRole === 'PROVIDER'
                        ? 'Chủ bãi xe đã gửi yêu cầu chấm dứt hợp đồng trước hạn'
                        : 'Khách hàng đã gửi yêu cầu chấm dứt hợp đồng & trả chỗ'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-200/80 text-rose-900">
                      {requesterRole === 'PROVIDER' ? 'Bên A (Chủ bãi) gửi' : 'Bên B (Khách) gửi'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Gửi lúc {new Date(pendingTermination.requested_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(pendingTermination.requested_at).toLocaleDateString('vi-VN')}.
                    {isMyRequest && ' Nếu bạn thay đổi ý định, bạn có thể hủy yêu cầu này.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                {isMyRequest ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancelOpen(true)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Hủy yêu cầu này
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmAcceptModalOpen(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isProvider ? 'Xác nhận chấm dứt & Thu hồi chỗ' : 'Xác nhận chấm dứt & Trả chỗ'}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Ngày dự kiến trả chỗ / kết thúc</span>
                  <strong className="text-base font-bold text-rose-700 mt-1 block">
                    {pendingTermination.requested_termination_date
                      ? new Date(pendingTermination.requested_termination_date).toLocaleDateString('vi-VN')
                      : '---'}
                  </strong>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Hạn hợp đồng ban đầu</span>
                  <strong className="text-base font-bold text-slate-800 mt-1 block">
                    {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                  </strong>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Mã yêu cầu</span>
                  <span className="font-mono text-xs font-semibold text-slate-700 mt-1 block">
                    {pendingTermination.request_id || 'TERM-REQUEST'}
                  </span>
                </div>
              </div>

              {pendingTermination.reason && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block">
                    {requesterRole === 'PROVIDER' ? 'Lý do từ Chủ bãi xe:' : 'Lý do từ Khách hàng:'}
                  </span>
                  <p className="text-slate-700 italic">"{pendingTermination.reason}"</p>
                </div>
              )}

              {pendingTermination.bank_account_info && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    Thông tin tài khoản nhận tiền hoàn lại:
                  </span>
                  <p className="text-slate-800 font-mono font-medium">{pendingTermination.bank_account_info}</p>
                </div>
              )}

              {pendingTermination.refund_amount !== null && pendingTermination.refund_amount !== undefined && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                    Số tiền hoàn lại cho khách (thỏa thuận):
                  </span>
                  <p className="text-teal-700 font-bold font-mono text-sm">
                    {Number(pendingTermination.refund_amount).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              )}

              {pendingTermination.provider_note && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block">Ghi chú từ chủ bãi xe:</span>
                  <p className="text-slate-700 italic">"{pendingTermination.provider_note}"</p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/contracts/${id}`)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                >
                  Xem hợp đồng điện tử
                </button>
              </div>
            </div>
          </div>
        ) : (
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <strong className="font-semibold block">
                      {isProvider ? 'Quy định chấm dứt hợp đồng từ phía Chủ bãi:' : 'Quy định chấm dứt hợp đồng trước hạn:'}
                    </strong>
                    <p>
                      {isProvider ? (
                        <>
                          Theo điều khoản trong Hợp đồng gửi giữ xe, chủ bãi xe có thể yêu cầu chấm dứt hợp đồng khi có kế hoạch sửa chữa/bảo trì bãi xe, thu hồi mặt bằng hoặc khách hàng vi phạm quy chế. Vui lòng thông báo trước ít nhất <strong>15 ngày</strong> và thỏa thuận hoàn trả phí/cọc (nếu có).
                        </>
                      ) : (
                        <>
                          Theo thỏa thuận trong Hợp đồng gửi giữ xe (Điều 6), khách hàng cần thông báo trước cho chủ bãi xe ít nhất <strong>15 ngày</strong> trước ngày dừng gửi xe. Vui lòng sắp xếp thời gian hợp lý và bàn giao lại vị trí đỗ đúng hạn.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {isProvider ? '1. Ngày dự kiến dừng gửi & thu hồi chỗ đỗ' : '1. Ngày dự kiến trả chỗ & dừng gửi xe'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isProvider
                          ? 'Chọn ngày khách hàng cần hoàn tất di chuyển xe ra khỏi bãi đỗ.'
                          : 'Chọn ngày bạn sẽ di chuyển xe ra khỏi bãi và hoàn tất bàn giao lại vị trí đỗ.'}
                      </p>
                    </div>

                    <div className="max-w-xs space-y-1">
                      <label className="text-xs font-medium text-slate-700 block">
                        {isProvider ? 'Ngày dừng gửi dự kiến' : 'Ngày trả chỗ mong muốn'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        min={todayStr}
                        max={contractEndStr || undefined}
                        value={terminationDate}
                        onChange={(e) => setTerminationDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 font-medium"
                        required
                      />
                    </div>
                  </div>

                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        2. Lý do chấm dứt hợp đồng trước hạn <span className="text-red-500">*</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isProvider
                          ? 'Vui lòng mô tả cụ thể lý do chủ bãi xe muốn chấm dứt hợp đồng trước hạn để gửi thông báo tới khách hàng.'
                          : 'Vui lòng mô tả cụ thể lý do bạn muốn chấm dứt hợp đồng và trả lại vị trí đỗ xe.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <textarea
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={
                          isProvider
                            ? 'Mô tả cụ thể lý do chủ bãi xe muốn chấm dứt hợp đồng trước hạn (ví dụ: bãi xe cần bảo trì/sửa chữa mặt bằng, dừng hoạt động hoặc khách hàng vi phạm quy chế)...'
                            : 'Mô tả cụ thể lý do bạn muốn chấm dứt hợp đồng và trả chỗ sớm...'
                        }
                        className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 transition leading-relaxed"
                        required
                      />
                    </div>
                  </div>

                  
                  {isCustomer ? (
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">
                          3. Thông tin nhận hoàn phí / tiền cọc (Nếu có thỏa thuận)
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Nền tảng ParkLink không trực tiếp giam giữ hay tự trừ tiền cọc. Khoản hoàn trả (nếu có) do bạn và chủ bãi xe tự thỏa thuận đối soát.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">Ngân hàng</label>
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="Ví dụ: Vietcombank, MB, Techcombank..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">Số tài khoản</label>
                          <input
                            type="text"
                            value={bankAccountNumber}
                            onChange={(e) => setBankAccountNumber(e.target.value)}
                            placeholder="Nhập số tài khoản..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">Tên chủ tài khoản</label>
                          <input
                            type="text"
                            value={bankAccountHolder}
                            onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
                            placeholder="NGUYEN VAN A"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 uppercase font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">
                          3. Thỏa thuận hoàn tiền & Hướng dẫn cho khách hàng (Tùy chọn)
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Nhập thông tin hoàn tiền hoặc hướng dẫn bàn giao vị trí đỗ gửi kèm cho khách hàng.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">
                            Số tiền hoàn trả dự kiến (nếu có, VNĐ)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder="Ví dụ: 500000..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 font-mono"
                          />
                          <span className="text-[11px] text-slate-400 block">Hai bên tự chuyển khoản / thanh toán trực tiếp ngoài web.</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">
                            Ghi chú hướng dẫn khách bàn giao
                          </label>
                          <input
                            type="text"
                            value={providerNote}
                            onChange={(e) => setProviderNote(e.target.value)}
                            placeholder="Ví dụ: Vui lòng bàn giao lại thẻ từ trước 18h..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-16">
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    Tóm tắt yêu cầu chấm dứt
                  </h3>

                  
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 block text-[11px]">Bãi đỗ xe</span>
                    <p className="font-semibold text-slate-800">{facility?.name || 'Bãi đỗ xe'}</p>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{facility?.address}</p>
                  </div>

                  
                  <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                    <span className="text-slate-400 block text-[11px]">
                      {isProvider ? 'Khách thuê (Bên B)' : 'Phương tiện đang gửi'}
                    </span>
                    {isProvider ? (
                      <p className="font-medium text-slate-800">
                        {contract.reservation?.customer?.full_name || 'Khách hàng'}
                        <span className="font-mono text-slate-500 text-[11px] block mt-0.5">
                          {contract.reservation?.customer?.phone_number}
                        </span>
                      </p>
                    ) : (
                      <p className="font-medium text-slate-800">
                        {currentVeh.vehicle_type || 'Ô tô'}{' '}
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {currentVeh.license_plate || contract.reservation?.vehicle_info || 'Chưa cập nhật'}
                        </span>
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Thời hạn gốc:</span>
                      <span className="font-mono">{new Date(contract.end_date).toLocaleDateString('vi-VN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-rose-800 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200">
                      <span className="font-medium">
                        {isProvider ? 'Ngày dừng gửi dự kiến:' : 'Ngày trả chỗ đề xuất:'}
                      </span>
                      <strong className="font-mono text-sm font-bold text-rose-700">
                        {terminationDate ? new Date(terminationDate).toLocaleDateString('vi-VN') : '---'}
                      </strong>
                    </div>
                  </div>

                  
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1 leading-relaxed">
                    <p className="font-semibold text-slate-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      Lưu ý quan trọng:
                    </p>
                    <p>
                      Khi yêu cầu được xác nhận, hợp đồng sẽ chính thức chuyển sang trạng thái <strong>Đã chấm dứt</strong> và vị trí đỗ xe sẽ được thu hồi trên hệ thống.
                    </p>
                  </div>

                  
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang gửi yêu cầu...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi yêu cầu chấm dứt</span>
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
        title="Xác nhận hủy yêu cầu chấm dứt"
        message="Bạn có chắc chắn muốn hủy yêu cầu chấm dứt hợp đồng trước hạn này không? Sau khi hủy, hợp đồng sẽ tiếp tục có hiệu lực bình thường."
        confirmText="Hủy yêu cầu chấm dứt"
        cancelText="Đóng"
        type="warning"
        loading={cancelling}
      />

      
      <ConfirmModal
        isOpen={confirmAcceptModalOpen}
        onClose={() => setConfirmAcceptModalOpen(false)}
        onConfirm={handleExecuteConfirm}
        title="Xác Nhận Chấm Dứt Hợp Đồng & Thu Hồi Chỗ Đỗ"
        message="Bạn có chắc chắn muốn xác nhận chấm dứt hợp đồng này? Sau khi xác nhận, hợp đồng sẽ chính thức được chuyển sang trạng thái Đã chấm dứt và hệ thống sẽ tự động thu hồi lại chỗ đỗ xe."
        confirmText="Xác Nhận Chấm Dứt"
        cancelText="Bỏ Qua"
        type="danger"
        loading={confirmingAction}
      />
    </div>
  );
};

export default RequestContractTerminationPage;
