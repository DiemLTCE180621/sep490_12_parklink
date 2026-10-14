import React, { useEffect, useState, useCallback } from 'react';
import { getConfirmationRecordDetail, acceptConfirmationRecord } from '../services/confirmationRecordService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './modals/ConfirmModal';
import {
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  CheckSquare,
  Square
} from 'lucide-react';

const ContractDetailModal = ({ contractId, isOpen, onClose, onRefresh }) => {
  const { user } = useAuth();
  const isCustomer = user?.role?.name === 'CUSTOMER' || user?.role === 'CUSTOMER';

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getConfirmationRecordDetail(contractId);
      const data = res.data?.confirmation_record || res.confirmation_record;
      setContract(data);
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
  }, [contractId]);

  useEffect(() => {
    if (isOpen && contractId) {
      fetchDetail();
    } else {
      setContract(null);
      setError(null);
      setSuccessMsg(null);
      setIsTermsAgreed(false);
      setConfirmModalOpen(false);
    }
  }, [isOpen, contractId, fetchDetail]);

  const handleExecuteAccept = async () => {
    try {
      setAccepting(true);
      setError(null);
      const res = await acceptConfirmationRecord(contractId);
      const updated = res.data?.confirmation_record || res.confirmation_record;
      setSuccessMsg('Đã xác nhận ký hợp đồng điện tử thành công! Hợp đồng chính thức có hiệu lực.');
      setContract(updated);
      setConfirmModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message || 'Chấp nhận hợp đồng thất bại!');
    } finally {
      setAccepting(false);
    }
  };

  if (!isOpen) return null;

  const snapshot = contract?.contract_snapshot || {};
  const contractInfo = snapshot.contract_info || {};
  const ownerInfo = snapshot.owner_info || {};
  const customerInfo = snapshot.customer_info || {};
  const vehicleInfo = snapshot.vehicle_info || {};
  const rentalInfo = snapshot.rental_info || {};
  const terms = snapshot.terms_and_conditions || {};

  const isPendingSignature = contract?.status === 'PENDING_SIGNATURE';
  const isActive = contract?.status === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden transform transition-all duration-200 max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="bg-slate-900 px-6 py-4 text-white relative shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/40 text-teal-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase block">Hợp Đồng Điện Tử ParkLink</span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Mã HĐ: {contract?.contract_code || contractInfo.contract_code || `HD-#${contractId}`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DOCUMENT CONTAINER */}
        <div className="p-4 sm:p-8 bg-slate-100/70 overflow-y-auto flex-grow text-slate-800 text-xs sm:text-sm">
          {loading ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-xl shadow-sm border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">Đang tải văn bản hợp đồng điện tử...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <div>{error}</div>
            </div>
          ) : contract ? (
            <div className="space-y-6">
              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>{successMsg}</div>
                </div>
              )}

              {/* REAL LEGAL PAPER DOCUMENT CANVAS */}
              <div className="bg-white border border-slate-300 shadow-md rounded-lg p-6 sm:p-12 space-y-8 font-sans max-w-3xl mx-auto leading-relaxed">
                
                {/* NATIONAL EMBLEM & TITLE */}
                <div className="text-center space-y-1.5 pb-6 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </h3>
                  <p className="text-xs font-bold text-slate-700">Độc lập - Tự do - Hạnh phúc</p>
                  <div className="w-20 h-0.5 bg-slate-800 mx-auto my-2"></div>
                  
                  <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight mt-4">
                    BIÊN BẢN XÁC NHẬN & HỢP ĐỒNG ĐIỆN TỬ
                  </h2>
                  <p className="text-xs font-extrabold text-teal-800 uppercase">
                    CHO THUÊ BÃI ĐỖ XE THEO THÁNG
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Mã hợp đồng: {contract.contract_code} | Ngày lập: {new Date(contract.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                {/* 1. THÔNG TIN CHUNG HỢP ĐỒNG */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
                    1. Thông Tin Thời Hạn Hiệu Lực
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block">Ngày bắt đầu hiệu lực:</span>
                      <strong className="text-slate-900">{new Date(contract.start_date).toLocaleDateString('vi-VN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Ngày kết thúc hiệu lực:</span>
                      <strong className="text-slate-900">{new Date(contract.end_date).toLocaleDateString('vi-VN')}</strong>
                    </div>
                  </div>
                </div>

                {/* 2 & 3. BÊN CHO THUÊ & BÊN THUÊ */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
                    2. Các Bên Tham Gia Hợp Đồng
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    {/* BÊN A */}
                    <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
                      <span className="font-bold text-slate-900 block text-xs uppercase border-b border-slate-200 pb-1">
                        BÊN CHO THUÊ (BÊN A - OWNER)
                      </span>
                      <p><span className="text-slate-500">Bãi xe:</span> <strong>{ownerInfo.facility_name || contract.reservation?.facility?.name}</strong></p>
                      <p><span className="text-slate-500">Chủ cơ sở:</span> <strong>{ownerInfo.provider_name || contract.reservation?.facility?.provider?.full_name}</strong></p>
                      <p><span className="text-slate-500">SĐT:</span> {ownerInfo.provider_phone || contract.reservation?.facility?.provider?.phone_number}</p>
                      <p><span className="text-slate-500">Email:</span> {ownerInfo.provider_email || contract.reservation?.facility?.provider?.email}</p>
                      <p><span className="text-slate-500">Địa chỉ:</span> {ownerInfo.facility_address || contract.reservation?.facility?.address}</p>
                    </div>

                    {/* BÊN B */}
                    <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-lg border border-slate-200/80">
                      <span className="font-bold text-slate-900 block text-xs uppercase border-b border-slate-200 pb-1">
                        BÊN THUÊ (BÊN B - CUSTOMER)
                      </span>
                      <p><span className="text-slate-500">Họ tên:</span> <strong>{customerInfo.customer_name || contract.reservation?.customer?.full_name}</strong></p>
                      <p><span className="text-slate-500">SĐT:</span> {customerInfo.customer_phone || contract.reservation?.customer?.phone_number || 'Chưa cập nhật'}</p>
                      <p><span className="text-slate-500">Email:</span> {customerInfo.customer_email || contract.reservation?.customer?.email}</p>
                      <p><span className="text-slate-500">Địa chỉ:</span> {customerInfo.customer_address || 'Cần Thơ'}</p>
                    </div>
                  </div>
                </div>

                {/* 4. THÔNG TIN PHƯƠNG TIỆN */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
                    3. Thông Tin Phương Tiện Đăng Ký Đỗ
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block">Loại xe:</span>
                      <strong className="text-slate-900">{vehicleInfo.vehicle_type || 'Ô tô'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Biển số / Mô tả xe:</span>
                      <strong className="text-teal-800 text-sm font-mono">{vehicleInfo.license_plate || vehicleInfo.vehicle_info_raw || contract.reservation?.vehicle_info}</strong>
                    </div>
                  </div>
                </div>

                {/* 5. VỊ TRÍ & CHI PHÍ THUÊ */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
                    4. Vị Trí Đỗ Xe & Phí Thuê Hàng Tháng
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block">Vị trí / Slot đỗ:</span>
                      <strong className="text-slate-900">{rentalInfo.parking_spot || 'Chỗ đỗ tự do'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Giá thuê tháng:</span>
                      <strong className="text-teal-800 font-bold">{Number(contract.agreed_price || rentalInfo.agreed_price || 0).toLocaleString('vi-VN')} VNĐ/tháng</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hạn thanh toán:</span>
                      <strong className="text-amber-800">Trước ngày {contract.payment_deadline_day || rentalInfo.payment_deadline_day || 5} hàng tháng</strong>
                    </div>
                  </div>
                </div>

                {/* 6. ĐIỀU KHOẢN HỢP ĐỒNG */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-200 pb-1">
                    5. Các Điều Khoản & Quy Định Pháp Lý (Bộ luật Dân sự 2015)
                  </h4>

                  <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                    <div>
                      <strong className="text-slate-900 block font-semibold mb-0.5">Điều 3: Quyền và nghĩa vụ của Bên A (Bên giữ xe):</strong>
                      <p className="whitespace-pre-line text-slate-600 pl-2 border-l-2 border-slate-300">
                        {terms.owner_obligations ||
                          '- Yêu cầu bên gửi trả tiền dịch vụ trông giữ xe theo thỏa thuận.\n- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên B ít nhất 15 ngày.\n- Bảo quản xe ô tô theo đúng thỏa thuận, trả lại xe ô tô cho bên gửi theo đúng tình trạng như khi nhận giữ.\n- Chỉ được thay đổi cách bảo quản xe ô tô nếu việc thay đổi là cần thiết nhằm bảo quản tốt hơn xe ô tô đó, nhưng phải báo ngay cho bên gửi biết về việc thay đổi.\n- Thông báo kịp thời cho bên gửi biết về nguy cơ hư hỏng, tiêu hủy xe ô tô do tính chất của xe ô tô đó và yêu cầu bên gửi cho biết cách giải quyết trong một thời hạn; nếu hết thời hạn đó mà bên gửi không trả lời thì bên giữ có quyền thực hiện các biện pháp cần thiết để bảo quản và yêu cầu bên gửi thanh toán chi phí.\n- Quá thời gian thanh toán, bên A có quyền thu hồi vị trí gửi xe và yêu cầu bên B trả phí giữ xe.\n- Phải bồi thường thiệt hại, nếu làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Bảo quản cẩn thận xe gửi giữ, không được sử dụng xe trong thời gian bảo quản.'}
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-900 block font-semibold mb-0.5">Điều 4: Quyền và nghĩa vụ của Bên B (Bên gửi xe):</strong>
                      <p className="whitespace-pre-line text-slate-600 pl-2 border-l-2 border-slate-300">
                        {terms.customer_obligations ||
                          '- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên A ít nhất 15 ngày.\n- Yêu cầu bồi thường thiệt hại, nếu bên giữ làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Phải trả đủ tiền dịch vụ trông giữ xe đúng thời hạn và đúng phương thức đã thỏa thuận. Trường hợp đóng tiền trễ so với thời gian quy định hợp đồng quá 3 lần/năm thì mặc định thanh lý hợp đồng trước thời hạn và khách hàng phải nộp tiền nợ (nếu có).\n- Trả phí giữ xe khi hết hạn hợp đồng mà không kịp thời nhận lại xe đã gửi.\n- Bên B tự bảo quản chìa khoá xe, thẻ xe, tài sản, tư trang trong xe ô tô.\n- Thực hiện theo đúng nội quy của bãi đậu xe.'}
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-900 block font-semibold mb-0.5">Điều 5: Giải quyết tranh chấp:</strong>
                      <p className="whitespace-pre-line text-slate-600 pl-2 border-l-2 border-slate-300">
                        {terms.dispute_resolution ||
                          '- Hai bên cần chủ động thông báo cho nhau biết tình hình thực hiện hợp đồng, nếu có gì bất lợi phát sinh, các bên phải kịp thời thông báo cho nhau biết và tích cực giải quyết trên cơ sở thương lượng, bình đẳng, có lợi (có lập biên bản).\n- Trường hợp các bên không tự giải quyết được mới đưa việc tranh chấp ra Tòa án giải quyết.'}
                      </p>
                    </div>

                    <div>
                      <strong className="text-slate-900 block font-semibold mb-0.5">Điều 6: Hiệu lực của hợp đồng:</strong>
                      <p className="whitespace-pre-line text-slate-600 pl-2 border-l-2 border-slate-300">
                        {terms.termination_conditions ||
                          `- Hợp đồng này có hiệu lực từ ngày bắt đầu đến ngày kết thúc thỏa thuận. Hợp đồng đương nhiên được thanh lý khi hai bên hoàn thành toàn bộ các nghĩa vụ theo nội dung Hợp đồng và hai bên không có nhu cầu thỏa thuận gia hạn hợp đồng.\n- Mỗi bên có quyền chấm dứt hợp đồng trước thời hạn nhưng phải báo trước cho bên kia ít nhất 15 ngày.\n- Hợp đồng này được lập dưới dạng hợp đồng điện tử có giá trị pháp lý theo quy định của Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam; mỗi bên lưu giữ một bản có giá trị như nhau để thực hiện.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 7. CHỮ KÝ ĐIỆN TỬ HAI BÊN */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase text-center tracking-wider">
                    6. XÁC NHẬN CHỮ KÝ ĐIỆN TỬ
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-xs">
                    {/* BÊN A */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block uppercase">BÊN CHO THUÊ (BÊN A)</span>
                      <p className="font-bold text-slate-900">
                        {ownerInfo.provider_name || contract.reservation?.facility?.provider?.full_name}
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Đã Lập & Xác Nhận Điện Tử
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {new Date(contract.provider_agreed_at || contract.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    {/* BÊN B */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block uppercase">BÊN THUÊ (BÊN B)</span>
                      <p className="font-bold text-slate-900">
                        {customerInfo.customer_name || contract.reservation?.customer?.full_name}
                      </p>

                      {isActive || contract.customer_agreed_at ? (
                        <>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã Xác Nhận Ký Điện Tử
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {new Date(contract.customer_agreed_at).toLocaleString('vi-VN')}
                          </p>
                        </>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ Khách Hàng Xác Nhận Ký
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CUSTOMER ACTION FOOTER */}
              {isCustomer && isPendingSignature && (
                <div className="max-w-3xl mx-auto p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
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
                    <span className="text-xs text-slate-700 leading-relaxed font-medium">
                      Tôi là <strong>{customerInfo.customer_name || contract.reservation?.customer?.full_name}</strong>, xác nhận đã đọc, hiểu rõ và đồng ý với toàn bộ nội dung hợp đồng điện tử này.
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={!isTermsAgreed || accepting}
                    onClick={() => setConfirmModalOpen(true)}
                    className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" /> Đang Ký Hợp Đồng...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Xác Nhận Ký Hợp Đồng Điện Tử Ngay
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* CONFIRMATION DIALOG */}
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
    </div>
  );
};

export default ContractDetailModal;
