import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Clock,
  Car,
  AlertCircle,
  Loader2,
  Send,
  ChevronRight,
  RotateCcw,
  Check,
  CheckCircle
} from 'lucide-react';
import {
  getConfirmationRecordDetail,
  requestLeaseExtension,
  cancelLeaseExtension
} from '../../services/confirmationRecordService';
import Toast from '../../components/common/Toast';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { translateVehicleTypeName, translateVehicleInfoText } from '../../utils/translations';

const PRESET_MONTHS = [1, 3, 6, 12];

const RequestContractExtensionPage = () => {
  const { t, i18n } = useTranslation('customer');
  const tRef = useRef(t);
  tRef.current = t;
  const { id } = useParams();
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  const [extensionMonths, setExtensionMonths] = useState(3);
  const [customMonths, setCustomMonths] = useState('');
  const [reason, setReason] = useState('');

  const [changeVehicle, setChangeVehicle] = useState(false);
  const [vehicleType, setVehicleType] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  const [changeContact, setChangeContact] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

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
        throw new Error(tRef.current('contractExtend.errors.notFound'));
      }
      setContract(data);

      const snapshot = safeParseSnapshot(data.contract_snapshot);
      const currentVeh = snapshot.vehicle_info || {};
      const currentCust = snapshot.customer_info || {};

      setVehicleType(currentVeh.vehicle_type || '');
      setLicensePlate(currentVeh.license_plate || '');
      setCustomerPhone(currentCust.customer_phone || data.reservation?.customer?.phone_number || '');
      setCustomerAddress(currentCust.customer_address || data.reservation?.customer?.address || '');
    } catch (err) {
      setError(err.response?.data?.message || err.message || tRef.current('contractExtend.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchContractDetail();
    }
  }, [id, fetchContractDetail]);

  const snapshot = safeParseSnapshot(contract?.contract_snapshot);
  const pendingExtension = snapshot.extension_request && snapshot.extension_request.status === 'PENDING'
    ? snapshot.extension_request
    : null;

  const activeMonths = customMonths ? (parseInt(customMonths, 10) || 1) : extensionMonths;
  const currentEndDate = contract?.end_date ? new Date(contract.end_date) : new Date();
  const calculatedEndDate = new Date(currentEndDate);
  calculatedEndDate.setMonth(calculatedEndDate.getMonth() + Number(activeMonths));

  const monthlyPrice = Number(contract?.reservation?.facility?.price_per_month || contract?.agreed_price || 0);
  const estimatedTotalAmount = monthlyPrice * Number(activeMonths);

  const handleSelectPreset = (months) => {
    setExtensionMonths(months);
    setCustomMonths('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setCustomMonths('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 24) {
      setCustomMonths(num.toString());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeMonths || activeMonths < 1 || activeMonths > 24) {
      setToastInfo({ message: t('contractExtend.errors.invalidMonths'), type: 'error' });
      return;
    }

    if (changeVehicle && (!vehicleType.trim() || !licensePlate.trim())) {
      setToastInfo({ message: t('contractExtend.errors.vehicleRequired'), type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        extension_months: Number(activeMonths),
        reason: reason.trim() || undefined
      };

      if (changeVehicle) {
        payload.vehicle_type = vehicleType.trim();
        payload.license_plate = licensePlate.trim().toUpperCase();
      }

      if (changeContact) {
        if (customerPhone.trim()) payload.customer_phone = customerPhone.trim();
        if (customerAddress.trim()) payload.customer_address = customerAddress.trim();
      }

      await requestLeaseExtension(id, payload);
      setToastInfo({
        message: t('contractExtend.toasts.submitSuccess'),
        type: 'success'
      });
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || t('contractExtend.errors.submitFailed'),
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteCancel = async () => {
    try {
      setCancelling(true);
      await cancelLeaseExtension(id);
      setToastInfo({
        message: t('contractExtend.toasts.cancelSuccess'),
        type: 'success'
      });
      setConfirmCancelOpen(false);
      fetchContractDetail();
    } catch (err) {
      setToastInfo({
        message: err.response?.data?.message || err.message || t('contractExtend.errors.cancelFailed'),
        type: 'error'
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-sm text-slate-500">{t('contractExtend.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">{t('contractExtend.errorScreen.title')}</h2>
          <p className="text-xs text-slate-600">{error || t('contractExtend.errorScreen.fallback')}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/my-contracts')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
            >
              {t('contractExtend.errorScreen.backToList')}
            </button>
            <button
              onClick={fetchContractDetail}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition"
            >
              {t('contractExtend.errorScreen.retry')}
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
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{t('contractExtend.inactiveScreen.title')}</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('contractExtend.inactiveScreen.descBefore')} <strong>{contract.status === 'TERMINATED' ? t('contractExtend.inactiveScreen.statusTerminated') : contract.status === 'PENDING_SIGNATURE' ? t('contractExtend.inactiveScreen.statusPending') : contract.status}</strong>{t('contractExtend.inactiveScreen.descAfter')}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/my-contracts')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
            >
              {t('contractExtend.inactiveScreen.backToList')}
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
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{t('contracts.card.hasBeenRenewedSimple', 'Đã gia hạn tạo HĐ mới')}</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {snapshot.extension_request?.new_contract_code
              ? t('contracts.card.hasBeenRenewed', { code: snapshot.extension_request.new_contract_code, defaultValue: `Hợp đồng này đã được gia hạn sang hợp đồng mới (${snapshot.extension_request.new_contract_code}).` })
              : t('contracts.card.renewedDisabledTooltip', 'Hợp đồng này đã được gia hạn tạo hợp đồng mới.')}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/my-contracts')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
            >
              {t('contractExtend.inactiveScreen.backToList', 'Quay lại danh sách')}
            </button>
            {snapshot.extension_request?.new_contract_id && (
              <button
                onClick={() => navigate(`/my-contracts/${snapshot.extension_request.new_contract_id}`)}
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
  const dateLocale = i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN';
  const numberLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

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
            <Link to="/" className="hover:text-slate-900 transition">{t('contractExtend.breadcrumb.home')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/my-contracts" className="hover:text-slate-900 transition">{t('contractExtend.breadcrumb.myContracts')}</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to={`/contracts/${id}`} className="font-mono hover:text-slate-900 transition font-medium">
              {contract.contract_code}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">{t('contractExtend.breadcrumb.current')}</span>
          </div>

          <button
            onClick={() => navigate(`/contracts/${id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('contractExtend.backToDetail')}
          </button>
        </div>
      </div>

      
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t('contractExtend.header.title')}
              </h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {contract.contract_code}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {t('contractExtend.header.statusActive')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('contractExtend.header.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs shrink-0 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('contractExtend.header.currentRateLabel')}</span>
              <strong className="text-teal-700 text-sm font-bold">
                {monthlyPrice.toLocaleString(numberLocale)} {t('contractExtend.header.priceUnit')}
              </strong>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[11px]">{t('contractExtend.header.currentEndLabel')}</span>
              <strong className="text-slate-800 text-sm font-semibold">
                {new Date(contract.end_date).toLocaleDateString(dateLocale)}
              </strong>
            </div>
          </div>
        </div>

        
        {pendingExtension ? (
          <div className="bg-white rounded-xl border border-amber-300 overflow-hidden shadow-xs">
            <div className="p-6 bg-amber-50/70 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {t('contractExtend.pendingView.title')}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-200/80 text-amber-900">
                      {t('contractExtend.pendingView.badge')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t('contractExtend.pendingView.submittedAt', { time: new Date(pendingExtension.requested_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }), date: new Date(pendingExtension.requested_at).toLocaleDateString(dateLocale) })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmCancelOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t('contractExtend.pendingView.cancelButton')}
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">{t('contractExtend.pendingView.monthsLabel')}</span>
                  <strong className="text-base font-bold text-slate-900 mt-1 block">
                    {t('contractExtend.pendingView.monthsValue', { months: pendingExtension.extension_months })}
                  </strong>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">{t('contractExtend.pendingView.proposedEndLabel')}</span>
                  <strong className="text-base font-bold text-teal-700 mt-1 block">
                    {pendingExtension.requested_end_date ? new Date(pendingExtension.requested_end_date).toLocaleDateString(dateLocale) : '---'}
                  </strong>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">{t('contractExtend.pendingView.estCostLabel', { months: pendingExtension.extension_months })}</span>
                  <strong className="text-base font-bold text-emerald-700 mt-1 block">
                    {Number(pendingExtension.total_estimated_amount || 0).toLocaleString(numberLocale)} {t('contractExtend.pendingView.currencySuffix')}
                  </strong>
                </div>
              </div>

              {pendingExtension.reason && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block">{t('contractExtend.pendingView.reasonLabel')}</span>
                  <p className="text-slate-700 italic">"{pendingExtension.reason}"</p>
                </div>
              )}

              {pendingExtension.vehicle_info?.is_changed && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-semibold text-slate-800 block flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-slate-500" />
                    {t('contractExtend.pendingView.vehicleChangeTitle')}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">{t('contractExtend.pendingView.newVehicleType')}</span>
                      <strong className="text-slate-900 font-semibold">{translateVehicleTypeName({ name: pendingExtension.vehicle_info.vehicle_type }, i18n.language)}</strong>
                    </div>
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">{t('contractExtend.pendingView.newPlate')}</span>
                      <strong className="text-teal-700 font-semibold font-mono">{pendingExtension.vehicle_info.license_plate}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              <div className="lg:col-span-8">
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        {t('contractExtend.form.durationTitle')}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t('contractExtend.form.durationSubtitle')}
                      </p>
                    </div>

                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {PRESET_MONTHS.map((months) => {
                        const isSelected = !customMonths && extensionMonths === months;
                        return (
                          <button
                            key={months}
                            type="button"
                            onClick={() => handleSelectPreset(months)}
                            className={`p-3.5 rounded-lg border text-left transition ${
                              isSelected
                                ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 text-slate-900'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-base font-bold text-slate-900">+{t(`contractExtend.presets.m${months}.label`)}</span>
                              {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">{t(`contractExtend.presets.m${months}.note`)}</span>
                          </button>
                        );
                      })}
                    </div>

                    
                    <div className="pt-1">
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        {t('contractExtend.form.customMonthsLabel')}
                      </label>
                      <div className="relative max-w-xs">
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={customMonths}
                          onChange={handleCustomChange}
                          placeholder={t('contractExtend.form.customMonthsPlaceholder')}
                          className="w-full pl-3 pr-16 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 transition"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          {t('contractExtend.form.monthsUnit')}
                        </span>
                      </div>
                    </div>
                  </div>

                  
                  <div className="divide-y divide-slate-100">
                    <div className="p-6 flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label htmlFor="change-vehicle-toggle" className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer block">
                          {t('contractExtend.form.changeVehicleTitle')}
                        </label>
                        <p className="text-xs text-slate-500">
                          {t('contractExtend.form.changeVehicleDesc')}
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          id="change-vehicle-toggle"
                          type="checkbox"
                          checked={changeVehicle}
                          onChange={(e) => setChangeVehicle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {changeVehicle && (
                      <div className="p-6 bg-slate-50/60 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              {t('contractExtend.form.newVehicleTypeLabel')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={vehicleType}
                              onChange={(e) => setVehicleType(e.target.value)}
                              placeholder={t('contractExtend.form.newVehicleTypePlaceholder')}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              {t('contractExtend.form.newPlateLabel')} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={licensePlate}
                              onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                              placeholder={t('contractExtend.form.newPlatePlaceholder')}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 uppercase font-mono font-medium"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 italic">
                          {t('contractExtend.form.changeVehicleNote')}
                        </p>
                      </div>
                    )}
                  </div>

                  
                  <div className="divide-y divide-slate-100">
                    <div className="p-6 flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <label htmlFor="change-contact-toggle" className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer block">
                          {t('contractExtend.form.changeContactTitle')}
                        </label>
                        <p className="text-xs text-slate-500">
                          {t('contractExtend.form.changeContactDesc')}
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          id="change-contact-toggle"
                          type="checkbox"
                          checked={changeContact}
                          onChange={(e) => setChangeContact(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {changeContact && (
                      <div className="p-6 bg-slate-50/60 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              {t('contractExtend.form.newPhoneLabel')}
                            </label>
                            <input
                              type="text"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder={t('contractExtend.form.newPhonePlaceholder')}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              {t('contractExtend.form.newAddressLabel')}
                            </label>
                            <input
                              type="text"
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              placeholder={t('contractExtend.form.newAddressPlaceholder')}
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  
                  <div className="p-6 space-y-3">
                    <label className="text-xs sm:text-sm font-bold text-slate-900 block">
                      {t('contractExtend.form.noteLabel')}
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t('contractExtend.form.notePlaceholder')}
                      className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 transition"
                    />
                    <p className="text-[11px] text-slate-400">
                      {t('contractExtend.form.noteHint')}
                    </p>
                  </div>
                </div>
              </div>

              
              <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-16">
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    {t('contractExtend.summary.title')}
                  </h3>

                  
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 block text-[11px]">{t('contractExtend.summary.facilityLabel')}</span>
                    <p className="font-semibold text-slate-800">{facility?.name || t('contractExtend.summary.facilityFallback')}</p>
                    <p className="text-slate-500 text-[11px] line-clamp-1">{facility?.address}</p>
                  </div>

                  
                  <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                    <span className="text-slate-400 block text-[11px]">{t('contractExtend.summary.currentVehicleLabel')}</span>
                    <p className="font-medium text-slate-800">
                      {currentVeh.vehicle_type ? translateVehicleTypeName({ name: currentVeh.vehicle_type }, i18n.language) : t('contractExtend.summary.vehicleFallback')}{' '}
                      <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {currentVeh.license_plate || translateVehicleInfoText(contract.reservation?.vehicle_info, i18n.language) || t('contractExtend.summary.notUpdated')}
                      </span>
                    </p>
                  </div>

                  
                  <div className="space-y-2.5 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>{t('contractExtend.summary.extendDuration')}</span>
                      <strong className="text-slate-900 font-semibold">{t('contractExtend.summary.extendDurationValue', { months: activeMonths })}</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>{t('contractExtend.summary.oldEndDate')}</span>
                      <span className="font-mono text-slate-700">{new Date(contract.end_date).toLocaleDateString(dateLocale)}</span>
                    </div>

                    <div className="flex items-center justify-between text-teal-800 bg-teal-50/70 p-2.5 rounded-lg border border-teal-200">
                      <span className="font-medium">{t('contractExtend.summary.newEndDate')}</span>
                      <strong className="font-mono text-sm font-bold text-teal-700">
                        {calculatedEndDate.toLocaleDateString(dateLocale)}
                      </strong>
                    </div>
                  </div>

                  
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{t('contractExtend.summary.unitRate')}</span>
                      <span>{monthlyPrice.toLocaleString(numberLocale)} {t('contractExtend.summary.unitRateUnit')}</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-slate-900 font-bold block text-sm">{t('contractExtend.summary.totalCostLabel')}</span>
                        <span className="text-[11px] text-slate-400">{t('contractExtend.summary.totalCostCalc', { months: activeMonths, price: monthlyPrice.toLocaleString(numberLocale) })}</span>
                      </div>
                      <span className="text-xl font-bold text-teal-700">
                        {estimatedTotalAmount.toLocaleString(numberLocale)} <span className="text-xs font-normal text-slate-500">{t('contractExtend.summary.currencySuffix')}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                    {t('contractExtend.summary.footnote')}
                  </p>

                  
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('contractExtend.summary.submitting')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{t('contractExtend.summary.submit')}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/contracts/${id}`)}
                      className="w-full py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      {t('contractExtend.summary.cancelBack')}
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
        title={t('contractExtend.cancelConfirm.title')}
        message={t('contractExtend.cancelConfirm.message')}
        confirmText={t('contractExtend.cancelConfirm.confirmText')}
        cancelText={t('contractExtend.cancelConfirm.cancelText')}
        type="danger"
        loading={cancelling}
      />
    </div>
  );
};

export default RequestContractExtensionPage;
