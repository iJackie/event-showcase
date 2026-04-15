'use client';

import { useEffect, useRef } from 'react';
import type { Event } from '@/lib/types';
import { EVENTS } from '@/lib/events';
import { buildLocationGroups, fanOffset } from '@/lib/clustering';
import { resolvePhotoUrl } from '@/lib/photoUtils';
import { formatDateRange } from '@/lib/photoUtils';

interface Props {
  activeEvent: Event | null;
  hoveredEventId: string | null;
  onEventClick: (ev: Event) => void;
  onEventHover: (id: string | null) => void;
}

// Pre-build location groups once (pure computation, safe at module scope)
const locationGroups = buildLocationGroups(EVENTS);

export default function LeafletMap({ activeEvent, hoveredEventId, onEventClick, onEventHover }: Props) {
  const mapRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null);
  const markersRef = useRef<Record<string, ReturnType<typeof import('leaflet')['marker']>>>({});
  const panTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iconUrlsRef = useRef<Record<string, string | null>>({});

  // Keep callback refs so marker listeners always call the latest version
  const onEventClickRef = useRef(onEventClick);
  const onEventHoverRef = useRef(onEventHover);
  useEffect(() => { onEventClickRef.current = onEventClick; }, [onEventClick]);
  useEffect(() => { onEventHoverRef.current = onEventHover; }, [onEventHover]);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return; // StrictMode guard

    const L = require('leaflet') as typeof import('leaflet');

    const map = L.map('map', {
      center: [20, 10],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: true,
      worldCopyJump: false,
      minZoom: 2,
    });

    // Light-style tile layer (CartoDB Positron — no API key needed)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Resolve icons then build markers
    resolveAllIcons().then(() => {
      buildAllMarkers(map, L);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pan to active event
  useEffect(() => {
    if (!activeEvent || !mapRef.current) return;
    const map = mapRef.current;
    clearTimeout(panTimeoutRef.current ?? undefined);
    panTimeoutRef.current = setTimeout(() => {
      map.flyTo([activeEvent.lat, activeEvent.lng], 10, { animate: true, duration: 1.4, easeLinearity: 0.25 });
    }, 80);
  }, [activeEvent]);

  // Pan to hovered event
  useEffect(() => {
    if (!hoveredEventId || !mapRef.current) return;
    const ev = EVENTS.find(e => e.id === hoveredEventId);
    if (!ev) return;
    const map = mapRef.current;
    clearTimeout(panTimeoutRef.current ?? undefined);
    panTimeoutRef.current = setTimeout(() => {
      map.flyTo([ev.lat, ev.lng], 10, { animate: true, duration: 1.4, easeLinearity: 0.25 });
    }, 80);
  }, [hoveredEventId]);

  // Sync highlighted markers when hoveredEventId changes
  useEffect(() => {
    Object.keys(markersRef.current).forEach(id => {
      const el = getMarkerEl(id);
      if (!el) return;
      if (id === hoveredEventId || id === activeEvent?.id) {
        el.classList.add('highlighted');
        const pulse = el.querySelector('.marker-pulse') as HTMLElement | null;
        if (pulse) pulse.style.display = 'block';
      } else {
        el.classList.remove('highlighted');
        const pulse = el.querySelector('.marker-pulse') as HTMLElement | null;
        if (pulse) pulse.style.display = 'none';
      }
    });
  }, [hoveredEventId, activeEvent]);

  function getMarkerEl(id: string): HTMLElement | null {
    const marker = markersRef.current[id];
    if (!marker) return null;
    return marker.getElement()?.querySelector(`.event-marker[data-event-id="${id}"]`) as HTMLElement | null;
  }

  async function resolveAllIcons() {
    await Promise.all(EVENTS.map(async ev => {
      if (ev.icon) {
        iconUrlsRef.current[ev.id] = ev.icon;
        return;
      }
      const firstPhoto = ev.photos?.find(p => p);
      if (firstPhoto) {
        iconUrlsRef.current[ev.id] = await resolvePhotoUrl(firstPhoto);
      } else {
        iconUrlsRef.current[ev.id] = null;
      }
    }));
  }

  function buildAllMarkers(map: ReturnType<typeof import('leaflet')['map']>, L: typeof import('leaflet')) {
    Object.values(locationGroups).forEach(group => {
      const { ids, centerLat, centerLng } = group;
      const n = ids.length;
      const CONTAINER_SIZE = 160;

      const container = document.createElement('div');
      container.className = 'marker-group-container';
      container.dataset.groupKey = ids[0];
      container.style.cssText = `
        position: relative;
        width: ${CONTAINER_SIZE}px;
        height: ${CONTAINER_SIZE}px;
        pointer-events: none;
      `;

      if (n > 1) {
        const badge = document.createElement('div');
        badge.className = 'marker-count-badge';
        badge.textContent = `${n}`;
        badge.style.cssText = `
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        `;
        container.appendChild(badge);
      }

      ids.forEach((id, i) => {
        const ev = EVENTS.find(e => e.id === id)!;
        const size = n === 1 ? 48 : 38;
        const offset = fanOffset(i, n);

        const bubble = document.createElement('div');
        bubble.className = 'event-marker';
        bubble.dataset.eventId = id;
        bubble.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background: ${ev.color}22;
          border-color: ${ev.color}88;
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(calc(-50% + ${offset.dx}px), calc(-50% + ${offset.dy}px));
          pointer-events: all;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.2s ease,
                      border-color 0.2s ease;
        `;

        const iconUrl = iconUrlsRef.current[id];
        if (iconUrl) {
          const img = document.createElement('img');
          img.src = iconUrl;
          img.alt = ev.name;
          bubble.appendChild(img);
        } else {
          const span = document.createElement('span');
          span.className = 'event-marker-emoji';
          span.style.fontSize = n === 1 ? '1.4rem' : '1.1rem';
          span.textContent = ev.emoji;
          bubble.appendChild(span);
        }

        const pulse = document.createElement('div');
        pulse.className = 'marker-pulse';
        pulse.style.cssText = `width:${size}px;height:${size}px;display:none;`;
        bubble.appendChild(pulse);

        container.appendChild(bubble);
      });

      const icon = L.divIcon({
        html: container.outerHTML,
        className: '',
        iconSize: [CONTAINER_SIZE, CONTAINER_SIZE],
        iconAnchor: [CONTAINER_SIZE / 2, CONTAINER_SIZE / 2],
      });

      const marker = L.marker([centerLat, centerLng], { icon, interactive: true }).addTo(map);

      marker.on('add', () => {
        const el = marker.getElement();
        if (!el) return;

        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);

        ids.forEach(id => {
          const evData = EVENTS.find(e => e.id === id)!;
          const bubbleEl = el.querySelector(`.event-marker[data-event-id="${id}"]`) as HTMLElement | null;
          if (!bubbleEl) return;

          bubbleEl.addEventListener('mouseenter', () => {
            onEventHoverRef.current(id);
          });

          bubbleEl.addEventListener('mouseleave', () => {
            onEventHoverRef.current(null);
          });

          bubbleEl.addEventListener('click', (e) => {
            e.stopPropagation();
            onEventClickRef.current(evData);
          });
        });
      });

      ids.forEach(id => { markersRef.current[id] = marker; });
    });
  }

  // Tooltip display
  useEffect(() => {
    const tooltip = document.getElementById('map-tooltip');
    const tooltipName = document.getElementById('tooltip-name');
    const tooltipLoc = document.getElementById('tooltip-location');
    const tooltipDate = document.getElementById('tooltip-date');
    if (!tooltip || !tooltipName || !tooltipLoc || !tooltipDate) return;

    if (hoveredEventId) {
      const ev = EVENTS.find(e => e.id === hoveredEventId);
      if (ev) {
        tooltipName.textContent = ev.name;
        tooltipLoc.textContent = '📍 ' + ev.location + (ev.venue ? ' · ' + ev.venue : '');
        tooltipDate.textContent = formatDateRange(ev.startDate, ev.endDate);
        tooltip.classList.remove('hidden');
      }
    } else {
      tooltip.classList.add('hidden');
    }
  }, [hoveredEventId]);

  return (
    <>
      <div id="map" style={{ width: '100%', height: '100%' }} />
      <div id="map-tooltip" className="hidden">
        <span id="tooltip-name" />
        <span id="tooltip-location" />
        <span id="tooltip-date" />
      </div>
    </>
  );
}
