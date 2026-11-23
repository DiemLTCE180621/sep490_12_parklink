import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, ArrowRight, CheckCircle2, AlertCircle, Copy, Key, ShieldCheck } from 'lucide-react';
import PolicyDetailModal from '../../components/modals/PolicyDetailModal';
import { cleanText, isValidName, isValidPhone, isValidEmail } from '../../utils/validators';

const RegisterCustomerPage = () => {
  const { t } = useTranslation('register');
  const { registerCustomer } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });

  const [errorList, setErrorList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [agreedPolicy, setAgreedPolicy] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorList.length > 0) setErrorList([]);
  };

  const validateForm = () => {
    const errs = [];
    const cleanedName = cleanText(formData.full_name);
    const cleanedPhone = formData.phone_number.trim();
    const cleanedEmail = formData.email.trim();

    if (!isValidName(cleanedName)) {
      errs.push(t('customer.errors.fullNameInvalid'));
    }

    if (!isValidEmail(cleanedEmail)) {
      errs.push(t('customer.errors.emailInvalid'));
    }

    if (!isValidPhone(cleanedPhone)) {
      errs.push(t('customer.errors.phoneInvalid'));
    }

    if (!agreedPolicy) {
      errs.push(t('customer.errors.policyRequired'));
    }

    return { isValid: errs.length === 0, errs, cleanedName, cleanedEmail, cleanedPhone };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorList([]);

    const { isValid, errs, cleanedName, cleanedEmail, cleanedPhone } = validateForm();
    if (!isValid) {
      setErrorList(errs);
      return;
    }

    try {
      setLoading(true);
      const res = await registerCustomer({
        full_name: cleanedName,
        email: cleanedEmail,
        phone_number: cleanedPhone
      });

      setSuccessResult(res?.data);
    } catch (err) {
      if (err.errors && err.errors.length > 0) {
        setErrorList(err.errors);
      } else {
        setErrorList([err.message || t('customer.errors.submitFailed')]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = (pwd) => {
    navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-2xl w-full p-8 sm:p-10">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-neighbor-50 text-neighbor-700 flex items-center justify-center mx-auto mb-3 border border-neighbor-100 shadow-xs">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t('customer.title')}
          </h2>
        </div>

        {errorList.length > 0 && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              {errorList.length === 1 ? (
                <p className="font-semibold text-red-700 leading-relaxed">
                  {errorList[0]}
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="font-bold text-red-800">{t('customer.errorSummary')}</p>
                  <ul className="space-y-0.5 text-red-700">
                    {errorList.map((errItem, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{errItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {successResult ? (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-neighbor-50 border border-neighbor-200 text-neighbor-900 text-xs space-y-2">
              <div className="flex items-center gap-2 text-neighbor-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-neighbor-600 shrink-0" />
                <span>{t('customer.success.title')}</span>
              </div>
              <p>{t('customer.success.descriptionBeforeEmail')}<strong>{formData.email}</strong>{t('customer.success.descriptionAfterEmail')}</p>
            </div>

            {successResult.simulatedTempPassword && (
              <div className="p-4 bg-gray-900 text-white rounded-xl space-y-2.5 shadow-xs">
                <div className="flex justify-between items-center text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-neighbor-400" /> {t('customer.success.tempPasswordLabel')}</span>
                  <span className="bg-neighbor-500/20 text-neighbor-300 px-2 py-0.5 rounded text-[10px]">{t('customer.success.autoGeneratedBadge')}</span>
                </div>

                <div className="flex justify-between items-center bg-gray-800 p-2.5 rounded-lg border border-gray-700">
                  <span className="text-lg font-mono font-bold tracking-wider text-neighbor-300">
                    {successResult.simulatedTempPassword}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPassword(successResult.simulatedTempPassword)}
                    className="px-2.5 py-1 bg-neighbor-600 hover:bg-neighbor-500 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copied ? t('customer.success.copied') : t('customer.success.copy')}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  {t('customer.success.tempPasswordHint')}
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white font-bold text-base rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {t('customer.success.cta')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('customer.fields.fullName.label')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder={t('customer.fields.fullName.placeholder')}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{t('customer.fields.fullName.hint')}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('customer.fields.phone.label')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder={t('customer.fields.phone.placeholder')}
                    maxLength={10}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{t('customer.fields.phone.hint')}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('customer.fields.email.label')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('customer.fields.email.placeholder')}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-neighbor-500 focus:border-neighbor-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="p-3.5 bg-neighbor-50/70 rounded-xl border border-neighbor-100 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-neighbor-600 shrink-0 mt-0.5" />
              <div className="text-sm text-neighbor-800 space-y-0.5">
                <p className="font-bold">{t('customer.autoPasswordNotice.title')}</p>
                <p className="text-neighbor-700 leading-relaxed">{t('customer.autoPasswordNotice.description')}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="agreePolicyCustomer"
                type="checkbox"
                checked={agreedPolicy}
                onChange={(e) => {
                  setAgreedPolicy(e.target.checked);
                  if (errorList.length > 0) setErrorList([]);
                }}
                className="w-4 h-4 mt-0.5 text-neighbor-600 rounded border-gray-300 focus:ring-neighbor-500 cursor-pointer"
              />
              <label htmlFor="agreePolicyCustomer" className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none">
                {t('customer.policy.agree')}{' '}
                <button
                  type="button"
                  onClick={() => setPolicyModalOpen(true)}
                  className="text-neighbor-700 font-bold hover:underline cursor-pointer"
                >
                  {t('customer.policy.linkText')}
                </button>{t('customer.policy.suffix')} <span className="text-red-500">*</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-neighbor-600 hover:bg-neighbor-700 active:bg-neighbor-800 text-white font-bold text-base rounded-lg shadow-xs transition-colors flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? t('customer.submitting') : (
                <>
                  {t('customer.submit')} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
          {t('customer.loginPrompt')}{' '}
          <Link to="/login" className="font-semibold text-neighbor-700 hover:text-neighbor-800 hover:underline transition-colors">
            {t('customer.loginLink')}
          </Link>
        </div>
      </div>

      <PolicyDetailModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        policyType="CUSTOMER"
      />
    </div>
  );
};

export default RegisterCustomerPage;
