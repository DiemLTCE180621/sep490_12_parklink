import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  Eye,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Lock,
  Unlock,
  KeyRound,
  X
} from 'lucide-react';
import userService from '../../services/userService';
import EditUserModal from './EditUserModal';

const AdminUsersPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // UC13: State cho Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  // State cho Confirm Dialog (UC10: Reset mật khẩu, UC14/15: Khóa/Mở khóa)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '', // 'LOCK' | 'UNLOCK' | 'RESET_PASSWORD'
    user: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await userService.getUsersList({
        search,
        role: role === 'ALL' ? '' : role,
        status: status === 'ALL' ? '' : status,
        page,
        limit: 10
      });

      const payload = res?.data || res;
      if (payload && payload.users) {
        setUsers(payload.users || []);
        setPagination(payload.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [search, role, status]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleResetFilters = () => {
    setSearch('');
    setRole('ALL');
    setStatus('ALL');
    fetchUsers(1);
  };

  const handleViewUserDetail = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  // Mở modal sửa thông tin người dùng (UC13)
  const handleOpenEdit = (user) => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedUser, msg) => {
    setSuccessMessage(msg);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
  };

  // Mở dialog xác nhận Khóa / Mở khóa (UC14, UC15)
  const handleOpenToggleStatus = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: user.status === 'ACTIVE' ? 'LOCK' : 'UNLOCK',
      user
    });
  };

  // Mở dialog xác nhận Reset mật khẩu (UC10)
  const handleOpenResetPassword = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: 'RESET_PASSWORD',
      user
    });
  };

  // Thực thi hành động từ Confirm Dialog
  const handleConfirmAction = async () => {
    const { type, user } = confirmDialog;
    if (!user) return;

    try {
      setActionLoading(true);
      setError('');

      if (type === 'LOCK' || type === 'UNLOCK') {
        const res = await userService.toggleUserStatus(user.id);
        const actionMsg = res.message || (type === 'LOCK' ? 'Đã khóa tài khoản thành công!' : 'Đã mở khóa tài khoản thành công!');
        setSuccessMessage(actionMsg);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: type === 'LOCK' ? 'BLOCKED' : 'ACTIVE' } : u))
        );
      } else if (type === 'RESET_PASSWORD') {
        const res = await userService.forceResetPassword(user.id);
        const msg = res.message || 'Đặt lại mật khẩu thành công! Mật khẩu mới đã được gửi tới email.';
        setSuccessMessage(msg);
      }

      setConfirmDialog({ isOpen: false, type: '', user: null });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Thao tác thất bại!');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (roleName) => {
    const r = (roleName || '').toUpperCase();
    switch (r) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Quản trị viên</span>;
      case 'PROVIDER':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Chủ bãi xe</span>;
      case 'FIELD_INSPECTOR':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Nhân viên khảo sát</span>;
      case 'CUSTOMER':
      default:
        return <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Khách hàng</span>;
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || '').toUpperCase();
    switch (s) {
      case 'ACTIVE':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Hoạt động
          </span>
        );
      case 'PENDING':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Chờ duyệt
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Đã khóa
          </span>
        );
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{s}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-6 h-6 text-teal-600" /> Quản Lý Tài Khoản Người Dùng
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Danh sách toàn bộ Khách hàng, Chủ bãi đỗ xe, Nhân viên khảo sát và Admin trong hệ thống ParkLink
          </p>
        </div>
        <div className="text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
          Tổng cộng: <strong className="text-teal-700 font-extrabold">{pagination.totalItems}</strong> tài khoản
        </div>
      </div>

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

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Input Tìm kiếm */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc theo Role */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="PROVIDER">Chủ bãi xe</option>
            <option value="FIELD_INSPECTOR">Nhân viên khảo sát</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>

          {/* Lọc theo Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="BLOCKED">Đã khóa</option>
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-slate-200"
            title="Đặt lại bộ lọc & Tải lại danh sách"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> Làm mới
          </button>
        </div>
      </div>

      {/* Table Data */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span>Đang tải danh sách tài khoản...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-sm">Không tìm thấy tài khoản nào phù hợp!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => {
                const isAdmin = u.role?.name === 'ADMIN';
                const isBlocked = u.status === 'BLOCKED';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">#{u.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 font-mono">{u.phone_number || '—'}</td>
                    <td className="py-3 px-4">{getRoleBadge(u.role?.name)}</td>
                    <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {/* UC12: Xem chi tiết */}
                        <button
                          onClick={() => handleViewUserDetail(u.id)}
                          title="Xem chi tiết người dùng"
                          className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* UC13: Chỉnh sửa thông tin */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Chỉnh sửa thông tin tài khoản"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* UC10: Đặt lại mật khẩu */}
                        {!isAdmin && (
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            title="Đặt lại mật khẩu"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* UC14 & UC15: Khóa / Mở khóa tài khoản */}
                        {!isAdmin && (
                          <button
                            onClick={() => handleOpenToggleStatus(u)}
                            title={isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            className={`p-1.5 rounded-lg border transition ${
                              isBlocked
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
          <div>
            Trang <strong>{pagination.currentPage}</strong> / {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => fetchUsers(pagination.currentPage - 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              onClick={() => fetchUsers(pagination.currentPage + 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* UC13: MODAL SỬA THÔNG TIN USER */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUserForEdit(null);
        }}
        user={selectedUserForEdit}
        onSuccess={handleEditSuccess}
      />

      {/* CONFIRMATION DIALOG (CHO UC10, UC14, UC15) */}
      {confirmDialog.isOpen && confirmDialog.user && (
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
                <p className="text-sm text-slate-500 mt-0.5">#{confirmDialog.user.id} — {confirmDialog.user.email}</p>
              </div>
            </div>

            <div className="text-base text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
              {confirmDialog.type === 'LOCK' && (
                <p>
                  Bạn có chắc chắn muốn <strong>khóa tài khoản</strong> của <strong>{confirmDialog.user.full_name}</strong>? Khi bị khóa, tài khoản này sẽ ngay lập tức bị từ chối đăng nhập vào hệ thống ParkLink.
                </p>
              )}
              {confirmDialog.type === 'UNLOCK' && (
                <p>
                  Bạn có chắc chắn muốn <strong>mở khóa tài khoản</strong> của <strong>{confirmDialog.user.full_name}</strong>? Người dùng sẽ có thể đăng nhập bình thường trở lại.
                </p>
              )}
              {confirmDialog.type === 'RESET_PASSWORD' && (
                <p>
                  Hệ thống sẽ tự động tạo một mật khẩu ngẫu nhiên mới và gửi thông báo qua email tới <strong>{confirmDialog.user.email}</strong>. Người dùng sẽ bị bắt buộc đổi mật khẩu mới ở lần đăng nhập tiếp theo.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, type: '', user: null })}
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

export default AdminUsersPanel;
