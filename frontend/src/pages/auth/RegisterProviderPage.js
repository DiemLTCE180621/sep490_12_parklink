import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import platformFeeService from '../../services/platformFeeService';
import { Building2, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Car, Calculator, CheckSquare, Square, Phone, Mail } from 'lucide-react';
import FacilityLocationPicker from '../../components/common/FacilityLocationPicker';
import { VEHICLE_TYPES } from '../../constants/vehicleTypes';
import { cleanText, isValidName, isValidPhone, isValidEmail, isValidFacilityName } from '../../utils/validators';


const RegisterProviderPage = () => {
  const { registerProvider } = useAuth();

  // State tiện ích được lấy động từ Database (Bảng Amenity)
  const [dbAmenities, setDbAmenities] = useState([]);
  const [loadingAmenities, setLoadingAmenities] = useState(true);
  const [platformFees, setPlatformFees] = useState([]);

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

  // Tải danh mục Tiện ích & Biểu phí nền tảng từ Database khi khởi tạo trang
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingAmenities(true);
        const [amenitiesRes, feesRes] = await Promise.allSettled([
          authService.getAmenities(),
          platformFeeService.getActiveFees()
        ]);

        if (amenitiesRes.status === 'fulfilled' && amenitiesRes.value?.data?.amenities) {
          setDbAmenities(amenitiesRes.value.data.amenities);
          // Tự động chọn 3 tiện ích đầu tiên mặc định
          const defaultIds = amenitiesRes.value.data.amenities.slice(0, 3).map(a => a.id);
          setFormData(prev => ({ ...prev, amenity_ids: defaultIds }));
        }

        if (feesRes.status === 'fulfilled') {
          const feeList = feesRes.value?.data || feesRes.value || [];
          setPlatformFees(Array.isArray(feeList) ? feeList : []);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu ban đầu từ DB:', err);
      } finally {
        setLoadingAmenities(false);
      }
    };

    fetchInitialData();
  }, []);

  // Tìm gói phí nền tảng phù hợp với quy mô chỗ đỗ (Theo khung Min - Max)
  const capacitySlots = parseInt(formData.capacity, 10);

  const matchedFee = useMemo(() => {
    if (isNaN(capacitySlots) || capacitySlots < 1 || !platformFees.length) return null;
    return platformFees.find(f => {
      if (!f.is_active) return false;
      const minOk = capacitySlots >= f.min_slots;
      const maxOk = f.max_slots === null || f.max_slots === undefined || capacitySlots <= f.max_slots;
      return minOk && maxOk;
    }) || null;
  }, [platformFees, capacitySlots]);

  const systemFee = matchedFee ? Number(matchedFee.fee_amount) : 0;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorList.length > 0) setErrorList([]);
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

                    <FacilityLocationPicker
                      address={formData.address}
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onChange={(location) => setFormData(prev => ({ ...prev, ...location }))}
                      required
                    />
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

                  {/* THẺ TÍNH PHÍ NỀN TẢNG THEO ĐỀ TÀI (GÓI QUY MÔ MIN - MAX) */}
                  <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-teal-800 font-bold uppercase tracking-wider">
                          Phí nền tảng thí điểm (Thu 1 lần khi duyệt bãi)
                        </p>
                        {matchedFee && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-200/80 text-teal-900">
                            {matchedFee.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-teal-700 font-medium">
                        {matchedFee ? (
                          <>
                            Quy mô khai báo: <strong>{capacitySlots} chỗ đỗ</strong>{' '}
                            (Áp dụng khung{' '}
                            {matchedFee.max_slots && matchedFee.max_slots < 900
                              ? `${matchedFee.min_slots} - ${matchedFee.max_slots} chỗ`
                              : `từ ${matchedFee.min_slots} chỗ trở lên`}
                            )
                          </>
                        ) : (
                          'Vui lòng nhập số chỗ đỗ để xác định gói phí áp dụng'
                        )}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-2xl font-extrabold text-teal-900">
                        {systemFee > 0 ? `${systemFee.toLocaleString('vi-VN')} VNĐ` : '—'}
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
