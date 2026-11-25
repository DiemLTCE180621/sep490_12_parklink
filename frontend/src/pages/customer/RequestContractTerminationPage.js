import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  CreditCard,
  Info,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import {
  getConfirmationRecordDetail,
  requestEarlyTermination,
  cancelEarlyTermination,
  confirmContractTermination
} from '../../services/confirmationRecordService';
import timelineSettingService from '../../services/timelineSettingService';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { translateDurationText, translateVehicleTypeName, translateVehicleInfoText } from '../../utils/translations';

const RequestContractTerminationPage = () => {
  const { t, i18n } = useTranslation('customer');
  const tRef = useRef(t);
  tRef.current = t;
  const dateLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN';
  const numberLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState(false);
  const [error, setError] = useState(null);

  const [terminationDate, setTerminationDate] = useState('');
  const [reason, setReason] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [providerNote, setProviderNote] = useState('');

  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmAcceptModalOpen, setConfirmAcceptModalOpen] = useState(false);
  const [timelineSettings, setTimelineSettings] = useState(null);

  useEffect(() => {
    timelineSettingService.getSettings()
      .then((res) => {
        if (res?.data?.calculated) {
          setTimelineSettings(res.data.calculated);
        }
      })
      .catch(() => {});
  }, []);

  const safeParseSnapshot = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return raw;
  };

  const fetchContractDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getConfirmationRecordDetail(id);
      const data = res.data?.confirmation_record || res.confirmation_record;
      if (!data) {
        throw new Error(tRef.current('contractTerminate.errors.notFound'));
      }
      setContract(data);

      const noticeMs = timelineSettings?.terminationNoticeMs || 0;
      const noticeDays = Math.ceil(noticeMs / 86400000);
      const defaultDate = new Date();
      if (noticeDays > 0) {
        defaultDate.setDate(defaultDate.getDate() + noticeDays);
      }
      const contractEnd = new Date(data.end_date);
      const chosen = defaultDate < contractEnd ? defaultDate : contractEnd;
      setTerminationDate(chosen.toISOString().slice(0, 10));
    } catch (err) {
      setError(err.response?.data?.message || err.message || tRef.current('contractTerminate.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [id, timelineSettings]);

  useEffect(() => {
    if (id) {
      fetchContractDetail();
    }
  }, [id, fetchContractDetail]);

  const snapshot = safeParseSnapshot(contract?.contract_snapshot);
  const pendingTermination = snapshot.termination_request && snapshot.termination_request.status === 'PENDING'
    ? snapshot.termination_request
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!terminationDate) {
      setToastInfo({ message: t('contractTerminate.errors.dateRequired'), type: 'error' });
      return;
    }

    if (!reason.trim()) {
      setToastInfo({ message: t('contractTerminate.errors.reasonRequired'), type: 'error' });
      return;
    }

    let combinedBankInfo = '';
    if (isCustomer && bankAccountNumber.trim()) {
      combinedBankInfo = `${bankName.trim() || t('contractTerminate.bankFallback')} - ${t('contractTerminate.bankAccountShort')}: ${bankAccountNumber.trim()}${bankAccountHolder.trim() ? ` - ${t('contractTerminate.bankHolderShort')}: ${bankAccountHolder.trim().toUpperCase()}` : ''}`;
    }

    try {
      setSubmitting(true);
      const payload = {
        termination_date: terminationDate,
        reason: reason.trim(),
        bank_account_info: isCustomer ? (combinedBankInfo || undefined) : undefined,
        refund_amount: isProvider && refundAmount ? Number(refundAmount) : undefined,
        provider_note: isProvider && providerNote ? providerNote.trim() : undefined
      };

      await requestEarlyTermination(id, payload);
      setToastInfo({
        message: isProvider
          ? t('contractTerminate.toasts.submitProviderSuccess')
          : t('contractTerminate.toasts.submitCustomerSuccess'),
        type: 'success'
      });
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || t('contractTerminate.errors.submitFailed'),
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteCancel = async () => {
    try {
      setCancelling(true);
      await cancelEarlyTermination(id);
      setToastInfo({
        message: t('contractTerminate.toasts.cancelSuccess'),
        type: 'success'
      });
      setConfirmCancelOpen(false);
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || t('contractTerminate.errors.cancelFailed'),
        type: 'error'
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleExecuteConfirm = async () => {
    try {
      setConfirmingAction(true);
      await confirmContractTermination(id, {
        status: 'CONFIRMED',
        provider_note: isProvider && providerNote ? providerNote.trim() : undefined,
        refund_amount: isProvider && refundAmount ? Number(refundAmount) : undefined
      });
      setToastInfo({
        message: t('contractTerminate.toasts.confirmSuccess'),
        type: 'success'
      });
      setConfirmAcceptModalOpen(false);
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || t('contractTerminate.errors.confirmFailed'),
        type: 'error'
      });
    } finally {
      setConfirmingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-sm text-slate-500">{t('contractTerminate.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">{t('contractTerminate.errorScreen.title')}</h2>
          <p className="text-xs text-slate-600">{error || t('contractTerminate.errorScreen.fallback')}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(isProvider ? '/provider/dashboard?tab=contracts' : '/my-contracts')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
            >
              {t('contractTerminate.errorScreen.backToList')}
            </button>
            <button
              onClick={fetchContractDetail}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition"
            >
              {t('contractTerminate.errorScreen.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (contract.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{t('contractTerminate.inactiveScreen.title')}</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('contractTerminate.inactiveScreen.descBefore')} <strong>{contract.status === 'TERMINATED' ? t('contractTerminate.inactiveScreen.statusTerminated') : contract.status === 'PENDING_SIGNATURE' ? t('contractTerminate.inactiveScreen.statusPending') : contract.status}</strong>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate(isProvider ? '/provider/dashboard?tab=contracts' : '/my-contracts')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
            >
              {t('contractTerminate.inactiveScreen.backToList')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (snapshot.extension_request?.status === 'APPROVED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{t('contracts.card.hasBeenRenewedSimple', 'Đã gia hạn tạo HĐ mới')}</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {snapshot.extension_request?.new_contract_code
              ? t('contracts.card.hasBeenRenewed', { code: snapshot.extension_request.new_contract_code, defaultValue: `Hợp đồng này đã được gia hạn sang hợp đồng mới (${snapshot.extension_request.new_contract_code}). Không thể yêu cầu trả chỗ cho hợp đồng cũ.` })
              : t('contracts.card.renewedDisabledTooltip', 'Hợp đồng này đã được gia hạn tạo hợp đồng mới.')}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(isProvider ? '/provider/dashboard?tab=contracts' : '/my-contracts')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
            >
              {t('contractTerminate.inactiveScreen.backToList', 'Quay lại danh sách')}
            </button>
            {snapshot.extension_request?.new_contract_id && (
              <button
                onClick={() => navigate(isProvider ? `/contracts/${snapshot.extension_request.new_contract_id}` : `/my-contracts/${snapshot.extension_request.new_contract_id}`)}
                className="px-5 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white text-xs font-semibold rounded-lg transition"
              >
                {t('contractDetail.banners.viewNewContract', 'Xem HĐ mới')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const facility = contract.reservation?.facility;
  const currentVeh = snapshot.vehicle_info || {};
  const todayStr = new Date().toISOString().slice(0, 10);
  const contractEndStr = contract.end_date ? new Date(contract.end_date).toISOString().slice(0, 10) : '';

  const isProvider = user?.role === 'PROVIDER' || (contract && user?.id === contract.reservation?.facility?.provider_id);
  const isCustomer = !isProvider;
  const requesterRole = pendingTermination?.requested_by || 'CUSTOMER';
  const isMyRequest = (requesterRole === 'PROVIDER' && isProvider) || (requesterRole === 'CUSTOMER' && isCustomer);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />

      
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-900 transition">{t('contractTerminate.breadcrumb.home')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              to={isProvider ? '/provider/dashboard?tab=contracts' : '/my-contracts'}
              className="hover:text-slate-900 transition"
            >
              {isProvider ? t('contractTerminate.breadcrumb.providerContracts') : t('contractTerminate.breadcrumb.myContracts')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to={`/contracts/${id}`} className="font-mono hover:text-slate-900 transition font-medium">
              {contract.contract_code}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">{t('contractTerminate.breadcrumb.current')}</span>
          </div>

          <button
            onClick={() => navigate(`/contracts/${id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('contractTerminate.backToDetail')}
          </button>
        </div>
      </div>

      
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isProvider
                  ? t('contractTerminate.header.titleProvider')
                  : t('contractTerminate.header.titleCustomer')}
              </h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {contract.contract_code}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {t('contractTerminate.header.statusActive')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isProvider
                ? t('contractTerminate.header.subtitleProvider')
                : t('contractTerminate.header.subtitleCustomer')}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('contractTerminate.header.rateLabel')}</span>
              <strong className="text-slate-900 text-sm font-bold">
                {Number(contract.agreed_price || 0).toLocaleString(numberLocale)} {t('contractTerminate.header.rateUnit')}
              </strong>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[11px]">{t('contractTerminate.header.originalEndLabel')}</span>
              <strong className="text-slate-800 text-sm font-semibold">
                {new Date(contract.end_date).toLocaleDateString(dateLocale)}
              </strong>
            </div>
          </div>
        </div>

        
        {pendingTermination ? (
          <div className="bg-white rounded-xl border border-rose-300 overflow-hidden shadow-xs">
            <div className="p-6 bg-rose-50/70 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5 text-rose-700">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {isMyRequest
                        ? t('contractTerminate.pendingView.titleSelf')
                        : requesterRole === 'PROVIDER'
                        ? t('contractTerminate.pendingView.titleProvider')
                        : t('contractTerminate.pendingView.titleCustomer')}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-200/80 text-rose-900">
                      {requesterRole === 'PROVIDER' ? t('contractTerminate.pendingView.badgeProvider') : t('contractTerminate.pendingView.badgeCustomer')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t('contractTerminate.pendingView.submittedAt', { time: new Date(pendingTermination.requested_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }), date: new Date(pendingTermination.requested_at).toLocaleDateString(dateLocale) })}
                    {isMyRequest && t('contractTerminate.pendingView.cancelHint')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                {isMyRequest ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancelOpen(true)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('contractTerminate.pendingView.cancelButton')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmAcceptModalOpen(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isProvider ? t('contractTerminate.pendingView.confirmProviderBtn') : t('contractTerminate.pendingView.confirmCustomerBtn')}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">{t('contractTerminate.pendingView.proposedDateLabel')}</span>
                  <strong className="text-base font-bold text-rose-700 mt-1 block">
                    {pendingTermination.requested_termination_date
                      ? new Date(pendingTermination.requested_termination_date).toLocaleDateString(dateLocale)
                      : '---'}
                  </strong>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">{t('contractTerminate.pendingView.originalEndLabel')}</span>
                  <strong className="text-base font-bold text-slate-800 mt-1 block">
                    {new Date(contract.end_date).toLocaleDateString(dateLocale)}
                  </strong>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">{t('contractTerminate.pendingView.requestCodeLabel')}</span>
                  <span className="font-mono text-xs font-semibold text-slate-700 mt-1 block">
                    {pendingTermination.request_id || 'TERM-REQUEST'}
                  </span>
                </div>
              </div>

              {pendingTermination.reason && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block">
                    {requesterRole === 'PROVIDER' ? t('contractTerminate.pendingView.reasonProvider') : t('contractTerminate.pendingView.reasonCustomer')}
                  </span>
                  <p className="text-slate-700 italic">"{pendingTermination.reason}"</p>
                </div>
              )}

              {pendingTermination.bank_account_info && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    {t('contractTerminate.pendingView.refundBankLabel')}
                  </span>
                  <p className="text-slate-800 font-mono font-medium">{pendingTermination.bank_account_info}</p>
                </div>
              )}

              {pendingTermination.refund_amount !== null && pendingTermination.refund_amount !== undefined && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                    {t('contractTerminate.pendingView.refundAmountLabel')}
                  </span>
                  <p className="text-teal-700 font-bold font-mono text-sm">
                    {Number(pendingTermination.refund_amount).toLocaleString(numberLocale)} {t('contractTerminate.pendingView.currencySuffix')}
                  </p>
                </div>
              )}

              {pendingTermination.provider_note && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block">{t('contractTerminate.pendingView.providerNoteLabel')}</span>
                  <p className="text-slate-700 italic">"{pendingTermination.provider_note}"</p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/contracts/${id}`)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                >
                  {t('contractTerminate.pendingView.viewContractBtn')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <strong className="font-semibold block">
                      {isProvider ? t('contractTerminate.form.policyTitleProvider') : t('contractTerminate.form.policyTitleCustomer')}
                    </strong>
                    <p>
                      {isProvider ? (
                        <>
                          {t('contractTerminate.form.policyProviderBefore')} <strong>{timelineSettings?.terminationNoticeText ? translateDurationText(timelineSettings.terminationNoticeText, i18n.language) : t('contractTerminate.form.defaultNoticeDuration')}</strong> {t('contractTerminate.form.policyProviderAfter')}
                        </>
                      ) : (
                        <>
                          {t('contractTerminate.form.policyCustomerBefore')} <strong>{timelineSettings?.terminationNoticeText ? translateDurationText(timelineSettings.terminationNoticeText, i18n.language) : t('contractTerminate.form.defaultNoticeDuration')}</strong> {t('contractTerminate.form.policyCustomerAfter')}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {isProvider ? t('contractTerminate.form.step1TitleProvider') : t('contractTerminate.form.step1TitleCustomer')}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isProvider
                          ? t('contractTerminate.form.step1DescProvider')
                          : t('contractTerminate.form.step1DescCustomer')}
                      </p>
                    </div>

                    <div className="max-w-xs space-y-1">
                      <label className="text-xs font-medium text-slate-700 block">
                        {isProvider ? t('contractTerminate.form.step1LabelProvider') : t('contractTerminate.form.step1LabelCustomer')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        min={todayStr}
                        max={contractEndStr || undefined}
                        value={terminationDate}
                        onChange={(e) => setTerminationDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 font-medium"
                        required
                      />
                    </div>
                  </div>

                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {t('contractTerminate.form.step2Title')} <span className="text-red-500">*</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isProvider
                          ? t('contractTerminate.form.step2DescProvider')
                          : t('contractTerminate.form.step2DescCustomer')}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <textarea
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={
                          isProvider
                            ? t('contractTerminate.form.step2PlaceholderProvider')
                            : t('contractTerminate.form.step2PlaceholderCustomer')
                        }
                        className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 transition leading-relaxed"
                        required
                      />
                    </div>
                  </div>

                  
                  {isCustomer ? (
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">
                          {t('contractTerminate.form.step3CustomerTitle')}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t('contractTerminate.form.step3CustomerDesc')}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">{t('contractTerminate.form.bankNameLabel')}</label>
                          <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder={t('contractTerminate.form.bankNamePlaceholder')}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">{t('contractTerminate.form.accountNumberLabel')}</label>
                          <input
                            type="text"
                            value={bankAccountNumber}
                            onChange={(e) => setBankAccountNumber(e.target.value)}
                            placeholder={t('contractTerminate.form.accountNumberPlaceholder')}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">{t('contractTerminate.form.accountHolderLabel')}</label>
                          <input
                            type="text"
                            value={bankAccountHolder}
                            onChange={(e) => setBankAccountHolder(e.target.value.toUpperCase())}
                            placeholder="NGUYEN VAN A"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 uppercase font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">
                          {t('contractTerminate.form.step3ProviderTitle')}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t('contractTerminate.form.step3ProviderDesc')}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">
                            {t('contractTerminate.form.refundAmountLabel')}
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder={t('contractTerminate.form.refundAmountPlaceholder')}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 font-mono"
                          />
                          <span className="text-[11px] text-slate-400 block">{t('contractTerminate.form.offPlatformNote')}</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">
                            {t('contractTerminate.form.providerNoteLabel')}
                          </label>
                          <input
                            type="text"
                            value={providerNote}
                            onChange={(e) => setProviderNote(e.target.value)}
                            placeholder={t('contractTerminate.form.providerNotePlaceholder')}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-16">
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    {t('contractTerminate.summary.title')}
                  </h3>

                  
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 block text-[11px]">{t('contractTerminate.summary.facilityLabel')}</span>
                    <p className="font-semibold text-slate-800">{facility?.name || t('contractTerminate.summary.facilityFallback')}</p>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{facility?.address}</p>
                  </div>

                  
                  <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                    <span className="text-slate-400 block text-[11px]">
                      {isProvider ? t('contractTerminate.summary.customerLabel') : t('contractTerminate.summary.vehicleLabel')}
                    </span>
                    {isProvider ? (
                      <p className="font-medium text-slate-800">
                        {contract.reservation?.customer?.full_name || t('contractTerminate.summary.customerFallback')}
                        <span className="font-mono text-slate-500 text-[11px] block mt-0.5">
                          {contract.reservation?.customer?.phone_number}
                        </span>
                      </p>
                    ) : (
                      <p className="font-medium text-slate-800">
                        {currentVeh.vehicle_type ? translateVehicleTypeName({ name: currentVeh.vehicle_type }, i18n.language) : t('contractTerminate.summary.vehicleFallback')}{' '}
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {currentVeh.license_plate || translateVehicleInfoText(contract.reservation?.vehicle_info, i18n.language) || t('contractTerminate.summary.notUpdated')}
                        </span>
                      </p>
                    )}
                  </div>

                  
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>{t('contractTerminate.summary.originalTerm')}</span>
                      <span className="font-mono">{new Date(contract.end_date).toLocaleDateString(dateLocale)}</span>
                    </div>

                    <div className="flex items-center justify-between text-rose-800 bg-rose-50/70 p-2.5 rounded-lg border border-rose-200">
                      <span className="font-medium">
                        {isProvider ? t('contractTerminate.summary.proposedStopDate') : t('contractTerminate.summary.proposedReturnDate')}
                      </span>
                      <strong className="font-mono text-sm font-bold text-rose-700">
                        {terminationDate ? new Date(terminationDate).toLocaleDateString(dateLocale) : '---'}
                      </strong>
                    </div>
                  </div>

                  
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1 leading-relaxed">
                    <p className="font-semibold text-slate-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {t('contractTerminate.summary.noticeTitle')}
                    </p>
                    <p>
                      {t('contractTerminate.summary.noticeBodyBefore')} <strong>{t('contractTerminate.summary.noticeBodyStrong')}</strong> {t('contractTerminate.summary.noticeBodyAfter')}
                    </p>
                  </div>

                  
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('contractTerminate.summary.submitting')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{t('contractTerminate.summary.submit')}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/contracts/${id}`)}
                      className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      {t('contractTerminate.summary.cancelBack')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      
      <ConfirmModal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={handleExecuteCancel}
        title={t('contractTerminate.modals.cancelTitle')}
        message={t('contractTerminate.modals.cancelMessage')}
        confirmText={t('contractTerminate.modals.cancelConfirmBtn')}
        cancelText={t('contractTerminate.modals.cancelCloseBtn')}
        type="warning"
        loading={cancelling}
      />

      
      <ConfirmModal
        isOpen={confirmAcceptModalOpen}
        onClose={() => setConfirmAcceptModalOpen(false)}
        onConfirm={handleExecuteConfirm}
        title={t('contractTerminate.modals.acceptTitle')}
        message={t('contractTerminate.modals.acceptMessage')}
        confirmText={t('contractTerminate.modals.acceptConfirmBtn')}
        cancelText={t('contractTerminate.modals.acceptCancelBtn')}
        type="danger"
        loading={confirmingAction}
      />
    </div>
  );
};

export default RequestContractTerminationPage;
