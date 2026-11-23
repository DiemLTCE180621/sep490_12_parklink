import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import complaintService from '../../services/complaintService';
import { useSocket } from '../../context/SocketContext';
import Toast from '../common/Toast';
import UpdateComplaintStatusModal from '../modals/UpdateComplaintStatusModal';
import ForwardComplaintModal from '../modals/ForwardComplaintModal';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  User,
  Building2,
  Search,
  RefreshCw,
  Filter,
  MessageSquareReply,
  Share2,
  XCircle
} from 'lucide-react';

const STATUS_BADGE_CONFIG = {
  PENDING_ADMIN: { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  PENDING: { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  OPEN: { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  WAITING_PROVIDER: { bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
  PROVIDER_REPLIED: { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: MessageSquareReply },
  PROCESSING: { bg: 'bg-sky-100 text-sky-800 border-sky-300', icon: Loader2, spin: true },
  ESCALATED: { bg: 'bg-purple-100 text-purple-800 border-purple-300', icon: ShieldAlert },
  RESOLVED: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  REJECTED: { bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: XCircle },
  CLOSED: { bg: 'bg-gray-200 text-gray-800 border-gray-300', icon: CheckCircle2 }
};

const FILTER_TABS = [
  { id: 'ALL' },
  { id: 'PENDING_ADMIN' },
  { id: 'WAITING_PROVIDER' },
  { id: 'PROVIDER_REPLIED' },
  { id: 'RESOLVED' },
  { id: 'REJECTED' }
];

const AdminComplaintsPanel = () => {
  const { t, i18n } = useTranslation('admin');
  const dateLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN';
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

  
  const handleOpenForwardModal = useCallback((complaintItem) => {
    setSelectedComplaint(complaintItem);
    setIsForwardModalOpen(true);
  }, []);

  const handleForwardSuccess = useCallback((updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c))
    );
    setToast({
      message: t('complaints.toast.forwardSuccess', { id: updatedComplaint.id }),
      type: 'success'
    });
  }, [t]);

  
  const handleOpenStatusModal = useCallback((complaintItem) => {
    setSelectedComplaint(complaintItem);
    setIsStatusModalOpen(true);
  }, []);

  const handleStatusSuccess = useCallback((updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c))
    );
    setToast({
      message: t('complaints.toast.statusSuccess', {
        id: updatedComplaint.id,
        status: t(`complaints.statuses.${updatedComplaint.status}`, { defaultValue: updatedComplaint.status })
      }),
      type: 'success'
    });
  }, [t]);

  const fetchComplaints = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await complaintService.getAllComplaints();
      const list = res.data?.complaints || res.complaints || [];
      setComplaints(list);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError(t('complaints.errors.load'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [t]);

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

  
  const getStatusBadge = useCallback((status, isOverdue = false) => {
    if (status === 'WAITING_PROVIDER' && isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> {t('complaints.statuses.overdue')}
        </span>
      );
    }
    const conf = STATUS_BADGE_CONFIG[status] || {
      bg: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock
    };
    const Icon = conf.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${conf.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${conf.spin ? 'animate-spin' : ''}`} /> {t(`complaints.statuses.${status}`, { defaultValue: status })}
      </span>
    );
  }, [t]);

  
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING_ADMIN') {
          if (!['PENDING_ADMIN', 'PENDING', 'OPEN'].includes(item.status)) return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = item.id?.toString().includes(query);
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesCustomer = item.customer?.full_name?.toLowerCase().includes(query);
        const matchesFacility = item.facility?.name?.toLowerCase().includes(query);
        return matchesId || matchesTitle || matchesCustomer || matchesFacility;
      }

      return true;
    });
  }, [complaints, statusFilter, searchTerm]);

  
  const renderStatusInfo = (item) => {
    if (['PENDING_ADMIN', 'PENDING', 'OPEN'].includes(item.status)) return null;

    if (item.status === 'WAITING_PROVIDER') {
      if (item.is_overdue) {
        return (
          <div className="flex items-center gap-2.5 text-xs text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-300 flex-1">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-rose-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                {t('complaints.statusInfo.overdueTitle')}
              </span>
              <p className="text-rose-900 leading-relaxed">
                {t('complaints.statusInfo.overdueDescription', {
                  date: item.deadline
                    ? new Date(item.deadline).toLocaleDateString(dateLocale)
                    : t('complaints.statusInfo.overdueFallback')
                })}
              </p>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 text-xs text-blue-900 bg-blue-50 p-3 rounded-xl border border-blue-200 flex-1">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-blue-950">{t('complaints.statuses.WAITING_PROVIDER')}:</span>
            <p className="text-blue-900">
              {t('complaints.statusInfo.waitingDescription', {
                deadline: item.deadline
                  ? t('complaints.statusInfo.deadlineBefore', { date: new Date(item.deadline).toLocaleDateString(dateLocale) })
                  : t('complaints.statusInfo.deadlineDefault')
              })}
            </p>
          </div>
        </div>
      );
    }

    if (item.status === 'PROVIDER_REPLIED') {
      return (
        <div className="flex items-center gap-2 text-xs text-indigo-900 bg-indigo-50 p-3 rounded-xl border border-indigo-200 flex-1">
          <MessageSquareReply className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-indigo-950">{t('complaints.statuses.PROVIDER_REPLIED')}:</span>
            <p className="text-indigo-900">
              {t('complaints.statusInfo.providerRepliedDescription')}
            </p>
          </div>
        </div>
      );
    }

    if (item.status === 'RESOLVED') return null;

    const responseText = item.latest_reply || item.admin_response;
    if (item.status === 'REJECTED' || item.admin_response) {
      const isRejected = item.status === 'REJECTED';
      const label = isRejected
        ? `${t('complaints.statuses.REJECTED')}:`
        : t('complaints.statusInfo.latestReplyTitle');
      const Icon = isRejected ? XCircle : CheckCircle2;
      const theme = isRejected
        ? { box: 'text-rose-800 bg-rose-50/60 border-rose-100', icon: 'text-rose-600', text: 'text-rose-950' }
        : { box: 'text-neighbor-800 bg-neighbor-50/60 border-neighbor-100', icon: 'text-neighbor-600', text: 'text-neighbor-900' };

      return (
        <div className={`flex items-start gap-2 text-xs flex-1 p-3 rounded-xl border ${theme.box}`}>
          <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${theme.icon}`} />
          <div className="space-y-1 flex-1">
            <span className={`font-extrabold ${theme.text}`}>{label}</span>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{responseText}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex-1">
        <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span className="font-medium">{t('complaints.statuses.PROCESSING')}</span>
      </div>
    );
  };

  
  const renderActionButtons = (item) => {
    const isPending = ['PENDING_ADMIN', 'PENDING', 'OPEN'].includes(item.status);

    if (isPending) {
      return (
        <>
          <button
            onClick={() => handleOpenForwardModal(item)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
            title={t('complaints.actions.forwardTitle')}
          >
            <Share2 className="w-3.5 h-3.5" />
            {t('complaints.actions.forward')}
          </button>
          <button
            onClick={() => handleOpenStatusModal(item)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
            title={t('complaints.actions.rejectTitle')}
          >
            <XCircle className="w-3.5 h-3.5" />
            {t('complaints.actions.reject')}
          </button>
        </>
      );
    }

    if (item.status === 'PROVIDER_REPLIED') {
      return (
        <button
          onClick={() => handleOpenStatusModal(item)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
          title={t('complaints.actions.verdictTitle')}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {t('complaints.actions.verdict')}
        </button>
      );
    }

    if (item.status === 'WAITING_PROVIDER') {
      return (
        <button
          onClick={() => handleOpenStatusModal(item)}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition ${
            item.is_overdue ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-800 hover:bg-gray-900'
          }`}
          title={item.is_overdue ? t('complaints.actions.overdueVerdictTitle') : t('complaints.actions.updateStatusTitle')}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {item.is_overdue ? t('complaints.actions.overdueVerdict') : t('complaints.actions.updateStatus')}
        </button>
      );
    }

    const statusMap = {
      RESOLVED: { text: t('complaints.statuses.RESOLVED'), style: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      REJECTED: { text: t('complaints.statuses.REJECTED'), style: 'text-rose-700 bg-rose-50 border-rose-200' },
      CLOSED: { text: t('complaints.statuses.CLOSED'), style: 'text-gray-700 bg-gray-100 border-gray-300' }
    };
    const currentStatus = statusMap[item.status];

    return (
      <div className="flex items-center gap-2">
        {currentStatus && (
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${currentStatus.style}`}>
            {currentStatus.text}
          </span>
        )}
        <button
          onClick={() => handleOpenStatusModal(item)}
          className="text-xs font-bold text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-2.5 py-1.5 rounded-xl border border-gray-200 transition"
          title={t('complaints.actions.changeStatusTitle')}
        >
          {t('complaints.actions.changeStatus')}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-neighbor-600 mx-auto" />
        <p className="text-gray-600 font-semibold text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-8 border border-red-200 shadow-sm text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900">{t('complaints.errors.loadTitle')}</h3>
        <p className="text-sm text-gray-600">{error}</p>
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
      {}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {}
      <UpdateComplaintStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        complaint={selectedComplaint}
        onSuccess={handleStatusSuccess}
      />

      {}
      <ForwardComplaintModal
        isOpen={isForwardModalOpen}
        onClose={() => setIsForwardModalOpen(false)}
        complaint={selectedComplaint}
        onSuccess={handleForwardSuccess}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100 shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 sm:text-lg">{t('complaints.title')}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchComplaints(true)}
              className="p-2 text-gray-500 hover:text-neighbor-600 hover:bg-neighbor-50 rounded-xl transition"
              title={t('common.refresh')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 shadow-sm">
              {t('complaints.totalCount', { count: complaints.length })}
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
            {FILTER_TABS.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  statusFilter === btn.id
                    ? 'bg-neighbor-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {btn.id === 'ALL' ? t('common.all') : t(`complaints.statuses.${btn.id}`)}
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
              {complaints.length === 0 ? t('complaints.empty.title') : t('complaints.empty.noMatchTitle')}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {complaints.length === 0
                ? t('complaints.empty.description')
                : t('complaints.empty.noMatchDescription')}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-4 bg-gray-50/50">
            {filteredComplaints.map((item) => (
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
                      {t('complaints.card.submittedAt')} {new Date(item.created_at).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                  <div>{getStatusBadge(item.status, item.is_overdue)}</div>
                </div>

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
                <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5 text-gray-600">
                    <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="block text-gray-400 font-medium">{t('complaints.card.customerLabel')}</span>
                      <p className="font-bold text-gray-900 text-sm leading-snug">{item.customer?.full_name || t('roles.customer')}</p>
                      {(item.customer?.phone_number || item.customer?.email) && (
                        <p className="text-gray-500 text-xs">
                          {item.customer?.phone_number || item.customer?.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-gray-600">
                    <Building2 className="w-4 h-4 text-neighbor-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="block text-gray-400 font-medium">{t('complaints.card.facilityLabel')}</span>
                      <p className="font-bold text-gray-900 text-sm leading-snug">{item.facility?.name}</p>
                      {item.facility?.provider?.full_name && (
                        <p className="text-gray-500 text-xs">
                          {t('complaints.card.providerLabel')} <span className="font-semibold text-gray-700">{item.facility.provider.full_name}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {}
                {Array.isArray(item.response_history) && item.response_history.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      {t('complaints.history.title')}
                    </span>
                    <div className="space-y-2">
                      {item.response_history.map((hist, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl text-xs space-y-1 ${
                            hist.action === 'ESCALATED'
                              ? 'bg-purple-50 border border-purple-200 text-purple-900'
                              : hist.sender_role === 'ADMIN'
                              ? 'bg-neighbor-50 border border-neighbor-200 text-neighbor-900'
                              : 'bg-gray-50 border border-gray-200 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{hist.sender_name || t(hist.sender_role === 'ADMIN' ? 'roles.admin' : hist.sender_role === 'CUSTOMER' ? 'roles.customer' : 'roles.provider')}</span>
                            <span className="text-gray-400 font-normal">
                              {hist.created_at ? new Date(hist.created_at).toLocaleString(dateLocale) : ''}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {hist.action === 'ESCALATED'
                              ? t('complaints.history.escalated', { reason: hist.reason })
                              : hist.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {}
                <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {renderStatusInfo(item)}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap ml-auto">
                    {renderActionButtons(item)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaintsPanel;
