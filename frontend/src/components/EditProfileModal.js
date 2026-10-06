import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Shield, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EditProfileModal = ({ isOpen, onClose, onSuccess }) => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
      setError('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend Basic Validation
    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Họ và tên phải chứa ít nhất 2 ký tự.');
      return;
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0912345678).');
      return;
    }

    try {
      setLoading(true);
      const res = await updateProfile({
        full_name: cleanName,
        phone_number: cleanPhone
      });

      if (onSuccess) {
        onSuccess(res?.message || 'Cập nhật thông tin cá nhân thành công!');
      }
      onClose();
    } catch (err) {
      const errorsList = (err.errors && err.errors.length > 0)
        ? err.errors
        : (err.response?.data?.errors && err.response?.data?.errors.length > 0)
          ? err.response.data.errors
          : [err.message || err.response?.data?.message || 'Cập nhật thất bại! Vui lòng thử lại.'];

      setError(errorsList);
    } finally {
      setLoading(false);
    }
  };

  const roleName = user?.role?.name || 'CUSTOMER';
  const errorList = Array.isArray(error) ? error : error ? [error] : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 transform transition-all overflow-hidden animate-fadeIn">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-8 py-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-xl">Cập Nhật Thông Tin Cá Nhân</h3>
              <p className="text-teal-300 text-xs font-medium mt-0.5">Thay đổi thông tin liên hệ của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {errorList.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-1 font-medium">
                {errorList.map((errText, idx) => (
                  <p key={idx}>{errText}</p>
                ))}
              </div>
            </div>
          )}

          {/* READONLY EMAIL FIELD */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" /> Địa Chỉ Email (Cố định)
            </label>
            <div className="relative">
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-semibold text-sm cursor-not-allowed"
              />
              <span className="absolute right-3.5 top-3.5 text-xs font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full">
                Không thể sửa
              </span>
            </div>
          </div>

          {/* FULL NAME FIELD */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-600" /> Họ Và Tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên"
              className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* PHONE NUMBER FIELD */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-teal-600" /> Số Điện Thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Nhập số điện thoại"
              maxLength={10}
              className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* ROLE & STATUS READONLY INFO */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-slate-600">Vai Trò Tài Khoản:</span>
            </div>
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-teal-100 text-teal-800">
              {roleName === 'ADMIN' ? 'Quản Trị Viên' : roleName === 'PROVIDER' ? 'Chủ Bãi Xe' : roleName === 'FIELD_INSPECTOR' ? 'Nhân Viên Khảo Sát' : 'Khách Thuê'}
            </span>
          </div>

          {/* BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
