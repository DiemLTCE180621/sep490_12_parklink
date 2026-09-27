import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewSection from '../components/ReviewSection';

const FacilityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const facilityId = parseInt(id, 10);

  // Mock dữ liệu bãi đỗ xe cho đến khi có API Facility thật
  const mockFacility = {
    name: 'Bãi đỗ xe Đại học Cần Thơ',
    address: 'Đường 3/2, Xuân Khánh, Ninh Kiều, Cần Thơ',
    price: '1.500.000 VNĐ / tháng',
    capacity: '10 slot'
  };

  if (isNaN(facilityId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy bãi đỗ xe</h2>
          <button 
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        {/* Phần 1: Chi tiết Bãi đỗ xe (UI Demo) */}
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{mockFacility.name}</h1>
              <p className="text-gray-500 flex items-center gap-2">
                📍 {mockFacility.address}
              </p>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-bold text-teal-600">{mockFacility.price}</span>
              <span className="text-sm text-gray-500">Sức chứa: {mockFacility.capacity}</span>
            </div>
          </div>
          <div className="w-full h-64 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 mb-4">
            [Ảnh Bãi đỗ xe]
          </div>
        </div>

        {/* Phần 2: Đánh giá (Review Section) */}
        {/* Truyền facilityId vào Component ReviewSection để nó tự xử lý phần gọi API lấy đánh giá */}
        <ReviewSection facilityId={facilityId} />
      </div>
    </div>
  );
};

export default FacilityDetailPage;
