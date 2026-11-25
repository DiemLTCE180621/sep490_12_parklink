import React, { useState, useEffect, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['admin', 'common']);
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: '',
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

  const handleOpenEdit = (user) => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedUser, msg) => {
    setSuccessMessage(msg);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)));
  };

  const handleOpenToggleStatus = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: user.status === 'ACTIVE' ? 'LOCK' : 'UNLOCK',
      user
    });
  };

  const handleOpenResetPassword = (user) => {
    setConfirmDialog({
      isOpen: true,
      type: 'RESET_PASSWORD',
      user
    });
  };

  const handleConfirmAction = async () => {
    const { type, user } = confirmDialog;
    if (!user) return;

    try {
      setActionLoading(true);
      setError('');

      if (type === 'LOCK' || type === 'UNLOCK') {
        await userService.toggleUserStatus(user.id);
        setSuccessMessage(t(type === 'LOCK' ? 'admin:userDetail.messages.lockSuccess' : 'admin:userDetail.messages.unlockSuccess'));
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: type === 'LOCK' ? 'BLOCKED' : 'ACTIVE' } : u))
        );
      } else if (type === 'RESET_PASSWORD') {
        await userService.forceResetPassword(user.id);
        setSuccessMessage(t('admin:userDetail.messages.resetSuccess'));
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
      case 'ADMIN': return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center">{t('admin:roles.admin', 'Quản trị viên')}</span>;
      case 'PROVIDER': return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center">{t('admin:roles.provider', 'Chủ bãi xe')}</span>;
      case 'FIELD_INSPECTOR': return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center">{t('admin:roles.fieldInspector', 'Nhân viên khảo sát')}</span>;
      case 'CUSTOMER': default: return <span className="bg-neighbor-100 text-neighbor-800 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center">{t('admin:roles.customer', 'Khách hàng')}</span>;
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || '').toUpperCase();
    switch (s) {
      case 'ACTIVE':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {t('admin:statuses.active', 'Hoạt động')}
          </span>
        );
      case 'PENDING':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {t('admin:statuses.pending', 'Chờ duyệt')}
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {t('admin:statuses.blocked', 'Đã khóa')}
          </span>
        );
      default:
        return <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center">{s}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-neighbor-600" /> {t('admin:users.title', 'Quản Lý Tài Khoản Người Dùng')}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {t('admin:users.subtitle', 'Danh sách toàn bộ Khách hàng, Chủ bãi đỗ xe, Nhân viên khảo sát và Admin trong hệ thống ParkLink')}
          </p>
        </div>
        <div className="text-xs font-semibold bg-gray-100 px-3 py-1.5 rounded-xl text-gray-700">
          {t('admin:users.totalCount', { count: pagination.totalItems })}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200 flex justify-between items-center animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin:users.searchPlaceholder', 'Tìm theo họ tên, email hoặc số điện thoại...')}
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 transition"
          />
        </div>

        {}
        <div className="flex flex-wrap items-center gap-2">
          {}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 bg-white font-medium text-gray-700"
          >
            <option value="ALL">{t('admin:users.allRoles', 'Tất cả vai trò')}</option>
            <option value="CUSTOMER">{t('admin:roles.customer', 'Khách hàng')}</option>
            <option value="PROVIDER">{t('admin:roles.provider', 'Chủ bãi xe')}</option>
            <option value="FIELD_INSPECTOR">{t('admin:roles.fieldInspector', 'Nhân viên khảo sát')}</option>
            <option value="ADMIN">{t('admin:roles.admin', 'Quản trị viên')}</option>
          </select>

          {}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 bg-white font-medium text-gray-700"
          >
            <option value="ALL">{t('admin:users.allStatuses', 'Tất cả trạng thái')}</option>
            <option value="ACTIVE">{t('admin:statuses.active', 'Hoạt động')}</option>
            <option value="PENDING">{t('admin:statuses.pending', 'Chờ duyệt')}</option>
            <option value="BLOCKED">{t('admin:statuses.blocked', 'Đã khóa')}</option>
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-gray-200"
            title="Đặt lại bộ lọc & Tải lại danh sách"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-600" /> {t('admin:common.refresh', 'Làm mới')}
          </button>
        </div>
      </div>

      {}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-neighbor-600" />
          <span>Đang tải danh sách tài khoản...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-sm">{t('admin:users.empty', 'Không tìm thấy tài khoản nào phù hợp!')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <th className="py-3 px-4 whitespace-nowrap">{t('admin:users.table.id', 'ID')}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t('admin:users.table.fullName', 'Họ và Tên')}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t('admin:users.table.email', 'Email')}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t('admin:users.table.phone', 'Số điện thoại')}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t('admin:users.table.role', 'Vai trò')}</th>
                <th className="py-3 px-4 whitespace-nowrap">{t('admin:users.table.status', 'Trạng thái')}</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">{t('admin:users.table.actions', 'Thao tác')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {users.map((u) => {
                const isAdmin = u.role?.name === 'ADMIN';
                const isBlocked = u.status === 'BLOCKED';

                return (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-gray-400 whitespace-nowrap">#{u.id}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">{u.full_name}</td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">{u.phone_number || "—"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{getRoleBadge(u.role?.name)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(u.status)}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleViewUserDetail(u.id)}
                          title="Xem chi tiết người dùng"
                          className="p-1.5 bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-800 rounded-lg border border-neighbor-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Chỉnh sửa thông tin tài khoản"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!isAdmin && (
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            title={t('admin:users.actions.resetPassword')}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isAdmin && (
                          <button
                            onClick={() => handleOpenToggleStatus(u)}
                            title={t(isBlocked ? 'admin:users.actions.unlock' : 'admin:users.actions.lock')}
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

      {}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-600">
          <div>
            Trang <strong>{pagination.currentPage}</strong> / {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => fetchUsers(pagination.currentPage - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              onClick={() => fetchUsers(pagination.currentPage + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUserForEdit(null);
        }}
        user={selectedUserForEdit}
        onSuccess={handleEditSuccess}
      />

      {confirmDialog.isOpen && confirmDialog.user && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="account-action-title"
            aria-describedby="account-action-description"
            className="bg-white rounded-xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
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
                <h3 id="account-action-title" className="text-xl font-bold text-gray-900">
                  {confirmDialog.type === 'LOCK'
                    ? t('admin:userDetail.dialogs.lockTitle')
                    : confirmDialog.type === 'UNLOCK'
                    ? t('admin:userDetail.dialogs.unlockTitle')
                    : t('admin:userDetail.dialogs.resetTitle')}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">#{confirmDialog.user.id} — {confirmDialog.user.email}</p>
              </div>
            </div>

            <div id="account-action-description" className="text-base text-gray-700 leading-relaxed bg-gray-50 p-5 rounded-xl border border-gray-200">
              {confirmDialog.type === 'LOCK' && (
                <div>
                  <p>
                    <Trans i18nKey="userDetail.dialogs.lockPrompt" ns="admin" values={{ name: confirmDialog.user.full_name }} />
                  </p>
                  {confirmDialog.user.role?.name === 'PROVIDER' && (
                    <p className="text-rose-600 font-semibold text-sm mt-2">
                      {t('admin:userDetail.dialogs.lockNoteProviderGeneric')}
                    </p>
                  )}
                  {confirmDialog.user.role?.name === 'CUSTOMER' && (
                    <p className="text-amber-700 font-semibold text-sm mt-2">
                      {t('admin:userDetail.dialogs.lockNoteCustomer')}
                    </p>
                  )}
                  {confirmDialog.user.role?.name === 'FIELD_INSPECTOR' && (
                    <p className="text-amber-700 font-semibold text-sm mt-2">
                      {t('admin:userDetail.dialogs.lockNoteInspector')}
                    </p>
                  )}
                </div>
              )}
              {confirmDialog.type === 'UNLOCK' && (
                <p>
                  <Trans i18nKey="userDetail.dialogs.unlockPrompt" ns="admin" values={{ name: confirmDialog.user.full_name }} />
                </p>
              )}
              {confirmDialog.type === 'RESET_PASSWORD' && (
                <p>
                  <Trans i18nKey="userDetail.dialogs.resetPrompt" ns="admin" values={{ email: confirmDialog.user.email }} />
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, type: '', user: null })}
                disabled={actionLoading}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 font-semibold text-base rounded-xl hover:bg-gray-50 transition"
              >
                {t('common:actions.cancel')}
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
                  ? t('admin:userDetail.dialogs.confirmLock')
                  : confirmDialog.type === 'UNLOCK'
                  ? t('admin:userDetail.dialogs.confirmUnlock')
                  : t('admin:users.actions.resetPassword')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPanel;
