import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Shield, Save, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Trang Thông tin cá nhân & Cập nhật hồ sơ (UC07, UC08)
const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhoneNumber(user.phone_number || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

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
      setSuccessMessage(res?.message || 'Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      const errList = (err.errors && err.errors.length > 0)
        ? err.errors
        : (err.response?.data?.errors && err.response?.data?.errors.length > 0)
          ? err.response.data.errors
          : [err.message || err.response?.data?.message || 'Cập nhật thất bại! Vui lòng thử lại.'];
      setError(Array.isArray(errList) ? errList[0] : errList);
    } finally {
      setLoading(false);
    }
  };

  const roleName = user?.role?.name || 'CUSTOMER';

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN': return 'Quản Trị Viên';
      case 'PROVIDER': return 'Chủ Bãi Đỗ Xe';
      case 'FIELD_INSPECTOR': return 'Nhân Viên Khảo Sát';
      case 'CUSTOMER':
      default: return 'Khách Thuê';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Nút quay lại */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Card Header Hồ sơ */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-3xl shadow-md border border-teal-400/30">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{user?.full_name || 'Hồ sơ người dùng'}</h1>
                <p className="text-teal-300 text-xs font-medium mt-1">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                {getRoleLabel(roleName)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Chỉnh sửa thông tin */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-md space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Thông Tin Cá Nhân</h2>
            <p className="text-slate-500 text-xs mt-0.5">Quản lý và cập nhật thông tin liên hệ của bạn</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3 text-teal-800 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-teal-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field (Cố định) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" /> Địa Chỉ Email (Không thể thay đổi)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-semibold text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-600" /> Họ Và Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
            </div>

            {/* Phone Number */}
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
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                required
              />
              <p className="text-[11px] text-slate-500">Gồm đúng 10 chữ số, bắt đầu bằng số 0.</p>
            </div>

            {/* Role Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-600">Vai Trò Hệ Thống:</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                {getRoleLabel(roleName)}
              </span>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
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
    </div>
  );
};

export default ProfilePage;
