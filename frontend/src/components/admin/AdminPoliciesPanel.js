import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Edit, ShieldCheck, Calendar, 
  CheckCircle, XCircle, User 
} from 'lucide-react';
import policyService from '../../services/policyService';
import Toast from '../common/Toast';

const AdminPoliciesPanel = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
                        onClick={() => navigate(`/admin/policies/${policy.id}/edit`)}
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
    </div>
  );
};

export default AdminPoliciesPanel;