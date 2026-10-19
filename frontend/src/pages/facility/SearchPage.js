import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation, CarFront, Star, Info, List, X, GitCompareArrows, CheckSquare, Square, Heart } from 'lucide-react';
import facilityService from '../../services/facilityService';
import { addFavorite, removeFavorite, getFavorites } from '../../services/favoriteService';
import { useAuth } from '../../context/AuthContext';
import { VEHICLE_TYPES } from '../../constants/vehicleTypes';
import CompareModal from '../../components/modals/CompareModal';
import { facilityCarIcon } from '../../utils/mapIcons';
import Toast from '../../components/common/Toast';
import VietmapAddressAutocomplete from '../../components/common/VietmapAddressAutocomplete';

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
const VIETMAP_API_KEY = process.env.REACT_APP_VIETMAP_API_KEY;

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
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Trạng thái tìm kiếm
  const [keyword, setKeyword] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [radius, setRadius] = useState(3);

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userLocation, setUserLocation] = useState(null); // [lat, lng]
  const [searchedLocation, setSearchedLocation] = useState(null); // [lat, lng]
  const [mapCenter, setMapCenter] = useState([10.0299, 105.7706]); // Mặc định Cần Thơ
  const [mapZoom, setMapZoom] = useState(13);

  const [amenitiesList, setAmenitiesList] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // ─── State cho chức năng So sánh (Function 3.41) ───
  const [compareIds, setCompareIds] = useState([]);         // Danh sách ID bãi đang chọn so sánh
  const [isCompareOpen, setIsCompareOpen] = useState(false); // Trạng thái mở modal so sánh
  const [toastMsg, setToastMsg] = useState('');              // Toast thông báo lỗi giới hạn
  const [toastType, setToastType] = useState('error');

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
      setToastMsg(err.message || 'Lỗi khi cập nhật danh sách yêu thích');
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
    // Khởi tạo lấy params từ state (nếu từ HomePage chuyển qua)
    if (location.state) {
      if (location.state.keyword) setKeyword(location.state.keyword);
      if (location.state.vehicleType) setVehicleType(location.state.vehicleType);
    }
    fetchAmenities();
    fetchFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    try {
      setLoading(true);
      setError('');

      const params = {
        keyword: searchKeyword,
        vehicle_type: vehicleType,
        radius,
      };

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

      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }

      const res = await facilityService.searchFacilities(params);
      if (res.status === 'success') {
        setFacilities(res.data.map((facility) => ({
          ...facility,
          ...(() => {
            const rating = getFacilityRating(facility);
            return { avg_rating: rating.average, total_reviews: rating.count };
          })(),
        })));
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi lấy dữ liệu bãi đỗ xe');
    } finally {
      setLoading(false);
    }
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
    if (!VIETMAP_API_KEY) return;

    try {
      let coordinates = suggestion;

      if ((!coordinates?.lat || !coordinates?.lng) && coordinates?.ref_id) {
        const placeResponse = await fetch(
          `https://maps.vietmap.vn/api/place/v3?apikey=${encodeURIComponent(VIETMAP_API_KEY)}&refid=${encodeURIComponent(coordinates.ref_id)}`
        );
        if (placeResponse.ok) {
          coordinates = await placeResponse.json();
        }
      }

      if ((!coordinates?.lat || !coordinates?.lng) && query.trim()) {
        const searchResponse = await fetch(
          `https://maps.vietmap.vn/api/search/v3?apikey=${encodeURIComponent(VIETMAP_API_KEY)}&text=${encodeURIComponent(query)}`
        );
        if (searchResponse.ok) {
          const data = await searchResponse.json();
          const firstResult = Array.isArray(data) ? data[0] : data?.data?.[0];
          if (firstResult?.lat && firstResult?.lng) {
            coordinates = firstResult;
          } else if (firstResult?.ref_id) {
            const placeResponse = await fetch(
              `https://maps.vietmap.vn/api/place/v3?apikey=${encodeURIComponent(VIETMAP_API_KEY)}&refid=${encodeURIComponent(firstResult.ref_id)}`
            );
            if (placeResponse.ok) coordinates = await placeResponse.json();
          }
        }
      }

      if (coordinates?.lat && coordinates?.lng) {
        const location = [Number(coordinates.lat), Number(coordinates.lng)];
        setSearchedLocation(location);
        setMapCenter(location);
        setMapZoom(16);
        return location;
      }
    } catch (error) {
      // Search results remain usable even if map geocoding is unavailable.
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
  }, [selectedAmenities, vehicleType, radius]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setMapCenter([lat, lng]);
          setMapZoom(14);
          fetchFacilities(lat, lng);
        },
        () => {
          alert('Không thể xác định vị trí của bạn. Vui lòng cho phép quyền truy cập vị trí.');
        }
      );
    } else {
      alert('Trình duyệt của bạn không hỗ trợ Geolocation.');
    }
  };

  const clearKeyword = () => {
    setKeyword('');
    setSearchedLocation(null);
    fetchFacilities();
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
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="py-2.5 px-3 bg-slate-100 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
            >
              <option value="">Tất cả loại xe</option>
              {VEHICLE_TYPES.map(vt => (
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

        {/* Tiện ích Filter */}
        {amenitiesList.length > 0 && (
          <div className="max-w-7xl mx-auto mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-slate-500 uppercase mr-2">Danh mục tiện ích:</span>
            {amenitiesList.map(amenity => {
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
                      <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                        {fac.images && fac.images.length > 0 ? (
                          <img src={fac.images[0].image_url} alt={fac.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <CarFront className="w-8 h-8" />
                          </div>
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
                          <h3 className="font-bold text-slate-900 line-clamp-1">{fac.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {fac.address}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200">
                            <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{getFacilityRating(fac).average ?? 'Chưa có'}</span>
                          {getFacilityRating(fac).count > 0 && <span className="font-normal">({getFacilityRating(fac).count})</span>}
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
                        {/* Nút Chi tiết */}
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/facility/${fac.id}`); }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition"
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
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; Vietmap'
              url={`https://maps.vietmap.vn/api/tm/{z}/{x}/{y}.png?apikey=${VIETMAP_TILE_KEY}`}
              keepBuffer={1}
              updateWhenIdle
              updateWhenZooming={false}
            />

            {/* Phạm vi tìm kiếm, ưu tiên tâm là địa điểm được search bằng chữ */}
            {(searchedLocation || userLocation) && (
              <Circle
                center={searchedLocation || userLocation}
                radius={radius * 1000}
                pathOptions={{ color: '#0d9488', fillColor: '#0d9488', fillOpacity: 0.1, weight: 1 }}
              />
            )}

            {/* Vị trí địa chỉ được tìm kiếm bằng chữ */}
            {searchedLocation && (
              <Marker position={searchedLocation} icon={searchedLocationIcon}>
                <Popup>
                  <div className="font-bold text-red-600">Địa điểm tìm kiếm</div>
                </Popup>
              </Marker>
            )}

            {/* Vị trí của user */}
            {userLocation && (
              <>
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>
                    <div className="font-bold text-teal-600">Vị trí của bạn</div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Các bãi đỗ xe */}
            {facilities.map(fac => {
              if (fac.latitude && fac.longitude) {
                const primaryImage = fac.images?.find(image => image.is_primary) || fac.images?.[0];
                const facilityRating = getFacilityRating(fac).average;
                const amenityNames = (fac.facility_amenities || [])
                  .map(item => item.amenity?.name || item.name)
                  .filter(Boolean)
                  .slice(0, 3);

                return (
                  <Marker key={fac.id} position={[fac.latitude, fac.longitude]} icon={facilityCarIcon}>
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
                          <span className="absolute left-2.5 bottom-2 px-2 py-1 rounded-md bg-teal-600 text-white text-[10px] font-bold">
                            Đã xác thực
                          </span>
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
                            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                              <p className="text-[10px] text-slate-500">Sức chứa</p>
                              <p className="mt-0.5 text-xs font-bold text-slate-800">
                                {fac.capacity || '—'} chỗ
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

                          <button
                            type="button"
                            onClick={() => navigate(`/facility/${fac.id}`)}
                            className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-xs font-bold text-white transition hover:bg-teal-700"
                          >
                            Xem chi tiết bãi xe
                          </button>
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
