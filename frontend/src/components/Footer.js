import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-900 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">Park<span className="text-teal-400">Link</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nền tảng kết nối người cần thuê bãi đỗ xe theo tháng uy tín, minh bạch và tiện lợi.
            </p>
            <div className="inline-flex items-center space-x-2 text-[11px] text-teal-400 font-medium bg-teal-950/60 px-2.5 py-1.5 rounded-md border border-teal-800/40">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Chỉ hỗ trợ thuê theo tháng - An tâm tuyệt đối</span>
            </div>
          </div>

          {/* Dành cho Khách Thuê */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm tracking-wide">Dành Cho Khách Thuê</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/search" className="hover:text-teal-400 transition">Tìm bãi đỗ gần bạn</Link></li>
              <li><Link to="/register" className="hover:text-teal-400 transition">Đăng ký tài khoản</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-teal-400 transition">Quy trình thuê tháng</Link></li>
            </ul>
          </div>

          {/* Dành cho Chủ Bãi Đỗ */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm tracking-wide">Dành Cho Chủ Bãi Đỗ</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/register-provider" className="hover:text-teal-400 transition">Đăng ký bãi đỗ xe</Link></li>
              <li><Link to="/#provider-benefits" className="hover:text-teal-400 transition">Quyền lợi khi đăng bãi</Link></li>
              <li><Link to="/#pricing" className="hover:text-teal-400 transition">Chính sách phí nền tảng</Link></li>
            </ul>
          </div>

          {/* Liên hệ & Hỗ trợ */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm tracking-wide">Hỗ Trợ & Liên Hệ</h4>
            <div className="text-xs text-slate-400">
              <a href="mailto:parklink.service@gmail.com" className="flex items-center gap-2 hover:text-teal-400 transition">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" /> parklink.service@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Footer */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          <p>© 2026 ParkLink Project. Bản quyền thuộc về Đội ngũ SEP490-12-ParkLink.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
