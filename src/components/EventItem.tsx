'use client';

import { useState, useEffect } from 'react';
import type { Event } from '@/lib/types';
import { resolvePhotoUrl } from '@/lib/photoUtils';
import { formatDateRange } from '@/lib/photoUtils';

interface Props {
  event: Event;
  isActive: boolean;
  isHovered: boolean;
  onEventClick: (ev: Event) => void;
  onEventHover: (id: string | null) => void;
  onMerchClick: (ev: Event) => void;
}

export default function EventItem({
  event: ev,
  isActive,
  isHovered,
  onEventClick,
  onEventHover,
  onMerchClick,
}: Props) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    if (ev.icon) {
      setIconUrl(ev.icon);
      return;
    }
    const firstPhoto = ev.photos?.find(p => p);
    if (firstPhoto) {
      resolvePhotoUrl(firstPhoto).then(setIconUrl);
    }
  }, [ev]);

  const hasMerch = ev.merch && ev.merch.length > 0;
  const className = ['event-item', isActive ? 'active' : '', isHovered ? 'hovered' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <li
      className={className}
      data-id={ev.id}
      onMouseEnter={() => onEventHover(ev.id)}
      onMouseLeave={() => onEventHover(null)}
      onClick={() => onEventClick(ev)}
    >
      {iconUrl ? (
        <img className="event-icon" src={iconUrl} alt={ev.name} />
      ) : (
        <div
          className="event-icon-placeholder"
          style={{ background: ev.color + '22' }}
        >
          {ev.emoji}
        </div>
      )}

      <div className="event-info">
        <div className="event-name">{ev.name}</div>
        <div className="event-location">📍 {ev.location}</div>
        <div className="event-date-badge">
          {formatDateRange(ev.startDate, ev.endDate)}
        </div>
      </div>

      <div className="event-item-badges">
        {hasMerch && (
          <button
            className="merch-badge"
            title="View merch"
            onClick={e => {
              e.stopPropagation();
              onMerchClick(ev);
            }}
          >
            👕
          </button>
        )}
        <span className="past-badge">Past</span>
      </div>
    </li>
  );
}
