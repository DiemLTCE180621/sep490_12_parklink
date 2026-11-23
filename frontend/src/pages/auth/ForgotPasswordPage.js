import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, KeyRound, Lock, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import authService from '../../services/authService';
import { isValidPassword } from '../../utils/validators';

const ForgotPasswordPage = () => {
  const { t } = useTranslation('login');
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.trim()) {
      setError(t('forgotPasswordPage.errors.missingEmail'));
      return;
    }

    try {
      setLoading(true);
      const res = await authService.requestPasswordReset(email.trim());
      setSuccessMessage(res.data?.message || t('forgotPasswordPage.success.otpSent'));
      if (res.data?.data?.simulatedOtp) {
        setSimulatedOtp(res.data.data.simulatedOtp);
      }
      setStep(2);
    } catch (err) {
      setError(err.errors?.[0] || err.message || t('forgotPasswordPage.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError(t('forgotPasswordPage.errors.invalidOtp'));
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError(t('forgotPasswordPage.errors.invalidPassword'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('forgotPasswordPage.errors.mismatchPassword'));
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyAndResetPassword({
        email: email.trim(),
        otpCode: otpCode.trim(),
        newPassword
      });
      setSuccessMessage(res.data?.message || t('forgotPasswordPage.success.passwordReset'));
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.errors?.[0] || err.message || t('forgotPasswordPage.errors.verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-xl w-full p-8 sm:p-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mx-auto mb-3 border border-neighbor-100 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t('forgotPasswordPage.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {step === 1
              ? t('forgotPasswordPage.subtitleStep1')
              : t('forgotPasswordPage.subtitleStep2', { email })}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {simulatedOtp && (
          <div className="mb-5 p-3 rounded-lg bg-neighbor-50 border border-neighbor-200 text-neighbor-800 text-xs flex items-center justify-between">
            <span className="font-semibold">{t('forgotPasswordPage.simulatedOtp')}</span>
            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-neighbor-300 text-sm tracking-wider">
              {simulatedOtp}
            </span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('forgotPasswordPage.emailLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPasswordPage.emailPlaceholder')}
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-start gap-2">
              <span className="text-neighbor-600 font-bold shrink-0">ℹ</span>
              <span>
                {t('forgotPasswordPage.emailNotice')}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white font-bold text-base rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? t('forgotPasswordPage.sendingOtp') : (
                <span className="flex items-center gap-1.5">
                  {t('forgotPasswordPage.sendOtp')} <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('forgotPasswordPage.otpLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                className="w-full px-4 py-2.5 text-center tracking-[0.4em] font-mono text-xl font-bold border border-gray-300 rounded-lg text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('forgotPasswordPage.newPasswordLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('forgotPasswordPage.newPasswordPlaceholder')}
                  className="w-full pl-11 pr-11 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('forgotPasswordPage.confirmPasswordLabel')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('forgotPasswordPage.confirmPasswordPlaceholder')}
                  className="w-full pl-11 pr-11 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 px-3 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t('forgotPasswordPage.resendOtp')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2.5 px-4 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white font-bold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? t('forgotPasswordPage.resettingPassword') : t('forgotPasswordPage.resetPassword')}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-neighbor-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('forgotPasswordPage.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
