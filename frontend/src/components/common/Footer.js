import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const Footer = () => {
  const { t } = useTranslation('common');
  const { user, isAuthenticated } = useAuth();
  const [adminPhone, setAdminPhone] = useState(null);

  const roleName = user?.role?.name || user?.role;

  useEffect(() => {
    if (roleName === 'ADMIN' && user?.phone_number && user.phone_number !== '0900000000') {
      setAdminPhone(user.phone_number);
      return;
    }

    const fetchContact = async () => {
      try {
        const res = await authService.getContactInfo();
        const data = res?.data?.data || res?.data;
        if (data?.phone_number && data.phone_number !== '0900000000' && data.phone_number.length >= 9) {
          setAdminPhone(data.phone_number);
        }
      } catch (err) {}
    };

    fetchContact();
  }, [roleName, user?.phone_number]);

  const displayPhone =
    roleName === 'ADMIN' && user?.phone_number && user.phone_number !== '0900000000'
      ? user.phone_number
      : adminPhone;

  if (isAuthenticated && roleName === 'ADMIN') {
    return (
      <footer className="bg-gray-900 text-gray-400 py-4 border-t border-gray-800 text-center text-xs">
        <p>{t('footer.copyright')}</p>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="space-y-2.5">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-neighbor-600 text-white flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="ParkLink Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Park<span className="text-neighbor-400">Link</span>
                </span>
                <span className="block text-[10px] font-medium text-gray-400 tracking-wider uppercase">
                  {t('app.tagline')}
                </span>
              </div>
            </Link>

            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.guestTagline')}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-3">
              {t('footer.forCustomersTitle')}
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <Link
                  to="/search"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.findParkingNearby')}
                </Link>
              </li>
              <li>
                <Link
                  to="/policies/customer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.customerPolicyLink')}
                </Link>
              </li>
              {isAuthenticated && roleName === 'CUSTOMER' && (
                <>
                  <li>
                    <Link
                      to="/my-reservations"
                      className="hover:text-white transition-colors"
                    >
                      {t('nav.myReservations')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/my-contracts"
                      className="hover:text-white transition-colors"
                    >
                      {t('nav.myContracts')}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-3">
              {t('footer.forProvidersTitle')}
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              {isAuthenticated && roleName === 'PROVIDER' && (
                <li>
                  <Link
                    to="/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    {t('dashboardLinks.PROVIDER')}
                  </Link>
                </li>
              )}
              {!isAuthenticated && (
                <li>
                  <Link
                    to="/register-provider"
                    className="hover:text-white transition-colors"
                  >
                    {t('footer.registerYard')}
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/policies/provider"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.providerPolicyLink')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-3">
              {t('footer.supportAndContactTitle')}
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <a
                  href="mailto:parklink.service@gmail.com"
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>parklink.service@gmail.com</span>
                </a>
              </li>
              {displayPhone && (
                <li>
                  <a
                    href={`tel:${displayPhone}`}
                    className="hover:text-white transition-colors inline-flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{displayPhone}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>{t('footer.copyright')}</p>
          <Link
            to="/policies"
            className="hover:text-white transition-colors"
          >
            {t('footer.footerPolicyLink')}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
