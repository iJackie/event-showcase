const PHOTO_EXTS = ['.avif', '.png', '.jpg', '.jpeg', '.webp'];

export function resolvePhotoUrl(src: string): Promise<string | null> {
  if (!src) return Promise.resolve(null);
  if (/\.(avif|png|jpe?g|webp|gif)$/i.test(src)) return Promise.resolve(src);
  return new Promise(resolve => {
    let i = 0;
    function tryNext() {
      if (i >= PHOTO_EXTS.length) { resolve(null); return; }
      const url = src + PHOTO_EXTS[i++];
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = tryNext;
      img.src = url;
    }
    tryNext();
  });
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  if (start === end) return s.toLocaleDateString('en-US', opts);
  const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const eStr = e.toLocaleDateString('en-US', opts);
  return `${sStr} – ${eStr}`;
}
