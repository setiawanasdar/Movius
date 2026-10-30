import React from 'react';
import { cn } from '../../utils/cn';

interface GenreChipProps {
  genre: string;
  size?: 'sm' | 'md';
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const GenreChip: React.FC<GenreChipProps> = ({
  genre,
  size = 'md',
  active = false,
  onClick,
  className,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <span
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all duration-200 select-none whitespace-nowrap',
        size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
        active
          ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
          : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700 hover:text-white',
        isClickable && 'cursor-pointer active:scale-95',
        className
      )}
    >
      {genre}
    </span>
  );
};
