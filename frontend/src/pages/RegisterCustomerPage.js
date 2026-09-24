import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, ArrowRight, CheckCircle2, AlertCircle, Copy, Key, ShieldCheck } from 'lucide-react';

import { cleanText, isValidName, isValidPhone, isValidEmail } from '../utils/validators';

const RegisterCustomerPage = () => {
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
      errs.push('Họ và tên chỉ được chứa chữ cái, tối thiểu 2 ký tự và không chứa số hay ký tự đặc biệt.');
    }

    if (!isValidEmail(cleanedEmail)) {
      errs.push('Email không đúng định dạng (Ví dụ: user@example.com).');
    }

    if (!isValidPhone(cleanedPhone)) {
      errs.push('Số điện thoại phải bao gồm đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0912345678).');
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
        setErrorList([err.message || 'Đăng ký tài khoản thất bại!']);
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Đăng Ký Khách Thuê
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Mật khẩu ngẫu nhiên sẽ được sinh tự động & gửi tới email của bạn
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100 sm:px-10">
          {/* HIỂN THỊ THÔNG BÁO LỖI NẾU CÓ */}
          {errorList.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-800">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span>Vui lòng kiểm tra lại thông tin:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-red-700 pl-1">
                {errorList.map((errItem, idx) => (
                  <li key={idx}>{errItem}</li>
                ))}
              </ul>
            </div>
          )}

          {/* HIỂN THỊ KẾT QUẢ ĐĂNG KÝ THÀNH CÔNG VỚI MẬT KHẨU TẠM */}
          {successResult ? (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-sm space-y-3">
                <div className="flex items-center gap-2 text-teal-700 font-bold">
                  <CheckCircle2 className="w-6 h-6 text-teal-600" />
                  <span>Đăng ký thành công!</span>
                </div>
                <p>Hệ thống đã tạo tài khoản cho <strong>{formData.email}</strong>.</p>
              </div>

              {/* KHỦNG MẬT KHẨU NGẪU NHIÊN DEMO */}
              {successResult.simulatedTempPassword && (
                <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-semibold uppercase">
                    <span className="flex items-center gap-1.5"><Key className="w-4 h-4 text-teal-400" /> Mật khẩu ngẫu nhiên được cấp</span>
                    <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded">Tự động sinh</span>
                  </div>

                  <div className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <span className="text-xl font-mono font-bold tracking-wider text-teal-300">
                      {successResult.simulatedTempPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(successResult.simulatedTempPassword)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
                    >
                      <Copy className="w-3.5 h-3.5" /> {copied ? 'Đã sao chép!' : 'Sao chép'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mật khẩu này đã được gửi qua Email. Bạn hãy dùng mật khẩu này để đăng nhập và đổi mật khẩu mới.
                  </p>
                </div>
              )}

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition duration-200 flex justify-center items-center gap-2"
              >
                Chuyển Đến Trang Đăng Nhập <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Chỉ gồm chữ cái và khoảng trắng giữa các từ.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="0912345678"
                    maxLength={10}
                    className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Gồm đúng 10 chữ số, bắt đầu bằng số 0.</p>
              </div>

              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs text-teal-800 space-y-1">
                  <p className="font-bold">Mật khẩu tự động cấp:</p>
                  <p className="text-teal-700">Mật khẩu ngẫu nhiên sẽ được sinh tự động và gửi qua email. Bạn sẽ đổi mật khẩu riêng sau khi đăng nhập.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Đang khởi tạo tài khoản...' : (
                  <span className="flex items-center gap-2">
                    Đăng Ký Ngay <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-slate-600">
            Bạn đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-teal-600 hover:underline">
              Đăng nhập tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCustomerPage;
