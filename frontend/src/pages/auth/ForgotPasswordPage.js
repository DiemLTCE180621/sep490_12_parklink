import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import authService from '../../services/authService';
import { isValidPassword } from '../../utils/validators';

// Trang Quên mật khẩu (UC06)
const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Yêu cầu OTP, 2: Nhập OTP & Đổi mật khẩu
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  // Bước 1: Gửi yêu cầu nhận mã OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email || !email.trim()) {
      setError('Vui lòng nhập địa chỉ email!');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.requestPasswordReset(email.trim());
      setSuccessMessage(res.data?.message || 'Mã OTP đã được gửi đến email của bạn!');
      if (res.data?.data?.simulatedOtp) {
        setSimulatedOtp(res.data.data.simulatedOtp);
      }
      setStep(2);
    } catch (err) {
      setError(err.errors?.[0] || err.message || 'Gửi mã OTP thất bại! Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác nhận mã OTP và đổi mật khẩu mới
  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Vui lòng nhập mã OTP gồm đúng 6 chữ số!');
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không trùng khớp!');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyAndResetPassword({
        email: email.trim(),
        otpCode: otpCode.trim(),
        newPassword
      });
      setSuccessMessage(res.data?.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.errors?.[0] || err.message || 'Xác thực mã OTP thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        {/* Header tiêu đề */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 mb-2">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quên Mật Khẩu
          </h2>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            {step === 1
              ? 'Nhập email để nhận mã OTP xác thực đặt lại mật khẩu'
              : 'Nhập mã OTP 6 chữ số vừa nhận được và thiết lập mật khẩu mới'}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-100">
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs sm:text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMessage}</p>
                {simulatedOtp && (
                  <p className="mt-1.5 font-mono bg-teal-100 text-teal-900 px-2 py-0.5 rounded text-xs inline-block">
                    Mã OTP thử nghiệm: <strong>{simulatedOtp}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Địa chỉ Email đăng ký <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn"
                    className="block w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Thông tin hướng dẫn ngắn */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Hệ thống sẽ gửi mã xác thực OTP gồm 6 chữ số có hiệu lực trong 15 phút đến email này.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang gửi mã...
                  </>
                ) : (
                  <>
                    Gửi Mã OTP Qua Email <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mã OTP 6 chữ số <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="block w-full px-4 py-3 text-center tracking-[0.4em] font-mono text-xl font-bold border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự, 1 hoa, 1 thường, 1 số"
                    className="block w-full pl-10 pr-11 py-3 text-sm border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="block w-full pl-10 pr-11 py-3 text-sm border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Gửi lại mã
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-teal-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
