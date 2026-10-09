import React, { useState } from 'react';
import { X, AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import complaintService from '../../services/complaintService';
import { validateSubmitComplaint } from '../../validations/complaintValidation';

const SubmitComplaintModal = ({ isOpen, onClose, facilityId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const validation = validateSubmitComplaint({ title, description });
    if (!validation.isValid) {
      setErrorMsg(validation.errors.title || validation.errors.description);
      return;
    }

    setLoading(true);
    try {
      await complaintService.submitComplaint({
        facility_id: facilityId,
        title: title.trim(),
        description: description.trim()
      });
      setSuccessMsg('Gửi khiếu nại thành công! Admin sẽ sớm xem xét và giải quyết.');
      setTimeout(() => {
        onClose();
        setTitle('');
        setDescription('');
        setSuccessMsg('');
      }, 2000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
      if (error.response?.data?.errors) {
        setErrorMsg(error.response.data.errors.join(', '));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={20} className="stroke-2" />
            <h3 className="text-lg font-bold text-slate-800">Gửi khiếu nại</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6">
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Thành công!</h4>
              <p className="text-slate-600">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-slate-500 mb-4">
                Nếu bạn gặp vấn đề với bãi đỗ xe (thái độ nhân viên, thu phí sai, làm hỏng tài sản...), hãy gửi khiếu nại để Admin can thiệp.
              </p>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tiêu đề vấn đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Bãi giữ xe thu lố tiền quy định"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mô tả chi tiết sự việc <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả rõ ngày giờ, sự việc xảy ra như thế nào để Admin dễ dàng điều tra..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 resize-none"
                  required
                />
                <div className="text-right mt-1">
                  <span className={`text-xs ${description.length < 20 ? 'text-red-500' : 'text-slate-400'}`}>
                    {description.length}/2000 ký tự (Tối thiểu 20)
                  </span>
                </div>
              </div>

              {/* FOOTER */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-xl transition-all shadow-sm shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Gửi khiếu nại</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitComplaintModal;
