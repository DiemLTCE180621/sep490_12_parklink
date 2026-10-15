import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, Clock, CheckCircle2, AlertTriangle, ArrowLeft, Building2, Shield, Calendar, Key, RefreshCw } from 'lucide-react';
import userService from '../../services/userService';

// Trang Chi tiết tài khoản người dùng Admin (UC12)
const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await userService.getUserDetails(id);
        const payload = res?.data || res;
        if (payload?.user) {
          setUser(payload.user);
        } else {
          setError('Không tìm thấy thông tin người dùng.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

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
      case 'FIELD_INSPECTOR':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">Nhân viên khảo sát</span>;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Không Thể Tải Dữ Liệu</h2>
          <p className="text-sm text-slate-500">{error || 'Người dùng không tồn tại hoặc đã bị xóa.'}</p>
          <button
            onClick={() => navigate('/dashboard', { state: { adminTab: 'users' } })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Nút quay lại */}
        <button
          onClick={() => navigate('/dashboard', { state: { adminTab: 'users' } })}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-teal-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách người dùng
        </button>

        {/* Card Header Profile */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-3xl shadow-md border border-teal-400/30">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{user.full_name || 'Người dùng ParkLink'}</h1>
                <p className="text-teal-300 text-xs font-medium mt-1">Mã tài khoản hệ thống: #{user.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getRoleBadge(user.role?.name)}
              {getStatusBadge(user.status)}
            </div>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Thông tin liên hệ */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" /> Thông Tin Cơ Bản
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Mail className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email</span>
                  <span className="font-semibold text-slate-800">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Phone className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Số điện thoại</span>
                  <span className="font-semibold text-slate-800">{user.phone_number || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Key className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Đổi mật khẩu lần đầu</span>
                  <span className="font-semibold text-slate-800">
                    {user.requires_password_change ? 'Cần đổi mật khẩu' : 'Đã thiết lập'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Thời gian & Hoạt động */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" /> Nhật Ký Hệ Thống
            </h3>

            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> Ngày tạo tài khoản
                </span>
                <span className="font-semibold text-slate-800 text-sm">{formatDate(user.created_at)}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> Lần cập nhật cuối
                </span>
                <span className="font-semibold text-slate-800 text-sm">{formatDate(user.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin Bãi đỗ xe nếu là Provider */}
        {user.facility && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" /> Cơ Sở Bãi Đỗ Xe Liên Kết
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 uppercase block font-semibold">Tên cơ sở</span>
                <span className="font-bold text-slate-900">{user.facility.name}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl sm:col-span-2">
                <span className="text-xs text-slate-400 uppercase block font-semibold">Địa chỉ</span>
                <span className="font-bold text-slate-900">{user.facility.address}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 uppercase block font-semibold">Sức chứa</span>
                <span className="font-bold text-slate-900">{user.facility.capacity} chỗ</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 uppercase block font-semibold">Giá thuê/tháng</span>
                <span className="font-bold text-teal-600">
                  {Number(user.facility.price_per_month).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-400 uppercase block font-semibold">Trạng thái duyệt</span>
                <span className="font-bold text-slate-800">{user.facility.verification_status}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserDetailPage;
