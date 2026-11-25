import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Camera,
  UserCheck
} from 'lucide-react';
import adminService from '../../services/adminService';
import inspectorService from '../../services/inspectorService';
import uploadService from '../../services/uploadService';
import AssignInspectorModal from '../../components/admin/AssignInspectorModal';
import FacilityLocationPicker from '../../components/common/FacilityLocationPicker';
import Toast from '../../components/common/Toast';

const AdminRegistrationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['admin', 'common']);
  const { user } = useAuth();
  const isInspector = user?.role?.name === 'FIELD_INSPECTOR';

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [actionModal, setActionModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleOpenAssignModal = (type = 'PREPARE') => {
    setActionModal({ type });
  };

  const [capacity, setCapacity] = useState('');
  const [actualLocation, setActualLocation] = useState({ address: '', latitude: '', longitude: '' });
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
        setActualLocation({
          address: data.address || '',
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? '',
        });
      } else {
        setError(t('admin:registrationDetail.notFoundDesc', 'Không tìm thấy dữ liệu hồ sơ đăng ký.'));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        t('admin:registrationDetail.messages.loadError', 'Không thể kết nối đến máy chủ hoặc hồ sơ không tồn tại.')
      );
    } finally {
      setLoading(false);
    }
  }, [id, isInspector, t]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleFileSelect = (key, file) => {
    if (!file) return;
    setUploadedFiles((prev) => ({ ...prev, [key]: file }));
    const previewUrl = URL.createObjectURL(file);
    setFilePreviews((prev) => ({ ...prev, [key]: previewUrl }));
  };

  const handleRemoveFile = (key) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: null }));
    setFilePreviews((prev) => ({ ...prev, [key]: null }));
  };

  const handleAdditionalFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setUploadedFiles((prev) => ({
      ...prev,
      additional: [...prev.additional, ...fileList],
    }));
    const previewUrls = fileList.map((f) => URL.createObjectURL(f));
    setFilePreviews((prev) => ({
      ...prev,
      additional: [...prev.additional, ...previewUrls],
    }));
  };

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (
      !uploadedFiles.path ||
      !uploadedFiles.area ||
      !uploadedFiles.gate ||
      !uploadedFiles.other
    ) {
      showToast('error', t('admin:registrationDetail.surveyReport.photosRequired', 'Vui lòng chọn đủ 4 ảnh hiện trạng bắt buộc.'));
      return;
    }
    if (!capacity || Number(capacity) <= 0) {
      showToast('error', t('admin:registrationDetail.surveyReport.capacityInvalid', 'Vui lòng nhập sức chứa thực tế hợp lệ!'));
      return;
    }
    if (!actualLocation.address.trim() || actualLocation.latitude === '' || actualLocation.longitude === '') {
      showToast('error', t('admin:registrationDetail.surveyReport.locationRequired', 'Vui lòng xác định vị trí thực tế trên bản đồ!'));
      return;
    }

    try {
      setIsSubmitting(true);
      const filesToUpload = [
        uploadedFiles.path,
        uploadedFiles.area,
        uploadedFiles.gate,
        uploadedFiles.other,
        ...(Array.isArray(uploadedFiles.additional) ? uploadedFiles.additional : []),
      ].filter(Boolean);

      const uploadRes = await uploadService.uploadFiles(filesToUpload, 'parking-facilities');
      const mediaUrls = uploadRes?.data?.mediaUrls || uploadRes?.mediaUrls || [];
      if (!mediaUrls || mediaUrls.length === 0) {
        throw new Error(t('admin:registrationDetail.surveyReport.uploadFailed', 'Không thể tải ảnh lên hệ thống!'));
      }

      await inspectorService.submitInspection(facility.id, {
        capacity: Number(capacity),
        images: mediaUrls,
        address: actualLocation.address.trim(),
        latitude: Number(actualLocation.latitude),
        longitude: Number(actualLocation.longitude),
      });

      showToast('success', t('admin:registrationDetail.alerts.reportSuccess', 'Gửi báo cáo khảo sát thực địa thành công! Đã cập nhật dữ liệu cơ sở.'));
      await fetchDetail();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message;
      showToast('error', t('admin:registrationDetail.alerts.reportError', { message: backendMessage, defaultValue: 'Lỗi gửi báo cáo: ' + backendMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmAdminAction = async () => {
    if (!actionModal || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (actionModal.type === 'FINALIZE') {
        await adminService.finalizeRegistration(facility.id);
        showToast(
          'success',
          t('admin:registrationDetail.alerts.finalizeSuccess', 'Đã duyệt chính thức! Email kèm thông tin thanh toán đã gửi cho Provider.')
        );
      } else if (actionModal.type === 'REJECT') {
        if (!rejectReason.trim()) {
          showToast('error', t('admin:registrations.messages.rejectReasonRequired', 'Vui lòng nhập lý do từ chối!'));
          setIsSubmitting(false);
          return;
        }
        await adminService.rejectRegistration(facility.id, rejectReason.trim());
        showToast('success', t('admin:registrations.messages.rejectSuccess', 'Đã từ chối hồ sơ đăng ký thành công!'));
      }
      setActionModal(null);
      setRejectReason('');
      await fetchDetail();
    } catch (err) {
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        err.message;
      showToast('error', t('admin:registrationDetail.alerts.actionFailed', { message: backendMessage, defaultValue: 'Thao tác thất bại: ' + backendMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> {t('admin:registrationDetail.statuses.pendingReview', 'Chờ duyệt sơ bộ')}
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <Wrench className="w-3.5 h-3.5" /> {t('admin:registrationDetail.statuses.preparing', 'Đang chờ khảo sát thực địa')}
          </span>
        );
      case 'INSPECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('admin:registrationDetail.statuses.inspected', 'Đã khảo sát - Chờ duyệt')}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> {t('admin:registrationDetail.statuses.approved', 'Đã phê duyệt chính thức')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" /> {t('admin:registrationDetail.statuses.rejected', 'Đã từ chối')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status || t('admin:registrationDetail.statuses.unknown', 'Không xác định')}
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
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 text-xs font-semibold">{t('admin:registrationDetail.loading', 'Đang tải chi tiết hồ sơ...')}</p>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-red-200 shadow-sm p-6 sm:p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">{t('admin:registrationDetail.notFoundTitle', 'Không tìm thấy thông tin')}</h2>
          <p className="text-slate-600 text-xs">{error || t('admin:registrationDetail.notFoundDesc', 'Hồ sơ đăng ký không tồn tại hoặc đã bị xóa.')}</p>
          <div className="pt-3 flex justify-center gap-2.5">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {t('admin:registrationDetail.backToList', 'Quay lại danh sách')}
            </button>
            <button
              onClick={fetchDetail}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {t('admin:registrationDetail.retry', 'Thử lại')}
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

  const steps = [
    { step: 1, title: t('admin:registrationDetail.stepper.step1Title', 'Tiếp nhận hồ sơ'), desc: t('admin:registrationDetail.stepper.step1Desc', 'Provider gửi thông tin ban đầu') },
    { step: 2, title: t('admin:registrationDetail.stepper.step2Title', 'Duyệt sơ bộ'), desc: t('admin:registrationDetail.stepper.step2Desc', 'Admin kiểm tra hồ sơ hợp lệ') },
    { step: 3, title: t('admin:registrationDetail.stepper.step3Title', 'Khảo sát thực địa'), desc: t('admin:registrationDetail.stepper.step3Desc', 'Kiểm tra mặt bằng & chụp ảnh') },
    { step: 4, title: t('admin:registrationDetail.stepper.step4Title', 'Duyệt chính thức'), desc: t('admin:registrationDetail.stepper.step4Desc', 'Kích hoạt tài khoản bãi xe') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Link
            to="/dashboard"
            state={{ adminTab: isInspector ? 'inspections' : 'registrations' }}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-700 font-bold text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />{' '}
            {isInspector
              ? t('admin:registrationDetail.backToInspections', 'Quay lại Công Việc Khảo Sát')
              : t('admin:registrationDetail.backToRegistrations', 'Quay lại Danh Sách Duyệt Bãi Đỗ Xe')}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{t('admin:registrationDetail.registrationId', 'Mã hồ sơ:')}</span>
            <span className="font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md text-xs">
              #{facility.id}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                  {t('admin:registrationDetail.recordBadge', { id: facility.id, defaultValue: 'HỒ SƠ #' + facility.id })}
                </span>
                {getStatusBadge(facility.verification_status)}
                {facility.created_at && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {t('admin:registrationDetail.submittedOn', 'Gửi ngày:')}{' '}
                    {new Date(facility.created_at).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <Building2 className="w-6 h-6 text-teal-600 shrink-0" />
                {facility.name}
              </h1>
              <p className="text-slate-500 text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {facility.address}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
              {isInspector ? (
                <>
                  {isPreparing && (
                    <button
                      onClick={scrollToReportForm}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" /> {t('admin:registrationDetail.actions.fillReport', 'Điền Báo Cáo Thực Địa')}
                    </button>
                  )}
                  {isInspected && (
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      {t('admin:registrationDetail.actions.surveyReportSubmitted', 'Đã nộp báo cáo khảo sát')}
                    </span>
                  )}
                </>
              ) : (
                <>
                  {isPending && (
                    <>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {t('admin:registrations.actions.reject', 'Từ chối hồ sơ')}
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'PREPARE' })}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" /> {t('admin:registrationDetail.actions.preliminaryAndAssign', 'Duyệt sơ bộ & Giao khảo sát')}
                      </button>
                    </>
                  )}

                  {isInspected && (
                    <>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {t('admin:registrations.actions.reject', 'Từ chối hồ sơ')}
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'FINALIZE' })}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('admin:registrationDetail.actions.finalizeTitle', 'Duyệt chính thức & Cấp mật khẩu')}
                      </button>
                    </>
                  )}

                  {isPreparing && (
                    <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                      {t('admin:registrationDetail.actions.inSurveyNotice', 'Đang giao Nhân viên khảo sát thực địa')}
                    </div>
                  )}

                  {isApproved && (
                    <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {t('admin:registrationDetail.actions.approvedNotice', 'Hồ sơ đã được phê duyệt thành công')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              {t('admin:registrationDetail.stepper.title', 'Tiến trình xét duyệt hồ sơ')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {steps.map((item) => {
                const state = getStepState(item.step);
                return (
                  <div
                    key={item.step}
                    className={`p-3 rounded-xl border transition ${
                      state.completed
                        ? 'bg-teal-50/70 border-teal-200 text-teal-900'
                        : state.current
                        ? 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-400/20'
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          state.completed
                            ? 'bg-teal-600 text-white'
                            : state.current
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {state.completed ? <Check className="w-3 h-3" /> : item.step}
                      </div>
                      <span className="font-bold text-xs text-slate-900 truncate">{item.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 ml-7 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-4.5 h-4.5 text-teal-600" /> {t('admin:registrationDetail.facilityInfo.title', 'Chi Tiết Cơ Sở Bãi Đỗ Xe')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('admin:registrationDetail.facilityInfo.facilityName', 'Tên cơ sở')}</span>
                  <p className="text-sm font-bold text-slate-900">{facility.name}</p>
                </div>

                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                     <Car className="w-3.5 h-3.5 text-teal-600" />{' '}
                     {isInspected || isApproved
                       ? t('admin:registrationDetail.facilityInfo.capacityAfterSurvey', 'Sức chứa sau khảo sát')
                       : t('admin:registrationDetail.facilityInfo.capacityProposed', 'Sức chứa đề xuất ban đầu')}
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {t('admin:registrationDetail.facilityInfo.capacityUnit', { count: facility.capacity, defaultValue: facility.capacity + ' vị trí đỗ xe' })}
                  </p>
                </div>

                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" /> {t('admin:registrationDetail.facilityInfo.desiredPrice', 'Giá thuê mong muốn')}
                  </span>
                  <p className="text-sm font-bold text-teal-700">
                    {t('admin:registrationDetail.facilityInfo.priceUnit', {
                      price: Number(facility.price_per_month || 0).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US'),
                      defaultValue: Number(facility.price_per_month || 0).toLocaleString('vi-VN') + ' VNĐ / tháng'
                    })}
                  </p>
                </div>

                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-teal-100 space-y-1">
                  <span className="text-teal-700 font-semibold uppercase text-xs tracking-wide flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" /> {t('admin:registrationDetail.facilityInfo.platformFee', 'Phí nền tảng')}
                  </span>
                  <p className="text-sm font-bold text-teal-900">
                    {t('admin:registrationDetail.facilityInfo.feeUnit', {
                      fee: Number(facility.system_fee || 0).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US'),
                      defaultValue: Number(facility.system_fee || 0).toLocaleString('vi-VN') + ' VNĐ'
                    })}
                  </p>
                </div>

                <div className="sm:col-span-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                     <MapPin className="w-3.5 h-3.5 text-slate-500" />{' '}
                     {isInspected || isApproved
                       ? t('admin:registrationDetail.facilityInfo.addressAfterSurvey', 'Địa chỉ sau khảo sát')
                       : t('admin:registrationDetail.facilityInfo.addressRegistered', 'Địa chỉ đã khai báo')}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">{facility.address}</p>
                </div>

                {(facility.latitude || facility.longitude) && (
                  <div className="sm:col-span-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-0.5">{t('admin:registrationDetail.facilityInfo.gps', 'Tọa độ GPS')}</span>
                      <p className="font-mono text-xs text-slate-700">
                        {facility.latitude}, {facility.longitude}
                      </p>
                    </div>
                    <a
                      href={'https://www.google.com/maps?q=' + facility.latitude + ',' + facility.longitude}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-teal-700 font-bold transition flex items-center gap-1 text-xs shadow-2xs"
                    >
                      {t('admin:registrationDetail.facilityInfo.openGoogleMaps', 'Mở Google Maps →')}
                    </a>
                  </div>
                )}
              </div>

              {facility.facility_amenities && facility.facility_amenities.length > 0 && (
                <div className="pt-1">
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" /> {t('admin:registrationDetail.facilityInfo.amenities', 'Tiện ích đi kèm')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {facility.facility_amenities.map((fa, index) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 bg-teal-50 text-teal-800 text-xs font-semibold rounded-lg border border-teal-200"
                      >
                        {fa.amenity?.name || t('admin:registrationDetail.facilityInfo.defaultAmenity', 'Tiện ích')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isInspector && isPreparing && (
              <div
                id="inspection-report-form"
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {t('admin:registrationDetail.surveyReport.title', 'Báo Cáo Kết Quả Khảo Sát Thực Địa')}
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {t('admin:registrationDetail.surveyReport.subtitle', 'Nhập sức chứa, xác định vị trí thực tế và đính kèm 4 hình ảnh hiện trạng bắt buộc của bãi xe')}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmitInspection} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      {t('admin:registrationDetail.surveyReport.capacityLabel', 'Sức chứa thực tế (Số xe)')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative max-w-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-600">
                        <Car className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white shadow-2xs"
                        placeholder={t('admin:registrationDetail.surveyReport.capacityPlaceholder', 'Ví dụ: 30')}
                        min="1"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {t('admin:registrationDetail.surveyReport.capacityHint', 'Số chỗ đỗ xe thực tế bạn đo đạc, kiểm tra tại hiện trường.')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                      {t('admin:registrationDetail.surveyReport.locationLabel', 'Vị trí thực tế của bãi xe')} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-400 mb-2.5">
                      {t('admin:registrationDetail.surveyReport.locationHint', 'Kiểm tra địa chỉ đã khai báo, rồi kéo ghim hoặc chọn lại vị trí chính xác trên bản đồ.')}
                    </p>
                    <FacilityLocationPicker
                      address={actualLocation.address}
                      latitude={actualLocation.latitude}
                      longitude={actualLocation.longitude}
                      onChange={(location) => setActualLocation((prev) => ({ ...prev, ...location }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      {t('admin:registrationDetail.surveyReport.photosLabel', 'Hình ảnh hiện trạng thực tế (Bắt buộc 4 góc độ)')} <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'path', title: t('admin:registrationDetail.surveyReport.photo1Title', '1. Đường vào bãi xe'), hint: t('admin:registrationDetail.surveyReport.photo1Hint', 'Chụp rõ lối đi, độ rộng đường vào') },
                        { key: 'area', title: t('admin:registrationDetail.surveyReport.photo2Title', '2. Toàn cảnh bãi đỗ xe'), hint: t('admin:registrationDetail.surveyReport.photo2Hint', 'Chụp bao quát mặt bằng, sức chứa') },
                        { key: 'gate', title: t('admin:registrationDetail.surveyReport.photo3Title', '3. Cổng bãi đỗ xe'), hint: t('admin:registrationDetail.surveyReport.photo3Hint', 'Chụp cổng ra vào, biển báo nếu có') },
                        { key: 'other', title: t('admin:registrationDetail.surveyReport.photo4Title', '4. Góc độ khác / Mặt bằng'), hint: t('admin:registrationDetail.surveyReport.photo4Hint', 'Góc chụp bổ sung mặt sàn, mái che') },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`rounded-xl border p-3 transition ${
                            filePreviews[item.key]
                              ? 'border-teal-300 bg-teal-50/40'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{item.title}</p>
                              <p className="text-xs text-slate-400">{item.hint}</p>
                            </div>
                            {filePreviews[item.key] && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 shrink-0">
                                {t('admin:registrationDetail.surveyReport.selected', 'Đã chọn')}
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
                                <label className="px-2.5 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-100 shadow">
                                  {t('admin:registrationDetail.surveyReport.changePhoto', 'Đổi ảnh')}
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
                                  className="px-2.5 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shadow"
                                >
                                  {t('admin:registrationDetail.surveyReport.deletePhoto', 'Xóa')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="mt-2 flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition group">
                              <Camera className="w-6 h-6 text-slate-400 group-hover:text-teal-600 transition mb-1" />
                              <span className="text-xs font-bold text-slate-600 group-hover:text-teal-700">
                                {t('admin:registrationDetail.surveyReport.choosePhoto', 'Chọn ảnh hoặc chụp ảnh')}
                              </span>
                              <span className="text-xs text-slate-400">{t('admin:registrationDetail.surveyReport.photoTypes', 'PNG, JPG, JPEG')}</span>
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

                    <div className="mt-3 rounded-xl border border-slate-200 p-3 bg-white">
                      <div className="flex justify-between items-start mb-1.5">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{t('admin:registrationDetail.surveyReport.additionalTitle', '5. Hình ảnh bổ sung (Tùy chọn)')}</p>
                          <p className="text-xs text-slate-400">{t('admin:registrationDetail.surveyReport.additionalHint', 'Tải thêm nhiều hình ảnh góc chụp khác nếu cần')}</p>
                        </div>
                        {filePreviews.additional.length > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {t('admin:registrationDetail.surveyReport.additionalCount', { count: filePreviews.additional.length, defaultValue: filePreviews.additional.length + ' ảnh' })}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {filePreviews.additional.map((url, idx) => (
                          <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 relative group">
                            <img src={url} alt={'Ảnh bổ sung ' + (idx + 1)} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        <label className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400 hover:text-teal-600 transition">
                          <Upload className="w-4 h-4 mb-0.5" />
                          <span className="text-[10px] font-bold">{t('admin:registrationDetail.surveyReport.addMorePhoto', 'Thêm ảnh')}</span>
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

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !uploadedFiles.path ||
                        !uploadedFiles.area ||
                        !uploadedFiles.gate ||
                        !uploadedFiles.other ||
                        !capacity ||
                        !actualLocation.address.trim() ||
                        actualLocation.latitude === '' ||
                        actualLocation.longitude === ''
                      }
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {isSubmitting
                        ? t('admin:registrationDetail.surveyReport.submitting', 'Đang tải lên Cloudinary & Gửi...')
                        : t('admin:registrationDetail.surveyReport.submit', 'Gửi Kết Quả Khảo Sát')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!(isInspector && isPreparing) && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4.5 h-4.5 text-teal-600" /> {t('admin:registrationDetail.gallery.title', 'Hình Ảnh Cơ Sở & Khảo Sát Thực Địa')}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    {t('admin:registrationDetail.gallery.totalPhotos', { count: facility.images?.length || 0, defaultValue: 'Tổng: ' + (facility.images?.length || 0) + ' ảnh' })}
                  </span>
                </div>

                {facility.images && facility.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {facility.images.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        onClick={() => setSelectedImage(img.image_url)}
                        className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:shadow-xs transition"
                      >
                        <img
                          src={img.image_url}
                          alt={'Ảnh cơ sở ' + (idx + 1)}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {img.is_primary && (
                          <span className="absolute top-2 left-2 bg-teal-600 text-white text-xs font-semibold px-2 py-0.5 rounded-md shadow-xs">
                            {t('admin:registrationDetail.gallery.primary', 'Ảnh chính')}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                          {t('admin:registrationDetail.gallery.viewZoom', 'Xem ảnh phóng to')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1.5">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">
                      {t('admin:registrationDetail.gallery.noPhotos', 'Chưa có hình ảnh được tải lên cho bãi đỗ xe này.')}
                    </p>
                    {isPreparing && (
                      <p className="text-xs text-sky-600 font-semibold">
                        {t('admin:registrationDetail.gallery.inspectorWillUpdate', 'Nhân viên khảo sát sẽ cập nhật ảnh sau khi hoàn tất kiểm tra thực địa tại biểu mẫu bên trên.')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4.5 h-4.5 text-teal-600" /> {t('admin:registrationDetail.provider.title', 'Thông Tin Chủ Bãi')}
              </h3>

              <div className="flex items-center gap-3 pt-0.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                  {facility.provider?.full_name ? facility.provider.full_name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {facility.provider?.full_name || t('admin:registrationDetail.provider.unupdated', 'Chưa cập nhật')}
                  </h4>
                  <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-semibold border border-teal-200">
                    {t('admin:registrationDetail.provider.role', 'Đối tác Chủ Bãi Xe')}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-xs text-slate-600">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">{facility.provider?.email || t('admin:registrationDetail.provider.emailNA', 'N/A')}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700">{facility.provider?.phone_number || t('admin:registrationDetail.provider.unupdated', 'Chưa cập nhật')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center font-bold text-sm">
                    <UserCheck className="w-4.5 h-4.5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {facility.assigned_inspector?.full_name ||
                        (isPreparing
                          ? t('admin:registrationDetail.inspector.notSpecified', 'Chưa chỉ định')
                          : t('admin:registrationDetail.inspector.unassigned', 'Chưa phân công'))}
                    </h3>
                    <span className="text-xs text-amber-700 font-semibold px-2 py-0.5 bg-amber-50 rounded-md inline-block mt-0.5">
                      {t('admin:registrationDetail.inspector.title', 'NV Khảo Sát Thực Địa')}
                    </span>
                  </div>
                </div>
                {!isInspector && (isPreparing || isPending) && (
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(isPreparing ? 'REASSIGN' : 'PREPARE')}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold hover:underline cursor-pointer"
                  >
                    {facility.assigned_inspector
                      ? t('admin:registrationDetail.inspector.change', 'Đổi NV')
                      : t('admin:registrationDetail.inspector.assign', 'Phân công')}
                  </button>
                )}
              </div>

              {facility.assigned_inspector ? (
                <div className="space-y-2 pt-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{facility.assigned_inspector.email || t('admin:registrationDetail.provider.emailNA', 'N/A')}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{facility.assigned_inspector.phone_number || t('admin:registrationDetail.provider.unupdated', 'Chưa cập nhật')}</span>
                  </div>
                  {facility.assigned_inspector.address && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 line-clamp-1">{facility.assigned_inspector.address}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-800 leading-relaxed">
                  {isPending
                    ? t('admin:registrationDetail.inspector.waitingAssignment', 'Hồ sơ đang chờ duyệt sơ bộ và phân công nhân viên khảo sát thực tế.')
                    : t('admin:registrationDetail.inspector.noInspectorNotice', 'Bãi xe chưa có nhân viên khảo sát phụ trách cụ thể. Bạn có thể phân công ngay.')}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4.5 h-4.5 text-teal-600" />{' '}
                {isInspector
                  ? t('admin:registrationDetail.actions.titleInspector', 'Nhiệm Vụ Khảo Sát')
                  : t('admin:registrationDetail.actions.titleAdmin', 'Quyết Định Xét Duyệt')}
              </h3>

              {isInspector ? (
                <div className="space-y-3.5">
                  {isPreparing ? (
                    <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 leading-relaxed space-y-1.5">
                      <strong className="block text-sky-950 font-bold text-xs">{t('admin:registrationDetail.actions.surveyWorkflowTitle', 'Quy trình thực địa:')}</strong>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-sky-800">
                        <li>{t('admin:registrationDetail.actions.surveyStep1', 'Kiểm tra thông tin vị trí & độ rộng lối đi')}</li>
                        <li>{t('admin:registrationDetail.actions.surveyStep2', 'Đo đạc sức chứa thực tế')}</li>
                        <li>{t('admin:registrationDetail.actions.surveyStep3', 'Chụp 4 ảnh hiện trạng bắt buộc')}</li>
                        <li>{t('admin:registrationDetail.actions.surveyStep4', 'Điền biểu mẫu báo cáo bên trái và gửi kết quả')}</li>
                      </ul>
                    </div>
                  ) : isInspected ? (
                    <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-teal-950 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> {t('admin:registrationDetail.actions.surveyCompleted', 'Đã hoàn thành khảo sát')}
                      </p>
                      <p className="text-xs text-teal-800 leading-relaxed">
                        {t('admin:registrationDetail.actions.waitingAdminApproval', 'Báo cáo thực địa đã được gửi thành công. Đang chờ Ban Quản Trị (Admin) xem xét và phê duyệt chính thức.')}
                      </p>
                    </div>
                  ) : isApproved ? (
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {t('admin:registrationDetail.actions.approvedNotice', 'Bãi xe đã được duyệt!')}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                      {t('admin:registrationDetail.actions.currentStatus', 'Trạng thái hiện tại:')} <strong>{facility.verification_status}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {isPending && (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                        <strong>{t('admin:registrationDetail.actions.pendingPreliminary', 'Hồ sơ đang chờ duyệt sơ bộ:')}</strong> {t('admin:registrationDetail.actions.pendingNotice', 'Admin cần kiểm tra tính hợp lệ của thông tin và chọn nhân viên khảo sát thực địa phụ trách.')}
                      </div>
                      <button
                        onClick={() => handleOpenAssignModal('PREPARE')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> {t('admin:registrationDetail.actions.preliminaryAndAssign', 'Duyệt sơ bộ & Giao khảo sát')}
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {t('admin:registrationDetail.actions.rejectApplication', 'Từ chối hồ sơ này')}
                      </button>
                    </div>
                  )}

                  {isPreparing && (
                    <div className="space-y-3">
                      <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 space-y-1.5 leading-relaxed">
                        <p className="font-bold flex items-center gap-1.5 text-xs">
                          <Wrench className="w-3.5 h-3.5 text-sky-600" /> {t('admin:registrationDetail.actions.inSurveyNotice', 'Đang khảo sát thực địa:')}
                        </p>
                        <p className="text-xs">
                          {facility.assigned_inspector ? (
                            <>{t('admin:registrationDetail.actions.assignedTo', { name: facility.assigned_inspector.full_name, phone: facility.assigned_inspector.phone_number || 'N/A', defaultValue: 'Nhân viên phụ trách: ' + facility.assigned_inspector.full_name + ' (SĐT: ' + (facility.assigned_inspector.phone_number || 'N/A') + ').' })}</>
                          ) : (
                            <>{t('admin:registrationDetail.actions.noInspectorAssignedYet', 'Chưa có nhân viên khảo sát nào được chỉ định.')}</>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal('REASSIGN')}
                        className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs rounded-xl border border-sky-200 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> {facility.assigned_inspector ? t('admin:registrationDetail.actions.changeInspector', 'Đổi nhân viên khảo sát') : t('admin:registrationDetail.actions.assignInspector', 'Gán nhân viên khảo sát')}
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {t('admin:registrations.actions.reject', 'Từ chối hồ sơ')}
                      </button>
                    </div>
                  )}

                  {isInspected && (
                    <div className="space-y-3">
                      <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-900 space-y-1.5 leading-relaxed">
                        <p className="font-bold flex items-center gap-1.5 text-teal-950 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> {t('admin:registrationDetail.actions.surveyCompleted', 'Đã hoàn thành khảo sát:')}
                        </p>
                        <p className="text-xs">
                          {t('admin:registrationDetail.actions.surveyDoneNotice', 'Dữ liệu thực địa đã được tải lên đầy đủ. Admin có thể xem xét và nhấn Duyệt chính thức để cấp mật khẩu và thông báo thanh toán cho Provider.')}
                        </p>
                      </div>
                      <button
                        onClick={() => setActionModal({ type: 'FINALIZE' })}
                        className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('admin:registrationDetail.actions.finalizeAndIssue', 'Hoàn tất duyệt & Cấp mật khẩu')}
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'REJECT' })}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {t('admin:registrations.actions.reject', 'Từ chối hồ sơ')}
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {t('admin:registrationDetail.actions.approvedNotice', 'Đã duyệt thành công!')}
                      </p>
                      <p className="text-xs text-emerald-800">
                        {t('admin:registrationDetail.actions.approvedDesc', 'Cơ sở đã được duyệt và tài khoản Provider đã được cấp quyền truy cập hệ thống.')}
                      </p>
                    </div>
                  )}

                  {facility.verification_status === 'REJECTED' && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-xs">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> {t('admin:registrationDetail.actions.rejectedTitle', 'Hồ sơ bị từ chối')}
                      </p>
                      <p className="text-xs text-rose-800">
                        {t('admin:registrationDetail.actions.rejectedDesc', 'Yêu cầu đăng ký đã bị từ chối và email lý do đã được chuyển đến Provider.')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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
              className="absolute -top-3 -right-3 w-7 h-7 bg-white text-slate-800 rounded-full font-bold shadow flex items-center justify-center hover:bg-slate-100 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <AssignInspectorModal
        isOpen={Boolean(actionModal && (actionModal.type === 'PREPARE' || actionModal.type === 'REASSIGN'))}
        onClose={() => setActionModal(null)}
        facilityName={facility?.name}
        facilityAddress={facility?.address}
        currentInspectorId={facility?.assigned_inspector_id}
        isSubmitting={isSubmitting}
        title={
          actionModal?.type === 'PREPARE'
            ? t('admin:registrations.assign.assignTitle', 'Duyệt Sơ Bộ & Phân Công Khảo Sát')
            : t('admin:registrations.assign.reassignTitle', 'Phân Công Lại Nhân Viên Khảo Sát')
        }
        confirmText={
          actionModal?.type === 'PREPARE'
            ? t('admin:registrations.assign.assignConfirm', 'Duyệt sơ bộ & Giao việc')
            : t('admin:registrations.assign.reassignConfirm', 'Lưu phân công')
        }
        onConfirm={async (inspectorId) => {
          try {
            setIsSubmitting(true);
            if (actionModal.type === 'PREPARE') {
              await adminService.approveRegistration(facility.id, inspectorId);
              showToast(
                'success',
                t('admin:registrations.messages.preliminarySuccess', 'Đã duyệt sơ bộ và phân công nhân viên khảo sát! Email thông báo đã gửi cho Provider.')
              );
            } else {
              await adminService.assignInspector(facility.id, inspectorId);
              showToast(
                'success',
                t('admin:registrations.messages.reassignSuccess', 'Đã phân công lại nhân viên khảo sát thành công!')
              );
            }
            setActionModal(null);
            await fetchDetail();
          } catch (err) {
            const backendMessage =
              err.response?.data?.message ||
              err.response?.data?.errors?.[0] ||
              err.message;
            showToast('error', backendMessage || t('admin:registrations.messages.processError', 'Có lỗi xảy ra khi xử lý!'));
          } finally {
            setIsSubmitting(false);
          }
        }}
      />

      {actionModal && (actionModal.type === 'FINALIZE' || actionModal.type === 'REJECT') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 md:p-6 max-w-lg w-full shadow-xl my-auto">
            {actionModal.type === 'FINALIZE' && (
              <>
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-base font-bold text-center text-slate-900 mb-1.5">
                  {t('admin:registrations.confirm.finalizeTitle', 'Phê Duyệt Chính Thức')}
                </h3>
                <p className="text-center text-slate-500 text-xs mb-5">
                  {t('admin:registrations.confirm.finalizeDescription', 'Xác nhận hoàn tất phê duyệt cho bãi xe.')}
                </p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs cursor-pointer"
                  >
                    {t('admin:registrations.confirm.cancel', 'Hủy')}
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAdminAction}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 text-xs cursor-pointer"
                  >
                    {isSubmitting ? t('admin:registrations.confirm.processing', 'Đang xử lý...') : t('admin:registrations.confirm.finalizeSubmit', 'Duyệt & Cấp Mật Khẩu')}
                  </button>
                </div>
              </>
            )}

            {actionModal.type === 'REJECT' && (
              <>
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-base font-bold text-center text-slate-900 mb-1.5">
                  {t('admin:registrations.confirm.rejectTitle', 'Từ Chối Hồ Sơ Đăng Ký')}
                </h3>
                <p className="text-center text-slate-500 text-xs mb-3.5">
                  {t('admin:registrations.confirm.rejectDescription', 'Vui lòng cung cấp lý do từ chối để thông báo cho Provider.')}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setRejectReason(t('admin:registrations.confirm.reasons.missingInformation'))
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition cursor-pointer"
                  >
                    {t('admin:registrations.confirm.reasonLabels.missingInformation')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectReason(t('admin:registrations.confirm.reasons.locationOrPrice'))
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition cursor-pointer"
                  >
                    {t('admin:registrations.confirm.reasonLabels.locationOrPrice')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRejectReason(t('admin:registrations.confirm.reasons.safetyStandards'))
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition cursor-pointer"
                  >
                    {t('admin:registrations.confirm.reasonLabels.safetyStandards')}
                  </button>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('admin:registrations.confirm.reasonPlaceholder', 'Nhập lý do chi tiết...')}
                  className="w-full p-2.5 border border-slate-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none h-20 text-xs"
                />
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      setActionModal(null);
                      setRejectReason('');
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs cursor-pointer"
                  >
                    {t('admin:registrations.confirm.cancel', 'Hủy')}
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAdminAction}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 text-xs cursor-pointer"
                  >
                    {isSubmitting ? t('admin:registrations.confirm.rejecting', 'Đang từ chối...') : t('admin:registrations.confirm.rejectSubmit', 'Xác nhận Từ Chối')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
