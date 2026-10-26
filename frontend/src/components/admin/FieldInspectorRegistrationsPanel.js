import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import inspectorService from '../../services/inspectorService';
import {
  Wrench,
  Building2,
  MapPin,
  User,
  Phone,
  Search,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Car
} from 'lucide-react';

/**
 * FieldInspectorRegistrationsPanel: Giao diện Khảo Sát Thực Địa cho Nhân viên khảo sát
 * Thiết kế đồng bộ chuẩn bảng (Table layout, Search toolbar, điều hướng /id trực tiếp - KHÔNG POPUP)
 */
const FieldInspectorRegistrationsPanel = () => {
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await inspectorService.getPreparingFacilities();
      if (res && res.status === 'success') {
        setRegistrations(res.data || []);
      } else if (Array.isArray(res)) {
        setRegistrations(res);
      } else {
        setRegistrations(res?.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải danh sách bãi xe chờ khảo sát');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      const matchSearch =
        (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.address || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.provider?.phone_number || '').toLowerCase().includes(search.toLowerCase());

      return matchSearch;
    });
  }, [registrations, search]);

  // Phân trang
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRegistrations.slice(start, start + itemsPerPage);
  }, [filteredRegistrations, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setCurrentPage(1);
    fetchRegistrations();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-teal-600" /> Công Việc Khảo Sát Thực Địa
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Danh sách các bãi đỗ xe đã duyệt sơ bộ, cần nhân viên khảo sát đến kiểm tra thực tế và cập nhật dữ liệu
          </p>
        </div>
        <div className="text-xs font-semibold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
          Cần thực địa: <strong className="text-teal-700 font-extrabold">{registrations.length}</strong> cơ sở
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên bãi xe, địa chỉ hoặc tên chủ bãi..."
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 border border-slate-200"
          title="Làm mới danh sách"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> Làm mới
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          <span>Đang tải danh sách công việc khảo sát...</span>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-teal-400" />
          <p className="font-semibold text-sm">Bạn chưa được phân công khảo sát cơ sở nào.</p>
          <p className="text-xs text-slate-400 mt-1">Vui lòng đợi thông báo hoặc phân công khảo sát từ Quản trị viên.</p>
        </div>
      ) : (
        /* Data Table */
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4 min-w-[280px]">Cơ sở bãi đỗ xe</th>
                <th className="py-3.5 px-4 min-w-[180px]">Chủ bãi (Provider)</th>
                <th className="py-3.5 px-4">Đề xuất ban đầu</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedList.map((facility) => (
                <tr key={facility.id} className="hover:bg-slate-50/80 transition">
                  {/* ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                    #{facility.id}
                  </td>

                  {/* Facility Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-700 mt-0.5">
                        {facility.images && facility.images.length > 0 ? (
                          <img
                            src={facility.images[0].image_url}
                            alt=""
                            className="w-10 h-10 object-cover rounded-xl"
                          />
                        ) : (
                          <Building2 className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <button
                          onClick={() => navigate(`/inspector/registrations/${facility.id}`)}
                          className="font-bold text-slate-900 hover:text-teal-700 transition text-left line-clamp-1"
                        >
                          {facility.name}
                        </button>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {facility.address}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Provider Info */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {facility.provider?.full_name || 'N/A'}
                      </div>
                      {facility.provider?.phone_number && (
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {facility.provider?.phone_number}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Capacity */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-teal-600" />
                      {facility.capacity} xe
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border border-sky-300">
                      <Wrench className="w-3.5 h-3.5 text-sky-600" /> Đang chờ khảo sát
                    </span>
                  </td>

                  {/* Actions - Dẫn thẳng vào trang /id để báo cáo thực địa */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/inspector/registrations/${facility.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                      title="Vào trang báo cáo kết quả khảo sát thực tế"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Báo cáo thực địa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-600">
          <div>
            Trang <strong>{currentPage}</strong> / {totalPages} (Tổng{' '}
            {filteredRegistrations.length} cơ sở)
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-40 flex items-center gap-1 font-semibold"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldInspectorRegistrationsPanel;
