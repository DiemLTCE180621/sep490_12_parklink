import React from 'react';
import { X, Mail, Phone, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const UserDetailModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (roleName) => {
    const role = (roleName || '').toUpperCase();
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">Quản trị viên</span>;
      case 'PROVIDER':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">Chủ bãi đỗ xe</span>;
      case 'CUSTOMER':
      default:
        return <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full border border-teal-200">Khách thuê</span>;
    }
  };

  const getStatusBadge = (statusStr) => {
    const status = (statusStr || '').toUpperCase();
    switch (status) {
      case 'ACTIVE':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 w-max"><CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 w-max"><Clock className="w-3.5 h-3.5" /> Chờ duyệt</span>;
      case 'BLOCKED':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 w-max"><AlertTriangle className="w-3.5 h-3.5" /> Đã khóa</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full w-max">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden relative transform transition-all">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xl border border-teal-500/30">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.full_name || 'Người dùng ParkLink'}</h3>
              <p className="text-slate-400 text-xs mt-0.5">Mã ID tài khoản: #{user.id}</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-slate-700 text-sm">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Vai trò hệ thống</span>
              {getRoleBadge(user.role?.name)}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">Trạng thái tài khoản</span>
              {getStatusBadge(user.status)}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100">
              <Mail className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Địa chỉ Email</span>
                <span className="font-medium text-slate-900">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100">
              <Phone className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Số điện thoại liên hệ</span>
                <span className="font-medium text-slate-900">{user.phone_number || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Ngày tạo tài khoản
                </span>
                <span className="font-medium text-slate-800">{formatDate(user.created_at)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Lần cập nhật cuối
                </span>
                <span className="font-medium text-slate-800">{formatDate(user.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
