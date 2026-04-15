'use client';

import { useState, useCallback } from 'react';
import type { Event } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import MapContainer from '@/components/MapContainer';
import DetailPanel from '@/components/DetailPanel';
import Lightbox from '@/components/Lightbox';

interface LightboxState {
  photos: string[];
  index: number;
}

export default function Home() {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const handleEventClick = useCallback((ev: Event) => {
    setActiveEvent(ev);
  }, []);

  const handleClosePanel = useCallback(() => {
    setActiveEvent(null);
  }, []);

  const handleOpenLightbox = useCallback((photos: string[], index: number) => {
    setLightbox({ photos, index });
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
      <Sidebar
        activeEventId={activeEvent?.id ?? null}
        hoveredEventId={hoveredEventId}
        onEventClick={handleEventClick}
        onEventHover={setHoveredEventId}
      />
      <MapContainer
        activeEvent={activeEvent}
        hoveredEventId={hoveredEventId}
        panelOpen={!!activeEvent}
        onEventClick={handleEventClick}
        onEventHover={setHoveredEventId}
      />
      <DetailPanel
        event={activeEvent}
        onClose={handleClosePanel}
        onOpenLightbox={handleOpenLightbox}
      />
      <Lightbox
        photos={lightbox?.photos ?? []}
        initialIndex={lightbox?.index ?? 0}
        open={!!lightbox}
        onClose={handleCloseLightbox}
      />
    </div>
  );
}
