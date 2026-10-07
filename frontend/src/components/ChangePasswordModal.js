import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import authService from '../services/authService';
import { isValidPassword } from '../utils/validators';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.oldPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    if (!isValidPassword(formData.newPassword)) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ cái viết hoa, 1 chữ cái viết thường và 1 chữ số!');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });
      setSuccessMessage(res.data?.message || 'Đổi mật khẩu thành công!');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errors && Array.isArray(resData.errors) && resData.errors.length > 0) {
        setError(resData.errors);
      } else if (resData?.message) {
        setError([resData.message]);
      } else if (err.message) {
        setError([err.message]);
      } else {
        setError(['Đổi mật khẩu thất bại! Vui lòng thử lại.']);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setError('');
    setSuccessMessage('');
    onClose();
  };

  const errorList = Array.isArray(error) ? error : error ? [error] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden relative transform transition-all">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white px-8 py-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-md">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl">Đổi Mật Khẩu Cá Nhân</h3>
              <p className="text-teal-300 text-xs font-medium mt-0.5">
                Cập nhật mật khẩu bảo vệ tài khoản ParkLink của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {errorList.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1 font-medium">
                {errorList.map((errText, idx) => (
                  <p key={idx}>{errText}</p>
                ))}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-teal-600" />
                </div>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="block w-full pl-11 pr-4 py-3.5 text-sm border border-slate-300 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-teal-600" />
                </div>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Tối thiểu 8 ký tự, 1 hoa, 1 thường, 1 số"
                  className="block w-full pl-11 pr-4 py-3.5 text-sm border border-slate-300 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-teal-600" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  className="block w-full pl-11 pr-4 py-3.5 text-sm border border-slate-300 rounded-2xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl shadow-md text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang cập nhật...
                  </>
                ) : (
                  'Cập Nhật Mật Khẩu'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
