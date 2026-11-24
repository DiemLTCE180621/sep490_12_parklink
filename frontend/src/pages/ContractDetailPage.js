import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getConfirmationRecordDetail,
  acceptConfirmationRecord,
  rejectConfirmationRecord,
  respondToLeaseExtension,
  confirmContractTermination,
  cancelEarlyTermination
} from '../services/confirmationRecordService';
import timelineSettingService from '../services/timelineSettingService';
import { translateDurationText, translateVehicleTypeName } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/modals/ConfirmModal';
import Toast from '../components/common/Toast';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
  Printer,
  Clock,
  RotateCcw
} from 'lucide-react';

const ContractDetailPage = () => {
  const { t, i18n } = useTranslation('customer');
  const tRef = useRef(t);
  tRef.current = t;
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [processingExtension, setProcessingExtension] = useState(false);
  const [processingTermination, setProcessingTermination] = useState(false);
  const [cancellingTermination, setCancellingTermination] = useState(false);
  const [terminationProviderNote, setTerminationProviderNote] = useState('');
  const [terminationRefund, setTerminationRefund] = useState('');
  const [error, setError] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const [customerAddress, setCustomerAddress] = useState('');
  const [customerIdCard, setCustomerIdCard] = useState('');

  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmTerminationModalOpen, setConfirmTerminationModalOpen] = useState(false);
  const [cancelTerminationModalOpen, setCancelTerminationModalOpen] = useState(false);
  const [rejectTerminationModalOpen, setRejectTerminationModalOpen] = useState(false);
  const [rejectExtensionModalOpen, setRejectExtensionModalOpen] = useState(false);
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

  const providerId = contract?.reservation?.facility?.provider_id || contract?.reservation?.facility?.provider?.id;
  const isProvider = user?.role?.name === 'PROVIDER' || user?.role === 'PROVIDER' || (contract && user?.id === providerId);
  const isCustomer = !isProvider;

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getConfirmationRecordDetail(id);
      const data = res.data?.confirmation_record || res.confirmation_record;
      if (!data) {
        throw new Error(tRef.current('contractDetail.notFoundError'));
      }
      setContract(data);
      const custInfo = data?.contract_snapshot?.customer_info || {};
      const rawVeh = data?.reservation?.vehicle_info || data?.contract_snapshot?.vehicle_info?.vehicle_info_raw || '';
      const cccdM = rawVeh.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
      const dcM = rawVeh.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);

      const parsedCccd =
        custInfo.customer_id_card && custInfo.customer_id_card !== 'Chưa cập nhật' && custInfo.customer_id_card.trim() !== ''
          ? custInfo.customer_id_card
          : cccdM ? cccdM[1].trim() : localStorage.getItem('customer_id_card') || '';

      const parsedAddress =
        custInfo.customer_address && custInfo.customer_address !== 'Chưa cập nhật' && custInfo.customer_address.trim() !== ''
          ? custInfo.customer_address
          : dcM ? dcM[1].trim() : localStorage.getItem('customer_address') || data?.reservation?.customer?.address || '';

      setCustomerAddress(parsedAddress);
      setCustomerIdCard(parsedCccd);
      if (data?.status === 'ACTIVE' || data?.customer_agreed_at) {
        setIsTermsAgreed(true);
      } else {
        setIsTermsAgreed(false);
      }
    } catch (err) {
      setError(err.message || tRef.current('contractDetail.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id, fetchDetail]);

  const snapshot = contract?.contract_snapshot || {};
  const contractInfo = snapshot.contract_info || {};
  const ownerInfo = snapshot.owner_info || {};
  const customerInfo = snapshot.customer_info || {};
  const vehicleInfo = snapshot.vehicle_info || {};
  const rentalInfo = snapshot.rental_info || {};
  const terms = snapshot.terms_and_conditions || {};

  const isPendingSignature = contract?.status === 'PENDING_SIGNATURE';
  const isActive = contract?.status === 'ACTIVE';

  const rawVehicle = contract?.reservation?.vehicle_info || snapshot?.vehicle_info?.vehicle_info_raw || '';
  const cccdMatch = rawVehicle.match(/(?:CCCD|CMND|Số CMND|Số CCCD)[:\s]+([^|\]\-,\n]+)/i);
  const dcMatch = rawVehicle.match(/(?:ĐC|Địa chỉ|DC)[:\s]+([^|\]\n]+)/i);
  const fallbackCccd = cccdMatch ? cccdMatch[1].trim() : '';
  const fallbackAddress = dcMatch ? dcMatch[1].trim() : '';

  const displayIdCard =
    customerInfo.customer_id_card &&
      customerInfo.customer_id_card !== 'Chưa cập nhật' &&
      customerInfo.customer_id_card.trim() !== ''
      ? customerInfo.customer_id_card
      : fallbackCccd || customerIdCard || localStorage.getItem('customer_id_card') || t('contractDetail.notUpdated');

  const displayAddress =
    customerInfo.customer_address &&
      customerInfo.customer_address !== 'Chưa cập nhật' &&
      customerInfo.customer_address.trim() !== ''
      ? customerInfo.customer_address
      : fallbackAddress || customerAddress || localStorage.getItem('customer_address') || contract?.reservation?.customer?.address || t('contractDetail.notUpdated');

  const handleExecuteAccept = async () => {
    try {
      setAccepting(true);
      const payload = {
        customer_address: (displayAddress && displayAddress !== 'Chưa cập nhật' && displayAddress !== t('contractDetail.notUpdated')) ? displayAddress : (customerAddress?.trim() || ''),
        customer_id_card: (displayIdCard && displayIdCard !== 'Chưa cập nhật' && displayIdCard !== t('contractDetail.notUpdated')) ? displayIdCard : (customerIdCard?.trim() || '')
      };
      const res = await acceptConfirmationRecord(id, payload);
      const updated = res.data?.confirmation_record || res.confirmation_record;
      setToastInfo({
        message: t('contractDetail.toasts.acceptSuccess'),
        type: 'success'
      });
      setContract(updated);
      setConfirmModalOpen(false);
    } catch (err) {
      setToastInfo({
        message: err.message || t('contractDetail.toasts.acceptError'),
        type: 'error'
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleExecuteReject = async () => {
    try {
      setRejecting(true);
      const res = await rejectConfirmationRecord(id);
      const updated = res.data?.confirmation_record || res.confirmation_record;
      setToastInfo({
        message: t('contractDetail.toasts.rejectSuccess'),
        type: 'success'
      });
      setContract(updated);
      setRejectModalOpen(false);
    } catch (err) {
      setToastInfo({
        message: err.message || t('contractDetail.toasts.rejectError'),
        type: 'error'
      });
    } finally {
      setRejecting(false);
    }
  };

  const isRenewed = snapshot?.extension_request?.status === 'APPROVED';

  const pendingExtension = snapshot.extension_request && snapshot.extension_request.status === 'PENDING'
    ? snapshot.extension_request
    : null;

  const pendingTermination = snapshot.termination_request && snapshot.termination_request.status === 'PENDING'
    ? snapshot.termination_request
    : null;

  const executeTermination = async (status) => {
    try {
      setProcessingTermination(true);
      const isConfirmed = status === 'CONFIRMED';

      await confirmContractTermination(id, {
        status,
        provider_note: terminationProviderNote ? terminationProviderNote.trim() : (pendingTermination?.provider_note || undefined),
        refund_amount: terminationRefund ? Number(terminationRefund) : (pendingTermination?.refund_amount !== null && pendingTermination?.refund_amount !== undefined ? Number(pendingTermination.refund_amount) : undefined)
      });

      setToastInfo({
        message: isConfirmed
          ? t('contractDetail.toasts.terminateApproveSuccess')
          : t('contractDetail.toasts.terminateRejectSuccess'),
        type: 'success'
      });
      setConfirmTerminationModalOpen(false);
      setRejectTerminationModalOpen(false);
      fetchDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || t('contractDetail.toasts.terminateProcessError'),
        type: 'error'
      });
    } finally {
      setProcessingTermination(false);
    }
  };

  const handleExecuteCancelTermination = async () => {
    try {
      setCancellingTermination(true);
      await cancelEarlyTermination(id);
      setToastInfo({
        message: t('contractDetail.toasts.cancelTerminateSuccess'),
        type: 'success'
      });
      setCancelTerminationModalOpen(false);
      fetchDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || t('contractDetail.toasts.cancelTerminateError'),
        type: 'error'
      });
    } finally {
      setCancellingTermination(false);
    }
  };

  const handleRespondExtension = async (status) => {
    if (status === 'REJECTED') {
      setRejectExtensionModalOpen(true);
      return;
    }
    await executeExtensionResponse('APPROVED');
  };

  const executeExtensionResponse = async (status) => {
    try {
      setProcessingExtension(true);
      const isApproved = status === 'APPROVED';

      const res = await respondToLeaseExtension(id, {
        status,
        provider_note: isApproved ? undefined : t('contractDetail.defaultExtensionRejectNote')
      });

      const newContract = res?.data?.new_confirmation_record || res?.new_confirmation_record;

      setToastInfo({
        message: isApproved
          ? (newContract?.contract_code ? t('contractDetail.toasts.extendApproveSuccessWithCode', { code: newContract.contract_code }) : t('contractDetail.toasts.extendApproveSuccess'))
          : t('contractDetail.toasts.extendRejectSuccess'),
        type: 'success'
      });
      setRejectExtensionModalOpen(false);

      if (isApproved && newContract?.id) {
        setTimeout(() => {
          navigate(`/contracts/${newContract.id}`);
        }, 1200);
      } else {
        fetchDetail();
      }
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || t('contractDetail.toasts.extendProcessError'),
        type: 'error'
      });
    } finally {
      setProcessingExtension(false);
    }
  };

  const dateLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN';
  const numberLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';
  const signingDurationDisplay = timelineSettings?.contractSigningText
    ? translateDurationText(timelineSettings.contractSigningText, i18n.language)
    : t('contractDetail.defaultSigningDuration');
  const contractIssueDate = contract?.created_at ? new Date(contract.created_at) : new Date();
  const noticeText = timelineSettings?.terminationNoticeText
    ? translateDurationText(timelineSettings.terminationNoticeText, i18n.language)
    : t('contractDetail.defaultNoticeDuration');
  const rawNoticeTextVi = timelineSettings?.terminationNoticeText || '15 ngày';
  const formatNoticeInTerms = (content) => {
    if (!content) return '';
    return content.replace(/ít nhất (?:15 ngày|\d+\s*(?:ngày|phút|giờ))/g, `ít nhất ${rawNoticeTextVi}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-3 sm:px-6 lg:px-8 print:bg-white print:p-0 print:m-0">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="w-full max-w-[1400px] mx-auto space-y-6 print:m-0 print:p-0 print:max-w-none">

        <div className="print:hidden flex flex-wrap items-center justify-between gap-4 sm:max-w-[900px] mx-auto">
          <button
            onClick={() => {
              if (isCustomer) {
                navigate('/my-contracts');
              } else {
                navigate(-1);
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {isCustomer ? t('contractDetail.topBar.backToContracts') : t('contractDetail.topBar.backToPrevious')}
          </button>

          <div className="flex items-center gap-2.5">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {t('contractDetail.topBar.statusActive')}
              </span>
            ) : contract?.status === 'TERMINATED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {t('contractDetail.topBar.statusTerminated')}
              </span>
            ) : contract?.status === 'CANCELLED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                {t('contractDetail.topBar.statusCancelled')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {t('contractDetail.topBar.statusPending')}
              </span>
            )}

            {isCustomer && ['ACTIVE', 'COMPLETED'].includes(contract?.status) && !isRenewed && (
              <button
                type="button"
                onClick={() => {
                  const resId = contract?.reservation_id || contract?.reservation?.id;
                  if (resId) navigate(`/submit-complaint/${resId}`);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-medium rounded-lg transition shadow-sm"
                title={t('contractDetail.topBar.complainTitle')}
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                {t('contractDetail.topBar.complainButton')}
              </button>
            )}

            {isCustomer && isActive && !isRenewed && (
              <>
                {pendingExtension ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/extend`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-300 transition shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    {t('contractDetail.topBar.viewExtension')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/extend`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neighbor-600 hover:bg-neighbor-700 text-white text-xs font-medium rounded-lg transition shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t('contractDetail.topBar.extend')}
                  </button>
                )}

                {pendingTermination ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg border border-rose-300 transition shadow-sm"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    {t('contractDetail.topBar.viewTermination')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 transition shadow-sm"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    {t('contractDetail.topBar.earlyTerminate')}
                  </button>
                )}
              </>
            )}

            {isProvider && isActive && !isRenewed && (
              <>
                {pendingTermination ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg border border-rose-300 transition shadow-sm"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    {t('contractDetail.topBar.viewTerminationProvider')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 transition shadow-sm"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    {t('contractDetail.topBar.earlyTerminate')}
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition"
              title={t('contractDetail.topBar.printTitle')}
            >
              <Printer className="w-3.5 h-3.5" />
              {t('contractDetail.topBar.printButton')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-16 text-center border border-gray-200">
            <Loader2 className="w-8 h-8 animate-spin text-neighbor-600 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">{t('contractDetail.loading', { id })}</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-10 border border-gray-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">{t('contractDetail.errorTitle')}</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchDetail}
              className="px-4 py-2 bg-neighbor-600 text-white font-medium text-xs rounded-lg hover:bg-neighbor-700 transition"
            >
              {t('contractDetail.retry')}
            </button>
          </div>
        ) : contract ? (
          <div className="space-y-6">

            {isPendingSignature && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 shadow-xs">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-xs sm:text-sm text-amber-900">
                  <span className="font-bold text-amber-950">{t('contractDetail.banners.signingTitle')} </span>
                  {isCustomer ? (
                    <>
                      {t('contractDetail.banners.signingCustomerBefore')} <strong className="text-amber-950 font-bold underline px-1.5 py-0.5 bg-amber-100 rounded">{signingDurationDisplay}</strong> {t('contractDetail.banners.signingCustomerAfter')}
                    </>
                  ) : (
                    <>
                      {t('contractDetail.banners.signingProviderBefore')} <strong className="text-amber-950 font-bold underline px-1.5 py-0.5 bg-amber-100 rounded">{signingDurationDisplay}</strong> {t('contractDetail.banners.signingProviderAfter')}
                    </>
                  )}
                </div>
              </div>
            )}

            {isCustomer && pendingExtension && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                      {t('contractDetail.banners.extensionPendingTitle', { months: pendingExtension.extension_months })}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5">
                      {t('contractDetail.banners.extensionProposedEnd')} <strong>{pendingExtension.requested_end_date ? new Date(pendingExtension.requested_end_date).toLocaleDateString(dateLocale) : '---'}</strong> • {t('contractDetail.banners.extensionEstCost')} <strong>{Number(pendingExtension.total_estimated_amount || 0).toLocaleString(numberLocale)} {t('contracts.card.priceUnit').split('/')[0]}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/contracts/${id}/extend`)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition shrink-0 self-end sm:self-auto"
                >
                  {t('contractDetail.banners.viewDetailOrCancel')}
                </button>
              </div>
            )}


            {snapshot.extension_request?.status === 'APPROVED' && snapshot.extension_request?.new_contract_id && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-neighbor-50 border border-neighbor-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neighbor-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4 text-neighbor-700" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neighbor-900">
                      {t('contractDetail.banners.extendedDoneTitle', { code: snapshot.extension_request.new_contract_code || `#${snapshot.extension_request.new_contract_id}` })}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-neighbor-700 mt-0.5">
                      {t('contractDetail.banners.extendedDoneDesc')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      isCustomer
                        ? `/my-contracts/${snapshot.extension_request.new_contract_id}`
                        : `/contracts/${snapshot.extension_request.new_contract_id}`
                    )
                  }
                  className="px-3.5 py-1.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-semibold text-xs rounded-lg transition shrink-0 self-end sm:self-auto"
                >
                  {t('contractDetail.banners.viewNewContract')}
                </button>
              </div>
            )}


            {isProvider && pendingExtension && (
              <div className="print:hidden bg-white rounded-xl p-5 sm:p-6 border-2 border-amber-400 sm:max-w-[900px] mx-auto space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900">
                        {t('contractDetail.banners.providerExtensionTitle')}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {t('contractDetail.banners.providerExtensionDesc')}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                    {t('contractDetail.banners.awaitingApproval')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                  <div>
                    <span className="text-gray-500 block">{t('contractDetail.banners.extMonthsLabel')}</span>
                    <strong className="text-gray-900 text-sm">{t('contractDetail.banners.extMonthsValue', { months: pendingExtension.extension_months })}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t('contractDetail.banners.extNewEndLabel')}</span>
                    <strong className="text-neighbor-700 text-sm">
                      {pendingExtension.requested_end_date ? new Date(pendingExtension.requested_end_date).toLocaleDateString(dateLocale) : '---'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t('contractDetail.banners.extRevenueLabel', { months: pendingExtension.extension_months })}</span>
                    <strong className="text-emerald-700 text-sm font-bold">
                      {Number(pendingExtension.total_estimated_amount || 0).toLocaleString(numberLocale)} {t('contracts.card.priceUnit').split('/')[0]}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t('contractDetail.banners.extSubmittedLabel')}</span>
                    <span className="text-gray-700 font-medium">
                      {new Date(pendingExtension.requested_at).toLocaleDateString(dateLocale)}
                    </span>
                  </div>

                  {pendingExtension.reason && (
                    <div className="sm:col-span-2 pt-2 border-t border-amber-200/60">
                      <span className="text-gray-500 block font-medium">{t('contractDetail.banners.extCustomerReason')}</span>
                      <p className="text-gray-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-amber-200">
                        "{pendingExtension.reason}"
                      </p>
                    </div>
                  )}


                  {pendingExtension.vehicle_info?.is_changed && (
                    <div className="sm:col-span-2 pt-2 border-t border-amber-200/60">
                      <span className="text-gray-700 font-bold block mb-1">
                        {t('contractDetail.banners.extVehicleChangeTitle')}
                      </span>
                      <div className="p-2.5 bg-white rounded-lg border border-neighbor-200 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 block text-[11px]">{t('contractDetail.banners.extNewVehicleType')}</span>
                          <strong className="text-gray-900 font-semibold">{translateVehicleTypeName({ name: pendingExtension.vehicle_info.vehicle_type }, i18n.language)}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[11px]">{t('contractDetail.banners.extNewPlate')}</span>
                          <strong className="text-neighbor-700 font-semibold">{pendingExtension.vehicle_info.license_plate}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={processingExtension}
                    onClick={() => handleRespondExtension('REJECTED')}
                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                  >
                    {t('contractDetail.banners.extRejectButton')}
                  </button>
                  <button
                    type="button"
                    disabled={processingExtension}
                    onClick={() => handleRespondExtension('APPROVED')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                  >
                    {processingExtension ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {t('contractDetail.banners.extApproveButton')}
                  </button>
                </div>
              </div>
            )}


            {contract.status === 'TERMINATED' && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-gray-50 border border-gray-300 rounded-xl flex items-center gap-3 text-xs text-gray-700 shadow-sm">
                <AlertCircle className="w-5 h-5 text-gray-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{t('contractDetail.banners.terminatedTitle')}</h4>
                  <p className="text-gray-600 mt-0.5">
                    {t('contractDetail.banners.terminatedDesc')}
                  </p>
                </div>
              </div>
            )}


            {contract.status === 'CANCELLED' && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-gray-50 border border-gray-300 rounded-xl flex items-center gap-3 text-xs text-gray-700 shadow-sm">
                <AlertCircle className="w-5 h-5 text-gray-500 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{t('contractDetail.banners.cancelledSlotTitle')}</h4>
                  <p className="text-gray-600 mt-0.5">
                    {t('contractDetail.banners.cancelledSlotDesc')}
                  </p>
                </div>
              </div>
            )}

            {isActive && !pendingTermination && snapshot.last_expired_termination && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-800 shadow-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {t('contractDetail.banners.expiredTermTitle', { notice: noticeText })}
                  </h4>
                  <p className="text-amber-700 mt-0.5">
                    {(i18n.language?.startsWith('en') ? null : snapshot.last_expired_termination.expired_reason) ||
                      t('contractDetail.banners.expiredTermFallback', { notice: noticeText })}
                  </p>
                </div>
              </div>
            )}


            {isCustomer && pendingTermination && (
              <div className="print:hidden sm:max-w-[900px] mx-auto p-5 bg-white border-2 border-rose-400 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-rose-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
                      <Clock className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900">
                        {pendingTermination.requested_by === 'PROVIDER'
                          ? t('contractDetail.banners.custTermProviderTitle')
                          : t('contractDetail.banners.custTermCustomerTitle')}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pendingTermination.requested_by === 'PROVIDER'
                          ? t('contractDetail.banners.custTermProviderDesc')
                          : t('contractDetail.banners.custTermCustomerDesc')}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                    {pendingTermination.requested_by === 'PROVIDER' ? t('contractDetail.banners.sentByProviderBadge') : t('contractDetail.banners.pendingProcessBadge')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                  <div>
                    <span className="text-gray-500 block">
                      {pendingTermination.requested_by === 'PROVIDER' ? t('contractDetail.banners.proposedStopDate') : t('contractDetail.banners.proposedReturnDate')}
                    </span>
                    <strong className="text-rose-700 text-sm font-bold">
                      {pendingTermination.requested_termination_date ? new Date(pendingTermination.requested_termination_date).toLocaleDateString(dateLocale) : '---'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t('contractDetail.banners.originalEndDate')}</span>
                    <strong className="text-gray-800 text-sm font-semibold">
                      {new Date(contract.end_date).toLocaleDateString(dateLocale)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t('contractDetail.banners.submittedAt')}</span>
                    <span className="text-gray-700 font-medium">
                      {new Date(pendingTermination.requested_at).toLocaleDateString(dateLocale)} {new Date(pendingTermination.requested_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {pendingTermination.requested_by === 'PROVIDER' && pendingTermination.refund_amount !== null && pendingTermination.refund_amount !== undefined && (
                    <div>
                      <span className="text-gray-500 block">{t('contractDetail.banners.refundAgreedLabel')}</span>
                      <strong className="text-emerald-700 font-mono text-sm font-bold">
                        {Number(pendingTermination.refund_amount).toLocaleString(numberLocale)} {t('contracts.card.priceUnit').split('/')[0]}
                      </strong>
                    </div>
                  )}

                  {pendingTermination.bank_account_info && (
                    <div>
                      <span className="text-gray-500 block">{t('contractDetail.banners.refundAccountLabel')}</span>
                      <strong className="text-gray-900 font-mono text-xs">{pendingTermination.bank_account_info}</strong>
                    </div>
                  )}

                  {pendingTermination.reason && (
                    <div className="sm:col-span-2 pt-2 border-t border-rose-200/60">
                      <span className="text-gray-500 block font-medium">
                        {pendingTermination.requested_by === 'PROVIDER' ? t('contractDetail.banners.reasonFromProvider') : t('contractDetail.banners.reasonFromYou')}
                      </span>
                      <p className="text-gray-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-rose-200">
                        "{pendingTermination.reason}"
                      </p>
                    </div>
                  )}

                  {pendingTermination.requested_by === 'PROVIDER' && pendingTermination.provider_note && (
                    <div className="sm:col-span-2 pt-2 border-t border-rose-200/60">
                      <span className="text-gray-500 block font-medium">{t('contractDetail.banners.providerGuideNote')}</span>
                      <p className="text-gray-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-rose-200">
                        "{pendingTermination.provider_note}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  {pendingTermination.requested_by === 'CUSTOMER' && (
                    <button
                      type="button"
                      disabled={cancellingTermination}
                      onClick={() => setCancelTerminationModalOpen(true)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                    >
                      {cancellingTermination ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      {t('contractDetail.banners.cancelTermination')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${id}/terminate`)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                  >
                    {pendingTermination.requested_by === 'PROVIDER' ? t('contractDetail.banners.viewHandoverDetail') : t('contractDetail.banners.viewDetail')}
                  </button>
                </div>
              </div>
            )}


            {isProvider && pendingTermination && (
              <div className="print:hidden bg-white rounded-xl p-5 sm:p-6 border-2 border-rose-400 sm:max-w-[900px] mx-auto space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-rose-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
                      <Clock className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-gray-900">
                        {pendingTermination.requested_by === 'PROVIDER'
                          ? t('contractDetail.banners.provTermSelfTitle')
                          : t('contractDetail.banners.provTermCustTitle')}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pendingTermination.requested_by === 'PROVIDER'
                          ? t('contractDetail.banners.provTermSelfDesc')
                          : t('contractDetail.banners.provTermCustDesc')}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                    {pendingTermination.requested_by === 'PROVIDER' ? t('contractDetail.banners.awaitingReclaimBadge') : t('contractDetail.banners.awaitingConfirmBadge')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                  <div>
                    <span className="text-gray-500 block">
                      {pendingTermination.requested_by === 'PROVIDER' ? t('contractDetail.banners.proposedStopDate') : t('contractDetail.banners.proposedReturnDate')}
                    </span>
                    <strong className="text-rose-700 text-sm font-bold">
                      {pendingTermination.requested_termination_date ? new Date(pendingTermination.requested_termination_date).toLocaleDateString(dateLocale) : '---'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t('contractDetail.banners.originalEndDate')}</span>
                    <strong className="text-gray-800 text-sm font-semibold">
                      {new Date(contract.end_date).toLocaleDateString(dateLocale)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{t('contractDetail.banners.submittedAt')}</span>
                    <span className="text-gray-700 font-medium">
                      {new Date(pendingTermination.requested_at).toLocaleDateString(dateLocale)} {new Date(pendingTermination.requested_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {pendingTermination.bank_account_info && (
                    <div>
                      <span className="text-gray-500 block">{t('contractDetail.banners.refundAccountLabel')}</span>
                      <strong className="text-gray-900 font-mono text-xs">{pendingTermination.bank_account_info}</strong>
                    </div>
                  )}

                  {pendingTermination.requested_by === 'PROVIDER' && pendingTermination.refund_amount !== null && pendingTermination.refund_amount !== undefined && (
                    <div>
                      <span className="text-gray-500 block">{t('contractDetail.banners.provRefundExpected')}</span>
                      <strong className="text-emerald-700 font-mono text-sm font-bold">
                        {Number(pendingTermination.refund_amount).toLocaleString(numberLocale)} {t('contracts.card.priceUnit').split('/')[0]}
                      </strong>
                    </div>
                  )}

                  {pendingTermination.reason && (
                    <div className="sm:col-span-2 pt-2 border-t border-rose-200/60">
                      <span className="text-gray-500 block font-medium">
                        {pendingTermination.requested_by === 'PROVIDER' ? t('contractDetail.banners.reasonFromProviderSelf') : t('contractDetail.banners.reasonFromCustomer')}
                      </span>
                      <p className="text-gray-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-rose-200">
                        "{pendingTermination.reason}"
                      </p>
                    </div>
                  )}

                  {pendingTermination.requested_by === 'PROVIDER' && pendingTermination.provider_note && (
                    <div className="sm:col-span-2 pt-2 border-t border-rose-200/60">
                      <span className="text-gray-500 block font-medium">{t('contractDetail.banners.guideNoteForCustomer')}</span>
                      <p className="text-gray-800 italic mt-0.5 bg-white p-2.5 rounded-lg border border-rose-200">
                        "{pendingTermination.provider_note}"
                      </p>
                    </div>
                  )}
                </div>


                {pendingTermination.requested_by === 'CUSTOMER' ? (
                  <>
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-700 block">
                            {t('contractDetail.banners.provRefundInputLabel')}
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={terminationRefund}
                            onChange={(e) => setTerminationRefund(e.target.value)}
                            placeholder={t('contractDetail.banners.provRefundPlaceholder')}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-neighbor-600 focus:ring-neighbor-500 font-mono"
                          />
                          <span className="text-[11px] text-gray-400 block">{t('contractDetail.banners.offPlatformTransferNote')}</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-700 block">
                            {t('contractDetail.banners.provNoteInputLabel')}
                          </label>
                          <input
                            type="text"
                            value={terminationProviderNote}
                            onChange={(e) => setTerminationProviderNote(e.target.value)}
                            placeholder={t('contractDetail.banners.provNotePlaceholder')}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-neighbor-600 focus:ring-neighbor-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        disabled={processingTermination}
                        onClick={() => setRejectTerminationModalOpen(true)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition"
                      >
                        {t('contractDetail.banners.rejectTerminationBtn')}
                      </button>
                      <button
                        type="button"
                        disabled={processingTermination}
                        onClick={() => setConfirmTerminationModalOpen(true)}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        {processingTermination ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {t('contractDetail.banners.approveTerminationBtn')}
                      </button>
                    </div>
                  </>
                ) : (

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rose-100">
                    <p className="text-[11px] text-gray-500 italic">
                      * Bạn có thể hủy yêu cầu nếu muốn tiếp tục duy trì hợp đồng với khách hàng.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={cancellingTermination || processingTermination}
                        onClick={() => setCancelTerminationModalOpen(true)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5"
                      >
                        {cancellingTermination ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        {t('contractDetail.banners.cancelThisTerminationBtn')}
                      </button>
                      <button
                        type="button"
                        disabled={cancellingTermination || processingTermination}
                        onClick={() => setConfirmTerminationModalOpen(true)}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                      >
                        {processingTermination ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {t('contractDetail.banners.confirmReclaimedBtn')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}


            <div
              className="contract-paper-canvas bg-white border border-gray-300 shadow-md sm:rounded-lg p-6 sm:p-14 sm:max-w-[900px] mx-auto text-black print:p-0 print:border-none print:shadow-none print:max-w-none print:m-0"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >

              <div className="text-center space-y-1 mb-8">
                <p className="font-bold uppercase text-sm sm:text-base tracking-wide text-black">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-bold text-sm sm:text-base text-black">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="w-44 border-b border-black mx-auto mt-1 mb-6"></div>

                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black mt-4">
                  HỢP ĐỒNG GỬI GIỮ XE Ô TÔ
                </h1>
                <p className="text-sm font-semibold text-black mt-1">
                  Số: {contract.contract_code || contractInfo.contract_code} / HĐDV-PL
                </p>
              </div>


              <p className="text-xs sm:text-sm leading-relaxed text-black mb-4">
                Hôm nay, ngày {contractIssueDate.getDate()} tháng {contractIssueDate.getMonth() + 1} năm {contractIssueDate.getFullYear()}, tại {ownerInfo.facility_name || contract.reservation?.facility?.name} (Địa chỉ: {ownerInfo.facility_address || contract.reservation?.facility?.address}), hai bên gồm có:
              </p>


              <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-black mb-6">

                <div className="space-y-1 pl-1">
                  <p className="font-bold uppercase text-black">1. BÊN A (BÊN NHẬN GỬI GIỮ XE Ô TÔ):</p>
                  <p className="pl-4">- Cơ sở bãi đỗ xe: <strong>{ownerInfo.facility_name || contract.reservation?.facility?.name}</strong></p>
                  <p className="pl-4">- Đại diện bởi: <strong>Ông (Bà) {ownerInfo.provider_name || contract.reservation?.facility?.provider?.full_name}</strong></p>
                  <p className="pl-4">- Địa chỉ bãi xe: {ownerInfo.facility_address || contract.reservation?.facility?.address}</p>
                  <p className="pl-4">- Điện thoại liên hệ: {ownerInfo.provider_phone || contract.reservation?.facility?.provider?.phone_number || 'Chưa cập nhật'}</p>
                  {ownerInfo.provider_email && (
                    <p className="pl-4">- Email: {ownerInfo.provider_email}</p>
                  )}
                </div>


                <div className="space-y-1 pl-1">
                  <p className="font-bold uppercase text-black">2. BÊN B (BÊN GỬI XE Ô TÔ):</p>
                  <p className="pl-4">- Ông (Bà): <strong>{customerInfo.customer_name || contract.reservation?.customer?.full_name}</strong></p>
                  <p className="pl-4">- Số CMND / Thẻ CCCD: <strong>{displayIdCard === t('contractDetail.notUpdated') ? 'Chưa cập nhật' : displayIdCard}</strong></p>
                  <p className="pl-4">- Địa chỉ thường trú / liên hệ: {displayAddress === t('contractDetail.notUpdated') ? 'Chưa cập nhật' : displayAddress}</p>
                  <p className="pl-4">- Điện thoại liên hệ: {customerInfo.customer_phone || contract.reservation?.customer?.phone_number || 'Chưa cập nhật'}</p>
                  <p className="pl-4">- Email: {customerInfo.customer_email || contract.reservation?.customer?.email || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-black mb-6 italic">
                Sau khi bàn bạc và thống nhất trên tinh thần tự nguyện, bình đẳng, hai bên nhất trí ký kết Hợp đồng gửi giữ xe ô tô với các điều khoản cụ thể sau đây:
              </p>


              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 1. Đối tượng gửi, giữ</p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  1.1. Bên A đồng ý nhận trông giữ và Bên B đồng ý gửi phương tiện xe ô tô theo đúng quy cách thông tin sau:
                </p>
                <p className="pl-8 text-xs sm:text-sm text-black">- Loại phương tiện / Dòng xe: <strong>{vehicleInfo.vehicle_type || 'Ô tô'}</strong></p>
                <p className="pl-8 text-xs sm:text-sm text-black">- Biển kiểm soát: <strong>{vehicleInfo.license_plate || vehicleInfo.vehicle_info_raw || contract.reservation?.vehicle_info}</strong></p>
                <p className="pl-8 text-xs sm:text-sm text-black">- Vị trí gửi đỗ: <strong>{rentalInfo.parking_spot || 'Vị trí đỗ tự do trong bãi'}</strong> tại {ownerInfo.facility_name || contract.reservation?.facility?.name}.</p>
              </div>


              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 2. Thời hạn, giá cả và phương thức thanh toán</p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  2.1. <strong>Thời hạn gửi giữ:</strong> Kể từ ngày <strong>{new Date(contract.start_date).toLocaleDateString('vi-VN')}</strong> đến hết ngày <strong>{new Date(contract.end_date).toLocaleDateString('vi-VN')}</strong>.
                </p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  2.2. <strong>Giá dịch vụ trông giữ xe:</strong> <strong>{Number(contract.agreed_price || rentalInfo.agreed_price || 0).toLocaleString('vi-VN')} đồng/tháng/xe</strong>.
                </p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  2.3. <strong>Thời hạn thanh toán:</strong> Bên B thực hiện thanh toán tiền dịch vụ định kỳ trước ngày <strong>{contract.payment_deadline_day || rentalInfo.payment_deadline_day || 5}</strong> hàng tháng.
                </p>
                <p className="pl-4 text-xs sm:text-sm text-black leading-relaxed">
                  2.4. <strong>Phương thức thanh toán:</strong> Thanh toán trực tuyến qua cổng hệ thống ParkLink hoặc nộp chuyển khoản/tiền mặt cho Bên A.
                </p>
              </div>


              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 3. Quyền và nghĩa vụ của Bên A</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {formatNoticeInTerms(terms.owner_obligations ||
                    '- Yêu cầu bên gửi trả tiền dịch vụ trông giữ xe theo thỏa thuận.\n- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên B ít nhất 15 ngày.\n- Bảo quản xe ô tô theo đúng thỏa thuận, trả lại xe ô tô cho bên gửi theo đúng tình trạng như khi nhận giữ.\n- Chỉ được thay đổi cách bảo quản xe ô tô nếu việc thay đổi là cần thiết nhằm bảo quản tốt hơn xe ô tô đó, nhưng phải báo ngay cho bên gửi biết về việc thay đổi.\n- Thông báo kịp thời cho bên gửi biết về nguy cơ hư hỏng, tiêu hủy xe ô tô do tính chất của xe ô tô đó và yêu cầu bên gửi cho biết cách giải quyết trong một thời hạn; nếu hết thời hạn đó mà bên gửi không trả lời thì bên giữ có quyền thực hiện các biện pháp cần thiết để bảo quản và yêu cầu bên gửi thanh toán chi phí.\n- Quá thời gian thanh toán, bên A có quyền thu hồi vị trí gửi xe và yêu cầu bên B trả phí giữ xe.\n- Phải bồi thường thiệt hại, nếu làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Bảo quản cẩn thận xe gửi giữ, không được sử dụng xe trong thời gian bảo quản.')}
                </div>
              </div>


              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 4. Quyền và nghĩa vụ của Bên B</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {formatNoticeInTerms(terms.customer_obligations ||
                    '- Được chấm dứt hợp đồng trước thời hạn, nhưng phải báo trước cho bên A ít nhất 15 ngày.\n- Yêu cầu bồi thường thiệt hại, nếu bên giữ làm mất, hư hỏng xe ô tô gửi giữ, trừ trường hợp bất khả kháng.\n- Phải trả đủ tiền dịch vụ trông giữ xe đúng thời hạn và đúng phương thức đã thỏa thuận. Trường hợp đóng tiền trễ so với thời gian quy định hợp đồng quá 3 lần/năm thì mặc định thanh lý hợp đồng trước thời hạn và khách hàng phải nộp tiền nợ (nếu có).\n- Trả phí giữ xe khi hết hạn hợp đồng mà không kịp thời nhận lại xe đã gửi.\n- Bên B tự bảo quản chìa khoá xe, thẻ xe, tài sản, tư trang trong xe ô tô.\n- Thực hiện theo đúng nội quy của bãi đậu xe.')}
                </div>
              </div>


              <div className="space-y-1 mb-5">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 5. Giải quyết tranh chấp</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {terms.dispute_resolution ||
                    '- Hai bên cần chủ động thông báo cho nhau biết tình hình thực hiện hợp đồng, nếu có gì bất lợi phát sinh, các bên phải kịp thời thông báo cho nhau biết và tích cực giải quyết trên cơ sở thương lượng, bình đẳng, có lợi (có lập biên bản).\n- Trường hợp các bên không tự giải quyết được mới đưa việc tranh chấp ra Tòa án có thẩm quyền để giải quyết.'}
                </div>
              </div>


              <div className="space-y-1 mb-8">
                <p className="font-bold uppercase text-xs sm:text-sm text-black">Điều 6. Điều khoản chung và hiệu lực hợp đồng</p>
                <div className="pl-4 text-xs sm:text-sm text-black text-justify whitespace-pre-line leading-relaxed">
                  {formatNoticeInTerms(terms.termination_conditions ||
                    `- Hợp đồng này có hiệu lực kể từ ngày hai bên hoàn tất ký xác nhận điện tử đến ngày ${new Date(contract.end_date).toLocaleDateString('vi-VN')}. Hợp đồng đương nhiên được thanh lý khi hai bên hoàn thành toàn bộ các nghĩa vụ theo nội dung Hợp đồng và hai bên không có nhu cầu thỏa thuận gia hạn hợp đồng.\n- Mỗi bên có quyền chấm dứt hợp đồng trước thời hạn nhưng phải báo trước cho bên kia ít nhất 15 ngày.\n- Hợp đồng này được lập dưới dạng hợp đồng điện tử có giá trị pháp lý theo quy định của Luật Giao dịch điện tử và Bộ luật Dân sự 2015 nước CHXHCN Việt Nam; mỗi bên lưu giữ một bản có giá trị như nhau để thực hiện.`)}
                </div>
              </div>


              <div className="pt-6 border-t border-black mt-8">
                <div className="grid grid-cols-2 gap-8 text-center text-xs sm:text-sm text-black">

                  <div className="space-y-1">
                    <p className="font-bold uppercase">ĐẠI DIỆN BÊN A</p>
                    <p className="text-xs italic">(Ký, ghi rõ họ tên hoặc xác nhận điện tử)</p>
                    <div className="h-24 flex flex-col items-center justify-center">
                      <div className="border border-black px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                        XÁC NHẬN ĐIỆN TỬ
                      </div>
                      <p className="text-[11px] text-black mt-1">
                        Ngày: {new Date(contract.provider_agreed_at || contract.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <p className="font-bold text-xs sm:text-sm pt-2">
                      {ownerInfo.provider_name || contract.reservation?.facility?.provider?.full_name}
                    </p>
                  </div>


                  <div className="space-y-1">
                    <p className="font-bold uppercase">ĐẠI DIỆN BÊN B</p>
                    <p className="text-xs italic">(Ký, ghi rõ họ tên hoặc xác nhận điện tử)</p>
                    <div className="h-24 flex flex-col items-center justify-center">
                      {isActive || contract.customer_agreed_at ? (
                        <>
                          <div className="border border-black px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                            XÁC NHẬN ĐIỆN TỬ
                          </div>
                          <p className="text-[11px] text-black mt-1">
                            Ngày: {new Date(contract.customer_agreed_at).toLocaleDateString('vi-VN')}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs italic text-black">(Chờ khách hàng xác nhận điện tử)</p>
                      )}
                    </div>
                    <p className="font-bold text-xs sm:text-sm pt-2">
                      {customerInfo.customer_name || contract.reservation?.customer?.full_name}
                    </p>
                  </div>
                </div>
              </div>

            </div>


            {isCustomer && isPendingSignature && (
              <div className="print:hidden bg-white rounded-xl p-6 border border-gray-200 sm:max-w-[900px] mx-auto space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-bold text-gray-900">
                      {t('contractDetail.signingBox.title')}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      {t('contractDetail.signingBox.deadline', { duration: signingDurationDisplay })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('contractDetail.signingBox.desc', { duration: signingDurationDisplay })}
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-1">
                  <button
                    type="button"
                    onClick={() => setIsTermsAgreed(!isTermsAgreed)}
                    className="mt-0.5 text-neighbor-600 focus:outline-none shrink-0"
                  >
                    {isTermsAgreed ? (
                      <CheckSquare className="w-5 h-5 text-neighbor-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {t('contractDetail.signingBox.confirmTextBefore')} <strong>{customerInfo.customer_name || contract.reservation?.customer?.full_name}</strong>,
                    {t('contractDetail.signingBox.confirmTextAfter')}
                  </span>
                </label>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={accepting || rejecting}
                    onClick={() => setRejectModalOpen(true)}
                    className="px-5 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-gray-200 hover:border-rose-200 font-semibold text-sm rounded-lg transition"
                  >
                    {t('contractDetail.signingBox.rejectButton')}
                  </button>

                  <button
                    type="button"
                    disabled={!isTermsAgreed || accepting || rejecting}
                    onClick={() => setConfirmModalOpen(true)}
                    className="px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition inline-flex items-center justify-center gap-2"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        {t('contractDetail.signingBox.submitting')}
                      </>
                    ) : (
                      t('contractDetail.signingBox.acceptButton')
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>


      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleExecuteAccept}
        title={t('contractDetail.modals.acceptTitle')}
        message={t('contractDetail.modals.acceptMsg')}
        confirmText={t('contractDetail.modals.acceptBtn')}
        cancelText={t('contractDetail.modals.acceptCancel')}
        type="primary"
        loading={accepting}
      />

      <ConfirmModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleExecuteReject}
        title={t('contractDetail.modals.rejectTitle')}
        message={t('contractDetail.modals.rejectMsg')}
        confirmText={t('contractDetail.modals.rejectBtn')}
        cancelText={t('contractDetail.modals.rejectCancel')}
        type="danger"
        loading={rejecting}
      />


      <ConfirmModal
        isOpen={confirmTerminationModalOpen}
        onClose={() => setConfirmTerminationModalOpen(false)}
        onConfirm={() => executeTermination('CONFIRMED')}
        title={pendingTermination?.requested_by === 'PROVIDER' ? t('contractDetail.modals.termProviderTitle') : t('contractDetail.modals.termCustomerTitle')}
        message={
          pendingTermination?.requested_by === 'PROVIDER'
            ? t('contractDetail.modals.termProviderMsg')
            : t('contractDetail.modals.termCustomerMsg')
        }
        confirmText={pendingTermination?.requested_by === 'PROVIDER' ? t('contractDetail.modals.termProviderBtn') : t('contractDetail.modals.termCustomerBtn')}
        cancelText={t('contractDetail.modals.dismissBtn')}
        type="danger"
        loading={processingTermination}
      />


      <ConfirmModal
        isOpen={cancelTerminationModalOpen}
        onClose={() => setCancelTerminationModalOpen(false)}
        onConfirm={handleExecuteCancelTermination}
        title={t('contractDetail.modals.cancelTermTitle')}
        message={t('contractDetail.modals.cancelTermMsg')}
        confirmText={t('contractDetail.modals.cancelTermBtn')}
        cancelText={t('contractDetail.modals.dismissBtn')}
        type="warning"
        loading={cancellingTermination}
      />


      <ConfirmModal
        isOpen={rejectTerminationModalOpen}
        onClose={() => setRejectTerminationModalOpen(false)}
        onConfirm={() => executeTermination('REJECTED')}
        title={t('contractDetail.modals.rejectTermTitle')}
        message={t('contractDetail.modals.rejectTermMsg')}
        confirmText={t('contractDetail.modals.rejectTermBtn')}
        cancelText={t('contractDetail.modals.dismissBtn')}
        type="warning"
        loading={processingTermination}
      />


      <ConfirmModal
        isOpen={rejectExtensionModalOpen}
        onClose={() => setRejectExtensionModalOpen(false)}
        onConfirm={() => executeExtensionResponse('REJECTED')}
        title={t('contractDetail.modals.rejectExtTitle')}
        message={t('contractDetail.modals.rejectExtMsg')}
        confirmText={t('contractDetail.modals.rejectExtBtn')}
        cancelText={t('contractDetail.modals.dismissBtn')}
        type="warning"
        loading={processingExtension}
      />
    </div>
  );
};

export default ContractDetailPage;
