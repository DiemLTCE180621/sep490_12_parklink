import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Save, CheckCircle2,
  Loader2, Power
} from 'lucide-react';
import platformFeeService from '../../services/platformFeeService';
import Toast from '../../components/common/Toast';

const AdminPlatformFeeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('admin', { keyPrefix: 'platformFees.form' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [existingFees, setExistingFees] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    min_slots: '1',
    max_slots: '3',
    fee_amount: '',
    description: '',
    is_active: true
  });

  // Tải thông tin gói biểu phí cần sửa và danh sách các gói khác để check trùng
  useEffect(() => {
    const loadFeeData = async () => {
      try {
        setLoading(true);

        const [feeRes, allFeesRes] = await Promise.all([
          platformFeeService.getPlatformFeeById(id),
          platformFeeService.getPlatformFees()
        ]);

        const fee = feeRes?.data || feeRes;
        const allFees = Array.isArray(allFeesRes?.data) ? allFeesRes.data : (Array.isArray(allFeesRes) ? allFeesRes : []);
        setExistingFees(allFees);

        if (!fee) {
          setToast({ key: 'errors.notFound', type: 'error' });
          return;
        }

        const maxSlotsVal = (fee.max_slots === null || fee.max_slots === undefined) ? '15' : String(fee.max_slots);

        setFormData({
          name: fee.name || '',
          min_slots: fee.min_slots !== undefined && fee.min_slots !== null ? String(fee.min_slots) : '1',
          max_slots: maxSlotsVal,
          fee_amount: fee.fee_amount !== undefined && fee.fee_amount !== null ? String(fee.fee_amount) : '',
          description: fee.description || '',
          is_active: fee.is_active ?? true
        });
      } catch (err) {
        setToast({ key: 'errors.load', detail: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadFeeData();
    }
  }, [id]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setToast({ key: 'errors.name', type: 'error' });
      return;
    }

    const minSlots = parseInt(formData.min_slots, 10);
    if (isNaN(minSlots) || minSlots < 1) {
      setToast({ key: 'errors.minSlots', type: 'error' });
      return;
    }

    if (minSlots > 15) {
      setToast({ key: 'errors.slotLimit', type: 'error' });
      return;
    }

    if (!formData.max_slots) {
      setToast({ key: 'errors.maxSlotsRequired', type: 'error' });
      return;
    }

    const maxSlots = parseInt(formData.max_slots, 10);
    if (isNaN(maxSlots) || maxSlots < minSlots) {
      setToast({ message: t('errors.slotOrder', { min: minSlots }), type: 'error' });
      return;
    }

    if (maxSlots > 15) {
      setToast({ key: 'errors.slotLimit', type: 'error' });
      return;
    }

    // Kiểm tra trùng lặp (chồng lấn) với các gói khác (loại trừ chính gói đang sửa)
    for (const fee of existingFees) {
      if (Number(fee.id) === Number(id)) continue; // Bỏ qua chính nó

      const existingMin = fee.min_slots;
      const existingMax = fee.max_slots !== null ? fee.max_slots : 15;

      if (minSlots <= existingMax && maxSlots >= existingMin) {
        setToast({
          message: t('errors.overlap', { min: minSlots, max: maxSlots, name: fee.name, existingMin, existingMax }),
          type: 'error'
        });
        return;
      }
    }

    const amount = parseFloat(formData.fee_amount);
    if (isNaN(amount) || amount < 0) {
      setToast({ key: 'errors.amount', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        min_slots: minSlots,
        max_slots: maxSlots,
        fee_amount: amount,
        description: formData.description ? formData.description.trim() : null,
        is_active: formData.is_active
      };

      await platformFeeService.updatePlatformFee(id, payload);

      navigate('/dashboard', {
        replace: true,
        state: {
          adminTab: 'platform-fees',
          message: t('updated', { name: payload.name }),
          type: 'success'
        }
      });
    } catch (err) {
      setToast({ key: 'errors.save', detail: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const parsedMin = parseInt(formData.min_slots, 10) || 1;

  if (loading) {
    return (
      <div className="py-20 bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-9 h-9 animate-spin text-teal-600 mb-3" />
        <p className="font-semibold text-sm">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-slate-50 w-full">
      {toast && (
        <Toast
          message={toast.message || (i18n.resolvedLanguage === 'vi' && toast.detail) || t(toast.key)}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={2500}
        />
      )}

      <div className="w-full max-w-6xl mx-auto space-y-4">
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => navigate('/dashboard', { state: { adminTab: 'platform-fees' } })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>

        {/* Khung Form Duy Nhất Trải Rộng Toàn Màn Hình */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden w-full">
          {/* Header Card Banner */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-black shadow-sm">
                <DollarSign className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{t('editTitle')}</span>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    #{id}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Nội dung form bên trong khung */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {/* Hàng 1: Tên Gói & Mức Phí Nền Tảng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="platform-fee-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('name')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="platform-fee-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-semibold transition bg-slate-50/40 focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="platform-fee-amount" className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('amount')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="platform-fee-amount"
                    type="number"
                    step="50000"
                    min="0"
                    required
                    value={formData.fee_amount}
                    onChange={(e) => handleChange('fee_amount', e.target.value)}
                    placeholder={t('amountPlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-extrabold transition pr-16 bg-slate-50/40 focus:bg-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    {t('currency')}
                  </span>
                </div>
              </div>
            </div>

            {/* Hàng 2: Slot Min & Slot Max (Giới hạn 15 chỗ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="platform-fee-minSlots" className="text-xs font-bold text-slate-700">
                    {t('minSlots')} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">{t('slotRangeHint')}</span>
                </div>
                <input
                  id="platform-fee-minSlots"
                  type="number"
                  min="1"
                  max="15"
                  required
                  value={formData.min_slots}
                  onChange={(e) => handleChange('min_slots', e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-bold transition bg-slate-50/40 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="platform-fee-maxSlots" className="text-xs font-bold text-slate-700">
                    {t('maxSlots')} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                    {t('maxSlotsHint')}
                  </span>
                </div>
                <input
                  id="platform-fee-maxSlots"
                  type="number"
                  min={parsedMin}
                  max="15"
                  required
                  value={formData.max_slots}
                  onChange={(e) => handleChange('max_slots', e.target.value)}
                  placeholder={t('maxSlotsPlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm font-bold transition bg-slate-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Hàng 3: Trạng thái hoạt động */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {t('status')}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card Kích hoạt */}
                <button
                  type="button"
                  onClick={() => handleChange('is_active', true)}
                  aria-pressed={formData.is_active}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${formData.is_active
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 text-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${formData.is_active ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                      }`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${formData.is_active ? 'text-emerald-950 font-extrabold' : 'text-slate-800'}`}>
                        {t('active')}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {t('activeHint')}
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${formData.is_active ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                    }`}>
                    {formData.is_active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                {/* Card Tạm ngưng */}
                <button
                  type="button"
                  onClick={() => handleChange('is_active', false)}
                  aria-pressed={!formData.is_active}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${!formData.is_active
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 text-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!formData.is_active ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                      }`}>
                      <Power className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${!formData.is_active ? 'text-amber-950 font-extrabold' : 'text-slate-800'}`}>
                        {t('inactive')}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {t('inactiveHint')}
                      </div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${!formData.is_active ? 'border-amber-600 bg-amber-600' : 'border-slate-300 bg-white'
                    }`}>
                    {!formData.is_active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Mô Tả Gói Phí */}
            <div>
              <label htmlFor="platform-fee-description" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('description')} <span className="text-slate-400 font-normal">{t('optional')}</span>
              </label>
              <textarea
                id="platform-fee-description"
                rows="3"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium text-sm transition resize-none bg-slate-50/40 focus:bg-white"
              />
            </div>

            {/* Nút Hành Động */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => navigate('/dashboard', { state: { adminTab: 'platform-fees' } })}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition"
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('save')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPlatformFeeEditPage;
