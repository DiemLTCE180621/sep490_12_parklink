import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import FacilityLocationPicker from '../../components/common/FacilityLocationPicker';

const AdminFacilityEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFacility = async () => {
      try {
        const response = await adminService.getAllFacilities();
        const facility = (response.data || []).find((item) => String(item.id) === String(id));
        if (!facility) {
          setError('Không tìm thấy cơ sở cần cập nhật.');
          return;
        }
        setForm({
          name: facility.name || '',
          address: facility.address || '',
          latitude: facility.latitude ?? '',
          longitude: facility.longitude ?? '',
          capacity: facility.capacity ?? '',
          price_per_month: facility.price_per_month ?? '',
          system_fee: facility.system_fee ?? '',
        });
      } catch (loadError) {
        setError(loadError.message || 'Không thể tải thông tin cơ sở.');
      } finally {
        setLoading(false);
      }
    };

    loadFacility();
  }, [id]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLocationChange = (location) => {
    setForm((current) => ({ ...current, ...location }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminService.updateFacility(id, form);
      navigate('/dashboard', { replace: true, state: { adminTab: 'facilities' } });
    } catch (saveError) {
      setError(saveError.message || 'Không thể cập nhật cơ sở.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-600">Đang tải thông tin cơ sở...</div>;
  }

  if (!form) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="text-teal-700 font-bold">
          Quay lại dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/dashboard', { state: { adminTab: 'facilities' } })}
          className="mb-5 inline-flex items-center gap-2 text-slate-600 hover:text-teal-700 font-bold"
        >
          <ArrowLeft className="w-5 h-5" /> Quay lại danh sách cơ sở
        </button>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-9 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Cập Nhật Thông Tin Cơ Sở</h1>
              <p className="text-sm text-slate-500">Cập nhật thông tin và vị trí trên bản đồ.</p>
            </div>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tên bãi đỗ xe</label>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Địa chỉ và vị trí GPS</label>
            <FacilityLocationPicker
              address={form.address}
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={handleLocationChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ['capacity', 'Sức chứa (slots)'],
              ['price_per_month', 'Giá thuê/tháng (VNĐ)'],
              ['system_fee', 'Phí nền tảng (VNĐ)'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={form[field]}
                  onChange={(event) => updateField(field, event.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => navigate('/dashboard', { state: { adminTab: 'facilities' } })} className="px-5 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold inline-flex items-center gap-2 disabled:opacity-60">
              <Save className="w-5 h-5" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFacilityEditPage;
