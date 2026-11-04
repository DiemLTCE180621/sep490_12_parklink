import React, { useState, useEffect } from 'react';
import { 
  FileText, Edit, ShieldCheck, Calendar, Bell, 
  CheckCircle, XCircle, User, AlertCircle, Save, X 
} from 'lucide-react';
import policyService from '../../services/policyService';
import Toast from '../common/Toast';

const AdminPoliciesPanel = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingPolicy, setEditingPolicy] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    is_active: true,
    notifyUsers: false
  });
  const [saving, setSaving] = useState(false);

  const [toastInfo, setToastInfo] = useState(null);

  useEffect(() => {
    fetchAdminPolicies();
  }, []);

  const fetchAdminPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await policyService.getAllPoliciesAdmin();
      setPolicies(res?.data?.policies || []);
    } catch (err) {
      setError('Không thể tải danh sách chính sách từ máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (policy) => {
    setEditingPolicy(policy);
    setEditFormData({
      title: policy.title,
      content: policy.content,
      is_active: policy.is_active,
      notifyUsers: false
    });
  };

  const handleCloseEdit = () => {
    setEditingPolicy(null);
    setSaving(false);
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!editFormData.title.trim() || !editFormData.content.trim()) {
      setToastInfo({ message: 'Vui lòng điền đầy đủ tiêu đề và nội dung!', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      await policyService.updatePolicy(editingPolicy.id, editFormData);

      setToastInfo({
        message: editFormData.notifyUsers
          ? 'Cập nhật chính sách thành công và đã phát thông báo tới người dùng!'
          : 'Cập nhật chính sách hệ thống thành công!',
        type: 'success'
      });

      handleCloseEdit();
      fetchAdminPolicies();
    } catch (err) {
      setToastInfo({
        message: err?.response?.data?.message || 'Lỗi khi cập nhật chính sách!',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {toastInfo && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo(null)}
        />
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-6">
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" /> Quản Lý Chính Sách Hệ Thống
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              Quản lý văn bản điều khoản, quy định dịch vụ và cập nhật thông báo tới khách hàng & đối tác
            </p>
          </div>
          <div className="text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
            Tổng cộng: <strong className="text-teal-700 font-extrabold">{policies.length}</strong> chính sách
          </div>
        </div>

        {/* Table Data */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Đang tải danh sách chính sách...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <th className="py-3 px-4">Loại Chính Sách</th>
                  <th className="py-3 px-4">Tiêu Đề</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Người Cập Nhật</th>
                  <th className="py-3 px-4">Cập Nhật Lần Cuối</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700 whitespace-nowrap">
                      {policy.policy_type}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {policy.title}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {policy.is_active ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Hoạt động
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" /> Vô hiệu hóa
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{policy.admin?.full_name || 'Hệ thống'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(policy.updated_at)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(policy)}
                        title="Chỉnh sửa chính sách"
                        className="p-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 transition text-xs inline-flex items-center gap-1.5 font-bold"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Chỉnh Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">

            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Cập Nhật Chính Sách Hệ Thống</h3>
                  <p className="text-xs text-slate-400">Loại: {editingPolicy.policy_type}</p>
                </div>
              </div>
              <button
                onClick={handleCloseEdit}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePolicy} className="flex flex-col flex-1 overflow-hidden">
              
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Tiêu đề */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Tiêu đề chính sách <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    placeholder="Nhập tiêu đề hiển thị..."
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>

                {/* Nội dung điều khoản */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nội dung điều khoản <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={12}
                    value={editFormData.content}
                    onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                    placeholder="Nhập nội dung các điều khoản, quy định dịch vụ..."
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-sans focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none leading-relaxed"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.is_active}
                      onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Công khai áp dụng chính sách này trên hệ thống
                    </span>
                  </label>

                  <div className="border-t border-slate-200/70 pt-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.notifyUsers}
                        onChange={(e) => setEditFormData({ ...editFormData, notifyUsers: e.target.checked })}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-amber-500" />
                          {editingPolicy.policy_type === 'CUSTOMER'
                            ? 'Gửi thông báo In-app tự động tới toàn bộ Khách hàng'
                            : editingPolicy.policy_type === 'PROVIDER'
                            ? 'Gửi thông báo In-app tự động tới toàn bộ Chủ bãi đỗ xe'
                            : 'Gửi thông báo In-app tự động tới toàn bộ người dùng'}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {editingPolicy.policy_type === 'CUSTOMER'
                            ? 'Chuông thông báo của toàn bộ tài khoản Khách hàng sẽ nhận được thông tin về chính sách mới.'
                            : editingPolicy.policy_type === 'PROVIDER'
                            ? 'Chuông thông báo của toàn bộ tài khoản Chủ bãi xe sẽ nhận được thông tin về quy định mới.'
                            : 'Chuông thông báo của người dùng sẽ nhận được thông tin về chính sách mới.'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Thay đổi sẽ được áp dụng trực tiếp lên hệ thống ParkLink.
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-white font-bold text-xs transition"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Lưu Thay Đổi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPoliciesPanel;
