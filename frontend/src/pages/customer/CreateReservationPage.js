import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { sendReservationRequest, getMyReservations } from '../../services/reservationService';
import facilityService from '../../services/facilityService';
import timelineSettingService from '../../services/timelineSettingService';
import Toast from '../../components/common/Toast';
import { getFacilitySupportedTypes } from '../../constants/vehicleTypes';
import {
  translateAmenityName,
  translateDurationText,
  translateVehicleTypeName,
} from '../../utils/translations';
import {
  ArrowLeft,
  Calendar,
  Car,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Building2,
  ShieldCheck,
  Loader2,
  User,
  Phone,
  Mail,
  ChevronRight,
  CreditCard,
  FileText,
  Clock,
} from 'lucide-react';

const CreateReservationPage = () => {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation('customer');
  const tRef = useRef(t);
  tRef.current = t;

  const [facility, setFacility] = useState(location.state?.facility || null);
  const [availability, setAvailability] = useState(null);
  const [fetchingFacility, setFetchingFacility] = useState(!location.state?.facility);
  const [facilityError, setFacilityError] = useState(null);

  const [customerIdCard, setCustomerIdCard] = useState(() => localStorage.getItem('customer_id_card') || '');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [desiredStartDate, setDesiredStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [createdReservation, setCreatedReservation] = useState(null);
  const [timelineSettings, setTimelineSettings] = useState(null);
  const [activeReservation, setActiveReservation] = useState(null);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const minDate = new Date().toISOString().split('T')[0];
  const hasPhone = Boolean(user?.phone_number && user.phone_number.trim());
  const hasAddress = Boolean(user?.address && user.address.trim());
  const numberLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

  const fetchFacilityData = useCallback(async () => {
    const idToFetch = facilityId || location.state?.facility?.id;
    if (!idToFetch) return;

    try {
      setFetchingFacility(true);
      setFacilityError(null);
      const res = await facilityService.getFacilityById(idToFetch);
      const facData = res.data?.facility || res.facility || res.data || res;
      setFacility(facData);

      try {
        const availRes = await facilityService.getFacilityAvailability(idToFetch);
        setAvailability(availRes.data || availRes);
      } catch (availErr) {
        console.warn('Could not fetch availability:', availErr);
      }
    } catch (err) {
      console.error('Error fetching facility details:', err);
      setFacilityError(err.message || tRef.current('createReservation.loadError'));
    } finally {
      setFetchingFacility(false);
    }
  }, [facilityId, location.state]);

  useEffect(() => {
    let isMounted = true;
    const fetchTimelines = async () => {
      try {
        const res = await timelineSettingService.getSettings();
        if (isMounted && res?.data?.calculated) {
          setTimelineSettings(res.data.calculated);
        }
      } catch (err) {
        console.warn('Could not fetch timeline settings:', err?.message);
      }
    };
    fetchTimelines();

    getMyReservations()
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.reservations || res.reservations || [];
        const existing = list.find(
          (r) =>
            r.status === 'PENDING' ||
            (r.status === 'APPROVED' && (!r.confirmation_record || r.confirmation_record.status === 'PENDING_SIGNATURE'))
        );
        if (existing) {
          setActiveReservation(existing);
        }
      })
      .catch((err) => {
        console.warn('Could not check existing customer reservations:', err?.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!facility && facilityId) {
      fetchFacilityData();
    } else if (facility?.id && !availability) {
      facilityService
        .getFacilityAvailability(facility.id)
        .then((availRes) => setAvailability(availRes.data || availRes))
        .catch((err) => console.warn('Could not fetch availability:', err));
    }
  }, [facilityId, facility, fetchFacilityData, availability]);

  const supportedVehicleTypes =
    facility?.facility_vehicle_types && facility.facility_vehicle_types.length > 0
      ? facility.facility_vehicle_types.map((fvt) => ({
          id: fvt.vehicle_type.type_code,
          label: translateVehicleTypeName(fvt.vehicle_type, i18n.language),
          shortLabel: translateVehicleTypeName(fvt.vehicle_type, i18n.language),
        }))
      : getFacilitySupportedTypes(facility?.vehicle_types);

  const handleQuickPreset = (presetText) => {
    setVehicleBrand((prev) => {
      if (!prev) return presetText;
      if (prev.includes(presetText)) return prev;
      return `${prev} - ${presetText}`;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!facility) {
      setFormError(t('createReservation.validation.noFacility'));
      return;
    }

    if (user?.role?.name === 'PROVIDER') {
      setFormError(t('createReservation.validation.providerNotAllowed'));
      return;
    }

    if (availability && availability.available_slots <= 0) {
      setFormError(t('createReservation.validation.noSlots'));
      return;
    }

    if (activeReservation) {
      setFormError(
        t('createReservation.validation.hasActiveReservation', {
          facilityName: activeReservation.facility?.name || t('createReservation.activeAlert.otherFacility'),
        })
      );
      return;
    }

    const userHasPhone = Boolean(user?.phone_number && user.phone_number.trim());
    const userHasAddress = Boolean(user?.address && user.address.trim());

    if (!userHasPhone || !userHasAddress) {
      setFormError(
        !userHasPhone && !userHasAddress
          ? t('createReservation.validation.missingBoth')
          : !userHasPhone
            ? t('createReservation.validation.missingPhone')
            : t('createReservation.validation.missingAddress')
      );
      return;
    }

    if (!customerIdCard?.trim()) {
      setFormError(t('createReservation.validation.idCardRequired'));
      return;
    }

    const cleanIdCard = customerIdCard.trim();
    if (!/^\d{9}$|^\d{12}$/.test(cleanIdCard)) {
      setFormError(t('createReservation.validation.idCardInvalid'));
      return;
    }

    if (!vehicleBrand?.trim() || vehicleBrand.trim().length < 2) {
      setFormError(t('createReservation.validation.brandRequired'));
      return;
    }

    if (!licensePlate?.trim() || licensePlate.trim().length < 3) {
      setFormError(t('createReservation.validation.plateRequired'));
      return;
    }

    if (!desiredStartDate) {
      setFormError(t('createReservation.validation.startDateRequired'));
      return;
    }

    const cleanBrand = vehicleBrand.trim();
    const cleanPlate = licensePlate.trim().toUpperCase();
    const cleanAddress = user.address.trim();

    localStorage.setItem('customer_id_card', cleanIdCard);

    const formattedVehicle = `${cleanBrand} - Biển số: ${cleanPlate}`;
    const fullVehicleInfo = `${formattedVehicle} [CCCD: ${cleanIdCard} | ĐC: ${cleanAddress}]`;

    try {
      setSubmitting(true);
      const response = await sendReservationRequest({
        facility_id: facility.id,
        vehicle_info: fullVehicleInfo,
        desired_start_date: desiredStartDate,
      });

      const resData = response.data?.reservation || response.reservation || { id: 'NEW' };
      const resTimeline = response.data?.timeline || timelineSettings;
      const rawResponseTime =
        resTimeline?.reservationResponseText ||
        resTimeline?.response_time_text ||
        timelineSettings?.reservationResponseText;
      const effectiveResponseTime = rawResponseTime
        ? translateDurationText(rawResponseTime, i18n.language)
        : t('createReservation.defaultResponseTime');

      const resMsg =
        response.message ||
        response.data?.message ||
        t('createReservation.validation.submitSuccess', { duration: effectiveResponseTime });

      setCreatedReservation(resData);
      if (resTimeline) {
        setTimelineSettings((prev) => ({
          ...prev,
          ...resTimeline,
          reservationResponseText:
            resTimeline.reservationResponseText ||
            resTimeline.response_time_text ||
            prev?.reservationResponseText,
        }));
      }
      setToastInfo({ message: resMsg, type: 'success' });
    } catch (err) {
      console.error('Error creating reservation:', err);
      setFormError(err.message || t('createReservation.validation.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const rawResponseTimeText =
    timelineSettings?.reservationResponseText ||
    timelineSettings?.response_time_text;
  const responseTimeText = rawResponseTimeText
    ? translateDurationText(rawResponseTimeText, i18n.language)
    : t('createReservation.defaultResponseTime');

  const primaryImage =
    facility?.images?.find((img) => img.is_primary)?.image_url ||
    facility?.images?.[0]?.image_url ||
    null;

  const monthlyPrice = facility?.price_per_month
    ? Number(facility.price_per_month).toLocaleString(numberLocale)
    : '0';

  const providerName =
    facility?.provider?.full_name || facility?.provider?.name || t('createReservation.providerFallback');

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 w-full">
      <Toast
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo({ message: '', type: 'success' })}
      />
      <div className="w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
            <Link to="/" className="hover:text-teal-700 transition">
              {t('createReservation.breadcrumbs.home')}
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link to="/search" className="hover:text-teal-700 transition">
              {t('createReservation.breadcrumbs.search')}
            </Link>
            {facility && (
              <>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <Link
                  to={`/facility/${facility.id}`}
                  className="hover:text-teal-700 transition truncate max-w-[240px]"
                >
                  {facility.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-semibold">{t('createReservation.breadcrumbs.current')}</span>
          </nav>

          <button
            type="button"
            onClick={() => {
              if (facility?.id) navigate(`/facility/${facility.id}`);
              else navigate(-1);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            {t('createReservation.backToFacility')}
          </button>
        </div>

        {fetchingFacility ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">{t('createReservation.loadingFacility')}</p>
          </div>
        ) : facilityError ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{t('createReservation.notFoundTitle')}</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{facilityError}</p>
            <div className="pt-2">
              <Link
                to="/search"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition"
              >
                {t('createReservation.findAnother')}
              </Link>
            </div>
          </div>
        ) : createdReservation ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start gap-4 bg-emerald-50/40">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2 flex-1">
                <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                  {t('createReservation.success.badge')}
                </span>
                <h1 className="text-xl font-bold text-slate-900">
                  {t('createReservation.success.title')}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t('createReservation.success.subtitleBefore')} <strong className="text-slate-900">{facility?.name}</strong>.
                </p>

                <div className="p-3.5 bg-white rounded-xl border border-emerald-200/90 shadow-2xs text-xs sm:text-sm text-slate-800 flex items-start gap-3 mt-2">
                  <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-emerald-950">{t('createReservation.success.deadlineTitle')} </span>
                    {t('createReservation.success.deadlineBefore')}{' '}
                    <strong className="text-emerald-700 font-bold px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                      {responseTimeText}
                    </strong>{' '}
                    {t('createReservation.success.deadlineAfter')}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">{t('createReservation.success.facility')}</span>
                  <span className="font-semibold text-slate-900">{facility?.name}</span>
                </div>
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">{t('createReservation.success.vehicle')}</span>
                  <span className="font-semibold text-slate-900">{vehicleBrand}</span>
                </div>
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">{t('createReservation.success.licensePlate')}</span>
                  <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {licensePlate.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">{t('createReservation.success.idCard')}</span>
                  <span className="font-medium text-slate-900">{customerIdCard}</span>
                </div>
                <div className="flex justify-between py-3 px-4 gap-4">
                  <span className="text-slate-500 shrink-0">{t('createReservation.success.address')}</span>
                  <span className="font-medium text-slate-900 text-right">{user?.address}</span>
                </div>
                <div className="flex justify-between py-3 px-4">
                  <span className="text-slate-500">{t('createReservation.success.startDate')}</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(desiredStartDate).toLocaleDateString(numberLocale)}
                  </span>
                </div>
                <div className="flex justify-between py-3.5 px-4 bg-slate-50/80 rounded-b-xl">
                  <span className="text-slate-700 font-medium">{t('createReservation.success.monthlyPrice')}</span>
                  <span className="font-bold text-teal-700 text-base">
                    {t('createReservation.success.monthlyPriceValue', { price: monthlyPrice })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                <Link
                  to={`/facility/${facility?.id}`}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm text-center transition"
                >
                  {t('createReservation.success.backToFacility')}
                </Link>
                <Link
                  to="/my-reservations"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm text-center shadow-xs transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {t('createReservation.success.viewMyReservations')}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 sm:px-8 py-6 border-b border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {t('createReservation.header.title')}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      {t('createReservation.header.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-teal-700 font-semibold">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="truncate">{t('createReservation.steps.step1')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="truncate">{t('createReservation.steps.step2')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span className="truncate">{t('createReservation.steps.step3')}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
                {activeReservation && (
                  <div className="px-6 sm:px-8 pt-6">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-900">
                            {t('createReservation.activeAlert.title', { id: activeReservation.id })}
                          </p>
                          <p className="text-xs text-amber-800 mt-0.5">
                            {t('createReservation.activeAlert.descBefore')}{' '}
                            <strong>"{activeReservation.facility?.name || t('createReservation.activeAlert.otherFacility')}"</strong>.{' '}
                            {t('createReservation.activeAlert.descAfter')}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/my-reservations"
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg whitespace-nowrap transition"
                      >
                        {t('createReservation.activeAlert.manageButton')}
                      </Link>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="px-6 sm:px-8 pt-6">
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  </div>
                )}

                <div className="p-6 sm:px-8 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-teal-600 rounded-full" />
                    <h2 className="text-base font-bold text-slate-900">
                      {t('createReservation.applicantSection.title')}
                    </h2>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden border border-teal-500/30">
                          {user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user?.full_name || 'User'}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : user?.full_name ? (
                            user.full_name.charAt(0).toUpperCase()
                          ) : (
                            'U'
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {user?.full_name || t('createReservation.customerFallback')}
                          </p>
                          <p className="text-xs text-slate-500">{t('createReservation.applicantSection.roleNote')}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs sm:text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          <span className={`font-medium ${hasPhone ? 'text-slate-800' : 'text-amber-600 font-semibold'}`}>
                            {user?.phone_number || t('createReservation.applicantSection.noPhone')}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-slate-700">{user?.email}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/60 flex items-start gap-2 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">
                          {t('createReservation.applicantSection.addressLabel')}{' '}
                        </span>
                        <span className={hasAddress ? 'text-slate-900 font-medium' : 'text-amber-600 font-semibold italic'}>
                          {user?.address || t('createReservation.applicantSection.noAddress')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(!hasPhone || !hasAddress) && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                      <div className="flex items-start sm:items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                        <span>
                          {!hasPhone && !hasAddress
                            ? t('createReservation.applicantSection.missingBoth')
                            : !hasPhone
                              ? t('createReservation.applicantSection.missingPhone')
                              : t('createReservation.applicantSection.missingAddress')}
                        </span>
                      </div>
                      <Link
                        to="/profile"
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 transition text-center shadow-sm"
                      >
                        {t('createReservation.applicantSection.updateProfile')}
                      </Link>
                    </div>
                  )}

                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('createReservation.applicantSection.idCardLabel')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={customerIdCard}
                        onChange={(e) => setCustomerIdCard(e.target.value.replace(/\D/g, ''))}
                        placeholder={t('createReservation.applicantSection.idCardPlaceholder')}
                        maxLength={12}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {t('createReservation.applicantSection.idCardHint')}
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:px-8 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-teal-600 rounded-full" />
                    <h2 className="text-base font-bold text-slate-900">
                      {t('createReservation.vehicleSection.title')}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {t('createReservation.vehicleSection.brandLabel')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Car className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={vehicleBrand}
                          onChange={(e) => setVehicleBrand(e.target.value)}
                          placeholder={t('createReservation.vehicleSection.brandPlaceholder')}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                        />
                      </div>

                      {supportedVehicleTypes && supportedVehicleTypes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-xs text-slate-400">
                            {t('createReservation.vehicleSection.presetHint')}
                          </span>
                          {supportedVehicleTypes.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleQuickPreset(preset.shortLabel || preset.label)}
                              className="px-2.5 py-1 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium transition cursor-pointer"
                            >
                              + {preset.shortLabel || preset.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {t('createReservation.vehicleSection.plateLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                        placeholder={t('createReservation.vehicleSection.platePlaceholder')}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 tracking-wider uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                      />
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        {t('createReservation.vehicleSection.plateHint')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:px-8 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-teal-600 rounded-full" />
                    <h2 className="text-base font-bold text-slate-900">
                      {t('createReservation.startDateSection.title')}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {t('createReservation.startDateSection.startDateLabel')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="date"
                          required
                          min={minDate}
                          value={desiredStartDate}
                          onChange={(e) => setDesiredStartDate(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 text-xs text-slate-700 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-teal-900">
                        <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        {t('createReservation.startDateSection.deadlineTitle')}
                      </div>
                      <p className="leading-relaxed text-slate-600">
                        {t('createReservation.startDateSection.deadlineBefore')}{' '}
                        <strong className="text-teal-800 font-semibold">{responseTimeText}</strong>{' '}
                        {t('createReservation.startDateSection.deadlineAfter')}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        {t('createReservation.startDateSection.termTitle')}
                      </div>
                      <p className="leading-relaxed text-slate-500">
                        {t('createReservation.startDateSection.termDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 sm:px-8 py-4 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-teal-800 font-medium bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60">
                      <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>
                        {t('createReservation.footer.deadlineLabel')} <strong>{responseTimeText}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{t('createReservation.footer.privacyNote')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (facility?.id) navigate(`/facility/${facility.id}`);
                        else navigate(-1);
                      }}
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
                    >
                      {t('createReservation.footer.cancel')}
                    </button>

                    <button
                      type="submit"
                      disabled={submitting || Boolean(activeReservation)}
                      className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm shadow-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('createReservation.footer.submitting')}
                        </>
                      ) : activeReservation ? (
                        t('createReservation.footer.alreadyPending')
                      ) : (
                        t('createReservation.footer.submit')
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3 pb-0">
                  <div className="h-52 rounded-xl bg-slate-100 relative overflow-hidden border border-slate-200/60">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={facility?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Building2 className="w-10 h-10 mb-1.5" />
                        <span className="text-xs font-medium">{t('createReservation.sidebar.noImage')}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                    {availability && (
                      <span
                        className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs ${
                          availability.available_slots > 0
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {availability.available_slots > 0
                          ? t('createReservation.sidebar.slotsLeft', { count: availability.available_slots })
                          : t('createReservation.sidebar.fullSlots')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {facility?.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>{facility?.address}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/70 flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-600">
                      {t('createReservation.sidebar.monthlyRate')}
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-teal-800">{monthlyPrice}</span>
                      <span className="text-xs text-slate-500 ml-1">
                        {t('createReservation.sidebar.currencyUnit')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {t('createReservation.sidebar.provider')}
                      </span>
                      <span className="font-semibold text-slate-800">{providerName}</span>
                    </div>

                    {facility?.provider?.phone_number && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {t('createReservation.sidebar.phone')}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {facility.provider.phone_number}
                        </span>
                      </div>
                    )}

                    {facility?.total_slots && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          {t('createReservation.sidebar.totalCapacity')}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {t('createReservation.sidebar.slotsUnit', { count: facility.total_slots })}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {t('createReservation.sidebar.responseDeadline')}
                      </span>
                      <span className="font-semibold text-teal-800">
                        {responseTimeText}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold">{t('createReservation.sidebar.deadlineBannerTitle')}</span>{' '}
                      {t('createReservation.sidebar.deadlineBannerBefore')}{' '}
                      <strong className="font-semibold underline">{responseTimeText}</strong>{' '}
                      {t('createReservation.sidebar.deadlineBannerAfter')}
                    </div>
                  </div>

                  {facility?.facility_amenities && facility.facility_amenities.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-semibold text-slate-700 block">
                        {t('createReservation.sidebar.amenitiesTitle')}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {facility.facility_amenities.map((fa) => (
                          <span
                            key={fa.amenity?.id || fa.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 text-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                            {translateAmenityName(fa.amenity?.name, i18n.language) ||
                              t('createReservation.sidebar.amenityFallback')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateReservationPage;
