import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Shield,
  Calendar,
  Key,
  RefreshCw,
  Edit2,
  Lock,
  Unlock,
  KeyRound,
  X,
  MapPin,
  UserCheck,
  Car,
  ExternalLink
} from 'lucide-react';
import userService from '../../services/userService';
import EditUserModal from '../../components/admin/EditUserModal';

// Trang Chi tiết tài khoản người dùng Admin (UC12, UC10, UC13, UC14, UC15)
const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // UC13: Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State cho Confirm Dialog (UC10: Reset mật khẩu, UC14/15: Khóa/Mở khóa)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '' // 'LOCK' | 'UNLOCK' | 'RESET_PASSWORD'
  });
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleEditSuccess = (updatedUser, msg) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
    setSuccessMessage(msg);
  };

  const handleConfirmAction = async () => {
    if (!user) return;
    const { type } = confirmDialog;

    try {
      setActionLoading(true);
      setError('');

      if (type === 'LOCK' || type === 'UNLOCK') {
        const res = await userService.toggleUserStatus(user.id);
        const newStatus = type === 'LOCK' ? 'BLOCKED' : 'ACTIVE';
        setUser((prev) => ({ ...prev, status: newStatus }));
        setSuccessMessage(res.message || (type === 'LOCK' ? 'Đã khóa tài khoản thành công!' : 'Đã mở khóa tài khoản thành công!'));
      } else if (type === 'RESET_PASSWORD') {
        const res = await userService.forceResetPassword(user.id);
        setUser((prev) => ({ ...prev, requires_password_change: true }));
        const msg = res.message || 'Đặt lại mật khẩu thành công! Mật khẩu mới đã được gửi tới email.';
        setSuccessMessage(msg);
      }

      setConfirmDialog({ isOpen: false, type: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Thao tác thất bại!');
    } finally {
      setActionLoading(false);
    }
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

  const getVerificationBadge = (vStatus) => {
    const s = (vStatus || '').toUpperCase();
    switch (s) {
      case 'VERIFIED':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã xác thực</span>;
      case 'PENDING_REVIEW':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
      case 'REJECTED':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Bị từ chối</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{s}</span>;
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

  if (error && !user) {
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

  const isAdmin = user.role?.name === 'ADMIN';
  const isBlocked = user.status === 'BLOCKED';

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

        {/* Thông báo thành công */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-2xl border border-emerald-200 flex justify-between items-center animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {successMessage}
            </span>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Card Header Profile */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-8 shadow-xl space-y-6">
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

          {/* Action Bar (UC10, UC13, UC14, UC15) */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-700/60">
            {/* UC13: Sửa thông tin */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" /> Sửa Thông Tin
            </button>

            {/* UC10: Đặt lại mật khẩu */}
            {!isAdmin && (
              <button
                onClick={() => setConfirmDialog({ isOpen: true, type: 'RESET_PASSWORD' })}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" /> Đặt Lại Mật Khẩu
              </button>
            )}

            {/* UC14 & UC15: Khóa / Mở khóa tài khoản */}
            {!isAdmin && (
              <button
                onClick={() => setConfirmDialog({ isOpen: true, type: isBlocked ? 'UNLOCK' : 'LOCK' })}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 border ${
                  isBlocked
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                }`}
              >
                {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isBlocked ? 'Mở Khóa Tài Khoản' : 'Khóa Tài Khoản'}
              </button>
            )}
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Thông tin cơ bản */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" /> Thông Tin Cơ Bản
            </h3>

            <div className="space-y-3.5 text-sm">
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
                <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Địa chỉ liên hệ</span>
                  <span className="font-semibold text-slate-800">{user.address || 'Chưa cập nhật'}</span>
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
              <Calendar className="w-4 h-4 text-teal-600" /> Nhật Ký & Hoạt Động
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Clock className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ngày tạo tài khoản</span>
                  <span className="font-semibold text-slate-800">{formatDate(user.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Clock className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lần cập nhật cuối</span>
                  <span className="font-semibold text-slate-800">{formatDate(user.updated_at)}</span>
                </div>
              </div>

              {user.role?.name === 'CUSTOMER' && (
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Car className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng đơn đặt chỗ</span>
                    <span className="font-semibold text-slate-800">
                      <strong className="text-teal-700 font-extrabold">{user._count?.reservations || 0}</strong> lượt
                    </span>
                  </div>
                </div>
              )}

              {user.role?.name === 'FIELD_INSPECTOR' && (
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <UserCheck className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cơ sở phụ trách</span>
                    <span className="font-semibold text-slate-800">
                      <strong className="text-teal-700 font-extrabold">{user.assigned_facilities?.length || 0}</strong> cơ sở
                    </span>
                  </div>
                </div>
              )}

              {user.role?.name === 'PROVIDER' && (
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Building2 className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cơ sở liên kết</span>
                    <span className="font-semibold text-slate-800">
                      {user.facility ? user.facility.name : 'Chưa đăng ký'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PHẦN THỰC THỂ LIÊN KẾT (CHỈ HIỂN THỊ KHI CÓ THỰC THỂ CỤ THỂ) */}
        {/* 1. Dành cho Chủ bãi xe (PROVIDER) */}
        {user.role?.name === 'PROVIDER' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" /> Cơ Sở Bãi Đỗ Xe Sở Hữu
              </h3>
              {user.facility && (
                <div className="flex flex-wrap items-center gap-2">
                  {getVerificationBadge(user.facility.verification_status)}
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      user.facility.payment_status === 'PAID'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {user.facility.payment_status === 'PAID' ? 'Đã đóng phí hệ thống' : 'Chưa đóng phí'}
                  </span>
                </div>
              )}
            </div>

            {user.facility ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-sm">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên cơ sở</span>
                    <span className="font-bold text-slate-900 text-base">{user.facility.name}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Địa chỉ bãi xe</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                      {user.facility.address}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Quy mô sức chứa</span>
                    <span className="font-bold text-slate-900">{user.facility.capacity} chỗ đỗ</span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      (Chỗ trống khả dụng: <strong>{user.facility.available_slots ?? 0}</strong>)
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Giá thuê tham khảo</span>
                    <span className="font-bold text-teal-700 text-base">
                      {Number(user.facility.price_per_month).toLocaleString('vi-VN')} đ/tháng
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng thái hiển thị</span>
                    <span className="font-bold text-slate-800">
                      {user.facility.visibility_status === 'VISIBLE' ? 'Đang công khai' : 'Đang ẩn'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard', { state: { adminTab: 'facilities' } })}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline transition"
                  >
                    Xem chi tiết và kiểm duyệt cơ sở tại Quản lý Cơ sở <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Tài khoản đối tác này hiện chưa liên kết với cơ sở bãi đỗ xe nào.</p>
              </div>
            )}
          </div>
        )}

        {/* 2. Dành cho Nhân viên khảo sát (FIELD_INSPECTOR) */}
        {user.role?.name === 'FIELD_INSPECTOR' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" /> Nhiệm Vụ Khảo Sát Thực Địa
              </h3>
              <span className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
                Phụ trách: <strong className="text-teal-700 font-extrabold">{user.assigned_facilities?.length || 0}</strong> cơ sở
              </span>
            </div>

            {user.assigned_facilities && user.assigned_facilities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {user.assigned_facilities.map((f) => (
                  <div key={f.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-2.5">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{f.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        {f.address}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-400 font-mono">Mã bãi: #{f.id}</span>
                      {getVerificationBadge(f.verification_status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Hiện tại nhân viên này chưa được phân công khảo sát cơ sở bãi đỗ nào.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* UC13: MODAL SỬA THÔNG TIN */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onSuccess={handleEditSuccess}
      />

      {/* CONFIRMATION DIALOG (CHO UC10, UC14, UC15) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.type === 'LOCK'
                    ? 'bg-rose-100 text-rose-600'
                    : confirmDialog.type === 'UNLOCK'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {confirmDialog.type === 'LOCK' ? (
                  <Lock className="w-7 h-7" />
                ) : confirmDialog.type === 'UNLOCK' ? (
                  <Unlock className="w-7 h-7" />
                ) : (
                  <KeyRound className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {confirmDialog.type === 'LOCK'
                    ? 'Xác nhận Khóa tài khoản'
                    : confirmDialog.type === 'UNLOCK'
                    ? 'Xác nhận Mở khóa tài khoản'
                    : 'Đặt lại mật khẩu'}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">#{user.id} — {user.email}</p>
              </div>
            </div>

            <div className="text-base text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
              {confirmDialog.type === 'LOCK' && (
                <p>
                  Bạn có chắc chắn muốn <strong>khóa tài khoản</strong> của <strong>{user.full_name}</strong>? Khi bị khóa, tài khoản này sẽ ngay lập tức bị từ chối đăng nhập vào hệ thống ParkLink.
                </p>
              )}
              {confirmDialog.type === 'UNLOCK' && (
                <p>
                  Bạn có chắc chắn muốn <strong>mở khóa tài khoản</strong> của <strong>{user.full_name}</strong>? Người dùng sẽ có thể đăng nhập bình thường trở lại.
                </p>
              )}
              {confirmDialog.type === 'RESET_PASSWORD' && (
                <p>
                  Hệ thống sẽ tự động tạo một mật khẩu ngẫu nhiên mới và gửi thông báo qua email tới <strong>{user.email}</strong>. Người dùng sẽ bị bắt buộc đổi mật khẩu mới ở lần đăng nhập tiếp theo.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, type: '' })}
                disabled={actionLoading}
                className="px-6 py-2.5 border border-slate-200 text-slate-700 font-semibold text-base rounded-xl hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`px-6 py-2.5 text-white font-bold text-base rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 ${
                  confirmDialog.type === 'LOCK'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.type === 'UNLOCK'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {confirmDialog.type === 'LOCK'
                  ? 'Khóa Tài Khoản'
                  : confirmDialog.type === 'UNLOCK'
                  ? 'Mở Khóa Tài Khoản'
                  : 'Đặt lại mật khẩu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetailPage;
