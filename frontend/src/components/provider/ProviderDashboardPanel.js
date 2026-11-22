import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, MapPin, Edit3, X, Minus, Plus, Car, CheckCircle2,
  AlertCircle, Lock, CircleDollarSign, Eye, EyeOff, Sparkles, Save,
  RefreshCw, Clock, Image as ImageIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import providerService from '../../services/providerService';
import { getProviderReservations } from '../../services/reservationService';
import Toast from '../common/Toast';

const ProviderDashboardPanel = ({ onNavigateToTab }) => {
  const { t } = useTranslation('provider');
  const { user, refreshUser } = useAuth();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });
  const [facilityStats, setFacilityStats] = useState(null);
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    available_slots: 0,
    price_per_month: '',
    visibility_status: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  const fetchFacilityData = useCallback(async () => {
    try {
      setLoading(true);
      const [facilityRes, reservationsRes] = await Promise.allSettled([
        providerService.getMyFacility(),
        getProviderReservations()
      ]);

      if (facilityRes.status === 'fulfilled') {
        const res = facilityRes.value;
        const facilityData = res?.facility || res?.data?.facility || res?.data || res;
        if (facilityData && (facilityData.id || facilityData.capacity)) {
          setFacilityStats(facilityData);
        }
      }

      if (reservationsRes.status === 'fulfilled') {
        const resRes = reservationsRes.value;
        const list = resRes?.data?.reservations || resRes?.reservations || (Array.isArray(resRes) ? resRes : []);
        const pending = list.filter((r) => r.status === 'PENDING').length;
        setPendingReservationsCount(pending);
      }
    } catch (err) {
      console.warn("Không thể tải thông tin bãi đỗ xe chi tiết:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilityData();
  }, [fetchFacilityData]);

  const currentFacility = facilityStats || user?.facility;
  const totalCapacity = currentFacility?.capacity || 0;
  const activeContracts = currentFacility?.active_contracts !== undefined ? Number(currentFacility.active_contracts) : 0;
  const rawAvailable = currentFacility?.available_slots !== undefined && currentFacility?.available_slots !== null
    ? Number(currentFacility.available_slots)
    : Math.max(0, totalCapacity - activeContracts);
  const currentAvailableSlots = activeContracts > 0
    ? Math.min(rawAvailable, Math.max(0, totalCapacity - activeContracts))
    : rawAvailable;
  const occupiedSlots = activeContracts > 0 ? activeContracts : Math.max(0, totalCapacity - currentAvailableSlots);

  const handleOpenEdit = () => {
    setEditData({
      available_slots: currentAvailableSlots,
      price_per_month: currentFacility?.price_per_month || '',
      visibility_status: currentFacility?.visibility_status || 'VISIBLE'
    });
    setIsEditing(true);
  };

  const handleSlotStep = (delta) => {
    const current = parseInt(editData.available_slots, 10) || 0;
    const nextVal = Math.min(totalCapacity, Math.max(0, current + delta));
    setEditData((prev) => ({ ...prev, available_slots: nextVal }));
  };

  const handleQuickPreset = (slots) => {
    const val = Math.min(totalCapacity, Math.max(0, slots));
    setEditData((prev) => ({ ...prev, available_slots: val }));
  };

  const handlePriceQuickAdjust = (delta) => {
    const currentPrice = Number(editData.price_per_month) || 0;
    const nextPrice = Math.max(0, currentPrice + delta);
    setEditData((prev) => ({ ...prev, price_per_month: nextPrice }));
  };

  const handleUpdateFacility = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const slotsNum = parseInt(editData.available_slots, 10);

      if (isNaN(slotsNum) || slotsNum < 0) {
        setToastInfo({ message: t('dashboard.editModal.validation.slotsNonNegative'), type: 'error' });
        return;
      }

      if (slotsNum > totalCapacity) {
        setToastInfo({
          message: t('dashboard.editModal.validation.slotsExceedCapacity', { slots: slotsNum, capacity: totalCapacity }),
          type: 'error'
        });
        return;
      }

      const res = await providerService.updateMyFacility({
        available_slots: slotsNum,
        price_per_month: Number(editData.price_per_month),
        visibility_status: editData.visibility_status
      });

      const updatedFac = res?.facility || res?.data?.facility || res?.data || res;
      if (updatedFac && (updatedFac.id || updatedFac.capacity)) {
        setFacilityStats(updatedFac);
      }

      await refreshUser();
      await fetchFacilityData();

      setToastInfo({
        message: t('dashboard.editModal.toasts.updateSuccess', { slots: slotsNum, capacity: totalCapacity }),
        type: 'success'
      });
      setIsEditing(false);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || t('dashboard.editModal.toasts.updateError');
      setToastInfo({ message: errorMsg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let intervalId;
    if (user?.facility?.verification_status === 'APPROVED' && user?.facility?.payment_status !== 'PAID') {
      intervalId = setInterval(async () => {
        try {
          const res = await authService.getCurrentUser();
          const latestFacility = res.data?.user?.facility;
          if (latestFacility && latestFacility.payment_status === 'PAID') {
            clearInterval(intervalId);
            setPaymentSuccess(true);
            await refreshUser();
            await fetchFacilityData();
            setTimeout(() => {
              setPaymentSuccess(false);
            }, 3000);
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
        }
      }, 5000); 
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, refreshUser, fetchFacilityData]);

  const handleCheckPayment = async () => {
    try {
      setIsPaying(true);
      const res = await authService.getCurrentUser();
      const latestFacility = res.data?.user?.facility;

      if (latestFacility && latestFacility.payment_status === 'PAID') {
        setPaymentSuccess(true);
        setToastInfo({ message: t('dashboard.payment.toasts.success'), type: 'success' });
        await refreshUser();
        await fetchFacilityData();
        setTimeout(() => {
          setPaymentSuccess(false);
        }, 3000);
      } else {
        setToastInfo({ message: t('dashboard.payment.toasts.notReceived'), type: 'error' });
      }
    } catch (err) {
      setToastInfo({ message: t('dashboard.payment.toasts.checkError'), type: 'error' });
    } finally {
      setIsPaying(false);
    }
  };

  if (!user?.facility) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-md text-center py-16">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-700">{t('dashboard.empty.title')}</h3>
        <p className="text-sm text-gray-500 mt-1">{t('dashboard.empty.subtitle')}</p>
      </div>
    );
  }

  const slotPercent = totalCapacity > 0 ? Math.round((currentAvailableSlots / totalCapacity) * 100) : 0;
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedSlots / totalCapacity) * 100) : 0;
  const editSlotPercent = totalCapacity > 0 ? Math.round((Number(editData.available_slots || 0) / totalCapacity) * 100) : 0;
  const editOccupiedSlots = Math.max(0, totalCapacity - Number(editData.available_slots || 0));

  const monthlyPrice = Number(currentFacility.price_per_month) || 0;
  const estimatedMonthlyRevenue = activeContracts * monthlyPrice;

  const facilityImages = currentFacility.images || [];

  return (
    <>
      <div className="space-y-6">
        <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-200">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-neighbor-600" /> {t('dashboard.title')}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {t('dashboard.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border ${currentFacility.verification_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                currentFacility.verification_status === 'REJECTED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                  'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                <Clock className="w-3.5 h-3.5" />
                {currentFacility.verification_status === 'APPROVED' ? t('dashboard.verificationStatus.APPROVED') :
                  currentFacility.verification_status === 'REJECTED' ? t('dashboard.verificationStatus.REJECTED') : t('dashboard.verificationStatus.PENDING')}
              </span>

              <button
                onClick={handleOpenEdit}
                className="px-4 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" /> {t('dashboard.actions.updateSlotsAndPrice')}
              </button>

              <button
                onClick={fetchFacilityData}
                disabled={loading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-gray-200"
                title={t('dashboard.actions.refreshTitle')}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('dashboard.actions.refresh')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
            <div className="p-5">
              <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>{t('dashboard.kpis.availableSlots.label')}</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-black text-emerald-950">{currentAvailableSlots}</span>
                <span className="text-xs font-bold text-emerald-700">/ {totalCapacity} {t('dashboard.kpis.availableSlots.unit')}</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${slotPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{t('dashboard.kpis.availableSlots.hint', { percent: slotPercent })}</p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>{t('dashboard.kpis.occupied.label')}</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-blue-950">{occupiedSlots}</span>
                <span className="text-xs font-semibold text-blue-700">{t('dashboard.kpis.occupied.unit')}</span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 ml-auto">
                  {occupancyRate}%
                </span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, occupancyRate)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{t('dashboard.kpis.occupied.hint')}</p>
            </div>

            <div
              onClick={() => onNavigateToTab && onNavigateToTab('reservations')}
              className={`p-5 transition ${onNavigateToTab ? 'cursor-pointer hover:bg-gray-50' : ''} ${pendingReservationsCount > 0 ? 'bg-amber-50/30' : ''}`}
              title={onNavigateToTab ? t('dashboard.kpis.pendingRequests.tooltip') : undefined}
            >
              <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>{t('dashboard.kpis.pendingRequests.label')}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pendingReservationsCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-2xl font-black ${pendingReservationsCount > 0 ? 'text-amber-950' : 'text-gray-900'
                  }`}>
                  {pendingReservationsCount}
                </span>
                <span className="text-xs font-semibold text-gray-500">{t('dashboard.kpis.pendingRequests.unit')}</span>
                {pendingReservationsCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white ml-auto animate-pulse">
                    {t('dashboard.kpis.pendingRequests.actionRequired')}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pendingReservationsCount > 0 ? 100 : 0}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium flex items-center justify-between">
                <span>{t('dashboard.kpis.pendingRequests.hint')}</span>
                {onNavigateToTab && <span className="text-neighbor-700 font-bold hover:underline">{t('dashboard.kpis.pendingRequests.viewDetails')} &rarr;</span>}
              </p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>{t('dashboard.kpis.projectedRevenue.label')}</span>
                <div className="w-8 h-8 rounded-lg bg-neighbor-50 text-neighbor-600 flex items-center justify-center">
                  <CircleDollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-neighbor-950 mt-2 truncate">
                {estimatedMonthlyRevenue.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-neighbor-700">{t('dashboard.kpis.projectedRevenue.currency')}</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-neighbor-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, occupancyRate)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 font-medium truncate">
                {t('dashboard.kpis.projectedRevenue.formula', { count: activeContracts, price: monthlyPrice.toLocaleString('vi-VN') })}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-neighbor-600" /> {t('dashboard.facilityDetails.title')}
              </h3>
              <div className="flex items-center gap-2">
                {currentFacility.visibility_status === 'VISIBLE' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Eye className="w-3.5 h-3.5" /> {t('dashboard.facilityDetails.visibility.visible')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <EyeOff className="w-3.5 h-3.5" /> {t('dashboard.facilityDetails.visibility.hidden')}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-400 font-semibold uppercase tracking-wider">{t('dashboard.facilityDetails.nameLabel')}</span>
                <p className="text-base font-bold text-gray-900">{currentFacility.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-gray-400 font-semibold uppercase tracking-wider">{t('dashboard.facilityDetails.addressLabel')}</span>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neighbor-600 shrink-0" /> {currentFacility.address}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-neighbor-600" />
                  {t('dashboard.facilityDetails.photosTitle')} {facilityImages.length > 0 ? `(${facilityImages.length})` : ''}
                </span>
                {facilityImages.length > 0 && (
                  <span className="text-[11px] text-gray-400">
                    {t('dashboard.facilityDetails.zoomHint')}
                  </span>
                )}
              </div>

              {facilityImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {facilityImages.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      onClick={() => setSelectedImagePreview(img.image_url)}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer shadow-xs hover:shadow-md transition duration-200"
                    >
                      <img
                        src={img.image_url}
                        alt={t('dashboard.facilityDetails.photoAlt', { index: idx + 1 })}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gray-950/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="p-1.5 bg-white/90 rounded-lg text-gray-800 shadow-sm">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      {img.is_primary && (
                        <span className="absolute top-2 left-2 bg-neighbor-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          {t('dashboard.facilityDetails.primaryBadge')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                  <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-500 font-medium">{t('dashboard.facilityDetails.noPhotos')}</p>
                </div>
              )}
            </div>

            {currentFacility.verification_status === 'APPROVED' && currentFacility.payment_status === 'UNPAID' && (
              <div className="mt-4 p-6 border-2 border-dashed border-neighbor-200 rounded-xl bg-neighbor-50 text-center space-y-4">
                <h4 className="font-bold text-neighbor-900 text-base">{t('dashboard.payment.title')}</h4>
                <p className="text-xs text-neighbor-800 max-w-lg mx-auto">
                  {t('dashboard.payment.description')}
                </p>

                <div className="flex justify-center my-3">
                  <img
                    src={`https://img.vietqr.io/image/MB-881666787988-compact2.png?amount=${currentFacility.system_fee / 100}&addInfo=${encodeURIComponent('PARKLINK F' + currentFacility.id)}&accountName=PARKLINK`}
                    alt={t('dashboard.payment.qrAlt')}
                    className="w-44 h-44 rounded-xl shadow-md border-2 border-white"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    disabled={isPaying}
                    onClick={handleCheckPayment}
                    className="px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {isPaying ? t('dashboard.payment.checking') : t('dashboard.payment.checkButton')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {}
      {selectedImagePreview && (
        <div
          className="fixed inset-0 !m-0 z-[120] bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImagePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl p-3 shadow-2xl overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-900/70 hover:bg-gray-900 text-white flex items-center justify-center transition z-10"
              title={t('dashboard.facilityDetails.closePhoto')}
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImagePreview}
              alt={t('dashboard.facilityDetails.lightboxAlt')}
              className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {}
      {paymentSuccess && (
        <div className="fixed inset-0 !m-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-white p-8 max-w-md w-full text-center shadow-2xl rounded-xl border border-gray-200">
            <div className="w-20 h-20 bg-neighbor-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-neighbor-200">
              <CheckCircle2 className="w-10 h-10 text-neighbor-600 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('dashboard.payment.successTitle')}</h3>
            <p className="text-gray-600 text-xs mb-6">
              {t('dashboard.payment.successBody')}
            </p>
            <div className="w-full bg-gray-100 h-1.5 overflow-hidden rounded-full">
              <div className="bg-neighbor-500 h-full rounded-full w-full transition-all duration-1000"></div>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 !m-0 z-[100] flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl border border-gray-200 p-6 sm:p-8 space-y-6 animate-scaleUp">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neighbor-50 text-neighbor-600 border border-neighbor-100 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {t('dashboard.editModal.title')}
                  </h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {t('dashboard.editModal.subtitle')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition shrink-0"
                title={t('dashboard.editModal.closeTitle')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {}
            <form onSubmit={handleUpdateFacility} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {}
                <div className="space-y-4">
                  {}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl text-xs">
                      <div className="flex items-center justify-between text-gray-500 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-gray-400" /> {t('dashboard.editModal.capacityLabel')}
                        </span>
                        <span className="bg-gray-200/70 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{t('dashboard.editModal.fixedBadge')}</span>
                      </div>
                      <p className="text-lg font-black text-gray-900">{totalCapacity} <span className="text-xs font-semibold text-gray-500">{t('dashboard.editModal.slotsUnit')}</span></p>
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs">
                      <div className="flex items-center justify-between text-blue-700 font-bold mb-1">
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3 text-blue-500" /> {t('dashboard.editModal.occupiedLabel')}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">{t('dashboard.editModal.liveBadge')}</span>
                      </div>
                      <p className="text-lg font-black text-blue-950">{editOccupiedSlots} <span className="text-xs font-semibold text-blue-700">{t('dashboard.editModal.vehiclesUnit')}</span></p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-neighbor-600" />
                        {t('dashboard.editModal.availableSlotsLabel')} <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-neighbor-100 text-neighbor-800 border border-neighbor-200">
                        {t('dashboard.editModal.percentVacant', { percent: editSlotPercent })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleSlotStep(-1)}
                        disabled={Number(editData.available_slots) <= 0}
                        className="w-11 h-11 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-gray-800 font-bold flex items-center justify-center transition shrink-0"
                        title={t('dashboard.editModal.decreaseTitle')}
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 text-center">
                        <input
                          type="number"
                          required
                          min="0"
                          max={totalCapacity}
                          step="1"
                          className="w-24 text-3xl font-black text-neighbor-900 text-center bg-transparent focus:outline-none p-0"
                          value={editData.available_slots}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setEditData({ ...editData, available_slots: val });
                          }}
                        />
                        <span className="text-[11px] font-semibold text-gray-400 block mt-0.5">
                          {t('dashboard.editModal.maxSlotsHint', { total: totalCapacity })}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSlotStep(1)}
                        disabled={Number(editData.available_slots) >= totalCapacity}
                        className="w-11 h-11 rounded-lg bg-neighbor-600 hover:bg-neighbor-700 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center justify-center transition shrink-0 shadow-sm"
                        title={t('dashboard.editModal.increaseTitle')}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="w-full bg-gray-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-neighbor-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, editSlotPercent))}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[11px] text-gray-400 font-medium">{t('dashboard.editModal.quickSelect')}</span>
                      <button
                        type="button"
                        onClick={() => handleQuickPreset(0)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${Number(editData.available_slots) === 0
                          ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                      >
                        {t('dashboard.editModal.presetEmpty')}
                      </button>
                      {totalCapacity > 2 && (
                        <button
                          type="button"
                          onClick={() => handleQuickPreset(Math.floor(totalCapacity / 2))}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${Number(editData.available_slots) === Math.floor(totalCapacity / 2)
                            ? 'bg-neighbor-50 text-neighbor-800 border-neighbor-300 font-bold'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                        >
                          {t('dashboard.editModal.presetHalf', { count: Math.floor(totalCapacity / 2) })}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleQuickPreset(totalCapacity)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${Number(editData.available_slots) === totalCapacity
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                      >
                        {t('dashboard.editModal.presetFull', { count: totalCapacity })}
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-500 flex items-start gap-1 font-medium pt-1 border-t border-gray-200/60">
                      <AlertCircle className="w-3.5 h-3.5 text-neighbor-600 shrink-0 mt-0.5" />
                      <span>{t('dashboard.editModal.stepperNotePrefix')} <strong>(-)</strong> {t('dashboard.editModal.stepperNoteMinusAction')} <strong>(+)</strong> {t('dashboard.editModal.stepperNotePlusAction')}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-bold text-gray-800 flex items-center gap-1">
                        <CircleDollarSign className="w-3.5 h-3.5 text-neighbor-600" />
                        {t('dashboard.editModal.monthlyPriceLabel')} <span className="text-red-500">*</span>
                      </label>
                      {editData.price_per_month !== '' && !isNaN(Number(editData.price_per_month)) && (
                        <span className="font-bold text-neighbor-700 bg-neighbor-50 px-2 py-0.5 rounded border border-neighbor-100">
                          {Number(editData.price_per_month).toLocaleString('vi-VN')} {t('dashboard.editModal.priceBadgeUnit')}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        step="50000"
                        className="w-full px-3.5 py-2.5 text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500 bg-white"
                        placeholder={t('dashboard.editModal.pricePlaceholder')}
                        value={editData.price_per_month}
                        onChange={(e) => setEditData({ ...editData, price_per_month: e.target.value })}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px] pointer-events-none">
                        {t('dashboard.editModal.priceInputSuffix')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] text-gray-400 font-medium">{t('dashboard.editModal.quickAdjust')}</span>
                      <button
                        type="button"
                        onClick={() => handlePriceQuickAdjust(-100000)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition border border-gray-200"
                      >
                        -100k
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePriceQuickAdjust(100000)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-800 transition border border-neighbor-200"
                      >
                        +100k
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePriceQuickAdjust(500000)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-800 transition border border-neighbor-200"
                      >
                        +500k
                      </button>
                    </div>
                  </div>

                  {currentFacility.payment_status === 'PAID' && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5">
                      <label className="text-xs font-bold text-gray-800 block">
                        {t('dashboard.editModal.visibilityLabel')}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div
                          onClick={() => setEditData({ ...editData, visibility_status: 'VISIBLE' })}
                          className={`cursor-pointer p-3 rounded-xl border-2 transition flex items-center gap-2.5 ${editData.visibility_status === 'VISIBLE'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${editData.visibility_status === 'VISIBLE' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            <Eye className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t('dashboard.editModal.visibilityVisibleTitle')}</p>
                            <p className="text-[10px] text-gray-500">{t('dashboard.editModal.visibilityVisibleSub')}</p>
                          </div>
                        </div>

                        <div
                          onClick={() => setEditData({ ...editData, visibility_status: 'HIDDEN' })}
                          className={`cursor-pointer p-3 rounded-xl border-2 transition flex items-center gap-2.5 ${editData.visibility_status === 'HIDDEN'
                            ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${editData.visibility_status === 'HIDDEN' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            <EyeOff className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t('dashboard.editModal.visibilityHiddenTitle')}</p>
                            <p className="text-[10px] text-gray-500">{t('dashboard.editModal.visibilityHiddenSub')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition text-xs"
                >
                  {t('dashboard.editModal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {t('dashboard.editModal.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      {t('dashboard.editModal.saveChanges')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProviderDashboardPanel;
