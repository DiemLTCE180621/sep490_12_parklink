import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProviderReservationsPanel from '../../components/provider/ProviderReservationsPanel';

const ProviderReservationsPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-800 hover:underline transition"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Trang Quản Lý Bãi Xe
          </Link>
        </div>

        <ProviderReservationsPanel />
      </div>
    </div>
  );
};

export default ProviderReservationsPage;
