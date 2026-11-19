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
    const cleanAddress = computeFullAddress(streetDetail, administrativeAddress);

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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {t('header.back')}
        </button>

        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-teal-500 text-slate-900 font-black flex items-center justify-center text-3xl shadow-md border-2 border-teal-400/50">
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
                  className="absolute -bottom-2 -right-2 p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg border-2 border-slate-900 transition flex items-center justify-center disabled:opacity-50"
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
                <h1 className="text-2xl sm:text-3xl font-bold">{user?.full_name || t('header.fallbackName')}</h1>
                <p className="text-teal-300 text-xs font-medium mt-1">{user?.email}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{t('header.avatarHint')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                {getRoleLabel(roleName)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-md space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">{t('section.title')}</h2>
            <p className="text-slate-500 text-xs mt-0.5">{t('section.subtitle')}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3 text-teal-800 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-teal-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {roleName === 'CUSTOMER' && (!hasPhone || !hasAddress) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <span>
                {!hasPhone && !hasAddress
                  ? t('warnings.missingBoth')
                  : !hasPhone
                    ? t('warnings.missingPhone')
                    : t('warnings.missingAddress')}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" /> {t('fields.email.label')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-semibold text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" /> {t('fields.fullName.label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('fields.fullName.placeholder')}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-teal-600" /> {t('fields.phone.label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('fields.phone.placeholder')}
                maxLength={10}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
              <p className="text-[11px] text-slate-500">{t('fields.phone.hint')}</p>
            </div>

            {roleName === 'FIELD_INSPECTOR' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" /> {t('fields.assignedAddress.label')}
                </label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 text-sm">
                    {user?.address || t('fields.assignedAddress.empty')}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 w-max shrink-0">
                    {t('fields.assignedAddress.note')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-5 bg-slate-50/70 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600" /> {t('fields.address.label')}
                  </label>
                  <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {t('fields.address.formatHint')}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{t('fields.address.areaLabel')}</span>
                  <AddressSelector
                    value={administrativeAddress}
                    onChange={(selectedAdmin) => setAdministrativeAddress(selectedAdmin)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Home className="w-3.5 h-3.5 text-slate-400" /> {t('fields.address.streetDetailLabel')}
                  </label>
                  <input
                    type="text"
                    value={streetDetail}
                    onChange={(e) => setStreetDetail(e.target.value)}
                    placeholder={t('fields.address.streetDetailPlaceholder')}
                    maxLength={150}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700">
                      {roleName === 'CUSTOMER' ? 'Địa chỉ ghi trên thông tin thuê bãi: ' : 'Địa chỉ liên hệ: '}
                    </span>
                    <span className="text-teal-800 font-semibold">
                      {computeFullAddress(streetDetail, administrativeAddress) || t('fields.address.notSet')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-600">{t('fields.accountRole.label')}</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                {getRoleLabel(roleName)}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-600">{t('fields.authMethod.label')}</span>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                {user?.has_password === false
                  ? t('fields.authMethod.google')
                  : localStorage.getItem('parklink_login_method') === 'google'
                    ? t('fields.authMethod.googleAndPassword')
                    : t('fields.authMethod.emailAndPassword')}
              </span>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? t('actions.saving') : t('actions.saveChanges')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
