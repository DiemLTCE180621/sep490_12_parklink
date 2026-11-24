import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Shield, Save, AlertCircle, CheckCircle2, ArrowLeft, MapPin, Camera, Loader2, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import uploadService from '../services/uploadService';
import AddressSelector from '../components/common/AddressSelector';

const ProfilePage = () => {
  const { t } = useTranslation('profile');
  const { user, updateProfile, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [administrativeAddress, setAdministrativeAddress] = useState('');
  const [streetDetail, setStreetDetail] = useState('');

  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const initializedUserIdRef = useRef(null);

  useEffect(() => {
    if (user && initializedUserIdRef.current !== user.id) {
      initializedUserIdRef.current = user.id;
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      setAvatarUrl(user.avatar_url || '');
      setAvatarLoadFailed(false);

      const rawAddress = user.address || '';
      if (rawAddress) {
        const parts = rawAddress.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          const adminPart = parts.slice(-2).join(', ');
          const detailPart = parts.slice(0, -2).join(', ');
          setAdministrativeAddress(adminPart);
          setStreetDetail(detailPart);
        } else {
          setAdministrativeAddress(rawAddress);
          setStreetDetail('');
        }
      } else {
        setAdministrativeAddress('');
        setStreetDetail('');
      }
    }
  }, [user]);

  const computeFullAddress = (detail, admin) => {
    const cleanDetail = (detail || '').trim();
    const cleanAdmin = (admin || '').trim();
    if (cleanDetail && cleanAdmin) {
      return `${cleanDetail}, ${cleanAdmin}`;
    }
    return cleanDetail || cleanAdmin || '';
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('messages.avatarInvalidType'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('messages.avatarTooLarge'));
      return;
    }

    try {
      setUploadingAvatar(true);
      setError('');
      const uploadRes = await uploadService.uploadFiles([file], 'chat');
      const uploadedUrl =
        uploadRes?.data?.data?.mediaUrls?.[0] ||
        uploadRes?.data?.mediaUrls?.[0] ||
        uploadRes?.data?.data?.[0]?.url ||
        uploadRes?.data?.data?.[0] ||
        uploadRes?.data?.[0];
      if (!uploadedUrl) {
        throw new Error(t('messages.avatarNoUrl'));
      }

      setAvatarUrl(uploadedUrl);
      setAvatarLoadFailed(false);
      const currentFullAddress = computeFullAddress(streetDetail, administrativeAddress);
      await updateProfile({
        full_name: fullName.trim() || user?.full_name,
        phone_number: phoneNumber.trim() || user?.phone_number || undefined,
        address: currentFullAddress || user?.address || undefined,
        avatar_url: uploadedUrl
      });
      setSuccessMessage(t('messages.avatarSuccess'));
    } catch (uploadErr) {
      setError(uploadErr.response?.data?.message || uploadErr.message || t('messages.avatarUploadError'));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.trim();
    const cleanAddress = roleName === 'FIELD_INSPECTOR' ? (user?.address || '') : computeFullAddress(streetDetail, administrativeAddress);

    if (!cleanName || cleanName.length < 2) {
      setError(t('messages.fullNameMinLength'));
      return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError(t('messages.phoneInvalid'));
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        full_name: cleanName,
        phone_number: cleanPhone,
        address: cleanAddress,
        avatar_url: avatarUrl
      });
      if (refreshUser) {
        await refreshUser();
      }
      setSuccessMessage(t('messages.updateSuccess'));
    } catch (err) {
      const errList = (err.errors && err.errors.length > 0)
        ? err.errors
        : (err.response?.data?.errors && err.response?.data?.errors.length > 0)
          ? err.response.data.errors
          : [err.message || err.response?.data?.message || t('messages.updateError')];
      setError(Array.isArray(errList) ? errList[0] : errList);
    } finally {
      setLoading(false);
    }
  };

  const roleName = user?.role?.name || 'CUSTOMER';

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN': return t('roles.ADMIN');
      case 'PROVIDER': return t('roles.PROVIDER');
      case 'FIELD_INSPECTOR': return t('roles.FIELD_INSPECTOR');
      case 'CUSTOMER':
      default: return t('roles.CUSTOMER');
    }
  };

  const hasPhone = Boolean(user?.phone_number && user.phone_number.trim());
  const hasAddress = Boolean(user?.address && user.address.trim());

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-neighbor-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> {t('header.back')}
          </button>
          <span className="text-xs text-gray-400 font-medium">ParkLink Account Management</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neighbor-50 text-neighbor-700 font-bold flex items-center justify-center text-3xl border-2 border-neighbor-100 shadow-xs">
                  {avatarUrl && !avatarLoadFailed ? (
                    <img
                      src={avatarUrl}
                      alt={user?.full_name || 'Avatar'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarLoadFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title={t('header.avatarTitle')}
                  className="absolute -bottom-1 -right-1 p-2 bg-neighbor-600 hover:bg-neighbor-700 text-white rounded-xl shadow-xs border-2 border-white transition-colors flex items-center justify-center disabled:opacity-50 cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/jpeg,image/png,image/webp,image/jpg,image/avif"
                  className="hidden"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">{user?.full_name || t('header.fallbackName')}</h2>
                <p className="text-gray-500 text-xs font-medium mt-0.5">{user?.email}</p>
                <p className="text-gray-400 text-[11px] mt-1">{t('header.avatarHint')}</p>
              </div>

              <div className="pt-2 w-full border-t border-gray-100 space-y-2.5 text-left text-xs">
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500 font-medium">{t('fields.accountRole.label')}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neighbor-50 text-neighbor-700 border border-neighbor-200">
                    {getRoleLabel(roleName)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500 font-medium">{t('fields.authMethod.label')}</span>
                  <span className="text-gray-700 font-semibold text-right">
                    {user?.has_password === false
                      ? t('fields.authMethod.google')
                      : localStorage.getItem('parklink_login_method') === 'google'
                        ? t('fields.authMethod.googleAndPassword')
                        : t('fields.authMethod.emailAndPassword')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500 font-medium">{t('fields.accountStatus.label', 'Trạng thái tài khoản')}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {t('fields.accountStatus.active', 'Hoạt động')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-neighbor-50/60 rounded-2xl p-5 border border-neighbor-100 text-xs text-neighbor-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-neighbor-800">
                <Shield className="w-4 h-4 text-neighbor-600" /> {t('fields.security.title', 'Bảo mật thông tin ParkLink')}
              </div>
              <p className="text-neighbor-700 leading-relaxed text-[11px]">
                {t('fields.security.desc', 'Thông tin cá nhân và số điện thoại của bạn được dùng để xác thực hợp đồng điện tử và kết nối an toàn với đối tác bãi xe.')}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900">{t('section.title')}</h2>
                <p className="text-gray-500 text-xs mt-0.5">{t('section.subtitle')}</p>
              </div>

              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-neighbor-50 border border-neighbor-200 rounded-xl flex items-start gap-2.5 text-neighbor-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-neighbor-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {roleName === 'CUSTOMER' && (!hasPhone || !hasAddress) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    {!hasPhone && !hasAddress
                      ? t('warnings.missingBoth')
                      : !hasPhone
                        ? t('warnings.missingPhone')
                        : t('warnings.missingAddress')}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-neighbor-600" /> {t('fields.fullName.label')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('fields.fullName.placeholder')}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-neighbor-600" /> {t('fields.phone.label')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={t('fields.phone.placeholder')}
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-gray-400" /> {t('fields.email.label')}
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {t('fields.email.cannotChange', 'Không thể thay đổi')}
                    </span>
                  </div>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>

                {roleName === 'FIELD_INSPECTOR' ? (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neighbor-600" /> {t('fields.assignedAddress.label')}
                      </label>
                      <span className="text-[11px] text-neighbor-700 font-semibold bg-neighbor-50 px-2 py-0.5 rounded-md border border-neighbor-200">
                        {t('fields.assignedAddress.badge', 'Cố định')}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 font-medium flex items-center justify-between gap-2">
                      <span className="truncate">
                        {user?.address || t('fields.assignedAddress.emptyFallback', t('fields.assignedAddress.empty'))}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md shrink-0">
                        {t('fields.assignedAddress.note')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neighbor-600" /> {t('fields.address.label')}
                      </label>
                      <span className="text-[11px] text-neighbor-700 font-semibold bg-neighbor-50 px-2 py-0.5 rounded-md border border-neighbor-200">
                        {t('fields.address.formatHint')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-gray-500">{t('fields.address.areaLabel')}</span>
                      <AddressSelector
                        value={administrativeAddress}
                        onChange={(selectedAdmin) => setAdministrativeAddress(selectedAdmin)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-gray-400" /> {t('fields.address.streetDetailLabel')}
                      </label>
                      <input
                        type="text"
                        value={streetDetail}
                        onChange={(e) => setStreetDetail(e.target.value)}
                        placeholder={t('fields.address.streetDetailPlaceholder')}
                        maxLength={150}
                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                      />
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-gray-200 text-xs text-gray-600 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-neighbor-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-700">
                          {roleName === 'CUSTOMER' ? t('fields.address.customerPreview', 'Địa chỉ ghi trên thông tin thuê bãi: ') : t('fields.address.providerPreview', 'Địa chỉ liên hệ: ')}
                        </span>
                        <span className="text-neighbor-800 font-semibold">
                          {computeFullAddress(streetDetail, administrativeAddress) || t('fields.address.notSet')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? t('actions.saving') : t('actions.saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
