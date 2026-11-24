import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdminConfirmationRecords } from '../../services/confirmationRecordService';
import ContractDetailModal from '../ContractDetailModal';
import Toast from '../common/Toast';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Building2,
  Car,
  Calendar
} from 'lucide-react';

const AdminContractsPanel = () => {
  const { t, i18n } = useTranslation('admin');
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({
    total_all: 0,
    total_active: 0,
    total_pending_signature: 0,
    total_matching: 0
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 1
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedContractId, setSelectedContractId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [toastInfo, setToastInfo] = useState({ message: '', type: 'success' });

  const fetchContracts = useCallback(
    async (
      page = pagination.page,
      limit = pagination.limit,
      status = statusFilter,
      search = searchTerm,
      start = startDate,
      end = endDate
    ) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          limit,
          search: search.trim(),
          status: status || undefined,
          start_date: start || undefined,
          end_date: end || undefined
        };

        const res = await getAdminConfirmationRecords(params);
        const data = res.data || res;

        setContracts(data.confirmation_records || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.summary) setSummary(data.summary);
      } catch (err) {
        setError(t('contracts.ui.loadError'));
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, statusFilter, searchTerm, startDate, endDate, t]
  );

  useEffect(() => {
    fetchContracts(1, pagination.limit, statusFilter, searchTerm, startDate, endDate);
    
  }, [statusFilter, pagination.limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchContracts(1, pagination.limit, statusFilter, searchTerm, startDate, endDate);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    fetchContracts(1, pagination.limit, '', '', '', '');
  };

  const handleOpenDetailModal = (contractId) => {
    setSelectedContractId(contractId);
    setIsDetailModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchContracts(newPage, pagination.limit, statusFilter, searchTerm, startDate, endDate);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {t('contracts.ui.active')}
          </span>
        );
      case 'PENDING_SIGNATURE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {t('contracts.ui.pendingSignature')}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            {t('contracts.ui.expired')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            {t('contracts.ui.cancelled')}
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            {t('contracts.ui.terminated')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo({ message: '', type: 'success' })} />

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-neighbor-600" />
            {t('contracts.ui.title')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t('contracts.ui.subtitle')}
          </p>
        </div>

        <button
          onClick={() => fetchContracts(pagination.page, pagination.limit, statusFilter, searchTerm, startDate, endDate)}
          disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition border border-gray-300 shadow-sm flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('contracts.ui.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
            <span>{t('contracts.ui.totalContracts')}</span>
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{summary.total_all || 0}</div>
          <p className="text-xs text-gray-400 mt-1">{t('contracts.ui.allSystem')}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
            <span>{t('contracts.ui.active')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{summary.total_active || 0}</div>
          <p className="text-xs text-gray-400 mt-1">{t('contracts.ui.activeHint')}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
            <span>{t('contracts.ui.pendingSignature')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{summary.total_pending_signature || 0}</div>
          <p className="text-xs text-gray-400 mt-1">{t('contracts.ui.pendingHint')}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('contracts.ui.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-16 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-neighbor-500 focus:border-neighbor-500"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded"
            >
              {t('contracts.ui.search')}
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-neighbor-500"
            >
              <option value="">{t('contracts.ui.allStatuses')}</option>
              <option value="ACTIVE">{t('contracts.ui.active')}</option>
              <option value="PENDING_SIGNATURE">{t('contracts.ui.pendingSignature')}</option>
              <option value="EXPIRED">{t('contracts.ui.expired')}</option>
              <option value="CANCELLED">{t('contracts.ui.cancelled')}</option>
              <option value="TERMINATED">{t('contracts.ui.terminated')}</option>
            </select>

            <div className="flex items-center gap-1.5 text-gray-500">
              <span>{t('contracts.ui.from')}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-neighbor-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-gray-500">
              <span>{t('contracts.ui.to')}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-neighbor-500"
              />
            </div>

            <button
              onClick={() => fetchContracts(1, pagination.limit, statusFilter, searchTerm, startDate, endDate)}
              className="px-3 py-2 bg-neighbor-600 hover:bg-neighbor-700 text-white font-semibold rounded-lg transition"
            >
              {t('contracts.ui.filter')}
            </button>

            {(searchTerm || statusFilter || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-2 text-gray-500 hover:text-gray-800 font-semibold rounded-lg transition flex items-center gap-1"
                title={t('contracts.ui.resetFilters')}
              >
                <X className="w-3.5 h-3.5" /> {t('contracts.ui.clearFilters')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-neighbor-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">{t('contracts.ui.loading')}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-rose-600 font-medium mb-3">{error}</p>
            <button
              onClick={() => fetchContracts(pagination.page, pagination.limit, statusFilter, searchTerm, startDate, endDate)}
              className="px-3 py-1.5 bg-neighbor-600 text-white text-xs font-semibold rounded-lg"
            >
              {t('contracts.ui.retry')}
            </button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium">{t('contracts.ui.empty')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('contracts.ui.emptyHint')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">{t('contracts.ui.code')}</th>
                  <th scope="col" className="px-4 py-3">{t('contracts.ui.customer')}</th>
                  <th scope="col" className="px-4 py-3">{t('contracts.ui.facility')}</th>
                  <th scope="col" className="px-4 py-3">{t('contracts.ui.vehicleSpot')}</th>
                  <th scope="col" className="px-4 py-3">{t('contracts.ui.period')}</th>
                  <th scope="col" className="px-4 py-3">{t('contracts.ui.status')}</th>
                  <th scope="col" className="px-4 py-3 text-right">{t('contracts.ui.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {contracts.map((item) => {
                  const customer = item.customer || item.reservation?.customer;
                  const facility = item.facility || item.reservation?.facility;
                  const provider = item.provider || item.reservation?.facility?.provider;
                  const vehicle = item.vehicle || {};
                  const rental = item.rental || {};

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {item.contract_code}
                        </span>
                        <div className="text-[11px] text-gray-400 mt-1">
                          {t('contracts.ui.created')} {formatDate(item.created_at)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {customer?.full_name || t('contracts.ui.unknownCustomer')}
                        </div>
                        <div className="text-gray-500 text-[11px] mt-0.5">{customer?.phone_number || customer?.email}</div>
                      </td>

                      <td className="px-4 py-3.5 max-w-[240px]">
                        <div className="font-semibold text-gray-900 truncate flex items-center gap-1.5" title={facility?.name}>
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {facility?.name || t('contracts.ui.unknownFacility')}
                        </div>
                        <div className="text-gray-500 text-[11px] truncate mt-0.5" title={facility?.address}>
                          {facility?.address}
                        </div>
                        {provider?.full_name && (
                          <div className="text-[11px] text-gray-400">{t('contracts.ui.provider')} {provider.full_name}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {vehicle.license_plate || t('contracts.ui.unknownPlate')}
                        </div>
                        <div className="text-gray-500 text-[11px] mt-0.5">
                          {t('contracts.ui.spot')} <span className="font-medium text-gray-700">{rental.parking_spot || t('contracts.ui.freeSpot')}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenDetailModal(item.id)}
                          className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-300 shadow-sm transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          {t('contracts.ui.details')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && contracts.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              {t('contracts.ui.pageSummary', { shown: contracts.length, total: pagination.total, page: pagination.page, pages: pagination.total_pages })}
            </div>

            {pagination.total_pages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> {t('contracts.ui.previous')}
                </button>

                <span className="px-2 py-1 font-semibold text-gray-700">
                  {pagination.page} / {pagination.total_pages}
                </span>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="px-2.5 py-1 bg-white border border-gray-300 rounded text-gray-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-1"
                >
                  {t('contracts.ui.next')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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
          onRefresh={() => fetchContracts(pagination.page, pagination.limit, statusFilter, searchTerm, startDate, endDate)}
        />
      )}
    </div>
  );
};

export default AdminContractsPanel;
