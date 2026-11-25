import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Shield,
  Calendar,
  Key,
  RefreshCw,
  Edit2,
  Lock,
  Unlock,
  KeyRound,
  X,
  MapPin,
  UserCheck,
  Car,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import userService from '../../services/userService';
import EditUserModal from '../../components/admin/EditUserModal';
import StatusBadge from '../../components/common/StatusBadge';

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isEnglish = i18n.language?.startsWith('en');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await userService.getUserDetails(id);
        const payload = res?.data || res;
        if (payload?.user) {
          setUser(payload.user);
        } else {
          setError(t('admin:userDetail.messages.userNotFound'));
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || t('admin:userDetail.messages.loadErrorTitle'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id, t]);

  const formatDate = (dateString) => {
    if (!dateString) return t('admin:userDetail.basicInfo.notUpdated');
    return new Date(dateString).toLocaleString(isEnglish ? 'en-US' : 'vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditSuccess = (updatedUser, msg) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
    setSuccessMessage(msg);
  };

  const handleConfirmAction = async () => {
    if (!user) return;
    const { type } = confirmDialog;

    try {
      setActionLoading(true);
      setError('');

      if (type === 'LOCK' || type === 'UNLOCK') {
        const res = await userService.toggleUserStatus(user.id);
        const newStatus = type === 'LOCK' ? 'BLOCKED' : 'ACTIVE';
        setUser((prev) => ({
          ...prev,
          status: newStatus,
          ...(type === 'LOCK' && prev?.facility
            ? { facility: { ...prev.facility, visibility_status: 'HIDDEN' } }
            : {})
        }));
        setSuccessMessage(res.message || (type === 'LOCK' ? t('admin:userDetail.messages.lockSuccess') : t('admin:userDetail.messages.unlockSuccess')));
      } else if (type === 'RESET_PASSWORD') {
        const res = await userService.forceResetPassword(user.id);
        setUser((prev) => ({ ...prev, requires_password_change: true }));
        const msg = res.message || t('admin:userDetail.messages.resetSuccess');
        setSuccessMessage(msg);
      }

      setConfirmDialog({ isOpen: false, type: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('admin:userDetail.messages.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (roleName) => {
    const role = (roleName || '').toUpperCase();
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3.5 h-3.5" />
            {t('admin:userDetail.roles.ADMIN')}
          </span>
        );
      case 'PROVIDER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-3.5 h-3.5" />
            {t('admin:userDetail.roles.PROVIDER')}
          </span>
        );
      case 'FIELD_INSPECTOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <UserCheck className="w-3.5 h-3.5" />
            {t('admin:userDetail.roles.FIELD_INSPECTOR')}
          </span>
        );
      case 'CUSTOMER':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neighbor-50 text-neighbor-700 border border-neighbor-200">
            <Car className="w-3.5 h-3.5" />
            {t('admin:userDetail.roles.CUSTOMER')}
          </span>
        );
    }
  };

  const getStatusBadge = (statusStr) => {
    const status = (statusStr || '').toUpperCase();
    switch (status) {
      case 'ACTIVE':
        return <StatusBadge status="ACTIVE" size="sm" />;
      case 'PENDING':
        return <StatusBadge status="PENDING" size="sm" />;
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {isEnglish ? 'Blocked' : 'Đã khóa'}
          </span>
        );
      default:
        return <StatusBadge status={status} size="sm" />;
    }
  };

  const getVerificationBadge = (vStatus) => {
    const s = (vStatus || '').toUpperCase();
    switch (s) {
      case 'VERIFIED':
        return <StatusBadge status="VERIFIED" size="sm" />;
      case 'PENDING_REVIEW':
        return <StatusBadge status="PENDING" size="sm" />;
      case 'REJECTED':
        return <StatusBadge status="REJECTED" size="sm" />;
      default:
        return <StatusBadge status={s} size="sm" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-neighbor-600 animate-spin mx-auto" />
          <p className="text-sm text-gray-600 font-medium">{t('admin:userDetail.messages.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xs border border-gray-200 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">{t('admin:userDetail.messages.loadErrorTitle')}</h2>
          <p className="text-sm text-gray-500">{error || t('admin:userDetail.messages.userNotFound')}</p>
          <button
            onClick={() => navigate('/dashboard', { state: { adminTab: 'users' } })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> {t('admin:userDetail.backToList')}
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user.role?.name === 'ADMIN';
  const isBlocked = user.status === 'BLOCKED';

  return (
    <div className="min-h-screen bg-gray-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard', { state: { adminTab: 'users' } })}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-neighbor-700 bg-white hover:bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            {t('admin:userDetail.backToList')}
          </button>

          <span className="text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs font-mono">
            #{user.id}
          </span>
        </div>

        {successMessage && (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200 flex justify-between items-center shadow-2xs animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMessage}
            </span>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200 flex justify-between items-center shadow-2xs">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              {error}
            </span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 sm:p-7">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-neighbor-50 text-neighbor-800 font-bold flex items-center justify-center text-2xl border border-neighbor-200/80 shadow-2xs shrink-0">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{user.full_name || 'Người dùng ParkLink'}</h1>
                  {getRoleBadge(user.role?.name)}
                  {getStatusBadge(user.status)}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-600">{user.email}</span>
                  <span className="text-gray-300">•</span>
                  <span>{t('admin:userDetail.joinedDate', { date: formatDate(user.created_at) })}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-stretch sm:self-auto justify-end">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {t('admin:userDetail.editBtn')}
              </button>

              {!isAdmin && (
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, type: 'RESET_PASSWORD' })}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                  {t('admin:userDetail.resetPasswordBtn')}
                </button>
              )}

              {!isAdmin && (
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, type: isBlocked ? 'UNLOCK' : 'LOCK' })}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border shadow-2xs transition flex items-center gap-1.5 cursor-pointer ${
                    isBlocked
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  }`}
                >
                  {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {isBlocked ? t('admin:userDetail.unlockBtn') : t('admin:userDetail.lockBtn')}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{t('admin:userDetail.basicInfo.title')}</h2>
              </div>

              <div className="p-5 divide-y divide-gray-100 text-xs">
                <div className="py-3 flex items-start justify-between gap-3 first:pt-0">
                  <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {t('admin:userDetail.basicInfo.email')}
                  </span>
                  <span className="font-semibold text-gray-900 text-right break-all">{user.email}</span>
                </div>

                <div className="py-3 flex items-start justify-between gap-3">
                  <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {t('admin:userDetail.basicInfo.phone')}
                  </span>
                  <span className="font-semibold text-gray-900 text-right">{user.phone_number || t('admin:userDetail.basicInfo.notUpdated')}</span>
                </div>

                <div className="py-3 flex items-start justify-between gap-3">
                  <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {t('admin:userDetail.basicInfo.address')}
                  </span>
                  <span className="font-semibold text-gray-900 text-right">{user.address || t('admin:userDetail.basicInfo.notUpdated')}</span>
                </div>

                <div className="py-3 flex items-start justify-between gap-3">
                  <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {t('admin:userDetail.basicInfo.createdAt')}
                  </span>
                  <span className="font-semibold text-gray-900 text-right">{formatDate(user.created_at)}</span>
                </div>

                <div className="py-3 flex items-start justify-between gap-3 last:pb-0">
                  <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {t('admin:userDetail.basicInfo.updatedAt')}
                  </span>
                  <span className="font-semibold text-gray-900 text-right">{formatDate(user.updated_at)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">{t('admin:userDetail.security.title')}</h2>
              </div>

              <div className="p-5 divide-y divide-gray-100 text-xs">
                <div className="py-3 flex items-center justify-between gap-3 first:pt-0">
                  <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0">
                    <Key className="w-3.5 h-3.5 text-gray-400" />
                    {t('admin:userDetail.security.authMethod')}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {user.has_password === false ? t('admin:userDetail.security.googleSSO') : t('admin:userDetail.security.standardPassword')}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between gap-3 last:pb-0">
                  <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0">
                    <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                    {t('admin:userDetail.security.firstPassword')}
                  </span>
                  <span className="shrink-0">
                    {user.requires_password_change ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {t('admin:userDetail.security.pwdMustChange')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t('admin:userDetail.security.pwdSet')}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {user.role?.name === 'CUSTOMER' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center">
                      <Car className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">{t('admin:userDetail.activity.title')}</h2>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                    {t('admin:userDetail.roles.CUSTOMER')}
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/80">
                      <span className="text-xs text-gray-500 font-medium block mb-1">
                        {t('admin:userDetail.activity.reservations')}
                      </span>
                      <div className="text-2xl font-bold text-neighbor-800">
                        {t('admin:userDetail.activity.reservationCount', { count: user._count?.reservations || 0 })}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Toàn bộ yêu cầu thuê bãi xe theo tháng</p>
                    </div>

                    <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/80">
                      <span className="text-xs text-gray-500 font-medium block mb-1">
                        {t('admin:userDetail.stats.status')}
                      </span>
                      <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        {isBlocked ? (isEnglish ? 'Blocked' : 'Đã khóa') : (isEnglish ? 'Active' : 'Hoạt động')}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Quyền truy cập dịch vụ trên hệ thống</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {t('admin:userDetail.quickLinks.title')}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard', { state: { adminTab: 'contracts' } })}
                        className="p-3.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition text-left flex items-center justify-between group shadow-2xs cursor-pointer"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-neighbor-700 transition">
                            {t('admin:userDetail.quickLinks.viewContracts')}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {t('admin:userDetail.quickLinks.viewContractsDesc')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-neighbor-700 group-hover:translate-x-0.5 transition shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/dashboard', { state: { adminTab: 'users' } })}
                        className="p-3.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition text-left flex items-center justify-between group shadow-2xs cursor-pointer"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-neighbor-700 transition">
                            {t('admin:userDetail.quickLinks.viewReservations')}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {t('admin:userDetail.quickLinks.viewReservationsDesc')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-neighbor-700 group-hover:translate-x-0.5 transition shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {user.role?.name === 'PROVIDER' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">{t('admin:userDetail.providerFacility.title')}</h2>
                  </div>
                  {user.facility && (
                    <div className="flex flex-wrap items-center gap-2">
                      {getVerificationBadge(user.facility.verification_status)}
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          user.facility.payment_status === 'PAID'
                            ? 'bg-neighbor-50 text-neighbor-700 border-neighbor-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {user.facility.payment_status === 'PAID' ? t('admin:userDetail.providerFacility.paidFee') : t('admin:userDetail.providerFacility.unpaidFee')}
                      </span>
                    </div>
                  )}
                </div>

                {user.facility ? (
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                        <span className="text-gray-500 font-medium block mb-1">{t('admin:userDetail.providerFacility.facilityName')}</span>
                        <span className="font-bold text-gray-900 text-sm">{user.facility.name}</span>
                      </div>
                      <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70 sm:col-span-2">
                        <span className="text-gray-500 font-medium block mb-1">{t('admin:userDetail.providerFacility.facilityAddress')}</span>
                        <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {user.facility.address}
                        </span>
                      </div>
                      <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                        <span className="text-gray-500 font-medium block mb-1">{t('admin:userDetail.providerFacility.capacity')}</span>
                        <span className="font-bold text-gray-900">
                          {t('admin:userDetail.providerFacility.slots', { capacity: user.facility.capacity })}
                        </span>
                        <span className="text-[11px] text-gray-500 block mt-0.5">
                          {t('admin:userDetail.providerFacility.availableSlots', { count: user.facility.available_slots ?? 0 })}
                        </span>
                      </div>
                      <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                        <span className="text-gray-500 font-medium block mb-1">{t('admin:userDetail.providerFacility.price')}</span>
                        <span className="font-bold text-neighbor-700 text-sm">
                          {t('admin:userDetail.providerFacility.pricePerMonth', { price: Number(user.facility.price_per_month).toLocaleString(isEnglish ? 'en-US' : 'vi-VN') })}
                        </span>
                      </div>
                      <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/70">
                        <span className="text-gray-500 font-medium block mb-1">{t('admin:userDetail.providerFacility.visibility')}</span>
                        <span className="font-bold text-gray-900">
                          {user.facility.visibility_status === 'VISIBLE' ? t('admin:userDetail.providerFacility.visible') : t('admin:userDetail.providerFacility.hidden')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard', { state: { adminTab: 'facilities' } })}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neighbor-700 hover:text-neighbor-800 hover:underline transition cursor-pointer"
                      >
                        {t('admin:userDetail.providerFacility.viewFacilityDetails')}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 bg-gray-50/50">
                    <Building2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-medium text-gray-500">{t('admin:userDetail.providerFacility.noFacility')}</p>
                  </div>
                )}
              </div>
            )}

            {user.role?.name === 'FIELD_INSPECTOR' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">{t('admin:userDetail.inspectorTasks.title')}</h2>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 px-3 py-1 rounded-lg text-gray-700 border border-gray-200">
                    {t('admin:userDetail.inspectorTasks.inCharge', { count: user.assigned_facilities?.length || 0 })}
                  </span>
                </div>

                <div className="p-6">
                  {user.assigned_facilities && user.assigned_facilities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {user.assigned_facilities.map((f) => (
                        <div key={f.id} className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/80 flex flex-col justify-between gap-2.5">
                          <div>
                            <h3 className="font-bold text-gray-900 text-xs">{f.name}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              {f.address}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-[11px] text-gray-500 font-mono">{t('admin:userDetail.inspectorTasks.facilityCode', { id: f.id })}</span>
                            {getVerificationBadge(f.verification_status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400 bg-gray-50/50">
                      <UserCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-xs font-medium text-gray-500">{t('admin:userDetail.inspectorTasks.noTasks')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {user.role?.name === 'ADMIN' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">{t('admin:userDetail.roles.ADMIN')}</h2>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Tài khoản mang đặc quyền Quản trị viên cấp cao. Có toàn quyền truy cập, kiểm duyệt cơ sở bãi xe, quản lý tài chính nền tảng, điều phối nhân viên khảo sát và phân quyền hệ thống ParkLink.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSuccess={handleEditSuccess}
      />

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150 border border-gray-200">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  confirmDialog.type === 'LOCK'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : confirmDialog.type === 'UNLOCK'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}
              >
                {confirmDialog.type === 'LOCK' ? (
                  <Lock className="w-6 h-6" />
                ) : confirmDialog.type === 'UNLOCK' ? (
                  <Unlock className="w-6 h-6" />
                ) : (
                  <KeyRound className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmDialog.type === 'LOCK'
                    ? t('admin:userDetail.dialogs.lockTitle')
                    : confirmDialog.type === 'UNLOCK'
                    ? t('admin:userDetail.dialogs.unlockTitle')
                    : t('admin:userDetail.dialogs.resetTitle')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">#{user.id} — {user.email}</p>
              </div>
            </div>

            <div className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200">
              {confirmDialog.type === 'LOCK' && (
                <div className="space-y-2">
                  <p>
                    <Trans i18nKey="userDetail.dialogs.lockPrompt" ns="admin" values={{ name: user.full_name }} />
                  </p>
                  {user.role?.name === 'PROVIDER' && user.facility && (
                    <p className="text-rose-600 font-semibold">
                      {t('admin:userDetail.dialogs.lockNoteProvider', { facility: user.facility.name })}
                    </p>
                  )}
                  {user.role?.name === 'CUSTOMER' && (
                    <p className="text-amber-700 font-semibold">
                      {t('admin:userDetail.dialogs.lockNoteCustomer')}
                    </p>
                  )}
                  {user.role?.name === 'FIELD_INSPECTOR' && (
                    <p className="text-amber-700 font-semibold">
                      {t('admin:userDetail.dialogs.lockNoteInspector')}
                    </p>
                  )}
                </div>
              )}
              {confirmDialog.type === 'UNLOCK' && (
                <p>
                  <Trans i18nKey="userDetail.dialogs.unlockPrompt" ns="admin" values={{ name: user.full_name }} />
                </p>
              )}
              {confirmDialog.type === 'RESET_PASSWORD' && (
                <p>
                  <Trans i18nKey="userDetail.dialogs.resetPrompt" ns="admin" values={{ email: user.email }} />
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, type: '' })}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50 transition cursor-pointer"
              >
                {t('admin:userDetail.dialogs.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer ${
                  confirmDialog.type === 'LOCK'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.type === 'UNLOCK'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {confirmDialog.type === 'LOCK'
                  ? t('admin:userDetail.dialogs.confirmLock')
                  : confirmDialog.type === 'UNLOCK'
                  ? t('admin:userDetail.dialogs.confirmUnlock')
                  : t('admin:userDetail.dialogs.confirmReset')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetailPage;
