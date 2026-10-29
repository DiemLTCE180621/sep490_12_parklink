import React, { useState } from 'react';
import {
  Radio,
  Mail,
  Send,
  RotateCcw,
  CheckCircle2,
  Users,
  Loader2,
  Sparkles,
  Info
} from 'lucide-react';
import {
  broadcastPushNotification,
  broadcastEmailNotification
} from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import Toast from '../common/Toast';

/**
 * Giao diện Quản trị viên Phát sóng thông báo Hệ thống
 */
const AdminBroadcastPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('WEB'); // 'WEB' hoặc 'EMAIL'

  // ─── STATE CHO TAB 1: WEB NOTIFICATION (UC-65) ───
  const [webForm, setWebForm] = useState({
    targetRole: 'ALL',
    category: 'Bảo trì hệ thống (Maintenance)',
    priority: 'Bình thường',
    title: '',
    content: '',
    showToast: true,
    saveToDb: true
  });
  const [webLoading, setWebLoading] = useState(false);
  const [webSummary, setWebSummary] = useState(null);

  // ─── STATE CHO TAB 2: EMAIL NOTIFICATION (UC-66) ───
  const [emailForm, setEmailForm] = useState({
    recipientScope: 'ALL',
    category: 'Bảo trì & Cập nhật kỹ thuật',
    subject: '',
    htmlContent: '',
    attachSignature: true,
    canSpamCompliance: true
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSummary, setEmailSummary] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState(null);

  // ─── HANDLERS CHO WEB BROADCAST (UC-65) ───
  const handleResetWebForm = () => {
    setWebForm({
      targetRole: 'ALL',
      category: 'Bảo trì hệ thống (Maintenance)',
      priority: 'Bình thường',
      title: '',
      content: '',
      showToast: true,
      saveToDb: true
    });
    setWebSummary(null);
  };

  const handleSendWebBroadcast = async (isTestSelf = false) => {
    if (!webForm.title.trim()) {
      setToast({ message: 'Tiêu đề thông báo Web không được để trống!', type: 'error' });
      return;
    }
    if (!webForm.content.trim()) {
      setToast({ message: 'Nội dung thông điệp Web không được để trống!', type: 'error' });
      return;
    }

    try {
      setWebLoading(true);
      const payload = {
        title: isTestSelf ? `[TEST] ${webForm.title}` : webForm.title,
        content: webForm.content,
        targetRole: isTestSelf ? 'ADMIN' : webForm.targetRole,
        category: webForm.category,
        priority: webForm.priority,
        saveToDb: webForm.saveToDb,
        showToast: webForm.showToast
      };

      const res = await broadcastPushNotification(payload);
      const data = res?.data || res;
      setWebSummary(data);
      setToast({
        message: isTestSelf
          ? 'Đã gửi thông báo thử nghiệm thành công!'
          : `Đã phát sóng thông báo Web thành công tới ${data?.totalRecipients || 'tất cả'} người dùng!`,
        type: 'success'
      });
    } catch (err) {
      console.error('Lỗi phát sóng thông báo Web:', err);
      setToast({ message: err.message || 'Lỗi phát sóng thông báo Web!', type: 'error' });
    } finally {
      setWebLoading(false);
    }
  };

  // ─── HANDLERS CHO EMAIL BROADCAST (UC-66) ───
  const handleResetEmailForm = () => {
    setEmailForm({
      recipientScope: 'ALL',
      category: 'Bảo trì & Cập nhật kỹ thuật',
      subject: '',
      htmlContent: '',
      attachSignature: true,
      canSpamCompliance: true
    });
    setEmailSummary(null);
  };

  const handleSendEmailBroadcast = async (isTestSelf = false) => {
    if (!emailForm.subject.trim()) {
      setToast({ message: 'Tiêu đề Email không được để trống!', type: 'error' });
      return;
    }
    if (!emailForm.htmlContent.trim()) {
      setToast({ message: 'Nội dung thư không được để trống!', type: 'error' });
      return;
    }

    try {
      setEmailLoading(true);
      const payload = {
        subject: isTestSelf ? `[TEST ADMIN] ${emailForm.subject}` : emailForm.subject,
        htmlContent: emailForm.htmlContent,
        recipientScope: isTestSelf ? 'ADMIN' : emailForm.recipientScope,
        emailCategory: emailForm.category
      };

      const res = await broadcastEmailNotification(payload);
      const data = res?.data || res;
      setEmailSummary(data);
      setToast({
        message: isTestSelf
          ? `Đã gửi email thử nghiệm thành công tới hộp thư ${user?.email}!`
          : `Đã khởi tạo tác vụ gửi email hàng loạt tới ${data?.totalQueued || 0} người dùng!`,
        type: 'success'
      });
    } catch (err) {
      console.error('Lỗi phát sóng email:', err);
      setToast({ message: err.message || 'Lỗi gửi email phát sóng!', type: 'error' });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* TOP TAB NAVIGATION */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('WEB')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${activeTab === 'WEB'
            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-teal-600/20'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Radio className="w-4 h-4" />
          <span>Web Notification (Thông báo Web App)</span>
        </button>

        <button
          onClick={() => setActiveTab('EMAIL')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${activeTab === 'EMAIL'
            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-teal-600/20'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Mail className="w-4 h-4" />
          <span>Gmail Notification (Email SMTP)</span>
        </button>
      </div>

      {/* TAB 1: THIẾT LẬP BẢN TIN WEB BROADCAST (UC-65) */}
      {activeTab === 'WEB' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden animate-in fade-in duration-150">
          {/* Banner tiêu đề */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-teal-400 animate-pulse" />
                <h2 className="text-xl font-bold">Thiết lập bản tin Web Broadcast</h2>
              </div>
              <p className="text-sm text-slate-300">
                Phát tin tức thời đến toàn bộ trình duyệt Web đang kết nối qua Socket.IO
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Web App Socket</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Hàng 1: Nhóm đối tượng & Loại thông báo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Nhóm Đối Tượng Nhận Tin
                </label>
                <select
                  value={webForm.targetRole}
                  onChange={(e) => setWebForm({ ...webForm, targetRole: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium text-sm text-slate-800 transition"
                >
                  <option value="ALL">ALL - Tất cả người dùng Web (~ Toàn hệ thống)</option>
                  <option value="CUSTOMER">CUSTOMER - Chỉ Khách hàng thuê bãi</option>
                  <option value="PROVIDER">PROVIDER - Chỉ Chủ bãi đỗ xe</option>
                </select>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Dispatch đồng bộ vào Socket.IO Web Rooms tương ứng
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Loại Thông Báo (Category)
                </label>
                <select
                  value={webForm.category}
                  onChange={(e) => setWebForm({ ...webForm, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium text-sm text-slate-800 transition"
                >
                  <option value="Bảo trì hệ thống (Maintenance)">Bảo trì hệ thống (Maintenance)</option>
                  <option value="Cập nhật chính sách & Điều khoản">Cập nhật chính sách & Điều khoản</option>
                  <option value="Khuyến mãi & Tin tức nền tảng">Khuyến mãi & Tin tức nền tảng</option>
                  <option value="Thông báo chung">Thông báo chung</option>
                </select>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Quyết định Icon & màu sắc nhận diện trên thanh thông báo
                </p>
              </div>
            </div>

            {/* Hàng 2: Mức độ ưu tiên trên Web */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                Mức Độ Ưu Tiên Trên Web (Priority)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Bình thường', 'Quan trọng (Nổi banner trên web)', 'Khẩn cấp (Modal chặn web)'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setWebForm({ ...webForm, priority: p })}
                    className={`py-3 px-3 rounded-xl text-xs font-bold border transition text-center ${webForm.priority === p
                      ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Hàng 3: Tiêu đề */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Tiêu Đề Thông Báo Web (Title) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-slate-400">
                  {webForm.title.length}/120 ký tự
                </span>
              </div>
              <input
                type="text"
                maxLength={120}
                placeholder="VD: Bảo trì nâng cấp hệ thống kết nối web 00:00 - 02:00 ngày 25/11"
                value={webForm.title}
                onChange={(e) => setWebForm({ ...webForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 text-sm font-semibold text-slate-800 transition"
              />
            </div>

            {/* Hàng 4: Nội dung chi tiết */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Nội Dung Chi Tiết Thông Điệp (Payload Content) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-slate-400">
                  {webForm.content.length}/500 ký tự
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                placeholder="Nhập nội dung thông điệp chi tiết gửi tới người dùng..."
                value={webForm.content}
                onChange={(e) => setWebForm({ ...webForm, content: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 text-sm text-slate-800 leading-relaxed transition"
              />
            </div>

            {/* Hàng 5: Cấu hình hiển thị */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap gap-6 items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Cấu hình hiển thị trên giao diện web app:
              </span>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webForm.showToast}
                  onChange={(e) => setWebForm({ ...webForm, showToast: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                Hiển thị Pop-up Toast nổi ở góc màn hình Web
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webForm.saveToDb}
                  onChange={(e) => setWebForm({ ...webForm, saveToDb: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                Lưu PostgreSQL (Lịch sử thông báo Web)
              </label>
            </div>

            {/* Hộp tóm tắt kết quả gửi thành công */}
            {webSummary && (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-900 space-y-1">
                  <p className="font-bold text-sm">Phát sóng Web App hoàn tất!</p>
                  <p>Mã tác vụ (Task ID): <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-teal-200">{webSummary.taskId}</code></p>
                  <p>Tổng số bản ghi gửi/lưu DB: <strong>{webSummary.totalRecipients} người dùng</strong></p>
                  <p className="text-[11px] text-teal-700">Thời gian: {new Date(webSummary.timestamp).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetWebForm}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-600 flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" /> Làm mới form
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={webLoading}
                  onClick={() => handleSendWebBroadcast(true)}
                  className="px-5 py-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 font-bold text-xs text-teal-800 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-teal-600" /> Gửi thử nghiệm vào Web của tôi
                </button>

                <button
                  type="button"
                  disabled={webLoading}
                  onClick={() => handleSendWebBroadcast(false)}
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal-600/25 transition disabled:opacity-50"
                >
                  {webLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Gửi Thông Báo Web Ngay (Send Web Broadcast)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THIẾT LẬP BẢN TIN EMAIL BROADCAST (UC-66) */}
      {activeTab === 'EMAIL' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden animate-in fade-in duration-150">
          {/* Banner tiêu đề */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold">Thiết lập bản tin Email Broadcast</h2>
              </div>
              <p className="text-sm text-slate-300">
                Soạn thảo và gửi email hàng loạt tới hòm thư người dùng qua Email Service API
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>Email Service API</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Hàng 1: Nhóm đối tượng & Loại thư */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Nhóm Đối Tượng Nhận Email
                </label>
                <select
                  value={emailForm.recipientScope}
                  onChange={(e) => setEmailForm({ ...emailForm, recipientScope: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium text-sm text-slate-800 transition"
                >
                  <option value="ALL">ALL - Tất cả người dùng (~ Hòm thư toàn hệ thống)</option>
                  <option value="CUSTOMER">CUSTOMER - Chỉ Khách hàng thuê bãi</option>
                  <option value="PROVIDER">PROVIDER - Chỉ Đối tác Chủ bãi đỗ xe</option>
                </select>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Truy vấn danh sách email hợp lệ từ PostgreSQL Database
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                  Loại Thư (Email Category)
                </label>
                <select
                  value={emailForm.category}
                  onChange={(e) => setEmailForm({ ...emailForm, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 font-medium text-sm text-slate-800 transition"
                >
                  <option value="Bảo trì & Cập nhật kỹ thuật">Bảo trì & Cập nhật kỹ thuật</option>
                  <option value="Thông báo Thay đổi chính sách">Thông báo Thay đổi chính sách</option>
                  <option value="Bản tin ParkLink & Khuyến mãi">Bản tin ParkLink & Khuyến mãi</option>
                </select>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Định danh template và header phân loại gửi thư
                </p>
              </div>
            </div>

            {/* Hàng 2: Tiêu đề email */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Tiêu Đề Email (Subject Line) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-slate-400">
                  {emailForm.subject.length}/120 ký tự
                </span>
              </div>
              <input
                type="text"
                maxLength={120}
                placeholder="VD: [ParkLink] Thông báo cập nhật chính sách và lịch bảo trì hệ thống"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 text-sm font-semibold text-slate-800 transition"
              />
            </div>

            {/* Hàng 3: Nội dung thư (HTML Body Content) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Nội Dung Thư (HTML / Text Body Content) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-slate-400">
                  {emailForm.htmlContent.length}/5,000 ký tự
                </span>
              </div>
              <textarea
                rows={6}
                maxLength={5000}
                placeholder="<p>Kính gửi Quý người dùng và Quý Đối tác ParkLink,</p><p>ParkLink trân trọng thông báo lịch nâng cấp định kỳ hạ tầng cổng thanh toán và quản lý dữ liệu bãi xe...</p>"
                value={emailForm.htmlContent}
                onChange={(e) => setEmailForm({ ...emailForm, htmlContent: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono text-sm text-slate-800 leading-relaxed transition"
              />
              <p className="text-xs text-slate-400 mt-1">
                Hỗ trợ các thẻ định dạng HTML: &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, &lt;br&gt;...
              </p>
            </div>

            {/* Hàng 4: Tuỳ chọn bổ sung */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap gap-6 items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tuỳ chọn bổ sung & Tiêu chuẩn gửi thư:
              </span>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailForm.attachSignature}
                  onChange={(e) => setEmailForm({ ...emailForm, attachSignature: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                Đính kèm chữ ký ParkLink & Hotline 1900
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailForm.canSpamCompliance}
                  onChange={(e) => setEmailForm({ ...emailForm, canSpamCompliance: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                Liên kết bảo vệ quyền riêng tư & CAN-SPAM
              </label>
            </div>

            {/* Hộp tóm tắt kết quả gửi email */}
            {emailSummary && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 space-y-1">
                  <p className="font-bold text-sm">Đã khởi tạo tác vụ gửi Email hàng loạt!</p>
                  <p>Mã Batch (Batch ID): <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">{emailSummary.batchId}</code></p>
                  <p>Số lượng email vào hàng đợi xử lý: <strong>{emailSummary.totalQueued} hòm thư</strong></p>
                  <p className="text-[11px] text-indigo-700">Thời gian tạo: {new Date(emailSummary.timestamp).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetEmailForm}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-600 flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" /> Làm mới form
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={emailLoading}
                  onClick={() => handleSendEmailBroadcast(true)}
                  className="px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 font-bold text-xs text-indigo-800 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Gửi thử nghiệm tới Admin ({user?.email || 'me'})
                </button>

                <button
                  type="button"
                  disabled={emailLoading}
                  onClick={() => handleSendEmailBroadcast(false)}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                >
                  {emailLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Gửi Email Broadcast (Send Email Announcement)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBroadcastPanel;
