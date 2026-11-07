import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
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
import Toast from '../../components/common/Toast';
import VietmapAddressAutocomplete from '../../components/common/VietmapAddressAutocomplete';
import vietmapService from '../../services/vietmapService';
import { openGoogleMapsDirections } from '../../utils/mapUtils';

// Fix icon lỗi mặc định của leaflet khi dùng React
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

// Component để di chuyển Map center
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && Number.isFinite(Number(center[0])) && Number.isFinite(Number(center[1]))) {
      map.setView([Number(center[0]), Number(center[1])], zoom || map.getZoom(), { animate: false });
    }
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
    let userInteracted = false;
    const markUserInteraction = () => {
      userInteracted = true;
    };

    const setDefaultCenter = () => {
      if (userInteracted) return;
      const { center: currentCenter, zoom: currentZoom } = latestViewRef.current;
      map.setView(currentCenter, currentZoom, { animate: false });
      map.invalidateSize({ pan: false });
    };

    map.on('dragstart zoomstart', markUserInteraction);
    const frameId = window.requestAnimationFrame(() => {
      map.whenReady(() => {
        setDefaultCenter();
        window.setTimeout(setDefaultCenter, 650);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      map.off('dragstart zoomstart', markUserInteraction);
    };
  }, [map]);

  return null;
};

const MapSizeInvalidator = () => {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => map.invalidateSize({ pan: false });
    const frameId = window.requestAnimationFrame(invalidate);
    const firstTimeout = window.setTimeout(invalidate, 100);
    const secondTimeout = window.setTimeout(invalidate, 500);
    const container = map.getContainer();
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(invalidate)
      : null;

    observer?.observe(container);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(firstTimeout);
      window.clearTimeout(secondTimeout);
      observer?.disconnect();
    };
  }, [map]);

  return null;
};

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  //search state  
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
      label: vt.name
    }));
  }, [dbVehicleTypes]);
  const [radius, setRadius] = useState(3);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userLocation, setUserLocation] = useState(null); // [lat, lng]
  const [locationAccuracy, setLocationAccuracy] = useState(null); // metres
  const [searchedLocation, setSearchedLocation] = useState(null); // [lat, lng]
  const [isFallbackLocation, setIsFallbackLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER); // Mặc định Ninh Kiều, Cần Thơ
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);

  const [amenitiesList, setAmenitiesList] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  //state for compare
  const [compareIds, setCompareIds] = useState([]);         // Danh sách ID bãi đang chọn so sánh
  const [isCompareOpen, setIsCompareOpen] = useState(false); // Trạng thái mở modal so sánh
  const [toastMsg, setToastMsg] = useState('');              // Toast thông báo lỗi giới hạn
  const [toastType, setToastType] = useState('error');
  const [mapTileError, setMapTileError] = useState(false);
  const latestSearchRequest = useRef(0);
  const initialFacilitiesLoaded = useRef(false);

  const [favoriteIds, setFavoriteIds] = useState([]);

  // Load favorites sau khi auth đã sẵn sàng (không phải đang loading)
  useEffect(() => {
    // Chứ nhận isAuthenticated và user từ AuthContext
    if (isAuthenticated && user?.role?.name === 'CUSTOMER') {
      loadFavorites();
    } else if (!isAuthenticated) {
      // User đăng xuất hoặc không có phân quyền, xóa favorites
      setFavoriteIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setToastMsg('Vui lòng đăng nhập bằng tài khoản Khách hàng để lưu bãi xe!');
      setToastType('error');
      return;
    }
    try {
      if (favoriteIds.includes(normalizedFacilityId)) {
        await removeFavorite(normalizedFacilityId);
        setFavoriteIds(prev => prev.filter(id => id !== normalizedFacilityId));
        setToastMsg('Đã xóa khỏi danh sách yêu thích');
      } else {
        await addFavorite(normalizedFacilityId);
        setFavoriteIds(prev => [...prev, normalizedFacilityId]);
        setToastMsg('Đã thêm vào danh sách yêu thích');
      }
      setToastType('success');
    } catch (err) {
      setToastMsg(err.message || 'Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.');
      setToastType('error');
    }
  };

  /**
   * Toggle checkbox so sánh của một bãi đỗ xe.
   * Giới hạn tối đa 4 bãi — hiển thị toast cảnh báo nếu vượt quá (EX-01).
   */
  const handleToggleCompare = useCallback((e, facId) => {
    e.stopPropagation(); // Không trigger sự kiện click card bên dưới
    const normalizedFacilityId = Number(facId);
    if (!Number.isInteger(normalizedFacilityId) || normalizedFacilityId <= 0) {
      setToastMsg('Không thể chọn cơ sở không hợp lệ để so sánh.');
      setToastType('error');
      return;
    }

    setCompareIds(prev => {
      if (prev.includes(normalizedFacilityId)) {
        // Bỏ chọn
        return prev.filter(id => id !== normalizedFacilityId);
      }
      if (prev.length >= 4) {
        // EX-01: Đã đủ 4 bãi, hiển thị toast cảnh báo
        setToastMsg('Tối đa 4 bãi đỗ xe để so sánh!');
        setToastType('error');
        return prev;
      }
      return [...prev, normalizedFacilityId];
    });
  }, []);

  /**
   * Xóa 1 bãi khỏi danh sách so sánh (Case A.1: Remove item from matrix)
   */
  const handleRemoveFromCompare = useCallback((facId) => {
    setCompareIds(prev => {
      const updated = prev.filter(id => id !== facId);
      // Nếu còn lại < 2, tự đóng modal
      if (updated.length < 2) setIsCompareOpen(false);
      return updated;
    });
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    // Khởi tạo lấy params từ state (nếu từ HomePage chuyển qua)
    if (location.state) {
      if (location.state.keyword) setKeyword(location.state.keyword);
      if (location.state.vehicleType) setVehicleType(location.state.vehicleType);
      if (location.state.facilityError) {
        setToastMsg(location.state.facilityError);
        setToastType('error');
      }
    }
    fetchAmenities();
    if (!initialFacilitiesLoaded.current) {
      initialFacilitiesLoaded.current = true;
      fetchFacilities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    useUserLocation = true
  ) => {
    const requestId = ++latestSearchRequest.current;
    const parsedMinPrice = minPrice === '' ? null : Number(minPrice);
    const parsedMaxPrice = maxPrice === '' ? null : Number(maxPrice);
    if (
      (parsedMinPrice !== null && (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0)) ||
      (parsedMaxPrice !== null && (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0))
    ) {
      setError('Giá thuê phải là số không âm.');
      setToastMsg('Giá thuê phải là số không âm.');
      setToastType('error');
      return;
    }
    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      setError('Giá tối thiểu không được lớn hơn giá tối đa.');
      setToastMsg('Giá tối thiểu không được lớn hơn giá tối đa.');
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
        params.radius = radius;
      }

      const res = await facilityService.searchFacilities(params);
      if (res.status !== 'success') {
        throw new Error(res.message || 'Không thể tải danh sách bãi đỗ xe.');
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
        setError(err.message || 'Không thể tải dữ liệu bãi đỗ xe. Vui lòng thử lại.');
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

  const handleSearch = async (e) => {
    e?.preventDefault();
    setSearchedLocation(null);
    const location = await resolveSearchLocation(keyword);
    if (location) {
      await fetchFacilities(location[0], location[1], keyword, false);
    } else {
      await fetchFacilities(null, null, keyword, false);
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
    const location = await resolveSearchLocation(label, suggestion);
    if (location) {
      await fetchFacilities(location[0], location[1], label, false);
    } else {
      await fetchFacilities(null, null, label, false);
    }
  };

  /**
   * Xử lý di dời marker tìm kiếm của người dùng:
   * 1. Cập nhật vị trí ghim mới.
   * 2. Gọi reverse geocoding để lấy tên địa chỉ thực tế.
   * 3. Cập nhật thanh địa chỉ keyword nếu tìm thấy, hoặc giữ nguyên thanh địa chỉ cũ.
   *    Tuyệt đối KHÔNG ghi kinh độ vĩ độ vào thanh địa chỉ.
   * 4. Tìm lại các bãi xe xung quanh vị trí mới.
   * 5. Cập nhật lại tuyến đường chỉ đường nếu đang mở chỉ đường đến một bãi xe.
   */
  const handleSearchedLocationDragEnd = async (e) => {
    const marker = e.target;
    if (!marker) return;
    const pos = marker.getLatLng();
    const newCoords = [pos.lat, pos.lng];
    setUserLocation(null);
    setSearchedLocation(newCoords);

    let updatedKeyword = keyword;
    try {
      const resolvedAddress = await vietmapService.reverseGeocode(pos.lat, pos.lng);
      if (resolvedAddress && resolvedAddress.trim()) {
        updatedKeyword = resolvedAddress;
        setKeyword(resolvedAddress);
      }
    } catch (err) {
      console.error('Lỗi reverse geocoding khi kéo marker tìm kiếm:', err);
    }

    await fetchFacilities(pos.lat, pos.lng, updatedKeyword, false);
  };

  /**
   * Xử lý di dời marker vị trí GPS của người dùng
   */
  const handleUserLocationDragEnd = async (e) => {
    const marker = e.target;
    if (!marker) return;
    const pos = marker.getLatLng();
    const newCoords = [pos.lat, pos.lng];
    setSearchedLocation(null);
    setUserLocation(newCoords);

    let updatedKeyword = keyword;
    try {
      const resolvedAddress = await vietmapService.reverseGeocode(pos.lat, pos.lng);
      if (resolvedAddress && resolvedAddress.trim()) {
        updatedKeyword = resolvedAddress;
        setKeyword(resolvedAddress);
      }
    } catch (err) {
      console.error('Lỗi reverse geocoding khi kéo marker GPS:', err);
    }

    await fetchFacilities(pos.lat, pos.lng, updatedKeyword, true);
  };

  /**
   * Mở chỉ đường bằng Google Maps trực tiếp:
   * Điểm đi: Vị trí người dùng đã tìm kiếm hoặc vị trí GPS hiện tại (nếu có).
   * Điểm đến: Tọa độ hoặc địa chỉ của bãi đỗ xe.
   */
  const handleGetDirections = (fac) => {
    const facLat = Number(fac.latitude);
    const facLng = Number(fac.longitude);
    const destination = (Number.isFinite(facLat) && Number.isFinite(facLng))
      ? [facLat, facLng]
      : fac.address;

    if (!destination) {
      setToastMsg('Bãi đỗ xe này chưa có thông tin vị trí để chỉ đường.');
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
      ? `Đang mở chỉ đường đến "${fac.name}" trên Google Maps...`
      : 'Trình duyệt đã chặn cửa sổ Google Maps. Vui lòng cho phép popup và thử lại.');
    setToastType(opened ? 'success' : 'error');
  };

  const toggleAmenity = (id) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const isFirstRender = useRef(true);

  // Cập nhật tìm kiếm khi các bộ lọc thay đổi
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (searchedLocation) {
      fetchFacilities(searchedLocation[0], searchedLocation[1], keyword, false);
    } else {
      fetchFacilities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAmenities, vehicleType, radius, minPrice, maxPrice]);

  const handleLocationUnavailable = () => {
    setSearchedLocation(null);
    setUserLocation(DEFAULT_MAP_CENTER);
    setIsFallbackLocation(true);
    setLocationAccuracy(null);
    setMapCenter(DEFAULT_MAP_CENTER);
    setMapZoom(16);
    fetchFacilities(DEFAULT_MAP_CENTER[0], DEFAULT_MAP_CENTER[1], keyword, true);
    setToastMsg('Không thể xác định vị trí của bạn. Đã chuyển về khu vực Ninh Kiều, Cần Thơ.');
    setToastType('error');
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSearchedLocation(null);
          setUserLocation([lat, lng]);
          setIsFallbackLocation(false);
          setLocationAccuracy(Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null);
          setMapCenter([lat, lng]);
          setMapZoom(14);
          fetchFacilities(lat, lng, keyword, true);
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
    fetchFacilities();
  };

  const clearFilters = () => {
    setVehicleType('');
    setRadius(3);
    setMinPrice('');
    setMaxPrice('');
    setSelectedAmenities([]);
  };

  return (
    <div className="flex flex-col overflow-hidden bg-slate-50">
      {/* Toast thông báo giới hạn so sánh */}
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />

      {/* Modal so sánh (Function 3.41) */}
      <CompareModal
        selectedIds={compareIds}
        isOpen={isCompareOpen}
        comparisonLocation={searchedLocation || userLocation}
        onClose={() => setIsCompareOpen(false)}
        onRemove={handleRemoveFromCompare}
      />
      {/* HEADER / FILTER BAR */}
      <header className="relative bg-white border-b border-slate-200 shadow-sm z-[30] px-4 py-3 shrink-0">
        <form onSubmit={handleSearch} className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3">

          <div className="relative flex-1 w-full">
            <VietmapAddressAutocomplete
              value={keyword}
              onChange={(value) => {
                setKeyword(value);
                setSearchedLocation(null);
              }}
              onSelect={handleAddressSelect}
              placeholder="Nhập tên bãi đỗ, địa chỉ..."
              inputClassName="py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
            />
            {keyword && (
              <button type="button" onClick={clearKeyword} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
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
                placeholder="Giá từ"
                aria-label="Giá thuê tối thiểu"
                className="w-24 py-2.5 px-3 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
              />
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Giá đến"
                aria-label="Giá thuê tối đa"
                className="w-24 py-2.5 px-3 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
              />
            </div>

            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="py-2.5 px-3 bg-slate-100 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
            >
              <option value="">Tất cả loại xe</option>
              {displayVehicleTypes.map(vt => (
                <option key={vt.id} value={vt.id}>{vt.label}</option>
              ))}
            </select>

            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="py-2.5 px-3 bg-slate-100 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
            >
              <option value={1}>Bán kính 1 km</option>
              <option value={3}>Bán kính 3 km</option>
              <option value={5}>Bán kính 5 km</option>
              <option value={10}>Bán kính 10 km</option>
              <option value={20}>Bán kính 20 km</option>
            </select>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleLocateMe}
              title="Vị trí của tôi"
              className="px-4 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold rounded-xl border border-teal-200 flex items-center justify-center transition whitespace-nowrap"
            >
              <Navigation className="w-5 h-5" />
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 whitespace-nowrap flex-1 md:flex-none"
            >
              <Search className="w-5 h-5" /> Tìm Kiếm
            </button>
          </div>
        </form>

        <div className="max-w-7xl mx-auto mt-2 flex flex-wrap items-center gap-3 text-xs">
          {locationAccuracy !== null && (
            <span className="text-slate-500">
              Độ chính xác GPS: khoảng {Math.round(locationAccuracy)} m
            </span>
          )}
        </div>

        {/* Tiện ích Filter */}
        {(amenitiesList.length > 0 || vehicleType || selectedAmenities.length > 0 || minPrice !== '' || maxPrice !== '' || radius !== 3) && (
          <div className="max-w-7xl mx-auto mt-3 flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!(vehicleType || selectedAmenities.length > 0 || minPrice !== '' || maxPrice !== '' || radius !== 3)}
              className="px-3 py-1.5 text-xs font-semibold rounded-full border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-50"
            >
              Xóa bộ lọc
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase mr-2">Danh mục tiện ích:</span>
            {amenitiesList.map((amenity) => {
              const isSelected = selectedAmenities.includes(amenity.id);
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${isSelected
                    ? 'bg-teal-100 border-teal-300 text-teal-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {amenity.name}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* MAIN SPLIT VIEW */}
      <main className="flex-none h-[700px] md:h-[calc(100vh-180px)] md:max-h-[800px] min-h-0 flex flex-col-reverse md:flex-row overflow-hidden relative">
        {/* LEFT PANEL: LIST OF RESULTS */}
        <div className="w-full md:w-[450px] lg:w-[500px] h-1/2 md:h-full min-h-0 bg-slate-50 border-r border-slate-200 flex flex-col shadow-xl z-20">
          <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-slate-900">
              Tìm thấy <span className="text-teal-600">{facilities.length}</span> bãi xe phù hợp
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <List className="w-4 h-4" /> Dạng danh sách
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="text-center py-10 text-slate-500">Đang tìm kiếm...</div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : facilities.length === 0 ? (
              <div className="text-center py-10 text-slate-500 flex flex-col items-center">
                <Info className="w-10 h-10 mb-3 text-slate-300" />
                <p>Không tìm thấy bãi đỗ xe phù hợp.</p>
                <p className="text-sm mt-1">Hãy thử mở rộng bán kính hoặc đổi từ khóa.</p>
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
                      ? 'border-teal-400 shadow-teal-100 ring-2 ring-teal-300/50'
                      : 'border-slate-200 hover:shadow-md hover:border-teal-300'
                      }`}
                    onClick={() => {
                      if (fac.latitude && fac.longitude) {
                        setMapCenter([fac.latitude, fac.longitude]);
                        setMapZoom(16);
                      }
                    }}
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="relative w-24 h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                        {fac.images && fac.images.length > 0 ? (
                          <img src={fac.images[0].image_url} alt={fac.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <CarFront className="w-8 h-8" />
                          </div>
                        )}
                        {isOutOfSlots && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-md tracking-wide">
                            Hết chỗ
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between relative">
                        <button
                          type="button"
                          id={`compare-checkbox-${fac.id}`}
                          onClick={(e) => handleToggleCompare(e, fac.id)}
                          title={isSelected ? 'Bỏ chọn so sánh' : 'Thêm vào so sánh'}
                          className={`absolute -top-1 -right-1 z-10 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition ${isSelected
                            ? 'bg-teal-100 border-teal-300 text-teal-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600'
                            }`}
                        >
                          {isSelected
                            ? <CheckSquare className="w-3.5 h-3.5" />
                            : <Square className="w-3.5 h-3.5" />
                          }
                          So sánh
                        </button>
                        <div className="pr-20">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-slate-900 line-clamp-1">{fac.name}</h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {fac.address}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{getFacilityRating(fac).average ?? 'Chưa có'}</span>
                              {getFacilityRating(fac).count > 0 && <span className="font-normal">({getFacilityRating(fac).count})</span>}
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded-lg border ${isOutOfSlots
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-teal-50 text-teal-700 border-teal-200'
                              }`}>
                              {isOutOfSlots
                                ? `Còn 0/${fac.capacity || 0} chỗ`
                                : `Còn ${fac.available_slots ?? fac.capacity}/${fac.capacity || 0} chỗ`}
                            </div>
                          </div>
                          {fac.distance !== null && fac.distance !== undefined && (
                            <div className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">
                              Cách bạn: {(fac.distance).toFixed(1)} km
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Giá thuê trọn gói</div>
                        <div className="text-lg font-bold text-teal-600">
                          {fac.price_per_month ? fac.price_per_month.toLocaleString('vi-VN') : '0'} đ <span className="text-xs text-slate-400 font-normal">/ tháng</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, fac.id)}
                          aria-label={favoriteIds.includes(Number(fac.id)) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                          title={favoriteIds.includes(Number(fac.id)) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${favoriteIds.includes(Number(fac.id)) ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                        </button>
                        {/* Nút Chỉ đường trực tiếp qua Google Maps */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGetDirections(fac);
                          }}
                          title="Chỉ đường trên Google Maps"
                          className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-teal-200 shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Chỉ đường
                        </button>
                        {/* Nút Chi tiết */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleNavigateToDetail(fac.id); }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: INTERACTIVE MAP */}
        <div className="flex-1 h-1/2 md:h-full min-h-0 relative z-0">
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <MapInitialCenter center={mapCenter} zoom={mapZoom} />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <MapSizeInvalidator />
            <TileLayer
              attribution='&copy; Vietmap'
              url={`https://maps.vietmap.vn/api/tm/{z}/{x}/{y}.png?apikey=${VIETMAP_TILE_KEY}`}
              keepBuffer={1}
              updateWhenIdle
              updateWhenZooming={false}
              eventHandlers={{
                tileerror: () => {
                  setMapTileError(true);
                  setToastMsg('Không thể tải bản đồ Vietmap. Danh sách bãi xe vẫn được giữ lại.');
                  setToastType('error');
                },
                tileload: () => setMapTileError(false),
              }}
            />
            {mapTileError && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] rounded-lg bg-white/95 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 shadow-lg">
                Không thể tải bản đồ Vietmap. Danh sách bãi xe vẫn được hiển thị.
              </div>
            )}

            {/* Phạm vi tìm kiếm, ưu tiên tâm là địa điểm được search bằng chữ */}
            {(searchedLocation || userLocation) && (
              <Circle
                center={searchedLocation || userLocation}
                radius={radius * 1000}
                pathOptions={{ color: '#0d9488', fillColor: '#0d9488', fillOpacity: 0.1, weight: 1 }}
              />
            )}

            {/* Vị trí địa chỉ được tìm kiếm bằng chữ - Cho phép kéo thả di dời */}
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
                      <MapPin className="w-3.5 h-3.5" /> Điểm tìm kiếm của bạn
                    </div>
                    <p className="text-xs text-slate-700 mt-1">{keyword || 'Vị trí đã chọn'}</p>
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      Kéo thả ghim để tinh chỉnh vị trí chuẩn thực tế hơn
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Vị trí của user - Cho phép kéo thả di dời */}
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
                    <div className="font-bold text-teal-600 text-xs flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> Vị trí hiện tại của bạn
                    </div>
                    <p className="text-xs text-slate-700 mt-1">
                      {isFallbackLocation ? 'Vị trí mặc định: Ninh Kiều, Cần Thơ' : (keyword || 'Vị trí của bạn')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      Kéo thả ghim để tinh chỉnh vị trí chuẩn thực tế hơn
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Các bãi đỗ xe */}
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
                  .map(item => item.amenity?.name || item.name)
                  .filter(Boolean)
                  .slice(0, 3);

                return (
                  <Marker key={fac.id} position={[latitude, longitude]} icon={facilityCarIcon}>
                    <Popup minWidth={290} maxWidth={320} className="parklink-facility-popup">
                      <div className="w-[270px] overflow-hidden rounded-xl bg-white text-slate-800">
                        <div className="relative h-28 -mx-0 -mt-0 overflow-hidden bg-slate-100">
                          {primaryImage ? (
                            <img
                              src={primaryImage.image_url}
                              alt={fac.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <CarFront className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                          <div className="absolute left-2.5 bottom-2 flex items-center gap-1.5">
                            <span className="px-2 py-1 rounded-md bg-teal-600 text-white text-[10px] font-bold">
                              Đã xác thực
                            </span>
                            {isOutOfSlots && (
                              <span className="px-2 py-1 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-sm">
                                Hết chỗ
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                #{String(fac.id).padStart(4, '0')}
                              </p>
                              <h4 className="mt-0.5 text-sm font-bold leading-tight text-slate-900 line-clamp-2">
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

                          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-slate-500">
                            <MapPin className="mt-0.5 w-3.5 h-3.5 shrink-0 text-teal-600" />
                            <span className="line-clamp-2">{fac.address || 'Chưa cập nhật địa chỉ'}</span>
                          </p>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-teal-50 px-2 py-1.5">
                              <p className="text-[10px] text-teal-700">Giá thuê tháng</p>
                              <p className="mt-0.5 text-xs font-bold text-teal-800">
                                {Number(fac.price_per_month || 0).toLocaleString('vi-VN')} đ
                              </p>
                            </div>
                            <div className={`rounded-lg px-2 py-1.5 ${isOutOfSlots ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50'}`}>
                              <p className={`text-[10px] ${isOutOfSlots ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>Tình trạng chỗ</p>
                              <p className={`mt-0.5 text-xs font-bold ${isOutOfSlots ? 'text-rose-700' : 'text-slate-800'}`}>
                                {isOutOfSlots ? `Còn 0/${fac.capacity || 0} chỗ` : `Còn ${fac.available_slots ?? fac.capacity}/${fac.capacity || 0} chỗ`}
                              </p>
                            </div>
                          </div>

                          {amenityNames.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {amenityNames.map((amenity, index) => (
                                <span key={`${amenity}-${index}`} className="rounded bg-slate-100 px-1.5 py-1 text-[10px] text-slate-600">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Hàng 2 nút: Xem chi tiết và Chỉ đường Google Maps */}
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleNavigateToDetail(fac.id)}
                              className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-bold text-white transition hover:bg-slate-800 text-center"
                            >
                              Chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGetDirections(fac);
                              }}
                              className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                              title="Chỉ đường trên Google Maps"
                            >
                              <Navigation className="w-3.5 h-3.5" /> Chỉ đường
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

          {/* MAP BADGE */}
          <div className="absolute top-4 left-4 z-[400] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700">Live Map View</span>
            </div>
          </div>
        </div>
      </main>

      {/* ═══ FLOATING COMPARE BAR ═══
           Hiển thị khi có ít nhất 2 bãi được chọn
           Cho phép người dùng xem lại danh sách và mở modal so sánh */}
      {compareIds.length >= 2 && (
        <div
          id="floating-compare-bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] w-auto max-w-xl px-5 py-3 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-4 animate-slideUp"
        >
          {/* Thông tin bãi đã chọn */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
              <GitCompareArrows className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-xs">
                Đã chọn <span className="text-teal-400">{compareIds.length}</span>/4 bãi xe để so sánh
              </p>
              <p className="text-slate-400 text-[10px] truncate">
                {facilities
                  .filter(f => compareIds.includes(f.id))
                  .map(f => f.name)
                  .join(' · ')}
              </p>
            </div>
          </div>

          {/* Nút xóa tất cả */}
          <button
            id="compare-bar-clear-btn"
            onClick={() => setCompareIds([])}
            title="Bỏ chọn tất cả"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Nút So Sánh */}
          <button
            id="compare-bar-submit-btn"
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 text-sm font-extrabold rounded-xl transition shrink-0 shadow-lg"
          >
            <GitCompareArrows className="w-4 h-4" />
            So Sánh ({compareIds.length} bãi xe)
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
