import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Phone, Mail, Shield, X, RefreshCw, AlertCircle } from 'lucide-react';
import userService from '../../services/userService';

const updateErrorKeys = {
  'Họ và tên chỉ được chứa chữ cái, tối thiểu 2 ký tự và không chứa số hay ký tự đặc biệt.': 'invalidName',
  'Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0912345678).': 'invalidPhone',
  'Số điện thoại này đã được sử dụng bởi tài khoản khác!': 'phoneInUse',
  'Tài khoản người dùng không tồn tại!': 'userNotFound',
};

const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      setError('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.trim();

    if (!cleanName || cleanName.length < 2) {
      setError(t('users.editModal.errors.invalidName'));
      return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      setError(t('users.editModal.errors.invalidPhone'));
      return;
    }

    try {
      setLoading(true);
      const res = await userService.updateUser(user.id, {
        full_name: cleanName,
        phone_number: cleanPhone
      });
      const updated = res.data?.user || res.data || res;
      if (onSuccess) {
        onSuccess(updated, t('users.editModal.success'));
      }
      onClose();
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      const errorKey = updateErrorKeys[message];
      setError(errorKey
        ? t(`users.editModal.errors.${errorKey}`)
        : (i18n.language.startsWith('vi') && message) || t('users.editModal.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const roleName = (user.role?.name || 'CUSTOMER').toUpperCase();
  const roleLabel = t(`userDetail.roles.${roleName}`, {
    defaultValue: t('userDetail.roles.CUSTOMER'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        className="bg-white rounded-xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-gray-200"
      >
        {}
        <div className="flex justify-between items-center border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-neighbor-50 text-neighbor-600 flex items-center justify-center font-bold shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 id="edit-user-title" className="text-xl font-bold text-gray-900">
                {t('users.editModal.title', { id: user.id })}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">{t('users.editModal.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t('common:actions.close')}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {}
          <div className="space-y-1.5">
            <label htmlFor="edit-user-email" className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-gray-400" /> {t('users.editModal.loginEmail')}
            </label>
            <input
              id="edit-user-email"
              type="email"
              disabled
              value={user.email || ''}
              className="w-full px-4 py-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl text-sm font-semibold cursor-not-allowed"
            />
          </div>

          {}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4 text-neighbor-600" /> {t('userDetail.stats.role')}:
            </span>
            <span className="font-bold text-neighbor-800 bg-neighbor-100 px-3 py-1 rounded-full text-xs">
              {roleLabel}
            </span>
          </div>

          {}
          <div className="space-y-1.5">
            <label htmlFor="edit-user-full-name" className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-neighbor-600" /> {t('users.table.fullName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-user-full-name"
              type="text"
              required
              placeholder={t('users.editModal.fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 font-semibold transition"
            />
          </div>

          {}
          <div className="space-y-1.5">
            <label htmlFor="edit-user-phone" className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-neighbor-600" /> {t('users.table.phone')} <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-user-phone"
              type="tel"
              required
              maxLength={10}
              aria-describedby="edit-user-phone-hint"
              placeholder={t('users.editModal.phonePlaceholder')}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 font-semibold transition"
            />
            <p id="edit-user-phone-hint" className="text-xs text-gray-400">{t('users.editModal.phoneHint')}</p>
          </div>

          {}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition"
            >
              {t('common:actions.cancel')}
            </button>
            <button
              type="submit"
              aria-label={loading ? t('common:actions.processing') : undefined}
              disabled={loading}
              className="px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('users.editModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
