import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Radio,
  Mail,
  Send,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import {
  broadcastPushNotification,
  broadcastEmailNotification
} from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import Toast from '../common/Toast';


const AdminBroadcastPanel = () => {
  const { t, i18n } = useTranslation('admin');
  const dateLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN';
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('WEB'); 

  
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

  
  const [emailForm, setEmailForm] = useState({
    recipientScope: 'ALL',
    category: 'Bảo trì & Cập nhật kỹ thuật',
    subject: '',
    htmlContent: '',
    testEmail: user?.email || '',
    attachSignature: true,
    canSpamCompliance: true
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSummary, setEmailSummary] = useState(null);

  
  const [toast, setToast] = useState(null);

  
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
      setToast({ message: t('broadcast.ui.webTitleRequired'), type: 'error' });
      return;
    }
    if (!webForm.content.trim()) {
      setToast({ message: t('broadcast.ui.webContentRequired'), type: 'error' });
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
          ? t('broadcast.ui.webTestSuccess')
          : t('broadcast.ui.webSuccess', { count: data?.totalRecipients || 0 }),
        type: 'success'
      });
    } catch (err) {
      console.error('Lỗi gửi thông báo Web:', err);
      setToast({ message: t('broadcast.ui.webError'), type: 'error' });
    } finally {
      setWebLoading(false);
    }
  };

  const handleResetEmailForm = () => {
    setEmailForm({
      recipientScope: 'ALL',
      category: 'Bảo trì & Cập nhật kỹ thuật',
      subject: '',
      htmlContent: '',
      testEmail: user?.email || '',
      attachSignature: true,
      canSpamCompliance: true
    });
    setEmailSummary(null);
  };

  const handleSendEmailBroadcast = async (isTestSelf = false) => {
    if (!emailForm.subject.trim()) {
      setToast({ message: t('broadcast.ui.emailSubjectRequired'), type: 'error' });
      return;
    }
    if (!emailForm.htmlContent.trim()) {
      setToast({ message: t('broadcast.ui.emailContentRequired'), type: 'error' });
      return;
    }
    if (isTestSelf && emailForm.testEmail && !emailForm.testEmail.includes('@')) {
      setToast({ message: t('broadcast.ui.invalidTestEmail'), type: 'error' });
      return;
    }

    try {
      setEmailLoading(true);
      const payload = {
        subject: isTestSelf ? `[TEST ADMIN] ${emailForm.subject}` : emailForm.subject,
        htmlContent: emailForm.htmlContent,
        recipientScope: isTestSelf ? 'ADMIN' : emailForm.recipientScope,
        emailCategory: emailForm.category,
        testEmail: emailForm.testEmail?.trim()
      };

      const res = await broadcastEmailNotification(payload);
      const data = res?.data || res;
      setEmailSummary(data);
      const destinationEmail = isTestSelf ? (emailForm.testEmail?.trim() || user?.email) : null;
      setToast({
        message: isTestSelf
          ? t('broadcast.ui.emailTestSuccess', { email: destinationEmail })
          : t('broadcast.ui.emailSuccess', { count: data?.totalQueued || 0 }),
        type: 'success'
      });
    } catch (err) {
      console.error('Lỗi gửi email thông báo:', err);
      setToast({ message: t('broadcast.ui.emailError'), type: 'error' });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('WEB')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${activeTab === 'WEB'
            ? 'bg-gradient-to-r from-neighbor-600 to-neighbor-700 text-white shadow-neighbor-600/20'
            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
        >
          <Radio className="w-4 h-4" />
          <span>{t('broadcast.ui.webTab')}</span>
        </button>

        <button
          onClick={() => setActiveTab('EMAIL')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${activeTab === 'EMAIL'
            ? 'bg-gradient-to-r from-neighbor-600 to-neighbor-700 text-white shadow-neighbor-600/20'
            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
        >
          <Mail className="w-4 h-4" />
          <span>{t('broadcast.ui.emailTab')}</span>
        </button>
      </div>
      {}

      {activeTab === 'WEB' && (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xl overflow-hidden animate-in fade-in duration-150">
          <div className="p-6 bg-gradient-to-r from-neighbor-900 via-neighbor-800 to-neighbor-900 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neighbor-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-neighbor-400 animate-pulse" />
                <h2 className="text-xl font-bold">{t('broadcast.ui.webTitle')}</h2>
              </div>
              <p className="text-sm text-gray-300">
                {t('broadcast.ui.webSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{t('broadcast.ui.online')}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
                  {t('broadcast.ui.recipient')}
                </label>
                <select
                  value={webForm.targetRole}
                  onChange={(e) => setWebForm({ ...webForm, targetRole: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-neighbor-500 font-medium text-sm text-gray-800 transition"
                >
                  <option value="ALL">{t('broadcast.ui.allUsers')}</option>
                  <option value="CUSTOMER">{t('broadcast.ui.customers')}</option>
                  <option value="PROVIDER">{t('broadcast.ui.providers')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
                  {t('broadcast.ui.category')}
                </label>
                <select
                  value={webForm.category}
                  onChange={(e) => setWebForm({ ...webForm, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-neighbor-500 font-medium text-sm text-gray-800 transition"
                >
                  <option value="Bảo trì hệ thống (Maintenance)">{t('broadcast.ui.maintenance')}</option>
                  <option value="Cập nhật chính sách & Điều khoản">{t('broadcast.ui.policyUpdate')}</option>
                  <option value="Khuyến mãi & Tin tức nền tảng">{t('broadcast.ui.promotion')}</option>
                  <option value="Thông báo chung">{t('broadcast.ui.general')}</option>
                </select>
              </div>
            </div>

            {}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
                {t('broadcast.ui.priority')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'Bình thường', label: t('broadcast.ui.normal') },
                  { value: 'Quan trọng (Nổi banner trên web)', label: t('broadcast.ui.important') },
                  { value: 'Khẩn cấp (Modal chặn web)', label: t('broadcast.ui.urgent') }
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setWebForm({ ...webForm, priority: p.value })}
                    className={`py-3 px-3 rounded-xl text-xs font-bold border transition text-center ${webForm.priority === p.value
                      ? 'border-neighbor-600 bg-neighbor-50 text-neighbor-800 ring-2 ring-neighbor-600/20'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                  {t('broadcast.ui.notificationTitle')} <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-gray-400">
                  {t('broadcast.ui.characterCount', { count: webForm.title.length, max: 120 })}
                </span>
              </div>
              <input
                type="text"
                maxLength={120}
                placeholder={t('broadcast.ui.webTitlePlaceholder')}
                value={webForm.title}
                onChange={(e) => setWebForm({ ...webForm, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-neighbor-500 text-sm font-semibold text-gray-800 transition"
              />
            </div>

            {}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                  {t('broadcast.ui.notificationContent')} <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-gray-400">
                  {t('broadcast.ui.characterCount', { count: webForm.content.length, max: 500 })}
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                placeholder={t('broadcast.ui.webContentPlaceholder')}
                value={webForm.content}
                onChange={(e) => setWebForm({ ...webForm, content: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-neighbor-500 text-sm text-gray-800 leading-relaxed transition"
              />
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-wrap gap-6 items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('broadcast.ui.displayOptions')}
              </span>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webForm.showToast}
                  onChange={(e) => setWebForm({ ...webForm, showToast: e.target.checked })}
                  className="rounded text-neighbor-600 focus:ring-neighbor-500 w-4 h-4"
                />
                {t('broadcast.ui.showToast')}
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={webForm.saveToDb}
                  onChange={(e) => setWebForm({ ...webForm, saveToDb: e.target.checked })}
                  className="rounded text-neighbor-600 focus:ring-neighbor-500 w-4 h-4"
                />
                {t('broadcast.ui.saveHistory')}
              </label>
            </div>

            {webSummary && (
              <div className="p-4 rounded-xl bg-neighbor-50 border border-neighbor-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-neighbor-600 shrink-0 mt-0.5" />
                <div className="text-xs text-neighbor-900 space-y-1">
                  <p className="font-bold text-sm">{t('broadcast.ui.webSent')}</p>
                  <p>{t('broadcast.ui.taskId')} <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-neighbor-200">{webSummary.taskId}</code></p>
                  <p>{t('broadcast.ui.recipientsCount', { count: webSummary.totalRecipients })}</p>
                  <p className="text-[11px] text-neighbor-700">{t('broadcast.ui.time')} {new Date(webSummary.timestamp).toLocaleString(dateLocale)}</p>
                </div>
              </div>
            )}

            {}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleResetWebForm}
                className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 font-bold text-xs text-gray-600 flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" /> {t('broadcast.ui.refresh')}
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={webLoading}
                  onClick={() => handleSendWebBroadcast(true)}
                  className="px-5 py-2.5 rounded-xl border border-neighbor-200 bg-neighbor-50 hover:bg-neighbor-100 font-bold text-xs text-neighbor-800 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-neighbor-600" /> {t('broadcast.ui.sendTestSelf')}
                </button>

                <button
                  type="button"
                  disabled={webLoading}
                  onClick={() => handleSendWebBroadcast(false)}
                  className="px-6 py-3 rounded-xl bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-neighbor-600/25 transition disabled:opacity-50"
                >
                  {webLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {t('broadcast.ui.sendNotification')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {}

      {activeTab === 'EMAIL' && (
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xl overflow-hidden animate-in fade-in duration-150">
          {}
          <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-indigo-950 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold">{t('broadcast.ui.emailTitle')}</h2>
              </div>
              <p className="text-sm text-gray-300">
                {t('broadcast.ui.emailSubtitle')}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>{t('broadcast.ui.emailService')}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
                  {t('broadcast.ui.emailRecipient')}
                </label>
                <select
                  value={emailForm.recipientScope}
                  onChange={(e) => setEmailForm({ ...emailForm, recipientScope: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-neighbor-500 font-medium text-sm text-gray-800 transition"
                >
                  <option value="ALL">{t('broadcast.ui.allUsers')}</option>
                  <option value="CUSTOMER">{t('broadcast.ui.customers')}</option>
                  <option value="PROVIDER">{t('broadcast.ui.providers')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
                  {t('broadcast.ui.category')}
                </label>
                <select
                  value={emailForm.category}
                  onChange={(e) => setEmailForm({ ...emailForm, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-neighbor-500 font-medium text-sm text-gray-800 transition"
                >
                  <option value="Bảo trì & Cập nhật kỹ thuật">{t('broadcast.ui.emailMaintenance')}</option>
                  <option value="Thông báo Thay đổi chính sách">{t('broadcast.ui.emailPolicy')}</option>
                  <option value="Bản tin ParkLink & Khuyến mãi">{t('broadcast.ui.emailNews')}</option>
                </select>
              </div>
            </div>

            {}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                  {t('broadcast.ui.emailSubject')} <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-gray-400">
                  {t('broadcast.ui.characterCount', { count: emailForm.subject.length, max: 120 })}
                </span>
              </div>
              <input
                type="text"
                maxLength={120}
                placeholder={t('broadcast.ui.emailSubjectPlaceholder')}
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-neighbor-500 text-sm font-semibold text-gray-800 transition"
              />
            </div>

            {}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                  {t('broadcast.ui.emailContent')} <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-semibold text-gray-400">
                  {t('broadcast.ui.characterCount', { count: emailForm.htmlContent.length, max: 5000 })}
                </span>
              </div>
              <textarea
                rows={6}
                maxLength={5000}
                placeholder={t('broadcast.ui.emailContentPlaceholder')}
                value={emailForm.htmlContent}
                onChange={(e) => setEmailForm({ ...emailForm, htmlContent: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-neighbor-500 font-mono text-sm text-gray-800 leading-relaxed transition"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t('broadcast.ui.htmlHint')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-wrap gap-6 items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t('broadcast.ui.extraOptions')}
              </span>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailForm.attachSignature}
                  onChange={(e) => setEmailForm({ ...emailForm, attachSignature: e.target.checked })}
                  className="rounded text-neighbor-600 focus:ring-neighbor-500 w-4 h-4"
                />
                {t('broadcast.ui.signature')}
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailForm.canSpamCompliance}
                  onChange={(e) => setEmailForm({ ...emailForm, canSpamCompliance: e.target.checked })}
                  className="rounded text-neighbor-600 focus:ring-neighbor-500 w-4 h-4"
                />
                {t('broadcast.ui.privacy')}
              </label>
            </div>

            {emailSummary && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 space-y-1">
                  <p className="font-bold text-sm">{t('broadcast.ui.emailQueued')}</p>
                  <p>{t('broadcast.ui.taskId')} <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">{emailSummary.batchId}</code></p>
                  <p>{t('broadcast.ui.queuedEmails', { count: emailSummary.totalQueued })}</p>
                  <p className="text-[11px] text-indigo-700">{t('broadcast.ui.createdAt')} {new Date(emailSummary.timestamp).toLocaleString(dateLocale)}</p>
                </div>
              </div>
            )}

            {}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleResetEmailForm}
                className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 font-bold text-xs text-gray-600 flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" /> {t('broadcast.ui.refresh')}
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder={t('broadcast.ui.testEmailPlaceholder')}
                    value={emailForm.testEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, testEmail: e.target.value })}
                    className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/40 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-xs text-gray-800 transition w-56 sm:w-64"
                  />
                  <button
                    type="button"
                    disabled={emailLoading}
                    onClick={() => handleSendEmailBroadcast(true)}
                    className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 font-bold text-xs text-indigo-800 flex items-center gap-2 transition disabled:opacity-50 whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" /> {t('broadcast.ui.sendEmailTest')}
                  </button>
                </div>

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
                  {t('broadcast.ui.sendEmail')}
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
