import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Key, ShieldAlert, CheckCircle2, AlertCircle, Eye, EyeOff, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { isValidPassword } from '../../utils/validators';

const ForceChangePasswordPage = () => {
  const { t } = useTranslation('login');
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const hasMinLength = formData.newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(formData.newPassword);
  const hasLowerCase = /[a-z]/.test(formData.newPassword);
  const hasNumber = /\d/.test(formData.newPassword);
  const isMatch = formData.newPassword.length > 0 && formData.newPassword === formData.confirmPassword;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidPassword(formData.newPassword)) {
      setError(t('forceChangePasswordPage.errors.invalidPassword'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('forceChangePasswordPage.errors.mismatch'));
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        newPassword: formData.newPassword
      });

      setSuccess(true);
      setTimeout(() => {
        const role = user?.role?.name;
        const targetPath = role === 'CUSTOMER' ? '/' : '/dashboard';
        navigate(targetPath, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err?.message || t('forceChangePasswordPage.errors.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-100">
            <Key className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('forceChangePasswordPage.title')}
          </h2>
          <p className="mt-1.5 text-xs text-gray-500">
            {t('forceChangePasswordPage.subtitle')}
          </p>
        </div>

        <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">{t('forceChangePasswordPage.requirements')}</p>
            <p className="text-amber-800">
              {t('forceChangePasswordPage.notice')}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-lg bg-neighbor-50 border border-neighbor-200 text-neighbor-800 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-neighbor-600 shrink-0" />
            <span>{t('forceChangePasswordPage.success')}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {t('forceChangePasswordPage.newPasswordLabel')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder={t('forceChangePasswordPage.newPasswordPlaceholder')}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
            <p className="font-semibold text-gray-700 mb-1">{t('forceChangePasswordPage.requirements')}</p>
            <div className="grid grid-cols-2 gap-1.5 text-gray-600">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-neighbor-700 font-semibold' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-neighbor-600' : 'bg-gray-300'}`} />
                {t('forceChangePasswordPage.ruleLength')}
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-neighbor-700 font-semibold' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${hasUpperCase ? 'bg-neighbor-600' : 'bg-gray-300'}`} />
                {t('forceChangePasswordPage.ruleUpper')}
              </div>
              <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-neighbor-700 font-semibold' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${hasLowerCase ? 'bg-neighbor-600' : 'bg-gray-300'}`} />
                {t('forceChangePasswordPage.ruleLower')}
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-neighbor-700 font-semibold' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-neighbor-600' : 'bg-gray-300'}`} />
                {t('forceChangePasswordPage.ruleNumber')}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {t('forceChangePasswordPage.confirmPasswordLabel')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t('forceChangePasswordPage.confirmPasswordPlaceholder')}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.confirmPassword && (
              <p className={`mt-1 text-xs ${isMatch ? 'text-neighbor-600 font-medium' : 'text-red-500'}`}>
                {isMatch ? '✓ Mật khẩu mới trùng khớp' : '✗ Mật khẩu nhập lại chưa khớp'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 px-4 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white font-medium text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              t('forceChangePasswordPage.submitting')
            ) : (
              <span className="flex items-center gap-1.5">
                {t('forceChangePasswordPage.submit')} <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 flex justify-center">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> {t('forceChangePasswordPage.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForceChangePasswordPage;
