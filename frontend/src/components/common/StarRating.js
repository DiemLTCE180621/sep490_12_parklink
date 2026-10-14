import React, { useState } from 'react';
import { Star } from 'lucide-react';

const RATING_LABELS = {
  1: 'Rất tệ',
  2: 'Chưa hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Tuyệt vời'
};

const StarRating = ({ value = 0, onChange, disabled, size = 22, showLabel = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const current = hoverRating || value;

  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex gap-1 items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= current;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onMouseEnter={() => !disabled && setHoverRating(star)}
              onMouseLeave={() => !disabled && setHoverRating(0)}
              onClick={() => onChange && onChange(star)}
              className={`transition-all duration-150 focus:outline-none ${
                disabled ? 'cursor-default' : 'cursor-pointer hover:scale-115 active:scale-95'
              }`}
            >
              <Star
                size={size}
                className={`transition-colors duration-150 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-100 text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && !disabled && current > 0 && (
        <div className="transition-all duration-200">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
            {RATING_LABELS[current]} ({current}/5)
          </span>
        </div>
      )}
    </div>
  );
};

export default StarRating;
