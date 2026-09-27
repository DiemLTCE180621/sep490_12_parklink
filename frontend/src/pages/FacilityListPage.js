import React, { useEffect, useState } from 'react';
import { getAvailableFacilities } from '../services/reservationService';
import SendReservationModal from '../components/SendReservationModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Building2, Shield, Send, AlertCircle, CheckCircle2, User, Loader2, ArrowLeft } from 'lucide-react';

const FacilityListPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAvailableFacilities();
      const list = res.data?.facilities || res.facilities || [];
      setFacilities(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách bãi đỗ xe!');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (facility) => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập tài khoản Khách hàng (Customer) để gửi yêu cầu thuê!');
      navigate('/login');
      return;
    }

    if (user?.role?.name === 'PROVIDER') {
      alert('Tài khoản Chủ bãi xe (Provider) không thể gửi yêu cầu thuê! Vui lòng sử dụng tài khoản Khách hàng.');
      return;
    }

    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  const handleReservationSuccess = () => {
    setIsModalOpen(false);
    setToastMsg('Gửi yêu cầu thuê thành công! Đang chuyển tới trang quản lý yêu cầu...');
    setTimeout(() => {
      navigate('/my-reservations');
    }, 1500);
  };

  // Lọc bãi đỗ theo từ khóa tìm kiếm
  const filteredFacilities = facilities.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* BANNER HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition border border-white/10 mb-2"
            >
              <ArrowLeft className="w-4 h-4 text-teal-400" /> Quay Lại
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider block w-fit">
              <MapPin className="w-4 h-4 text-teal-400" /> Thí Điểm Ninh Kiều, Cần Thơ
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bãi Đỗ Xe Cho Thuê Theo Tháng</h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Danh sách các bãi đỗ xe đã khảo sát, thực tế xác nhận và sẵn sàng tiếp nhận đăng ký giữ chỗ đỗ dài hạn.
            </p>
          </div>

          {/* SEARCH BAR INPUT */}
          <div className="w-full md:w-80 relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên bãi hoặc đường..."
              className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        {/* TOAST MESSAGE */}
        {toastMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-lg flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5" />
            <div>{toastMsg}</div>
          </div>
        )}

        {/* CONTENT LISTING */}
        {loading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
            <p className="text-slate-600 font-semibold">Đang tải danh sách bãi đỗ xe tại Ninh Kiều...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 rounded-3xl border border-red-200 text-red-700 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>{error}</div>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm space-y-4">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Không tìm thấy bãi đỗ xe nào</h3>
            <p className="text-slate-500 text-sm">Thử thay đổi từ khóa tìm kiếm hoặc quay lại sau.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-1"
              >
                {/* IMAGE CONTAINER */}
                <div className="relative h-48 bg-slate-200 overflow-hidden">
                  {facility.images && facility.images.length > 0 ? (
                    <img
                      src={facility.images.find(img => img.is_primary)?.image_url || facility.images[0].image_url}
                      alt={facility.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-teal-900 text-white font-bold text-lg">
                      <Building2 className="w-12 h-12 text-teal-400" />
                    </div>
                  )}

                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-500 text-slate-950 shadow">
                      Đã Xác Thực
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-xl">
                    <span className="flex items-center gap-1 font-semibold">
                      <Shield className="w-3.5 h-3.5 text-teal-400" /> Sức chứa: {facility.capacity} slots
                    </span>
                    <span className="font-extrabold text-teal-300">Ninh Kiều, Cần Thơ</span>
                  </div>
                </div>

                {/* CARD BODY CONTENT */}
                <div className="p-6 space-y-4 flex-grow">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition">
                      {facility.name}
                    </h3>
                    <p className="text-xs text-slate-600 flex items-start gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      {facility.address}
                    </p>
                  </div>

                  {/* PRICE BADGE */}
                  <div className="p-3 bg-teal-50/80 rounded-2xl border border-teal-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Giá thuê dài hạn:</span>
                    <span className="text-lg font-extrabold text-teal-800">
                      {Number(facility.price_per_month).toLocaleString('vi-VN')} VNĐ/tháng
                    </span>
                  </div>

                  {/* AMENITIES BADGES */}
                  {facility.facility_amenities && facility.facility_amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {facility.facility_amenities.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                          ✓ {item.amenity?.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* PROVIDER CONTACT SHORT */}
                  {facility.provider && (
                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Chủ bãi: <strong className="text-slate-800">{facility.provider.full_name}</strong></span>
                    </div>
                  )}
                </div>

                {/* CARD FOOTER ACTION */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleOpenModal(facility)}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Gửi Yêu Cầu Thuê Bãi Xe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL GỬI YÊU CẦU THUÊ */}
      <SendReservationModal
        facility={selectedFacility}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleReservationSuccess}
      />
    </div>
  );
};

export default FacilityListPage;
