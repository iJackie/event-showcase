'use client';

import type { Event } from '@/lib/types';
import { EVENTS } from '@/lib/events';
import EventItem from './EventItem';

interface Props {
  activeEventId: string | null;
  hoveredEventId: string | null;
  onEventClick: (ev: Event) => void;
  onEventHover: (id: string | null) => void;
}

// Compute stats from EVENTS
const totalEvents = EVENTS.length;
const totalCities = new Set(EVENTS.map(e => e.location.split(',')[0].trim())).size;
const totalCountries = new Set(EVENTS.map(e => e.location.split(',').pop()?.trim())).size;

export default function Sidebar({ activeEventId, hoveredEventId, onEventClick, onEventHover }: Props) {
  function handleMerchClick(ev: Event) {
    // Open panel and let parent handle it; merch scroll handled in DetailPanel
    onEventClick(ev);
  }

  return (
    <nav id="left-nav">
      <div id="left-nav-header">
        <h1>Jacqueline Mach ✨</h1>
        <div className="subtitle">Global Events Portfolio</div>
        <div className="header-stats">
          <span className="header-stat">{totalEvents} Events</span>
          <span className="header-stat">{totalCities} Cities</span>
          <span className="header-stat">{totalCountries} Countries</span>
        </div>
      </div>

      <ul id="event-list">
        {EVENTS.map(ev => (
          <EventItem
            key={ev.id}
            event={ev}
            isActive={activeEventId === ev.id}
            isHovered={hoveredEventId === ev.id}
            onEventClick={onEventClick}
            onEventHover={onEventHover}
            onMerchClick={handleMerchClick}
          />
        ))}
      </ul>
    </nav>
  );
}
