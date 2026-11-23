import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import complaintService from '../../services/complaintService';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import Toast from '../../components/common/Toast';
import {
  AlertCircle,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Inbox,
  MessageSquare
} from 'lucide-react';

const CustomerComplaintsPage = () => {
  const { t, i18n } = useTranslation('customer');
  const tRef = useRef(t);
  tRef.current = t;
  const dateLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN';
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchComplaints = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const res = await complaintService.getMyComplaints();
      const list = res.data?.complaints || res.complaints || [];
      setComplaints(list);
    } catch (err) {
      setError(err.message || tRef.current('complaints.loadError'));
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
      console.log('[Customer Socket] Cập nhật khiếu nại:', payload);
      if (payload.complaint) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === payload.complaint.id ? { ...c, ...payload.complaint } : c))
        );
      } else {
        fetchComplaints(false);
      }
    };

    socket.on('complaint_updated', handleComplaintUpdate);

    return () => {
      socket.off('complaint_updated', handleComplaintUpdate);
    };
  }, [socket, fetchComplaints]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_ADMIN':
      case 'PENDING':
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> {t('complaints.statuses.pending')}
          </span>
        );
      case 'WAITING_PROVIDER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5" /> {t('complaints.statuses.waitingProvider')}
          </span>
        );
      case 'PROVIDER_REPLIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <MessageSquare className="w-3.5 h-3.5" /> {t('complaints.statuses.providerResponded')}
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('complaints.statuses.underReview')}
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('complaints.statuses.resolved')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" /> {t('complaints.statuses.rejected')}
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gray-200 text-gray-800 border border-gray-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('complaints.statuses.closed')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t('complaints.backToDashboard')}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('complaints.title')}</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {t('complaints.subtitle')}
            </p>
          </div>
        </div>

        {loading ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-neighbor-600 mx-auto" />
              <p className="text-gray-600 font-semibold text-sm">{t('complaints.loading')}</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl p-8 border border-red-200 shadow-sm text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-bold text-gray-900">{t('complaints.errorTitle')}</h3>
              <p className="text-sm text-gray-600">{error}</p>
              <button
                onClick={() => fetchComplaints(true)}
                className="px-5 py-2.5 bg-neighbor-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-neighbor-700 transition"
              >
                {t('complaints.retry')}
              </button>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{t('complaints.emptyTitle')}</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {t('complaints.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-extrabold text-gray-900">{item.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">#{item.id}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {t('complaints.submittedDate')} {new Date(item.created_at).toLocaleDateString(dateLocale)}
                        </span>
                      </div>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>

                  <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="font-bold block mb-1 text-gray-900">{t('complaints.contentLabel')}</span>
                    <p className="whitespace-pre-wrap leading-relaxed">{item.description}</p>
                    {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {item.image_urls.map((url, index) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white"
                          >
                            <img src={url} alt={t('complaints.evidenceAlt', { index: index + 1 })} className="h-full w-full object-cover hover:opacity-90" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {item.facility && (
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                      <Building2 className="w-4 h-4 text-neighbor-600" /> {t('complaints.relatedFacility')} <span className="font-bold text-gray-900">{item.facility.name}</span>
                    </div>
                  )}

                  {(() => {
                    const providerReplies = Array.isArray(item.response_history)
                      ? item.response_history.filter((h) => h.sender_role === 'PROVIDER' || h.action === 'PROVIDER_REPLY')
                      : [];

                    if (providerReplies.length === 0) return null;

                    return (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-bold text-neighbor-800 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-neighbor-600" />
                          {t('complaints.providerRepliesTitle')}
                        </span>
                        <div className="space-y-2">
                          {providerReplies.map((reply, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl text-xs space-y-1.5 bg-neighbor-50 border border-neighbor-200 text-neighbor-950"
                            >
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-neighbor-900">{reply.sender_name || t('complaints.providerFallbackName')}</span>
                                <span className="text-gray-400 font-normal">
                                  {reply.created_at ? new Date(reply.created_at).toLocaleString(dateLocale) : ''}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed text-gray-800 text-xs sm:text-sm">
                                {reply.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {item.status === 'PENDING_ADMIN' || item.status === 'PENDING' || item.status === 'OPEN' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 px-3.5 py-2.5 rounded-xl border border-amber-200 w-full">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{t('complaints.progress.pending')}</span>
                      </div>
                    ) : item.status === 'WAITING_PROVIDER' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-800 bg-blue-50 px-3.5 py-2.5 rounded-xl border border-blue-200 w-full">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          {t('complaints.progress.waitingProvider', { deadline: item.deadline ? t('complaints.progress.waitingProviderDeadline', { date: new Date(item.deadline).toLocaleDateString(dateLocale) }) : t('complaints.progress.waitingProviderDefault') })}
                        </span>
                      </div>
                    ) : item.status === 'PROVIDER_REPLIED' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-neighbor-800 bg-neighbor-50 px-3.5 py-2.5 rounded-xl border border-neighbor-200 w-full">
                        <CheckCircle2 className="w-4 h-4 text-neighbor-600 shrink-0" />
                        <span>{t('complaints.progress.providerResponded')}</span>
                      </div>
                    ) : item.status === 'RESOLVED' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200 w-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{t('complaints.progress.resolved')}</span>
                      </div>
                    ) : item.status === 'REJECTED' ? (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-rose-800 bg-rose-50 px-3.5 py-2.5 rounded-xl border border-rose-200 w-full">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{t('complaints.progress.rejected')}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                        <span>{t('complaints.progress.closed')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};

export default CustomerComplaintsPage;
