import React, { useState, useEffect, useCallback } from 'react';
import { Search, RotateCcw, Eye, User, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import userService from '../../services/userService';
import UserDetailModal from '../modals/UserDetailModal';

const AdminUsersPanel = () => {
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

  // State xem chi tiết User
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const handleViewUserDetail = async (userId) => {
    try {
      setLoadingDetail(true);
      const res = await userService.getUserDetails(userId);
      const payload = res?.data || res;
      if (payload && payload.user) {
        setSelectedUser(payload.user);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Không thể xem thông tin người dùng');
    } finally {
      setLoadingDetail(false);
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
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Hoạt động</span>;
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
      case 'BLOCKED':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Đã khóa</span>;
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

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search input */}
        <div className="sm:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, email hoặc SĐT..."
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filter Role */}
        <div className="sm:col-span-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full py-2.5 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="ALL">Tất cả Vai trò</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="PROVIDER">Chủ bãi xe</option>
            <option value="FIELD_INSPECTOR">Nhân viên khảo sát</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>

        {/* Filter Status & Reset Button */}
        <div className="sm:col-span-3 flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full py-2.5 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="ALL">Tất cả Trạng thái</option>
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
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">#{u.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4 font-mono">{u.phone_number || '—'}</td>
                  <td className="py-3 px-4">{getRoleBadge(u.role?.name)}</td>
                  <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleViewUserDetail(u.id)}
                      disabled={loadingDetail}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
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

      {/* Modal chi tiết người dùng */}
      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};

export default AdminUsersPanel;
