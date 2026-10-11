import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getConfirmationRecordDetail,
  acceptConfirmationRecord
} from '../services/confirmationRecordService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/modals/ConfirmModal';
import Toast from '../components/common/Toast';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  CheckSquare,
  Square
} from 'lucide-react';

const ContractDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCustomer = user?.role?.name === 'CUSTOMER' || user?.role === 'CUSTOMER';

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

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

  const handleExecuteAccept = async () => {
    try {
      setAccepting(true);
      const res = await acceptConfirmationRecord(id);
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
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* TOP BAR / NAVIGATION - HIDDEN ON PRINT */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => {
              if (isCustomer) {
                navigate('/my-contracts');
              } else {
                navigate(-1);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" />
            {isCustomer ? 'Quay Lại Danh Sách Hợp Đồng' : 'Quay Lại Trang Trước'}
          </button>

          <div className="flex items-center gap-3">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4" /> Đã Ký - Có Hiệu Lực
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-4 h-4" /> Chờ Ký Điện Tử
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
            <p className="text-slate-600 font-semibold text-sm">Đang tải văn bản hợp đồng điện tử #{id}...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 border border-red-200 shadow-sm text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Không thể tải hợp đồng</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchDetail}
              className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow hover:bg-teal-700 transition"
            >
              Thử Lại
            </button>
          </div>
        ) : contract ? (
          <div className="space-y-6">
            {/* REAL LEGAL PAPER DOCUMENT CANVAS */}
            <div className="bg-white border border-slate-300 shadow-lg rounded-2xl p-6 sm:p-14 space-y-8 font-sans leading-relaxed text-slate-800 text-xs sm:text-sm">
              {/* NATIONAL EMBLEM & TITLE */}
              <div className="text-center space-y-1.5 pb-6 border-b border-slate-200">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </h3>
                <p className="text-xs sm:text-sm font-bold text-slate-700">Độc lập - Tự do - Hạnh phúc</p>
                <div className="w-24 h-0.5 bg-slate-800 mx-auto my-3"></div>

                <h1 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight mt-6">
                  BIÊN BẢN XÁC NHẬN & HỢP ĐỒNG ĐIỆN TỬ
                </h1>
                <p className="text-xs sm:text-sm font-extrabold text-teal-800 uppercase mt-1">
                  CHO THUÊ BÃI ĐỖ XE THEO THÁNG
                </p>
                <p className="text-xs text-slate-500 font-mono mt-2">
                  Mã hợp đồng: <span className="font-bold text-slate-800">{contract.contract_code || contractInfo.contract_code}</span> | Ngày lập:{' '}
                  {new Date(contract.created_at).toLocaleDateString('vi-VN')}
                </p>
              </div>

              {/* 1. THỜI HẠN HIỆU LỰC */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  1. Thông Tin Thời Hạn Hiệu Lực
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-slate-500 block">Ngày bắt đầu hiệu lực:</span>
                    <strong className="text-slate-900 text-sm">
                      {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ngày kết thúc hiệu lực:</span>
                    <strong className="text-slate-900 text-sm">
                      {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. CÁC BÊN THAM GIA */}
              <div className="space-y-4">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  2. Các Bên Tham Gia Hợp Đồng
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* BÊN A */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-extrabold text-slate-900 block text-xs uppercase border-b border-slate-200 pb-1 text-teal-800">
                      BÊN CHO THUÊ (BÊN A - CHỦ BÃI XE)
                    </span>
                    <p>
                      <span className="text-slate-500">Bãi xe:</span>{' '}
                      <strong>{ownerInfo.facility_name || contract.reservation?.facility?.name}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">Chủ cơ sở:</span>{' '}
                      <strong>{ownerInfo.provider_name || contract.reservation?.facility?.provider?.full_name}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">SĐT:</span>{' '}
                      {ownerInfo.provider_phone || contract.reservation?.facility?.provider?.phone_number}
                    </p>
                    <p>
                      <span className="text-slate-500">Email:</span>{' '}
                      {ownerInfo.provider_email || contract.reservation?.facility?.provider?.email}
                    </p>
                    <p>
                      <span className="text-slate-500">Địa chỉ:</span>{' '}
                      {ownerInfo.facility_address || contract.reservation?.facility?.address}
                    </p>
                  </div>

                  {/* BÊN B */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-extrabold text-slate-900 block text-xs uppercase border-b border-slate-200 pb-1 text-teal-800">
                      BÊN THUÊ (BÊN B - KHÁCH THUÊ XE)
                    </span>
                    <p>
                      <span className="text-slate-500">Họ tên:</span>{' '}
                      <strong>{customerInfo.customer_name || contract.reservation?.customer?.full_name}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">SĐT:</span>{' '}
                      {customerInfo.customer_phone || contract.reservation?.customer?.phone_number || 'Chưa cập nhật'}
                    </p>
                    <p>
                      <span className="text-slate-500">Email:</span>{' '}
                      {customerInfo.customer_email || contract.reservation?.customer?.email}
                    </p>
                    <p>
                      <span className="text-slate-500">Địa chỉ:</span>{' '}
                      {customerInfo.customer_address || 'Cần Thơ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. PHƯƠNG TIỆN ĐĂNG KÝ */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  3. Thông Tin Phương Tiện Đăng Ký Đỗ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-slate-500 block">Loại xe:</span>
                    <strong className="text-slate-900">{vehicleInfo.vehicle_type || 'Ô tô'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Biển số / Mô tả xe:</span>
                    <strong className="text-teal-800 font-mono text-sm">
                      {vehicleInfo.license_plate || vehicleInfo.vehicle_info_raw || contract.reservation?.vehicle_info}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 4. VỊ TRÍ & CHI PHÍ */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  4. Vị Trí Đỗ Xe & Phí Thuê Hàng Tháng
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <span className="text-slate-500 block">Vị trí / Slot đỗ:</span>
                    <strong className="text-slate-900">{rentalInfo.parking_spot || 'Chỗ đỗ tự do'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Giá thuê tháng:</span>
                    <strong className="text-teal-800 font-black text-base">
                      {Number(contract.agreed_price || rentalInfo.agreed_price || 0).toLocaleString('vi-VN')} VNĐ/tháng
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hạn thanh toán hàng tháng:</span>
                    <strong className="text-amber-800">
                      Trước ngày {contract.payment_deadline_day || rentalInfo.payment_deadline_day || 5} hàng tháng
                    </strong>
                  </div>
                </div>
              </div>

              {/* 5. CÁC ĐIỀU KHOẢN VÀ NGHĨA VỤ */}
              <div className="space-y-3">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  5. Các Điều Khoản & Quy Định Pháp Lý (Bộ luật Dân sự 2015 & Luật GDĐT)
                </h4>

                <div className="space-y-3 text-slate-700 leading-relaxed">
                  <div>
                    <strong className="text-slate-900 block font-bold mb-1">
                      5.1. Quyền và nghĩa vụ của Khách Thuê (Bên B):
                    </strong>
                    <p className="whitespace-pre-line text-slate-600 pl-3 border-l-2 border-teal-500">
                      {terms.customer_obligations ||
                        '1. Thanh toán đầy đủ tiền thuê bãi đỗ xe theo đúng hạn thỏa thuận hàng tháng.\n2. Đỗ xe đúng vị trí được phân công, tuân thủ nghiêm ngặt nội quy bãi xe và quy định về Phòng cháy chữa cháy (PCCC).\n3. Thông báo rõ cho chủ bãi về tình trạng hoặc đặc tính nguy hiểm của phương tiện (nếu có).\n4. Tự bảo quản các vật dụng tài sản cá nhân có giá trị rời để bên trong xe.'}
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-900 block font-bold mb-1">
                      5.2. Quyền và nghĩa vụ của Chủ Bãi (Bên A):
                    </strong>
                    <p className="whitespace-pre-line text-slate-600 pl-3 border-l-2 border-teal-500">
                      {terms.owner_obligations ||
                        '1. Bố trí chỗ đỗ xe an toàn, duy trì hạ tầng, vệ sinh và hệ thống giám sát an ninh 24/7.\n2. Bảo quản phương tiện đỗ tại bãi theo quy định của Bộ luật Dân sự 2015; chịu trách nhiệm bồi thường thiệt hại theo quy định pháp luật nếu phương tiện bị mất mát hoặc hư hỏng do lỗi trực tiếp của bãi đỗ xe.\n3. Không được tự ý di chuyển hoặc giao phương tiện cho người thứ ba sử dụng khi chưa có sự đồng ý của khách thuê.'}
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-900 block font-bold mb-1">
                      5.3. Điều khoản Chấm dứt hợp đồng:
                    </strong>
                    <p className="whitespace-pre-line text-slate-600 pl-3 border-l-2 border-teal-500">
                      {terms.termination_conditions ||
                        '1. Hợp đồng đương nhiên hết hiệu lực khi hết thời hạn thỏa thuận mà hai bên không gia hạn.\n2. Mỗi bên có quyền đơn phương chấm dứt hợp đồng trước hạn nếu bên kia vi phạm nghiêm trọng nghĩa vụ hợp đồng và phải thông báo bằng thông điệp dữ liệu điện tử/văn bản trước ít nhất 15 ngày.'}
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-900 block font-bold mb-1">
                      5.4. Giải quyết tranh chấp:
                    </strong>
                    <p className="whitespace-pre-line text-slate-600 pl-3 border-l-2 border-teal-500">
                      {terms.dispute_resolution ||
                        '1. Hợp đồng điện tử này được lập và có giá trị pháp lý tuân thủ theo Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam.\n2. Mọi tranh chấp phát sinh sẽ được ưu tiên thương lượng, hòa giải trên nền tảng ParkLink. Trường hợp không thể tự thỏa thuận, tranh chấp sẽ do Tòa án nhân dân có thẩm quyền giải quyết.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. CHỮ KÝ ĐIỆN TỬ HAI BÊN */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase text-center tracking-wider">
                  6. XÁC NHẬN CHỮ KÝ ĐIỆN TỬ HAI BÊN
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
                  {/* BÊN A */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <span className="font-extrabold text-slate-900 block uppercase text-xs">BÊN CHO THUÊ (BÊN A)</span>
                    <p className="font-bold text-slate-900 text-sm">
                      {ownerInfo.provider_name || contract.reservation?.facility?.provider?.full_name}
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      <ShieldCheck className="w-4 h-4 text-teal-600" /> Đã Lập & Xác Nhận Điện Tử
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {new Date(contract.provider_agreed_at || contract.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>

                  {/* BÊN B */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <span className="font-extrabold text-slate-900 block uppercase text-xs">BÊN THUÊ (BÊN B)</span>
                    <p className="font-bold text-slate-900 text-sm">
                      {customerInfo.customer_name || contract.reservation?.customer?.full_name}
                    </p>

                    {isActive || contract.customer_agreed_at ? (
                      <>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã Xác Nhận Ký Điện Tử
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {new Date(contract.customer_agreed_at).toLocaleString('vi-VN')}
                        </p>
                      </>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-4 h-4 text-amber-600" /> Chờ Khách Hàng Xác Nhận Ký
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CUSTOMER ACTION FOOTER - HIDDEN ON PRINT */}
            {isCustomer && isPendingSignature && (
              <div className="print:hidden bg-white rounded-2xl p-6 border border-slate-200 shadow-md space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setIsTermsAgreed(!isTermsAgreed)}
                    className="mt-0.5 text-teal-600 focus:outline-none shrink-0"
                  >
                    {isTermsAgreed ? (
                      <CheckSquare className="w-6 h-6 text-teal-600" />
                    ) : (
                      <Square className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                  <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    Tôi là <strong>{customerInfo.customer_name || contract.reservation?.customer?.full_name}</strong>,
                    xác nhận đã đọc kỹ, hiểu rõ và hoàn toàn đồng ý với toàn bộ nội dung, quyền và nghĩa vụ trong hợp đồng
                    điện tử này.
                  </span>
                </label>

                <button
                  type="button"
                  disabled={!isTermsAgreed || accepting}
                  onClick={() => setConfirmModalOpen(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base rounded-xl shadow-lg shadow-teal-600/20 transition flex items-center justify-center gap-2"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" /> Đang Ký Hợp Đồng...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" /> Xác Nhận Ký Hợp Đồng Điện Tử Ngay
                    </>
                  )}
                </button>
              </div>
            )}

            {/* IF ACTIVE, OPTION TO SUBMIT COMPLAINT */}
            {isCustomer && isActive && contract.reservation?.facility_id && (
              <div className="print:hidden bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  Nếu bạn gặp sự cố hoặc bãi đỗ xe vi phạm cam kết, bạn có thể gửi phản ánh tới hệ thống.
                </div>
                <Link
                  to={`/submit-complaint/${contract.reservation?.id}`}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition shrink-0"
                >
                  Khiếu Nại Bãi Xe
                </Link>
              </div>
            )}
          </div>
        ) : null}
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

export default ContractDetailPage;
