'use client';

import { useEffect, useState } from 'react';
import { resolvePhotoUrl } from '@/lib/photoUtils';

interface Props {
  photoPaths: string[];
  eventName: string;
  onOpenLightbox: (photos: string[], index: number) => void;
}

export default function PhotoFilmstrip({ photoPaths, eventName, onOpenLightbox }: Props) {
  const [resolvedPhotos, setResolvedPhotos] = useState<(string | null)[]>([]);

  useEffect(() => {
    const filtered = photoPaths.filter(p => p);
    if (!filtered.length) { setResolvedPhotos([]); return; }

    // Initialize with nulls to preserve slot order
    const results: (string | null)[] = new Array(filtered.length).fill(null);
    setResolvedPhotos(results);

    filtered.forEach((src, i) => {
      resolvePhotoUrl(src).then(url => {
        setResolvedPhotos(prev => {
          const next = [...prev];
          next[i] = url;
          return next;
        });
      });
    });
  }, [photoPaths]);

  const validPhotos = resolvedPhotos.filter((u): u is string => !!u);

  if (!validPhotos.length && !photoPaths.filter(p => p).length) return null;

  return (
    <div className="photo-filmstrip">
      {resolvedPhotos.map((url, i) =>
        url ? (
          <img
            key={i}
            className="filmstrip-item"
            src={url}
            alt={eventName}
            style={{ opacity: 1 }}
            onClick={() => {
              const idx = validPhotos.indexOf(url);
              onOpenLightbox(validPhotos, idx >= 0 ? idx : 0);
            }}
          />
        ) : (
          <div key={i} className="filmstrip-placeholder">
            <span className="filmstrip-placeholder-icon">📷</span>
          </div>
        )
      )}
    </div>
  );
}
