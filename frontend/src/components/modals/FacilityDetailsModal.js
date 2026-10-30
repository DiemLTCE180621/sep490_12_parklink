import React from 'react';
import { X, Building2, User, MapPin } from 'lucide-react';

const FacilityDetailsModal = ({ facility, onClose, title = 'Chi Tiết Cơ Sở Bãi Đỗ Xe' }) => {
  if (!facility) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-teal-600" /> {title}
        </h3>
        
        <div className="space-y-6">
          {/* Thông tin chủ bãi */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
              <User className="w-4 h-4 text-teal-600" /> Thông tin Chủ bãi (Provider)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Họ và tên:</span>
                <span className="font-semibold text-slate-900 text-sm">{facility.provider?.full_name || 'Chưa cập nhật'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Số điện thoại:</span>
                <span className="font-semibold text-slate-900 text-sm font-mono">{facility.provider?.phone_number || 'Chưa cập nhật'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1">Email:</span>
                <span className="font-semibold text-slate-900 text-sm">{facility.provider?.email || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>

          {/* Thông tin bãi đỗ xe */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
              <MapPin className="w-4 h-4 text-teal-600" /> Thông tin Cơ sở Bãi đỗ xe
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1">Tên bãi đỗ xe:</span>
                <span className="font-bold text-slate-900 text-base">{facility.name}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1">Địa chỉ chi tiết:</span>
                <span className="font-semibold text-slate-800 text-sm">{facility.address}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Sức chứa:</span>
                <span className="font-semibold text-slate-900 text-sm">{facility.capacity || 0} xe</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Giá thuê:</span>
                <span className="font-extrabold text-teal-700 text-sm">
                  {facility.price_per_month ? `${Number(facility.price_per_month).toLocaleString('vi-VN')} VNĐ/tháng` : 'Chưa định giá'}
                </span>
              </div>
            </div>
          </div>

          {/* Hình ảnh cơ sở */}
          {facility.images && facility.images.length > 0 && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-800 mb-3 text-sm">
                Hình ảnh cơ sở ({facility.images.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {facility.images.map((img, idx) => (
                  <a
                    key={img.id || idx}
                    href={img.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-video rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition group relative"
                  >
                    <img
                      src={img.image_url}
                      alt={`facility-${idx}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {img.is_primary && (
                      <span className="absolute top-1 left-1 bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        Ảnh chính
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailsModal;
