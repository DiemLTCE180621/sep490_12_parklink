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
                  HỢP ĐỒNG GỬI GIỮ XE Ô TÔ
                </h1>
                <p className="text-xs text-slate-600 font-mono mt-1">
                  Số: <span className="font-bold text-slate-900">{contract.contract_code || contractInfo.contract_code}</span> /HĐDV
                </p>
                <p className="text-xs text-slate-500 italic mt-1">
                  Hôm nay, ngày {new Date(contract.created_at).getDate()} tháng {new Date(contract.created_at).getMonth() + 1} năm {new Date(contract.created_at).getFullYear()}, tại {ownerInfo.facility_name || contract.reservation?.facility?.name}
                </p>
              </div>

              {/* THÔNG TIN CÁC BÊN THAM GIA */}
              <div className="space-y-4">
                <p className="text-xs sm:text-sm font-bold text-slate-800">Chúng tôi gồm có:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* BÊN A */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
                    <span className="font-extrabold text-slate-900 block uppercase text-xs border-b border-slate-200 pb-1.5 text-teal-800">
                      Bên A (Bên giữ xe ô tô)
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {ownerInfo.facility_name || contract.reservation?.facility?.name}
                    </p>
                    <p>
                      <span className="text-slate-500">Đại diện:</span>{' '}
                      <strong>{ownerInfo.provider_name || contract.reservation?.facility?.provider?.full_name}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">Địa chỉ:</span>{' '}
                      {ownerInfo.facility_address || contract.reservation?.facility?.address}
                    </p>
                    <p>
                      <span className="text-slate-500">Điện thoại:</span>{' '}
                      {ownerInfo.provider_phone || contract.reservation?.facility?.provider?.phone_number || 'N/A'}
                    </p>
                    {ownerInfo.provider_email && (
                      <p>
                        <span className="text-slate-500">Email:</span> {ownerInfo.provider_email}
                      </p>
                    )}
                  </div>

                  {/* BÊN B */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
                    <span className="font-extrabold text-slate-900 block uppercase text-xs border-b border-slate-200 pb-1.5 text-teal-800">
                      Bên B (Bên gửi xe ô tô)
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      Ông (bà): {customerInfo.customer_name || contract.reservation?.customer?.full_name}
                    </p>
                    <p>
                      <span className="text-slate-500">Điện thoại số:</span>{' '}
                      {customerInfo.customer_phone || contract.reservation?.customer?.phone_number || 'Chưa cập nhật'}
                    </p>
                    <p>
                      <span className="text-slate-500">Email:</span>{' '}
                      {customerInfo.customer_email || contract.reservation?.customer?.email}
                    </p>
                    <p>
                      <span className="text-slate-500">Địa chỉ liên hệ:</span>{' '}
                      {customerInfo.customer_address || 'Cần Thơ'}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 italic pt-1">
                  Hai bên sau khi bàn bạc đã thống nhất nội dung hợp đồng gửi giữ xe ô tô như sau:
                </p>
              </div>

              {/* ĐIỀU 1: ĐỐI TƯỢNG GỬI GIỮ */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  Điều 1: Đối tượng gửi, giữ
                </h4>
                <div className="space-y-1.5 pl-3 border-l-2 border-teal-500 text-xs sm:text-sm text-slate-700">
                  <p>
                    - Loại xe:{' '}
                    <strong className="text-slate-900">{vehicleInfo.vehicle_type || 'Ô tô'}</strong>
                  </p>
                  <p>
                    - Biển kiểm soát:{' '}
                    <strong className="text-teal-800 font-mono text-sm">
                      {vehicleInfo.license_plate || vehicleInfo.vehicle_info_raw || contract.reservation?.vehicle_info}
                    </strong>
                  </p>
                </div>
              </div>

              {/* ĐIỀU 2: GIÁ CẢ VÀ PHƯƠNG THỨC VÀ THỜI HẠN THANH TOÁN */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  Điều 2: Giá cả và phương thức và thời hạn thanh toán
                </h4>
                <div className="space-y-2 pl-3 border-l-2 border-teal-500 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p>
                    - Giá cả:{' '}
                    <strong className="text-teal-800 font-bold text-sm">
                      {Number(contract.agreed_price || rentalInfo.agreed_price || 0).toLocaleString('vi-VN')} đồng/tháng/xe.
                    </strong>
                  </p>
                  <div>
                    <p>- Phương thức thanh toán: Chuyển khoản hoặc nộp tiền mặt.</p>
                    <p className="pl-4 text-slate-600">
                      + Chuyển khoản: Chuyển khoản vào tài khoản của Bên A (Nội dung chuyển khoản:{' '}
                      <em>Ghi tên, Biển số xe, Tháng đóng tiền</em>).
                    </p>
                    <p className="pl-4 text-slate-600">
                      + Tiền mặt: Nộp tại bộ phận Văn thư - Thủ quỹ / Tổ Bảo vệ của bãi xe.
                    </p>
                  </div>
                  <p>
                    - Thời hạn thanh toán: Bên B thanh toán tiền dịch vụ trông giữ xe hàng tháng cho Bên A. Việc thanh toán được thực hiện định kỳ trước ngày{' '}
                    <strong className="text-slate-900">
                      {contract.payment_deadline_day || rentalInfo.payment_deadline_day || 5}
                    </strong>{' '}
                    hàng tháng.
                  </p>
                  <p>
                    - Thời gian gửi: Từ ngày{' '}
                    <strong className="text-slate-900">
                      {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                    </strong>{' '}
                    đến ngày{' '}
                    <strong className="text-slate-900">
                      {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                    </strong>
                    .
                  </p>
                  <p>
                    - Vị trí gửi:{' '}
                    <strong className="text-slate-900">
                      {rentalInfo.parking_spot || 'Bãi xe'}
                    </strong>{' '}
                    tại {ownerInfo.facility_name || contract.reservation?.facility?.name}.
                  </p>
                </div>
              </div>

              {/* ĐIỀU 3: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  Điều 3: Quyền và nghĩa vụ của Bên A
                </h4>
                <div className="pl-3 border-l-2 border-teal-500 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p className="whitespace-pre-line text-slate-700">
                    {terms.owner_obligations ||
                      '- Yêu cầu bên gửi trả tiền dịch vụ trông giữ xe theo thỏa thuận.\n- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên B ít nhất 15 ngày.\n- Bảo quản xe ô tô theo đúng thỏa thuận, trả lại xe ô tô cho bên gửi theo đúng tình trạng như khi nhận giữ.\n- Chỉ được thay đổi cách bảo quản xe ô tô nếu việc thay đổi là cần thiết nhằm bảo quản tốt hơn xe ô tô đó, nhưng phải báo ngay cho bên gửi biết về việc thay đổi.\n- Thông báo kịp thời cho bên gửi biết về nguy cơ hư hỏng, tiêu hủy xe ô tô do tính chất của xe ô tô đó và yêu cầu bên gửi cho biết cách giải quyết trong một thời hạn; nếu hết thời hạn đó mà bên gửi không trả lời thì bên giữ có quyền thực hiện các biện pháp cần thiết để bảo quản và yêu cầu bên gửi thanh toán chi phí.\n- Quá thời gian thanh toán, bên A có quyền thu hồi vị trí gửi xe và yêu cầu bên B trả phí giữ xe.\n- Phải bồi thường thiệt hại, nếu làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Bảo quản cẩn thận xe gửi giữ, không được sử dụng xe trong thời gian bảo quản.'}
                  </p>
                </div>
              </div>

              {/* ĐIỀU 4: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  Điều 4: Quyền và nghĩa vụ của Bên B
                </h4>
                <div className="pl-3 border-l-2 border-teal-500 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p className="whitespace-pre-line text-slate-700">
                    {terms.customer_obligations ||
                      '- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên A ít nhất 15 ngày.\n- Yêu cầu bồi thường thiệt hại, nếu bên giữ làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Phải trả đủ tiền dịch vụ trông giữ xe đúng thời hạn và đúng phương thức đã thỏa thuận. Trường hợp đóng tiền trễ so với thời gian quy định hợp đồng quá 3 lần/năm thì mặc định thanh lý hợp đồng trước thời hạn và khách hàng phải nộp tiền nợ (nếu có).\n- Trả phí giữ xe khi hết hạn hợp đồng mà không kịp thời nhận lại xe đã gửi.\n- Bên B tự bảo quản chìa khoá xe, thẻ xe, tài sản, tư trang trong xe ô tô.\n- Thực hiện theo đúng nội quy của bãi đậu xe.'}
                  </p>
                </div>
              </div>

              {/* ĐIỀU 5: GIẢI QUYẾT TRANH CHẤP */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  Điều 5: Giải quyết tranh chấp
                </h4>
                <div className="pl-3 border-l-2 border-teal-500 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p className="whitespace-pre-line text-slate-700">
                    {terms.dispute_resolution ||
                      '- Hai bên cần chủ động thông báo cho nhau biết tình hình thực hiện hợp đồng, nếu có gì bất lợi phát sinh, các bên phải kịp thời thông báo cho nhau biết và tích cực giải quyết trên cơ sở thương lượng, bình đẳng, có lợi (có lập biên bản).\n- Trường hợp các bên không tự giải quyết được mới đưa việc tranh chấp ra Tòa án giải quyết.'}
                  </p>
                </div>
              </div>

              {/* ĐIỀU 6: HIỆU LỰC CỦA HỢP ĐỒNG */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5">
                  Điều 6: Hiệu lực của hợp đồng
                </h4>
                <div className="pl-3 border-l-2 border-teal-500 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p className="whitespace-pre-line text-slate-700">
                    {terms.termination_conditions ||
                      `- Hợp đồng này có hiệu lực từ ngày ${new Date(contract.start_date).toLocaleDateString('vi-VN')} – ${new Date(contract.end_date).toLocaleDateString('vi-VN')}. Hợp đồng đương nhiên được thanh lý khi hai bên hoàn thành toàn bộ các nghĩa vụ theo nội dung Hợp đồng và hai bên không có nhu cầu thỏa thuận gia hạn hợp đồng.\n- Mỗi bên có quyền chấm dứt hợp đồng trước thời hạn nhưng phải báo trước cho bên kia ít nhất 15 ngày.\n- Hợp đồng này được lập dưới dạng hợp đồng điện tử có giá trị pháp lý theo quy định của Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam; mỗi bên lưu giữ một bản có giá trị như nhau để thực hiện.`}
                  </p>
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
                    <span className="font-extrabold text-slate-900 block uppercase text-xs">
                      ĐẠI DIỆN BÊN A (BÊN GIỮ XE Ô TÔ)
                    </span>
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
                    <span className="font-extrabold text-slate-900 block uppercase text-xs">
                      ĐẠI DIỆN BÊN B (BÊN GỬI XE Ô TÔ)
                    </span>
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
