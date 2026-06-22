import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({ value = 0, onChange, readOnly = false }) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= displayValue;
        
        return (
          <button
            key={starIndex}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(starIndex)}
            onMouseEnter={() => !readOnly && setHoverValue(starIndex)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            className={`transition-all duration-200 ${
              readOnly 
                ? 'cursor-default' 
                : 'cursor-pointer hover:scale-125 active:scale-95'
            }`}
            title={readOnly ? `Rating: ${value} dari 5` : `Beri rating ${starIndex} bintang`}
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                isFilled
                  ? 'fill-brand-orange text-brand-orange drop-shadow-[0_0_5px_rgba(255,87,34,0.5)]'
                  : 'text-brand-textMuted/40 hover:text-brand-orange/60'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
