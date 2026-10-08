import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewSection from '../../components/common/ReviewSection';
import SendReservationModal from '../../components/modals/SendReservationModal';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';
import chatService from '../../services/chatService';
import facilityService from '../../services/facilityService';
import { addFavorite, removeFavorite, getFavorites } from '../../services/favoriteService';
import {
  Send, MapPin, ShieldCheck, Car, MessageCircle, Heart, CheckCircle2,
  Loader2, ChevronLeft, ChevronRight, Share2, Clock3, Navigation, LockKeyhole,
  UserRound, FileText, ExternalLink, Star
} from 'lucide-react';

const FacilityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useAuth();
  const facilityId = parseInt(id, 10);

  const [facility, setFacility] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    const syncFavoriteState = async () => {
      if (!isAuthenticated || user?.role?.name !== 'CUSTOMER') {
        setIsFavorite(false);
        return;
      }

      try {
        const favorites = await getFavorites();
        if (cancelled) return;

        const favoriteList = Array.isArray(favorites) ? favorites : [];
        const isFav = favoriteList.some((favorite) => {
          const favoriteFacilityId = favorite?.id
            ?? favorite?.facility_id
            ?? favorite?.facility?.id;

          return Number(favoriteFacilityId) === facilityId;
        });

        setIsFavorite(isFav);
      } catch (error) {
        if (!cancelled) {
          console.error('Lỗi khi đồng bộ danh sách yêu thích:', error);
          setIsFavorite(false);
        }
      }
    };

    syncFavoriteState();

    return () => {
      cancelled = true;
    };
  }, [facilityId, isAuthenticated, user?.role?.name]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await facilityService.getFacilityDetails(facilityId);
      const data = res.data?.data || res.data;
      setFacility(data);
      setActiveImage(0);

      if (isAuthenticated && user?.role?.name === 'CUSTOMER') {
        // Fetch availability
        const availRes = await facilityService.getFacilityAvailability(facilityId);
        const availData = availRes.data?.data || availRes.data;
        setAvailability(availData);

      }
    } catch (error) {
      console.error(error);
      setToastMsg('Không thể tải thông tin bãi đỗ xe');
      setToastType('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      setToastMsg('Vui lòng đăng nhập để lưu bãi đỗ xe!');
      setToastType('error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite(facilityId);
        setIsFavorite(false);
        setToastMsg('Đã xóa khỏi danh sách yêu thích');
      } else {
        await addFavorite(facilityId);
        setIsFavorite(true);
        setToastMsg('Đã thêm vào danh sách yêu thích');
      }
      setToastType('success');
    } catch (error) {
      setToastMsg(error.message || 'Lỗi khi cập nhật danh sách yêu thích');
      setToastType('error');
    }
  };

  const handleChatClick = async () => {
    if (!isAuthenticated) {
      setToastMsg('Vui lòng đăng nhập để nhắn tin!');
      setToastType('error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (user?.role?.name === 'PROVIDER') {
      setToastMsg('Chủ bãi không thể tự nhắn cho mình!');
      setToastType('error');
      return;
    }

    try {
      const providerId = facility.provider_id;
      const res = await chatService.getOrCreateRoom(user.id, providerId, facilityId, token);
      if (res.success) {
        navigate('/chat', { state: { activeRoomId: res.data.id } });
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message;
      setToastMsg('Lỗi khi tạo phòng chat: ' + errorMsg);
      setToastType('error');
    }
  };

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      setToastMsg('Vui lòng đăng nhập tài khoản Khách hàng để gửi yêu cầu thuê!');
      setToastType('error');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      return;
    }

    if (user?.role?.name === 'PROVIDER') {
      setToastMsg('Tài khoản Chủ bãi xe không thể gửi yêu cầu thuê! Vui lòng sử dụng tài khoản Khách hàng.');
      setToastType('error');
      return;
    }

    if (availability && availability.available_slots <= 0) {
      setToastMsg('Bãi đỗ xe đã hết chỗ trống!');
      setToastType('error');
      return;
    }

    setIsModalOpen(true);
  };

  const handleReservationSuccess = () => {
    setIsModalOpen(false);
    setToastType('success');
    setToastMsg('Gửi yêu cầu thuê bãi đỗ xe thành công! Đang chuyển hướng tới danh sách yêu cầu...');
    setTimeout(() => {
      navigate('/my-reservations');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy bãi đỗ xe</h2>
          <button 
            onClick={() => navigate('/')}
            className="text-teal-600 font-semibold hover:underline"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>

  const images = facility.images || [];
  const currentImage = images[activeImage] || images[0];
  const facilityCode = `FAC-${String(facility.id).padStart(4, '0')}`;
  const vehicleTypes = Array.isArray(facility.vehicle_types) ? facility.vehicle_types : [];
  const providerName = facility.provider?.full_name || 'Chủ bãi xe';
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.address || facility.name)}`;
  const formatPrice = (value) => Number(value || 0).toLocaleString('vi-VN');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg('')} />

      <div className="max-w-8xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <button onClick={() => navigate('/')} className="hover:text-teal-700 transition-colors">Trang chủ</button>
            <span>/</span>
            <button onClick={() => navigate('/search')} className="hover:text-teal-700 transition-colors">Tìm bãi xe</button>
            <span>/</span>
            <span className="text-teal-700 font-semibold truncate max-w-[220px]">{facility.name}</span>
          </nav>
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Mã bãi:</span>
            <strong className="text-slate-800">{facilityCode}</strong>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5">
              <div className="relative h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                {currentImage ? (
                  <img src={currentImage.image_url} alt={facility.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Car className="w-12 h-12 text-slate-600" />
                    <span>Chưa có hình ảnh bãi xe</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/75 text-white text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đã xác thực thực tế
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/75 text-white text-xs font-semibold">
                    {images.length ? `${activeImage + 1} / ${images.length}` : '0 ảnh'}
                  </span>
                </div>
                {images.length > 1 && (
                  <>
                    <button onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)} aria-label="Ảnh trước" className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow hover:bg-white">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveImage((activeImage + 1) % images.length)} aria-label="Ảnh kế tiếp" className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow hover:bg-white">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      {images.map((image, index) => (
                        <button key={image.id || image.image_url} onClick={() => setActiveImage(index)} aria-label={`Xem ảnh ${index + 1}`} className={`w-2 h-2 rounded-full transition ${index === activeImage ? 'bg-teal-400 w-5' : 'bg-white/60 hover:bg-white'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-700 px-2.5 py-1 rounded-full text-xs font-semibold"><ShieldCheck className="w-3.5 h-3.5" /> Đã xác thực</span>
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium"><Clock3 className="w-3.5 h-3.5" /> Mở cửa 24/7</span>
                  {vehicleTypes.length > 0 && <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full text-xs font-medium"><Car className="w-3.5 h-3.5" /> {vehicleTypes.join(', ')}</span>}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{facility.name}</h1>
                <p className="text-sm text-slate-600 flex items-start gap-2"><MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" /> {facility.address}</p>
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /><strong className="text-slate-800 text-sm">{facility.avg_rating || '—'}</strong><span>({facility.total_reviews || 0} đánh giá)</span></span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1"><UserRound className="w-3.5 h-3.5 text-emerald-600" /> Chủ bãi: <strong className="text-slate-800">{providerName}</strong></span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                <button onClick={toggleFavorite} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition ${isFavorite ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} /> {isFavorite ? 'Đã lưu' : 'Lưu bãi xe'}
                </button>
                <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" title="Sao chép liên kết"><Share2 className="w-4 h-4" /></button>
                <button onClick={handleOpenModal} disabled={availability && availability.available_slots <= 0} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold text-xs shadow-sm transition disabled:cursor-not-allowed">
                  <Send className="w-4 h-4" /> Đặt giữ chỗ
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><Car className="w-5 h-5" /></div><h2 className="text-lg font-bold text-slate-900">Tình trạng chỗ trống</h2></div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Cập nhật trực tiếp</span>
            </div>
            {availability ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200"><p className="text-xs text-slate-500">Sức chứa</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{availability.capacity}</p><p className="text-[11px] text-slate-400">khoang xe</p></div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200"><p className="text-xs text-slate-500">Đang gửi</p><p className="text-2xl font-extrabold text-indigo-600 mt-1">{availability.active_contracts}</p><p className="text-[11px] text-slate-400">xe đang đỗ</p></div>
                <div className={`p-3 rounded-lg border ${availability.available_slots > 0 ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}><p className="text-xs text-slate-600">Còn trống</p><p className={`text-2xl font-extrabold mt-1 ${availability.available_slots > 0 ? 'text-teal-600' : 'text-red-600'}`}>{availability.available_slots}</p><p className="text-[11px] text-slate-500">{availability.available_slots > 0 ? 'nhận xe ngay' : 'đã hết chỗ'}</p></div>
              </div>
            ) : (
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-center text-sm text-slate-500"><LockKeyhole className="w-5 h-5 mx-auto mb-2 text-slate-400" />Đăng nhập tài khoản Khách hàng để xem tình trạng chỗ trống.</div>
            )}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Tiện ích bãi xe</h3>
              <div className="flex flex-wrap gap-2">
                {(facility.facility_amenities || []).map(fa => <span key={fa.amenity.id} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-50 border border-teal-100 text-teal-800 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />{fa.amenity.name}</span>)}
                {(!facility.facility_amenities || facility.facility_amenities.length === 0) && <span className="text-sm text-slate-500">Chưa có thông tin tiện ích.</span>}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><FileText className="w-5 h-5" /></div><h2 className="text-lg font-bold text-slate-900">Thông tin thuê bãi</h2></div>
              <span className="text-[11px] text-slate-400">Thuê theo tháng</span>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Giá thuê từ</span><strong className="text-xl text-teal-700">{formatPrice(facility.price_per_month)} đ<span className="text-xs font-medium text-slate-500">/tháng</span></strong></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Loại xe phù hợp</span><span className="font-semibold text-slate-800">{vehicleTypes.length ? vehicleTypes.join(', ') : 'Ô tô'}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Chủ bãi</span><span className="font-semibold text-slate-800">{providerName}</span></div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-4">Gửi yêu cầu kèm thông tin xe và ngày bắt đầu thuê. Chủ bãi sẽ phản hồi và xác nhận trực tiếp trên hệ thống.</p>
            <div className="flex flex-wrap gap-2 mt-auto pt-5">
              <button onClick={handleChatClick} className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"><MessageCircle className="w-4 h-4" /> Nhắn chủ bãi</button>
              <button onClick={handleOpenModal} disabled={availability && availability.available_slots <= 0} className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white text-xs font-semibold transition disabled:cursor-not-allowed"><Send className="w-4 h-4" /> Yêu cầu đặt chỗ</button>
            </div>
          </section>
        </div>

        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Navigation className="w-5 h-5 text-teal-600" /> Vị trí & hướng dẫn đường đi</h2><p className="text-xs text-slate-500 mt-1">{facility.address}</p></div>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:text-teal-700 hover:bg-slate-50 text-xs font-semibold"><ExternalLink className="w-4 h-4 text-teal-600" /> Xem đường đi</a>
          </div>
          <div className="relative h-48 sm:h-56 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
            <iframe title={`Bản đồ ${facility.name}`} src={`https://www.google.com/maps?q=${encodeURIComponent(facility.address || facility.name)}&output=embed`} className="w-full h-full border-0" loading="lazy" />
          </div>
        </section>

        <ReviewSection facilityId={facilityId} />
      </div>

      {/* MODAL GỬI YÊU CẦU THUÊ */}
      <SendReservationModal
        facility={{...facility, price: facility.price_per_month}}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleReservationSuccess}
      />
    </div>
  );
};

export default FacilityDetailPage;
