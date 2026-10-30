import React from 'react';
import { cn } from '../../utils/cn';

export const MovieCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex flex-col gap-2.5 animate-pulse select-none', className)}>
    <div className="relative aspect-[2/3] w-full rounded-xl bg-slate-800/80 border border-slate-700/40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
    <div className="flex flex-col gap-1.5 px-0.5">
      <div className="h-4 w-3/4 rounded bg-slate-800/90" />
      <div className="flex items-center gap-2">
        <div className="h-3 w-10 rounded bg-slate-800/60" />
        <div className="h-3 w-12 rounded bg-slate-800/60" />
      </div>
    </div>
  </div>
);

export const MovieRowSkeleton: React.FC = () => (
  <div className="flex flex-col gap-4 py-4">
    <div className="flex items-center justify-between px-4 md:px-8">
      <div className="h-6 w-48 rounded-md bg-slate-800 animate-pulse" />
      <div className="h-4 w-16 rounded-md bg-slate-800/60 animate-pulse" />
    </div>
    <div className="flex gap-4 overflow-hidden px-4 md:px-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-[140px] sm:w-[170px] md:w-[200px] shrink-0">
          <MovieCardSkeleton />
        </div>
      ))}
    </div>
  </div>
);

export const HeroBannerSkeleton: React.FC = () => (
  <div className="relative w-full h-[65vh] min-h-[460px] max-h-[720px] bg-slate-900 animate-pulse flex items-end p-6 md:p-14 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10" />
    <div className="relative z-20 flex flex-col gap-4 max-w-2xl w-full">
      <div className="flex items-center gap-2">
        <div className="h-5 w-14 rounded-full bg-slate-800" />
        <div className="h-5 w-16 rounded-md bg-slate-800" />
        <div className="h-5 w-12 rounded-md bg-slate-800" />
      </div>
      <div className="h-10 md:h-14 w-4/5 rounded-lg bg-slate-800" />
      <div className="h-16 w-full rounded-md bg-slate-800/70" />
      <div className="flex items-center gap-3 mt-2">
        <div className="h-11 w-36 rounded-xl bg-slate-800" />
        <div className="h-11 w-36 rounded-xl bg-slate-800/60" />
      </div>
    </div>
  </div>
);

export const DetailSkeleton: React.FC = () => (
  <div className="min-h-screen pt-20 px-4 md:px-12 pb-16 flex flex-col gap-8 animate-pulse">
    <div className="h-80 w-full rounded-2xl bg-slate-900 border border-slate-800" />
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
      <div className="aspect-[2/3] w-full rounded-2xl bg-slate-800" />
      <div className="flex flex-col gap-4">
        <div className="h-8 w-2/3 rounded-lg bg-slate-800" />
        <div className="flex gap-2">
          <div className="h-5 w-14 rounded bg-slate-800" />
          <div className="h-5 w-14 rounded bg-slate-800" />
          <div className="h-5 w-14 rounded bg-slate-800" />
        </div>
        <div className="h-24 w-full rounded-lg bg-slate-800/60" />
        <div className="h-12 w-48 rounded-xl bg-slate-800" />
      </div>
    </div>
  </div>
);
