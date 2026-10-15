import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, ArrowRight, AlertCircle, Building2, User, Eye, EyeOff } from 'lucide-react';

/**
 * Trang Đăng nhập tài khoản hệ thống ParkLink (UC03)
 */
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Trang trước đó nếu user bị redirect về /login
  const fromPath = location.state?.from?.pathname || null;

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu!');
      return;
    }

    try {
      setLoading(true);
      const res = await login(formData);

      // Chuyển sang trang riêng nếu cần đổi mật khẩu lần đầu
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
      setError(err.message || 'Email hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg mb-4">
          <LogIn className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Đăng Nhập Tài Khoản
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Chào mừng bạn quay lại hệ thống dịch vụ bãi đỗ xe ParkLink.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ email"
                  className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-teal-600 hover:text-teal-800 hover:underline transition"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  className="block w-full pl-10 pr-11 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : (
                <span className="flex items-center gap-2">
                  Đăng Nhập <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chưa có tài khoản?
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/register"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <User className="w-4 h-4 text-teal-600" /> Đăng ký Khách thuê
              </Link>

              <Link
                to="/register-provider"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-teal-200 bg-teal-50/50 rounded-xl text-xs font-bold text-teal-800 hover:bg-teal-100/50 transition"
              >
                <Building2 className="w-4 h-4 text-teal-600" /> Đăng ký Chủ bãi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
