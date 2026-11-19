import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translateVehicleTypeName } from '../../utils/translations';
import { getProviderActiveCustomers } from '../../services/confirmationRecordService';
import ContractDetailModal from '../ContractDetailModal';
import Toast from '../common/Toast';
import {
  Users,
  Car,
  Clock,
  Phone,
  Mail,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin
} from 'lucide-react';

const ProviderActiveCustomersPanel = () => {
  const { t, i18n } = useTranslation('provider');
  const isEnglish = i18n.language?.startsWith('en');
  const navigate = useNavigate();

  const [activeCustomers, setActiveCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({
    total_active_customers: 0,
    total_matching: 0,
    total_monthly_revenue: 0,
    facility_capacity: null,
    occupied_slots: 0,
    available_slots: null,
    occupancy_rate: 0
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [selectedContractId, setSelectedContractId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const fetchActiveCustomers = useCallback(
    async (page = pagination.page, limit = pagination.limit, search = searchTerm) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          limit,
          search: search.trim()
        };

        const res = await getProviderActiveCustomers(params);
        const data = res.data || res;

        setActiveCustomers(data.active_customers || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.summary) setSummary(data.summary);
      } catch (err) {
        setError(err.message || '__LOAD_ERROR__');
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, searchTerm]
  );

  useEffect(() => {
    fetchActiveCustomers(1, pagination.limit, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchActiveCustomers(1, pagination.limit, searchTerm);
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    fetchActiveCustomers(1, pagination.limit, '');
  };

  const handleOpenDetailModal = (contractId) => {
    setSelectedContractId(contractId);
    setIsDetailModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchActiveCustomers(newPage, pagination.limit, searchTerm);
    }
  };

  const formatCurrency = (amount) => {
    if (isEnglish) return `${Number(amount || 0).toLocaleString('vi-VN')} VND`;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString(isEnglish ? 'en-GB' : 'vi-VN');
  };

  const getDaysRemainingBadge = (daysRemaining, isExpired) => {
    if (isExpired || daysRemaining <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <Clock className="w-3 h-3" /> {t('activeCustomers.status.expired')}
        </span>
      );
    }

    if (daysRemaining <= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <Clock className="w-3 h-3" /> {t('activeCustomers.status.daysRemaining', { days: daysRemaining })}
        </span>
      );
    }

    if (daysRemaining <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" /> {t('activeCustomers.status.daysRemaining', { days: daysRemaining })}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Clock className="w-3 h-3" /> {t('activeCustomers.status.daysRemaining', { days: daysRemaining })}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('activeCustomers.title')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('activeCustomers.subtitle')}
            </p>
          </div>

          <button
            onClick={() => fetchActiveCustomers(pagination.page, pagination.limit, searchTerm)}
            disabled={loading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition border border-slate-300 flex items-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            {t('activeCustomers.refresh')}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-5">
            <span className="text-xs text-slate-500 block">{t('activeCustomers.kpis.activeRenters.label')}</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {summary.total_active_customers || 0}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t('activeCustomers.kpis.activeRenters.hint')}</p>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-500 block">{t('activeCustomers.kpis.availableSlots.label')}</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-emerald-600">
                {summary.available_slots !== null ? summary.available_slots : '---'}
              </span>
              <span className="text-xs text-slate-400">
                / {summary.facility_capacity !== null ? `${summary.facility_capacity} ${t('activeCustomers.kpis.availableSlots.unit')}` : '---'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t('activeCustomers.kpis.availableSlots.hint', { occupied: summary.occupied_slots || 0 })}</p>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-500 block">{t('activeCustomers.kpis.occupancyRate.label')}</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{summary.occupancy_rate || 0}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (summary.occupancy_rate || 0) >= 90
                    ? 'bg-rose-500'
                    : (summary.occupancy_rate || 0) >= 70
                    ? 'bg-amber-500'
                    : 'bg-teal-600'
                }`}
                style={{ width: `${Math.min(100, summary.occupancy_rate || 0)}%` }}
              />
            </div>
          </div>

          <div className="p-5">
            <span className="text-xs text-slate-500 block">{t('activeCustomers.kpis.monthlyRevenue.label')}</span>
            <div className="text-2xl font-bold text-teal-700 mt-1">
              {formatCurrency(summary.total_monthly_revenue)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{t('activeCustomers.kpis.monthlyRevenue.hint')}</p>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {t('activeCustomers.listTitle', { count: pagination.total || activeCustomers.length })}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('activeCustomers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-14 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded"
            >
              {t('activeCustomers.searchButton')}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600 mx-auto mb-2.5" />
            <p className="text-xs text-slate-500">{t('activeCustomers.loading')}</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle className="w-9 h-9 text-rose-500 mx-auto" />
            <p className="text-sm text-slate-700">{error === '__LOAD_ERROR__' ? t('activeCustomers.loadError') : error}</p>
            <button
              onClick={() => fetchActiveCustomers(pagination.page, pagination.limit, searchTerm)}
              className="px-4 py-2 bg-teal-600 text-white font-medium text-xs rounded-lg"
            >
              {t('activeCustomers.retry')}
            </button>
          </div>
        ) : activeCustomers.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-800">{t('activeCustomers.empty.title')}</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm
                ? t('activeCustomers.empty.searchEmpty')
                : t('activeCustomers.empty.defaultEmpty')}
            </p>
            {searchTerm && (
              <div className="pt-2">
                <button
                  onClick={handleResetSearch}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
                >
                  {t('activeCustomers.empty.showAll')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activeCustomers.map((item) => {
              const customer = item.customer || {};
              const vehicle = item.vehicle || {};
              const rental = item.rental || {};

              return (
                <div
                  key={item.contract_id}
                  className="p-6 hover:bg-slate-50/60 transition space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-sm border border-teal-100 shrink-0">
                        {customer?.full_name ? customer.full_name.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {customer?.full_name}
                          </h3>
                          {getDaysRemainingBadge(item.days_remaining, item.is_expired)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.contract_code}
                          </span>
                          <span>•</span>
                          <span>{t('activeCustomers.card.effectiveRange', { start: formatDate(item.start_date), end: formatDate(item.end_date) })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/chat')}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 transition inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                        {t('activeCustomers.card.chat')}
                      </button>

                      <button
                        onClick={() => handleOpenDetailModal(item.contract_id)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        {t('activeCustomers.card.viewContract')}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 block">{t('activeCustomers.card.contactInfo')}</span>
                      <p className="text-slate-800 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`tel:${customer.phone_number}`} className="hover:text-teal-600">
                          {customer.phone_number || t('activeCustomers.card.noPhone')}
                        </a>
                      </p>
                      <p className="text-slate-500 flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {customer.email}
                      </p>
                      {customer.id_card && customer.id_card !== 'Chưa cập nhật' && (
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {t('activeCustomers.card.idCardPrefix')} <span className="text-slate-700 font-medium">{customer.id_card}</span>
                        </p>
                      )}
                      {customer.address && customer.address !== 'Chưa cập nhật' && (
                        <p className="text-slate-500 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {customer.address}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 block">{t('activeCustomers.card.vehicleAndSpot')}</span>
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {vehicle.license_plate || t('activeCustomers.card.noPlate')}
                      </p>
                      <p className="text-slate-500">{vehicle.vehicle_type ? translateVehicleTypeName({ name: vehicle.vehicle_type }, i18n.language) : t('activeCustomers.card.defaultVehicle')}</p>
                      <p className="text-slate-500">
                        {t('activeCustomers.card.spotLabel')} <span className="font-medium text-slate-800">{rental.parking_spot || t('activeCustomers.card.freeSpot')}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 block">{t('activeCustomers.card.rateAndPayment')}</span>
                      <p className="text-sm font-bold text-teal-700">
                        {formatCurrency(rental.agreed_price)}{' '}
                        <span className="text-xs font-normal text-slate-500">{t('activeCustomers.card.perMonth')}</span>
                      </p>
                      <p className="text-slate-500">
                        {t('activeCustomers.card.paymentDeadline', { day: rental.payment_deadline_day || 5 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && activeCustomers.length > 0 && pagination.total_pages > 1 && (
          <div className="px-6 py-3.5 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {t('activeCustomers.pagination.summary', { current: activeCustomers.length, total: pagination.total })}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> {t('activeCustomers.pagination.previous')}
              </button>

              <span className="px-2 py-1 font-semibold text-slate-700">
                {pagination.page} / {pagination.total_pages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-1"
              >
                {t('activeCustomers.pagination.next')} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedContractId && (
        <ContractDetailModal
          contractId={selectedContractId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedContractId(null);
          }}
          onRefresh={() => fetchActiveCustomers(pagination.page, pagination.limit, searchTerm)}
        />
      )}
    </div>
  );
};

export default ProviderActiveCustomersPanel;
