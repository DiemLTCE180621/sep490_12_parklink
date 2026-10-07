import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, ArrowRight, AlertCircle, Building2, User, Key, CheckCircle2 } from 'lucide-react';
import ForgotPasswordModal from '../../components/modals/ForgotPasswordModal';

import { isValidPassword } from '../../utils/validators';

const LoginPage = () => {
  const { login, changePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // State hỗ trợ đổi mật khẩu lần đầu khi requires_password_change = true
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordChangedSuccess, setPasswordChangedSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handlePasswordChangeInput = (e) => {
    setPasswordChangeData({ ...passwordChangeData, [e.target.name]: e.target.value });
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

      // Kiểm tra xem tài khoản có yêu cầu Đổi mật khẩu lần đầu không
      if (res?.data?.user?.requires_password_change) {
        setRequirePasswordChange(true);
        setPasswordChangeData(prev => ({ ...prev, oldPassword: formData.password }));
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyNewPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordChangeData.newPassword !== passwordChangeData.confirmNewPassword) {
      setError('Mật khẩu mới không trùng khớp!');
      return;
    }

    if (!isValidPassword(passwordChangeData.newPassword)) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ cái viết hoa, 1 chữ cái viết thường và 1 chữ số!');
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        oldPassword: passwordChangeData.oldPassword,
        newPassword: passwordChangeData.newPassword
      });

      setPasswordChangedSuccess(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message || 'Đổi mật khẩu thất bại!');
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
          {requirePasswordChange ? 'Đổi Mật Khẩu Lần Đầu' : 'Đăng Nhập Tài Khoản'}
        </h2>
        {requirePasswordChange && (
          <p className="mt-2 text-sm text-slate-600">
            Tài khoản của bạn đang sử dụng mật khẩu ngẫu nhiên. Vui lòng tạo mật khẩu mới.
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {passwordChangedSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <span>Đổi mật khẩu thành công! Đang chuyển hướng...</span>
            </div>
          )}

          {/* CHẾ ĐỘ 1: ĐỔI MẬT KHẨU BẮT BUỘC LẦN ĐẦU */}
          {requirePasswordChange ? (
            <form className="space-y-5" onSubmit={handleApplyNewPassword}>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Bạn đang đăng nhập bằng mật khẩu tạm thời. Hãy thiết lập mật khẩu cá nhân mới.</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordChangeData.newPassword}
                  onChange={handlePasswordChangeInput}
                  placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 chữ thường và 1 số"
                  className="block w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={passwordChangeData.confirmNewPassword}
                  onChange={handlePasswordChangeInput}
                  placeholder="Nhập lại mật khẩu mới"
                  className="block w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md font-bold text-white bg-teal-600 hover:bg-teal-700 transition"
              >
                {loading ? 'Đang cập nhật...' : 'Hoàn Tất Đổi Mật Khẩu & Đăng Nhập'}
              </button>
            </form>
          ) : (
            /* CHẾ ĐỘ 2: ĐĂNG NHẬP THƯỜNG */
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
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-bold text-teal-600 hover:text-teal-800 hover:underline transition"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    required
                  />
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
          )}

          {!requirePasswordChange && (
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
          )}
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={formData.email}
      />
    </div>
  );
};

export default LoginPage;
