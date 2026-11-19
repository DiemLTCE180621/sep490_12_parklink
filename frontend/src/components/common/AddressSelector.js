import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import addressService from '../../services/addressService';
import { Loader2, CheckCircle2 } from 'lucide-react';

const AddressSelector = ({ value = '', onChange }) => {
  const { t } = useTranslation('common');
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const list = await addressService.getProvinces();
        if (!isMounted) return;
        setProvinces(list);
      } catch (err) {
        console.error('Lỗi tải tỉnh/thành:', err);
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };

    fetchProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!value || provinces.length === 0) return;

    const matchedProvince = provinces.find((p) =>
      value.toLowerCase().includes(p.name.toLowerCase())
    );

    if (matchedProvince && String(matchedProvince.code) !== String(selectedProvinceCode)) {
      setSelectedProvinceCode(matchedProvince.code);
    }
  }, [value, provinces, selectedProvinceCode]);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setWards([]);
      setSelectedWardCode('');
      return;
    }

    let isMounted = true;
    const fetchWards = async () => {
      try {
        setLoadingWards(true);
        const wList = await addressService.getWardsByProvince(selectedProvinceCode);
        if (!isMounted) return;
        setWards(wList);
      } catch (err) {
        console.error('Lỗi tải phường/xã:', err);
      } finally {
        if (isMounted) setLoadingWards(false);
      }
    };

    fetchWards();
    return () => {
      isMounted = false;
    };
  }, [selectedProvinceCode]);

  useEffect(() => {
    if (!value || wards.length === 0) return;

    const matchedWard = wards.find((w) => {
      const rawName = w.name.replace(/^(Phường|Xã|Thị trấn)\s+/i, '').trim().toLowerCase();
      return (
        value.toLowerCase().includes(w.name.toLowerCase()) ||
        (rawName && value.toLowerCase().includes(rawName))
      );
    });

    if (matchedWard && String(matchedWard.code) !== String(selectedWardCode)) {
      setSelectedWardCode(matchedWard.code);
    }
  }, [value, wards, selectedWardCode]);

  const handleProvinceChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setSelectedProvinceCode('');
      setSelectedWardCode('');
      if (onChange) onChange('');
      return;
    }
    const code = Number(val);
    setSelectedProvinceCode(code);
    setSelectedWardCode('');
    if (onChange) onChange('');
  };

  const handleWardChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setSelectedWardCode('');
      if (onChange) onChange('');
      return;
    }
    const code = Number(val);
    setSelectedWardCode(code);

    const p = provinces.find((item) => Number(item.code) === Number(selectedProvinceCode));
    const w = wards.find((item) => Number(item.code) === Number(code));

    if (p && w && onChange) {
      onChange(`${w.name}, ${p.name}`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            {t('addressSelector.provinceLabel')}
          </label>
          <div className="relative">
            <select
              value={selectedProvinceCode}
              onChange={handleProvinceChange}
              disabled={loadingProvinces || provinces.length === 0}
              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium disabled:bg-slate-100"
            >
              <option value="">{t('addressSelector.provincePlaceholder')}</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
            {loadingProvinces && (
              <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            {t('addressSelector.wardLabel')}
          </label>
          <div className="relative">
            <select
              value={selectedWardCode}
              onChange={handleWardChange}
              disabled={loadingWards || wards.length === 0 || !selectedProvinceCode}
              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium disabled:bg-slate-100"
            >
              <option value="">{t('addressSelector.wardPlaceholder')}</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
            {loadingWards && (
              <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {value && (
        <div className="px-3.5 py-2 bg-teal-50/70 rounded-xl border border-teal-200/60 text-xs text-teal-900 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            {t('addressSelector.selectedArea')} <strong className="font-bold text-teal-950">{value}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default AddressSelector;
