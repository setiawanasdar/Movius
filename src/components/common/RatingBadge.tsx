import React from 'react';
import { Star } from 'lucide-react';
import { formatRating } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface RatingBadgeProps {
  rating: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({
  rating,
  size = 'md',
  className,
  showIcon = true,
}) => {
  const formatted = formatRating(rating);
  const isAvailable = formatted !== 'N/A';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
    lg: 'text-sm px-2.5 py-1 gap-2 font-semibold',
  };

  const imdbLabelSizes = {
    sm: 'text-[9px] px-1 rounded',
    md: 'text-[10px] px-1 rounded',
    lg: 'text-xs px-1.5 rounded',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center font-bold rounded-md backdrop-blur-md shadow-sm select-none',
        isAvailable
          ? 'bg-amber-400 text-slate-950 border border-amber-300'
          : 'bg-slate-800/80 text-slate-400 border border-slate-700/40',
        sizeClasses[size],
        className
      )}
    >
      {isAvailable ? (
        <>
          <span className={cn('bg-slate-950 text-amber-400 font-black tracking-tight', imdbLabelSizes[size])}>
            IMDb
          </span>
          <span>{formatted}</span>
        </>
      ) : (
        <>
          {showIcon && <Star className="w-3.5 h-3.5 text-slate-500" />}
          <span>N/A</span>
        </>
      )}
    </div>
  );
};
