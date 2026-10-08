import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';

const API_URL = 'https://maps.vietmap.vn/api/search/v3';

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
    .slice(0, 6)
    .map((entry) => entry.item);
};

const VietmapAddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder,
  className = '',
  inputClassName = '',
  required = false,
  disabled = false,
  minChars = 2,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const query = value.trim();
    if (query.length < minChars) {
      setSuggestions([]);
      setIsOpen(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      const apiKey = process.env.REACT_APP_VIETMAP_API_KEY;

      if (!apiKey) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_URL}?apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
          throw new Error(`Vietmap autocomplete failed with status ${response.status}`);
        }

        const data = await response.json();
        const nextSuggestions = rankSuggestions(
          (Array.isArray(data) ? data : data?.data || [])
            .filter((item) => getSuggestionLabel(item)),
          query
        );

        if (requestId === requestIdRef.current) {
          setSuggestions(nextSuggestions);
          setIsOpen(nextSuggestions.length > 0);
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          console.error('Lỗi autocomplete địa chỉ Vietmap:', error);
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [value, minChars]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (suggestion) => {
    const label = getSuggestionLabel(suggestion);
    onChange(label);
    onSelect?.(suggestion, label);
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-600 z-10" />
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-10 ${inputClassName}`}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600 animate-spin" />}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[700] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {suggestions.map((suggestion, index) => (
            <button
              type="button"
              key={suggestion.ref_id || suggestion.id || `${getSuggestionLabel(suggestion)}-${index}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-teal-50 transition-colors flex items-start gap-2 border-b last:border-b-0 border-slate-100"
            >
              <MapPin className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <span>{getSuggestionLabel(suggestion)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VietmapAddressAutocomplete;
