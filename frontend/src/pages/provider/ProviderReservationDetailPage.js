import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getReservationDetail,
  acceptReservation,
  rejectReservation
} from '../../services/reservationService';
import timelineSettingService from '../../services/timelineSettingService';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Toast from '../../components/common/Toast';
import {
  Car,
  Calendar,
  MapPin,
  ArrowLeft,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Loader2,
  Check,
  X
} from 'lucide-react';

const ProviderReservationDetailPage = () => {
  const { t, i18n } = useTranslation('provider');
  const isEnglish = i18n.language?.startsWith('en');
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
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

  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    action: null
  });
  const [processingAction, setProcessingAction] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReservationDetail(id);
      const data = res.data?.reservation || res.reservation;
      if (!data) {
        throw new Error('__NOT_FOUND__');
      }
      setReservation(data);
    } catch (err) {
      setError(err.message || '__LOAD_ERROR__');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id, fetchDetail]);

  const handleExecuteAction = async () => {
    const { action } = confirmModalState;
    if (!action || !id) return;

    try {
      setProcessingAction(true);
      if (action === 'ACCEPT') {
        const res = await acceptReservation(id);
        const successMsg = res.message || res.data?.message || t('reservations.toasts.acceptSuccess', { deadline: timelineSettings?.contractCreationText || t('reservations.defaultDeadline') });
        setToastInfo({
          message: successMsg,
          type: 'success'
        });
      } else if (action === 'REJECT') {
        await rejectReservation(id);
        setToastInfo({ message: t('reservations.toasts.rejectSuccess'), type: 'success' });
      }
      setConfirmModalState({ isOpen: false, action: null });
      fetchDetail();
    } catch (err) {
      setToastInfo({
        message: err.message || (action === 'ACCEPT' ? t('reservations.toasts.acceptFailed') : t('reservations.toasts.rejectFailed')),
        type: 'error'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t('reservations.detail.statusPendingApproval')}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t('reservations.statuses.APPROVED')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {t('reservations.statuses.REJECTED')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {t('reservations.detail.statusCancelledByCustomer')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const rawVehicle = reservation?.vehicle_info || '';
  const cccdMatch = rawVehicle.match(/\[CCCD:\s*([^|\]]+)/i);
  const dcMatch = rawVehicle.match(/\|\s*ĐC:\s*([^\]]+)/i);
  const displayVehicle = rawVehicle.replace(/\s*\[CCCD:[^\]]+\]/i, '').trim();
  const displayCccd = cccdMatch ? cccdMatch[1].trim() : null;
  const displayAddress = dcMatch ? dcMatch[1].trim() : null;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 w-full">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="w-full space-y-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('reservations.detail.backToList')}
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-16 text-center border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-slate-600 text-sm">{t('reservations.detail.loading', { id })}</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">{t('reservations.detail.errorTitle')}</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error === '__NOT_FOUND__' ? t('reservations.detail.notFoundError') : error === '__LOAD_ERROR__' ? t('reservations.detail.loadError') : error}</p>
            <button
              onClick={fetchDetail}
              className="px-4 py-2 bg-teal-600 text-white font-medium text-xs rounded-lg hover:bg-teal-700 transition"
            >
              {t('reservations.retry')}
            </button>
          </div>
        ) : reservation ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {t('reservations.card.requestCode', { id: reservation.id })}
                  </span>
                  <span>•</span>
                  <span>{t('reservations.detail.submittedAt', { date: new Date(reservation.created_at).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN') })}</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  {t('reservations.detail.title')}
                </h1>
              </div>

              <div className="shrink-0">{getStatusBadge(reservation.status)}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              <div className="lg:col-span-8 divide-y divide-slate-200">
                <div className="p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    {t('reservations.detail.customerTitle')}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 block">{t('reservations.detail.fullName')}</span>
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        {reservation.customer?.full_name || t('reservations.card.defaultCustomer')}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">{t('reservations.detail.phone')}</span>
                      <a
                        href={`tel:${reservation.customer?.phone_number}`}
                        className="font-medium text-teal-700 hover:underline flex items-center gap-1.5 mt-0.5"
                      >
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        {reservation.customer?.phone_number || t('reservations.card.notUpdated')}
                      </a>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">{t('reservations.detail.emailLabel')}</span>
                      <p className="text-slate-700 flex items-center gap-1.5 mt-0.5 break-all">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        {reservation.customer?.email || t('reservations.card.notUpdated')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h2 className="text-base font-bold text-slate-900">
                    {t('reservations.detail.rentalInfoTitle')}
                  </h2>

                  <div className="divide-y divide-slate-100 text-sm">
                    <div className="py-2.5 flex justify-between gap-4">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-slate-400" />
                        {t('reservations.detail.vehicleLabel')}
                      </span>
                      <span className="font-semibold text-slate-900 text-right">
                        {displayVehicle || reservation.vehicle_info}
                      </span>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {t('reservations.detail.desiredStartDate')}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {new Date(reservation.desired_start_date).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN')}
                      </span>
                    </div>

                    {displayCccd && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-slate-500">{t('reservations.detail.idCardLabel')}</span>
                        <span className="font-medium text-slate-900">{displayCccd}</span>
                      </div>
                    )}

                    {displayAddress && (
                      <div className="py-2.5 flex justify-between gap-4">
                        <span className="text-slate-500 shrink-0">{t('reservations.detail.addressLabel')}</span>
                        <span className="font-medium text-slate-900 text-right">{displayAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 divide-y divide-slate-200 flex flex-col justify-between">
                <div className="p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    {t('reservations.detail.facilityTitle')}
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 block">{t('reservations.detail.facilityName')}</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{reservation.facility?.name}</p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">{t('reservations.detail.facilityAddress')}</span>
                      <p className="text-slate-600 flex items-start gap-1.5 mt-0.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{reservation.facility?.address}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-slate-500">{t('reservations.detail.listedPrice')}</span>
                      <span className="text-base font-bold text-teal-700">
                        {Number(reservation.facility?.price_per_month || 0).toLocaleString('vi-VN')} {t('reservations.detail.priceUnit')}
                      </span>
                    </div>
                  </div>

                  {reservation.confirmation_record ? (
                    <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{t('reservations.detail.contractBoxTitle')}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t('reservations.detail.contractCode')} <strong className="font-mono text-slate-800">{reservation.confirmation_record.contract_code}</strong>
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                          {reservation.confirmation_record.status === 'ACTIVE' ? t('reservations.detail.contractActive') : t('reservations.detail.contractPending')}
                        </span>
                      </div>

                      <Link
                        to={`/contracts/${reservation.confirmation_record.id}`}
                        className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        {t('reservations.detail.viewContractBtn')}
                      </Link>
                    </div>
                  ) : reservation.status === 'APPROVED' ? (
                    <div className="pt-4 mt-4 border-t border-slate-100 space-y-2.5">
                      <h3 className="text-sm font-bold text-slate-900">{t('reservations.detail.createContractBoxTitle')}</h3>
                      <p className="text-xs text-slate-500">
                        {t('reservations.detail.createContractHintFull', { deadline: timelineSettings?.contractCreationText || t('reservations.defaultDeadline') })}
                      </p>
                      <button
                        onClick={() =>
                          navigate(`/provider/reservations/${reservation.id}/create-contract`, {
                            state: { reservation }
                          })
                        }
                        className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        {t('reservations.detail.createContractBtn')}
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="p-6 bg-slate-50/60 space-y-2.5">
                  {reservation.status === 'PENDING' && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => setConfirmModalState({ isOpen: true, action: 'ACCEPT' })}
                        disabled={processingAction}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        {t('reservations.actions.accept')}
                      </button>

                      <button
                        onClick={() => setConfirmModalState({ isOpen: true, action: 'REJECT' })}
                        disabled={processingAction}
                        className="py-2.5 px-3 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-medium text-xs rounded-lg transition inline-flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        {t('reservations.actions.reject')}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(-1)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition text-center"
                  >
                    {t('reservations.detail.backToListButton')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState({ isOpen: false, action: null })}
        onConfirm={handleExecuteAction}
        title={
          confirmModalState.action === 'ACCEPT'
            ? t('reservations.confirmModal.acceptTitle')
            : t('reservations.confirmModal.rejectTitle')
        }
        message={
          confirmModalState.action === 'ACCEPT'
            ? t('reservations.confirmModal.acceptMessage', { name: reservation?.customer?.full_name || '', deadline: timelineSettings?.contractCreationText || t('reservations.defaultDeadline') })
            : t('reservations.confirmModal.rejectMessage', { name: reservation?.customer?.full_name || '' })
        }
        confirmText={confirmModalState.action === 'ACCEPT' ? t('reservations.confirmModal.confirmAccept') : t('reservations.confirmModal.confirmReject')}
        cancelText={t('reservations.confirmModal.cancel')}
        type={confirmModalState.action === 'ACCEPT' ? 'primary' : 'danger'}
        loading={processingAction}
      />
    </div>
  );
};

export default ProviderReservationDetailPage;
