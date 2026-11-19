import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import chatService from '../../services/chatService';
import { LogOut, ShieldCheck, Car, Building2, Menu, X, User, MessageCircle, FileText, Heart, AlertCircle } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { t } = useTranslation('common');
  const { user, token, isAuthenticated, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [navAvatarFailed, setNavAvatarFailed] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded font-semibold">{t('roles.ADMIN')}</span>;
      case 'PROVIDER':
        return <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded font-semibold">{t('roles.PROVIDER')}</span>;
      case 'FIELD_INSPECTOR':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-semibold">{t('roles.FIELD_INSPECTOR')}</span>;
      default:
        return null;
    }
  };

  const getDashboardLinkLabel = (roleName) => {
    switch (roleName) {
      case 'ADMIN':
        return t('dashboardLinks.ADMIN');
      case 'PROVIDER':
        return t('dashboardLinks.PROVIDER');
      case 'FIELD_INSPECTOR':
        return t('dashboardLinks.FIELD_INSPECTOR');
      default:
        return t('dashboardLinks.DEFAULT');
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

  const userRole = user?.role?.name || user?.role;
  const canAccessChat = isAuthenticated && (
    userRole === 'PROVIDER' ||
    userRole === 'CUSTOMER'
  );

  const syncUnreadCount = useCallback(() => {
    if (!isAuthenticated || !token || !canAccessChat) {
      setUnreadChatCount(0);
      return;
    }

    chatService.getUnreadCount(token).then((res) => {
      if (res?.success) {
        setUnreadChatCount(res.count || 0);
      }
    }).catch(() => { });
  }, [isAuthenticated, token, canAccessChat]);

  // Đồng bộ ban đầu và mỗi khi chuyển trang
  useEffect(() => {
    syncUnreadCount();
  }, [syncUnreadCount, location.pathname]);

  // Tự động đồng bộ lại ngay khi người dùng bấm/chuyển tab trình duyệt quay lại
  useEffect(() => {
    window.addEventListener('focus', syncUnreadCount);
    return () => {
      window.removeEventListener('focus', syncUnreadCount);
    };
  }, [syncUnreadCount]);

  useEffect(() => {
    if (!socket || !canAccessChat) return;

    const handleUnreadCount = (count) => {
      setUnreadChatCount(typeof count === 'number' ? count : 0);
    };

    socket.on('unread_chat_count', handleUnreadCount);

    return () => {
      socket.off('unread_chat_count', handleUnreadCount);
    };
  }, [socket, canAccessChat]);

  // Ẩn Navbar (Header) đối với Admin, Nhân viên khảo sát hoặc người dùng đang cần đổi mật khẩu lần đầu
  if (isAuthenticated && (user?.role?.name === 'ADMIN' || user?.role?.name === 'FIELD_INSPECTOR' || user?.requires_password_change)) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-20 items-center">
          {/* Logo & Brand */}
          <Link to={isAuthenticated && user?.role?.name === "PROVIDER" ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:bg-teal-700 transition duration-200">
              <img
                src="/Logo.png"
                alt="ParkLink Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">Park<span className="text-teal-600">Link</span></span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide leading-none uppercase">{t('app.tagline')}</p>
            </div>
          </Link>

          <div className="hidden md:flex md:absolute md:left-1/2 md:-translate-x-1/2 items-center md:space-x-5 lg:space-x-8 whitespace-nowrap">
            <Link to="/" className="text-slate-700 hover:text-teal-600 font-medium transition duration-150">
              {t('nav.home')}
            </Link>
            <Link to="/search" className="text-slate-700 hover:text-teal-600 font-medium transition duration-150 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-teal-600" /> {t('nav.search')}
            </Link>
            {isAuthenticated && user?.role?.name === 'CUSTOMER' && (
              <>
                <Link to="/my-reservations" className="text-slate-700 hover:text-teal-600 font-medium transition duration-150 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-teal-600" /> {t('nav.myReservations')}
                </Link>
                <Link to="/my-contracts" className="text-slate-700 hover:text-teal-600 font-medium transition duration-150 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" /> {t('nav.myContracts')}
                </Link>
              </>
            )}
            {!isAuthenticated && (
              <Link to="/register-provider" className="text-slate-700 hover:text-teal-600 font-medium transition duration-150 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-teal-600" /> {t('nav.becomeProvider')}
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher className="w-[64px] justify-center shrink-0" />
            {isAuthenticated ? (
              <>
                {canAccessChat && (
                  <Link
                    to="/chat"
                    className="relative p-2.5 rounded-xl text-teal-600 hover:bg-teal-50 hover:text-teal-700 transition duration-150 focus:outline-none"
                    title={t('nav.messages')}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {unreadChatCount > 0 && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-sm pointer-events-none animate-scaleIn">
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Quả chuông thông báo */}
                <NotificationDropdown />

                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-100 transition duration-150 border border-slate-200"
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm overflow-hidden border border-teal-500/30 shrink-0">
                      {user?.avatar_url && !navAvatarFailed ? (
                        <img
                          src={user.avatar_url}
                          alt={user?.full_name || 'User'}
                          referrerPolicy="no-referrer"
                          onError={() => setNavAvatarFailed(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className={`text-left ${getRoleBadge(user?.role?.name) ? 'min-w-[104px]' : ''}`}>
                      <div className="text-sm font-semibold text-slate-900 leading-tight whitespace-nowrap">
                        {user?.full_name}
                      </div>
                      {getRoleBadge(user?.role?.name) && (
                        <div className="text-xs text-slate-500 whitespace-nowrap">
                          {getRoleBadge(user?.role?.name)}
                        </div>
                      )}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 border border-slate-100 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-xs text-slate-400">{t('nav.signedInWith')}</p>
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

                      {user?.role?.name === 'CUSTOMER' && (
                        <>
                          <Link
                            to="/my-favorites"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition"
                          >
                            <Heart className="w-4 h-4 mr-2.5 text-rose-500" /> {t('nav.myFavorites')}
                          </Link>
                          <Link
                            to="/my-complaints"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition"
                          >
                            <AlertCircle className="w-4 h-4 mr-2.5 text-amber-500" /> {t('nav.myComplaints')}
                          </Link>
                        </>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4 mr-2.5" /> {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-[116px] text-center px-3 py-2.5 text-slate-700 font-semibold hover:text-teal-600 transition whitespace-nowrap"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="w-[112px] text-center px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-md transition duration-200 whitespace-nowrap"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-1 sm:space-x-2">
            <LanguageSwitcher className="w-[58px] justify-center shrink-0" />
            {isAuthenticated && (
              <>
                {canAccessChat && (
                  <Link
                    to="/chat"
                    className="relative p-2 rounded-xl text-teal-600 hover:bg-teal-50 hover:text-teal-700 transition duration-150 focus:outline-none"
                    title={t('nav.messages')}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {unreadChatCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full h-3.5 min-w-[14px] px-0.5 flex items-center justify-center shadow-sm pointer-events-none animate-scaleIn">
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </span>
                    )}
                  </Link>
                )}

                <NotificationDropdown />
              </>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-700 font-medium hover:text-teal-600"
          >
            {t('nav.home')}
          </Link>
          {!isAuthenticated && (
            <Link
              to="/register-provider"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-teal-600 font-medium hover:underline"
            >
              {t('nav.becomeProviderMobile')}
            </Link>
          )}
          {isAuthenticated ? (
            <>
              {canAccessChat && (
                <Link
                  to="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-slate-700 font-medium hover:text-teal-600 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-teal-600" /> {t('nav.messages')}
                  </span>
                  {unreadChatCount > 0 && (
                    <span className="bg-rose-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-sm">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </Link>
              )}
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-700 font-medium"
              >
                {getDashboardLinkLabel(user?.role?.name)} ({user?.full_name})
              </Link>
              {user?.role?.name === 'CUSTOMER' && (
                <Link
                  to="/my-favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-slate-700 font-medium hover:text-teal-600 flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 text-rose-500" /> {t('nav.myFavorites')}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 text-red-600 font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> {t('nav.logout')}
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-teal-600 text-white rounded-xl font-semibold shadow-sm"
              >
                {t('nav.registerCustomer')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
