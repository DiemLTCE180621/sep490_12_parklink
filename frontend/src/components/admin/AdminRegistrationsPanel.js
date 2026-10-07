import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import uploadService from '../../services/uploadService';
import FacilityDetailsModal from '../modals/FacilityDetailsModal';
import { Clock, AlertCircle, CheckCircle, XCircle, Building2, MapPin, User, DollarSign, Wrench, ChevronRight, Eye } from 'lucide-react';

/**
 * AdminRegistrationsPanel: Panel quản lý duyệt bãi đỗ xe theo luồng mới
 * - PENDING_REVIEW → Admin Duyệt sơ bộ & Giao khảo sát → PREPARING
 * - PREPARING → Nhân viên khảo sát thực địa làm việc → INSPECTED
 * - INSPECTED → Admin duyệt chính thức & Cấp mật khẩu → APPROVED
 * - Từ chối có thể ở bất kỳ bước nào
 */
const AdminRegistrationsPanel = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionModal, setActionModal] = useState(null); // { type: 'PREPARE' | 'FINALIZE' | 'REJECT', id: number }
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await adminService.getPendingRegistrations();
      if (res && res.status === "success") {
        setRegistrations(res.data);
      } else if (Array.isArray(res)) {
        setRegistrations(res);
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi khi tải danh sách chờ duyệt");
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
      if (actionModal.type === "PREPARE") {
        await adminService.approveRegistration(actionModal.id);
        showToast(
          "success",
          "Đã duyệt sơ bộ! Email thông báo đã gửi cho Provider.",
        );
      } else if (actionModal.type === "FINALIZE") {
        await adminService.finalizeRegistration(actionModal.id);
        showToast(
          "success",
          "Đã duyệt chính thức! Email kèm mật khẩu đã được gửi cho Provider.",
        );
      } else if (actionModal.type === "REJECT") {
        if (!rejectReason.trim()) {
          showToast("error", "Vui lòng nhập lý do từ chối!");
          setIsSubmitting(false);
          return;
        }
        await adminService.rejectRegistration(actionModal.id, rejectReason);
        showToast("success", "Từ chối thành công!");
      }
      setActionModal(null);
      setRejectReason("");
      fetchRegistrations();
    } catch (err) {
      const backendMessage = err.response?.data?.message || err.response?.data?.errors?.[0] || err.message;
      showToast("error", "Lỗi: " + backendMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Danh sách theo trạng thái
  const pendingList = registrations.filter(
    (f) => f.verification_status === "PENDING_REVIEW",
  );
  const preparingList = registrations.filter(
    (f) => f.verification_status === "PREPARING",
  );
  const inspectedList = registrations.filter(
    (f) => f.verification_status === "INSPECTED",
  );

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const renderCard = (facility) => {
    const isPending = facility.verification_status === "PENDING_REVIEW";
    return (
      <div
        key={facility.id}
        className={`rounded-2xl border p-4 md:p-5 space-y-4 ${isPending ? "border-amber-200 bg-amber-50/50" : "border-blue-200 bg-blue-50/50"}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isPending ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                  ⏳ Chờ duyệt sơ bộ
                </span>
              ) : facility.verification_status === "PREPARING" ? (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  🚶‍♂️ Đang khảo sát thực địa
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  ✅ Đã khảo sát - Chờ duyệt
                </span>
              )}
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

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Provider
            </p>
            <p className="font-bold text-slate-800 truncate">
              {facility.provider?.full_name}
            </p>
            <p className="text-slate-500 text-xs truncate">
              {facility.provider?.email}
            </p>
            <p className="text-slate-500 text-xs">
              {facility.provider?.phone_number}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100">
            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">
              Sức chứa
            </p>
            <p className="font-bold text-slate-800 text-lg">
              {facility.capacity} xe
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-teal-100 col-span-2 md:col-span-1">
            <p className="text-xs text-teal-600 font-semibold uppercase mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Phí nền tảng
            </p>
            <p className="font-extrabold text-teal-800">
              {Number(facility.system_fee || 0).toLocaleString("vi-VN")} VNĐ
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end border-t border-slate-200 pt-4">
          <button
            onClick={() => setDetailsModal(facility)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition mr-auto"
          >
            <Eye className="w-4 h-4" /> Xem chi tiết
          </button>

          {isPending && (
            <button
              onClick={() => setActionModal({ type: "REJECT", id: facility.id })}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition"
            >
              <XCircle className="w-4 h-4" /> Từ chối
            </button>
          )}

          {isPending ? (
            <button
              onClick={() =>
                setActionModal({ type: "PREPARE", id: facility.id })
              }
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow transition"
            >
              <Wrench className="w-4 h-4" /> Duyệt sơ bộ &amp; Giao khảo sát
            </button>
          ) : (
            <button
              onClick={() =>
                setActionModal({ type: "FINALIZE", id: facility.id })
              }
              disabled={facility.verification_status === "PREPARING"}
              title={facility.verification_status === "PREPARING" ? "Chờ nhân viên khảo sát hoàn tất thực địa" : "Có thể phê duyệt"}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl shadow transition ${
                facility.verification_status === "PREPARING" 
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed opacity-70"
                  : "bg-teal-600 hover:bg-teal-700 text-white"
              }`}
            >
              <CheckCircle className="w-4 h-4" /> Hoàn tất phê duyệt &amp; Cấp mật khẩu
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tiến trình duyệt */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-md">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Quản Lý Phê Duyệt Bãi Đỗ
          Xe
        </h3>
        {/* Workflow steps */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full">
            ⏳ Chờ duyệt sơ bộ ({pendingList.length})
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full">
            🚶‍♂️ Đang khảo sát ({preparingList.length})
          </span>
          <ChevronRight className="w-4 h-4" />
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full">
            ✅ Đã khảo sát ({inspectedList.length})
          </span>
        </div>
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
            Hiện tại không có yêu cầu nào cần xử lý.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chờ duyệt sơ bộ */}
          {pendingList.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wide px-1">
                ⏳ Chờ duyệt sơ bộ ({pendingList.length})
              </h4>
              {pendingList.map(renderCard)}
            </div>
          )}
          {/* Đang khảo sát */}
          {preparingList.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide px-1 mt-6">
                🚶‍♂️ Đang khảo sát thực địa ({preparingList.length})
              </h4>
              {preparingList.map(renderCard)}
            </div>
          )}
          {/* Đã khảo sát, chờ cấp mật khẩu */}
          {inspectedList.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wide px-1 mt-6">
                ✅ Đã khảo sát - Chờ phê duyệt chính thức ({inspectedList.length})
              </h4>
              {inspectedList.map(renderCard)}
            </div>
          )}
        </div>
      )}

      {/* Modal xác nhận */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            {actionModal.type === "PREPARE" && (
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                  Xác nhận Duyệt Sơ Bộ
                </h3>
                <p className="text-center text-slate-500 text-sm mb-6">
                  Bạn cam kết sẽ{" "}
                  <strong>đến thực địa và chuẩn bị dữ liệu</strong> cho cơ sở
                  này. Email thông báo sẽ được gửi đến Provider ngay lập tức.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAction}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition disabled:opacity-50"
                  >
                    Xác nhận
                  </button>
                </div>
              </>
            )}
            {actionModal.type === "FINALIZE" &&
              (() => {
                const selectedFacility = registrations.find(
                  (f) => f.id === actionModal.id,
                );
                return (
                  <>
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                      Phê Duyệt Chính Thức
                    </h3>
                    <p className="text-center text-slate-500 text-sm mb-6">
                      Nhân viên khảo sát đã hoàn tất báo cáo và hình ảnh. Bạn có chắc chắn muốn duyệt và cấp mật khẩu cho bãi đỗ xe này?
                    </p>

                    {selectedFacility && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5 text-sm space-y-1">
                        <p>
                          <span className="text-slate-500">Tên bãi:</span>{" "}
                          <strong className="text-slate-900">
                            {selectedFacility.name}
                          </strong>
                        </p>
                        <p>
                          <span className="text-slate-500">Sức chứa thực tế:</span>{" "}
                          <strong className="text-slate-900">
                            {selectedFacility.capacity} xe
                          </strong>
                        </p>
                        <p>
                          <span className="text-slate-500">Giá thuê:</span>{" "}
                          <strong className="text-teal-700 font-bold">
                            {Number(
                              selectedFacility.price_per_month,
                            ).toLocaleString("vi-VN")}{" "}
                            VNĐ/tháng
                          </strong>
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => {
                          setActionModal(null);
                        }}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                      >
                        Hủy
                      </button>
                      <button
                        disabled={isSubmitting}
                        onClick={confirmAction}
                        className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200 transition disabled:opacity-50"
                      >
                        Duyệt &amp; Cấp Mật Khẩu
                      </button>
                    </div>
                  </>
                );
              })()}
            {actionModal.type === "REJECT" && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
                  Từ chối đăng ký
                </h3>
                <p className="text-center text-slate-500 text-sm mb-4">
                  Vui lòng cung cấp lý do để thông báo cho Provider khắc phục.
                </p>
                <div className="flex flex-wrap gap-2 mb-3 justify-center">
                  <button
                    onClick={() =>
                      setRejectReason(
                        "Thông tin bãi đỗ xe không đầy đủ hoặc thiếu chính xác.",
                      )
                    }
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition"
                  >
                    Thiếu thông tin
                  </button>

                  <button
                    onClick={() =>
                      setRejectReason("Vị trí hoặc giá cước không hợp lệ.")
                    }
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-full transition"
                  >
                    Vị trí/Giá sai
                  </button>
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do hoặc chọn gợi ý bên trên..."
                  className="w-full p-4 border border-slate-200 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none h-24 text-sm"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setActionModal(null);
                      setRejectReason("");
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={confirmAction}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition disabled:opacity-50"
                  >
                    Xác nhận Từ chối
                  </button>
                </div>
              </>
            )}
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
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${toast.type === "success"
              ? "bg-teal-50 border-teal-200 text-teal-900"
              : "bg-red-50 border-red-200 text-red-900"
              }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-6 h-6 text-teal-600 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            )}
            <p className="font-bold text-sm">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationsPanel;
