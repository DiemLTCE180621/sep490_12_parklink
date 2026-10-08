import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AdminRegistrationsPanel from '../../components/admin/AdminRegistrationsPanel';

const AdminRegistrationsPage = () => {
  const { user } = useAuth();
  
  // Bảo vệ route, chỉ cho phép ADMIN truy cập
  if (user?.role?.name !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-900 font-bold transition bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Bảng điều khiển
        </Link>
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Quản Lý Phê Duyệt Bãi Đỗ Xe</h1>
          <p className="text-slate-500 mt-2 font-medium">Xem xét và phê duyệt các yêu cầu đăng ký bãi đỗ xe mới từ Provider.</p>
        </div>

        {/* Gọi Panel đã tạo vào đây */}
        <AdminRegistrationsPanel />
      </div>
    </div>
  );
};

export default AdminRegistrationsPage;
