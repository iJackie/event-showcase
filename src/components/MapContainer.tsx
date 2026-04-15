import dynamic from 'next/dynamic';
import type { Event } from '@/lib/types';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#dce8f0' }} />
  ),
});

interface Props {
  activeEvent: Event | null;
  hoveredEventId: string | null;
  panelOpen: boolean;
  onEventClick: (ev: Event) => void;
  onEventHover: (id: string | null) => void;
}

export default function MapContainer({
  activeEvent,
  hoveredEventId,
  panelOpen,
  onEventClick,
  onEventHover,
}: Props) {
  return (
    <main
      id="map-container"
      className={panelOpen ? 'panel-open' : ''}
    >
      <LeafletMap
        activeEvent={activeEvent}
        hoveredEventId={hoveredEventId}
        onEventClick={onEventClick}
        onEventHover={onEventHover}
      />
    </main>
  );
}
