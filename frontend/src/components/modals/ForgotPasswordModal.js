import React, { useState } from 'react';
import { X, Mail, KeyRound, Lock, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, Eye, EyeOff } from 'lucide-react';
import authService from '../../services/authService';
import { isValidPassword } from '../../utils/validators';

const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = '' }) => {
  const [step, setStep] = useState(1); // 1: Yêu cầu OTP, 2: Nhập OTP & Đổi mật khẩu
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  if (!isOpen) return null;

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

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Vui lòng nhập mã OTP gồm đúng 6 chữ số!');
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ cái viết hoa, 1 chữ cái viết thường và 1 chữ số!');
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
        handleClose();
      }, 1800);
    } catch (err) {
      setError(err.errors?.[0] || err.message || 'Xác thực mã OTP thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setSuccessMessage('');
    setSimulatedOtp('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative transform transition-all">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Quên Mật Khẩu</h3>
          <p className="text-slate-400 text-xs mt-1">
            {step === 1
              ? 'Nhập email để nhận mã OTP xác thực đặt lại mật khẩu'
              : 'Nhập mã OTP 6 chữ số vừa nhận được và thiết lập mật khẩu mới'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMessage}</p>
                {simulatedOtp && (
                  <p className="mt-1 font-mono bg-teal-100 text-teal-900 px-2 py-0.5 rounded text-xs inline-block">
                    Mã OTP thử nghiệm: <strong>{simulatedOtp}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ Email đăng ký <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email"
                    className="block w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition disabled:opacity-50"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập 6 chữ số OTP"
                  className="block w-full px-4 py-2.5 text-center tracking-widest font-mono text-lg font-bold border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự, 1 hoa, 1 thường, 1 số"
                    className="block w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="block w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none transition disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
