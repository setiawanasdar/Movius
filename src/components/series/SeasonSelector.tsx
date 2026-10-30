import React from 'react';
import type { SeasonGroup } from '../../types/movie';
import { Layers } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SeasonSelectorProps {
  seasons: SeasonGroup[];
  selectedSeason: number;
  onSelectSeason: (seasonNumber: number) => void;
  className?: string;
}

export const SeasonSelector: React.FC<SeasonSelectorProps> = ({
  seasons,
  selectedSeason,
  onSelectSeason,
  className,
}) => {
  if (!seasons || seasons.length <= 1) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto no-scrollbar py-2', className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-2 shrink-0">
        <Layers className="w-4 h-4 text-rose-500" />
        <span>Pilih Musim:</span>
      </div>

      {seasons.map((s) => {
        const isSelected = s.season === selectedSeason;
        return (
          <button
            key={s.season}
            onClick={() => onSelectSeason(s.season)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-2',
              isSelected
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40 scale-105'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <span>Season {s.season}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/30 font-normal">
              {s.totalEpisodes} Ep
            </span>
          </button>
        );
      })}
    </div>
  );
};
