import React, { useState, useEffect, useRef } from 'react';
import addressService from '../../services/addressService';
import { Loader2 } from 'lucide-react';

// Component chọn địa chỉ 2 cấp (Tỉnh/Thành -> Phường/Xã)
const AddressSelector = ({ value = '', onChange }) => {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const initialValueRef = useRef(value);

  // Tải danh sách Tỉnh / Thành phố
  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const list = await addressService.getProvinces();
        if (!isMounted) return;
        setProvinces(list);

        const initialVal = initialValueRef.current;
        let matched = null;
        if (initialVal) {
          matched = list.find((p) => initialVal.toLowerCase().includes(p.name.toLowerCase()));
        }
        if (!matched) {
          matched = list.find((p) => p.code === 92 || p.codename?.includes('can_tho')) || list[0];
        }

        if (matched) {
          setSelectedProvinceCode(matched.code);
        }
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

  // Tải danh sách Phường / Xã theo tỉnh
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

        const initialVal = initialValueRef.current;
        let matchedWard = null;
        if (initialVal) {
          matchedWard = wList.find((w) => {
            const rawName = w.name.replace(/^(Phường|Xã|Thị trấn)\s+/i, '').trim().toLowerCase();
            return initialVal.toLowerCase().includes(w.name.toLowerCase()) || (rawName && initialVal.toLowerCase().includes(rawName));
          });
        }

        if (matchedWard) {
          setSelectedWardCode(matchedWard.code);
        } else if (!initialVal && wList.length > 0) {
          setSelectedWardCode(wList[0].code);
          const p = provinces.find((item) => Number(item.code) === Number(selectedProvinceCode));
          if (p && onChange) {
            onChange(`${wList[0].name}, ${p.name}`);
          }
        }
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

  const handleProvinceChange = (e) => {
    const code = Number(e.target.value);
    setSelectedProvinceCode(code);
    setSelectedWardCode('');
    initialValueRef.current = '';
  };

  const handleWardChange = (e) => {
    const code = Number(e.target.value);
    setSelectedWardCode(code);
    initialValueRef.current = '';

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
            Tỉnh / Thành Phố
          </label>
          <div className="relative">
            <select
              value={selectedProvinceCode}
              onChange={handleProvinceChange}
              disabled={loadingProvinces || provinces.length === 0}
              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium disabled:bg-slate-100"
            >
              {provinces.length === 0 ? (
                <option value="">Đang tải Tỉnh / Thành...</option>
              ) : (
                provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
            {loadingProvinces && (
              <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Phường / Xã
          </label>
          <div className="relative">
            <select
              value={selectedWardCode}
              onChange={handleWardChange}
              disabled={loadingWards || wards.length === 0}
              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-medium disabled:bg-slate-100"
            >
              {wards.length === 0 ? (
                <option value="">{loadingWards ? 'Đang tải Phường / Xã...' : '-- Chọn Phường / Xã --'}</option>
              ) : (
                wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))
              )}
            </select>
            {loadingWards && (
              <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin absolute right-3 top-3 pointer-events-none" />
            )}
          </div>
        </div>
      </div>

      {value && (
        <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 flex items-center justify-between">
          <span>
            Địa chỉ đã chọn: <strong className="text-teal-700 font-semibold">{value}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default AddressSelector;
