import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { facilityCarIcon } from '../../utils/mapIcons';
import {
  openGoogleMapsDirections,
  SEA_MAP_BOUNDS,
  VIETNAM_SEA_MAP_OPTIONS,
} from '../../utils/mapUtils';
import { translateAmenityName, translateVehicleTypeName } from '../../utils/translations';
import ReviewSection from '../../components/common/ReviewSection';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import facilityService from '../../services/facilityService';
import { addFavorite, removeFavorite, getFavorites } from '../../services/favoriteService';
import {
  Send, MapPin, ShieldCheck, Car, MessageCircle, Heart, CheckCircle2,
  Loader2, ChevronLeft, ChevronRight, Navigation, LockKeyhole,
  UserRound, FileText, Star, ExternalLink
} from 'lucide-react';

const FacilityDetailPage = () => {
  const { t, i18n } = useTranslation('facility');
  const tRef = useRef(t);
  tRef.current = t;

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, token } = useAuth();
  const facilityId = parseInt(id, 10);

  const savedSearch = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('parklink_last_search') || '{}');
    } catch {
      return {};
    }
  })();

  const preferredOriginCoords = location.state?.originCoords || savedSearch.coords || savedSearch.originCoords;
  const preferredOriginAddress = location.state?.originAddress || savedSearch.address || savedSearch.originAddress;

  const [facility, setFacility] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await facilityService.getFacilityDetails(facilityId);
      if (res.status === 'success' && res.data) {
        setFacility(res.data);
      } else {
        setFacility(null);
      }
    } catch (err) {
      console.error(err);
      setToastMsg(tRef.current('detail.toasts.fetchError'));
      setToastType('error');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [facilityId]);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await facilityService.getFacilityAvailability(facilityId);
      if (res.status === 'success' && res.data) {
        setAvailability(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [facilityId]);

  const handleGetDirections = () => {
    if (!facility) return;
    const destLat = Number(facility.latitude);
    const destLng = Number(facility.longitude);
    const destination = (Number.isFinite(destLat) && Number.isFinite(destLng))
      ? [destLat, destLng]
      : facility.address;

    const opened = openGoogleMapsDirections({
      origin: preferredOriginCoords || preferredOriginAddress,
      destination,
    });

    setToastMsg(opened
      ? t('detail.toasts.openingDirections', { name: facility.name })
      : t('detail.toasts.popupBlocked'));
    setToastType(opened ? 'success' : 'error');
  };

  const handleOpenReservation = () => {
    if (!isAuthenticated) {
      setToastMsg(t('detail.toasts.loginToReserve'));
      setToastType('error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (user?.role?.name !== 'CUSTOMER') {
      setToastMsg(t('detail.toasts.customerRoleRequired'));
      setToastType('error');
      return;
    }
    navigate(`/customer/reservations/create?facilityId=${facilityId}`, {
      state: {
        facility,
        availability,
        facilityVehicleTypes: facility.facility_vehicle_types || [],
      },
    });
  };

  useEffect(() => {
    fetchData();
    fetchAvailability();
  }, [fetchData, fetchAvailability]);

  useEffect(() => {
    if (!isAuthenticated || user?.role?.name !== 'CUSTOMER') {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    getFavorites()
      .then((favs) => {
        if (cancelled) return;
        const exists = favs.some((f) => Number(f.id ?? f.facility_id ?? f.facility?.id) === Number(facilityId));
        setIsFavorite(exists);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      cancelled = true;
    };
  }, [facilityId, isAuthenticated, user?.role?.name]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      setToastMsg(t('detail.toasts.loginCustomerToSave'));
      setToastType('error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite(facilityId);
        setIsFavorite(false);
        setToastMsg(t('detail.toasts.favoriteRemoved'));
      } else {
        await addFavorite(facilityId);
        setIsFavorite(true);
        setToastMsg(t('detail.toasts.favoriteAdded'));
      }
      setToastType('success');
    } catch (error) {
      setToastMsg(error.message || t('detail.toasts.favoriteError'));
      setToastType('error');
    }
  };

  const handleChatClick = async () => {
    if (isChatLoading) return;
    if (!isAuthenticated) {
      setToastMsg(t('detail.toasts.loginToChat'));
      setToastType('error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (user?.role?.name === 'PROVIDER') {
      setToastMsg(t('detail.toasts.selfChatError'));
      setToastType('error');
      return;
    }

    try {
      setIsChatLoading(true);
      const providerId = facility.provider_id;
      const res = await chatService.getOrCreateRoom(user.id, providerId, facilityId, token);
      if (res.success) {
        navigate('/chat', { state: { activeRoomId: res.data.id } });
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message;
      setToastMsg(t('detail.toasts.chatRoomError', { message: errorMsg }));
      setToastType('error');
    } finally {
      setIsChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-neighbor-600 animate-spin" />
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('detail.notFoundTitle')}</h2>
          <button
            onClick={() => navigate('/')}
            className="text-neighbor-600 font-semibold hover:underline cursor-pointer"
          >
            {t('detail.backHome')}
          </button>
        </div>
      </div>
    );
  }

  const images = facility.images || [];
  const currentImage = images[activeImage] || images[0];
  const facilityCode = `FAC-${String(facility.id).padStart(4, '0')}`;
  const activeVehicleTypes = (Array.isArray(facility.facility_vehicle_types) ? facility.facility_vehicle_types : [])
    .map((fvt) => fvt.vehicle_type)
    .filter((vt) => vt && vt.name);
  const providerName = facility.provider?.full_name || t('detail.fallbackProvider');
  const latitude = Number(facility.latitude);
  const longitude = Number(facility.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const vietmapTileKey = process.env.REACT_APP_VIETMAP_TILE_KEY;
  const formatPrice = (value) => Number(value || 0).toLocaleString(i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN');

  const effectiveAvailableSlots = availability
    ? (availability.available_slots !== undefined && availability.available_slots !== null
      ? availability.available_slots
      : Math.max(0, availability.capacity - (availability.active_contracts || 0)))
    : (facility?.available_slots !== undefined && facility?.available_slots !== null
      ? facility.available_slots
      : Math.max(0, (facility?.capacity || 0) - (facility?.active_contracts || 0)));

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
            <button onClick={() => navigate('/')} className="hover:text-neighbor-700 transition-colors cursor-pointer">{t('detail.breadcrumbHome')}</button>
            <span>/</span>
            <button onClick={() => navigate('/search')} className="hover:text-neighbor-700 transition-colors cursor-pointer">{t('detail.breadcrumbSearch')}</button>
            <span>/</span>
            <span className="text-neighbor-700 font-semibold truncate max-w-[220px]">{facility.name}</span>
          </nav>
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-600 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-400">{t('detail.facilityCode')}</span>
            <strong className="text-gray-800">{facilityCode}</strong>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8">
              <div className="relative w-full aspect-[4/3] max-h-[500px] rounded-xl overflow-hidden border border-gray-200 bg-gray-900 shadow-inner">
                {currentImage ? (
                  <>
                    <img
                      src={currentImage.image_url}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                    />
                    <img
                      src={currentImage.image_url}
                      alt={facility.name}
                      className="relative z-10 w-full h-full object-contain p-2"
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Car className="w-12 h-12 text-gray-600" />
                    <span>{t('detail.noImages')}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/75 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900/75 text-white text-xs font-medium backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t('detail.fieldVerifiedBadge')}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-gray-900/75 text-white text-xs font-semibold backdrop-blur-xs">
                    {images.length ? t('detail.photoCount', { current: activeImage + 1, total: images.length }) : t('detail.zeroPhotos')}
                  </span>
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                      aria-label={t('detail.prevImageAria')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveImage((activeImage + 1) % images.length)}
                      aria-label={t('detail.nextImageAria')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 text-gray-800 flex items-center justify-center shadow-xs hover:bg-white cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-3 z-20 flex gap-1.5">
                      {images.map((image, index) => (
                        <button
                          key={image.id || image.image_url}
                          onClick={() => setActiveImage(index)}
                          aria-label={t('detail.selectImageAria', { index: index + 1 })}
                          className={`w-2 h-2 rounded-full transition ${index === activeImage ? 'bg-neighbor-400 w-5' : 'bg-white/60 hover:bg-white'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-between gap-5 h-full">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-neighbor-50 border border-neighbor-200 text-neighbor-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t('detail.verifiedBadge')}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{facility.name}</h1>
                <p className="text-xs sm:text-sm text-gray-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neighbor-600 shrink-0 mt-0.5" />
                  <span>{facility.address}</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <strong className="text-gray-900 text-sm">{facility.avg_rating || '—'}</strong>
                    <span>{t('detail.reviewsSummary', { count: facility.total_reviews || 0 })}</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <UserRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('detail.providerPrefix')}</span>
                    <strong className="text-gray-800">{providerName}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center pt-3 border-t border-gray-100">
                <button
                  onClick={toggleFavorite}
                  className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-150 shadow-xs cursor-pointer ${
                    isFavorite
                      ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : 'text-gray-400'
                    }`}
                  />
                  <span>{isFavorite ? t('detail.savedFavorite') : t('detail.saveFavorite')}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('detail.availabilityTitle')}</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t('detail.liveUpdate')}
              </span>
            </div>

            {availability ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500">{t('detail.capacityLabel')}</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">{availability.capacity}</p>
                  <p className="text-[11px] text-gray-400">{t('detail.capacityUnit')}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-xs text-gray-500">{t('detail.occupiedLabel')}</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">{availability.active_contracts}</p>
                  <p className="text-[11px] text-gray-400">{t('detail.occupiedUnit')}</p>
                </div>
                <div className={`p-3 rounded-lg border ${effectiveAvailableSlots > 0 ? 'bg-neighbor-50 border-neighbor-200' : 'bg-rose-50 border-rose-200'}`}>
                  <p className="text-xs text-gray-600">{t('detail.vacantLabel')}</p>
                  <p className={`text-xl sm:text-2xl font-extrabold mt-1 ${effectiveAvailableSlots > 0 ? 'text-neighbor-700' : 'text-rose-600'}`}>
                    {effectiveAvailableSlots}
                  </p>
                  <p className="text-[11px] text-gray-500">{effectiveAvailableSlots > 0 ? t('detail.vacantReady') : t('detail.vacantFull')}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-center text-sm text-gray-500">
                <LockKeyhole className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                {t('detail.noAvailabilityInfo')}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-gray-100">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-neighbor-600" />
                {t('detail.amenitiesTitle')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(facility.facility_amenities || []).map((fa) => (
                  <span
                    key={fa.amenity.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neighbor-50 border border-neighbor-100 text-neighbor-800 text-xs font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-neighbor-600" />
                    {translateAmenityName(fa.amenity.name, i18n.language)}
                  </span>
                ))}
                {(!facility.facility_amenities || facility.facility_amenities.length === 0) && (
                  <span className="text-xs text-gray-500">{t('detail.noAmenities')}</span>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('detail.rentalInfoTitle')}</h2>
              </div>
              <span className="text-[11px] text-gray-400">{t('detail.monthlyOnlyTag')}</span>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">{t('detail.priceFrom')}</span>
                <strong className="text-lg sm:text-xl text-neighbor-700">
                  {formatPrice(facility.price_per_month)} {t('detail.currencyPerMonth')}
                  <span className="text-xs font-medium text-gray-500 ml-1">{t('detail.perMonthUnit')}</span>
                </strong>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-gray-500 shrink-0">{t('detail.vehicleTypesLabel')}</span>
                <span className="flex flex-wrap justify-end gap-1.5 text-right">
                  {activeVehicleTypes.length > 0 ? (
                    activeVehicleTypes.map((vt, index) => (
                      <span
                        key={`${vt.id || vt.type_code || index}`}
                        className="px-2 py-0.5 rounded-md bg-neighbor-50 border border-neighbor-100 text-neighbor-800 text-xs font-semibold"
                      >
                        {translateVehicleTypeName(vt, i18n.language)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-xs italic">{t('detail.noVehicleTypes')}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">{t('detail.providerLabel')}</span>
                <span className="font-semibold text-gray-800">{providerName}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed mt-4">{t('detail.reservationNote')}</p>

            <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-5">
              <button
                onClick={handleChatClick}
                disabled={isChatLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-xs font-semibold transition disabled:cursor-not-allowed cursor-pointer"
              >
                {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                {t('detail.messageProvider')}
              </button>
              <button
                onClick={handleOpenReservation}
                disabled={effectiveAvailableSlots <= 0}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-neighbor-600 hover:bg-neighbor-700 disabled:bg-gray-400 text-white text-xs font-semibold transition disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {t('detail.requestReservation')}
              </button>
            </div>
          </section>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-neighbor-600" />
                {t('detail.locationTitle')}
              </h2>
              <p className="text-xs text-gray-500 mt-1">{facility.address}</p>
              {preferredOriginAddress && (
                <p className="text-[11px] font-semibold text-neighbor-700 bg-neighbor-50 px-2 py-0.5 rounded mt-1.5 inline-flex items-center gap-1 border border-neighbor-200">
                  <MapPin className="w-3 h-3 text-neighbor-600" />
                  {t('detail.originLabel')} <span className="underline">{preferredOriginAddress}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleGetDirections}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neighbor-600 hover:bg-neighbor-700 text-white text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer"
              title={
                preferredOriginAddress
                  ? t('detail.directionsTitleFrom', { address: preferredOriginAddress })
                  : t('detail.directionsTitleDefault')
              }
            >
              <Navigation className="w-4 h-4" />
              {t('detail.directionsButton')}
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>

          <div className="relative z-0 isolate h-52 sm:h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
            {hasCoordinates ? (
              <MapContainer
                center={[latitude, longitude]}
                zoom={16}
                minZoom={VIETNAM_SEA_MAP_OPTIONS.minZoom}
                maxZoom={VIETNAM_SEA_MAP_OPTIONS.maxZoom}
                maxBounds={VIETNAM_SEA_MAP_OPTIONS.maxBounds}
                maxBoundsViscosity={VIETNAM_SEA_MAP_OPTIONS.maxBoundsViscosity}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url={`https://maps.vietmap.vn/api/tm/{z}/{x}/{y}.png?apikey=${vietmapTileKey}`}
                  bounds={SEA_MAP_BOUNDS}
                  noWrap
                  keepBuffer={1}
                  updateWhenIdle
                  updateWhenZooming={false}
                />
                <Marker position={[latitude, longitude]} icon={facilityCarIcon} />
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center px-6 text-center text-sm text-gray-500">
                {t('detail.noCoordinates')}
              </div>
            )}
          </div>
        </section>

        <ReviewSection facilityId={facilityId} onReviewChanged={() => fetchData(false)} />
      </div>
    </div>
  );
};

export default FacilityDetailPage;
