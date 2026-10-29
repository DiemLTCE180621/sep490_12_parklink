import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Shield, Building2, LogOut, Car, Phone, Mail, KeyRound, 
  UserCheck, Edit, FileText, AlertCircle, Star, DollarSign, Users, 
  MapPin, Radio, ChevronRight, Menu, ShieldCheck, X 
} from 'lucide-react';
import AdminRegistrationsPanel from '../components/admin/AdminRegistrationsPanel';
import AdminFacilitiesPanel from '../components/admin/AdminFacilitiesPanel';
import AdminUsersPanel from '../components/admin/AdminUsersPanel';
import AdminFieldInspectorsPanel from '../components/admin/AdminFieldInspectorsPanel';
import FieldInspectorRegistrationsPanel from '../components/admin/FieldInspectorRegistrationsPanel';
import AdminComplaintsPanel from '../components/admin/AdminComplaintsPanel';
import AdminReviewsPanel from '../components/admin/AdminReviewsPanel';
import AdminPlatformFeesPanel from '../components/admin/AdminPlatformFeesPanel';
import AdminContractsPanel from '../components/admin/AdminContractsPanel';
import AdminBroadcastPanel from '../components/admin/AdminBroadcastPanel';
import ProviderDashboardPanel from '../components/provider/ProviderDashboardPanel';
import ProviderReservationsPanel from '../components/provider/ProviderReservationsPanel';
import ProviderContractsPanel from '../components/provider/ProviderContractsPanel';
import ProviderActiveCustomersPanel from '../components/provider/ProviderActiveCustomersPanel';
import ProviderComplaintsPanel from '../components/provider/ProviderComplaintsPanel';
import ProviderReviewsPanel from '../components/provider/ProviderReviewsPanel';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import Toast from '../components/common/Toast';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeAdminTab, setActiveAdminTab] = useState(location.state?.adminTab || 'registrations');
  const [activeProviderTab, setActiveProviderTab] = useState(location.state?.providerTab || 'facility');
  const [activeInspectorTab, setActiveInspectorTab] = useState('inspections');
  const [isMobileAdminMenuOpen, setIsMobileAdminMenuOpen] = useState(false);
  const [isMobileProviderMenuOpen, setIsMobileProviderMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
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

  const adminTabs = [
    { id: 'registrations', label: 'Duyệt Bãi Đỗ Xe', icon: Building2 },
    { id: 'users', label: 'Quản Lý Người Dùng', icon: User },
    { id: 'inspectors', label: 'Nhân Viên Khảo Sát', icon: UserCheck },
    { id: 'facilities', label: 'Tất Cả Cơ Sở', icon: Building2 },
    { id: 'contracts', label: 'Quản Lý Hợp Đồng', icon: FileText },
    { id: 'transactions', label: 'Quản Lý Giao Dịch', icon: Shield },
    { id: 'complaints', label: 'Quản Lý Khiếu Nại', icon: AlertCircle },
    { id: 'reviews', label: 'Quản Lý Đánh Giá', icon: Star },
    { id: 'platform-fees', label: 'Phí Nền Tảng', icon: DollarSign },
    { id: 'broadcast', label: 'Phát Thông Báo', icon: Radio },
  ];

  const providerTabs = [
    { id: 'facility', label: 'Thông Tin Bãi Xe', icon: Building2 },
    { id: 'active-customers', label: 'Khách Đang Thuê', icon: Users },
    { id: 'reservations', label: 'Duyệt Yêu Cầu Thuê', icon: Car },
    { id: 'contracts', label: 'Quản Lý Hợp Đồng', icon: FileText },
    { id: 'profile', label: 'Thông Tin Cá Nhân', icon: User },
    { id: 'transactions', label: 'Quản Lý Giao Dịch', icon: Shield },
    { id: 'complaints', label: 'Quản Lý Khiếu Nại', icon: AlertCircle },
    { id: 'reviews', label: 'Đánh Giá Khách Hàng', icon: Star },
    { id: 'platform-fees', label: 'Biểu Phí Nền Tảng', icon: DollarSign },
  ];

  const inspectorTabs = [
    { id: 'inspections', label: 'Khảo Sát Thực Địa', icon: Building2 },
    { id: 'profile', label: 'Thông Tin Cá Nhân', icon: User },
  ];

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
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
            {/* MOBILE NAV ADMIN */}
            <div className="w-full md:hidden space-y-2.5 mb-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    {React.createElement(adminTabs.find(t => t.id === activeAdminTab)?.icon || ShieldCheck, { className: 'w-4 h-4' })}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Đang xem mục</span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {adminTabs.find(t => t.id === activeAdminTab)?.label}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileAdminMenuOpen(!isMobileAdminMenuOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                    isMobileAdminMenuOpen
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isMobileAdminMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                  <span>{isMobileAdminMenuOpen ? 'Đóng' : 'Tất cả menu'}</span>
                </button>
              </div>

              {isMobileAdminMenuOpen && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-lg grid grid-cols-2 gap-2">
                  {adminTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeAdminTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveAdminTab(tab.id);
                          setIsMobileAdminMenuOpen(false);
                        }}
                        className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-left transition ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {adminTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeAdminTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveAdminTab(tab.id)}
                      className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20'
                          : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESKTOP SIDEBAR ADMIN */}
            <div className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-6">
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-1.5">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">Menu Quản Trị</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Hệ thống ParkLink</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    {adminTabs.length} mục
                  </span>
                </div>

                <div className="space-y-1">
                  {adminTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeAdminTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveAdminTab(tab.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-2xl font-semibold text-sm flex items-center justify-between transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-700/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white shadow-inner'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:scale-105'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`truncate ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* NỘI DUNG ADMIN TƯƠNG ỨNG */}
            <div className="flex-1 min-w-0 w-full">
              {activeAdminTab === 'registrations' && <AdminRegistrationsPanel />}
              {activeAdminTab === 'facilities' && <AdminFacilitiesPanel />}
              {activeAdminTab === 'users' && <AdminUsersPanel />}
              {activeAdminTab === 'inspectors' && <AdminFieldInspectorsPanel />}
              {activeAdminTab === 'contracts' && <AdminContractsPanel />}
              {activeAdminTab === 'complaints' && <AdminComplaintsPanel />}
              {activeAdminTab === 'reviews' && <AdminReviewsPanel />}
              {activeAdminTab === 'platform-fees' && <AdminPlatformFeesPanel isReadOnly={false} />}
              {activeAdminTab === 'broadcast' && <AdminBroadcastPanel />}
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
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
            {/* MOBILE NAV PROVIDER */}
            <div className="w-full md:hidden space-y-2.5 mb-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    {React.createElement(providerTabs.find(t => t.id === activeProviderTab)?.icon || Building2, { className: 'w-4 h-4' })}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Đang xem mục</span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {providerTabs.find(t => t.id === activeProviderTab)?.label}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileProviderMenuOpen(!isMobileProviderMenuOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                    isMobileProviderMenuOpen
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isMobileProviderMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                  <span>{isMobileProviderMenuOpen ? 'Đóng' : 'Tất cả menu'}</span>
                </button>
              </div>

              {isMobileProviderMenuOpen && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-lg grid grid-cols-2 gap-2">
                  {providerTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeProviderTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveProviderTab(tab.id);
                          setIsMobileProviderMenuOpen(false);
                        }}
                        className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-left transition ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {providerTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeProviderTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveProviderTab(tab.id)}
                      className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20'
                          : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESKTOP SIDEBAR PROVIDER */}
            <div className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-6">
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-1.5">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">Menu Chủ Bãi Xe</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Bảng điều khiển cơ sở</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    {providerTabs.length} mục
                  </span>
                </div>

                <div className="space-y-1">
                  {providerTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeProviderTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveProviderTab(tab.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-2xl font-semibold text-sm flex items-center justify-between transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-700/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white shadow-inner'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:scale-105'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`truncate ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* NỘI DUNG PROVIDER TƯƠNG ỨNG */}
            <div className="flex-1 min-w-0 w-full">
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
              {activeProviderTab === 'platform-fees' && <AdminPlatformFeesPanel isReadOnly={true} />}
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
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
            {/* MOBILE NAV FIELD INSPECTOR */}
            <div className="w-full md:hidden flex gap-2 overflow-x-auto no-scrollbar py-1 mb-2">
              {inspectorTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeInspectorTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInspectorTab(tab.id)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20'
                        : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* DESKTOP SIDEBAR FIELD INSPECTOR */}
            <div className="hidden md:block w-72 lg:w-80 shrink-0 sticky top-6">
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-1.5">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">Khảo Sát Thực Địa</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Field Inspector Hub</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    {inspectorTabs.length} mục
                  </span>
                </div>

                <div className="space-y-1">
                  {inspectorTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeInspectorTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveInspectorTab(tab.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-2xl font-semibold text-sm flex items-center justify-between transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-700/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white shadow-inner'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:scale-105'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`truncate ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* NỘI DUNG FIELD INSPECTOR TƯƠNG ỨNG */}
            <div className="flex-1 min-w-0 w-full">
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
                        to="/search"
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
