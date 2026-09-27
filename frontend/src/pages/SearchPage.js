import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation, CarFront, Shield, Star, Info, List, X } from 'lucide-react';
import facilityService from '../services/facilityService';
import { VEHICLE_TYPES } from '../constants/vehicleTypes';

// Fix icon lỗi mặc định của leaflet khi dùng React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.0.0/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const VIETMAP_TILE_KEY = '8ce2ec00f08f39b06ab91ff4857323caddf621faedecc24e';

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
  
  // Trạng thái tìm kiếm
  const [keyword, setKeyword] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [radius, setRadius] = useState(3);
  
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [userLocation, setUserLocation] = useState(null); // [lat, lng]
  const [mapCenter, setMapCenter] = useState([10.0299, 105.7706]); // Mặc định Cần Thơ
  const [mapZoom, setMapZoom] = useState(13);

  const [amenitiesList, setAmenitiesList] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  useEffect(() => {
    // Khởi tạo lấy params từ state (nếu từ HomePage chuyển qua)
    if (location.state) {
      if (location.state.keyword) setKeyword(location.state.keyword);
      if (location.state.vehicleType) setVehicleType(location.state.vehicleType);
    }
    fetchAmenities();
    fetchFacilities();
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

  const fetchFacilities = async (currentLat = null, currentLng = null) => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        keyword,
        vehicle_type: vehicleType,
        radius,
      };
      
      if (selectedAmenities.length > 0) {
        params.amenities = selectedAmenities.join(',');
      }
      
      const lat = currentLat || (userLocation ? userLocation[0] : null);
      const lng = currentLng || (userLocation ? userLocation[1] : null);
      
      if (lat && lng) {
        params.lat = lat;
        params.lng = lng;
      }

      const res = await facilityService.searchFacilities(params);
      if (res.status === 'success') {
        setFacilities(res.data);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi lấy dữ liệu bãi đỗ xe');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchFacilities();
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
    fetchFacilities();
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
    fetchFacilities();
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* HEADER / FILTER BAR */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10 px-4 py-3 shrink-0">
        <form onSubmit={handleSearch} className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3">
          
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập tên bãi đỗ, địa chỉ..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                    isSelected 
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
      <main className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden relative">
        {/* LEFT PANEL: LIST OF RESULTS */}
        <div className="w-full md:w-[450px] lg:w-[500px] h-1/2 md:h-full bg-slate-50 border-r border-slate-200 flex flex-col shadow-xl z-20">
          <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-slate-900">
              Tìm thấy <span className="text-teal-600">{facilities.length}</span> bãi xe phù hợp
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <List className="w-4 h-4" /> Dạng danh sách
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              facilities.map((fac) => (
                <div key={fac.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-teal-300 transition cursor-pointer" onClick={() => {
                  if(fac.latitude && fac.longitude) {
                    setMapCenter([fac.latitude, fac.longitude]);
                    setMapZoom(16); // Zoom lên
                  }
                }}>
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
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 line-clamp-1">{fac.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {fac.address}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>4.8</span> {/* Mặc định demo */}
                        </div>
                        {fac.distance !== null && fac.distance !== undefined && (
                          <div className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">
                            Cách bạn: {(fac.distance).toFixed(1)} km
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">Giá thuê trọn gói</div>
                      <div className="text-lg font-bold text-teal-600">
                        {fac.price_per_month ? fac.price_per_month.toLocaleString('vi-VN') : '0'} đ <span className="text-xs text-slate-400 font-normal">/ tháng</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/facility/${fac.id}`); }} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition">
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: INTERACTIVE MAP */}
        <div className="flex-1 h-1/2 md:h-full relative z-0">
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; Vietmap'
              url={`https://maps.vietmap.vn/api/tm/{z}/{x}/{y}@2x.png?apikey=${VIETMAP_TILE_KEY}`}
            />
            
            {/* Vị trí của user */}
            {userLocation && (
              <>
                <Circle 
                  center={userLocation} 
                  radius={radius * 1000} 
                  pathOptions={{ color: '#0d9488', fillColor: '#0d9488', fillOpacity: 0.1, weight: 1 }} 
                />
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
                return (
                  <Marker key={fac.id} position={[fac.latitude, fac.longitude]}>
                    <Popup>
                      <div className="w-48">
                        <h4 className="font-bold text-slate-900">{fac.name}</h4>
                        <p className="text-teal-600 font-bold my-1">{fac.price_per_month?.toLocaleString('vi-VN')} đ/tháng</p>
                        <button onClick={() => navigate(`/facility/${fac.id}`)} className="mt-2 w-full text-center py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition">
                          Xem chi tiết
                        </button>
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
    </div>
  );
};

export default SearchPage;
