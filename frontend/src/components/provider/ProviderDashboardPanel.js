import React, { useState, useEffect } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import providerService from '../../services/providerService';
import authService from '../../services/authService';
import Toast from '../common/Toast';

const ProviderDashboardPanel = () => {
  const { user } = useAuth();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  useEffect(() => {
    let intervalId;
    if (user?.facility?.verification_status === 'APPROVED' && user?.facility?.payment_status !== 'PAID') {
      intervalId = setInterval(async () => {
        try {
          const res = await authService.getCurrentUser();
          const latestFacility = res.data?.user?.facility;
          if (latestFacility && latestFacility.payment_status === 'PAID') {
            clearInterval(intervalId);
            setPaymentSuccess(true);
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
        }
      }, 5000); // Polling mỗi 5 giây
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const handleCheckPayment = async () => {
    try {
      setIsPaying(true);
      const res = await authService.getCurrentUser();
      const latestFacility = res.data?.user?.facility;
      
      if (latestFacility && latestFacility.payment_status === 'PAID') {
        setPaymentSuccess(true);
        setToastInfo({ message: "Thanh toán thành công! Bãi đỗ xe đã được kích hoạt.", type: 'success' });
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setToastInfo({ message: "Hệ thống chưa nhận được thanh toán. Vui lòng đợi thêm hoặc kiểm tra lại.", type: 'error' });
      }
    } catch (err) {
      setToastInfo({ message: "Không thể kiểm tra trạng thái thanh toán.", type: 'error' });
    } finally {
      setIsPaying(false);
    }
  };

  if (!user?.facility) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md text-center py-12">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-700">Chưa tìm thấy thông tin bãi đỗ xe</h3>
        <p className="text-sm text-slate-500 mt-1">Vui lòng đăng ký cơ sở bãi đỗ xe để bắt đầu quản lý.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-teal-100 shadow-md space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" /> Thông Tin Bãi Đỗ Xe (Facility)
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          user.facility.verification_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
          user.facility.verification_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          {user.facility.verification_status === 'APPROVED' ? 'Đã Duyệt' :
           user.facility.verification_status === 'REJECTED' ? 'Bị Từ Chối' : 'Chờ Duyệt'}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <label className="text-xs text-slate-400 font-semibold uppercase">Tên Bãi Đỗ Xe</label>
          <p className="text-base font-bold text-slate-900">{user.facility.name}</p>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-semibold uppercase">Địa chỉ chi tiết</label>
          <p className="text-slate-700 flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0" /> {user.facility.address}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500">Sức chứa</span>
            <p className="text-lg font-extrabold text-slate-900">{user.facility.capacity} slots</p>
          </div>

          <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100">
            <span className="text-xs text-teal-700">Giá thuê / tháng</span>
            <p className="text-lg font-extrabold text-teal-900">
              {Number(user.facility.price_per_month).toLocaleString('vi-VN')} VNĐ
            </p>
          </div>
        </div>
      </div>

      {user.facility.verification_status === 'APPROVED' && user.facility.visibility_status === 'HIDDEN' && (
        <div className="mt-6 p-6 border-2 border-dashed border-teal-200 rounded-3xl bg-teal-50 text-center space-y-4">
          <h4 className="font-bold text-teal-900 text-lg">Hoàn Tất Thanh Toán Phí Nền Tảng</h4>
          <p className="text-sm text-teal-800">Quét mã QR dưới đây bằng ứng dụng ngân hàng để thanh toán. Sau khi thanh toán, nhấn xác nhận để bãi đỗ xe của bạn được hiển thị công khai.</p>

          <div className="flex justify-center my-4">
            <img
              src={`https://img.vietqr.io/image/MB-881666787988-compact2.png?amount=${user.facility.system_fee / 100}&addInfo=${encodeURIComponent('PARKLINK F' + user.facility.id)}&accountName=PARKLINK`}
              alt="QR Code Thanh Toán"
              className="w-48 h-48 rounded-2xl shadow-lg border-2 border-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4">
            <button
              disabled={isPaying}
              onClick={handleCheckPayment}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 w-full sm:w-auto"
            >
              {isPaying ? 'Đang xử lý...' : 'Kiểm tra thanh toán'}
            </button>
          </div>
        </div>
      )}

      {user.facility.verification_status === 'APPROVED' && user.facility.visibility_status === 'VISIBLE' && (
        <div className="mt-4 p-4 border border-green-200 rounded-2xl bg-green-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-xl">🚀</span>
          </div>
          <div>
            <h4 className="font-bold text-green-900">Đang Hoạt Động Công Khai</h4>
            <p className="text-xs text-green-800">Cơ sở của bạn đã được thanh toán và đang hiển thị trên nền tảng cho khách hàng tìm kiếm.</p>
          </div>
        </div>
      )}

      {/* POPUP BỰ VUÔNG NGAY GIỮA */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-white p-10 max-w-md w-full text-center shadow-2xl transform transition-all scale-100 opacity-100" style={{ borderRadius: '16px' }}>
            <div className="w-24 h-24 bg-teal-50 rounded-xl flex items-center justify-center mx-auto mb-6 border-2 border-teal-100">
              <svg className="w-12 h-12 text-teal-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase">Thanh Toán Thành Công!</h3>
            <p className="text-slate-600 font-medium mb-8 text-base">
              Bãi đỗ xe của bạn đã được kích hoạt và hiển thị công khai trên hệ thống ParkLink.
            </p>
            <div className="w-full bg-slate-100 h-2 mb-3 overflow-hidden rounded">
              <div
                className="bg-teal-500 h-2 rounded"
                style={{
                  width: '100%',
                  transition: 'width 3s linear'
                }}
              ></div>
            </div>
            <p className="text-sm text-slate-400 font-bold animate-pulse">Đang tải lại hệ thống...</p>
          </div>
        </div>
      )}

      {toastInfo.message && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo({ message: '', type: 'success' })}
        />
      )}
    </div>
  );
};

export default ProviderDashboardPanel;
