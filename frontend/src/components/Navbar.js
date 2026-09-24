import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, LogOut, ShieldCheck, Car, Building2, Menu, X, User } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-semibold">Admin</span>;
      case 'PROVIDER':
        return <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded font-semibold">Chủ bãi đỗ</span>;
      default:
        return null;
    }
  };

  const getDashboardLinkLabel = (roleName) => {
    switch (roleName) {
      case 'ADMIN':
        return 'Trang quản trị';
      case 'PROVIDER':
        return 'Trang quản lý bãi xe';
      default:
        return 'Trang cá nhân';
    }
  };

  const getDashboardIcon = (roleName) => {
    switch (roleName) {
      case 'ADMIN':
        return <ShieldCheck className="w-4 h-4 mr-2.5 text-teal-600" />;
      case 'PROVIDER':
        return <Building2 className="w-4 h-4 mr-2.5 text-teal-600" />;
      default:
        return <User className="w-4 h-4 mr-2.5 text-teal-600" />;
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:bg-teal-700 transition duration-200">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">Park<span className="text-teal-600">Link</span></span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide leading-none uppercase">Thuê Bãi Đỗ Xe Theo Tháng</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-slate-700 hover:text-teal-600 font-medium transition duration-150">
              Trang Chủ
            </Link>
            <Link to="/#search" className="text-slate-700 hover:text-teal-600 font-medium transition duration-150 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-teal-600" /> Tìm Bãi Đỗ
            </Link>
            <Link to="/register-provider" className="text-slate-700 hover:text-teal-600 font-medium transition duration-150 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-600" /> Cho Thuê Bãi Xe
            </Link>
          </div>

          {/* User Auth Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-100 transition duration-150 border border-slate-200"
                >
                  <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-900 leading-tight">
                      {user?.full_name}
                    </div>
                    {getRoleBadge(user?.role?.name) && (
                      <div className="text-xs text-slate-500">
                        {getRoleBadge(user?.role?.name)}
                      </div>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 border border-slate-100 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Đăng nhập với email</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition"
                    >
                      {getDashboardIcon(user?.role?.name)}
                      {getDashboardLinkLabel(user?.role?.name)}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4 mr-2.5" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 text-slate-700 font-semibold hover:text-teal-600 transition"
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-md transition duration-200"
                >
                  Đăng Ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-700 font-medium hover:text-teal-600"
          >
            Trang Chủ
          </Link>
          <Link
            to="/register-provider"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-teal-600 font-medium hover:underline"
          >
            Cho Thuê Bãi Xe (Chủ Bãi Đỗ)
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-700 font-medium"
              >
                {getDashboardLinkLabel(user?.role?.name)} ({user?.full_name})
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 text-red-600 font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold"
              >
                Đăng Nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-teal-600 text-white rounded-xl font-semibold shadow-sm"
              >
                Đăng Ký Khách Hàng
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
