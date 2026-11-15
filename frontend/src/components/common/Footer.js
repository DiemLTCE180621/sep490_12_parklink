import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const Footer = () => {
  const { user, isAuthenticated } = useAuth();
  const [adminPhone, setAdminPhone] = useState('0900000000');

  const roleName = user?.role?.name || user?.role;

  useEffect(() => {
    // Nếu Admin đang đăng nhập, lấy trực tiếp phone từ user
    if (roleName === 'ADMIN' && user?.phone_number) {
      setAdminPhone(user.phone_number);
      return;
    }

    // Tải thông tin liên hệ Admin từ hệ thống
    const fetchContact = async () => {
      try {
        const res = await authService.getContactInfo();
        const data = res?.data?.data || res?.data;
        if (data?.phone_number) {
          setAdminPhone(data.phone_number);
        }
      } catch (err) {
        // Giữ số mặc định nếu có lỗi
      }
    };

    fetchContact();
  }, [roleName, user?.phone_number]);

  const displayPhone = (roleName === 'ADMIN' && user?.phone_number)
    ? user.phone_number
    : adminPhone;

  // 1. ADMIN: Chỉ giữ mỗi dòng bản quyền tối giản vì Admin đã có tab Quản lý Chính Sách riêng trong Dashboard
  if (isAuthenticated && roleName === 'ADMIN') {
    return (
      <footer className="bg-slate-900 text-slate-500 py-2.5 border-t border-slate-800 text-center text-xs">
        <p>© 2026 ParkLink Project. Bản quyền thuộc về Đội ngũ SEP490-12-ParkLink.</p>
      </footer>
    );
  }

  // 2. PROVIDER: Footer đối tác có mục Quy định & Chính sách (UC-90)
  if (isAuthenticated && roleName === 'PROVIDER') {
    return (
      <footer className="bg-slate-900 text-slate-300 pt-4 pb-3 border-t border-slate-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            {/* Thông tin thương hiệu */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-teal-600 text-white flex items-center justify-center shadow-md">
                  <img
                    src="/logo.png"
                    alt="ParkLink Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-base font-extrabold text-white tracking-tight">Park<span className="text-teal-400">Link</span></span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nền tảng kết nối đối tác chủ bãi xe theo tháng uy tín, minh bạch và an toàn.
              </p>
            </div>

            {/* Quy định & Chính sách đối tác (UC-90) */}
            <div>
              <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-wider">Quy Định & Chính Sách</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <Link to="/policies" className="hover:text-teal-400 transition flex items-center gap-1.5">
                    <span>•</span> Chính sách ParkLink
                  </Link>
                </li>
              </ul>
            </div>

            {/* Hỗ trợ kỹ thuật đối tác */}
            <div className="sm:text-right">
              <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-wider">Hỗ Trợ Kỹ Thuật Đối Tác</h4>
              <div className="text-xs text-slate-400 space-y-1.5 inline-flex flex-col sm:items-end">
                <a href="mailto:parklink.service@gmail.com" className="flex items-center gap-1.5 hover:text-teal-400 transition">
                  <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" /> parklink.service@gmail.com
                </a>
                {displayPhone && (
                  <a href={`tel:${displayPhone}`} className="flex items-center gap-1.5 hover:text-teal-400 transition font-medium">
                    <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Hotline Quản Trị: {displayPhone}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-800 text-center text-xs text-slate-500">
            <span>© 2026 ParkLink Project. Bản quyền thuộc về Đội ngũ SEP490-12-ParkLink.</span>
          </div>
        </div>
      </footer>
    );
  }

  // 3. GUEST và CUSTOMER: Footer đầy đủ, thoáng và chuẩn giao diện
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-teal-600 text-white flex items-center justify-center shadow-md">
                <img
                  src="/logo.png"
                  alt="ParkLink Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Park<span className="text-teal-400">Link</span>
              </span>
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
              <li><Link to="/policies/customer" className="hover:text-teal-400 transition">Chính sách thuê bãi xe</Link></li>
            </ul >
          </div >

          {/* Dành cho Chủ Bãi Đỗ */}
          < div >
            <h4 className="text-white font-semibold mb-0.5 text-xs tracking-wide">Chủ Bãi Đỗ</h4>
            <ul className="space-y-0.5 text-[10px] text-slate-400">
              <li><Link to="/policies/provider" className="hover:text-teal-400 transition">Quy chế hoạt động đối tác</Link></li>
            </ul>
          </div>

          {/* Liên hệ & Hỗ trợ */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm tracking-wide">Hỗ Trợ & Liên Hệ</h4>
            <div className="text-xs text-slate-400 space-y-2">
              <a href="mailto:parklink.service@gmail.com" className="flex items-center gap-2 hover:text-teal-400 transition">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" /> parklink.service@gmail.com
              </a>
              {displayPhone && (
                <a href={`tel:${displayPhone}`} className="flex items-center gap-2 hover:text-teal-400 transition">
                  <Phone className="w-4 h-4 text-teal-400 shrink-0" /> {displayPhone}
                </a>
              )}
            </div>
          </div>
        </div >

        {/* Copyright Footer */}
        < div className="mt-1.5 pt-1 border-t border-slate-800/80 text-center text-[10px] text-slate-500 flex flex-wrap items-center justify-center gap-2" >
          <span>© 2026 ParkLink Project. Bản quyền thuộc về Đội ngũ SEP490-12-ParkLink.</span>
          <span>•</span>
          <Link to="/policies" className="text-slate-400 hover:text-teal-400 transition underline">
            Chính sách & Điều khoản ParkLink
          </Link>
        </div >
      </div >
    </footer >
  );
};

export default Footer;
