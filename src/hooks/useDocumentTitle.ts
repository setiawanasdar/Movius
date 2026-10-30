import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = title ? `${title} — Movius` : 'Movius — Nonton Film & Drakor Sub Indo';
    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}
