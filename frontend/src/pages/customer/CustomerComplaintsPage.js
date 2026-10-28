import React, { useEffect, useState, useCallback } from 'react';
import complaintService from '../../services/complaintService';
import { Link } from 'react-router-dom';
import { AlertCircle, Calendar, MapPin, Building2, Clock, CheckCircle2, Loader2, ArrowLeft, Inbox } from 'lucide-react';

const CustomerComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await complaintService.getMyComplaints();
      const list = res.data?.complaints || res.complaints || [];
      setComplaints(list);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách khiếu nại của bạn!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" /> Chờ Xử Lý
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang Xử Lý
          </span>
        );
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã Giải Quyết
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* PREMIUM HEADER BANNER */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 px-6 sm:px-12 py-10 text-white shadow-xl mb-8">
        <div className="w-full flex flex-col gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 font-medium text-sm transition-all self-start hover:bg-white/5 px-4 py-2 rounded-full border border-teal-500/30 hover:border-teal-400 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Dashboard
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Danh Sách Khiếu Nại Của Tôi</h1>
              <p className="text-teal-300 text-sm font-medium mt-1">Theo dõi và xem phản hồi từ Quản trị viên về các khiếu nại của bạn.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 w-full mx-auto">
        <div className="max-w-7xl mx-auto space-y-6">

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
            <p className="text-slate-600 font-semibold text-sm">
              Đang tải danh sách khiếu nại...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-sm text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Không thể tải dữ liệu</h3>
            <p className="text-sm text-slate-600">{error}</p>
            <button
              onClick={fetchComplaints}
              className="px-5 py-2.5 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-teal-700 transition"
            >
              Thử Lại
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Không có khiếu nại nào</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Bạn chưa từng gửi khiếu nại nào lên hệ thống.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-slate-900">{item.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{item.id}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Gửi ngày: {new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="font-bold block mb-1 text-slate-900">Nội dung khiếu nại:</span>
                  <p className="whitespace-pre-wrap">{item.description}</p>
                  {Array.isArray(item.image_urls) && item.image_urls.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {item.image_urls.map((url, index) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <img src={url} alt={`Ảnh khiếu nại ${index + 1}`} className="h-full w-full object-cover hover:opacity-90" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {item.facility && (
                   <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                     <Building2 className="w-4 h-4 text-teal-600" /> Liên quan đến bãi xe: <span className="font-bold text-slate-900">{item.facility.name}</span>
                   </div>
                )}

                {item.admin_response && (
                  <div className="mt-2 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                    <span className="font-bold block mb-1 text-teal-900 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Phản hồi từ Quản trị viên:</span>
                    <p className="text-sm text-teal-800 whitespace-pre-wrap">{item.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default CustomerComplaintsPage;
