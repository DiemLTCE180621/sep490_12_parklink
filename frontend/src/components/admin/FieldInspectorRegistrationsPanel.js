import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../common/StatusBadge';
import inspectorService from '../../services/inspectorService';
import {
  Wrench,
  Building2,
  MapPin,
  User,
  Phone,
  Search,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Car
} from 'lucide-react';

const FieldInspectorRegistrationsPanel = () => {
  const { t } = useTranslation('inspector');
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await inspectorService.getPreparingFacilities();
      if (res && res.status === 'success') {
        setRegistrations(res.data || []);
      } else if (Array.isArray(res)) {
        setRegistrations(res);
      } else {
        setRegistrations(res?.data || []);
      }
    } catch (err) {
      console.error(err);
      setError(t('errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      const matchSearch =
        (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.address || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.phone_number || '').toLowerCase().includes(search.toLowerCase());

      return matchSearch;
    });
  }, [registrations, search]);

  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRegistrations.slice(start, start + itemsPerPage);
  }, [filteredRegistrations, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setCurrentPage(1);
    fetchRegistrations();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-neighbor-600" /> {t('title')}
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="text-xs font-semibold bg-gray-100 px-3 py-1.5 rounded-xl text-gray-700">
          {t('needSurvey', { count: registrations.length })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neighbor-500"
          />
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 border border-gray-200"
          title={t('refresh')}
        >
          <RotateCcw className="w-3.5 h-3.5 text-gray-600" /> {t('refresh')}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-neighbor-600" />
          <span>{t('loading')}</span>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-neighbor-400" />
          <p className="font-semibold text-sm">{t('empty')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('emptyDesc')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <th className="py-3.5 px-4">{t('table.id')}</th>
                <th className="py-3.5 px-4 min-w-[280px]">{t('table.facility')}</th>
                <th className="py-3.5 px-4 min-w-[180px]">{t('table.provider')}</th>
                <th className="py-3.5 px-4">{t('table.proposal')}</th>
                <th className="py-3.5 px-4">{t('table.status')}</th>
                <th className="py-3.5 px-4 text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {paginatedList.map((facility) => (
                <tr key={facility.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-400">
                    #{facility.id}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neighbor-50 border border-neighbor-100 flex items-center justify-center shrink-0 text-neighbor-700 mt-0.5">
                        {facility.images && facility.images.length > 0 ? (
                          <img
                            src={facility.images[0].image_url}
                            alt=""
                            className="w-10 h-10 object-cover rounded-xl"
                          />
                        ) : (
                          <Building2 className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <button
                          onClick={() => navigate(`/inspector/registrations/${facility.id}`)}
                          className="font-bold text-gray-900 hover:text-neighbor-700 transition text-left line-clamp-1"
                        >
                          {facility.name}
                        </button>
                        <div className="text-gray-500 text-[11px] flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          {facility.address}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {facility.provider?.full_name || 'N/A'}
                      </div>
                      {facility.provider?.phone_number && (
                        <div className="text-gray-500 text-[11px] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {facility.provider?.phone_number}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-800 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-neighbor-600" />
                      {facility.capacity} {t('vehiclesUnit')}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status="IN_PROGRESS" label={t('inProgress')} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/inspector/registrations/${facility.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neighbor-600 hover:bg-neighbor-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                      title={t('surveyActionTitle')}
                    >
                      <Wrench className="w-3.5 h-3.5" /> {t('surveyAction')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-600">
          <div>
            {t('pagination.info', {
              current: currentPage,
              total: totalPages,
              count: filteredRegistrations.length
            })}
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> {t('pagination.prev')}
            </button>
            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              {t('pagination.next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldInspectorRegistrationsPanel;
