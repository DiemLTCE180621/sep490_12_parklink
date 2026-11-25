import React, { useState, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus,
  Loader2, Calculator, CheckCircle2,
  Power
} from 'lucide-react';
import platformFeeService from '../../services/platformFeeService';
import Toast from '../../components/common/Toast';

const AdminPlatformFeeCreatePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('admin', { keyPrefix: 'platformFees.form' });

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [existingFees, setExistingFees] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    min_slots: '',
    max_slots: '',
    fee_amount: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    const fetchExistingFees = async () => {
      try {
        const res = await platformFeeService.getPlatformFees();
        const fees = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setExistingFees(fees);
      } catch (err) {
        console.error('Không thể tải danh sách biểu phí hiện có:', err);
      }
    };
    fetchExistingFees();
  }, []);

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

    // Kiểm tra trùng lặp  với các gói đã có trong hệ thống
    for (const fee of existingFees) {
      const existingMin = fee.min_slots;
      const existingMax = fee.max_slots !== null ? fee.max_slots : 15;

      // Công thức kiểm tra giao thoa: minA <= maxB && maxA >= minB
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
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        min_slots: minSlots,
        max_slots: maxSlots,
        fee_amount: amount,
        description: formData.description ? formData.description.trim() : null,
        is_active: formData.is_active
      };

      await platformFeeService.createPlatformFee(payload);

      navigate('/dashboard', {
        replace: true,
        state: {
          adminTab: 'platform-fees',
          message: t('created', { name: payload.name }),
          type: 'success'
        }
      });
    } catch (err) {
      setToast({ key: 'errors.create', detail: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const parsedAmount = parseFloat(formData.fee_amount) || 0;
  const parsedMin = parseInt(formData.min_slots, 10);
  const parsedMax = parseInt(formData.max_slots, 10);
  const amountLabel = parsedAmount.toLocaleString(i18n.resolvedLanguage === 'en' ? 'en-GB' : 'vi-VN');
  const slotLabel = parsedMin === parsedMax
    ? t('ruleExactSlots', { count: parsedMin })
    : t('ruleSlotRange', { min: parsedMin, max: Number.isNaN(parsedMax) ? '…' : parsedMax });

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 bg-slate-50 w-full min-h-[calc(100vh-70px)] flex flex-col justify-between">
      {toast && (
        <Toast
          message={toast.message || (i18n.resolvedLanguage === 'vi' && toast.detail) || t(toast.key)}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={2500}
        />
      )}

      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col space-y-3">
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => navigate('/dashboard', { state: { adminTab: 'platform-fees' } })}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>

        {/* Khung Form Duy Nhất Trải Rộng Toàn Màn Hình */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden w-full flex-1 flex flex-col">
          {/* Header Card Banner */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-black shadow-sm shrink-0">
                <Plus className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  {t('createTitle')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Nội dung form bên trong khung */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Hàng 1: Tên Gói & Mức Phí Nền Tảng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="platform-fee-name" className="block text-xs font-bold text-slate-700 mb-2">
                    {t('name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="platform-fee-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder={t('namePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-semibold transition bg-slate-50/40 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="platform-fee-amount" className="block text-xs font-bold text-slate-700 mb-2">
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-extrabold transition pr-16 bg-slate-50/40 focus:bg-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      {t('currency')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hàng 2: Slot Min & Slot Max (Giới hạn tối đa 15 chỗ) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
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
                    placeholder={t('minSlotsExample')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-bold transition bg-slate-50/40 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
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
                    min={!isNaN(parsedMin) && parsedMin >= 1 ? parsedMin : 1}
                    max="15"
                    required
                    value={formData.max_slots}
                    onChange={(e) => handleChange('max_slots', e.target.value)}
                    placeholder={t('maxSlotsExample')}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm font-bold transition bg-slate-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Hàng 3: Trạng thái áp dụng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t('status')} <span className="text-slate-400 font-normal">{t('statusHint')}</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card Kích hoạt */}
                  <button
                    type="button"
                    onClick={() => handleChange('is_active', true)}
                    aria-pressed={formData.is_active}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${formData.is_active
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 text-slate-600'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formData.is_active ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
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
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left ${!formData.is_active
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/30 text-slate-600'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!formData.is_active ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
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

              {/* Thanh Tóm Tắt Quy Tắc Áp Dụng */}
              {parsedAmount > 0 && !isNaN(parsedMin) && (
                <div className="p-4 bg-teal-50/80 border border-teal-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 text-teal-950 font-medium">
                    <Calculator className="w-5 h-5 text-teal-600 shrink-0" />
                    <span>
                      <Trans
                        ns="admin"
                        i18nKey="platformFees.form.rule"
                        values={{ fee: t('ruleFee', { amount: amountLabel }), slots: slotLabel }}
                        components={{ strong: <strong className="text-teal-900 font-extrabold" /> }}
                      />
                    </span>
                  </div>
                  <span className="font-extrabold text-teal-800 bg-white px-3.5 py-1.5 rounded-xl border border-teal-200 shadow-2xs shrink-0 self-start sm:self-auto text-xs">
                    {t('feePerFacility', { amount: amountLabel })}
                  </span>
                </div>
              )}

              {/* Mô Tả Gói Phí */}
              <div>
                <label htmlFor="platform-fee-description" className="block text-xs font-bold text-slate-700 mb-2">
                  {t('description')} <span className="text-slate-400 font-normal">{t('optional')}</span>
                </label>
                <textarea
                  id="platform-fee-description"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium text-sm transition resize-none bg-slate-50/40 focus:bg-white"
                />
              </div>
            </div>

            {/* Nút Hành Động */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => navigate('/dashboard', { state: { adminTab: 'platform-fees' } })}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition"
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('creating')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{t('create')}</span>
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

export default AdminPlatformFeeCreatePage;
