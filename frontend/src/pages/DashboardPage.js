import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Shield, Building2, LogOut, Car, Phone, Mail, MapPin, KeyRound, UserCheck, Edit } from 'lucide-react';
import AdminRegistrationsPanel from '../components/AdminRegistrationsPanel';
import AdminFacilitiesPanel from '../components/AdminFacilitiesPanel';
import Toast from '../components/Toast';
import AdminUsersPanel from '../components/AdminUsersPanel';
import AdminFieldInspectorsPanel from '../components/AdminFieldInspectorsPanel';
import ChangePasswordModal from '../components/ChangePasswordModal';
import EditProfileModal from '../components/EditProfileModal';
import providerService from '../services/providerService';
import authService from '../services/authService';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeAdminTab, setActiveAdminTab] = useState('registrations'); // Trạng thái chọn menu bên trái cho Admin
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const roleName = user?.role?.name || 'CUSTOMER';

  useEffect(() => {
    let intervalId;
    if (roleName === 'PROVIDER' && user?.facility?.verification_status === 'APPROVED' && user?.facility?.payment_status !== 'PAID') {
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
  }, [roleName, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleConfirmPayment = async () => {
    try {
      setIsPaying(true);
      await providerService.confirmPayment(user.facility.id);
      setPaymentSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      setToastInfo({ message: err.response?.data?.message || err.message, type: 'error' });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* WELCOME BANNER FULL WIDTH */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-6 sm:px-12 py-10 text-white shadow-xl mb-8">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-900 font-extrabold flex items-center justify-center text-xl shadow-md">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Xin chào, {user?.full_name}!</h1>
                <p className="text-teal-300 text-sm font-medium">
                  {roleName === 'PROVIDER' ? 'Chủ Bãi Đỗ Xe' : roleName === 'ADMIN' ? 'Ban Quản Trị Hệ Thống' : 'Khách Thuê Bãi Xe'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsEditProfileModalOpen(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
            >
              <Edit className="w-4 h-4" /> Sửa Hồ Sơ
            </button>
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl border border-slate-700 shadow transition flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" /> Đổi Mật Khẩu
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Đăng Xuất
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 w-full mx-auto space-y-8">
        {/* CONTENT GRID */}
        {roleName === 'ADMIN' ? (
          <div className="flex flex-col md:flex-row gap-8">
            {/* SIDEBAR ADMIN */}
            <div className="w-full md:w-64 shrink-0 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-2">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3">
                  Menu Quản Trị
                </h3>
                <button
                  onClick={() => setActiveAdminTab('registrations')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === 'registrations' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Building2 className="w-5 h-5" /> Duyệt Bãi Đỗ Xe
                </button>
                <button
                  onClick={() => setActiveAdminTab('users')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === 'users' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <User className="w-5 h-5" /> Quản lý Users
                </button>
                <button
                  onClick={() => setActiveAdminTab('inspectors')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === 'inspectors' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <UserCheck className="w-5 h-5" /> Nhân Viên Khảo Sát
                </button>
                <button
                  onClick={() => setActiveAdminTab('facilities')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === 'facilities' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Building2 className="w-5 h-5" /> Tất cả cơ sở
                </button>
                <button
                  onClick={() => setActiveAdminTab('transactions')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === 'transactions' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Shield className="w-5 h-5" /> Quản lý Giao Dịch
                </button>
              </div>
            </div>

            {/* NỘI DUNG ADMIN TƯƠNG ỨNG */}
            <div className="flex-1">
              {activeAdminTab === 'registrations' && <AdminRegistrationsPanel />}
              {activeAdminTab === 'facilities' && <AdminFacilitiesPanel />}

              {activeAdminTab === 'users' && <AdminUsersPanel />}
              {activeAdminTab === 'inspectors' && <AdminFieldInspectorsPanel />}

              {activeAdminTab === 'transactions' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md text-center py-20">
                  <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-400">Đang phát triển chức năng Quản lý Giao dịch...</h3>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* USER PROFILE CARD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" /> Thông Tin Cá Nhân
                </h3>
                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="p-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition flex items-center gap-1"
                  title="Chỉnh sửa thông tin cá nhân"
                >
                  <Edit className="w-4 h-4" /> Sửa
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900 truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">{user?.phone_number || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                    {roleName === 'ADMIN' ? 'Quản Trị Viên' : roleName === 'PROVIDER' ? 'Chủ Bãi Xe' : 'Khách Thuê'}
                  </span>
                </div>
              </div>
            </div>

            {/* DYNAMIC CONTENT PER ROLE */}
            <div className="md:col-span-2 space-y-6">
              {/* PANEL DÀNH CHO PROVIDER / OWNER */}
              {roleName === 'PROVIDER' && user?.facility && (
                <div className="bg-white p-6 rounded-3xl border border-teal-100 shadow-md space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-teal-600" /> Thông Tin Bãi Đỗ Xe (Facility)
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.facility.verification_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
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
                          onClick={handleConfirmPayment}
                          className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 w-full sm:w-auto"
                        >
                          {isPaying ? 'Đang xử lý...' : 'Tôi đã thanh toán thủ công'}
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

                  {/* LINK TỚI TRANG QUẢN LÝ YÊU CẦU THUÊ CỦA KHÁCH HÀNG */}
                  <div className="mt-6 p-5 bg-gradient-to-r from-slate-900 to-teal-950 rounded-2xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
                    <div>
                      <h4 className="font-extrabold text-base flex items-center gap-2">
                        <Car className="w-5 h-5 text-teal-400" /> Quản Lý Yêu Cầu Thuê Xe Của Khách Hang
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Xem danh sách khách hàng gửi yêu cầu đăng ký thuê bãi đỗ xe theo tháng và duyệt/từ chối.
                      </p>
                    </div>

                    <Link
                      to="/provider/reservations"
                      className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-xs rounded-xl shadow transition shrink-0"
                    >
                      Duyệt Yêu Cầu Thuê &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* PANEL DÀNH CHO CUSTOMER HOẶC ADMIN */}
              {roleName !== 'PROVIDER' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Car className="w-5 h-5 text-teal-600" /> Quản Lý Yêu Cầu Thuê Bãi Xe
                    </h3>
                    <Link
                      to="/my-reservations"
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
                    >
                      Xem tất cả &rarr;
                    </Link>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl shadow-inner space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold">Thuê Bãi Đỗ Xe Dài Hạn</h4>
                        <p className="text-xs text-slate-300 mt-0.5">Quản lý và kiểm tra tiến độ duyệt các đăng ký thuê bãi đỗ xe theo tháng</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link
                        to="/my-reservations"
                        className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-sm rounded-xl shadow transition"
                      >
                        Danh Sách Yêu Cầu Thuê Của Tôi
                      </Link>
                      <Link
                        to="/facilities"
                        className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition"
                      >
                        Tìm Bãi Đỗ Xe Mới
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSuccess={(msg) => setToastInfo({ message: msg, type: 'success' })}
      />
    </div>
  );
};

export default DashboardPage;
