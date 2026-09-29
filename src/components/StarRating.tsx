import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingDisplayProps {
  rating: number; // 0 to 5
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  count?: number;
  className?: string;
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  size = 'md',
  showNumber = true,
  count,
  className = '',
}) => {
  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <div className="flex items-center gap-0.5 text-[#C87D32] shrink-0">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const filled = rating >= starIndex;
          const half = !filled && rating >= starIndex - 0.5;

          return (
            <div
              key={starIndex}
              className={`relative inline-block ${starSizes[size]} shrink-0`}
            >
              {/* Background empty star */}
              <Star
                className={`absolute inset-0 ${starSizes[size]} text-[#E0D7CD] fill-[#F2EDE7] stroke-[#D5C9BC]`}
                strokeWidth={1.5}
              />
              {/* Overlay with stable clipPath (no DOM shifts) */}
              <Star
                className={`absolute inset-0 ${starSizes[size]} fill-[#C87D32] text-[#C87D32] stroke-[#B06B26]`}
                strokeWidth={1.5}
                style={{
                  clipPath: filled
                    ? 'inset(0 0 0 0)'
                    : half
                    ? 'inset(0 50% 0 0)'
                    : 'inset(0 100% 0 0)',
                }}
              />
            </div>
          );
        })}
      </div>

      {showNumber && (
        <span className={`font-mono tabular-nums text-[#6E5D4F] ${textSizes[size]}`}>
          {rating > 0 ? rating.toFixed(1) : 'Unrated'}
          {count !== undefined && (
            <span className="text-[#968677] ml-1 font-sans">
              ({count.toLocaleString()})
            </span>
          )}
        </span>
      )}
    </div>
  );
};

interface StarRatingInputProps {
  value: number; // 0 to 5 in 0.5 increments
  onChange: (newRating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showTextLabel?: boolean;
}

export const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  onChange,
  size = 'lg',
  label,
  showTextLabel = true,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const containerSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const activeRating = hoverValue !== null ? hoverValue : value;

  const getRatingLabel = (val: number) => {
    if (val === 0) return 'Click star to rate';
    if (val === 0.5) return '0.5 · Undrinkable';
    if (val === 1.0) return '1.0 · Poor';
    if (val === 1.5) return '1.5 · Below Average';
    if (val === 2.0) return '2.0 · Okay';
    if (val === 2.5) return '2.5 · Decent Cup';
    if (val === 3.0) return '3.0 · Good Specialty';
    if (val === 3.5) return '3.5 · Very Good & Clean';
    if (val === 4.0) return '4.0 · Excellent';
    if (val === 4.5) return '4.5 · Outstanding';
    if (val === 5.0) return '5.0 · Extraordinary Masterpiece';
    return `${val.toFixed(1)} stars`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX - rect.left < rect.width * 0.5;
    const rating = isLeft ? starIndex - 0.5 : starIndex;
    setHoverValue(rating);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX - rect.left < rect.width * 0.5;
    const rating = isLeft ? starIndex - 0.5 : starIndex;
    onChange(rating);
  };

  return (
    <div
      className="flex flex-col select-none w-full max-w-[280px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header Label (e.g. "Your Personal Rating") */}
      {label && (
        <div className="text-xs font-semibold uppercase tracking-wider text-[#7C6A5A] mb-1">
          {label}
        </div>
      )}

      {/* Row 1: THE STARS - Completely locked into a static width/height so nothing can shift them */}
      <div
        className="flex items-center gap-1 shrink-0 py-0.5"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const filled = activeRating >= starIndex;
          const half = !filled && activeRating >= starIndex - 0.5;

          return (
            <div
              key={starIndex}
              className={`relative inline-block ${containerSizes[size]} shrink-0 cursor-pointer`}
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
              onClick={(e) => handleClick(e, starIndex)}
              role="button"
              tabIndex={0}
              aria-label={`Rate ${starIndex} stars`}
            >
              {/* Background Empty Star - Always in DOM, pointer-events disabled */}
              <Star
                className={`absolute inset-0 ${starSizes[size]} text-[#D8CEBF] fill-[#F5EFE6] stroke-[#C4B5A3] pointer-events-none`}
                strokeWidth={1.5}
              />

              {/* Filled Star Overlay - Always in DOM with CSS clip-path (ZERO DOM insertion/removal!) */}
              <Star
                className={`absolute inset-0 ${starSizes[size]} fill-[#C87D32] text-[#C87D32] stroke-[#AF6A27] pointer-events-none`}
                strokeWidth={1.5}
                style={{
                  clipPath: filled
                    ? 'inset(0 0 0 0)'
                    : half
                    ? 'inset(0 50% 0 0)'
                    : 'inset(0 100% 0 0)',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Row 2: TEXT SITS UNDER THE STARS with a locked fixed height and width */}
      {showTextLabel && (
        <div className="mt-1.5 flex items-center gap-2 h-6 overflow-hidden">
          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF1E4] text-[#8C4F1A] border border-[#E8DEC0] tabular-nums shrink-0">
            {activeRating > 0 ? activeRating.toFixed(1) : '—'}
          </span>

          <span className="text-xs font-medium text-[#4A3B32] truncate">
            {getRatingLabel(activeRating)}
          </span>

          {value > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange(0);
                setHoverValue(null);
              }}
              className="text-[11px] text-[#9E8E80] hover:text-[#7A3E26] underline transition-colors shrink-0 ml-auto"
              title="Clear rating"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};
