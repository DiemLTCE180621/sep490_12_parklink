import React, { useState, useEffect } from 'react';
import inspectorService from '../../services/inspectorService';
import uploadService from '../../services/uploadService';
import FacilityDetailsModal from '../modals/FacilityDetailsModal';
import { Clock, AlertCircle, CheckCircle, XCircle, Building2, MapPin, User, DollarSign, ChevronRight, Eye, Wrench } from 'lucide-react';

const FieldInspectorRegistrationsPanel = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionModal, setActionModal] = useState(null); // { type: 'INSPECT', id: number }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  
  const [capacity, setCapacity] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState({
    path: null,
    area: null,
    gate: null,
    other: null,
    additional: [],
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await inspectorService.getPreparingFacilities();
      if (res && res.status === "success") {
        setRegistrations(res.data);
      } else if (Array.isArray(res)) {
        setRegistrations(res);
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tải danh sách chờ khảo sát");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const confirmAction = async () => {
    if (!actionModal || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (actionModal.type === "INSPECT") {
        if (!capacity || parseInt(capacity, 10) <= 0) {
          showToast("error", "Vui lòng nhập sức chứa hợp lệ!");
          setIsSubmitting(false);
          return;
        }

        if (
          !uploadedFiles.path ||
          !uploadedFiles.area ||
          !uploadedFiles.gate ||
          !uploadedFiles.other
        ) {
          showToast("error", "Vui lòng tải lên đầy đủ 4 loại hình ảnh bãi đỗ xe bắt buộc!");
          setIsSubmitting(false);
          return;
        }

        const filesToUpload = [
          uploadedFiles.path,
          uploadedFiles.area,
          uploadedFiles.gate,
          uploadedFiles.other,
          ...(uploadedFiles.additional || []),
        ];

        const token = localStorage.getItem("parklink_token");
        const uploadRes = await uploadService.uploadFiles(filesToUpload, token);
        if (!uploadRes.success) {
          showToast("error", "Lỗi tải ảnh lên Cloudinary! Vui lòng thử lại.");
          setIsSubmitting(false);
          return;
        }

        const imageUrls = uploadRes.data.mediaUrls;

        await inspectorService.submitInspection(actionModal.id, {
          capacity: parseInt(capacity, 10),
          images: imageUrls,
        });

        showToast("success", "Đã gửi dữ liệu khảo sát thành công!");
      }
      setActionModal(null);
      setCapacity("");
      setUploadedFiles({
        path: null,
        area: null,
        gate: null,
        other: null,
        additional: [],
      });
      fetchRegistrations();
    } catch (err) {
      const backendMessage = err.response?.data?.message || err.response?.data?.errors?.[0] || err.message;
      showToast("error", "Lỗi: " + backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const renderCard = (facility) => {
    return (
      <div
        key={facility.id}
        className="rounded-2xl border p-4 md:p-5 space-y-4 border-blue-200 bg-blue-50/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                🔧 Đang chờ khảo sát
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600 shrink-0" />{" "}
              {facility.name}
            </h4>
            <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {facility.address}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Provider
            </p>
            <p className="font-bold text-slate-800 truncate">
              {facility.provider?.full_name}
            </p>
            <p className="text-slate-500 text-xs">
              {facility.provider?.phone_number}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100 col-span-2 md:col-span-1">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">
              Đề xuất ban đầu (Slots)
            </p>
            <p className="font-bold text-slate-800 text-lg">
              {facility.capacity} xe
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end border-t border-slate-200 pt-4">
          <button
            onClick={() => setDetailsModal(facility)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition mr-auto"
          >
            <Eye className="w-4 h-4" /> Xem chi tiết
          </button>

          <button
            onClick={() => {
              setCapacity(facility.capacity);
              setActionModal({ type: "INSPECT", id: facility.id });
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow transition"
          >
            <Wrench className="w-4 h-4" /> Báo cáo thực địa
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-md">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Công Việc Khảo Sát Thực Địa
        </h3>
        <p className="text-sm text-slate-600 font-medium mb-2">Bạn có {registrations.length} yêu cầu cần thực địa.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-md text-center">
          <CheckCircle className="w-12 h-12 text-teal-400 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            Tuyệt vời! Hiện tại bạn không có bãi đỗ xe nào cần khảo sát.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {registrations.map(renderCard)}
          </div>
        </div>
      )}

      {/* Modal Báo cáo thực địa */}
      {actionModal && actionModal.type === "INSPECT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl my-auto">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
              Báo Cáo Khảo Sát
            </h3>
            <p className="text-center text-slate-500 text-sm mb-6">
              Vui lòng điền số chỗ (capacity) thực tế và tải lên các hình ảnh hiện trạng của bãi.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Sức chứa thực tế (Số xe) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Ví dụ: 50"
                min="1"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Tải lên hình ảnh thực tế (Bắt buộc 4 tấm) <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
                  <p className="text-xs font-bold text-slate-700 mb-2">1. Hình đường vào bãi</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadedFiles({ ...uploadedFiles, path: e.target.files[0] })}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                  {uploadedFiles.path && <p className="text-[10px] text-teal-600 mt-1 truncate font-medium">Đã chọn: {uploadedFiles.path.name}</p>}
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
                  <p className="text-xs font-bold text-slate-700 mb-2">2. Hình toàn cảnh bãi đỗ</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadedFiles({ ...uploadedFiles, area: e.target.files[0] })}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                  {uploadedFiles.area && <p className="text-[10px] text-teal-600 mt-1 truncate font-medium">Đã chọn: {uploadedFiles.area.name}</p>}
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
                  <p className="text-xs font-bold text-slate-700 mb-2">3. Hình cổng bãi</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadedFiles({ ...uploadedFiles, gate: e.target.files[0] })}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                  {uploadedFiles.gate && <p className="text-[10px] text-teal-600 mt-1 truncate font-medium">Đã chọn: {uploadedFiles.gate.name}</p>}
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
                  <p className="text-xs font-bold text-slate-700 mb-2">4. Hình góc độ khác</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadedFiles({ ...uploadedFiles, other: e.target.files[0] })}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                  {uploadedFiles.other && <p className="text-[10px] text-teal-600 mt-1 truncate font-medium">Đã chọn: {uploadedFiles.other.name}</p>}
                </div>
              </div>

              <div className="mt-4 border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
                <p className="text-xs font-bold text-slate-700 mb-2">5. Hình ảnh bổ sung (Tùy chọn)</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setUploadedFiles({ ...uploadedFiles, additional: Array.from(e.target.files) })}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActionModal(null);
                  setCapacity("");
                  setUploadedFiles({ path: null, area: null, gate: null, other: null, additional: [] });
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Hủy
              </button>
              <button
                disabled={
                  isSubmitting ||
                  !uploadedFiles.path ||
                  !uploadedFiles.area ||
                  !uploadedFiles.gate ||
                  !uploadedFiles.other ||
                  !capacity
                }
                onClick={confirmAction}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200 transition disabled:opacity-50"
              >
                Gửi Kết Quả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Chi Tiết */}
      <FacilityDetailsModal
        facility={detailsModal}
        onClose={() => setDetailsModal(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] transition-all duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${toast.type === "success" ? "bg-teal-50 border-teal-200 text-teal-900" : "bg-red-50 border-red-200 text-red-900"}`}>
            {toast.type === "success" ? <CheckCircle className="w-6 h-6 text-teal-600 shrink-0" /> : <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />}
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldInspectorRegistrationsPanel;
