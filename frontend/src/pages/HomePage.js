import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Calendar, 
  ArrowRight, 
  Clock, 
  Building2, 
  UserCheck, 
  Search, 
  CheckCircle2, 
  Car, 
  MapPin,
  FileText,
  Heart,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import vehicleTypeService from '../services/vehicleTypeService';
import facilityService from '../services/facilityService';
import FacilityCard from '../components/common/FacilityCard';
import VietmapAddressAutocomplete from '../components/common/VietmapAddressAutocomplete';
import { translateVehicleTypeName } from '../utils/translations';

const HomePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('home');
  const { user, isAuthenticated } = useAuth();
  const roleName = user?.role?.name || user?.role;
  const isEn = i18n.language?.startsWith('en');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [dbVehicleTypes, setDbVehicleTypes] = useState([]);
  const [featuredFacilities, setFeaturedFacilities] = useState([]);

  useEffect(() => {
    vehicleTypeService.getActiveVehicleTypes()
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list)) {
          setDbVehicleTypes(list);
        }
      })
      .catch(() => {});

    facilityService.searchFacilities({ limit: 3 })
      .then((res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setFeaturedFacilities(list.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    navigate('/search', {
      state: {
        keyword: searchKeyword.trim(),
        vehicleType: selectedVehicleType,
      },
    });
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 flex flex-col justify-between w-full overflow-x-hidden">
      <section className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden w-full">
        <img
          src="/hero_banner.jpg"
          alt="ParkLink Hero"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/85 via-gray-950/45 to-gray-950/45" />

        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-20 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-medium tracking-wide mb-4 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-neighbor-400" />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-3 drop-shadow-sm">
            {t('hero.titleBefore')}
            <span className="text-neighbor-400 ml-1 sm:ml-2">{t('hero.titleHighlight')}</span>
            {t('hero.titleAfter')}
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-white/90 max-w-2xl mx-auto mb-10 font-normal leading-relaxed drop-shadow-xs">
            {t('hero.subtitle')}
          </p>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex bg-white rounded-full p-2 pl-6 shadow-2xl max-w-4xl mx-auto items-center divide-x divide-gray-200 hover:shadow-neighbor-900/20 transition-all duration-200 text-left"
          >
            <div className="pr-5 w-56 shrink-0 flex items-center gap-3">
              <Car className="w-5 h-5 text-neighbor-600 shrink-0" />
              <div className="w-full">
                <label htmlFor="home-vehicle-select" className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  {t('searchBar.vehicleLabel')}
                </label>
                <select
                  id="home-vehicle-select"
                  value={selectedVehicleType}
                  onChange={(e) => setSelectedVehicleType(e.target.value)}
                  className="bg-transparent text-sm sm:text-base font-semibold text-gray-800 focus:outline-hidden cursor-pointer w-full py-0.5 border-none p-0 truncate"
                >
                  <option value="">{t('searchBar.allVehicles')}</option>
                  {dbVehicleTypes.map((vt) => (
                    <option key={vt.type_code || vt.id} value={vt.type_code || vt.id}>
                      {translateVehicleTypeName(vt, i18n.language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 flex-1 relative flex items-center gap-3">
              <MapPin className="w-5 h-5 text-neighbor-600 shrink-0" />
              <div className="w-full relative">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  {t('searchBar.locationLabel')}
                </span>
                <VietmapAddressAutocomplete
                  value={searchKeyword}
                  onChange={(val) => setSearchKeyword(val)}
                  onSelect={(item, label) => setSearchKeyword(label)}
                  onFacilitySelect={(fac) => {
                    if (fac?.id) {
                      navigate(`/facility/${fac.id}`);
                    } else if (fac?.name) {
                      setSearchKeyword(fac.name);
                    }
                  }}
                  includeFacilities={true}
                  hideIcon={true}
                  placeholder={t('searchBar.locationPlaceholder')}
                  className="w-full"
                  inputClassName="w-full bg-transparent text-sm sm:text-base font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden py-0.5 border-none p-0"
                />
              </div>
            </div>

            <div className="px-6 w-52 shrink-0 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-neighbor-600 shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {t('searchBar.rentalTermLabel')}
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-800 whitespace-nowrap">
                  {t('searchBar.monthlyRental')}
                </p>
              </div>
            </div>

            <div className="pl-2">
              <button
                type="submit"
                className="w-12 h-12 rounded-full bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer"
                aria-label={t('searchBar.submit')}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          <form
            onSubmit={handleSearchSubmit}
            className="flex md:hidden flex-col gap-3.5 w-full max-w-sm mx-auto bg-white p-4 sm:p-5 rounded-2xl shadow-xl text-left"
          >
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-2.5">
              <Car className="w-4 h-4 text-neighbor-600 shrink-0" />
              <select
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value)}
                className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-hidden cursor-pointer w-full"
              >
                <option value="">{t('searchBar.allVehicles')}</option>
                {dbVehicleTypes.map((vt) => (
                  <option key={vt.type_code || vt.id} value={vt.type_code || vt.id}>
                    {translateVehicleTypeName(vt, i18n.language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-2.5 relative">
              <MapPin className="w-4 h-4 text-neighbor-600 shrink-0" />
              <VietmapAddressAutocomplete
                value={searchKeyword}
                onChange={(val) => setSearchKeyword(val)}
                onSelect={(item, label) => setSearchKeyword(label)}
                onFacilitySelect={(fac) => {
                  if (fac?.id) {
                    navigate(`/facility/${fac.id}`);
                  } else if (fac?.name) {
                    setSearchKeyword(fac.name);
                  }
                }}
                includeFacilities={true}
                hideIcon={true}
                placeholder={t('searchBar.locationPlaceholder')}
                className="w-full"
                inputClassName="w-full bg-transparent text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-neighbor-600 hover:bg-neighbor-700 text-white font-semibold py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-98 transition-transform"
            >
              <Search className="w-4 h-4" />
              <span>{t('searchBar.submit')}</span>
            </button>
          </form>
        </div>
      </section>

      {featuredFacilities.length > 0 && (
        <section className="py-12 bg-gray-50/60 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-neighbor-700 font-bold text-xs uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-neighbor-600" />
                  <span>{t('featured.badge')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {t('featured.title')}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1.5">
                  {t('featured.subtitle')}
                </p>
              </div>

              <Link
                to="/search"
                className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-neighbor-700 hover:text-neighbor-800 transition"
              >
                <span>{t('featured.viewAll')}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredFacilities.map((fac) => (
                <FacilityCard
                  key={fac.id}
                  facility={fac}
                  onClick={() => navigate(`/facility/${fac.id}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 sm:py-16 bg-white">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {!isAuthenticated
                ? t('quickActions.guestTitle')
                : roleName === 'CUSTOMER'
                ? t('quickActions.customerTitle')
                : t('quickActions.providerTitle')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1.5.5">
              {!isAuthenticated
                ? t('quickActions.guestSubtitle')
                : roleName === 'CUSTOMER'
                ? t('quickActions.customerSubtitle', { name: user?.full_name || (isEn ? 'there' : 'bạn') })
                : t('quickActions.providerSubtitle', { name: user?.full_name || (isEn ? 'partner' : 'đối tác') })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {!isAuthenticated && (
              <>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neighbor-700 mb-2">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t('customerCard.badge')}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {t('customerCard.title')}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {t('customerCard.description')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100">
                    <Link
                      to="/search"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-xs sm:text-sm shadow-xs transition duration-150 w-full"
                    >
                      {t('customerCard.cta')} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-neighbor-50/50 rounded-2xl p-6 border border-neighbor-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-neighbor-600 text-white flex items-center justify-center mb-4 shadow-xs">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neighbor-700 mb-2">
                      <span>{t('audience.eyebrow')}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {t('audience.title')}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {t('benefits.items.monthly.description')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-neighbor-200/60">
                    <button
                      onClick={handleSearchSubmit}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-medium rounded-lg text-xs sm:text-sm shadow-xs transition duration-150 w-full cursor-pointer"
                    >
                      {t('searchCard.cta')} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neighbor-700 mb-2">
                      <Shield className="w-3 h-3" />
                      <span>{t('providerCard.badge')}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {t('providerCard.title')}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {t('providerCard.description')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100">
                    <Link
                      to="/register-provider"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neighbor-700 hover:bg-neighbor-800 text-white font-medium rounded-lg text-xs sm:text-sm shadow-xs transition duration-150 w-full"
                    >
                      {t('providerCard.cta')} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </>
            )}

            {isAuthenticated && roleName === 'CUSTOMER' && (
              <>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                      <Car className="w-5 h-5" />
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neighbor-700 mb-2">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t('quickActions.myReservationsBadge')}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {t('quickActions.myReservationsTitle')}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {t('quickActions.myReservationsDesc')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100">
                    <Link
                      to="/my-reservations"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-medium rounded-lg text-xs sm:text-sm shadow-xs transition duration-150 w-full"
                    >
                      <span>{t('quickActions.myReservationsCta')}</span> <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-neighbor-700 mb-2">
                      <Shield className="w-3 h-3" />
                      <span>{t('quickActions.myContractsBadge')}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {t('quickActions.myContractsTitle')}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {t('quickActions.myContractsDesc')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100">
                    <Link
                      to="/my-contracts"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-xs sm:text-sm shadow-xs transition duration-150 w-full"
                    >
                      <span>{t('quickActions.myContractsCta')}</span> <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-700 mb-2">
                      <Sparkles className="w-3 h-3" />
                      <span>{t('quickActions.myFavoritesBadge')}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {t('quickActions.myFavoritesTitle')}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {t('quickActions.myFavoritesDesc')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100">
                    <Link
                      to="/my-favorites"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg text-xs sm:text-sm border border-gray-300 shadow-xs transition duration-150 w-full"
                    >
                      <span>{t('quickActions.myFavoritesCta')}</span> <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </>
            )}

            {isAuthenticated && (roleName === 'PROVIDER' || roleName === 'ADMIN') && (
              <>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {t('quickActions.manageFacilitiesTitle')}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {t('quickActions.manageFacilitiesDesc')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100">
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 text-white font-medium rounded-lg text-xs sm:text-sm shadow-xs transition duration-150 w-full"
                    >
                      <span>{t('quickActions.manageFacilitiesCta')}</span> <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {t('quickActions.manageContractsTitle')}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {t('quickActions.manageContractsDesc')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100">
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-xs sm:text-sm shadow-xs transition duration-150 w-full"
                    >
                      <span>{t('quickActions.manageContractsCta')}</span> <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between">
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                      <Search className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {t('quickActions.exploreMapTitle')}
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                      {t('quickActions.exploreMapDesc')}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-gray-100">
                    <Link
                      to="/search"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg text-xs sm:text-sm border border-gray-300 shadow-xs transition duration-150 w-full"
                    >
                      <span>{t('quickActions.exploreMapCta')}</span> <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gray-50 border-t border-gray-200 text-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {t('benefits.title')}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              {t('benefits.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:border-neighbor-300 transition duration-150">
              <div className="w-10 h-10 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {t('benefits.items.monthly.title')}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {t('benefits.items.monthly.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:border-neighbor-300 transition duration-150">
              <div className="w-10 h-10 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {t('benefits.items.verification.title')}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {t('benefits.items.verification.description')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:border-neighbor-300 transition duration-150">
              <div className="w-10 h-10 rounded-lg bg-neighbor-50 text-neighbor-700 flex items-center justify-center mb-4 border border-neighbor-100">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {t('benefits.items.transparency.title')}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {t('benefits.items.transparency.description')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
