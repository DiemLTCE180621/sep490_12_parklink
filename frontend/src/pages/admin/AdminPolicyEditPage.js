import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, Save, Loader2,
  CheckCircle, Bell, User, Building2
} from 'lucide-react';
import policyService from '../../services/policyService';
import Toast from '../../components/common/Toast';

const AdminPolicyEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [policy, setPolicy] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_active: true,
    notifyUsers: false
  });

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        setLoading(true);
        const res = await policyService.getPolicyByTypeOrId(id);
        const data = res?.data?.policy || res?.data;

        if (!data) {
          setToast({ message: 'Không tìm thấy chính sách được yêu cầu.', type: 'error' });
          return;
        }

        setPolicy(data);
        setFormData({
          title: data.title || '',
          content: data.content || '',
          is_active: true,
          notifyUsers: false
        });
      } catch (err) {
        setToast({ message: err?.response?.data?.message || 'Không thể tải nội dung chính sách.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPolicy();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setToast({ message: 'Vui lòng điền đầy đủ tiêu đề và nội dung điều khoản!', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      await policyService.updatePolicy(id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        is_active: true,
        notifyUsers: formData.notifyUsers
      });

      navigate('/dashboard', {
        replace: true,
        state: {
          adminTab: 'policies',
          message: formData.notifyUsers
            ? 'Cập nhật chính sách và gửi thông báo thành công.'
            : 'Cập nhật chính sách thành công.',
          type: 'success'
        }
      });
    } catch (err) {
      setToast({
        message: err?.response?.data?.message || 'Lỗi khi cập nhật chính sách hệ thống!',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-9 h-9 animate-spin text-teal-600 mb-3" />
        <p className="font-semibold text-sm">Đang tải thông tin chính sách...</p>
      </div>
    );
  }

  const isCustomer = policy?.policy_type === 'CUSTOMER';

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 w-full min-h-[calc(100vh-80px)]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <div className="w-full max-w-5xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard', { state: { adminTab: 'policies' } })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Quản Lý Chính Sách
        </button>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden w-full">
          <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-black shadow-sm">
                <ShieldCheck className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                  <span>Cập Nhật Chính Sách Hệ Thống</span>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {policy?.policy_type}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Biên tập các điều khoản pháp lý, quy chế vận hành nền tảng ParkLink
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 self-start sm:self-auto shrink-0">
              {isCustomer ? <User className="w-4 h-4 text-teal-600" /> : <Building2 className="w-4 h-4 text-teal-600" />}
              <span>{isCustomer ? 'Áp dụng cho Khách Hàng' : 'Áp dụng cho Chủ Bãi Xe'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Tiêu đề chính sách <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nhập tiêu đề hiển thị..."
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Nội dung điều khoản <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={18}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Nhập nội dung các điều khoản, quy định dịch vụ..."
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 text-sm font-sans focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none leading-relaxed"
              />
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Chính sách bắt buộc (Luôn kích hoạt)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Áp dụng toàn sàn ParkLink
                </span>
              </div>

              <div className="border-t border-slate-200/70 pt-3.5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notifyUsers}
                    onChange={(e) => setFormData({ ...formData, notifyUsers: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      {isCustomer
                        ? 'Gửi thông báo In-app tự động tới toàn bộ Khách hàng'
                        : 'Gửi thông báo In-app tự động tới toàn bộ Chủ bãi đỗ xe'}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isCustomer
                        ? 'Chuông thông báo của toàn bộ tài khoản Khách hàng sẽ nhận được thông tin về chính sách mới.'
                        : 'Chuông thông báo của toàn bộ tài khoản Chủ bãi xe sẽ nhận được thông tin về quy định mới.'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">
                Thay đổi sẽ được áp dụng trực tiếp lên hệ thống ParkLink.
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard', { state: { adminTab: 'policies' } })}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
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
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
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
    </div>
  );
};

export default AdminPolicyEditPage;
