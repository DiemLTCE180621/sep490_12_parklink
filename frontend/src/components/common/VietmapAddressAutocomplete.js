import React, { useEffect, useRef, useState } from 'react';
import { Building2, Loader2, MapPin } from 'lucide-react';
import vietmapService from '../../services/vietmapService';
import facilityService from '../../services/facilityService';

const getSuggestionLabel = (item) =>
  item?.display
  || item?.address
  || item?.name
  || item?.full_address
  || item?.freeform
  || '';

const normalizeSearchText = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const rankSuggestions = (items, query) => {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 1);

  const ranked = items
    .map((item, index) => {
      const label = getSuggestionLabel(item);
      const normalizedLabel = normalizeSearchText(label);
      const matchesAllTokens = queryTokens.every((token) => normalizedLabel.includes(token));
      const startsWithQuery = normalizedLabel.startsWith(normalizedQuery);
      const containsExactPhrase = normalizedLabel.includes(normalizedQuery);
      const firstMatchingPosition = normalizedLabel.indexOf(queryTokens[0] || normalizedQuery);

      let score = 0;
      if (startsWithQuery) score += 100;
      if (containsExactPhrase) score += 60;
      if (matchesAllTokens) score += 40;
      if (firstMatchingPosition === 0) score += 20;
      score -= Math.min(firstMatchingPosition < 0 ? 100 : firstMatchingPosition, 30);

      return { item, label, normalizedLabel, matchesAllTokens, score, index };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const relevant = ranked.filter((entry) => entry.matchesAllTokens);
  const selected = relevant.length > 0 ? relevant : ranked;
  const seen = new Set();

  return selected
    .filter((entry) => {
      if (seen.has(entry.normalizedLabel)) return false;
      seen.add(entry.normalizedLabel);
      return true;
    })
    .slice(0, 5)
    .map((entry) => entry.item);
};

const VietmapAddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  onFacilitySelect,
  placeholder,
  className = '',
  inputClassName = '',
  required = false,
  disabled = false,
  minChars = 2,
  includeFacilities = false,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [facilitySuggestions, setFacilitySuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const requestIdRef = useRef(0);
  //flag if user is typing
  const userTypedRef = useRef(false);

  useEffect(() => {
    //if value changed because user drag marker, dont trigger search
    if (!userTypedRef.current) {
      setSuggestions([]);
      setFacilitySuggestions([]);
      setIsOpen(false);
      return undefined;
    }

    const query = value?.trim() || '';
    if (query.length < minChars) {
      setSuggestions([]);
      setFacilitySuggestions([]);
      setIsOpen(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);

      try {
        const promises = [vietmapService.searchPlaces(query)];
        if (includeFacilities) {
          promises.push(facilityService.searchFacilities({ keyword: query }));
        }

        const results = await Promise.allSettled(promises);
        const placeRes = results[0];
        const facilityRes = includeFacilities ? results[1] : null;

        let nextPlaceSuggestions = [];
        if (placeRes.status === 'fulfilled') {
          const rawPlaces = placeRes.value || [];
          nextPlaceSuggestions = rankSuggestions(
            (Array.isArray(rawPlaces) ? rawPlaces : rawPlaces?.data || [])
              .filter((item) => getSuggestionLabel(item)),
            query
          );
        }

        let nextFacilitySuggestions = [];
        if (facilityRes?.status === 'fulfilled' && facilityRes.value?.status === 'success') {
          nextFacilitySuggestions = (facilityRes.value?.data || []).slice(0, 4);
        }

        if (requestId === requestIdRef.current) {
          setSuggestions(nextPlaceSuggestions);
          setFacilitySuggestions(nextFacilitySuggestions);
          //open dropdown if user is typing
          setIsOpen(
            userTypedRef.current && (nextPlaceSuggestions.length > 0 || nextFacilitySuggestions.length > 0)
          );
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          console.error('Lỗi tìm kiếm gợi ý địa chỉ/bãi xe:', error);
          setSuggestions([]);
          setFacilitySuggestions([]);
          setIsOpen(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [value, minChars, includeFacilities]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        userTypedRef.current = false;
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectPlace = (suggestion) => {
    userTypedRef.current = false;
    const label = getSuggestionLabel(suggestion);
    onChange(label);
    onSelect?.(suggestion, label);
    setSuggestions([]);
    setFacilitySuggestions([]);
    setIsOpen(false);
  };

  const handleSelectFacility = (facility) => {
    userTypedRef.current = false;
    onChange(facility.name);
    if (onFacilitySelect) {
      onFacilitySelect(facility);
    } else {
      onSelect?.(facility, facility.name);
    }
    setSuggestions([]);
    setFacilitySuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 z-10" />
      <input
        type="text"
        value={value}
        onChange={(event) => {
          userTypedRef.current = true;
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (userTypedRef.current && (suggestions.length > 0 || facilitySuggestions.length > 0)) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        className={`w-full pl-10 pr-10 ${inputClassName}`}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 animate-spin" />}
      {isOpen && (suggestions.length > 0 || facilitySuggestions.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[700] max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl divide-y divide-slate-100">
          {/*registered parking lot*/}
          {facilitySuggestions.length > 0 && (
            <div>
              <div className="px-3.5 py-2 bg-teal-50/80 flex items-center justify-between text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" /> Bãi đỗ xe ParkLink
                </span>
                <span className="text-[10px] text-teal-600 font-semibold px-1.5 py-0.5 rounded bg-teal-100">
                  {facilitySuggestions.length} kết quả
                </span>
              </div>
              {facilitySuggestions.map((fac) => (
                <button
                  type="button"
                  key={`fac-${fac.id}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectFacility(fac)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-teal-50/60 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-b-0 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-teal-700 transition">
                        {fac.name}
                      </p>
                      {fac.price_per_month && (
                        <span className="text-xs font-bold text-teal-600 shrink-0">
                          {Number(fac.price_per_month).toLocaleString('vi-VN')} đ/tháng
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/*address*/}
          {suggestions.length > 0 && (
            <div>
              <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> Địa điểm / Tuyến đường (Vietmap)
                </span>
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  type="button"
                  key={suggestion.ref_id || suggestion.id || `place-${index}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectPlace(suggestion)}
                  className="w-full px-3.5 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-start gap-2.5 border-b last:border-b-0 border-slate-100"
                >
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{getSuggestionLabel(suggestion)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VietmapAddressAutocomplete;
