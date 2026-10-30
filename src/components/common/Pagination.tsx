import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('ellipsis');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Navigasi Halaman"
      className={cn('flex items-center justify-center gap-1.5 md:gap-2 my-8 select-none', className)}
    >
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Halaman Sebelumnya"
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs md:text-sm font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Sebelumnya</span>
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-500 font-bold">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => handlePageClick(p)}
              aria-current={p === currentPage ? 'page' : undefined}
              className={cn(
                'min-w-9 h-9 px-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer',
                p === currentPage
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                  : 'bg-slate-900 border border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Halaman Berikutnya"
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs md:text-sm font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
      >
        <span className="hidden sm:inline">Berikutnya</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};
