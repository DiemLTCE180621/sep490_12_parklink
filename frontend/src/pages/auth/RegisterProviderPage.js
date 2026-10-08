import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { Building2, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Car, Calculator, CheckSquare, Square, Phone, Mail } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VEHICLE_TYPES } from '../../constants/vehicleTypes';
import { cleanText, isValidName, isValidPhone, isValidEmail, isValidFacilityName } from '../../utils/validators';
import VietmapAddressAutocomplete from '../../components/common/VietmapAddressAutocomplete';


// Fix icon mặc định của leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ lat, lng, setFormData }) => {
  useMapEvents({
    click(e) {
      setFormData(prev => ({
        ...prev,
        latitude: e.latlng.lat.toString(),
        longitude: e.latlng.lng.toString()
      }));
    },
  });
  return lat && lng ? <Marker position={[lat, lng]} /> : null;
};


const RegisterProviderPage = () => {
  const { registerProvider } = useAuth();

  // State tiện ích được lấy động từ Database (Bảng Amenity)
  const [dbAmenities, setDbAmenities] = useState([]);
  const [loadingAmenities, setLoadingAmenities] = useState(true);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    facility_name: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '5',
    price_per_month: '1500000',
    vehicle_types: [VEHICLE_TYPES[0].id],
    amenity_ids: []
  });

  const [errorList, setErrorList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const [locationMode, setLocationMode] = useState('auto'); // 'auto' | 'manual'
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const VIETMAP_API_KEY = process.env.REACT_APP_VIETMAP_API_KEY;
  const VIETMAP_TILE_KEY = process.env.REACT_APP_VIETMAP_TILE_KEY;

  // Tải danh mục Tiện ích từ Database khi khởi tạo trang
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        setLoadingAmenities(true);
        const res = await authService.getAmenities();
        if (res?.data?.amenities) {
          setDbAmenities(res.data.amenities);
          // Tự động chọn 3 tiện ích đầu tiên mặc định
          const defaultIds = res.data.amenities.slice(0, 3).map(a => a.id);
          setFormData(prev => ({ ...prev, amenity_ids: defaultIds }));
        }
      } catch (err) {
        console.error('Lỗi tải danh mục tiện ích từ DB:', err);
      } finally {
        setLoadingAmenities(false);
      }
    };

    fetchAmenities();
  }, []);

  // Tính phí tự động hiển thị trực tiếp cho Provider theo quy mô Slot
  const calculateFee = (capStr) => {
    const slots = parseInt(capStr, 10) || 0;
    if (slots >= 1 && slots <= 3) return 2000000;
    if (slots >= 4 && slots <= 7) return 4000000;
    if (slots > 7) return 6000000;
    return 0;
  };

  const systemFee = calculateFee(formData.capacity);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorList.length > 0) setErrorList([]);
  };

  const handleGeocode = async () => {
    if (!formData.address) return;
    setGeocodeLoading(true);
    try {
      const response = await fetch(`https://maps.vietmap.vn/api/search/v3?apikey=${VIETMAP_API_KEY}&text=${encodeURIComponent(formData.address)}`);
      const data = await response.json();
      if (data && data.length > 0 && data[0].ref_id) {
        const placeRes = await fetch(`https://maps.vietmap.vn/api/place/v3?apikey=${VIETMAP_API_KEY}&refid=${data[0].ref_id}`);
        const placeData = await placeRes.json();
        
        if (placeData && placeData.lat && placeData.lng) {
          setFormData(prev => ({
            ...prev,
            latitude: placeData.lat.toString(),
            longitude: placeData.lng.toString()
          }));
          alert(`Đã tìm thấy tọa độ: ${placeData.lat}, ${placeData.lng}`);
        } else {
          alert('Không tìm thấy tọa độ chính xác cho địa chỉ này, vui lòng chọn trên bản đồ.');
        }
      } else {
        alert('Không tìm thấy địa chỉ này, vui lòng nhập chi tiết hơn hoặc chọn trên bản đồ.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối đến dịch vụ bản đồ VietMap.');
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleAddressSelect = async (suggestion, label) => {
    setFormData(prev => ({
      ...prev,
      address: label,
      latitude: '',
      longitude: ''
    }));

    if (!suggestion?.ref_id) return;

    setGeocodeLoading(true);
    try {
      const placeResponse = await fetch(
        `https://maps.vietmap.vn/api/place/v3?apikey=${encodeURIComponent(VIETMAP_API_KEY)}&refid=${encodeURIComponent(suggestion.ref_id)}`
      );
      if (!placeResponse.ok) {
        throw new Error(`Vietmap place lookup failed with status ${placeResponse.status}`);
      }

      const placeData = await placeResponse.json();
      if (placeData?.lat && placeData?.lng) {
        setFormData(prev => ({
          ...prev,
          address: label,
          latitude: String(placeData.lat),
          longitude: String(placeData.lng)
        }));
      }
    } catch (error) {
      console.error('Lỗi lấy tọa độ địa chỉ Vietmap:', error);
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleVehicleTypeToggle = (typeId) => {
    const currentTypes = [...formData.vehicle_types];
    if (currentTypes.includes(typeId)) {
      if (currentTypes.length > 1) {
        setFormData({ ...formData, vehicle_types: currentTypes.filter(t => t !== typeId) });
      }
    } else {
      setFormData({ ...formData, vehicle_types: [...currentTypes, typeId] });
    }
  };

  const handleAmenityToggle = (amenityId) => {
    const currentIds = [...formData.amenity_ids];
    if (currentIds.includes(amenityId)) {
      setFormData({ ...formData, amenity_ids: currentIds.filter(id => id !== amenityId) });
    } else {
      setFormData({ ...formData, amenity_ids: [...currentIds, amenityId] });
    }
  };

  const validateForm = () => {
    const errs = [];
    const cleanedName = cleanText(formData.full_name);
    const cleanedPhone = formData.phone_number.trim();
    const cleanedEmail = formData.email.trim();
    const cleanedFacilityName = cleanText(formData.facility_name);

    if (!isValidName(cleanedName)) {
      errs.push('Họ và tên người đại diện chỉ được chứa chữ cái, tối thiểu 2 ký tự và không chứa số hay ký tự đặc biệt.');
    }

    if (!isValidEmail(cleanedEmail)) {
      errs.push('Email nhận thông báo không đúng định dạng (Ví dụ: provider@example.com).');
    }

    if (!isValidPhone(cleanedPhone)) {
      errs.push('Số điện thoại liên hệ phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0987654321).');
    }

    if (!isValidFacilityName(cleanedFacilityName)) {
      errs.push('Tên cơ sở bãi đỗ xe phải có ít nhất 3 ký tự, chỉ gồm chữ cái, số và khoảng trắng.');
    }

    if (!formData.capacity || isNaN(formData.capacity) || Number(formData.capacity) <= 0) {
      errs.push('Sức chứa bãi đỗ xe phải là số nguyên lớn hơn 0.');
    }

    if (!formData.price_per_month || isNaN(formData.price_per_month) || Number(formData.price_per_month) <= 0) {
      errs.push('Giá thuê theo tháng phải lớn hơn 0 VNĐ.');
    }

    return { isValid: errs.length === 0, errs, cleanedName, cleanedEmail, cleanedPhone, cleanedFacilityName };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorList([]);

    const { isValid, errs, cleanedName, cleanedEmail, cleanedPhone, cleanedFacilityName } = validateForm();
    if (!isValid) {
      setErrorList(errs);
      return;
    }

    try {
      setLoading(true);
      const res = await registerProvider({
        full_name: cleanedName,
        email: cleanedEmail,
        phone_number: cleanedPhone,
        facility_name: cleanedFacilityName,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        capacity: formData.capacity,
        price_per_month: formData.price_per_month,
        vehicle_types: formData.vehicle_types,
        amenity_ids: formData.amenity_ids
      });

      setSuccessResult(res?.data);
    } catch (err) {
      if (err.errors && err.errors.length > 0) {
        setErrorList(err.errors);
      } else {
        setErrorList([err.message || 'Khai báo bãi đỗ xe thất bại!']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white shadow-xl mb-4">
            <Building2 className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Đăng Ký Khai Báo Bãi Đỗ Xe
          </h2>
        </div>

        <div className="bg-white shadow-xl rounded-3xl border border-slate-100 p-8 sm:p-10">
          {errorList.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-800">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span>Vui lòng kiểm tra lại thông tin khai báo:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-red-700 pl-1">
                {errorList.map((errItem, idx) => (
                  <li key={idx}>{errItem}</li>
                ))}
              </ul>
            </div>
          )}

          {successResult ? (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-orange-50 border border-orange-200 text-orange-900 space-y-4">
                <div className="flex items-center gap-3 text-orange-800 font-bold text-lg">
                  <CheckCircle2 className="w-7 h-7 text-orange-600 shrink-0" />
                  <span>Đã Gửi Yêu Cầu Đăng Ký Thành Công!</span>
                </div>

                <p className="text-sm leading-relaxed">
                  Yêu cầu đăng ký tài khoản của <strong>{formData.full_name}</strong> và cơ sở bãi xe <strong>{formData.facility_name}</strong> ({formData.capacity} slots đỗ) đã được gửi đến hệ thống và đang chờ Ban quản trị phê duyệt.
                </p>

                <div className="p-4 bg-white rounded-xl border border-orange-100 space-y-2 text-xs">
                  <p className="font-bold text-orange-900 flex items-center gap-1.5 text-sm">
                    <Calculator className="w-4 h-4 text-orange-600" /> Phí Nền Tảng Dự Kiến: {Number(successResult.system_fee).toLocaleString('vi-VN')} VNĐ
                  </p>
                  <p className="text-slate-600">
                    📧 Mật khẩu đăng nhập sẽ được gửi tới email <strong>{formData.email}</strong> sau khi cơ sở của bạn được phê duyệt chính thức.
                  </p>
                </div>
              </div>

              <Link
                to="/"
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition flex justify-center items-center gap-2"
              >
                Trở Về Trang Chủ <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* PHẦN 1: THÔNG TIN TÀI KHOẢN ĐẠI DIỆN */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                  <User className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-bold text-slate-900">1. Thông Tin Người Đại Diện Cơ Sở</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Họ và tên đại diện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên"
                      className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Số điện thoại cơ sở / liên hệ <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Nhập số điện thoại"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Email nhận thông báo & Mật khẩu cấp <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Nhập địa chỉ email"
                        className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: CHI TIẾT BÃI ĐỖ XE & ĐỊA CHỈ GOOGLE MAPS */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-bold text-slate-900">2. Chi Tiết Cơ Sở Bãi Đỗ Xe & Vị Trí Google Maps</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Tên Cơ Sở Bãi Đỗ Xe <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="facility_name"
                      value={formData.facility_name}
                      onChange={handleChange}
                      placeholder="Nhập tên cơ sở bãi đỗ xe"
                      className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Địa chỉ chi tiết cơ sở & Tọa độ GPS <span className="text-red-500">*</span>
                    </label>

                    <div className="flex gap-4 mb-4">
                      <button type="button" onClick={() => setLocationMode('auto')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors border ${locationMode === 'auto' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Tự động tìm tọa độ</button>
                      <button type="button" onClick={() => setLocationMode('manual')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors border ${locationMode === 'manual' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>Chọn trên bản đồ</button>
                    </div>

                    {locationMode === 'auto' ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <VietmapAddressAutocomplete
                            value={formData.address}
                            onChange={(value) => setFormData(prev => ({ ...prev, address: value, latitude: '', longitude: '' }))}
                            onSelect={handleAddressSelect}
                            placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                            inputClassName="py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            required
                          />
                        </div>
                        <button type="button" onClick={handleGeocode} disabled={geocodeLoading} className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition whitespace-nowrap">
                          {geocodeLoading ? 'Đang tìm...' : 'Tìm Tọa Độ'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <VietmapAddressAutocomplete
                            value={formData.address}
                            onChange={(value) => setFormData(prev => ({ ...prev, address: value, latitude: '', longitude: '' }))}
                            onSelect={handleAddressSelect}
                            placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                            inputClassName="py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div className="h-72 rounded-xl overflow-hidden border border-slate-300 relative z-0">
                          <MapContainer center={[formData.latitude || 10.0299, formData.longitude || 105.7706]} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url={`https://maps.vietmap.vn/api/tm/{z}/{x}/{y}@2x.png?apikey=${VIETMAP_TILE_KEY}`} />
                            <LocationPicker lat={formData.latitude} lng={formData.longitude} setFormData={setFormData} />
                          </MapContainer>
                        </div>
                        <p className="text-xs text-slate-500 text-center font-medium">Click trực tiếp vào bản đồ để thả ghim xác định tọa độ chính xác</p>
                      </div>
                    )}

                    {formData.latitude && formData.longitude && (
                      <div className="mt-3 p-3 bg-teal-50 border border-teal-100 rounded-xl text-xs text-teal-800 font-mono">
                        Tọa độ hiện tại: [{formData.latitude}, {formData.longitude}]
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Sức chứa (Tổng số slot đỗ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        placeholder="5"
                        min="1"
                        className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Giá thuê theo tháng (VNĐ/tháng) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price_per_month"
                        value={formData.price_per_month}
                        onChange={handleChange}
                        placeholder="1500000"
                        step="50000"
                        min="100000"
                        className="block w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* THẺ TÍNH PHÍ NỀN TẢNG TỰ ĐỘNG */}
                  <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-teal-800 font-bold uppercase tracking-wider">Phí nền tảng thí điểm (Thu 1 lần)</p>
                      <p className="text-xs text-teal-700 mt-0.5">
                        {formData.capacity <= 3 ? 'Gói 1 - 3 slot' : formData.capacity <= 7 ? 'Gói 4 - 7 slot' : 'Gói quy mô lớn (>7 slot)'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-teal-900">
                        {systemFee.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  </div>

                  {/* Loại phương tiện nhận gửi */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Loại phương tiện nhận gửi
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {VEHICLE_TYPES.map(type => (
                        <button
                          type="button"
                          key={type.id}
                          onClick={() => handleVehicleTypeToggle(type.id)}
                          className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition ${formData.vehicle_types.includes(type.id)
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          <Car className="w-4 h-4" /> {type.shortLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 3: DANH MỤC TIỆN ÍCH LẤY TỪ DATABASE (BẢNG AMENITY) */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-bold text-slate-900">3. Danh Mục Tiện Ích Bãi Xe</h3>
                </div>

                {loadingAmenities ? (
                  <p className="text-xs text-slate-500">Đang tải danh mục tiện ích từ cơ sở dữ liệu...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dbAmenities.map((amenity) => {
                      const isChecked = formData.amenity_ids.includes(amenity.id);
                      return (
                        <button
                          type="button"
                          key={amenity.id}
                          onClick={() => handleAmenityToggle(amenity.id)}
                          className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition ${isChecked
                            ? 'bg-teal-50 text-teal-900 border-teal-300 font-semibold shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <span className="flex items-center gap-2 text-sm">
                            {isChecked ? <CheckSquare className="w-5 h-5 text-teal-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-400 shrink-0" />}
                            <span>{amenity.name}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Thông báo quy trình phê duyệt */}
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 text-xs text-orange-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">Quy trình đăng ký Chủ bãi đỗ xe:</p>
                  <p>Sau khi gửi yêu cầu, Ban quản trị sẽ tiến hành phê duyệt. Khi cơ sở được duyệt, bạn sẽ nhận được Email chứa mật khẩu đăng nhập để hoàn tất thanh toán phí nền tảng.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg rounded-2xl shadow-lg transition duration-200 flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Đang gửi thông tin...' : (
                  <>
                    Hoàn Tất Đăng Ký Tài Khoản Chủ Bãi Xe <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-600">
            Bạn đã có tài khoản Chủ bãi đỗ xe?{' '}
            <Link to="/login" className="font-bold text-teal-600 hover:underline">
              Đăng nhập tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterProviderPage;
