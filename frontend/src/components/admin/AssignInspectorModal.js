import React, { useState, useEffect, useMemo } from 'react';
import fieldInspectorService from '../../services/fieldInspectorService';
import {
  UserCheck,
  Search,
  MapPin,
  Mail,
  Phone,
  Check,
  RotateCcw,
  AlertCircle,
  X,
  Building2,
  Briefcase
} from 'lucide-react';

/**
 * AssignInspectorModal: Modal phân công nhân viên khảo sát thực địa
 * - Kích thước cố định tuyệt đối (Fixed Dimensions): h-[85vh] min-h-[600px], không bao giờ co rút hay biến dạng dù ít hay nhiều nhân viên
 * - Mở rộng tối đa (max-w-4xl / md:max-w-5xl)
 * - Cuộn chuột mượt mà (Mouse Wheel Scrolling) với thanh cuộn tùy biến
 */
const AssignInspectorModal = ({
  isOpen,
  onClose,
  onConfirm,
  facilityName,
  facilityAddress,
  currentInspectorId = null,
  isSubmitting = false,
  title = 'Duyệt Sơ Bộ & Phân Công Khảo Sát',
  confirmText = 'Xác nhận duyệt & Giao việc'
}) => {
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');

  // Bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [workloadFilter, setWorkloadFilter] = useState('ALL'); // 'ALL' | 'IDLE' | 'BUSY'

  // Tải danh sách nhân viên khảo sát đang hoạt động khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchInspectors = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fieldInspectorService.getActiveInspectors();
        const list = res?.data || res || [];
        const validList = Array.isArray(list) ? list : [];

        if (isMounted) {
          setInspectors(validList);
          // Mặc định chọn nhân viên hiện tại nếu có, hoặc nhân viên đầu tiên
          if (currentInspectorId) {
            setSelectedId(String(currentInspectorId));
          } else if (validList.length > 0) {
            setSelectedId(String(validList[0].id));
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách nhân viên khảo sát:', err);
        if (isMounted) {
          setError('Không thể tải danh sách nhân viên khảo sát. Vui lòng thử lại!');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInspectors();

    // Reset bộ lọc mỗi khi mở lại modal
    setSearchQuery('');
    setSelectedArea('ALL');
    setWorkloadFilter('ALL');

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentInspectorId]);

  // Trích xuất danh sách các khu vực/quận huyện từ địa chỉ nhân viên
  const availableAreas = useMemo(() => {
    const areas = new Set();
    inspectors.forEach((ins) => {
      if (ins.address) {
        const parts = ins.address.split(',').map((p) => p.trim());
        parts.forEach((part) => {
          if (
            part.toLowerCase().includes('quận') ||
            part.toLowerCase().includes('huyện') ||
            part.toLowerCase().includes('phường') ||
            part.toLowerCase().includes('ninh kiều') ||
            part.toLowerCase().includes('cái răng') ||
            part.toLowerCase().includes('bình thủy') ||
            part.toLowerCase().includes('ô môn') ||
            part.toLowerCase().includes('thốt nốt') ||
            part.toLowerCase().includes('vĩnh long') ||
            part.toLowerCase().includes('cần thơ')
          ) {
            areas.add(part);
          }
        });
      }
    });
    return Array.from(areas);
  }, [inspectors]);

  // Lọc danh sách nhân viên theo từ khóa, khu vực và khối lượng công việc
  const filteredInspectors = useMemo(() => {
    return inspectors.filter((ins) => {
      // 1. Lọc theo từ khóa tìm kiếm
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (ins.full_name || '').toLowerCase().includes(q) ||
        (ins.email || '').toLowerCase().includes(q) ||
        (ins.phone_number || '').toLowerCase().includes(q) ||
        (ins.address || '').toLowerCase().includes(q);

      // 2. Lọc theo khu vực
      const matchArea =
        selectedArea === 'ALL' ||
        (ins.address || '').toLowerCase().includes(selectedArea.toLowerCase());

      // 3. Lọc theo khối lượng công việc (Workload)
      const activeTasks = ins._count?.assigned_facilities || 0;
      let matchWorkload = true;
      if (workloadFilter === 'IDLE') {
        matchWorkload = activeTasks === 0;
      } else if (workloadFilter === 'BUSY') {
        matchWorkload = activeTasks > 0;
      }

      return matchSearch && matchArea && matchWorkload;
    });
  }, [inspectors, searchQuery, selectedArea, workloadFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedArea('ALL');
    setWorkloadFilter('ALL');
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    onConfirm(parseInt(selectedId, 10));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-hidden">
      {/* CSS tùy biến thanh cuộn mượt mà khi lăn con chuột */}
      <style>{`
        .inspector-scroll-area::-webkit-scrollbar {
          width: 7px;
        }
        .inspector-scroll-area::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .inspector-scroll-area::-webkit-scrollbar-thumb {
          background: #0d9488;
          border-radius: 9999px;
        }
        .inspector-scroll-area::-webkit-scrollbar-thumb:hover {
          background: #0f766e;
        }
      `}</style>

      {/* Modal Container: 
          - Mở rộng kích thước: max-w-4xl md:max-w-5xl
          - Khóa cứng chiều cao: h-[85vh] min-h-[600px] max-h-[780px]
          - Bất kể 1 nhân viên hay 50 nhân viên, modal KHÔNG BAO GIỜ bị co lại hay biến dạng!
      */}
      <div className="bg-white rounded-3xl w-full max-w-4xl md:max-w-5xl h-[85vh] min-h-[600px] max-h-[780px] shadow-2xl flex flex-col overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150">
        
        {/* 1. Header cố định ở trên */}
        <div className="px-6 py-4 md:px-8 md:py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-amber-100/80 rounded-2xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉ định nhân viên khảo sát thực địa phụ trách cơ sở bãi đỗ xe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition flex items-center justify-center shrink-0"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Banner bãi đỗ xe & Thanh tìm kiếm / Bộ lọc (Cố định ở trên) */}
        <div className="px-6 py-3.5 md:px-8 border-b border-slate-100 bg-slate-50/60 shrink-0 space-y-3">
          {/* Thông tin tóm tắt cơ sở cần khảo sát */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-center gap-3 text-xs shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 truncate">
                {facilityName || 'Cơ sở bãi đỗ xe'}
              </div>
              {facilityAddress && (
                <div className="text-slate-600 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">{facilityAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Thanh tìm kiếm & Bộ lọc (Search & Filters) */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center">
            {/* Input Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhân viên theo tên, email, SĐT, địa chỉ..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Area */}
            {availableAreas.length > 0 && (
              <div className="relative w-full sm:w-48">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full pl-7 pr-6 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition appearance-none cursor-pointer truncate shadow-sm"
                >
                  <option value="ALL">Mọi khu vực</option>
                  {availableAreas.map((area, idx) => (
                    <option key={idx} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Workload */}
            <div className="relative w-full sm:w-40">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <select
                value={workloadFilter}
                onChange={(e) => setWorkloadFilter(e.target.value)}
                className="w-full pl-7 pr-6 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition appearance-none cursor-pointer shadow-sm"
              >
                <option value="ALL">Mọi tải việc</option>
                <option value="IDLE">Rảnh (0 việc)</option>
                <option value="BUSY">Đang có bãi</option>
              </select>
            </div>
          </div>

          {/* Bar số lượng & Đặt lại */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
            <span>
              Tìm thấy <strong>{filteredInspectors.length}</strong> / {inspectors.length} nhân viên phù hợp
            </span>
            {(searchQuery || selectedArea !== 'ALL' || workloadFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-teal-700 hover:text-teal-800 font-semibold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* 3. Danh sách nhân viên: Cuộn chuột mượt mà (Mouse Wheel Scrolling) */}
        <div
          className="inspector-scroll-area flex-1 min-h-0 overflow-y-auto p-4 md:p-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#0d9488 #f1f5f9'
          }}
        >
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RotateCcw className="w-6 h-6 animate-spin text-teal-600" />
              <span>Đang tải danh sách nhân viên khảo sát...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs text-center space-y-2">
              <p className="font-semibold">{error}</p>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-bold hover:bg-rose-50 transition"
              >
                Đóng
              </button>
            </div>
          ) : inspectors.length === 0 ? (
            <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 text-center space-y-2 my-auto">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <p className="font-bold text-sm">Chưa có nhân viên khảo sát nào trong hệ thống!</p>
              <p className="text-[11px] text-amber-700 max-w-md mx-auto">
                Hiện chưa có tài khoản nhân viên khảo sát thực địa nào đang ở trạng thái Hoạt Động (ACTIVE). Vui lòng vào trang <strong>Quản lý nhân viên</strong> để tạo tài khoản trước khi phân công.
              </p>
            </div>
          ) : filteredInspectors.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs space-y-2 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600">
                Không tìm thấy nhân viên nào phù hợp với bộ lọc.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-teal-700 hover:underline font-semibold"
              >
                Xóa bộ lọc để xem tất cả ({inspectors.length})
              </button>
            </div>
          ) : (
            /* Hiển thị dạng Grid 2 cột rộng rãi, lăn chuột lên xuống thoải mái */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredInspectors.map((inspector) => {
                const isSelected = String(selectedId) === String(inspector.id);
                const activeCount = inspector._count?.assigned_facilities || 0;
                const isCurrent = currentInspectorId && Number(currentInspectorId) === inspector.id;

                return (
                  <div
                    key={inspector.id}
                    onClick={() => setSelectedId(String(inspector.id))}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 shadow-sm ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm transition-colors ${
                          isSelected
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inspector.full_name?.charAt(0) || 'N'}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs md:text-sm font-bold text-slate-900 truncate">
                            {inspector.full_name}
                          </span>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full shrink-0">
                            NV Khảo sát
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                              Đang phụ trách
                            </span>
                          )}
                        </div>

                        {/* Tải công việc */}
                        <div>
                          {activeCount === 0 ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full inline-block">
                              Đang rảnh (0 việc)
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full inline-block">
                              Đang khảo sát {activeCount} bãi
                            </span>
                          )}
                        </div>

                        {/* Thông tin liên hệ */}
                        <div className="text-xs text-slate-500 flex items-center gap-3 pt-0.5 flex-wrap">
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {inspector.email}
                          </span>
                          {inspector.phone_number && (
                            <span className="flex items-center gap-1.5 font-medium text-slate-700 shrink-0">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {inspector.phone_number}
                            </span>
                          )}
                        </div>

                        {/* Địa chỉ nhân viên */}
                        <div className="pt-1 flex items-start gap-1.5 text-xs text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-700 line-clamp-2">
                            <strong>Địa chỉ:</strong> {inspector.address || 'Chưa cập nhật địa chỉ'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Radio checkmark */}
                    <div className="shrink-0 pl-1 pt-0.5">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-teal-600 bg-teal-600 text-white shadow-sm scale-110'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Footer hành động cố định ở dưới */}
        <div className="px-6 py-3.5 md:px-8 md:py-4 border-t border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 hidden sm:block">
            {selectedId ? (
              <span>
                Đang chọn nhân viên:{' '}
                <strong className="text-teal-700">
                  {inspectors.find((i) => String(i.id) === String(selectedId))?.full_name}
                </strong>
              </span>
            ) : (
              <span>Vui lòng chọn 1 nhân viên khảo sát</span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto sm:min-w-[320px]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition text-xs shadow-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSubmitting || !selectedId || filteredInspectors.length === 0}
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50 text-xs font-semibold whitespace-nowrap"
            >
              {isSubmitting ? 'Đang xử lý...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignInspectorModal;

