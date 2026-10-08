import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewSection from '../../components/common/ReviewSection';
import SendReservationModal from '../../components/modals/SendReservationModal';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import facilityService from '../../services/facilityService';
import { Send, MapPin, ArrowLeft, ShieldCheck, Car, MessageCircle } from 'lucide-react';

const FacilityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const facilityId = parseInt(id, 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchFacility = async () => {
      try {
        setLoading(true);
        const res = await facilityService.getFacilityById(facilityId);
        if (res?.data) {
          setFacility(res.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải chi tiết bãi đỗ xe:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!isNaN(facilityId)) {
      fetchFacility();
    }
  }, [facilityId]);

  const handleChatClick = async () => {
    if (!isAuthenticated) {
      setToastMsg('Vui lòng đăng nhập để nhắn tin!');
      setToastType('error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (user?.role?.name === 'PROVIDER') {
      setToastMsg('Chủ bãi không thể tự nhắn cho mình!');
      setToastType('error');
      return;
    }

    try {
      // Dùng tạm provider_id = facility.provider_id
      const providerId = facility.provider_id;
      const testFacilityId = facility.id; 
      const res = await chatService.getOrCreateRoom(user.id, providerId, testFacilityId, token);
      if (res.success) {
        navigate('/chat', { state: { activeRoomId: res.data.id } });
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message;
      setToastMsg('Lỗi khi tạo phòng chat: ' + errorMsg);
      setToastType('error');
    }
  };

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      setToastMsg('Vui lòng đăng nhập tài khoản Khách hàng để gửi yêu cầu thuê!');
      setToastType('error');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    if (user?.role?.name === 'PROVIDER') {
      setToastMsg('Tài khoản Chủ bãi xe không thể gửi yêu cầu thuê! Vui lòng sử dụng tài khoản Khách hàng.');
      setToastType('error');
      return;
    }

    setIsModalOpen(true);
  };

  const handleReservationSuccess = () => {
    setIsModalOpen(false);
    setToastType('success');
    setToastMsg('Gửi yêu cầu thuê bãi đỗ xe thành công! Đang chuyển hướng tới danh sách yêu cầu...');
    setTimeout(() => {
      navigate('/my-reservations');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-teal-600 font-bold animate-pulse">Đang tải thông tin...</div>
      </div>
    );
  }

  if (!facility || isNaN(facilityId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy bãi đỗ xe</h2>
          <button 
            onClick={() => navigate('/')}
            className="text-teal-600 font-semibold hover:underline"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* NÚT QUAY LẠI */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-200 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600" /> Quay Lại
          </button>
        </div>

        {/* Phần 1: Chi tiết Bãi đỗ xe */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-xs font-bold uppercase tracking-wider">
                Cho thuê theo tháng
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{facility.name}</h1>
              <p className="text-slate-600 flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" /> {facility.address}
              </p>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <span className="block text-2xl font-extrabold text-teal-700">{Number(facility.price_per_month).toLocaleString('vi-VN')} VNĐ / tháng</span>
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                Sức chứa: {facility.capacity}
              </span>
            </div>
          </div>

          {/* BANNER ẢNH BÃI ĐỖ XE */}
          <div className="w-full h-64 sm:h-80 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 font-semibold">
            <Car className="w-12 h-12 text-slate-300" />
            <span>[Hình ảnh bãi đỗ xe]</span>
          </div>

          {/* KHỐI NÚT YÊU CẦU ĐẶT CHỖ */}
          <div className="p-6 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <h3 className="font-extrabold text-lg">Đăng ký giữ chỗ hàng tháng</h3>
              </div>
              <p className="text-xs text-slate-300 max-w-lg">
                Gửi yêu cầu kèm thông tin xe và ngày bắt đầu thuê tới chủ bãi đỗ xe để được phê duyệt nhanh chóng.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={handleChatClick}
                className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> Nhắn Chủ Bãi
              </button>
              <button
                onClick={handleOpenModal}
                className="w-full sm:w-auto px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Yêu Cầu Đặt Chỗ
              </button>
            </div>
          </div>
        </div>

        {/* Phần 2: Đánh giá (Review Section) */}
        <ReviewSection facilityId={facilityId} />
      </div>

      {/* MODAL GỬI YÊU CẦU THUÊ */}
      <SendReservationModal
        facility={facility}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleReservationSuccess}
      />
    </div>
  );
};

export default FacilityDetailPage;
