import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const Footer = () => {
  const { user, isAuthenticated } = useAuth();
  const [adminPhone, setAdminPhone] = useState('0900000000');

  useEffect(() => {
    // Nếu Admin đang đăng nhập, lấy trực tiếp phone từ user
    if (user?.role?.name === 'ADMIN' && user?.phone_number) {
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
  }, [user?.role?.name, user?.phone_number]);

  const roleName = user?.role?.name;
  const displayPhone = (roleName === 'ADMIN' && user?.phone_number)
    ? user.phone_number
    : adminPhone;

  // 1. ADMIN và FIELD_INSPECTOR: Chỉ giữ mỗi dòng bản quyền tối giản
  if (isAuthenticated && (roleName === 'ADMIN' || roleName === 'FIELD_INSPECTOR')) {
    return (
      <footer className="bg-slate-900 text-slate-500 py-6 border-t border-slate-800 text-center text-xs">
        <p>© 2026 ParkLink Project. Bản quyền thuộc về Đội ngũ SEP490-12-ParkLink.</p>
      </footer>
    );
  }

  // 2. PROVIDER: Footer gọn gàng hỗ trợ đối tác (ẩn các cột đăng ký/khách thuê)
  if (isAuthenticated && roleName === 'PROVIDER') {
    return (
      <footer className="bg-slate-900 text-slate-300 pt-10 pb-6 border-t border-slate-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:bg-teal-700 transition duration-200">
                  <img
                    src="/logo.png"
                    alt="ParkLink Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xl font-extrabold text-white tracking-tight">Park<span className="text-teal-400">Link</span></span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nền tảng kết nối người cần thuê bãi đỗ xe theo tháng uy tín, minh bạch và tiện lợi.
              </p>
            </div>

            <div className="md:text-right">
              <h4 className="text-white font-semibold mb-3 text-sm tracking-wide">Hỗ Trợ Kỹ Thuật Đối Tác</h4>
              <div className="text-xs text-slate-400 space-y-2 inline-flex flex-col md:items-end">
                <a href="mailto:parklink.service@gmail.com" className="flex items-center gap-2 hover:text-teal-400 transition">
                  <Mail className="w-4 h-4 text-teal-400 shrink-0" /> parklink.service@gmail.com
                </a>
                {displayPhone && (
                  <a href={`tel:${displayPhone}`} className="flex items-center gap-2 hover:text-teal-400 transition font-medium">
                    <Phone className="w-4 h-4 text-teal-400 shrink-0" /> Hotline Quản Trị: {displayPhone}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-500">
            <p>© 2026 ParkLink Project. Bản quyền thuộc về Đội ngũ SEP490-12-ParkLink.</p>
          </div>
        </div>
      </footer>
    );
  }

  // 3. GUEST và CUSTOMER: Footer đầy đủ, đã lọc sạch các link ảo
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:bg-teal-700 transition duration-200">
                <img
                  src="/logo.png"
                  alt="ParkLink Logo"
                  className="w-full h-full object-cover"
                />
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
              {!isAuthenticated && (
                <li><Link to="/register" className="hover:text-teal-400 transition">Đăng ký tài khoản</Link></li>
              )}
            </ul>
          </div>

          {/* Dành cho Chủ Bãi Đỗ */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm tracking-wide">Dành Cho Chủ Bãi Đỗ</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {!isAuthenticated ? (
                <li><Link to="/register-provider" className="hover:text-teal-400 transition">Đăng ký bãi đỗ xe</Link></li>
              ) : (
                <li className="text-slate-500">Kênh đối tác bãi đỗ xe ParkLink</li>
              )}
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
