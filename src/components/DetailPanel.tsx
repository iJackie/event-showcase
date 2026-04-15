'use client';

import { useEffect, useRef } from 'react';
import type { Event } from '@/lib/types';
import { formatDateRange } from '@/lib/photoUtils';
import PhotoFilmstrip from './PhotoFilmstrip';

interface Props {
  event: Event | null;
  onClose: () => void;
  onOpenLightbox: (photos: string[], index: number) => void;
}

export default function DetailPanel({ event, onClose, onOpenLightbox }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll panel to top when event changes
  useEffect(() => {
    if (event && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [event?.id]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && event) onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [event, onClose]);

  const isOpen = !!event;

  return (
    <div
      id="right-panel"
      ref={panelRef}
      className={isOpen ? 'open' : ''}
    >
      <button id="close-panel" onClick={onClose} aria-label="Close panel">×</button>

      {event && (
        <div id="right-panel-content">
          {/* Header */}
          <div id="panel-header">
            <div id="panel-icon-wrap">
              {/* Icon resolved in EventItem — use emoji fallback here */}
              <span style={{ fontSize: '1.8rem' }}>{event.emoji}</span>
            </div>
            <div>
              <div id="panel-name">{event.name}</div>
              <div id="panel-location-date">
                📍 {event.location}{event.venue ? ` · ${event.venue}` : ''} ·{' '}
                {formatDateRange(event.startDate, event.endDate)}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="panel-section">
            <h3>About</h3>
            <p id="panel-description">{event.description}</p>
          </div>

          {/* Stats */}
          {event.stats && event.stats.length > 0 && (
            <div className="panel-section" id="panel-stats-section">
              <h3>Highlights</h3>
              <div className="stats-grid" id="panel-stats">
                {event.stats.map((s, i) => (
                  <div key={i} className="stat-card">
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {event.photos?.some(p => p) && (
            <div className="panel-section" id="panel-photos-section">
              <h3>Photos</h3>
              <PhotoFilmstrip
                photoPaths={event.photos}
                eventName={event.name}
                onOpenLightbox={onOpenLightbox}
              />
            </div>
          )}

          {/* Merch */}
          {event.merch && event.merch.length > 0 && (
            <div className="panel-section" id="panel-merch-section">
              <h3>Merch</h3>
              <div className="merch-grid" id="panel-merch">
                {event.merch.map((m, i) => (
                  <a
                    key={i}
                    className="merch-item"
                    href={m.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="merch-thumb">{m.icon}</div>
                    <div className="merch-info">
                      <div className="merch-name">{m.name}</div>
                      <div className="merch-price">{m.price}</div>
                    </div>
                    <span className="merch-arrow">→</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {event.links && event.links.length > 0 && (
            <div className="panel-section" id="panel-links-section">
              <h3>Links</h3>
              <div className="links-list" id="panel-links">
                {event.links.map((l, i) => (
                  <a
                    key={i}
                    className="link-item"
                    href={l.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="link-icon">{l.icon || '🔗'}</span>
                    <span className="link-label">{l.label}</span>
                    <span className="link-arrow">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
