'use client';

import { useEffect, useState } from 'react';

interface Props {
  photos: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export default function Lightbox({ photos, initialIndex, open, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % photos.length);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, photos.length, onClose]);

  const showNav = photos.length > 1;

  return (
    <div
      id="lightbox"
      className={open ? 'open' : ''}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {photos[index] && (
        <img id="lightbox-img" src={photos[index]} alt="Event photo" />
      )}
      <button id="lightbox-close" onClick={onClose}>×</button>
      {showNav && (
        <>
          <button id="lightbox-prev" onClick={() => setIndex(i => (i - 1 + photos.length) % photos.length)}>
            ‹
          </button>
          <button id="lightbox-next" onClick={() => setIndex(i => (i + 1) % photos.length)}>
            ›
          </button>
        </>
      )}
    </div>
  );
}
