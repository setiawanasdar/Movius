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

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center font-medium rounded-md backdrop-blur-md shadow-sm select-none',
        isAvailable
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          : 'bg-slate-800/60 text-slate-400 border border-slate-700/40',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Star
          className={cn(
            iconSizes[size],
            isAvailable ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
          )}
        />
      )}
      <span>{formatted}</span>
    </div>
  );
};
