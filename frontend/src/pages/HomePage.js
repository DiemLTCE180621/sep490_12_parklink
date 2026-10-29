import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Shield, Calendar, ArrowRight, Clock } from 'lucide-react';
import { VEHICLE_TYPES } from '../constants/vehicleTypes';
import VietmapAddressAutocomplete from '../components/common/VietmapAddressAutocomplete';

const HomePage = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0].id);
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate('/search', { state: { keyword: searchLocation, vehicleType } });
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HERO BANNER SECTION */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

            {/* --- CỘT TRÁI: Nội dung và Thanh tìm kiếm --- */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-6">
                <Shield className="w-4 h-4 text-teal-400" /> Mô Hình Thuê Bãi Đỗ Theo Tháng Uy Tín
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                Tìm Bãi Đỗ Xe Cho Thuê <span className="text-teal-400">Theo Tháng</span> Gần Bạn
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
                ParkLink kết nối trực tiếp chủ bãi đỗ xe và khách thuê. Đặt chỗ giữ chỗ dài hạn, check-in tiện lợi, minh bạch 100%.
              </p>

              {/* SEARCH BAR CARD */}
              <div id="search" className="bg-white p-3.5 sm:p-4 rounded-xl shadow-xl text-slate-900 border border-slate-100 relative z-20 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Location Search Input */}
                  <div className="sm:col-span-5 relative">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Địa điểm / Vị trí</label>
                    <div className="relative">
                      <VietmapAddressAutocomplete
                        value={searchLocation}
                        onChange={setSearchLocation}
                        placeholder="Nhập quận, tên đường hoặc tọa độ..."
                        inputClassName="py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Vehicle Type Selection */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Loại xe</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {VEHICLE_TYPES.map(vt => (
                        <option key={vt.id} value={vt.id}>{vt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Search Button */}
                  <div className="sm:col-span-3">
                    <button
                      onClick={handleSearchClick}
                      className="w-full h-[38px] py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 text-sm transition duration-200"
                    >
                      <Search className="w-4 h-4" /> Tìm Bãi Đỗ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* --- CỘT PHẢI: Hình ảnh minh họa --- */}
            <div className="relative hidden lg:flex items-center justify-center w-full max-w-lg xl:max-w-xl mx-auto z-10">
              <img
                src="Parklink.png"
                alt="Minh họa bãi đỗ xe"
                className="w-full h-auto object-cover scale-125 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_80%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_80%)]"
              />
              {/* Vòng sáng trang trí nhẹ phía sau ảnh */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-teal-500/20 blur-[100px] -z-10 rounded-full"></div>
            </div>

          </div>
        </div>
      </section>

      {/* QUICK ROLE SELECTOR BANNER */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Box Customer */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Bạn Cần Thuê Bãi Đỗ Xe Dài Hạn?</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Đăng ký tài khoản Khách thuê ngay hôm nay để tìm kiếm bãi đỗ an toàn gần nhà hoặc nơi làm việc.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md w-fit transition"
              >
                Đăng Ký Khách Thuê <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Box Provider */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-8 flex flex-col justify-between hover:shadow-lg transition">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Bạn Là Chủ Bãi Đỗ Xe?</h3>
                <p className="text-slate-300 text-sm mb-6">
                  Đăng bãi đỗ xe của bạn lên ParkLink để kết nối khách thuê theo tháng và tăng doanh thu ổn định.
                </p>
              </div>
              <Link
                to="/register-provider"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold rounded-xl shadow-md w-fit transition"
              >
                Đăng Ký Chủ Bãi Xe <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE PARKLINK (NEIGHBOR FEATURES) */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Tại Sao Lựa Chọn ParkLink?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Giải pháp kết nối trực tiếp không qua trung gian, tập trung duy nhất vào nhu cầu thuê bãi xe theo tháng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Thuê Theo Tháng Dài Hạn</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Giữ chỗ đỗ xe ổn định hàng tháng mà không lo hết chỗ hay tăng giá đột ngột trong dịp cao điểm.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Xác Thực Nhanh Chóng</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Bãi xe và thông tin tài khoản Provider đều trải qua quy trình duyệt thủ công nghiêm ngặt từ ban quản trị.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Check-in Vận Hành Thủ Công</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Được hỗ trợ trực tiếp bởi nhân viên tại bãi thao tác trên hệ thống web ParkLink, không phụ thuộc phần cứng rắc rối.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
