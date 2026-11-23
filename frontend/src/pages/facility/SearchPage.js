import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, MapPin, Navigation, CarFront, Star, Info, List, X,
  GitCompareArrows, CheckSquare, Square, Heart, ExternalLink
} from 'lucide-react';
import facilityService from '../../services/facilityService';
import { addFavorite, removeFavorite, getFavorites } from '../../services/favoriteService';
import { useAuth } from '../../context/AuthContext';
import vehicleTypeService from '../../services/vehicleTypeService';
import CompareModal from '../../components/modals/CompareModal';
import { facilityCarIcon } from '../../utils/mapIcons';
import { translateAmenityName, translateVehicleTypeName } from '../../utils/translations';
import Toast from '../../components/common/Toast';
import VietmapAddressAutocomplete from '../../components/common/VietmapAddressAutocomplete';
import vietmapService from '../../services/vietmapService';
import {
  openGoogleMapsDirections,
  SEA_MAP_BOUNDS,
  VIETNAM_SEA_MAP_OPTIONS,
} from '../../utils/mapUtils';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const searchedLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const VIETMAP_TILE_KEY = process.env.REACT_APP_VIETMAP_TILE_KEY;
const DEFAULT_MAP_CENTER = [10.0299, 105.7706];
const DEFAULT_MAP_ZOOM = 13;

const getFacilityRating = (facility) => {
  if (facility.avg_rating !== null && facility.avg_rating !== undefined && Number.isFinite(Number(facility.avg_rating))) {
    return {
      average: Number(facility.avg_rating),
      count: Number(facility.total_reviews) || 0,
    };
  }

  const ratings = Array.isArray(facility.reviews)
    ? facility.reviews.map((review) => Number(review.rating)).filter(Number.isFinite)
    : [];

  return {
    average: ratings.length > 0
      ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1))
      : null,
    count: ratings.length,
  };
};

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    try {
      if (center && Number.isFinite(Number(center[0])) && Number.isFinite(Number(center[1])) && map._mapPane) {
        map.setView([Number(center[0]), Number(center[1])], zoom || map.getZoom(), { animate: false });
      }
    } catch (err) {}
  }, [center, zoom, map]);
  return null;
};

const MapInitialCenter = ({ center, zoom }) => {
  const map = useMap();
  const latestViewRef = useRef({ center, zoom });

  useEffect(() => {
    latestViewRef.current = { center, zoom };
  }, [center, zoom]);

  useEffect(() => {
    let isMounted = true;
    let userInteracted = false;
    let timeoutId = null;

    const markUserInteraction = () => {
      userInteracted = true;
    };

    const setDefaultCenter = () => {
      if (!isMounted || userInteracted) return;
      try {
        const container = map.getContainer();
        if (!container || !map._mapPane) return;
        const { center: currentCenter, zoom: currentZoom } = latestViewRef.current;
        map.setView(currentCenter, currentZoom, { animate: false });
        map.invalidateSize({ pan: false });
      } catch (err) {}
    };

    map.on('dragstart zoomstart', markUserInteraction);
    const frameId = window.requestAnimationFrame(() => {
      if (!isMounted) return;
      map.whenReady(() => {
        if (!isMounted) return;
        setDefaultCenter();
        timeoutId = window.setTimeout(setDefaultCenter, 650);
      });
    });

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(frameId);
      if (timeoutId) window.clearTimeout(timeoutId);
      try {
        map.off('dragstart zoomstart', markUserInteraction);
      } catch (err) {}
    };
  }, [map]);

  return null;
};

const MapSizeInvalidator = () => {
  const map = useMap();

  useEffect(() => {
    let isMounted = true;
    const invalidate = () => {
      if (!isMounted) return;
      try {
        if (map._mapPane && map.getContainer()) {
          map.invalidateSize({ pan: false });
        }
      } catch (err) {}
    };

    const frameId = window.requestAnimationFrame(invalidate);
    const firstTimeout = window.setTimeout(invalidate, 100);
    const secondTimeout = window.setTimeout(invalidate, 500);
    let observer = null;
    try {
      const container = map.getContainer();
      if (container && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(invalidate);
        observer.observe(container);
      }
    } catch (err) {}

    return () => {
      isMounted = false;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(firstTimeout);
      window.clearTimeout(secondTimeout);
      observer?.disconnect();
    };
  }, [map]);

  return null;
};

const MapSearchChangeHandler = ({ hasSearched }) => {
  const map = useMap();
  useEffect(() => {
    let isMounted = true;
    let timer = null;
    try {
      const container = map.getContainer();
      if (container) {
        if (!hasSearched) {
          container.style.filter = 'blur(3px)';
          container.style.pointerEvents = 'none';
        } else {
          container.style.filter = 'none';
          container.style.pointerEvents = 'auto';
        }
      }
      if (hasSearched && map._mapPane) {
        map.invalidateSize({ pan: false });
        timer = window.setTimeout(() => {
          if (!isMounted) return;
          try {
            if (map._mapPane) map.invalidateSize({ pan: false });
          } catch (err) {}
        }, 300);
      }
    } catch (err) {}

    return () => {
      isMounted = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [hasSearched, map]);
  return null;
};

const SearchPage = () => {
  const { t, i18n } = useTranslation('facility');
  const tRef = useRef(t);
  tRef.current = t;
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [dbVehicleTypes, setDbVehicleTypes] = useState([]);

  useEffect(() => {
    vehicleTypeService.getActiveVehicleTypes()
      .then(res => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setDbVehicleTypes(list);
        }
      })
      .catch(() => { });
  }, []);

  const displayVehicleTypes = useMemo(() => {
    return dbVehicleTypes.map(vt => ({
      id: vt.type_code,
      label: translateVehicleTypeName(vt, i18n.language)
    }));
  }, [dbVehicleTypes, i18n.language]);
  const [radius, setRadius] = useState(3);
  const [appliedRadius, setAppliedRadius] = useState(3);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userLocation, setUserLocation] = useState(null); 
  const [locationAccuracy, setLocationAccuracy] = useState(null); 
  const [searchedLocation, setSearchedLocation] = useState(null); 
  const [isFallbackLocation, setIsFallbackLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [mobileTab, setMobileTab] = useState('list');

  const [amenitiesList, setAmenitiesList] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [compareIds, setCompareIds] = useState([]);         
  const [isCompareOpen, setIsCompareOpen] = useState(false); 
  const [toastMsg, setToastMsg] = useState('');              
  const [toastType, setToastType] = useState('error');
  const [mapTileError, setMapTileError] = useState(false);
  const latestSearchRequest = useRef(0);
  const initialFacilitiesLoaded = useRef(false);

  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user?.role?.name === 'CUSTOMER') {
      loadFavorites();
    } else if (!isAuthenticated) {
      setFavoriteIds([]);
    }
  }, [isAuthenticated, user?.id, user?.role?.name]);

  const loadFavorites = async () => {
    try {
      const favs = await getFavorites();
      setFavoriteIds(favs.map(f => Number(f.id ?? f.facility_id ?? f.facility?.id)).filter(Number.isFinite));
    } catch (err) {
      console.error('Lỗi khi tải danh sách bãi yêu thích:', err);
    }
  };

  const handleToggleFavorite = async (e, facilityId) => {
    e.stopPropagation();
    const normalizedFacilityId = Number(facilityId);
    if (!isAuthenticated || user?.role?.name !== 'CUSTOMER') {
      setToastMsg(t('search.toasts.loginCustomerToSave'));
      setToastType('error');
      return;
    }
    try {
      if (favoriteIds.includes(normalizedFacilityId)) {
        await removeFavorite(normalizedFacilityId);
        setFavoriteIds(prev => prev.filter(id => id !== normalizedFacilityId));
        setToastMsg(t('search.toasts.favoriteRemoved'));
      } else {
        await addFavorite(normalizedFacilityId);
        setFavoriteIds(prev => [...prev, normalizedFacilityId]);
        setToastMsg(t('search.toasts.favoriteAdded'));
      }
      setToastType('success');
    } catch (err) {
      setToastMsg(err.message || t('search.toasts.favoriteError'));
      setToastType('error');
    }
  };

  
  const handleToggleCompare = useCallback((e, facId) => {
    e.stopPropagation(); 
    const normalizedFacilityId = Number(facId);
    if (!Number.isInteger(normalizedFacilityId) || normalizedFacilityId <= 0) {
      setToastMsg(tRef.current('search.toasts.invalidCompareFacility'));
      setToastType('error');
      return;
    }

    setCompareIds(prev => {
      if (prev.includes(normalizedFacilityId)) {
        return prev.filter(id => id !== normalizedFacilityId);
      }
      if (prev.length >= 4) {
        setToastMsg(tRef.current('search.toasts.maxCompareLimit'));
        setToastType('error');
        return prev;
      }
      return [...prev, normalizedFacilityId];
    });
  }, []);

  
  const handleRemoveFromCompare = useCallback((facId) => {
    setCompareIds(prev => {
      const updated = prev.filter(id => id !== facId);
      if (updated.length < 2) setIsCompareOpen(false);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    let fromHomepage = false;
    let initialKeyword = keyword;
    if (location.state) {
      if (location.state.keyword && location.state.keyword.trim()) {
        initialKeyword = location.state.keyword.trim();
        setKeyword(initialKeyword);
        fromHomepage = true;
      }
      if (location.state.vehicleType) {
        setVehicleType(location.state.vehicleType);
      }
      if (location.state.facilityError) {
        setToastMsg(location.state.facilityError);
        setToastType('error');
      }
    }
    fetchAmenities();
    if (!initialFacilitiesLoaded.current) {
      initialFacilitiesLoaded.current = true;
      if (fromHomepage) {
        setHasSearched(true);
        setAppliedRadius(Number(radius));
        fetchFacilities(null, null, initialKeyword);
      }
    }
  }, [authLoading, isAuthenticated, user?.id, user?.role?.name]);

  const fetchAmenities = async () => {
    try {
      const res = await facilityService.getAllAmenities();
      if (res.status === 'success') {
        setAmenitiesList(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách tiện ích', err);
    }
  };

  const fetchFacilities = async (
    currentLat = null,
    currentLng = null,
    searchKeyword = keyword,
    useUserLocation = true,
    overrideRadius = null
  ) => {
    const requestId = ++latestSearchRequest.current;
    const parsedMinPrice = minPrice === '' ? null : Number(minPrice);
    const parsedMaxPrice = maxPrice === '' ? null : Number(maxPrice);
    if (
      (parsedMinPrice !== null && (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0)) ||
      (parsedMaxPrice !== null && (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0))
    ) {
      setError(t('search.toasts.negativePrice'));
      setToastMsg(t('search.toasts.negativePrice'));
      setToastType('error');
      return;
    }
    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      setError(t('search.toasts.invalidPriceRange'));
      setToastMsg(t('search.toasts.invalidPriceRange'));
      setToastType('error');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params = {
        keyword: searchKeyword,
        vehicle_type: vehicleType,
      };

      if (parsedMinPrice !== null) params.min_price = parsedMinPrice;
      if (parsedMaxPrice !== null) params.max_price = parsedMaxPrice;

      if (selectedAmenities.length > 0) {
        params.amenities = selectedAmenities.join(',');
      }

      const hasExplicitLocation = currentLat !== null && currentLng !== null;
      const lat = hasExplicitLocation
        ? currentLat
        : (useUserLocation && userLocation ? userLocation[0] : null);
      const lng = hasExplicitLocation
        ? currentLng
        : (useUserLocation && userLocation ? userLocation[1] : null);

      if (
        lat !== null &&
        lat !== undefined &&
        lng !== null &&
        lng !== undefined &&
        Number.isFinite(Number(lat)) &&
        Number.isFinite(Number(lng))
      ) {
        params.lat = lat;
        params.lng = lng;
        params.radius = overrideRadius !== null ? overrideRadius : radius;
      }

      const res = await facilityService.searchFacilities(params);
      if (res.status !== 'success') {
        throw new Error(res.message || t('search.toasts.fetchFailed'));
      }
      if (requestId === latestSearchRequest.current) {
        setFacilities(res.data.map((facility) => ({
          ...facility,
          ...(() => {
            const rating = getFacilityRating(facility);
            return { avg_rating: rating.average, total_reviews: rating.count };
          })(),
        })));
      }
    } catch (err) {
      if (requestId === latestSearchRequest.current) {
        setError(err.message || t('search.toasts.fetchRetry'));
      }
    } finally {
      if (requestId === latestSearchRequest.current) {
        setLoading(false);
      }
    }
  };

  const handleNavigateToDetail = (facilityId) => {
    const searchContext = {
      originCoords: searchedLocation || userLocation,
      originAddress: keyword
    };
    try {
      sessionStorage.setItem('parklink_last_search', JSON.stringify(searchContext));
    } catch (e) {
      console.error(e);
    }
    navigate(`/facility/${facilityId}`, { state: searchContext });
  };

  const normalizeSearchText = (text = '') =>
    String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/đ/g, 'd')
      .trim();

  const handleSearch = async (e) => {
    e?.preventDefault();
    const trimmedKeyword = keyword?.trim() || '';

    if (!trimmedKeyword) {
      setToastMsg(t('search.toasts.emptyKeyword'));
      setToastType('error');
      return;
    }

    setHasSearched(true);
    setAppliedRadius(Number(radius));

    if (searchedLocation && Array.isArray(searchedLocation) && searchedLocation.length === 2) {
      await fetchFacilities(searchedLocation[0], searchedLocation[1], trimmedKeyword, false);
      return;
    }

    if (userLocation && Array.isArray(userLocation) && userLocation.length === 2) {
      await fetchFacilities(userLocation[0], userLocation[1], trimmedKeyword, true);
      return;
    }

    try {
      const nameMatchRes = await facilityService.searchFacilities({ keyword: trimmedKeyword });
      const normalizedQuery = normalizeSearchText(trimmedKeyword);
      const matchedByName = (nameMatchRes?.data || []).filter((fac) =>
        normalizeSearchText(fac.name).includes(normalizedQuery)
      );

      if (matchedByName.length > 0) {
        setUserLocation(null);
        setSearchedLocation(null);
        setIsFallbackLocation(false);
        const firstWithCoords = matchedByName.find(
          (fac) => Number.isFinite(Number(fac.latitude)) && Number.isFinite(Number(fac.longitude))
        );
        if (firstWithCoords) {
          setMapCenter([Number(firstWithCoords.latitude), Number(firstWithCoords.longitude)]);
          setMapZoom(15);
        }
        await fetchFacilities(null, null, trimmedKeyword, false);
        return;
      }
    } catch (err) {
      console.error('Lỗi kiểm tra tìm kiếm theo tên cơ sở:', err);
    }

    const location = await resolveSearchLocation(trimmedKeyword);
    if (location) {
      await fetchFacilities(location[0], location[1], trimmedKeyword, false);
    } else {
      await fetchFacilities(null, null, trimmedKeyword, false);
    }
  };

  const resolveSearchLocation = async (query, suggestion = null) => {
    try {
      const location = await vietmapService.resolveAddressCoordinates(query, suggestion);
      if (location) {
        setUserLocation(null);
        setIsFallbackLocation(false);
        setSearchedLocation(location);
        setMapCenter(location);
        setMapZoom(16);
        return location;
      }
    } catch (error) {
      console.error('Lỗi định vị địa điểm tìm kiếm trên bản đồ:', error);
    }
    return null;
  };

  const handleAddressSelect = async (suggestion, label) => {
    setKeyword(label);
    await resolveSearchLocation(label, suggestion);
  };

  const handleFacilitySelect = async (facility) => {
    setKeyword(facility.name);
    setUserLocation(null);
    setSearchedLocation(null);
    setIsFallbackLocation(false);
    setHasSearched(true);
    setAppliedRadius(Number(radius));

    if (facility.latitude && facility.longitude) {
      const loc = [Number(facility.latitude), Number(facility.longitude)];
      setMapCenter(loc);
      setMapZoom(16);
    }

    await fetchFacilities(null, null, facility.name, false);
  };

  const handleSearchedLocationDragEnd = async (e) => {
    const marker = e.target;
    if (!marker) return;
    const pos = marker.getLatLng();
    const newCoords = [pos.lat, pos.lng];
    setUserLocation(null);
    setSearchedLocation(newCoords);

    try {
      const resolvedAddress = await vietmapService.reverseGeocode(pos.lat, pos.lng);
      if (resolvedAddress && resolvedAddress.trim()) {
        setKeyword(resolvedAddress);
      }
    } catch (err) {
      console.error('Lỗi reverse geocoding khi kéo marker tìm kiếm:', err);
    }
  };

  
  const handleUserLocationDragEnd = async (e) => {
    const marker = e.target;
    if (!marker) return;
    const pos = marker.getLatLng();
    const newCoords = [pos.lat, pos.lng];
    setSearchedLocation(null);
    setUserLocation(newCoords);

    try {
      const resolvedAddress = await vietmapService.reverseGeocode(pos.lat, pos.lng);
      if (resolvedAddress && resolvedAddress.trim()) {
        setKeyword(resolvedAddress);
      }
    } catch (err) {
      console.error('Lỗi reverse geocoding khi kéo marker GPS:', err);
    }
  };

  
  const handleGetDirections = (fac) => {
    const facLat = Number(fac.latitude);
    const facLng = Number(fac.longitude);
    const destination = (Number.isFinite(facLat) && Number.isFinite(facLng))
      ? [facLat, facLng]
      : fac.address;

    if (!destination) {
      setToastMsg(t('search.toasts.noDirectionsCoords'));
      setToastType('error');
      return;
    }

    const origin = searchedLocation || userLocation;
    const opened = openGoogleMapsDirections({
      origin,
      destination,
      travelMode: 'driving',
    });
    setToastMsg(opened
      ? t('search.toasts.openingDirections', { name: fac.name })
      : t('search.toasts.popupBlocked'));
    setToastType(opened ? 'success' : 'error');
  };

  const toggleAmenity = (id) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleLocationUnavailable = () => {
    setSearchedLocation(null);
    setUserLocation(DEFAULT_MAP_CENTER);
    setIsFallbackLocation(true);
    setLocationAccuracy(null);
    setMapCenter(DEFAULT_MAP_CENTER);
    setMapZoom(16);
    setToastMsg(t('search.toasts.geolocationFallback'));
    setToastType('error');
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSearchedLocation(null);
          setUserLocation([lat, lng]);
          setIsFallbackLocation(false);
          setLocationAccuracy(Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null);
          setMapCenter([lat, lng]);
          setMapZoom(14);

          let resolvedKeyword = t('search.toasts.currentLocationLabel');
          try {
            const addr = await vietmapService.reverseGeocode(lat, lng);
            if (addr) {
              resolvedKeyword = addr;
            }
          } catch (e) {
            console.error('Reverse geocode error:', e);
          }
          setKeyword(resolvedKeyword);
          setHasSearched(true);
          setAppliedRadius(Number(radius));
          await fetchFacilities(lat, lng, '', true);
          setToastMsg(t('search.toasts.locationFound'));
          setToastType('success');
        },
        handleLocationUnavailable
      );
    } else {
      handleLocationUnavailable();
    }
  };

  const clearKeyword = () => {
    setKeyword('');
    setSearchedLocation(null);
    setIsFallbackLocation(false);
  };

  const clearFilters = () => {
    setVehicleType('');
    setRadius(3);
    setMinPrice('');
    setMaxPrice('');
    setSelectedAmenities([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />

      
      <CompareModal
        selectedIds={compareIds}
        isOpen={isCompareOpen}
        comparisonLocation={searchedLocation || userLocation}
        onClose={() => setIsCompareOpen(false)}
        onRemove={handleRemoveFromCompare}
      />
      
      <header className="relative bg-white border-b border-gray-200 shadow-sm z-[30] px-4 py-3 shrink-0">
        <form onSubmit={handleSearch} className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3">

          <div className="relative flex-1 w-full">
            <VietmapAddressAutocomplete
              value={keyword}
              onChange={(value) => {
                setKeyword(value);
                setSearchedLocation(null);
                setUserLocation(null);
              }}
              onSelect={handleAddressSelect}
              onFacilitySelect={handleFacilitySelect}
              includeFacilities={true}
              placeholder={t('search.filters.keywordPlaceholder')}
              inputClassName="py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-neighbor-600 focus:ring-2 focus:ring-neighbor-200 transition"
            />
            {keyword && (
              <button type="button" onClick={clearKeyword} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center w-full md:w-auto gap-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder={t('search.filters.minPricePlaceholder')}
                aria-label={t('search.filters.minPriceAria')}
                className="w-24 py-2.5 px-3 bg-gray-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-neighbor-600 focus:ring-2 focus:ring-neighbor-200 transition"
              />
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder={t('search.filters.maxPricePlaceholder')}
                aria-label={t('search.filters.maxPriceAria')}
                className="w-24 py-2.5 px-3 bg-gray-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-neighbor-600 focus:ring-2 focus:ring-neighbor-200 transition"
              />
            </div>

            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="py-2.5 px-3 bg-gray-100 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-neighbor-600 focus:ring-2 focus:ring-neighbor-200 transition"
            >
              <option value="">{t('search.filters.allVehicleTypes')}</option>
              {displayVehicleTypes.map(vt => (
                <option key={vt.id} value={vt.id}>{vt.label}</option>
              ))}
            </select>

            <select
              value={radius}
              onChange={(e) => {
                const newRadius = Number(e.target.value);
                setRadius(newRadius);
                if (hasSearched && (searchedLocation || userLocation)) {
                  setAppliedRadius(newRadius);
                  const loc = searchedLocation || userLocation;
                  fetchFacilities(loc[0], loc[1], keyword, !searchedLocation, newRadius);
                }
              }}
              className="py-2.5 px-3 bg-gray-100 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-neighbor-600 focus:ring-2 focus:ring-neighbor-200 transition"
            >
              <option value={1}>{t('search.filters.radiusOption', { km: 1 })}</option>
              <option value={3}>{t('search.filters.radiusOption', { km: 3 })}</option>
              <option value={5}>{t('search.filters.radiusOption', { km: 5 })}</option>
              <option value={10}>{t('search.filters.radiusOption', { km: 10 })}</option>
              <option value={20}>{t('search.filters.radiusOption', { km: 20 })}</option>
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleLocateMe}
              title={t('search.filters.locateMeTitle')}
              className="px-4 py-2.5 bg-neighbor-50 text-neighbor-700 hover:bg-neighbor-100 font-semibold rounded-xl border border-neighbor-200 flex items-center justify-center transition whitespace-nowrap"
            >
              <Navigation className="w-5 h-5" />
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 whitespace-nowrap flex-1 md:flex-none"
            >
              <Search className="w-5 h-5" /> {t('search.filters.searchButton')}
            </button>
          </div>
        </form>

        <div className="max-w-7xl mx-auto mt-2 flex flex-wrap items-center gap-3 text-xs">
          {locationAccuracy !== null && (
            <span className="text-gray-500">
              {t('search.filters.gpsAccuracy', { meters: Math.round(locationAccuracy) })}
            </span>
          )}
        </div>

        {hasSearched && amenitiesList.length > 0 && (
          <div className="max-w-7xl mx-auto mt-3 flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!(vehicleType || selectedAmenities.length > 0 || minPrice !== '' || maxPrice !== '' || radius !== 3)}
              className="px-3 py-1.5 text-xs font-semibold rounded-full border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-50"
            >
              {t('search.filters.clearFilters')}
            </button>
            <span className="text-xs font-bold text-gray-500 uppercase mr-2">{t('search.filters.amenitiesLabel')}</span>
            {amenitiesList.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity.id);
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${isSelected
                    ? 'bg-neighbor-100 border-neighbor-300 text-neighbor-800 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {translateAmenityName(amenity.name, i18n.language)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleSearch}
              className="ml-auto px-4 py-1.5 text-xs font-bold rounded-full bg-neighbor-600 hover:bg-neighbor-700 text-white shadow-sm transition flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" /> {t('search.filters.applyAmenities')}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        <div className={`w-full md:w-[450px] lg:w-[500px] ${mobileTab === 'list' ? 'flex' : 'hidden'} md:flex h-full min-h-0 bg-gray-50 border-r border-gray-200 flex-col z-20`}>
          <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-gray-900">
              {hasSearched ? (
                <>{t('search.results.foundCountPrefix')} <span className="text-neighbor-600">{facilities.length}</span> {t('search.results.foundCountSuffix')}</>
              ) : (
                <>{t('search.results.titleDefault')}</>
              )}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <List className="w-4 h-4" /> {t('search.results.listView')}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {!hasSearched ? (
              <div className="text-center py-16 text-gray-500 flex flex-col items-center">
                <Search className="w-10 h-10 mb-3 text-gray-300" />
                <p className="font-semibold text-gray-700">{t('search.results.emptyInitialTitle')}</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  {t('search.results.emptyInitialDesc')}
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-10 text-gray-500">{t('search.results.searching')}</div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : facilities.length === 0 ? (
              <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                <Info className="w-10 h-10 mb-3 text-gray-300" />
                <p>{t('search.results.noResultsTitle')}</p>
                <p className="text-sm mt-1">{t('search.results.noResultsHint')}</p>
              </div>
            ) : (
              facilities.map((fac) => {
                const isSelected = compareIds.includes(fac.id);
                const isOutOfSlots = fac.available_slots !== undefined && fac.available_slots !== null
                  ? Number(fac.available_slots) <= 0
                  : false;
                return (
                  <div
                    key={fac.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border transition cursor-pointer ${isSelected
                      ? 'border-neighbor-400 shadow-neighbor-100 ring-2 ring-neighbor-300/50'
                      : 'border-gray-200 hover:shadow-md hover:border-neighbor-300'
                      }`}
                    onClick={() => {
                      if (fac.latitude && fac.longitude) {
                        setMapCenter([fac.latitude, fac.longitude]);
                        setMapZoom(16);
                        if (window.innerWidth < 768) {
                          setMobileTab('map');
                        }
                      }
                    }}
                  >
                    <div className="flex gap-4">
                      
                      <div className="relative w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                        {fac.images && fac.images.length > 0 ? (
                          <img src={fac.images[0].image_url} alt={fac.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <CarFront className="w-8 h-8" />
                          </div>
                        )}
                        {isOutOfSlots && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-md tracking-wide">
                            {t('search.results.outOfSlots')}
                          </span>
                        )}
                      </div>

                      
                      <div className="flex-1 flex flex-col justify-between relative">
                        <button
                          type="button"
                          id={`compare-checkbox-${fac.id}`}
                          onClick={(e) => handleToggleCompare(e, fac.id)}
                          title={isSelected ? t('search.results.compareRemoveTitle') : t('search.results.compareAddTitle')}
                          className={`absolute -top-1 -right-1 z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition ${isSelected
                            ? 'bg-neighbor-100 border-neighbor-300 text-neighbor-700'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-neighbor-300 hover:text-neighbor-600'
                            }`}
                        >
                          {isSelected
                            ? <CheckSquare className="w-3.5 h-3.5" />
                            : <Square className="w-3.5 h-3.5" />
                          }
                          {t('search.results.compareLabel')}
                        </button>
                        <div className="pr-20">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-gray-900 line-clamp-1">{fac.name}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 flex gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {fac.address}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200 whitespace-nowrap shrink-0">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{getFacilityRating(fac).average ?? t('search.results.noRating')}</span>
                              {getFacilityRating(fac).count > 0 && <span className="font-normal">({getFacilityRating(fac).count})</span>}
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded-lg border whitespace-nowrap shrink-0 ${isOutOfSlots
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-neighbor-50 text-neighbor-700 border-neighbor-200'
                              }`}>
                              {isOutOfSlots
                                ? t('search.results.slotsRemaining', { available: 0, total: fac.capacity || 0 })
                                : t('search.results.slotsRemaining', { available: fac.available_slots ?? fac.capacity, total: fac.capacity || 0 })}
                            </div>
                          </div>
                          {fac.distance !== null && fac.distance !== undefined && (
                            <div className="text-xs font-semibold text-neighbor-600 bg-neighbor-50 px-2 py-1 rounded-lg border border-neighbor-100 whitespace-nowrap shrink-0">
                              {t('search.results.distanceAway', { km: (fac.distance).toFixed(1) })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold">{t('search.results.priceHeader')}</div>
                        <div className="text-lg font-bold text-neighbor-600">
                          {fac.price_per_month ? fac.price_per_month.toLocaleString(i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN') : '0'} {t('search.results.currencySuffix')} <span className="text-xs text-gray-400 font-normal">{t('search.results.perMonthSuffix')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, fac.id)}
                          aria-label={favoriteIds.includes(Number(fac.id)) ? t('search.results.removeFavoriteLabel') : t('search.results.addFavoriteLabel')}
                          title={favoriteIds.includes(Number(fac.id)) ? t('search.results.removeFavoriteLabel') : t('search.results.addFavoriteLabel')}
                          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-rose-50 hover:border-rose-200 transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${favoriteIds.includes(Number(fac.id)) ? 'text-rose-500 fill-rose-500' : 'text-gray-400'}`} />
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDirections(fac);
                          }}
                          title={t('search.results.directionsTitle')}
                          className="px-3 py-2 bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-700 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-neighbor-200 shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5" /> {t('search.results.directions')}
                        </button>
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNavigateToDetail(fac.id); }}
                          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition"
                        >
                          {t('search.results.details')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={`flex-1 ${mobileTab === 'map' ? 'block' : 'hidden'} md:block h-full min-h-0 relative z-0`}>
          <div className={`w-full h-full transition-[filter] duration-300 ${!hasSearched ? 'filter blur-[3px] pointer-events-none' : 'filter-none pointer-events-auto'}`}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              minZoom={VIETNAM_SEA_MAP_OPTIONS.minZoom}
              maxZoom={VIETNAM_SEA_MAP_OPTIONS.maxZoom}
              maxBounds={VIETNAM_SEA_MAP_OPTIONS.maxBounds}
              maxBoundsViscosity={VIETNAM_SEA_MAP_OPTIONS.maxBoundsViscosity}
              className="w-full h-full"
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <ZoomControl position="bottomright" />
              <MapInitialCenter center={mapCenter} zoom={mapZoom} />
              <MapUpdater center={mapCenter} zoom={mapZoom} />
              <MapSizeInvalidator />
              <MapSearchChangeHandler hasSearched={hasSearched} />
              <TileLayer
                attribution='&copy; Vietmap'
                url={`https://maps.vietmap.vn/api/tm/{z}/{x}/{y}.png?apikey=${VIETMAP_TILE_KEY}`}
                bounds={SEA_MAP_BOUNDS}
                noWrap
                keepBuffer={1}
                updateWhenIdle
                updateWhenZooming={false}
                eventHandlers={{
                  tileerror: () => {
                    setMapTileError(true);
                    setToastMsg(t('search.map.loadErrorToast'));
                    setToastType('error');
                  },
                  tileload: () => setMapTileError(false),
                }}
              />
              {mapTileError && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] rounded-lg bg-white/95 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 shadow-lg">
                  {t('search.map.loadErrorBanner')}
                </div>
              )}

              {hasSearched && (searchedLocation || userLocation) && (
                <Circle
                  center={searchedLocation || userLocation}
                  radius={appliedRadius * 1000}
                  pathOptions={{
                    color: '#0d9488',
                    fillColor: '#0d9488',
                    fillOpacity: 0.04,
                    weight: 1.5,
                    dashArray: '6, 6'
                  }}
                />
              )}

              
              {searchedLocation && (
                <Marker
                  position={searchedLocation}
                  icon={searchedLocationIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: handleSearchedLocationDragEnd,
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <div className="font-bold text-red-600 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {t('search.map.searchPointTitle')}
                      </div>
                      <p className="text-xs text-gray-700 mt-1">{keyword || t('search.map.selectedLocationFallback')}</p>
                      <p className="text-[10px] text-gray-400 mt-1 italic">
                        {t('search.map.dragHint')}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={userIcon}
                  draggable={true}
                  eventHandlers={{
                    dragend: handleUserLocationDragEnd,
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <div className="font-bold text-neighbor-600 text-xs flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5" /> {t('search.map.currentLocationTitle')}
                      </div>
                      <p className="text-xs text-gray-700 mt-1">
                        {isFallbackLocation ? t('search.map.defaultFallbackLocation') : (keyword || t('search.map.yourLocationFallback'))}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 italic">
                        {t('search.map.dragHint')}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              
              {facilities.map(fac => {
                const latitude = Number(fac.latitude);
                const longitude = Number(fac.longitude);
                if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                  const isOutOfSlots = fac.available_slots !== undefined && fac.available_slots !== null
                    ? Number(fac.available_slots) <= 0
                    : false;
                  const primaryImage = fac.images?.find(image => image.is_primary) || fac.images?.[0];
                  const facilityRating = getFacilityRating(fac).average;
                  const amenityNames = (fac.facility_amenities || [])
                    .map(item => translateAmenityName(item.amenity?.name || item.name, i18n.language))
                    .filter(Boolean)
                    .slice(0, 3);

                  return (
                    <Marker key={fac.id} position={[latitude, longitude]} icon={facilityCarIcon}>
                      <Popup minWidth={290} maxWidth={320} className="parklink-facility-popup">
                        <div className="w-[270px] overflow-hidden rounded-xl bg-white text-gray-800">
                          <div className="relative h-28 -mx-0 -mt-0 overflow-hidden bg-gray-100">
                            {primaryImage ? (
                              <img
                                src={primaryImage.image_url}
                                alt={fac.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <CarFront className="w-8 h-8" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/75 via-transparent to-transparent" />
                            <div className="absolute left-2.5 bottom-2 flex items-center gap-1.5">
                              <span className="px-2 py-1 rounded-md bg-neighbor-600 text-white text-[10px] font-bold">
                                {t('search.map.verifiedBadge')}
                              </span>
                              {isOutOfSlots && (
                                <span className="px-2 py-1 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-sm">
                                  {t('search.results.outOfSlots')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  #{String(fac.id).padStart(4, '0')}
                                </p>
                                <h4 className="mt-0.5 text-sm font-bold leading-tight text-gray-900 line-clamp-2">
                                  {fac.name}
                                </h4>
                              </div>
                              {facilityRating !== null && facilityRating !== undefined ? (
                                <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-1 text-[11px] font-bold text-amber-700">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  {facilityRating}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-gray-500">
                              <MapPin className="mt-0.5 w-3.5 h-3.5 shrink-0 text-neighbor-600" />
                              <span className="line-clamp-2">{fac.address || t('search.map.addressNotUpdated')}</span>
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="rounded-lg bg-neighbor-50 px-2 py-1.5">
                                <p className="text-[10px] text-neighbor-700">{t('search.map.monthlyPriceLabel')}</p>
                                <p className="mt-0.5 text-xs font-bold text-neighbor-800">
                                  {Number(fac.price_per_month || 0).toLocaleString(i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN')} {t('search.results.currencySuffix')}
                                </p>
                              </div>
                              <div className={`rounded-lg px-2 py-1.5 ${isOutOfSlots ? 'bg-rose-50 border border-rose-100' : 'bg-gray-50'}`}>
                                <p className={`text-[10px] ${isOutOfSlots ? 'text-rose-600 font-semibold' : 'text-gray-500'}`}>{t('search.map.slotStatusLabel')}</p>
                                <p className={`mt-0.5 text-xs font-bold ${isOutOfSlots ? 'text-rose-700' : 'text-gray-800'}`}>
                                  {isOutOfSlots ? t('search.results.slotsRemaining', { available: 0, total: fac.capacity || 0 }) : t('search.results.slotsRemaining', { available: fac.available_slots ?? fac.capacity, total: fac.capacity || 0 })}
                                </p>
                              </div>
                            </div>

                            {amenityNames.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {amenityNames.map((amenity, index) => (
                                  <span key={`${amenity}-${index}`} className="rounded bg-gray-100 px-1.5 py-1 text-[10px] text-gray-600">
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            )}

                            
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleNavigateToDetail(fac.id)}
                                className="flex-1 rounded-lg bg-gray-900 py-2 text-xs font-bold text-white transition hover:bg-gray-800 text-center"
                              >
                                {t('search.results.details')}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGetDirections(fac);
                                }}
                                className="flex-1 rounded-lg bg-neighbor-600 hover:bg-neighbor-700 text-white py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                                title={t('search.results.directionsTitle')}
                              >
                                <Navigation className="w-3.5 h-3.5" /> {t('search.results.directions')}
                                <ExternalLink className="w-3 h-3 opacity-80" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>

          {!hasSearched && (
            <div
              onWheel={(e) => e.stopPropagation()}
              className="absolute inset-0 bg-gray-900/35 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4 pointer-events-auto cursor-default select-none transition-all duration-300"
            >
              <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl border border-gray-200/90 flex items-center gap-3.5 max-w-sm text-left">
                <div className="w-10 h-10 rounded-xl bg-neighbor-50 text-neighbor-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{t('search.map.startTitle')}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t('search.map.startDesc')}
                  </div>
                </div>
              </div>
            </div>
          )}

          
          <div className={`absolute top-4 left-4 z-[400] pointer-events-none ${!hasSearched ? 'hidden' : ''}`}>
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200 shadow-md flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neighbor-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-neighbor-600"></span>
              </span>
              <span className="text-xs font-bold text-gray-700">Live Map View</span>
            </div>
          </div>
        </div>
      </main>

      {compareIds.length < 2 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 md:hidden">
          <button
            type="button"
            onClick={() => setMobileTab((prev) => (prev === 'list' ? 'map' : 'list'))}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-full shadow-lg border border-gray-700 active:scale-95 transition-transform cursor-pointer"
          >
            {mobileTab === 'list' ? (
              <>
                <MapPin className="w-4 h-4 text-neighbor-400" />
                <span>{t('search.results.mapView') || 'Xem bản đồ'}</span>
              </>
            ) : (
              <>
                <List className="w-4 h-4 text-neighbor-400" />
                <span>{t('search.results.listView') || 'Xem danh sách'}</span>
              </>
            )}
          </button>
        </div>
      )}

      
      {compareIds.length >= 2 && (
        <div
          id="floating-compare-bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] w-auto max-w-xl px-5 py-3 bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 flex items-center gap-4 animate-slideUp"
        >
          
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-neighbor-600/20 border border-neighbor-400/30 flex items-center justify-center shrink-0">
              <GitCompareArrows className="w-3.5 h-3.5 text-neighbor-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-xs">
                {t('search.compareBar.selectedCount')} <span className="text-neighbor-400">{compareIds.length}</span>{t('search.compareBar.selectedCountSuffix')}
              </p>
              <p className="text-gray-400 text-[10px] truncate">
                {facilities
                  .filter(f => compareIds.includes(f.id))
                  .map(f => f.name)
                  .join(' · ')}
              </p>
            </div>
          </div>

          
          <button
            id="compare-bar-clear-btn"
            onClick={() => setCompareIds([])}
            title={t('search.compareBar.clearAllTitle')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>

          
          <button
            id="compare-bar-submit-btn"
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neighbor-600 hover:bg-neighbor-400 text-gray-900 text-sm font-extrabold rounded-xl transition shrink-0 shadow-lg"
          >
            <GitCompareArrows className="w-4 h-4" />
            {t('search.compareBar.compareButton', { count: compareIds.length })}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
