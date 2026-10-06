import React from 'react';
import { XCircle, Building2, User, MapPin } from 'lucide-react';

const FacilityDetailsModal = ({ facility, onClose }) => {
  if (!facility) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition"
        >
          <XCircle className="w-5 h-5" />
        </button>
        
        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-teal-600" /> Chi Tiết Yêu Cầu Đăng Ký
        </h3>
        
        <div className="space-y-6">
          {/* Thông tin chủ bãi */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><User className="w-5 h-5 text-teal-600" /> Thông tin Chủ bãi (Provider)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">Họ và tên:</span>
                <span className="font-semibold text-slate-900">{facility.provider?.full_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Số điện thoại:</span>
                <span className="font-semibold text-slate-900">{facility.provider?.phone_number || 'Chưa cập nhật'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1">Email:</span>
                <span className="font-semibold text-slate-900">{facility.provider?.email}</span>
              </div>
            </div>
          </div>

          {/* Thông tin bãi đỗ xe */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-teal-600" /> Thông tin Bãi đỗ xe</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1">Tên bãi đỗ xe:</span>
                <span className="font-semibold text-slate-900 text-lg">{facility.name}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1">Địa chỉ chi tiết:</span>
                <span className="font-semibold text-slate-900">{facility.address}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Sức chứa:</span>
                <span className="font-semibold text-slate-900">{facility.capacity} xe</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Giá thuê mong muốn:</span>
                <span className="font-extrabold text-teal-700 text-base">{Number(facility.price_per_month).toLocaleString('vi-VN')} VNĐ/tháng</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailsModal;
