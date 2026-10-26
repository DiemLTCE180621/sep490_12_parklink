import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit, UserCheck, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Mail, Phone, User, X, MapPin } from 'lucide-react';
import fieldInspectorService from '../services/fieldInspectorService';
import AddressSelector from './common/AddressSelector';

const AdminFieldInspectorsPanel = () => {
  const [inspectors, setInspectors] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal State cho UC-86 (Create)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', full_name: '', phone_number: '', address: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Modal State cho UC-88 (Update)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInspector, setEditingInspector] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone_number: '', address: '', status: 'ACTIVE' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // UC-87: Fetch Field Inspectors List
  const fetchInspectors = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await fieldInspectorService.getFieldInspectors({
        search,
        page,
        limit: 10
      });

      const payload = res?.data || res;
      if (payload && payload.users) {
        setInspectors(payload.users || []);
        setPagination(payload.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
      }
    } catch (err) {
      setError(err.errors?.[0] || err.message || 'Lỗi khi tải danh sách nhân viên khảo sát');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchInspectors(1);
  }, [fetchInspectors]);

  // UC-86: Submit Create Field Inspector
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.email || !createForm.full_name || !createForm.phone_number) {
      setCreateError('Vui lòng nhập đầy đủ Email, Họ tên và Số điện thoại!');
      return;
    }

    try {
      setCreateLoading(true);
      const res = await fieldInspectorService.createFieldInspector(createForm);
      setSuccessMessage(res.data?.message || 'Tạo tài khoản Nhân viên khảo sát thực địa thành công! Mật khẩu đã được gửi qua email.');
      setIsCreateModalOpen(false);
      setCreateForm({ email: '', full_name: '', phone_number: '', address: '' });
      fetchInspectors(1);
    } catch (err) {
      setCreateError(err.errors?.[0] || err.message || 'Lỗi khi tạo tài khoản nhân viên khảo sát');
    } finally {
      setCreateLoading(false);
    }
  };

  // UC-88: Open Edit Modal
  const handleOpenEditModal = (inspector) => {
    setEditingInspector(inspector);
    setEditForm({
      full_name: inspector.full_name || '',
      phone_number: inspector.phone_number || '',
      address: inspector.address || '',
      status: inspector.status || 'ACTIVE'
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  // UC-88: Submit Update Field Inspector
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editForm.full_name || !editForm.phone_number) {
      setEditError('Họ tên và Số điện thoại không được để trống!');
      return;
    }

    try {
      setEditLoading(true);
      const res = await fieldInspectorService.updateFieldInspector(editingInspector.id, editForm);
      setSuccessMessage(res.data?.message || 'Cập nhật thông tin thành công!');
      setIsEditModalOpen(false);
      setEditingInspector(null);
      fetchInspectors(pagination.currentPage);
    } catch (err) {
      setEditError(err.errors?.[0] || err.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = (statusStr || '').toUpperCase();
    switch (s) {
      case 'ACTIVE':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Hoạt động</span>;
      case 'BLOCKED':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Đã khóa</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{s}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-teal-600" /> Quản Lý Nhân Viên Khảo Sát Thực Địa
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Danh sách nhân viên khảo sát có nhiệm vụ kiểm tra và xác nhận bãi đỗ xe ngoài thực tế
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError('');
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm Nhân Viên Khảo Sát
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-200 flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên, email hoặc SĐT nhân viên khảo sát..."
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button
          type="button"
          onClick={() => fetchInspectors(1)}
          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Tải lại
        </button>
      </div>

      {/* Table Section */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span>Đang tải danh sách nhân viên khảo sát...</span>
        </div>
      ) : inspectors.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-sm">Chưa có Nhân viên khảo sát thực địa nào trong hệ thống!</p>
          <p className="text-xs text-slate-400 mt-1">Nhấn "Thêm Nhân Viên Khảo Sát" ở trên để tạo tài khoản mới.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Email Đăng Nhập</th>
                <th className="py-3 px-4">Số Điện Thoại</th>
                <th className="py-3 px-4">Địa Chỉ</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inspectors.map((inspector) => (
                <tr key={inspector.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">#{inspector.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{inspector.full_name}</td>
                  <td className="py-3 px-4 text-slate-600">{inspector.email}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{inspector.phone_number || '—'}</td>
                  <td className="py-3 px-4 text-slate-700" title={inspector.address || ''}>
                    {inspector.address ? (
                      inspector.address.split(',').map((p) => p.trim()).filter(Boolean).pop() || inspector.address
                    ) : (
                      <span className="text-slate-400 italic text-xs">Chưa cập nhật</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(inspector.status)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleOpenEditModal(inspector)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition"
                    >
                      <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
          <div>
            Trang <strong>{pagination.currentPage}</strong> / {pagination.totalPages} (Tổng: {pagination.totalItems})
          </div>
          <div className="flex gap-2">
            <button
              disabled={pagination.currentPage <= 1 || loading}
              onClick={() => fetchInspectors(pagination.currentPage - 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              onClick={() => fetchInspectors(pagination.currentPage + 1)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL UC-86: CREATE FIELD INSPECTOR */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-teal-600" /> Tạo Tài Khoản Nhân Viên Khảo Sát
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-5 text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-600" /> Họ và Tên Nhân Viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-teal-600" /> Email Đăng Nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Nhập email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-teal-600" /> Số Điện Thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập số điện thoại"
                  value={createForm.phone_number}
                  onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" /> Địa Chỉ
                </label>
                <AddressSelector
                  value={createForm.address}
                  onChange={(fullAddress) => setCreateForm((prev) => ({ ...prev, address: fullAddress }))}
                />
              </div>

              <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-100 text-teal-800 text-xs leading-relaxed">
                <strong>Lưu ý:</strong> Mật khẩu sẽ được sinh tự động ngẫu nhiên và gửi tới Email trên. Nhân viên sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UC-88: EDIT FIELD INSPECTOR */}
      {isEditModalOpen && editingInspector && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit className="w-6 h-6 text-teal-600" /> Chỉnh Sửa Nhân Viên Khảo Sát (#{editingInspector.id})
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-5 text-sm">
              <div>
                <label className="block font-bold text-slate-500 mb-1.5">Email (Không thể thay đổi)</label>
                <input
                  type="text"
                  disabled
                  value={editingInspector.email}
                  className="w-full px-4 py-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-2xl cursor-not-allowed font-medium text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Họ và Tên</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Số Điện Thoại</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập số điện thoại"
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" /> Địa Chỉ
                </label>
                <AddressSelector
                  value={editForm.address}
                  onChange={(fullAddress) => setEditForm((prev) => ({ ...prev, address: fullAddress }))}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Trạng Thái Tài Khoản</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-bold text-sm transition"
                >
                  <option value="ACTIVE">Hoạt động (Active)</option>
                  <option value="BLOCKED">Khóa tài khoản (Blocked)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFieldInspectorsPanel;
