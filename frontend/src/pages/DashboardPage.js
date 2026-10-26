import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useNavigate, Link } from 'react-router-dom';
import { User, Shield, Building2, LogOut, Car, Phone, Mail, KeyRound, UserCheck, Edit, FileText, AlertCircle, Star, Users, MapPin } from 'lucide-react';
import AdminRegistrationsPanel from '../components/admin/AdminRegistrationsPanel';
import AdminFacilitiesPanel from '../components/admin/AdminFacilitiesPanel';
import AdminUsersPanel from '../components/admin/AdminUsersPanel';
import AdminFieldInspectorsPanel from '../components/AdminFieldInspectorsPanel';
import FieldInspectorRegistrationsPanel from '../components/admin/FieldInspectorRegistrationsPanel';
import AdminComplaintsPanel from '../components/admin/AdminComplaintsPanel';
import AdminReviewsPanel from '../components/admin/AdminReviewsPanel';
import AdminContractsPanel from '../components/admin/AdminContractsPanel';
import ProviderDashboardPanel from '../components/provider/ProviderDashboardPanel';
import ProviderReservationsPanel from '../components/provider/ProviderReservationsPanel';
import ProviderContractsPanel from '../components/provider/ProviderContractsPanel';
import ProviderActiveCustomersPanel from '../components/provider/ProviderActiveCustomersPanel';
import ProviderComplaintsPanel from '../components/provider/ProviderComplaintsPanel';
import ProviderReviewsPanel from '../components/provider/ProviderReviewsPanel';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import EditProfileModal from '../components/EditProfileModal';
import Toast from '../components/common/Toast';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeAdminTab, setActiveAdminTab] = useState(location.state?.adminTab || 'registrations'); // Menu bên trái cho Admin
  const [activeProviderTab, setActiveProviderTab] = useState(location.state?.providerTab || 'facility'); // Menu bên trái cho Provider
  const [activeInspectorTab, setActiveInspectorTab] = useState('inspections'); // Menu bên trái cho Nhân viên khảo sát
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState(location.state?.message ? { message: location.state.message, type: location.state.type || 'success' } : null);

  React.useEffect(() => {
    if (location.state?.adminTab) {
      setActiveAdminTab(location.state.adminTab);
    }
    if (location.state?.providerTab) {
      setActiveProviderTab(location.state.providerTab);
    }
    if (location.state?.message) {
      setToastInfo({ message: location.state.message, type: location.state.type || 'success' });
    }
  }, [location.state]);

  const roleName = user?.role?.name || "CUSTOMER";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* WELCOME BANNER FULL WIDTH */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-6 sm:px-12 py-10 text-white shadow-xl mb-8">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-900 font-extrabold flex items-center justify-center text-xl shadow-md">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Xin chào, {user?.full_name}!
                </h1>
                <p className="text-teal-300 text-sm font-medium">
                  {roleName === 'PROVIDER'
                    ? 'Chủ Bãi Đỗ Xe'
                    : roleName === 'ADMIN'
                      ? 'Ban Quản Trị Hệ Thống'
                      : roleName === 'FIELD_INSPECTOR'
                        ? 'Nhân Viên Khảo Sát'
                        : 'Khách Thuê Bãi Xe'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/profile')}
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
        {/* CONTENT GRID BY ROLE */}
        {roleName === 'ADMIN' ? (
          <div className="flex flex-col md:flex-row gap-8">
            {/* SIDEBAR ADMIN */}
            <div className="w-full md:w-64 shrink-0 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-2">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3">
                  Menu Quản Trị
                </h3>
                <button
                  onClick={() => setActiveAdminTab("registrations")}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === "registrations" ? "bg-teal-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Building2 className="w-5 h-5" /> Duyệt Bãi Đỗ Xe
                </button>
                <button
                  onClick={() => setActiveAdminTab("users")}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === "users" ? "bg-teal-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}
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
                  onClick={() => setActiveAdminTab('contracts')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === 'contracts' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <FileText className="w-5 h-5" /> Quản Lý Hợp Đồng
                </button>
                <button
                  onClick={() => setActiveAdminTab("transactions")}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === "transactions" ? "bg-teal-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Shield className="w-5 h-5" /> Quản lý Giao Dịch
                </button>
                <button
                  onClick={() => setActiveAdminTab("complaints")}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === "complaints" ? "bg-teal-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <AlertCircle className="w-5 h-5 text-red-500" /> Quản lý Khiếu Nại
                </button>
                <button
                  onClick={() => setActiveAdminTab("reviews")}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeAdminTab === "reviews" ? "bg-teal-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Star className="w-5 h-5 text-amber-500" /> Quản Lý Đánh Giá
                </button>
              </div>
            </div>

            {/* NỘI DUNG ADMIN TƯƠNG ỨNG */}
            <div className="flex-1">
              {activeAdminTab === 'registrations' && <AdminRegistrationsPanel />}
              {activeAdminTab === 'facilities' && <AdminFacilitiesPanel />}
              {activeAdminTab === 'users' && <AdminUsersPanel />}
              {activeAdminTab === 'inspectors' && <AdminFieldInspectorsPanel />}
              {activeAdminTab === 'contracts' && <AdminContractsPanel />}
              {activeAdminTab === 'complaints' && <AdminComplaintsPanel />}
              {activeAdminTab === 'reviews' && <AdminReviewsPanel />}
              {activeAdminTab === 'transactions' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md text-center py-20">
                  <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-400">
                    Đang phát triển chức năng Quản lý Giao dịch...
                  </h3>
                </div>
              )}
            </div>
          </div>
        ) : roleName === 'PROVIDER' ? (
          <div className="flex flex-col md:flex-row gap-8">
            {/* SIDEBAR PROVIDER */}
            <div className="w-full md:w-64 shrink-0 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-2">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3">
                  Menu Chủ Bãi Xe
                </h3>
                <button
                  onClick={() => setActiveProviderTab('facility')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeProviderTab === 'facility' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Building2 className="w-5 h-5" /> Thông Tin Bãi Xe
                </button>
                <button
                  onClick={() => setActiveProviderTab('active-customers')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeProviderTab === 'active-customers' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Users className="w-5 h-5" /> Khách Đang Thuê
                </button>
                <button
                  onClick={() => setActiveProviderTab('reservations')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeProviderTab === 'reservations' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Car className="w-5 h-5" /> Duyệt Yêu Cầu Thuê
                </button>
                <button
                  onClick={() => setActiveProviderTab('contracts')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeProviderTab === 'contracts' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <FileText className="w-5 h-5" /> Quản Lý Hợp Đồng
                </button>
                <button
                  onClick={() => setActiveProviderTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeProviderTab === 'profile' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <User className="w-5 h-5" /> Thông Tin Cá Nhân
                </button>
                <button
                  onClick={() => setActiveProviderTab('transactions')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeProviderTab === 'transactions' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Shield className="w-5 h-5" /> Quản Lý Giao Dịch
                </button>
                <button
                  onClick={() => setActiveProviderTab('complaints')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeProviderTab === 'complaints' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <AlertCircle className="w-5 h-5 text-amber-500" /> Quản Lý Khiếu Nại
                </button>
                <button
                  onClick={() => setActiveProviderTab('reviews')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeProviderTab === 'reviews' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Star className="w-5 h-5 text-amber-500" /> Đánh Giá Khách Hàng
                </button>
              </div>
            </div>

            {/* NỘI DUNG PROVIDER TƯƠNG ỨNG */}
            <div className="flex-1">
              {activeProviderTab === 'facility' && <ProviderDashboardPanel />}
              {activeProviderTab === 'active-customers' && <ProviderActiveCustomersPanel />}
              {activeProviderTab === 'reservations' && (
                <ProviderReservationsPanel onNavigateToContracts={() => setActiveProviderTab('contracts')} />
              )}
              {activeProviderTab === 'contracts' && (
                <ProviderContractsPanel onNavigateToActiveCustomers={() => setActiveProviderTab('active-customers')} />
              )}
              {activeProviderTab === 'complaints' && <ProviderComplaintsPanel />}
              {activeProviderTab === 'reviews' && <ProviderReviewsPanel />}
              {activeProviderTab === 'profile' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" /> Thông Tin Cá Nhân
                  </h3>

                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Họ và Tên</label>
                      <p className="text-base font-bold text-slate-900">{user?.full_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Email Trực Tuyến</label>
                      <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" /> {user?.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Số Điện Thoại</label>
                      <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" /> {user?.phone_number || 'Chưa cập nhật'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Vai Trò Tài Khoản</label>
                      <p className="mt-1">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                          Chủ Bãi Đỗ Xe (Parking Provider)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {activeProviderTab === 'transactions' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md text-center py-20 space-y-3">
                  <Shield className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-700">Quản Lý Giao Dịch & Phí Nền Tảng</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Xem lịch sử thanh toán phí kích hoạt bãi đỗ xe và các giao dịch phát sinh trên hệ thống ParkLink.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : roleName === 'FIELD_INSPECTOR' ? (
          <div className="flex flex-col md:flex-row gap-8">
            {/* SIDEBAR FIELD INSPECTOR */}
            <div className="w-full md:w-64 shrink-0 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-2">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3">
                  Nhân Viên Khảo Sát
                </h3>
                <button
                  onClick={() => setActiveInspectorTab('inspections')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeInspectorTab === 'inspections' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Building2 className="w-5 h-5" /> Khảo Sát Thực Địa
                </button>
                <button
                  onClick={() => setActiveInspectorTab('profile')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition ${activeInspectorTab === 'profile' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <User className="w-5 h-5" /> Thông Tin Cá Nhân
                </button>
              </div>
            </div>

            {/* NỘI DUNG FIELD INSPECTOR TƯƠNG ỨNG */}
            <div className="flex-1">
              {activeInspectorTab === 'inspections' && <FieldInspectorRegistrationsPanel />}
              {activeInspectorTab === 'profile' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" /> Thông Tin Cá Nhân
                  </h3>

                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Họ và Tên</label>
                      <p className="text-base font-bold text-slate-900">{user?.full_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Email</label>
                      <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" /> {user?.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Số Điện Thoại</label>
                      <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" /> {user?.phone_number || 'Chưa cập nhật'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Địa Chỉ</label>
                      <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" /> {user?.address || 'Chưa cập nhật'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Vai Trò</label>
                      <p className="mt-1">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                          Nhân Viên Khảo Sát
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* CUSTOMER VIEW */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* USER PROFILE CARD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" /> Thông Tin Cá Nhân
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900 truncate">
                    {user?.email}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">
                    {user?.phone_number || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                    Khách Thuê
                  </span>
                </div>
              </div>
            </div>

            {/* DYNAMIC CONTENT FOR CUSTOMER */}
            <div className="md:col-span-2 space-y-6">

              {/* PANEL DÀNH CHO CUSTOMER HOẶC ROLE KHÁC */}
              {roleName !== 'PROVIDER' && roleName !== 'FIELD_INSPECTOR' && roleName !== 'ADMIN' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Car className="w-5 h-5 text-teal-600" /> Quản Lý Yêu Cầu
                      Thuê Bãi Xe
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
                        <h4 className="text-base font-bold">
                          Thuê Bãi Đỗ Xe Dài Hạn
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Quản lý và kiểm tra tiến độ duyệt các đăng ký thuê bãi
                          đỗ xe theo tháng
                        </p>
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

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSuccess={(msg) => setToastInfo({ message: msg, type: 'success' })}
      />
      {toastInfo && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
