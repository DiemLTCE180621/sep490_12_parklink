import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
  DollarSign,
  Calendar,
  Layers,
  Image as ImageIcon,
  Check,
  RotateCcw,
  ShieldCheck,
  Car,
  Upload,
  Camera
} from 'lucide-react';
import adminService from '../../services/adminService';
import inspectorService from '../../services/inspectorService';
import uploadService from '../../services/uploadService';
import Toast from '../../components/common/Toast';

const AdminRegistrationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInspector = user?.role?.name === 'FIELD_INSPECTOR';

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin action modal: 'PREPARE' | 'FINALIZE' | 'REJECT'
  const [actionModal, setActionModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Inspector form states (Inline on page - NO POPUP)
  const [capacity, setCapacity] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({
    path: null,
    area: null,
    gate: null,
    other: null,
    additional: [],
  });
  const [filePreviews, setFilePreviews] = useState({
    path: null,
    area: null,
    gate: null,
    other: null,
    additional: [],
  });

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let res;
      if (isInspector) {
        res = await inspectorService.getFacilityDetails(id);
      } else {
        res = await adminService.getRegistrationDetails(id);
      }
      const data = res?.data || res;
      if (data) {
        setFacility(data);
        setCapacity(data.capacity || '');
      } else {
        setError('Không tìm thấy dữ liệu hồ sơ đăng ký.');
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết hồ sơ:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Không thể tải chi tiết hồ sơ đăng ký'
      );
    } finally {
      setLoading(false);
    }
  }, [id, isInspector]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id, fetchDetail]);

  const handleFileSelect = (key, file) => {
    if (!file) return;
    setUploadedFiles((prev) => ({ ...prev, [key]: file }));
    const url = URL.createObjectURL(file);
    setFilePreviews((prev) => ({ ...prev, [key]: url }));
  };

  const handleRemoveFile = (key) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: null }));
    setFilePreviews((prev) => ({ ...prev, [key]: null }));
  };

  const handleAdditionalFiles = (files) => {
    const fileList = Array.from(files);
    setUploadedFiles((prev) => ({ ...prev, additional: fileList }));
    const urls = fileList.map((f) => URL.createObjectURL(f));
    setFilePreviews((prev) => ({ ...prev, additional: urls }));
  };

  // Submit Inspector Report (Inline form)
  const handleSubmitInspection = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;

    if (!capacity || parseInt(capacity, 10) <= 0) {
      showToast('error', 'Vui lòng nhập sức chứa thực tế hợp lệ (lớn hơn 0)!');
      return;
    }

    if (
      !uploadedFiles.path ||
      !uploadedFiles.area ||
      !uploadedFiles.gate ||
      !uploadedFiles.other
    ) {
      showToast('error', 'Vui lòng tải lên đầy đủ 4 hình ảnh hiện trạng bắt buộc!');
      return;
    }

    try {
      setIsSubmitting(true);
      const filesToUpload = [
        uploadedFiles.path,
        uploadedFiles.area,
        uploadedFiles.gate,
        uploadedFiles.other,
        ...(uploadedFiles.additional || []),
      ];

      const token = localStorage.getItem('parklink_token');
      const uploadRes = await uploadService.uploadFiles(filesToUpload, token);
      if (!uploadRes.success) {
        showToast('error', 'Lỗi tải ảnh lên Cloudinary! Vui lòng thử lại.');
        setIsSubmitting(false);
        return;
      }

      const imageUrls = uploadRes.data.mediaUrls;

      await inspectorService.submitInspection(facility.id, {
        capacity: parseInt(capacity, 10),
        images: imageUrls,
      });

      showToast(
        'success',
        'Đã gửi báo cáo khảo sát thành công! Đang chờ Admin phê duyệt cuối cùng.'
      );
      await fetchDetail();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message;
      showToast('error', 'Lỗi gửi báo cáo: ' + backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Actions (Approve / Reject)
  const confirmAdminAction = async () => {
    if (!actionModal || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (actionModal.type === 'PREPARE') {
        await adminService.approveRegistration(facility.id);
        showToast(
          'success',
          'Đã duyệt sơ bộ! Email thông báo đã gửi cho Provider.'
        );
      } else if (actionModal.type === 'FINALIZE') {
        await adminService.finalizeRegistration(facility.id);
        showToast(
          'success',
          'Đã duyệt chính thức! Email kèm thông tin thanh toán đã gửi cho Provider.'
        );
      } else if (actionModal.type === 'REJECT') {
        if (!rejectReason.trim()) {
          showToast('error', 'Vui lòng nhập lý do từ chối!');
          setIsSubmitting(false);
          return;
        }
        await adminService.rejectRegistration(facility.id, rejectReason);
        showToast('success', 'Đã từ chối hồ sơ đăng ký!');
      }
      setActionModal(null);
      setRejectReason('');
      await fetchDetail();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message;
      showToast('error', 'Thao tác thất bại: ' + backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Chờ duyệt sơ bộ
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
            <Wrench className="w-3.5 h-3.5" /> Đang chờ khảo sát thực địa
          </span>
        );
      case 'INSPECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-100 text-teal-800 border border-teal-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã khảo sát - Chờ duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Đã phê duyệt chính thức
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> Đã từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status || 'Không xác định'}
          </span>
        );
    }
  };

  const getStepState = (stepIndex) => {
    const status = facility?.verification_status;
    if (status === 'REJECTED') {
      return { completed: false, current: false, rejected: true };
    }
    if (stepIndex === 1) {
      return { completed: true, current: false };
    }
    if (stepIndex === 2) {
      if (status === 'PENDING_REVIEW') return { completed: false, current: true };
      return { completed: true, current: false };
    }
    if (stepIndex === 3) {
      if (status === 'PENDING_REVIEW') return { completed: false, current: false };
      if (status === 'PREPARING') return { completed: false, current: true };
      return { completed: true, current: false };
    }
    if (stepIndex === 4) {
      if (status === 'INSPECTED') return { completed: false, current: true };
      if (status === 'APPROVED') return { completed: true, current: false };
      return { completed: false, current: false };
    }
    return { completed: false, current: false };
  };

  const scrollToReportForm = () => {
    const el = document.getElementById('inspection-report-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 text-sm font-semibold">Đang tải chi tiết hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-red-200 shadow-md p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Không tìm thấy thông tin</h2>
          <p className="text-slate-600 text-sm">{error || 'Hồ sơ đăng ký không tồn tại hoặc đã bị xóa.'}</p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
            </button>
            <button
              onClick={fetchDetail}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPending = facility.verification_status === 'PENDING_REVIEW';
  const isPreparing = facility.verification_status === 'PREPARING';
  const isInspected = facility.verification_status === 'INSPECTED';
  const isApproved = facility.verification_status === 'APPROVED';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link
            to="/dashboard"
            state={{ adminTab: isInspector ? 'inspections' : 'registrations' }}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-700 font-bold text-xs bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />{' '}
            {isInspector ? 'Quay lại Công Việc Khảo Sát' : 'Quay lại Danh Sách Duyệt Bãi Đỗ Xe'}
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Mã hồ sơ:</span>
            <span className="font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
              #{facility.id}
            </span>
          </div>
        </div>

        {/* Header Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                  HỒ SƠ #{facility.id}
                </span>
                {getStatusBadge(facility.verification_status)}
                {facility.created_at && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Gửi ngày:{' '}
                    {new Date(facility.created_at).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-teal-600 shrink-0" />
                {facility.name}
              </h1>
              <p className="text-slate-500 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                {facility.address}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
              {isInspector ? (
                <>
                  {isPreparing && (
                    <button
                      onClick={scrollToReportForm}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <Wrench className="w-4 h-4" /> Điền Báo Cáo Thực Địa
                    </button>
                  )}
                  {isInspected && (
                    <span className="text-xs font-semibold px-4 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      Đã nộp báo cáo khảo sát
                    </span>
                  )}
                </>
              ) : (
                <>
                  {isPending && (
                    <>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Từ chối hồ sơ
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'PREPARE' })}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <Wrench className="w-4 h-4" /> Duyệt sơ bộ &amp; Giao khảo sát
                      </button>
                    </>
                  )}

                  {isInspected && (
                    <>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" /> Từ chối hồ sơ
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'FINALIZE' })}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Duyệt chính thức &amp; Cấp mật khẩu
                      </button>
                    </>
                  )}

                  {isPreparing && (
                    <div className="text-xs font-semibold px-4 py-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-sky-600 animate-spin" />
                      Đang giao Nhân viên khảo sát thực địa
                    </div>
                  )}

                  {isApproved && (
                    <div className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Hồ sơ đã được phê duyệt thành công
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Tiến trình xét duyệt hồ sơ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { step: 1, title: 'Tiếp nhận hồ sơ', desc: 'Provider gửi thông tin ban đầu' },
                { step: 2, title: 'Duyệt sơ bộ', desc: 'Admin kiểm tra hồ sơ hợp lệ' },
                { step: 3, title: 'Khảo sát thực địa', desc: 'Kiểm tra mặt bằng & chụp ảnh' },
                { step: 4, title: 'Duyệt chính thức', desc: 'Kích hoạt tài khoản bãi xe' },
              ].map((item) => {
                const state = getStepState(item.step);
                return (
                  <div
                    key={item.step}
                    className={`p-3.5 rounded-2xl border transition ${
                      state.completed
                        ? 'bg-teal-50/70 border-teal-200 text-teal-900'
                        : state.current
                        ? 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-400/20'
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          state.completed
                            ? 'bg-teal-600 text-white'
                            : state.current
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {state.completed ? <Check className="w-3.5 h-3.5" /> : item.step}
                      </div>
                      <span className="font-bold text-xs text-slate-900">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 ml-8 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info - 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Facility Details Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-5 h-5 text-teal-600" /> Chi Tiết Cơ Sở Bãi Đỗ Xe
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase">Tên cơ sở</span>
                  <p className="text-sm font-bold text-slate-900">{facility.name}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-teal-600" /> Sức chứa đề xuất ban đầu
                  </span>
                  <p className="text-sm font-bold text-slate-900">{facility.capacity} vị trí đỗ xe</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" /> Giá thuê mong muốn
                  </span>
                  <p className="text-sm font-extrabold text-teal-700">
                    {Number(facility.price_per_month || 0).toLocaleString('vi-VN')} VNĐ / tháng
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-teal-100 space-y-1">
                  <span className="text-teal-700 font-semibold uppercase flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" /> Phí nền tảng (Platform Fee)
                  </span>
                  <p className="text-sm font-extrabold text-teal-900">
                    {Number(facility.system_fee || 0).toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>

                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Địa chỉ chính xác
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">{facility.address}</p>
                </div>

                {(facility.latitude || facility.longitude) && (
                  <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 font-semibold uppercase block mb-0.5">Tọa độ GPS</span>
                      <p className="font-mono text-slate-700">
                        {facility.latitude}, {facility.longitude}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${facility.latitude},${facility.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-teal-700 font-bold transition flex items-center gap-1 text-xs"
                    >
                      Mở Google Maps &rarr;
                    </a>
                  </div>
                )}
              </div>

              {/* Amenities if any */}
              {facility.facility_amenities && facility.facility_amenities.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-600 mb-2.5 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" /> Tiện ích đi kèm
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {facility.facility_amenities.map((fa, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-semibold rounded-lg border border-teal-200"
                      >
                        {fa.amenity?.name || 'Tiện ích'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* INLINE INSPECTION REPORT FORM FOR INSPECTOR (NO POPUP!) */}
            {isInspector && isPreparing && (
              <div
                id="inspection-report-form"
                className="bg-white rounded-3xl border-2 border-teal-500/30 shadow-xl p-6 sm:p-8 space-y-6 bg-gradient-to-b from-white to-teal-50/20"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Báo Cáo Kết Quả Khảo Sát Thực Địa
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Nhập sức chứa thực tế và đính kèm 4 hình ảnh hiện trạng bắt buộc của bãi xe
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmitInspection} className="space-y-6">
                  {/* Capacity Input */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-2">
                      Sức chứa thực tế (Số xe) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative max-w-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600">
                        <Car className="w-5 h-5" />
                      </div>
                      <input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white shadow-sm"
                        placeholder="Ví dụ: 30"
                        min="1"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Số chỗ đỗ xe thực tế bạn đo đạc, kiểm tra tại hiện trường.
                    </p>
                  </div>

                  {/* 4 Required Photos */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-3">
                      Hình ảnh hiện trạng thực tế (Bắt buộc 4 góc độ) <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: 'path', title: '1. Đường vào bãi xe', hint: 'Chụp rõ lối đi, độ rộng đường vào' },
                        { key: 'area', title: '2. Toàn cảnh bãi đỗ xe', hint: 'Chụp bao quát mặt bằng, sức chứa' },
                        { key: 'gate', title: '3. Cổng bãi đỗ xe', hint: 'Chụp cổng ra vào, biển báo nếu có' },
                        { key: 'other', title: '4. Góc độ khác / Mặt bằng', hint: 'Góc chụp bổ sung mặt sàn, mái che' },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`rounded-2xl border p-4 transition ${
                            filePreviews[item.key]
                              ? 'border-teal-300 bg-teal-50/40'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{item.title}</p>
                              <p className="text-[11px] text-slate-400">{item.hint}</p>
                            </div>
                            {filePreviews[item.key] && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                Đã chọn
                              </span>
                            )}
                          </div>

                          {filePreviews[item.key] ? (
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-teal-200 group mt-2">
                              <img
                                src={filePreviews[item.key]}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                <label className="px-2.5 py-1.5 bg-white text-slate-800 text-[11px] font-bold rounded-lg cursor-pointer hover:bg-slate-100 shadow">
                                  Đổi ảnh
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(item.key, e.target.files[0])}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(item.key)}
                                  className="px-2.5 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 shadow"
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="mt-2 flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition group">
                              <Camera className="w-7 h-7 text-slate-400 group-hover:text-teal-600 transition mb-1" />
                              <span className="text-xs font-bold text-slate-600 group-hover:text-teal-700">
                                Chọn ảnh hoặc chụp ảnh
                              </span>
                              <span className="text-[10px] text-slate-400">PNG, JPG, JPEG</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(item.key, e.target.files[0])}
                              />
                            </label>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Additional Photos */}
                    <div className="mt-4 rounded-2xl border border-slate-200 p-4 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900">5. Hình ảnh bổ sung (Tùy chọn)</p>
                          <p className="text-[11px] text-slate-400">Tải thêm nhiều hình ảnh góc chụp khác nếu cần</p>
                        </div>
                        {filePreviews.additional.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {filePreviews.additional.length} ảnh
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2.5 mt-2">
                        {filePreviews.additional.map((url, idx) => (
                          <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 relative group">
                            <img src={url} alt={`Ảnh bổ sung ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        <label className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400 hover:text-teal-600 transition">
                          <Upload className="w-5 h-5 mb-0.5" />
                          <span className="text-[10px] font-bold">Thêm ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleAdditionalFiles(e.target.files)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !uploadedFiles.path ||
                        !uploadedFiles.area ||
                        !uploadedFiles.gate ||
                        !uploadedFiles.other ||
                        !capacity
                      }
                      className="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {isSubmitting ? 'Đang tải lên Cloudinary & Gửi...' : 'Gửi Kết Quả Khảo Sát'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Images Gallery Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-teal-600" /> Hình Ảnh Cơ Sở &amp; Khảo Sát Thực Địa
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Tổng: {facility.images?.length || 0} ảnh
                </span>
              </div>

              {facility.images && facility.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {facility.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      onClick={() => setSelectedImage(img.image_url)}
                      className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:shadow-md transition"
                    >
                      <img
                        src={img.image_url}
                        alt={`Ảnh cơ sở ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {img.is_primary && (
                        <span className="absolute top-2 left-2 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          Ảnh chính
                        </span>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                        Xem ảnh phóng to
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    Chưa có hình ảnh được tải lên cho bãi đỗ xe này.
                  </p>
                  {isPreparing && (
                    <p className="text-[11px] text-sky-600 font-semibold">
                      Nhân viên khảo sát sẽ cập nhật ảnh sau khi hoàn tất kiểm tra thực địa tại biểu mẫu bên trên.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Provider Info & Action Box */}
          <div className="space-y-6">
            {/* Provider Info Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-5 h-5 text-teal-600" /> Thông Tin Chủ Bãi (Provider)
              </h3>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                  {facility.provider?.full_name ? facility.provider.full_name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{facility.provider?.full_name || 'Chưa cập nhật'}</h4>
                  <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-bold border border-teal-200">
                    Đối tác Chủ Bãi Xe
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-600">
                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{facility.provider?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{facility.provider?.phone_number || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </div>

            {/* Decision Action Box */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-teal-600" />{' '}
                {isInspector ? 'Nhiệm Vụ Khảo Sát' : 'Quyết Định Xét Duyệt'}
              </h3>

              {isInspector ? (
                <div className="space-y-4">
                  {isPreparing ? (
                    <>
                      <div className="p-3.5 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-900 leading-relaxed space-y-2">
                        <strong className="block text-sky-950 font-bold">Quy trình thực địa:</strong>
                        <ul className="list-disc pl-4 space-y-1 text-[11px]">
                          <li>Kiểm tra thông tin vị trí &amp; độ rộng lối đi</li>
                          <li>Đo đạc sức chứa thực tế</li>
                          <li>Chụp 4 ảnh hiện trạng bắt buộc</li>
                          <li>Điền biểu mẫu báo cáo bên trái và gửi kết quả</li>
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={scrollToReportForm}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                      >
                        <Wrench className="w-4 h-4" /> Đến Biểu Mẫu Báo Cáo &darr;
                      </button>
                    </>
                  ) : isInspected ? (
                    <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-teal-950">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" /> Đã hoàn thành khảo sát
                      </p>
                      <p className="text-[11px] text-teal-800 leading-relaxed">
                        Báo cáo thực địa đã được gửi thành công. Đang chờ Ban Quản Trị (Admin) xem xét và phê duyệt chính thức.
                      </p>
                    </div>
                  ) : isApproved ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bãi xe đã được duyệt!
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                      Trạng thái hiện tại: <strong>{facility.verification_status}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {isPending && (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                        <strong>Hồ sơ đang chờ duyệt sơ bộ:</strong> Admin cần kiểm tra tính hợp lệ của thông tin trước khi chuyển sang giao nhân viên khảo sát thực địa.
                      </div>
                      <button
                        onClick={() => setActionModal({ type: 'PREPARE' })}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                      >
                        <Wrench className="w-4 h-4" /> Duyệt sơ bộ &amp; Giao khảo sát
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Từ chối hồ sơ này
                      </button>
                    </div>
                  )}

                  {isPreparing && (
                    <div className="space-y-4">
                      <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-900 space-y-2 leading-relaxed">
                        <p className="font-bold flex items-center gap-1.5">
                          <Wrench className="w-4 h-4 text-sky-600" /> Đang khảo sát thực địa:
                        </p>
                        <p>
                          Nhân viên khảo sát đang tiến hành kiểm tra thực tế, xác minh sức chứa và tải lên các hình ảnh bắt buộc của bãi xe.
                        </p>
                      </div>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Từ chối hồ sơ
                      </button>
                    </div>
                  )}

                  {isInspected && (
                    <div className="space-y-4">
                      <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-900 space-y-2 leading-relaxed">
                        <p className="font-bold flex items-center gap-1.5 text-teal-950">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" /> Đã hoàn thành khảo sát:
                        </p>
                        <p>
                          Dữ liệu thực địa đã được tải lên đầy đủ. Admin có thể xem xét và nhấn Duyệt chính thức để cấp mật khẩu và thông báo thanh toán cho Provider.
                        </p>
                      </div>
                      <button
                        onClick={() => setActionModal({ type: 'FINALIZE' })}
                        className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Hoàn tất duyệt &amp; Cấp mật khẩu
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Từ chối hồ sơ
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Đã duyệt thành công!
                      </p>
                      <p className="text-[11px] text-emerald-800">
                        Cơ sở đã được duyệt và tài khoản Provider đã được cấp quyền truy cập hệ thống.
                      </p>
                    </div>
                  )}

                  {facility.verification_status === 'REJECTED' && (
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" /> Hồ sơ bị từ chối
                      </p>
                      <p className="text-[11px] text-rose-800">
                        Yêu cầu đăng ký đã bị từ chối và email lý do đã được chuyển đến Provider.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Image */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Phóng to ảnh"
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-800 rounded-full font-bold shadow flex items-center justify-center hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Actions Modal for Admin */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl my-auto">
            {actionModal.type === 'PREPARE' && (
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                  Xác nhận Duyệt Sơ Bộ
                </h3>
                <p className="text-center text-slate-500 text-sm mb-6">
                  Bạn chấp thuận duyệt sơ bộ cho cơ sở <strong>"{facility.name}"</strong> và giao cho Nhân viên khảo sát thực địa. Email thông báo sẽ được gửi đến Provider.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAdminAction}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                  </button>
                </div>
              </>
            )}

            {actionModal.type === 'FINALIZE' && (
              <>
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                  Phê Duyệt Chính Thức
                </h3>
                <p className="text-center text-slate-500 text-sm mb-6">
                  Xác nhận hoàn tất phê duyệt cho bãi xe <strong>"{facility.name}"</strong>. Hệ thống sẽ kích hoạt tài khoản và gửi email thông tin mật khẩu kèm mã thanh toán cho Provider.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAdminAction}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Duyệt & Cấp Mật Khẩu'}
                  </button>
                </div>
              </>
            )}

            {actionModal.type === 'REJECT' && (
              <>
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                  Từ Chối Hồ Sơ Đăng Ký
                </h3>
                <p className="text-center text-slate-500 text-sm mb-4">
                  Vui lòng nhập lý do từ chối để hệ thống gửi thông báo chi tiết cho Provider.
                </p>
                <div className="flex flex-wrap gap-2 mb-3 justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setRejectReason('Thông tin bãi đỗ xe không đầy đủ hoặc thiếu chính xác.')
                    }
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition"
                  >
                    Thiếu thông tin
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectReason('Vị trí hoặc mức giá đăng ký không phù hợp quy định.')
                    }
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition"
                  >
                    Vị trí/Giá sai
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectReason('Khảo sát thực địa không đáp ứng tiêu chuẩn an toàn.')
                    }
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition"
                  >
                    Không đạt tiêu chuẩn
                  </button>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full p-3 border border-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none h-24 text-xs"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setActionModal(null);
                      setRejectReason('');
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAdminAction}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs"
                  >
                    {isSubmitting ? 'Đang từ chối...' : 'Xác nhận Từ Chối'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminRegistrationDetailPage;
