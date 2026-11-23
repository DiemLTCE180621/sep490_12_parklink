import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import platformFeeService from '../../services/platformFeeService';
import vehicleTypeService from '../../services/vehicleTypeService';
import { Building2, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Car, Calculator, CheckSquare, Square, Phone, Mail } from 'lucide-react';
import FacilityLocationPicker from '../../components/common/FacilityLocationPicker';
import { cleanText, isValidName, isValidPhone, isValidEmail, isValidFacilityName } from '../../utils/validators';
import PolicyDetailModal from '../../components/modals/PolicyDetailModal';
import { translateVehicleTypeName, translateAmenityName, translatePlatformFeeName } from '../../utils/translations';

const RegisterProviderPage = () => {
  const { t, i18n } = useTranslation('register');
  const isEnglish = i18n.language?.startsWith('en');
  const { registerProvider } = useAuth();

  const [dbAmenities, setDbAmenities] = useState([]);
  const [loadingAmenities, setLoadingAmenities] = useState(true);
  const [platformFees, setPlatformFees] = useState([]);
  const [agreedPolicy, setAgreedPolicy] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [dbVehicleTypes, setDbVehicleTypes] = useState([]);
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(true);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    facility_name: '',
    address: '',
    latitude: '',
    longitude: '',
    capacity: '',
    price_per_month: '',
    vehicle_types: [],
    amenity_ids: []
  });

  const [errorList, setErrorList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingAmenities(true);
        setLoadingVehicleTypes(true);
        const [amenitiesRes, feesRes, vehicleTypesRes] = await Promise.allSettled([
          authService.getAmenities(),
          platformFeeService.getActiveFees(),
          vehicleTypeService.getActiveVehicleTypes()
        ]);

        if (amenitiesRes.status === 'fulfilled' && amenitiesRes.value?.data?.amenities) {
          setDbAmenities(amenitiesRes.value.data.amenities);
          const defaultIds = amenitiesRes.value.data.amenities.slice(0, 3).map(a => a.id);
          setFormData(prev => ({ ...prev, amenity_ids: defaultIds }));
        }

        if (feesRes.status === 'fulfilled') {
          const feeList = feesRes.value?.data || feesRes.value || [];
          setPlatformFees(Array.isArray(feeList) ? feeList : []);
        }

        if (vehicleTypesRes.status === 'fulfilled') {
          const vList = vehicleTypesRes.value?.data || vehicleTypesRes.value || [];
          if (Array.isArray(vList) && vList.length > 0) {
            setDbVehicleTypes(vList);
            setFormData(prev => ({
              ...prev,
              vehicle_types: prev.vehicle_types && prev.vehicle_types.length > 0
                ? prev.vehicle_types
                : [vList[0].type_code]
            }));
          }
        }
      } catch (err) {
      } finally {
        setLoadingAmenities(false);
        setLoadingVehicleTypes(false);
      }
    };

    fetchInitialData();
  }, []);

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

  const handleCapacityChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, capacity: rawVal }));
    if (errorList.length > 0) setErrorList([]);
  };

  const handlePriceChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, price_per_month: rawVal }));
    if (errorList.length > 0) setErrorList([]);
  };

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
      errs.push(t('provider.errors.fullNameInvalid'));
    }

    if (!isValidPhone(cleanedPhone)) {
      errs.push(t('provider.errors.phoneInvalid'));
    }

    if (!isValidEmail(cleanedEmail)) {
      errs.push(t('provider.errors.emailInvalid'));
    }

    if (!isValidFacilityName(cleanedFacilityName)) {
      errs.push(t('provider.errors.facilityNameInvalid'));
    }

    if (!formData.address.trim()) {
      errs.push(t('provider.errors.addressRequired'));
    }

    const cap = parseInt(formData.capacity, 10);
    if (isNaN(cap) || cap < 1) {
      errs.push(t('provider.errors.capacityMin'));
    }

    const price = parseInt(formData.price_per_month, 10);
    if (isNaN(price) || price < 100000) {
      errs.push(t('provider.errors.priceMin'));
    }

    if (!formData.vehicle_types || formData.vehicle_types.length === 0) {
      errs.push(t('provider.errors.vehicleTypesRequired'));
    }

    if (!agreedPolicy) {
      errs.push(t('provider.errors.policyRequired'));
    }

    return {
      isValid: errs.length === 0,
      errs,
      cleanedName,
      cleanedPhone,
      cleanedEmail,
      cleanedFacilityName
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorList([]);

    const {
      isValid,
      errs,
      cleanedName,
      cleanedPhone,
      cleanedEmail,
      cleanedFacilityName
    } = validateForm();

    if (!isValid) {
      setErrorList(errs);
      return;
    }

    try {
      setLoading(true);
      const res = await registerProvider({
        full_name: cleanedName,
        phone_number: cleanedPhone,
        email: cleanedEmail,
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
        setErrorList([err.message || t('provider.errors.submitFailed')]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-200 max-w-5xl w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mx-auto mb-3 border border-neighbor-100 shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t('provider.title')}
          </h2>
        </div>

        {errorList.length > 0 && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              {errorList.length === 1 ? (
                <p className="font-semibold text-red-700 leading-relaxed">
                  {errorList[0]}
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-red-800">{t('provider.errorSummary')}</p>
                  <ul className="space-y-0.5 text-red-700">
                    {errorList.map((errItem, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{errItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {successResult ? (
          <div className="space-y-5">
            <div className="p-5 rounded-xl bg-neighbor-50 border border-neighbor-200 text-neighbor-900 space-y-3">
              <div className="flex items-center gap-2 text-neighbor-800 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-neighbor-600 shrink-0" />
                <span>{t('provider.success.title')}</span>
              </div>

              <p className="text-sm leading-relaxed text-neighbor-800">
                {t('provider.success.descriptionPart1')}<strong>{formData.full_name}</strong>{t('provider.success.descriptionPart2')}<strong>{formData.facility_name}</strong>{t('provider.success.descriptionPart3', { capacity: formData.capacity })}
              </p>

              <div className="p-4 bg-white rounded-lg border border-neighbor-100 space-y-1.5 text-sm">
                <p className="font-bold text-neighbor-900 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-neighbor-600" /> {t('provider.success.estimatedFeeLabel')} {Number(successResult.system_fee).toLocaleString('vi-VN')} {isEnglish ? 'VND' : 'VNĐ'}
                </p>
                <p className="text-gray-500 text-xs">
                  {t('provider.success.emailNoticeBefore')}<strong>{formData.email}</strong>{t('provider.success.emailNoticeAfter')}
                </p>
              </div>
            </div>

            <Link
              to="/"
              className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm rounded-lg shadow-xs transition-colors flex justify-center items-center gap-2 cursor-pointer"
            >
              {t('provider.success.backHome')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-gray-100">
                <User className="w-5 h-5 text-neighbor-600" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{t('provider.sections.representative')}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('provider.fields.fullName.label')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder={t('provider.fields.fullName.placeholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('provider.fields.phone.label')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      placeholder={t('provider.fields.phone.placeholder')}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('provider.fields.email.label')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('provider.fields.email.placeholder')}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-gray-100">
                <Building2 className="w-5 h-5 text-neighbor-600" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{t('provider.sections.facility')}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('provider.fields.facilityName.label')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="facility_name"
                    value={formData.facility_name}
                    onChange={handleChange}
                    placeholder={t('provider.fields.facilityName.placeholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t('provider.fields.facilityAddress.label')} <span className="text-red-500">*</span>
                  </label>

                  <FacilityLocationPicker
                    address={formData.address}
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onChange={(location) => setFormData(prev => ({ ...prev, ...location }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('provider.fields.slotCapacity.label')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleCapacityChange}
                      placeholder={t('provider.fields.slotCapacity.placeholder')}
                      maxLength={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-semibold text-gray-700">
                        {t('provider.fields.monthlyPrice.label')} <span className="text-red-500">*</span>
                      </label>
                      {formData.price_per_month && Number(formData.price_per_month) > 0 && (
                        <span className="text-xs font-semibold text-neighbor-700 bg-neighbor-50 px-2.5 py-0.5 rounded border border-neighbor-200">
                          {Number(formData.price_per_month).toLocaleString('vi-VN')} {t('provider.fields.monthlyPrice.unitBadge')}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="price_per_month"
                      value={formData.price_per_month}
                      onChange={handlePriceChange}
                      placeholder={t('provider.fields.monthlyPrice.placeholder')}
                      maxLength={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-neighbor-50/70 rounded-xl border border-neighbor-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-neighbor-900 font-bold uppercase tracking-wider">
                        {t('provider.feeBox.title')}
                      </p>
                      {matchedFee && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-neighbor-200/80 text-neighbor-900">
                          {translatePlatformFeeName(matchedFee.name, i18n.language)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neighbor-800">
                      {matchedFee ? (
                        <>
                          {t('provider.feeBox.scalePrefix')} <strong>{capacitySlots} {t('provider.feeBox.slotsUnit')}</strong>{' '}({matchedFee.max_slots && matchedFee.max_slots < 900 ? t('provider.feeBox.tierRange', { min: matchedFee.min_slots, max: matchedFee.max_slots }) : t('provider.feeBox.tierFrom', { min: matchedFee.min_slots })})
                        </>
                      ) : (
                        t('provider.feeBox.emptyHint')
                      )}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-2xl font-extrabold text-neighbor-900">
                      {systemFee > 0 ? `${systemFee.toLocaleString('vi-VN')} ${isEnglish ? 'VND' : 'VNĐ'}` : '—'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('provider.fields.vehicleTypes.label')} <span className="text-red-500">*</span>
                  </label>
                  {loadingVehicleTypes ? (
                    <p className="text-sm text-gray-400">{t('provider.fields.vehicleTypes.loading')}</p>
                  ) : dbVehicleTypes.length === 0 ? (
                    <p className="text-sm text-amber-600">{t('provider.fields.vehicleTypes.empty')}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {dbVehicleTypes.map(type => {
                        const typeCode = type.type_code;
                        const isSelected = formData.vehicle_types.includes(typeCode);
                        return (
                          <button
                            type="button"
                            key={typeCode}
                            onClick={() => handleVehicleTypeToggle(typeCode)}
                            title={translateVehicleTypeName(type, i18n.language)}
                            className={`px-4 py-2.5 rounded-lg border text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer ${isSelected
                              ? 'bg-neighbor-600 text-white border-neighbor-600 shadow-xs'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            <Car className="w-4 h-4" />
                            <span>{translateVehicleTypeName(type, i18n.language)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-gray-100">
                <ShieldCheck className="w-5 h-5 text-neighbor-600" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{t('provider.sections.amenities')}</h3>
              </div>

              {loadingAmenities ? (
                <p className="text-sm text-gray-400">{t('provider.fields.amenities.loading')}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {dbAmenities.map((amenity) => {
                    const isChecked = formData.amenity_ids.includes(amenity.id);
                    return (
                      <button
                        type="button"
                        key={amenity.id}
                        onClick={() => handleAmenityToggle(amenity.id)}
                        className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${isChecked
                          ? 'bg-neighbor-50 text-neighbor-900 border-neighbor-300 font-semibold shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {isChecked ? <CheckSquare className="w-4 h-4 text-neighbor-600 shrink-0" /> : <Square className="w-4 h-4 text-gray-400 shrink-0" />}
                          <span className="truncate">{translateAmenityName(amenity.name, i18n.language)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-900 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">{t('provider.approvalNotice.title')}</p>
                <p className="leading-relaxed">{t('provider.approvalNotice.description')}</p>
              </div>
            </div>

            <div className="p-3.5 bg-neighbor-50/70 rounded-lg border border-neighbor-200/80 flex items-start gap-2.5">
              <input
                id="agreePolicyProvider"
                type="checkbox"
                checked={agreedPolicy}
                onChange={(e) => {
                  setAgreedPolicy(e.target.checked);
                  if (errorList.length > 0) setErrorList([]);
                }}
                className="w-4 h-4 mt-0.5 text-neighbor-600 rounded border-gray-300 focus:ring-neighbor-500 cursor-pointer"
              />
              <label htmlFor="agreePolicyProvider" className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none">
                {t('provider.policy.agree')}{' '}
                <button
                  type="button"
                  onClick={() => setPolicyModalOpen(true)}
                  className="text-neighbor-700 font-bold hover:underline cursor-pointer"
                >
                  {t('provider.policy.linkText')}
                </button>{t('provider.policy.suffix')} <span className="text-red-500">*</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white font-bold text-base rounded-lg shadow-xs transition-colors flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? t('provider.submitting') : (
                <>
                  {t('provider.submit')} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
          {t('provider.loginPrompt')}{' '}
          <Link to="/login" className="font-semibold text-neighbor-700 hover:text-neighbor-800 hover:underline transition-colors">
            {t('provider.loginLink')}
          </Link>
        </div>
      </div>

      <PolicyDetailModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        policyType="PROVIDER"
      />
    </div>
  );
};

export default RegisterProviderPage;
