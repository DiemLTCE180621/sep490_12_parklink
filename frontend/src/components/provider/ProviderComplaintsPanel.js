import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import complaintService from '../../services/complaintService';
import { useSocket } from '../../context/SocketContext';
import Toast from '../common/Toast';
import ReplyComplaintModal from '../modals/ReplyComplaintModal';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  User,
  Edit3,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  MessageSquareReply
} from 'lucide-react';

const STATUS_BADGE_CONFIG = {
  WAITING_PROVIDER: { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  PENDING: { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  OPEN: { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  PROVIDER_REPLIED: { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: CheckCircle2 },
  PROCESSING: { bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: Loader2, spin: true },
  RESOLVED: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  REJECTED: { bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: ShieldAlert },
  CLOSED: { bg: 'bg-gray-200 text-gray-800 border-gray-300', icon: ShieldAlert }
};

const FILTER_TABS = ['ALL', 'WAITING_PROVIDER', 'RESOLVED'];

const ProviderComplaintsPanel = () => {
  const { t, i18n } = useTranslation('provider');
  const isEnglish = i18n.language?.startsWith('en');
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const fetchComplaints = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await complaintService.getProviderComplaints();
      const list = res.data?.complaints || res.complaints || [];
      setComplaints(list);
    } catch (err) {
      setError(err.message || '__LOAD_ERROR__');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(true);
  }, [fetchComplaints]);

  useEffect(() => {
    if (!socket) return;

    const handleComplaintUpdate = (payload) => {
      if (payload.complaint) {
        setComplaints((prev) => {
          const exists = prev.some((c) => c.id === payload.complaint.id);
          return exists
            ? prev.map((c) => (c.id === payload.complaint.id ? { ...c, ...payload.complaint } : c))
            : [payload.complaint, ...prev];
        });
      } else {
        fetchComplaints(false);
      }
    };

    socket.on('complaint_updated', handleComplaintUpdate);
    return () => socket.off('complaint_updated', handleComplaintUpdate);
  }, [socket, fetchComplaints]);

  const handleOpenReplyModal = useCallback((complaintItem) => {
    setSelectedComplaint(complaintItem);
    setIsReplyModalOpen(true);
  }, []);

  const handleReplySuccess = useCallback((updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c))
    );
    setToast({
      message: t('complaints.toasts.replySuccess', { id: updatedComplaint.id }),
      type: 'success'
    });
  }, [t]);

  const getStatusBadge = useCallback((status, isOverdue = false) => {
    if (status === 'WAITING_PROVIDER' && isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> {t('complaints.overdueFilter')}
        </span>
      );
    }
    const conf = STATUS_BADGE_CONFIG[status] || {
      bg: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock
    };
    const Icon = conf.icon;
    const label = STATUS_BADGE_CONFIG[status] ? t(`complaints.statuses.${status}`) : status;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${conf.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${conf.spin ? 'animate-spin' : ''}`} /> {label}
      </span>
    );
  }, [t]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'WAITING_PROVIDER') {
          if (!['WAITING_PROVIDER', 'PENDING', 'OPEN'].includes(item.status)) return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = item.id?.toString().includes(query);
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesCustomer = item.customer?.full_name?.toLowerCase().includes(query);
        return matchesId || matchesTitle || matchesCustomer;
      }

      return true;
    });
  }, [complaints, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-neighbor-600 mx-auto" />
        <p className="text-gray-600 font-semibold text-sm">{t('complaints.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-8 border border-red-200 shadow-sm text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">{t('complaints.errorTitle')}</h3>
        <p className="text-sm text-gray-600">{error === '__LOAD_ERROR__' ? t('complaints.loadError') : error}</p>
        <button
          onClick={() => fetchComplaints(true)}
          className="px-5 py-2.5 bg-neighbor-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-neighbor-700 transition"
        >
          {t('complaints.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <ReplyComplaintModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        complaint={selectedComplaint}
        onSuccess={handleReplySuccess}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neighbor-50 text-neighbor-600 ring-1 ring-neighbor-100 shadow-sm">
              <MessageSquareReply className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 sm:text-lg">{t('complaints.title')}</h3>
              <p className="text-xs text-gray-500">{t('complaints.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchComplaints(true)}
              className="p-2 text-gray-500 hover:text-neighbor-600 hover:bg-neighbor-50 rounded-xl transition"
              title={t('complaints.refreshTitle')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 shadow-sm">
              {t('complaints.totalLabel')} <span className="ml-1 text-neighbor-700">{complaints.length}</span>
            </span>
          </div>
        </div>

        {}
        <div className="p-4 sm:px-6 border-b border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('complaints.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-neighbor-500/20 focus:border-neighbor-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            {FILTER_TABS.map((tabId) => (
              <button
                key={tabId}
                onClick={() => setStatusFilter(tabId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  statusFilter === tabId
                    ? 'bg-neighbor-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {t(`complaints.tabs.${tabId}`)}
              </button>
            ))}
          </div>
        </div>

        {}
        {filteredComplaints.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 scale-150 rounded-full bg-gray-100"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm">
                <Inbox className="h-7 w-7" />
              </div>
            </div>
            <h3 className="text-base font-extrabold text-gray-800 sm:text-lg">
              {complaints.length === 0 ? t('complaints.empty.noComplaints') : t('complaints.empty.noResults')}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {complaints.length === 0
                ? t('complaints.empty.noComplaintsSub')
                : t('complaints.empty.noResultsSub')}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-4 bg-gray-50/50">
            {filteredComplaints.map((item) => {
              const adminInstructions = Array.isArray(item.response_history)
                ? item.response_history.filter((h) => h.sender_role === 'ADMIN' || h.action === 'FORWARDED_TO_PROVIDER')
                : [];
              const latestAdminInstruction = adminInstructions.length > 0 ? adminInstructions[adminInstructions.length - 1] : null;

              
              const otherReplies = Array.isArray(item.response_history)
                ? item.response_history.filter((h) => h !== latestAdminInstruction && h.action !== 'FORWARDED_TO_PROVIDER')
                : [];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-5 border border-gray-200/90 shadow-sm hover:shadow-md transition flex flex-col gap-3.5"
                >
                  {}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-xs border border-gray-200">
                        #{item.id}
                      </span>
                      <h4 className="text-base sm:text-lg font-extrabold text-gray-900">{item.title}</h4>
                      <span className="text-gray-300">•</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {t('complaints.card.submittedAt', { date: new Date(item.created_at).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN') })}
                      </span>
                    </div>
                    <div>{getStatusBadge(item.status, item.is_overdue)}</div>
                  </div>

                  {}
                  {latestAdminInstruction && (
                    <div className={`p-4 rounded-xl border space-y-1.5 ${
                      item.is_overdue
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className={`flex items-center gap-2 font-bold text-xs ${item.is_overdue ? 'text-rose-800' : 'text-slate-700'}`}>
                          <ShieldAlert className={`w-4 h-4 ${item.is_overdue ? 'text-rose-500' : 'text-neighbor-600'}`} />
                          <span>{t('complaints.card.adminInstruction')}</span>
                        </div>
                        {item.deadline && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.is_overdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}>
                            {item.is_overdue ? t('complaints.card.overdue3Days') : t('complaints.card.deadline', { date: new Date(item.deadline).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN') })}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-medium ${
                        item.is_overdue ? 'text-rose-800' : 'text-slate-700'
                      }`}>
                        {latestAdminInstruction.message || latestAdminInstruction.note}
                      </p>
                      {latestAdminInstruction.created_at && (
                        <span className={`text-[11px] block ${item.is_overdue ? 'text-rose-600' : 'text-slate-500'}`}>
                          {t('complaints.card.forwardedAt', { datetime: new Date(latestAdminInstruction.created_at).toLocaleString(isEnglish ? 'en-GB' : 'vi-VN') })}
                        </span>
                      )}
                    </div>
                  )}

                  {}
                  <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-gray-900 shrink-0">{t('complaints.card.contentLabel')}</span>
                      <p className="text-gray-800 whitespace-pre-wrap flex-1 leading-relaxed">{item.description}</p>
                    </div>
                    {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-2">
                        {item.image_urls.map((url, index) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="relative block w-20 h-20 rounded-xl overflow-hidden border border-gray-200 hover:ring-2 hover:ring-neighbor-600 transition group"
                          >
                            <img
                              src={url}
                              alt={t('complaints.card.imageAlt', { index: index + 1 })}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {}
                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <User className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <span className="text-gray-400 font-medium">{t('complaints.card.customerLabel')}</span>{' '}
                        <strong className="text-gray-900 text-sm">{item.customer?.full_name || t('reviews.item.defaultCustomer')}</strong>
                        {(item.customer?.phone_number || item.customer?.email) && (
                          <span className="text-gray-500 ml-2 font-mono">
                            ({item.customer?.phone_number || item.customer?.email})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {}
                  {otherReplies.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                        {t('complaints.card.sentResponses')}
                      </span>
                      <div className="space-y-2">
                        {otherReplies.map((hist, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl text-xs space-y-1 bg-neighbor-50 border border-neighbor-200 text-neighbor-900"
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{hist.sender_name || t('complaints.card.defaultSender')}</span>
                              <span className="text-gray-400 font-normal">
                                {hist.created_at ? new Date(hist.created_at).toLocaleString(isEnglish ? 'en-GB' : 'vi-VN') : ''}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {hist.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {}
                  <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {item.is_overdue && (
                      <div className="flex items-center gap-2 text-xs text-rose-900 bg-rose-50/90 px-3.5 py-2.5 rounded-xl border border-rose-300 flex-1">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-medium flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 inline" />
                          <span>
                            {t('complaints.card.overdueActionWarning')}
                          </span>
                        </span>
                      </div>
                    )}

                    {!['RESOLVED', 'REJECTED', 'CLOSED'].includes(item.status) && (
                      <button
                        onClick={() => handleOpenReplyModal(item)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition shrink-0 ml-auto"
                      >
                        {item.status === 'PROVIDER_REPLIED' ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            {t('complaints.actions.updateReply')}
                          </>
                        ) : (
                          <>
                            <MessageSquareReply className="w-3.5 h-3.5" />
                            {t('complaints.actions.submitReply')}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderComplaintsPanel;
