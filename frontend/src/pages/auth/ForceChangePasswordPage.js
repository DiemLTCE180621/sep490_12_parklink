import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Key, ShieldAlert, CheckCircle2, AlertCircle, Eye, EyeOff, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { isValidPassword } from '../../utils/validators';

// Trang Đổi mật khẩu lần đầu (bắt buộc khi login bằng mật khẩu ngẫu nhiên)
const ForceChangePasswordPage = () => {
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

  // Kiểm tra từng tiêu chí độ mạnh mật khẩu theo thời gian thực
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
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    try {
      setLoading(true);
      // Gọi qua context -> services/authService.js -> API POST /auth/change-password
      await changePassword({
        newPassword: formData.newPassword
      });

      setSuccess(true);
      // Chuyển hướng người dùng vào hệ thống dựa trên vai trò sau khi đổi mật khẩu thành công
      setTimeout(() => {
        const role = user?.role?.name;
        const targetPath = role === 'CUSTOMER' ? '/' : '/dashboard';
        navigate(targetPath, { replace: true });
      }, 1500);
    } catch (err) {
      const errMessage = (err.errors && err.errors.length > 0)
        ? err.errors[0]
        : (err.message || 'Đổi mật khẩu thất bại! Vui lòng thử lại.');
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-white shadow-xl mb-4 border-2 border-amber-400/40">
          <Key className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Thiết Lập Mật Khẩu Lần Đầu
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Tài khoản <span className="font-semibold text-slate-800">{user?.email || 'của bạn'}</span> đang sử dụng mật khẩu ngẫu nhiên tạm thời. Hãy tạo mật khẩu mới để bảo vệ an toàn cho tài khoản.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 sm:px-10">
          {/* Cảnh báo bảo mật nghiệp vụ */}
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Yêu cầu bảo mật bắt buộc:</p>
              <p className="text-amber-800">
                Bạn cần hoàn tất bước đổi mật khẩu này để tiếp tục sử dụng các tính năng trên nền tảng ParkLink.
              </p>
            </div>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Thông báo thành công */}
          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <span>Đổi mật khẩu thành công! Đang chuyển hướng bạn vào hệ thống...</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Mật khẩu mới */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-5 h-5" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới của bạn"
                  className="block w-full pl-10 pr-11 py-3 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Checklist tiêu chuẩn mật khẩu */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <p className="font-semibold text-slate-700 mb-1">Mật khẩu cần đáp ứng:</p>
              <div className="grid grid-cols-2 gap-1.5 text-slate-600">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-teal-700 font-semibold' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${hasMinLength ? 'bg-teal-500' : 'bg-slate-300'}`} />
                  Tối thiểu 8 ký tự
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-teal-700 font-semibold' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${hasUpperCase ? 'bg-teal-500' : 'bg-slate-300'}`} />
                  Ít nhất 1 chữ hoa
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-teal-700 font-semibold' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${hasLowerCase ? 'bg-teal-500' : 'bg-slate-300'}`} />
                  Ít nhất 1 chữ thường
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-teal-700 font-semibold' : ''}`}>
                  <div className={`w-2 h-2 rounded-full ${hasNumber ? 'bg-teal-500' : 'bg-slate-300'}`} />
                  Ít nhất 1 chữ số
                </div>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className="block w-full pl-10 pr-11 py-3 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`mt-1 text-xs ${isMatch ? 'text-teal-600 font-medium' : 'text-red-500'}`}>
                  {isMatch ? '✓ Mật khẩu mới trùng khớp' : '✗ Mật khẩu nhập lại chưa khớp'}
                </p>
              )}
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-md font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                'Đang cập nhật mật khẩu...'
              ) : (
                <span className="flex items-center gap-2">
                  Xác Nhận & Đăng Nhập Vào Hệ Thống <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          {/* Lựa chọn Đăng xuất nếu muốn dùng tài khoản khác */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất và đăng nhập bằng tài khoản khác
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForceChangePasswordPage;
