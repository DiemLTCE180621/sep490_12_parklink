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
                    5. Các Điều Khoản & Quy Định Pháp Lý (BLDS 2015 & Luật GDĐT)
                  </h4>

                  <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                    <div>
                      <strong className="text-slate-900 block font-semibold mb-0.5">5.1. Quyền và nghĩa vụ của Khách Thuê (Bên B):</strong>
                      <p className="whitespace-pre-line text-slate-600 pl-2 border-l-2 border-slate-300">{terms.customer_obligations || '1. Thanh toán đầy đủ tiền thuê bãi đỗ xe theo đúng hạn thỏa thuận hàng tháng.\n2. Đỗ xe đúng vị trí được phân công, tuân thủ nghiêm ngặt nội quy bãi xe và quy định về Phòng cháy chữa cháy (PCCC).\n3. Thông báo rõ cho chủ bãi về tình trạng hoặc đặc tính nguy hiểm của phương tiện (nếu có).\n4. Tự bảo quản các vật dụng tài sản cá nhân có giá trị rời để bên trong xe.'}</p>
                    </div>

                    <div>
                      <strong className="text-slate-900 block font-semibold mb-0.5">5.2. Quyền và nghĩa vụ của Chủ Bãi (Bên A):</strong>
                      <p className="whitespace-pre-line text-slate-600 pl-2 border-l-2 border-slate-300">{terms.owner_obligations || '1. Bố trí chỗ đỗ xe an toàn, duy trì hạ tầng, vệ sinh và hệ thống giám sát an ninh 24/7.\n2. Bảo quản phương tiện đỗ tại bãi theo quy định của Bộ luật Dân sự 2015; chịu trách nhiệm bồi thường thiệt hại theo quy định pháp luật nếu phương tiện bị mất mát hoặc hư hỏng do lỗi trực tiếp của bãi đỗ xe.\n3. Không được tự ý di chuyển hoặc giao phương tiện cho người thứ ba sử dụng khi chưa có sự đồng ý của khách thuê.'}</p>
                    </div>

                    <div>
                      <strong className="text-slate-900 block font-semibold mb-0.5">5.3. Điều khoản Chấm dứt hợp đồng:</strong>
                      <p className="whitespace-pre-line text-slate-600 pl-2 border-l-2 border-slate-300">{terms.termination_conditions || '1. Hợp đồng đương nhiên hết hiệu lực khi hết thời hạn thỏa thuận mà hai bên không gia hạn.\n2. Mỗi bên có quyền đơn phương chấm dứt hợp đồng trước hạn nếu bên kia vi phạm nghiêm trọng nghĩa vụ hợp đồng và phải thông báo bằng thông điệp dữ liệu điện tử/văn bản trước ít nhất 15 ngày.'}</p>
                    </div>

                    <div>
                      <strong className="text-slate-900 block font-semibold mb-0.5">5.4. Giải quyết tranh chấp:</strong>
                      <p className="whitespace-pre-line text-slate-600 pl-2 border-l-2 border-slate-300">{terms.dispute_resolution || '1. Hợp đồng điện tử này được lập và có giá trị pháp lý tuân thủ theo Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam.\n2. Mọi tranh chấp phát sinh sẽ được ưu tiên thương lượng, hòa giải trên nền tảng ParkLink. Trường hợp không thể tự thỏa thuận, tranh chấp sẽ do Tòa án nhân dân có thẩm quyền giải quyết.'}</p>
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
