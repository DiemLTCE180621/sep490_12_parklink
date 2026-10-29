import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getConfirmationRecordDetail,
  acceptConfirmationRecord
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
  Printer
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

  const [customerAddress, setCustomerAddress] = useState('');
  const [customerIdCard, setCustomerIdCard] = useState('');

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

  const contractIssueDate = contract?.created_at ? new Date(contract.created_at) : new Date();

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8 print:bg-white print:p-0 print:m-0">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="w-full max-w-[1400px] mx-auto space-y-6 print:m-0 print:p-0 print:max-w-none">
        {/* TOP BAR / NAVIGATION - HIDDEN ON PRINT */}
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
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Chờ xác nhận
              </span>
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
            {/* STANDARD VIETNAMESE LEGAL CONTRACT CANVAS */}
            <div
              className="contract-paper-canvas bg-white border border-slate-300 shadow-md sm:rounded-lg p-6 sm:p-14 sm:max-w-[900px] mx-auto text-black print:p-0 print:border-none print:shadow-none print:max-w-none print:m-0"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {/* QUỐC HIỆU VÀ TIÊU NGỮ */}
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

          

              {/* THỜI GIAN & ĐỊA ĐIỂM */}
              <p className="text-xs sm:text-sm leading-relaxed text-black mb-4">
                Hôm nay, ngày {contractIssueDate.getDate()} tháng {contractIssueDate.getMonth() + 1} năm {contractIssueDate.getFullYear()}, tại {ownerInfo.facility_name || contract.reservation?.facility?.name} (Địa chỉ: {ownerInfo.facility_address || contract.reservation?.facility?.address}), hai bên gồm có:
              </p>

              {/* THÔNG TIN CÁC BÊN GIAO DỊCH */}
              <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-black mb-6">
                {/* 1. BÊN A */}
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

                {/* 2. BÊN B */}
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

              {/* ĐIỀU 1 */}
              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 1. Đối tượng gửi, giữ</p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  1.1. Bên A đồng ý nhận trông giữ và Bên B đồng ý gửi phương tiện xe ô tô theo đúng quy cách thông tin sau:
                </p>
                <p className="pl-8 text-xs sm:text-sm text-black">- Loại phương tiện / Dòng xe: <strong>{vehicleInfo.vehicle_type || 'Ô tô'}</strong></p>
                <p className="pl-8 text-xs sm:text-sm text-black">- Biển kiểm soát: <strong>{vehicleInfo.license_plate || vehicleInfo.vehicle_info_raw || contract.reservation?.vehicle_info}</strong></p>
                <p className="pl-8 text-xs sm:text-sm text-black">- Vị trí gửi đỗ: <strong>{rentalInfo.parking_spot || 'Vị trí đỗ tự do trong bãi'}</strong> tại {ownerInfo.facility_name || contract.reservation?.facility?.name}.</p>
              </div>

              {/* ĐIỀU 2 */}
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

              {/* ĐIỀU 3 */}
              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 3. Quyền và nghĩa vụ của Bên A</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {terms.owner_obligations ||
                    '- Yêu cầu bên gửi trả tiền dịch vụ trông giữ xe theo thỏa thuận.\n- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên B ít nhất 15 ngày.\n- Bảo quản xe ô tô theo đúng thỏa thuận, trả lại xe ô tô cho bên gửi theo đúng tình trạng như khi nhận giữ.\n- Chỉ được thay đổi cách bảo quản xe ô tô nếu việc thay đổi là cần thiết nhằm bảo quản tốt hơn xe ô tô đó, nhưng phải báo ngay cho bên gửi biết về việc thay đổi.\n- Thông báo kịp thời cho bên gửi biết về nguy cơ hư hỏng, tiêu hủy xe ô tô do tính chất của xe ô tô đó và yêu cầu bên gửi cho biết cách giải quyết trong một thời hạn; nếu hết thời hạn đó mà bên gửi không trả lời thì bên giữ có quyền thực hiện các biện pháp cần thiết để bảo quản và yêu cầu bên gửi thanh toán chi phí.\n- Quá thời gian thanh toán, bên A có quyền thu hồi vị trí gửi xe và yêu cầu bên B trả phí giữ xe.\n- Phải bồi thường thiệt hại, nếu làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Bảo quản cẩn thận xe gửi giữ, không được sử dụng xe trong thời gian bảo quản.'}
                </div>
              </div>

              {/* ĐIỀU 4 */}
              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 4. Quyền và nghĩa vụ của Bên B</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {terms.customer_obligations ||
                    '- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên A ít nhất 15 ngày.\n- Yêu cầu bồi thường thiệt hại, nếu bên giữ làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Phải trả đủ tiền dịch vụ trông giữ xe đúng thời hạn và đúng phương thức đã thỏa thuận. Trường hợp đóng tiền trễ so với thời gian quy định hợp đồng quá 3 lần/năm thì mặc định thanh lý hợp đồng trước thời hạn và khách hàng phải nộp tiền nợ (nếu có).\n- Trả phí giữ xe khi hết hạn hợp đồng mà không kịp thời nhận lại xe đã gửi.\n- Bên B tự bảo quản chìa khoá xe, thẻ xe, tài sản, tư trang trong xe ô tô.\n- Thực hiện theo đúng nội quy của bãi đậu xe.'}
                </div>
              </div>

              {/* ĐIỀU 5 */}
              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 5. Giải quyết tranh chấp</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {terms.dispute_resolution ||
                    '- Hai bên cần chủ động thông báo cho nhau biết tình hình thực hiện hợp đồng, nếu có gì bất lợi phát sinh, các bên phải kịp thời thông báo cho nhau biết và tích cực giải quyết trên cơ sở thương lượng, bình đẳng, có lợi (có lập biên bản).\n- Trường hợp các bên không tự giải quyết được mới đưa việc tranh chấp ra Tòa án có thẩm quyền để giải quyết.'}
                </div>
              </div>

              {/* ĐIỀU 6 */}
              <div className="space-y-1 mb-8">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 6. Điều khoản chung và hiệu lực hợp đồng</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {terms.termination_conditions ||
                    `- Hợp đồng này có hiệu lực kể từ ngày hai bên hoàn tất ký xác nhận điện tử đến ngày ${new Date(contract.end_date).toLocaleDateString('vi-VN')}. Hợp đồng đương nhiên được thanh lý khi hai bên hoàn thành toàn bộ các nghĩa vụ theo nội dung Hợp đồng và hai bên không có nhu cầu thỏa thuận gia hạn hợp đồng.\n- Mỗi bên có quyền chấm dứt hợp đồng trước thời hạn nhưng phải báo trước cho bên kia ít nhất 15 ngày.\n- Hợp đồng này được lập dưới dạng hợp đồng điện tử có giá trị pháp lý theo quy định của Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam; mỗi bên lưu giữ một bản có giá trị như nhau để thực hiện.`}
                </div>
              </div>

              {/* PHẦN CHỮ KÝ CỦA HAI BÊN */}
              <div className="pt-6 border-t border-black mt-8">
                <div className="grid grid-cols-2 gap-8 text-center text-xs sm:text-sm text-black">
                  {/* BÊN A */}
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

                  {/* BÊN B */}
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

            {/* CUSTOMER ACTION FOOTER - HIDDEN ON PRINT */}
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
