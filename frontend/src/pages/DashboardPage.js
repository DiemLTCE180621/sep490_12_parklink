import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useNavigate, Link } from 'react-router-dom';
import { getMyReservations } from '../services/reservationService';
import { getMyConfirmationRecords } from '../services/confirmationRecordService';
import complaintService from '../services/complaintService';
import StatusBadge from '../components/common/StatusBadge';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import {
  User, Shield, Building2, LogOut, Car, Phone, Mail, KeyRound,
  UserCheck, Edit, FileText, AlertCircle, Star, DollarSign, Users,
  MapPin, Radio, ChevronRight, Menu, ShieldCheck, X, Layers, Clock, TrendingUp,
  ArrowRight, Search
} from 'lucide-react';
import AdminRegistrationsPanel from '../components/admin/AdminRegistrationsPanel';
import AdminFacilitiesPanel from '../components/admin/AdminFacilitiesPanel';
import AdminUsersPanel from '../components/admin/AdminUsersPanel';
import AdminFieldInspectorsPanel from '../components/admin/AdminFieldInspectorsPanel';
import FieldInspectorRegistrationsPanel from '../components/admin/FieldInspectorRegistrationsPanel';
import AdminComplaintsPanel from '../components/admin/AdminComplaintsPanel';
import AdminReviewsPanel from '../components/admin/AdminReviewsPanel';
import AdminPlatformFeesPanel from '../components/admin/AdminPlatformFeesPanel';
import AdminVehicleTypesPanel from '../components/admin/AdminVehicleTypesPanel';
import AdminAmenitiesPanel from '../components/admin/AdminAmenitiesPanel';
import AdminContractsPanel from '../components/admin/AdminContractsPanel';
import AdminBroadcastPanel from '../components/admin/AdminBroadcastPanel';
import AdminPoliciesPanel from '../components/admin/AdminPoliciesPanel';
import AdminTimelineSettingsPanel from '../components/admin/AdminTimelineSettingsPanel';
import AdminDashboardPanel from '../components/admin/AdminDashboardPanel';
import AdminProviderRevenuePanel from '../components/admin/AdminProviderRevenuePanel';
import ProviderDashboardPanel from '../components/provider/ProviderDashboardPanel';
import ProviderReservationsPanel from '../components/provider/ProviderReservationsPanel';
import ProviderContractsPanel from '../components/provider/ProviderContractsPanel';
import ProviderActiveCustomersPanel from '../components/provider/ProviderActiveCustomersPanel';
import ProviderMonthlyRevenuePanel from '../components/provider/ProviderMonthlyRevenuePanel';
import TransactionHistoryPanel from '../components/common/TransactionHistoryPanel';
import ProviderComplaintsPanel from '../components/provider/ProviderComplaintsPanel';
import ProviderReviewsPanel from '../components/provider/ProviderReviewsPanel';
import ChangePasswordModal from '../components/modals/ChangePasswordModal';
import Toast from '../components/common/Toast';

const DashboardPage = () => {
  const { t } = useTranslation(['provider', 'customer', 'common', 'admin', 'inspector']);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [activeAdminTab, setActiveAdminTab] = useState(searchParams.get('adminTab') || searchParams.get('tab') || location.state?.adminTab || 'overview');
  const [activeProviderTab, setActiveProviderTab] = useState(location.state?.providerTab || 'facility');
  const [isMobileAdminMenuOpen, setIsMobileAdminMenuOpen] = useState(false);
  const [isMobileProviderMenuOpen, setIsMobileProviderMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState(location.state?.message ? { message: location.state.message, type: location.state.type || 'success' } : null);
  const [dashAvatarFailed, setDashAvatarFailed] = useState(false);

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
    const isCustomer = roleName !== "ADMIN" && roleName !== "PROVIDER" && roleName !== "FIELD_INSPECTOR";
  const [customerStats, setCustomerStats] = useState({
    activeContracts: 0,
    pendingRequests: 0,
    complaints: 0,
    latestContract: null,
    latestReservation: null,
    loading: false
  });

  React.useEffect(() => {
    if (isCustomer && user) {
      let isMounted = true;
      const fetchCustomerStats = async () => {
        setCustomerStats(prev => ({ ...prev, loading: true }));
        try {
          const [resRes, resCon, resComp] = await Promise.allSettled([
            getMyReservations(),
            getMyConfirmationRecords(),
            complaintService.getMyComplaints()
          ]);
          let pendingCount = 0;
          let latestRes = null;
          if (resRes.status === "fulfilled") {
            const list = resRes.value?.data?.reservations || resRes.value?.reservations || [];
            pendingCount = list.filter(r => r.status === "PENDING" || r.status === "PENDING_APPROVAL" || r.status === "IN_PROGRESS").length;
            latestRes = list.length > 0 ? list[0] : null;
          }
          let activeCount = 0;
          let latestCon = null;
          if (resCon.status === "fulfilled") {
            const list = resCon.value?.data?.confirmation_records || resCon.value?.confirmation_records || [];
            activeCount = list.filter(c => c.status === "ACTIVE" || c.status === "SIGNED" || c.status === "IN_PROGRESS").length;
            latestCon = list.find(c => c.status === "ACTIVE") || (list.length > 0 ? list[0] : null);
          }
          let compCount = 0;
          if (resComp.status === "fulfilled") {
            const list = resComp.value?.data?.complaints || resComp.value?.data || resComp.value || [];
            compCount = Array.isArray(list) ? list.length : 0;
          }
          if (isMounted) {
            setCustomerStats({
              activeContracts: activeCount,
              pendingRequests: pendingCount,
              complaints: compCount,
              latestContract: latestCon,
              latestReservation: latestRes,
              loading: false
            });
          }
        } catch {
          if (isMounted) {
            setCustomerStats(prev => ({ ...prev, loading: false }));
          }
        }
      };
      fetchCustomerStats();
      return () => {
        isMounted = false;
      };
    }
  }, [isCustomer, user]);

  const tr = (viText, key, opts) => {
    const translated = t(key, opts);
    return translated && translated !== key ? translated : viText;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

    const adminTabs = [
    { id: 'overview', label: t('admin:tabs.overview', 'Tổng Quan'), icon: Users },
    { id: 'registrations', label: t('admin:tabs.registrations', 'Duyệt Bãi Đỗ Xe'), icon: Building2 },
    { id: 'users', label: t('admin:tabs.users', 'Quản Lý Người Dùng'), icon: User },
    { id: 'inspectors', label: t('admin:tabs.inspectors', 'Nhân Viên Khảo Sát'), icon: UserCheck },
    { id: 'facilities', label: t('admin:tabs.facilities', 'Tất Cả Cơ Sở'), icon: Building2 },
    { id: 'contracts', label: t('admin:tabs.contracts', 'Quản Lý Hợp Đồng'), icon: FileText },
    { id: 'provider-revenue', label: t('admin:tabs.providerRevenue', 'Doanh Thu Bãi Xe'), icon: TrendingUp },
    { id: 'transactions', label: t('admin:tabs.transactions', 'Lịch Sử Giao Dịch'), icon: Shield },
    { id: 'complaints', label: t('admin:tabs.complaints', 'Quản Lý Khiếu Nại'), icon: AlertCircle },
    { id: 'reviews', label: t('admin:tabs.reviews', 'Quản Lý Đánh Giá'), icon: Star },
    { id: 'platform-fees', label: t('admin:tabs.platformFees', 'Phí Nền Tảng'), icon: DollarSign },
    { id: 'vehicle-types', label: t('admin:tabs.vehicleTypes', 'Loại Phương Tiện'), icon: Car },
    { id: 'amenities', label: t('admin:tabs.amenities', 'Quản Lý Tiện Ích'), icon: Layers },
    { id: 'broadcast', label: t('admin:tabs.broadcast', 'Phát Thông Báo'), icon: Radio },
    { id: 'timeline-settings', label: t('admin:tabs.timelineSettings', 'Cấu Hình Thời Hạn'), icon: Clock },
    { id: 'policies', label: t('admin:tabs.policies', 'Chính Sách Hệ Thống'), icon: ShieldCheck },
  ];

    const providerTabs = [
    { id: 'facility', label: t('portal.tabs.facility'), icon: Building2 },
    { id: 'active-customers', label: t('portal.tabs.activeCustomers'), icon: Users },
    { id: 'monthly-revenue', label: t('portal.tabs.monthlyRevenue'), icon: DollarSign },
    { id: 'reservations', label: t('portal.tabs.reservations'), icon: Car },
    { id: 'contracts', label: t('portal.tabs.contracts'), icon: FileText },
    { id: 'transactions', label: t('portal.tabs.transactions'), icon: Shield },
    { id: 'complaints', label: t('portal.tabs.complaints'), icon: AlertCircle },
    { id: 'reviews', label: t('portal.tabs.reviews'), icon: Star },
    { id: 'platform-fees', label: t('portal.tabs.platformFees'), icon: DollarSign },
  ];

  
  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {}
      <div className="w-full bg-gradient-to-r from-neighbor-900 via-neighbor-800 to-neighbor-900 border-b border-neighbor-800 px-4 sm:px-6 lg:px-8 py-6 mb-6 text-white shadow-xs">
        <div className="w-full max-w-[1920px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-900 font-extrabold flex items-center justify-center text-xl shadow-md overflow-hidden border border-teal-400/40">
                {user?.avatar_url && !dashAvatarFailed ? (
                  <img
                    src={user.avatar_url}
                    alt={user?.full_name || 'User'}
                    referrerPolicy="no-referrer"
                    onError={() => setDashAvatarFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {tr(`Xin chào, ${user?.full_name || ''}!`, 'portal.greeting', { name: user?.full_name || '' })}
                </h1>
                <p className="text-neighbor-200 text-xs font-medium mt-0.5">
                  {roleName === 'PROVIDER'
                    ? t('portal.roleTitle')
                    : roleName === 'ADMIN'
                      ? 'Ban Quản Trị Hệ Thống'
                      : roleName === 'FIELD_INSPECTOR'
                        ? 'Nhân Viên Khảo Sát'
                        : t('customer:dashboard.roleTitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <LanguageSwitcher variant="dark" />
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
            >
              <Edit className="w-4 h-4" /> {tr('Sửa Hồ Sơ', 'portal.actions.editProfile')}
            </button>
            {user?.has_password === false ? (
              <div className="px-3.5 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" /> {tr('Tài khoản Google', 'portal.actions.googleAccount')}
              </div>
            ) : (
              <button
                onClick={() => setIsChangePasswordModalOpen(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl border border-slate-700 shadow transition flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> {tr('Đổi Mật Khẩu', 'portal.actions.changePassword')}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> {tr('Đăng Xuất', 'portal.actions.logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 w-full mx-auto space-y-8">
        {}
        {roleName === 'ADMIN' ? (
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
            {}
            <div className="w-full md:hidden space-y-2.5 mb-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    {React.createElement(adminTabs.find(t => t.id === activeAdminTab)?.icon || ShieldCheck, { className: 'w-4 h-4' })}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">{t('admin:sidebar.viewing', 'Đang xem mục')}</span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {adminTabs.find(t => t.id === activeAdminTab)?.label}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileAdminMenuOpen(!isMobileAdminMenuOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${isMobileAdminMenuOpen
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                >
                  {isMobileAdminMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                  <span>{isMobileAdminMenuOpen ? t('admin:sidebar.close', 'Đóng') : t('admin:sidebar.allMenu', 'Tất cả menu')}</span>
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
                        className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-left transition ${isActive
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
                      className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${isActive
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

            {}
            <div className="hidden md:block w-80 shrink-0 sticky top-6">
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-1.5">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-sm shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">{t('admin:sidebar.title', 'Menu Quản Trị')}</h3>
                      <p className="text-[11px] text-slate-400 font-medium truncate">{t('admin:sidebar.subtitle', 'Hệ thống ParkLink')}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 shrink-0 whitespace-nowrap">
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
                        className={`w-full text-left px-3 py-2.5 rounded-2xl font-semibold text-sm flex items-center justify-between transition-all duration-200 group ${isActive
                            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-700/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${isActive
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

            {}
            <div className="flex-1 min-w-0 w-full">
              {activeAdminTab === 'overview' && <AdminDashboardPanel />}
              {activeAdminTab === 'registrations' && <AdminRegistrationsPanel />}
              {activeAdminTab === 'facilities' && <AdminFacilitiesPanel />}
              {activeAdminTab === 'users' && <AdminUsersPanel />}
              {activeAdminTab === 'inspectors' && <AdminFieldInspectorsPanel />}
              {activeAdminTab === 'contracts' && <AdminContractsPanel />}
              {activeAdminTab === 'provider-revenue' && <AdminProviderRevenuePanel />}
              {activeAdminTab === 'complaints' && <AdminComplaintsPanel />}
              {activeAdminTab === 'reviews' && <AdminReviewsPanel />}
              {activeAdminTab === 'platform-fees' && <AdminPlatformFeesPanel isReadOnly={false} />}
              {activeAdminTab === 'vehicle-types' && <AdminVehicleTypesPanel />}
              {activeAdminTab === 'amenities' && <AdminAmenitiesPanel />}
              {activeAdminTab === 'broadcast' && <AdminBroadcastPanel />}
              {activeAdminTab === 'timeline-settings' && <AdminTimelineSettingsPanel />}
              {activeAdminTab === 'policies' && <AdminPoliciesPanel />}
              {activeAdminTab === 'transactions' && <TransactionHistoryPanel role="ADMIN" />}
            </div>
          </div>
        ) : roleName === 'PROVIDER' ? (
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
            {}
            <div className="w-full md:hidden space-y-2.5 mb-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    {React.createElement(providerTabs.find(t => t.id === activeProviderTab)?.icon || Building2, { className: 'w-4 h-4' })}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">{t('portal.menu.viewing')}</span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {providerTabs.find(t => t.id === activeProviderTab)?.label}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileProviderMenuOpen(!isMobileProviderMenuOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${isMobileProviderMenuOpen
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                >
                  {isMobileProviderMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                  <span>{isMobileProviderMenuOpen ? t('portal.menu.close') : t('portal.menu.allMenu')}</span>
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
                        className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-left transition ${isActive
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
                      className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${isActive
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

            {}
            <div className="hidden md:block w-80 shrink-0 sticky top-6">
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-1.5">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shadow-sm shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">{t('portal.menu.title')}</h3>
                      <p className="text-[11px] text-slate-400 font-medium truncate">{t('portal.menu.subtitle')}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 shrink-0 whitespace-nowrap">
                    {t('portal.menu.itemsCount', { count: providerTabs.length })}
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
                        className={`w-full text-left px-3 py-2.5 rounded-2xl font-semibold text-sm flex items-center justify-between transition-all duration-200 group ${isActive
                            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md shadow-teal-700/20'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${isActive
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

            {}
            <div className="flex-1 min-w-0 w-full">
              {activeProviderTab === 'facility' && (
                <ProviderDashboardPanel onNavigateToTab={(tabId) => setActiveProviderTab(tabId)} />
              )}
              {activeProviderTab === 'active-customers' && <ProviderActiveCustomersPanel />}
              {activeProviderTab === 'monthly-revenue' && <ProviderMonthlyRevenuePanel />}
              {activeProviderTab === 'reservations' && (
                <ProviderReservationsPanel onNavigateToContracts={() => setActiveProviderTab('contracts')} />
              )}
              {activeProviderTab === 'contracts' && (
                <ProviderContractsPanel onNavigateToActiveCustomers={() => setActiveProviderTab('active-customers')} />
              )}
              {activeProviderTab === 'complaints' && <ProviderComplaintsPanel />}
              {activeProviderTab === 'reviews' && <ProviderReviewsPanel />}
              {activeProviderTab === 'platform-fees' && <AdminPlatformFeesPanel isReadOnly={true} />}
              {activeProviderTab === 'transactions' && <TransactionHistoryPanel role="PROVIDER" />}
            </div>
          </div>
        ) : roleName === 'FIELD_INSPECTOR' ? (
          <div className="w-full">
            <FieldInspectorRegistrationsPanel />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-neighbor-200 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('customer:dashboard.stats.activeContracts')}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      {customerStats.loading ? '-' : customerStats.activeContracts}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {t('customer:dashboard.stats.activeContractsDesc')}
                    </span>
                  </div>
                </div>
                <Link
                  to="/my-contracts"
                  className="mt-4 pt-3 border-t border-gray-100 text-xs font-bold text-neighbor-700 hover:text-neighbor-800 flex items-center justify-between group"
                >
                  <span>{t('customer:dashboard.stats.manageContracts')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-amber-200 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('customer:dashboard.stats.pendingRequests')}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      {customerStats.loading ? '-' : customerStats.pendingRequests}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {t('customer:dashboard.stats.pendingRequestsDesc')}
                    </span>
                  </div>
                </div>
                <Link
                  to="/my-reservations"
                  className="mt-4 pt-3 border-t border-gray-100 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center justify-between group"
                >
                  <span>{t('customer:dashboard.stats.viewRequests')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-rose-200 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t('customer:dashboard.stats.complaints')}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      {customerStats.loading ? '-' : customerStats.complaints}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {t('customer:dashboard.stats.complaintsDesc')}
                    </span>
                  </div>
                </div>
                <Link
                  to="/customer/complaints"
                  className="mt-4 pt-3 border-t border-gray-100 text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center justify-between group"
                >
                  <span>{t('customer:dashboard.stats.viewComplaints')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-neighbor-600" />
                    <span>{t('customer:dashboard.profile.title')}</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neighbor-50 text-neighbor-700 border border-neighbor-200">
                    {t('customer:dashboard.profile.badge')}
                  </span>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-gray-400 font-semibold uppercase tracking-wider block text-[11px]">
                      {t('customer:dashboard.profile.fullName')}
                    </label>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{user?.full_name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 font-semibold uppercase tracking-wider block text-[11px]">
                      {t('customer:dashboard.profile.email')}
                    </label>
                    <p className="text-sm font-medium text-gray-800 mt-0.5 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{user?.email}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 font-semibold uppercase tracking-wider block text-[11px]">
                      {t('customer:dashboard.profile.phone')}
                    </label>
                    <p className="text-sm font-medium text-gray-800 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{user?.phone_number || t('customer:dashboard.profile.notUpdated')}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 font-semibold uppercase tracking-wider block text-[11px]">
                      {t('customer:dashboard.profile.address')}
                    </label>
                    <p className="text-xs font-medium text-gray-700 mt-0.5 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span>{user?.address || t('customer:dashboard.profile.notUpdated')}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <Link
                    to="/profile"
                    className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-gray-200"
                  >
                    <Edit className="w-3.5 h-3.5 text-gray-500" />
                    <span>{t('customer:dashboard.profile.editButton')}</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Car className="w-5 h-5 text-neighbor-600" />
                    <span>{t('customer:dashboard.activity.title')}</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('customer:dashboard.activity.subtitle')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neighbor-600" />
                      {t('customer:dashboard.activity.activeContractTitle')}
                    </h4>
                    {customerStats.latestContract && (
                      <Link
                        to="/my-contracts"
                        className="text-xs font-bold text-neighbor-700 hover:text-neighbor-800 flex items-center gap-1 group"
                      >
                        <span>{t('customer:dashboard.stats.manageContracts')}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
                  </div>

                  {customerStats.latestContract ? (
                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-neighbor-300 hover:shadow-xs transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-base font-bold text-gray-900">
                              {customerStats.latestContract.facility?.name || customerStats.latestContract.facility_name || 'Bãi đỗ xe đang thuê'}
                            </h5>
                            <StatusBadge status={customerStats.latestContract.status} />
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{customerStats.latestContract.facility?.address || 'Địa chỉ bãi xe'}</span>
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-600 pt-1 flex-wrap">
                            <span className="font-semibold text-gray-800">
                              {t('customer:dashboard.activity.parkingSpot')}: {customerStats.latestContract.parking_spot_number || 'Vị trí tự do'}
                            </span>
                            {customerStats.latestContract.monthly_price && (
                              <span className="text-neighbor-700 font-bold">
                                {Number(customerStats.latestContract.monthly_price).toLocaleString('vi-VN')} đ/tháng
                              </span>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`/my-contracts/${customerStats.latestContract.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
                        >
                          <span>{t('customer:dashboard.activity.viewContractDetail')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">
                          {t('customer:dashboard.activity.noActiveContract')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t('customer:dashboard.activity.noActiveContractDesc')}
                        </p>
                      </div>
                      <Link
                        to="/search"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{t('customer:dashboard.activity.findParkingNow')}</span>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      {t('customer:dashboard.activity.recentRequestTitle')}
                    </h4>
                    {customerStats.latestReservation && (
                      <Link
                        to="/my-reservations"
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group"
                      >
                        <span>{t('customer:dashboard.stats.viewRequests')}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}
                  </div>

                  {customerStats.latestReservation ? (
                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-base font-bold text-gray-900">
                              {customerStats.latestReservation.facility?.name || 'Bãi đỗ xe đã đăng ký'}
                            </h5>
                            <StatusBadge status={customerStats.latestReservation.status} />
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{customerStats.latestReservation.facility?.address || 'Địa chỉ bãi xe'}</span>
                          </p>
                          <p className="text-xs text-gray-600 flex items-center gap-1.5 pt-0.5">
                            <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-800">
                              {t('customer:dashboard.activity.vehicle')}: {customerStats.latestReservation.vehicle_info || 'Phương tiện đăng ký'}
                            </span>
                            {customerStats.latestReservation.created_at && (
                              <span className="text-gray-400 text-xs ml-2">
                                • {t('customer:dashboard.activity.submittedDate')}: {new Date(customerStats.latestReservation.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <Link
                          to={`/my-reservations/${customerStats.latestReservation.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition shrink-0"
                        >
                          <span>{t('customer:dashboard.activity.viewRequestDetail')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/40 text-center">
                      <p className="text-xs text-gray-400 italic">
                        {t('customer:dashboard.activity.noRecentRequest')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
