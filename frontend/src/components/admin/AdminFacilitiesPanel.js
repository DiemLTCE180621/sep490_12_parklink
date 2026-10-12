import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, User, Phone, Lock, Unlock, Eye, EyeOff, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import Toast from '../common/Toast';

const AdminFacilitiesPanel = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const navigate = useNavigate();

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllFacilities();
      if (res.status === 'success') {
        setFacilities(res.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách cơ sở:', error);
      setToast({ show: true, message: error.message || 'Lỗi khi lấy danh sách cơ sở', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleToggleLock = async (facility) => {
    if (facility.verification_status !== 'APPROVED') {
      setToast({ show: true, message: 'Chỉ có thể khóa/mở khóa các cơ sở đã được phê duyệt.', type: 'error' });
      return;
    }

    const action = facility.visibility_status === 'VISIBLE' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} cơ sở "${facility.name}"?`)) {
      return;
    }

    try {
      const res = await adminService.toggleLockFacility(facility.id);
      if (res.status === 'success') {
        setToast({ show: true, message: res.message, type: 'success' });
        // Cập nhật state cục bộ thay vì fetch lại để UX mượt hơn
        setFacilities(prev => prev.map(f => {
          if (f.id === facility.id) {
            return { ...f, visibility_status: f.visibility_status === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE' };
          }
          return f;
        }));
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái:', error);
      setToast({ show: true, message: error.message || 'Lỗi khi thay đổi trạng thái', type: 'error' });
    }
  };

  const filteredFacilities = facilities.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.provider?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-primary" />
          Quản Lý Tất Cả Cơ Sở
        </h2>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Tìm kiếm cơ sở, chủ bãi..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy cơ sở nào</h3>
          <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cơ sở</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chủ bãi</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái duyệt</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hiển thị (Visibility)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFacilities.map((facility) => (
                <tr key={facility.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-normal min-w-[300px]">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md overflow-hidden">
                        {facility.images && facility.images.length > 0 ? (
                          <img className="h-10 w-10 object-cover" src={facility.images.find(img => img.is_primary)?.image_url || facility.images[0].image_url} alt="" />
                        ) : (
                          <Building2 className="h-6 w-6 m-2 text-gray-400" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{facility.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" /> {facility.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal min-w-[200px]">
                    <div className="text-sm text-gray-900 flex items-center">
                      <User className="w-4 h-4 mr-1 text-gray-400" /> {facility.provider?.full_name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" /> {facility.provider?.phone_number || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {facility.verification_status === 'APPROVED' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Đã duyệt
                      </span>
                    ) : facility.verification_status === 'PENDING_REVIEW' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Chờ duyệt
                      </span>
                    ) : facility.verification_status === 'PREPARING' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Đang chuẩn bị
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Đã từ chối
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {facility.visibility_status === 'VISIBLE' ? (
                      <span className="inline-flex items-center text-sm text-green-600 font-medium">
                        <Eye className="w-4 h-4 mr-1" /> Hiện
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-sm text-red-600 font-medium">
                        <EyeOff className="w-4 h-4 mr-1" /> Ẩn (Khóa)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                    <button
                      onClick={() => navigate(`/admin/facilities/${facility.id}/edit`)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-xs leading-4 font-bold rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Cập nhật
                    </button>
                    <button
                      onClick={() => handleToggleLock(facility)}
                      disabled={facility.verification_status !== 'APPROVED'}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 
                        ${facility.verification_status !== 'APPROVED' 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : facility.visibility_status === 'VISIBLE'
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
                    >
                      {facility.visibility_status === 'VISIBLE' ? (
                        <><Lock className="w-4 h-4 mr-1" /> Khóa</>
                      ) : (
                        <><Unlock className="w-4 h-4 mr-1" /> Mở Khóa</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

    </div>
  );
};

export default AdminFacilitiesPanel;
