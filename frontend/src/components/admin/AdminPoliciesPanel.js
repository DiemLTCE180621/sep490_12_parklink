import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Edit, ShieldCheck, Calendar, 
  CheckCircle, XCircle, User 
} from 'lucide-react';
import policyService from '../../services/policyService';
import Toast from '../common/Toast';

const AdminPoliciesPanel = () => {
  const { t, i18n } = useTranslation('admin');
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastInfo, setToastInfo] = useState(null);

  useEffect(() => {
    fetchAdminPolicies();
  }, []);

  const fetchAdminPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await policyService.getAllPoliciesAdmin();
      setPolicies(res?.data?.policies || []);
    } catch (err) {
      setError(t('policies.ui.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString(i18n.language?.startsWith('en') ? 'en-GB' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {toastInfo && (
        <Toast
          message={toastInfo.message}
          type={toastInfo.type}
          onClose={() => setToastInfo(null)}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-neighbor-600" /> {t('policies.title')}
            </h2>
            <p className="text-gray-500 text-xs mt-1">
              {t('policies.subtitle')}
            </p>
          </div>
          <div className="text-xs font-semibold bg-gray-100 px-3 py-1.5 rounded-xl text-gray-700">
            {t('policies.ui.total', { count: policies.length })}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-neighbor-600 border-t-transparent rounded-full animate-spin"></div>
            <span>{t('policies.ui.loading')}</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <th className="py-3 px-4">{t('policies.ui.type')}</th>
                  <th className="py-3 px-4">{t('policies.ui.policyTitle')}</th>
                  <th className="py-3 px-4">{t('policies.ui.status')}</th>
                  <th className="py-3 px-4">{t('policies.ui.updatedBy')}</th>
                  <th className="py-3 px-4">{t('policies.ui.lastUpdated')}</th>
                  <th className="py-3 px-4 text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-neighbor-700 whitespace-nowrap">
                      {policy.policy_type}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {policy.title}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {policy.is_active ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {t('statuses.active')}
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-gray-400" /> {t('policies.ui.inactive')}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{policy.admin?.full_name || t('policies.ui.system')}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(policy.updated_at)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/admin/policies/${policy.id}/edit`)}
                        title={t('policies.ui.editTitle')}
                        className="p-1.5 px-3 bg-neighbor-50 hover:bg-neighbor-100 text-neighbor-800 rounded-lg border border-neighbor-200 transition text-xs inline-flex items-center gap-1.5 font-bold"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{t('policies.ui.edit')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPoliciesPanel;
