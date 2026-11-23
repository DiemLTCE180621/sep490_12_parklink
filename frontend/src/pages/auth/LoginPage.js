import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, ArrowRight, AlertCircle, Building2, User, Eye, EyeOff } from 'lucide-react';
import GoogleLoginButton from '../../components/common/GoogleLoginButton';
import PolicyDetailModal from '../../components/modals/PolicyDetailModal';

const LoginPage = () => {
  const { t } = useTranslation('login');
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from?.pathname || null;

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  const [sessionNotice] = useState(() => {
    const notice = sessionStorage.getItem('force_logout_notice');
    if (notice) {
      sessionStorage.removeItem('force_logout_notice');
      return notice;
    }
    return '';
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const t1 = setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 100);
    const t2 = setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 300);
    const t3 = setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError(t('errors.missingCredentials'));
      return;
    }

    try {
      setLoading(true);
      const res = await login(formData);

      if (res?.data?.user?.requires_password_change) {
        navigate('/change-password-first-time', {
          replace: true,
          state: {
            tempPassword: formData.password,
            email: formData.email
          }
        });
      } else {
        const role = res?.data?.user?.role?.name;
        const redirectTo = fromPath || (role === 'CUSTOMER' ? '/' : '/dashboard');
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err.message || t('errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    try {
      setLoading(true);
      setError('');
      const res = await googleLogin(credential);
      const role = res?.data?.data?.user?.role?.name || res?.data?.user?.role?.name || 'CUSTOMER';
      const redirectTo = fromPath || (role === 'CUSTOMER' ? '/' : '/dashboard');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t('errors.googleFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-xl w-full p-8 sm:p-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mx-auto mb-3 border border-neighbor-100 shadow-xs">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('subtitle')}
          </p>
        </div>

        {sessionNotice && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{sessionNotice}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t('fields.email.label')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('fields.email.placeholder')}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                {t('fields.password.label')}
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-neighbor-700 hover:text-neighbor-800 transition-colors"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('fields.password.placeholder')}
                className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white font-bold text-base rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? t('submitting') : (
              <span className="flex items-center gap-1.5">
                {t('submit')} <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-5">
          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400 font-medium">
                {t('orContinueWith')}
              </span>
            </div>
          </div>

          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setError(msg)}
            disabled={loading}
            showDisclaimer={false}
          />
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center leading-normal">
          {t('policyNotice.prefix')}
          <button
            type="button"
            onClick={() => setPolicyModalOpen(true)}
            className="text-neighbor-700 hover:text-neighbor-800 font-semibold underline ml-1 cursor-pointer"
          >
            {t('policyNotice.linkText')}
          </button>{t('policyNotice.suffix')}
        </p>

        <div className="mt-5 pt-4 border-t border-gray-100 space-y-2.5">
          <div className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t('noAccount')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/register"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
            >
              <User className="w-4 h-4 text-neighbor-600" /> {t('registerCustomer')}
            </Link>

            <Link
              to="/register-provider"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-neighbor-200 bg-neighbor-50/60 hover:bg-neighbor-100/60 rounded-lg text-sm font-semibold text-neighbor-800 transition-colors"
            >
              <Building2 className="w-4 h-4 text-neighbor-600" /> {t('registerProvider')}
            </Link>
          </div>
        </div>
      </div>

      <PolicyDetailModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        policyType="CUSTOMER"
      />
    </div>
  );
};

export default LoginPage;
