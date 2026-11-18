import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Calendar, ArrowRight, Clock, Building2, UserCheck } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#06141a] min-h-screen text-slate-100 flex flex-col justify-between">
      <section className="relative text-white pt-4 pb-8 lg:pt-6 lg:pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-teal-500/10 blur-[130px] rounded-full pointer-events-none -z-0"></div>

        <div className="w-full max-w-[95%] xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold tracking-wide mb-2 backdrop-blur-md shadow-sm">
              <Shield className="w-3.5 h-3.5 text-teal-400" /> Mô Hình Thuê Bãi Đỗ Theo Tháng Uy Tín
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-2">
              Tìm Bãi Đỗ Xe Cho Thuê <span className="text-teal-400">Theo Tháng</span> Gần Bạn
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              ParkLink kết nối trực tiếp chủ bãi đỗ xe và khách thuê dài hạn. Đặt chỗ giữ xe an toàn, bảo vệ tài sản, thanh toán minh bạch 100%.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-6 items-end mt-2">
            <div className="lg:col-span-4 flex flex-col items-center order-2 lg:order-1 h-full justify-end">
              <div className="w-full flex justify-center -mb-5 relative z-20">
                <img
                  src="/hero_car.png"
                  alt="Khách thuê xe"
                  className="w-44 sm:w-52 h-auto object-contain drop-shadow-[0_15px_20px_rgba(0,0,0,0.5)]"
                />
              </div>

              <div className="w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300/90 text-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 relative z-10 flex flex-col justify-between min-h-[260px] h-[260px]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-900/10 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <UserCheck className="w-3.5 h-3.5 text-teal-700" /> Khách Thuê Xe
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">Bạn Cần Thuê Bãi Dài Hạn?</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Tìm bãi đỗ xe an toàn gần nhà hoặc công ty, ký hợp đồng thuê theo tháng rõ ràng, bảo vệ quyền lợi 100%.
                  </p>
                </div>

                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition duration-200 w-full sm:w-fit"
                >
                  Đăng Ký Khách Thuê <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center text-center order-1 lg:order-2 h-full justify-end">
              <div className="relative w-full max-w-sm mx-auto">
                <img
                  src="/hero_handshake.png"
                  alt="Ký kết hợp đồng thuê bãi ParkLink"
                  className="w-full h-auto object-contain [mask-image:radial-gradient(ellipse_at_center,black_28%,transparent_62%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_28%,transparent_62%)]"
                />
              </div>

              <div className="mt-4 flex flex-col items-center gap-2.5 w-full">
                <button
                  onClick={() => navigate('/search')}
                  className="px-8 py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-sm sm:text-base transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  Tìm kiếm ngay <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 sm:mt-6 mb-1">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-widest block mb-0.5">
                  ĐỐI TƯỢNG PHỤC VỤ
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Giải Pháp Linh Hoạt Cho Cả Hai Bên
                </h2>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center order-3 h-full justify-end">
              <div className="w-full flex justify-center -mb-4 relative z-20">
                <img
                  src="/hero_parking.png"
                  alt="Chủ bãi đỗ xe"
                  className="w-32 sm:w-36 h-auto object-contain drop-shadow-[0_15px_20px_rgba(0,0,0,0.6)]"
                />
              </div>

              <div className="w-full bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-[#071d24]/90 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-teal-500/30 relative z-10 flex flex-col justify-between min-h-[260px] h-[260px]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Building2 className="w-3.5 h-3.5 text-teal-300" /> Chủ Bãi Đỗ Xe
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">Bạn Là Chủ Bãi Xe?</h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Đăng bãi đỗ xe lên ParkLink để tiếp cận khách thuê dài hạn, tối ưu công suất và nhận doanh thu ổn định.
                  </p>
                </div>

                <Link
                  to="/register-provider"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold rounded-xl text-sm shadow-md hover:shadow-lg transition duration-200 w-full sm:w-fit"
                >
                  Đăng Ký Chủ Bãi Xe <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 bg-white border-t border-slate-200 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tại Sao Lựa Chọn ParkLink?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Giải pháp kết nối trực tiếp không qua trung gian, tập trung duy nhất vào nhu cầu thuê bãi xe theo tháng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-slate-50 p-6 sm:p-7 rounded-3xl border-2 border-slate-300 shadow-sm hover:shadow-md hover:border-teal-600 transition duration-200">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold mb-5 border border-teal-100">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Thuê Theo Tháng Dài Hạn</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Giữ chỗ đỗ xe ổn định hàng tháng mà không lo hết chỗ hay tăng giá đột ngột trong dịp cao điểm.
              </p>
            </div>

            <div className="bg-slate-50 p-6 sm:p-7 rounded-3xl border-2 border-slate-300 shadow-sm hover:shadow-md hover:border-teal-600 transition duration-200">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold mb-5 border border-teal-100">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Xác Thực Nhanh Chóng</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Bãi xe và thông tin tài khoản Provider đều trải qua quy trình duyệt thực địa nghiêm ngặt từ ban quản trị.
              </p>
            </div>

            <div className="bg-slate-50 p-6 sm:p-7 rounded-3xl border-2 border-slate-300 shadow-sm hover:shadow-md hover:border-teal-600 transition duration-200">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold mb-5 border border-teal-100">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Vận Hành Minh Bạch</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Theo dõi hợp đồng, tình trạng chỗ đỗ và hóa đơn trực tuyến trên hệ thống web ParkLink mọi lúc mọi nơi.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
