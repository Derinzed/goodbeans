import React from 'react';
import { Coffee as CoffeeIcon } from 'lucide-react';

interface CoffeeBagCoverProps {
  name: string;
  roaster: string;
  originCountry: string;
  process: string;
  roastLevel: string;
  coverColor?: string;
  badgeText?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export const CoffeeBagCover: React.FC<CoffeeBagCoverProps> = ({
  name,
  roaster,
  originCountry,
  process,
  roastLevel,
  coverColor = '#3A271D',
  badgeText,
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-20 h-28 text-[9px] p-1.5',
    md: 'w-32 h-44 text-[11px] p-2.5',
    lg: 'w-48 h-64 text-xs p-4',
    hero: 'w-64 h-84 text-sm p-5',
  };

  // Derived subtle gradients based on coverColor
  const backgroundStyle = {
    backgroundColor: coverColor,
  };

  return (
    <div
      style={backgroundStyle}
      className={`relative rounded-md shadow-md hover:shadow-lg transition-all duration-200 select-none flex flex-col justify-between overflow-hidden text-white border border-black/10 shrink-0 ${sizeStyles[size]} ${className}`}
    >
      {/* Coffee bag top seal stitching lines */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-black/20 flex items-center justify-around px-2 opacity-60">
        <div className="w-full border-b border-dashed border-white/40" />
      </div>

      {/* Roaster & badge header */}
      <div className="pt-2 z-10">
        <div className="flex items-center justify-between text-white/70 uppercase tracking-widest text-[8px] font-sans font-semibold">
          <span className="truncate max-w-[80%]">{roaster}</span>
          <CoffeeIcon className="w-2.5 h-2.5 text-white/50 shrink-0" />
        </div>

        {badgeText && size !== 'sm' && (
          <div className="mt-1 text-[9px] text-[#F3E5D4] italic font-serif opacity-90 truncate">
            {badgeText}
          </div>
        )}
      </div>

      {/* Coffee Name & Origin (Centerpiece) */}
      <div className="my-auto z-10 text-center px-1">
        <div
          className={`font-serif font-bold text-white tracking-tight leading-tight drop-shadow-sm ${
            size === 'sm'
              ? 'text-[11px] line-clamp-2'
              : size === 'md'
              ? 'text-sm line-clamp-2'
              : 'text-lg'
          }`}
        >
          {name}
        </div>
        <div className="text-white/80 font-sans text-[10px] mt-0.5 truncate tracking-wide">
          {originCountry} · {process}
        </div>
      </div>

      {/* Bottom footer: roast level & authenticity stamp */}
      <div className="z-10 pt-1 border-t border-white/20 flex items-center justify-between text-[9px] text-white/80 font-mono">
        <span className="truncate font-sans font-medium">{roastLevel}</span>
        <span className="tracking-tighter opacity-70">WHOLE BEAN</span>
      </div>

      {/* Warm paper / burlap grain highlight overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.6) 100%)',
        }}
      />
      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/25 to-transparent pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
    </div>
  );
};
