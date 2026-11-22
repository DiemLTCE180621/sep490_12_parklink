import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Shield, X, RefreshCw, AlertCircle } from 'lucide-react';
import userService from '../../services/userService';

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
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-gray-200">
        {}
        <div className="flex justify-between items-center border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-neighbor-50 text-neighbor-600 flex items-center justify-center font-bold shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Chỉnh Sửa Người Dùng #{user.id}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">Cập nhật họ tên và số điện thoại liên hệ</p>
            </div>
          </div>
          <button
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
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-gray-400" /> Email Đăng Nhập
            </label>
            <input
              type="email"
              disabled
              value={user.email || ''}
              className="w-full px-4 py-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl text-sm font-semibold cursor-not-allowed"
            />
          </div>

          {}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4 text-neighbor-600" /> Vai trò hệ thống:
            </span>
            <span className="font-bold text-neighbor-800 bg-neighbor-100 px-3 py-1 rounded-full text-xs">
              {getRoleLabel(user.role?.name)}
            </span>
          </div>

          {}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-neighbor-600" /> Họ và Tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nhập họ và tên đầy đủ"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 font-semibold transition"
            />
          </div>

          {}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-neighbor-600" /> Số Điện Thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="Nhập số điện thoại (10 chữ số)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 font-semibold transition"
            />
            <p className="text-xs text-gray-400">Bắt đầu bằng số 0 và gồm đúng 10 số.</p>
          </div>

          {}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
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
