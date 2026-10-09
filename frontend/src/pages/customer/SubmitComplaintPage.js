import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Send, ArrowLeft, Car, Building2, CheckCircle2 } from 'lucide-react';
import complaintService from '../../services/complaintService';
import { validateSubmitComplaint } from '../../validations/complaintValidation';
import { getMyReservations } from '../../services/reservationService';

const SubmitComplaintPage = () => {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  
  const [reservation, setReservation] = useState(null);
  const [loadingRes, setLoadingRes] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await getMyReservations();
        const list = res.data?.reservations || res.reservations || [];
        const found = list.find(r => r.id === parseInt(reservationId));
        if (found) {
          if (found.status === 'PENDING' || found.status === 'REJECTED' || found.status === 'CANCELLED') {
            setErrorMsg('Yêu cầu thuê này không đủ điều kiện để khiếu nại.');
          } else {
            setReservation(found);
          }
        } else {
          setErrorMsg('Không tìm thấy yêu cầu thuê này.');
        }
      } catch (err) {
        setErrorMsg('Lỗi tải dữ liệu yêu cầu thuê.');
      } finally {
        setLoadingRes(false);
      }
    };
    fetchReservation();
  }, [reservationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const validation = validateSubmitComplaint({ title, description });
    if (!validation.isValid) {
      setErrorMsg(validation.errors.title || validation.errors.description);
      return;
    }

    setLoading(true);
    try {
      await complaintService.submitComplaint({
        reservation_id: parseInt(reservationId),
        title: title.trim(),
        description: description.trim()
      });
      setSuccessMsg('Gửi khiếu nại thành công! Quản trị viên sẽ sớm xem xét.');
      setTimeout(() => {
        navigate('/my-complaints');
      }, 2000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRes) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* WELCOME BANNER FULL WIDTH */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-6 sm:px-12 py-10 text-white shadow-xl mb-8">
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium text-sm transition-all self-start hover:bg-white/5 px-4 py-2 rounded-full border border-teal-500/30 hover:border-teal-400 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Quay Lại
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Gửi Khiếu Nại</h1>
              <p className="text-teal-300 text-sm font-medium mt-1">Báo cáo vấn đề liên quan đến bãi đỗ xe hoặc dịch vụ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 w-full mx-auto">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm w-full">
          {successMsg ? (
            <div className="py-10 text-center animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Thành Công!</h3>
              <p className="text-slate-600 mb-6">{successMsg}</p>
              <Link
                to="/my-complaints"
                className="inline-flex px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-md"
              >
                Xem Danh Sách Khiếu Nại
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="font-medium text-sm">{errorMsg}</span>
                </div>
              )}

              {reservation && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin yêu cầu</h3>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-slate-900">{reservation.facility?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700 text-sm">Mã thuê: #{reservation.id} - Xe: {reservation.vehicle_info}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Tiêu đề vấn đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Thu phí sai quy định..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Mô tả chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả rõ sự việc xảy ra..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium resize-none"
                    required
                  />
                  <div className="text-right mt-1">
                    <span className={`text-xs font-medium ${description.length < 20 ? 'text-red-500' : 'text-slate-400'}`}>
                      {description.length} ký tự (Tối thiểu 20)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !reservation || errorMsg.includes('không đủ điều kiện')}
                  className="flex-[2] px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Gửi Khiếu Nại
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

export default SubmitComplaintPage;
