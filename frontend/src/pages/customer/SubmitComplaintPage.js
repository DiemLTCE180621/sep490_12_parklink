import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Send, ArrowLeft, Car, Building2, CheckCircle2, ImagePlus, X } from 'lucide-react';
import complaintService from '../../services/complaintService';
import uploadService from '../../services/uploadService';
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
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

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

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles
      .filter(file => file.type.startsWith('image/') && file.size <= 50 * 1024 * 1024)
      .slice(0, 5 - imageFiles.length);

    if (validFiles.length !== selectedFiles.length) {
      setErrorMsg('Chỉ nhận ảnh, tối đa 5 ảnh và mỗi ảnh không quá 50MB.');
    }

    setImageFiles(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...validFiles.map(file => URL.createObjectURL(file))]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, itemIndex) => itemIndex !== index));
    setImagePreviews(prev => prev.filter((_, itemIndex) => itemIndex !== index));
  };

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
      let image_urls = [];
      if (imageFiles.length > 0) {
        const uploadResult = await uploadService.uploadFiles(imageFiles, 'complaints');
        image_urls = uploadResult?.data?.mediaUrls || [];
      }

      await complaintService.submitComplaint({
        reservation_id: parseInt(reservationId),
        title: title.trim(),
        description: description.trim(),
        image_urls
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
    <div className="min-h-screen bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto w-full max-w-4xl">
      {/* PAGE HEADER */}
      <div className="overflow-hidden rounded-t-2xl border border-b-0 border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-4 py-3 text-white shadow-sm sm:px-5">
        <div className="flex w-full items-center gap-3 sm:gap-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-teal-500/30 px-3 py-2 text-sm font-medium text-teal-300 transition-all hover:border-teal-400 hover:bg-white/5 hover:text-teal-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Quay lại</span>
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 shadow-lg">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold sm:text-xl">Gửi Khiếu Nại</h1>
              <p className="truncate text-xs font-medium text-teal-300 sm:text-sm">
                Báo cáo vấn đề liên quan đến bãi đỗ xe hoặc dịch vụ
              </p>
            </div>
          </div>
        </div>
      </div>

        <div className="w-full rounded-b-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="font-medium text-sm">{errorMsg}</span>
                </div>
              )}

              {reservation && (
                <div className="pb-3 border-b border-slate-200">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Thông tin yêu cầu</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-teal-600" />
                      <span className="font-bold text-slate-900">{reservation.facility?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <Car className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="text-sm text-slate-700">Mã thuê: #{reservation.id} - Xe: {reservation.vehicle_info}</span>
                    </div>
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
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium resize-none"
                    required
                  />
                  <div className="text-right mt-1">
                    <span className={`text-xs font-medium ${description.length < 20 ? 'text-red-500' : 'text-slate-400'}`}>
                      {description.length} ký tự (Tối thiểu 20)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Ảnh minh chứng <span className="text-slate-400 font-normal">(tối đa 5 ảnh)</span>
                  </label>
                  <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-teal-500 hover:text-teal-700">
                    <ImagePlus className="h-5 w-5" />
                    Chọn ảnh
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                      disabled={imageFiles.length >= 5}
                    />
                  </label>

                  {imagePreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {imagePreviews.map((preview, index) => (
                        <div key={preview} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                          <img src={preview} alt={`Ảnh khiếu nại ${index + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white hover:bg-red-600"
                            aria-label="Xóa ảnh"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
