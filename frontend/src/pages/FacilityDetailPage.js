import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewSection from '../components/ReviewSection';
import SendReservationModal from '../components/SendReservationModal';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { Send, MapPin, ArrowLeft, ShieldCheck, Car } from 'lucide-react';

const FacilityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const facilityId = parseInt(id, 10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  // Mock dữ liệu bãi đỗ xe cho đến khi có API Facility thật
  const mockFacility = {
    id: facilityId,
    name: 'Bãi đỗ xe Đại học Cần Thơ',
    address: 'Đường 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ',
    price_per_month: 1500000,
    price: '1.500.000 VNĐ / tháng',
    capacity: '10 slot'
  };

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      setToastMsg('Vui lòng đăng nhập tài khoản Khách hàng (Customer) để gửi yêu cầu thuê!');
      setToastType('error');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    if (user?.role?.name === 'PROVIDER') {
      setToastMsg('Tài khoản Chủ bãi xe (Provider) không thể gửi yêu cầu thuê! Vui lòng sử dụng tài khoản Khách hàng.');
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

  if (isNaN(facilityId)) {
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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{mockFacility.name}</h1>
              <p className="text-slate-600 flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" /> {mockFacility.address}
              </p>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <span className="block text-2xl font-extrabold text-teal-700">{mockFacility.price}</span>
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                Sức chứa: {mockFacility.capacity}
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

            <button
              onClick={handleOpenModal}
              className="w-full sm:w-auto px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Yêu Cầu Đặt Chỗ Ngay
            </button>
          </div>
        </div>

        {/* Phần 2: Đánh giá (Review Section) */}
        <ReviewSection facilityId={facilityId} />
      </div>

      {/* MODAL GỬI YÊU CẦU THUÊ */}
      <SendReservationModal
        facility={mockFacility}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleReservationSuccess}
      />
    </div>
  );
};

export default FacilityDetailPage;
