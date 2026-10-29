import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Shield, X, RefreshCw, AlertCircle } from 'lucide-react';
import userService from '../../services/userService';

/**
 * Modal chỉnh sửa thông tin tài khoản người dùng từ Admin (UC13)
 */
const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
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
      setError('Họ và tên phải chứa ít nhất 2 ký tự và không chứa số hay ký tự đặc biệt.');
      return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      setError('Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0912345678).');
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
        onSuccess(updated, 'Cập nhật thông tin tài khoản thành công!');
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Cập nhật thông tin thất bại!';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (roleName) => {
    switch ((roleName || '').toUpperCase()) {
      case 'ADMIN': return 'Quản Trị Viên';
      case 'PROVIDER': return 'Chủ Bãi Đỗ Xe';
      case 'FIELD_INSPECTOR': return 'Nhân Viên Khảo Sát';
      case 'CUSTOMER':
      default: return 'Khách Hàng';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Chỉnh Sửa Người Dùng #{user.id}
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">Cập nhật họ tên và số điện thoại liên hệ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Email Info (Disabled) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" /> Email Đăng Nhập
            </label>
            <input
              type="email"
              disabled
              value={user.email || ''}
              className="w-full px-4 py-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-2xl text-sm font-semibold cursor-not-allowed"
            />
          </div>

          {/* Role Info */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" /> Vai trò hệ thống:
            </span>
            <span className="font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full text-xs">
              {getRoleLabel(user.role?.name)}
            </span>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-600" /> Họ và Tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nhập họ và tên đầy đủ"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold transition"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-teal-600" /> Số Điện Thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="Nhập số điện thoại (10 chữ số)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold transition"
            />
            <p className="text-xs text-slate-400">Bắt đầu bằng số 0 và gồm đúng 10 số.</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
