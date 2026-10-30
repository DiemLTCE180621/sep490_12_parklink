import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Send, ArrowLeft, Car, Building2, CheckCircle2, ImagePlus, X, Info } from 'lucide-react';
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
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');
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
    setTitleError('');
    setDescError('');

    const validation = validateSubmitComplaint({ title, description });
    if (!validation.isValid) {
      if (validation.errors.title) {
        setTitleError(validation.errors.title);
      }
      if (validation.errors.description) {
        setDescError(validation.errors.description);
      }
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
      <div className="py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 px-4 pt-6 pb-2 sm:px-6 sm:pt-8 sm:pb-3">
      <div className="mx-auto w-full max-w-3xl">
        {/* PAGE HEADER */}
        <div className="overflow-hidden rounded-t-2xl border border-b-0 border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-5 py-2 text-white shadow-sm sm:px-6 sm:py-2.5">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 shadow-md">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-extrabold leading-tight sm:text-lg">Gửi Khiếu Nại</h1>
                <p className="truncate text-xs text-teal-300">
                  Báo cáo vấn đề liên quan đến bãi đỗ xe hoặc dịch vụ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-500/30 px-2.5 py-1 text-xs font-semibold text-teal-300 transition-all hover:border-teal-400 hover:bg-white/5 hover:text-teal-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div className="w-full rounded-b-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
          {successMsg ? (
            <div className="py-8 text-center animate-in fade-in zoom-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Thành Công!</h3>
              <p className="text-sm text-slate-600 mb-5">{successMsg}</p>
              <Link
                to="/my-complaints"
                className="inline-flex px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
              >
                Xem Danh Sách Khiếu Nại
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* THÔNG TIN YÊU CẦU: XUỐNG HÀNG THÔNG TIN XE KHÔNG BỊ TRÀN */}
              {reservation && (
                <div className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs sm:text-sm space-y-1.5">
                  {/* Hàng 1: Bãi xe & Mã đơn */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Bãi xe:</span>
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                      <span className="font-bold text-slate-900 truncate">{reservation.facility?.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-slate-600">
                      <span className="text-slate-400 text-xs">Mã thuê:</span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                        #{reservation.id}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 2: Thông tin xe & giấy tờ (xuống hàng riêng, tự động ngắt dòng không bị tràn) */}
                  <div className="flex items-start gap-1.5 text-slate-700 pt-0.5">
                    <Car className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 leading-relaxed break-words text-xs sm:text-sm">
                      <span className="text-slate-500 font-medium">Xe: </span>
                      <span className="font-semibold text-slate-800">{reservation.vehicle_info}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1. Tiêu đề vấn đề */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tiêu đề vấn đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError('');
                  }}
                  placeholder="Ví dụ: Thu phí sai quy định..."
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    titleError
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-300 focus:ring-teal-500/20 focus:border-teal-500'
                  } focus:outline-none focus:ring-2 transition-all font-medium`}
                  required
                />
                {titleError && (
                  <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{titleError}</span>
                  </p>
                )}
              </div>

              {/* 2. Mô tả chi tiết */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Mô tả chi tiết <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-medium ${
                      descError
                        ? 'text-red-500 font-bold'
                        : description.length < 20
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {description.length}/20 ký tự tối thiểu
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (descError) setDescError('');
                  }}
                  placeholder="Mô tả rõ sự việc xảy ra..."
                  rows={5}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    descError
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500 bg-red-50/20'
                      : 'border-slate-300 focus:ring-teal-500/20 focus:border-teal-500'
                  } focus:outline-none focus:ring-2 transition-all font-medium resize-none`}
                  required
                />
                {descError && (
                  <p className="mt-1 text-xs text-red-600 font-semibold flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{descError}</span>
                  </p>
                )}
              </div>

              {/* 3. Ảnh minh chứng */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Ảnh minh chứng <span className="text-slate-400 font-normal">(tối đa 5 ảnh)</span>
                </label>
                <label className="flex h-16 sm:h-18 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-teal-500 hover:bg-teal-50/40 hover:text-teal-700 transition">
                  <div className="flex items-center gap-1.5">
                    <ImagePlus className="h-4 w-4 text-slate-500" />
                    <span>Nhấn để chọn ảnh ({imageFiles.length}/5)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Hỗ trợ JPG, PNG, WEBP (tối đa 50MB mỗi ảnh)</span>
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
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                        <img src={preview} alt={`Ảnh ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-0.5 top-0.5 rounded-full bg-slate-900/80 p-0.5 text-white hover:bg-red-600 transition"
                          aria-label="Xóa ảnh"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Ghi chú tiếp nhận khiếu nại */}
              <div className="p-2 rounded-xl bg-teal-50/80 border border-teal-100 flex items-start gap-2 text-xs text-teal-800 leading-snug">
                <Info className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span>Ban quản trị sẽ xem xét khiếu nại và phản hồi lại bạn qua danh sách khiếu nại trong 24-48h làm việc.</span>
              </div>

              {/* 5. Nút Hủy và Gửi Khiếu Nại */}
              <div className="pt-2 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !reservation || errorMsg.includes('không đủ điều kiện')}
                  className="flex-[2] px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Gửi Khiếu Nại
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
