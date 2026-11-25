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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'ADMIN':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2 py-0.5 rounded-md font-semibold">
            {t('roles.ADMIN')}
          </span>
        );
      case 'PROVIDER':
        return (
          <span className="bg-neighbor-50 text-neighbor-700 border border-neighbor-200 text-xs px-2 py-0.5 rounded-md font-semibold">
            {t('roles.PROVIDER')}
          </span>
        );
      case 'FIELD_INSPECTOR':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-md font-semibold">
            {t('roles.FIELD_INSPECTOR')}
          </span>
        );
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
        return <ShieldCheck className="w-4 h-4 mr-2.5 text-neighbor-600" />;
      case 'PROVIDER':
        return <Building2 className="w-4 h-4 mr-2.5 text-neighbor-600" />;
      default:
        return <User className="w-4 h-4 mr-2.5 text-neighbor-600" />;
    }
  };

  const userRole = user?.role?.name || user?.role;
  const canAccessChat = isAuthenticated && (userRole === 'PROVIDER' || userRole === 'CUSTOMER');

  const syncUnreadCount = useCallback(() => {
    if (!isAuthenticated || !token || !canAccessChat) {
      setUnreadChatCount(0);
      return;
    }

    chatService
      .getUnreadCount(token)
      .then((res) => {
        if (res?.success) {
          setUnreadChatCount(res.count || 0);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, token, canAccessChat]);

  useEffect(() => {
    syncUnreadCount();
  }, [syncUnreadCount, location.pathname]);

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

  if (user?.requires_password_change) {
    return (
      <nav
        className={`border-b sticky top-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-gray-200/90'
            : 'bg-white shadow-xs border-gray-200'
        }`}
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-neighbor-600 text-white flex items-center justify-center shadow-xs">
                <img
                  src="/Logo.png"
                  alt="ParkLink Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Park<span className="text-neighbor-600">Link</span>
                </span>
                <p className="text-xs text-gray-500 font-semibold tracking-wider leading-none uppercase mt-0.5">
                  {t('app.tagline')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <LanguageSwitcher className="w-[74px] justify-center shrink-0" />
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (
    isAuthenticated &&
    (user?.role?.name === 'ADMIN' || user?.role?.name === 'FIELD_INSPECTOR')
  ) {
    return null;
  }

  return (
    <nav
      className={`border-b sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-gray-200/90'
          : 'bg-white shadow-xs border-gray-200'
      }`}
    >
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-16 sm:h-20 items-center">
          <Link
            to={isAuthenticated && user?.role?.name !== 'CUSTOMER' ? '/dashboard' : '/'}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-neighbor-600 text-white flex items-center justify-center shadow-xs group-hover:bg-neighbor-700 transition duration-150">
              <img
                src="/Logo.png"
                alt="ParkLink Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Park<span className="text-neighbor-600">Link</span>
              </span>
              <p className="text-xs text-gray-500 font-semibold tracking-wider leading-none uppercase mt-0.5">
                {t('app.tagline')}
              </p>
            </div>
          </Link>

          <div className="hidden md:flex md:absolute md:left-1/2 md:-translate-x-1/2 items-center md:space-x-5 lg:space-x-8 whitespace-nowrap">
            {(!isAuthenticated || user?.role?.name === 'CUSTOMER') && (
              <>
                <Link
                  to="/"
                  className="text-gray-800 hover:text-neighbor-600 text-base font-semibold transition duration-150"
                >
                  {t('nav.home')}
                </Link>
                <Link
                  to="/search"
                  className="text-gray-800 hover:text-neighbor-600 text-base font-semibold transition duration-150 flex items-center gap-1.5"
                >
                  <Car className="w-5 h-5 text-neighbor-600" /> {t('nav.search')}
                </Link>
              </>
            )}
            {isAuthenticated && user?.role?.name === 'CUSTOMER' && (
              <>
                <Link
                  to="/my-reservations"
                  className="text-gray-800 hover:text-neighbor-600 text-base font-semibold transition duration-150 flex items-center gap-1.5"
                >
                  <Car className="w-5 h-5 text-neighbor-600" /> {t('nav.myReservations')}
                </Link>
                <Link
                  to="/my-contracts"
                  className="text-gray-800 hover:text-neighbor-600 text-base font-semibold transition duration-150 flex items-center gap-1.5"
                >
                  <FileText className="w-5 h-5 text-neighbor-600" /> {t('nav.myContracts')}
                </Link>
              </>
            )}
            {!isAuthenticated && (
              <Link
                to="/register-provider"
                className="text-gray-800 hover:text-neighbor-600 text-base font-semibold transition duration-150 flex items-center gap-1.5"
              >
                <Building2 className="w-5 h-5 text-neighbor-600" /> {t('nav.becomeProvider')}
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher className="w-[74px] justify-center shrink-0" />
            {isAuthenticated ? (
              <>
                {canAccessChat && (
                  <Link
                    to="/chat"
                    className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-neighbor-600 transition duration-150 focus:outline-hidden"
                    title={t('nav.messages')}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {unreadChatCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs pointer-events-none">
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </span>
                    )}
                  </Link>
                )}

                <NotificationDropdown />

                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-gray-50 transition duration-150 border border-gray-200 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-neighbor-600 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden shrink-0">
                      {user?.avatar_url && !navAvatarFailed ? (
                        <img
                          src={user.avatar_url}
                          alt={user?.full_name || 'User'}
                          referrerPolicy="no-referrer"
                          onError={() => setNavAvatarFailed(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : user?.full_name ? (
                        user.full_name.charAt(0).toUpperCase()
                      ) : (
                        'U'
                      )}
                    </div>
                    <div className={`text-left ${getRoleBadge(user?.role?.name) ? 'min-w-[100px]' : ''}`}>
                      <div className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[130px]">
                        {user?.full_name}
                      </div>
                      {getRoleBadge(user?.role?.name) && (
                        <div className="text-xs mt-0.5 whitespace-nowrap">
                          {getRoleBadge(user?.role?.name)}
                        </div>
                      )}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-1.5 border border-gray-100 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-[11px] text-gray-400">{t('nav.signedInWith')}</p>
                        <p className="text-xs font-medium text-gray-900 truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-neighbor-50 hover:text-neighbor-700 transition"
                      >
                        {getDashboardIcon(user?.role?.name)}
                        {getDashboardLinkLabel(user?.role?.name)}
                      </Link>

                      {user?.role?.name === 'CUSTOMER' && (
                        <>
                          <Link
                            to="/my-favorites"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-neighbor-50 hover:text-neighbor-700 transition"
                          >
                            <Heart className="w-4 h-4 mr-2.5 text-rose-500" /> {t('nav.myFavorites')}
                          </Link>
                          <Link
                            to="/my-complaints"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-neighbor-50 hover:text-neighbor-700 transition"
                          >
                            <AlertCircle className="w-4 h-4 mr-2.5 text-amber-500" /> {t('nav.myComplaints')}
                          </Link>
                        </>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2.5" /> {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2.5 text-base text-gray-800 font-semibold hover:text-neighbor-600 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white text-base font-bold rounded-xl shadow-xs transition-colors duration-150"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-1 sm:space-x-2">
            <LanguageSwitcher className="w-[58px] justify-center shrink-0" />
            {isAuthenticated && (
              <>
                {canAccessChat && (
                  <Link
                    to="/chat"
                    className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-neighbor-600 transition duration-150"
                    title={t('nav.messages')}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {unreadChatCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full h-3.5 min-w-[14px] px-0.5 flex items-center justify-center shadow-xs pointer-events-none">
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
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-5 space-y-2">
          {(!isAuthenticated || user?.role?.name === 'CUSTOMER') && (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-gray-800 font-semibold hover:text-neighbor-600 text-base"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-gray-800 font-semibold hover:text-neighbor-600 text-base"
              >
                {t('nav.search')}
              </Link>
            </>
          )}
          {!isAuthenticated && (
            <Link
              to="/register-provider"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-neighbor-600 font-semibold text-base hover:underline"
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
                  className="py-2.5 text-gray-800 font-semibold hover:text-neighbor-600 flex items-center justify-between text-base"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-neighbor-600" /> {t('nav.messages')}
                  </span>
                  {unreadChatCount > 0 && (
                    <span className="bg-rose-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-xs">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  )}
                </Link>
              )}
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-gray-800 font-semibold text-base"
              >
                {getDashboardLinkLabel(user?.role?.name)} ({user?.full_name})
              </Link>
              {user?.role?.name === 'CUSTOMER' && (
                <>
                  <Link
                    to="/my-reservations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-gray-800 font-semibold hover:text-neighbor-600 flex items-center gap-2 text-base"
                  >
                    <Car className="w-5 h-5 text-neighbor-600" /> {t('nav.myReservations')}
                  </Link>
                  <Link
                    to="/my-contracts"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-gray-800 font-semibold hover:text-neighbor-600 flex items-center gap-2 text-base"
                  >
                    <FileText className="w-5 h-5 text-neighbor-600" /> {t('nav.myContracts')}
                  </Link>
                  <Link
                    to="/my-favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-gray-800 font-semibold hover:text-neighbor-600 flex items-center gap-2 text-base"
                  >
                    <Heart className="w-4 h-4 text-rose-500" /> {t('nav.myFavorites')}
                  </Link>
                  <Link
                    to="/my-complaints"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-gray-800 font-semibold hover:text-neighbor-600 flex items-center gap-2 text-base"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-500" /> {t('nav.myComplaints')}
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left py-2.5 text-rose-600 font-semibold flex items-center gap-2 text-base cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> {t('nav.logout')}
              </button>
            </>
          ) : (
            <div className="pt-3 border-t border-gray-100 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 border border-gray-300 rounded-xl text-gray-800 font-semibold text-base"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-neighbor-600 text-white rounded-xl font-bold text-base shadow-xs"
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
