import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Car, Info, Loader2, Search, Bookmark, ArrowRight, X, Star, ShieldCheck } from 'lucide-react';
import { getFavorites, removeFavorite } from '../../services/favoriteService';
import Toast from '../../components/common/Toast';

const FavoriteFacilitiesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await getFavorites();
      // Đảm bảo luôn là mảng để tránh lỗi .length trên undefined
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách yêu thích');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e, facilityId) => {
    e.preventDefault();
    try {
      await removeFavorite(facilityId);
      setFavorites(prev => prev.filter(f => f.id !== facilityId));
      setToast({ message: 'Đã xóa khỏi danh sách yêu thích', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Có lỗi xảy ra', type: 'error' });
    }
  };

  const filteredFavorites = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const result = favorites.filter((facility) => {
      if (!query) return true;
      return `${facility.name || ''} ${facility.address || ''}`.toLowerCase().includes(query);
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'price-asc') return Number(a.price_per_month || 0) - Number(b.price_per_month || 0);
      if (sortBy === 'price-desc') return Number(b.price_per_month || 0) - Number(a.price_per_month || 0);
      if (sortBy === 'rating') return Number(b.avg_rating || 0) - Number(a.avg_rating || 0);
      return new Date(b.saved_at || 0) - new Date(a.saved_at || 0);
    });
  }, [favorites, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to="/" className="hover:text-teal-700 transition-colors">Trang chủ</Link>
            <span className="text-slate-300">/</span>
            <Link to="/dashboard" className="hover:text-teal-700 transition-colors">Tài khoản của tôi</Link>
            <span className="text-slate-300">/</span>
            <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">Bãi xe yêu thích</span>
          </nav>
          <div className="inline-flex items-center gap-2 self-start md:self-auto text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Danh sách được đồng bộ từ máy chủ
          </div>
        </div>

        <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl flex flex-col gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-xs font-semibold w-max">
                <Bookmark className="w-4 h-4 fill-current" /> ƯU TIÊN THEO DÕI BÃI XE
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Bãi xe yêu thích <span className="text-slate-500 font-normal text-xl md:text-2xl">(Favorite Facilities)</span>
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">Quản lý danh sách các bãi đỗ xe bạn đã lưu để theo dõi và truy cập nhanh.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 min-w-[130px]">
                <span className="text-xs text-slate-500 font-medium">Đã lưu</span>
                <span className="block text-2xl font-bold text-slate-900 mt-0.5">{favorites.length}</span>
                <span className="text-[11px] text-slate-500">bãi xe cá nhân</span>
              </div>
              <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3.5 min-w-[130px]">
                <span className="text-xs text-teal-700 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Đang theo dõi</span>
                <span className="block text-2xl font-bold text-teal-700 mt-0.5">{favorites.length}</span>
                <span className="text-[11px] text-slate-500">bãi trong danh sách</span>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm bãi đã lưu theo tên, tuyến đường..." className="w-full bg-slate-50 pl-10 pr-10 py-2.5 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600 transition-all" />
              {searchTerm && <button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>}
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-50 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600">
              <option value="recent">Sắp xếp: Mới lưu gần đây</option>
              <option value="price-asc">Giá thuê: Thấp đến cao</option>
              <option value="price-desc">Giá thuê: Cao đến thấp</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
          <Link to="/search" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-lg text-xs font-bold transition-all shrink-0">
            <MapPin className="w-4 h-4" /> Tìm thêm bãi xe
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 flex items-center gap-2">
            <Info className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {favorites.length === 0 && !error ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <Heart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có bãi xe nào</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">Bạn chưa lưu bãi xe nào. Hãy tìm và lưu các bãi xe bạn quan tâm để truy cập nhanh.</p>
            <Link to="/search" className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors inline-flex items-center gap-2"><Search className="w-4 h-4" /> Tìm bãi đỗ xe ngay</Link>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 shadow-sm">
            <Heart className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Không tìm thấy bãi xe phù hợp</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">Thử thay đổi từ khóa tìm kiếm của bạn.</p>
            <button type="button" onClick={() => setSearchTerm('')} className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-semibold text-xs">Đặt lại tìm kiếm</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((facility) => (
              <article
                key={facility.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group border border-slate-100"
              >
                <div>
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  {facility.images && facility.images.length > 0 ? (
                    <img 
                      src={facility.images.find(img => img.is_primary)?.image_url || facility.images[0].image_url} 
                      alt={facility.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Car className="w-10 h-10 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-900/30 pointer-events-none" />
                  <button 
                    onClick={(e) => handleToggleFavorite(e, facility.id)}
                    aria-label="Bỏ lưu khỏi danh sách yêu thích"
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-transform active:scale-90 flex items-center justify-center z-10"
                  >
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  </button>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-600 text-white shadow-sm flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Đã lưu
                  </div>
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs text-white">
                    <span className="inline-flex items-center gap-1 font-semibold bg-black/40 backdrop-blur-md px-2 py-1 rounded"><Car className="w-3.5 h-3.5 text-teal-300" /> Sức chứa {facility.capacity || '—'} chỗ</span>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">#{String(facility.id).padStart(4, '0')}</span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">{facility.name}</h3>
                    </div>
                    {facility.avg_rating && <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold text-xs shrink-0"><Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {facility.avg_rating}<span className="text-slate-400 font-normal">({facility.total_reviews || 0})</span></div>}
                  </div>
                  <p className="text-xs text-slate-600 flex items-start gap-1 leading-snug line-clamp-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
                    {facility.address}
                  </p>
                  <div className="bg-teal-50 rounded-lg p-2.5 flex items-center gap-2 border border-teal-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-teal-800">Đang được theo dõi</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(facility.facility_amenities || []).slice(0, 3).map((item) => <span key={item.amenity?.id || item.amenity_id} className="px-2 py-1 bg-slate-100 rounded text-[11px] font-medium text-slate-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-teal-600" /> {item.amenity?.name || 'Tiện ích'}</span>)}
                    {(!facility.facility_amenities || facility.facility_amenities.length === 0) && <span className="text-[11px] text-slate-400">Chưa có thông tin tiện ích</span>}
                  </div>
                </div>
                </div>
                <div className="p-5 pt-0 mt-2 flex flex-col gap-3">
                  <div className="flex items-baseline justify-between pt-3 bg-slate-50/60 -mx-5 px-5 py-2.5">
                    <span className="text-xs text-slate-500">Giá thuê tháng niêm yết:</span>
                    <div className="text-right"><span className="text-lg font-bold text-teal-700">{Number(facility.price_per_month || 0).toLocaleString('vi-VN')} đ</span><span className="text-[11px] text-slate-500">/tháng</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => navigate(`/facility/${facility.id}`)} className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">Xem chi tiết</button>
                    <button type="button" onClick={() => navigate(`/facility/${facility.id}`)} className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all flex items-center justify-center gap-1"><ArrowRight className="w-4 h-4" /> Giữ chỗ ngay</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {filteredFavorites.length > 0 && <div className="bg-white rounded-xl px-5 py-3.5 shadow-sm border border-slate-200 text-xs text-slate-600 font-medium">Hiển thị <strong className="text-slate-900">{filteredFavorites.length}</strong> trên tổng số <strong className="text-slate-900">{favorites.length}</strong> bãi xe đã lưu</div>}
        <section className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0"><MapPin className="w-6 h-6" /></div><div><h4 className="text-base md:text-lg font-bold text-slate-900">Bạn cần mở rộng vị trí tìm kiếm?</h4><p className="text-xs md:text-sm text-slate-600 mt-1">Khám phá thêm các bãi đỗ xe đã được kiểm định trên mạng lưới ParkLink.</p></div></div>
          <Link to="/search" className="w-full md:w-auto px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center justify-center gap-2 shrink-0"><Search className="w-4 h-4" /> Khám phá bãi xe</Link>
        </section>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default FavoriteFacilitiesPage;
