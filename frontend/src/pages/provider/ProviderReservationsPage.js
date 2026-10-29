import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProviderReservationsPanel from '../../components/provider/ProviderReservationsPanel';

const ProviderReservationsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 w-full">
      <div className="w-full space-y-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang quản lý bãi xe
          </Link>
        </div>

        <ProviderReservationsPanel />
      </div>
    </div>
  );
};

export default ProviderReservationsPage;
