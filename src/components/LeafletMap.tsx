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

const locationGroups = buildLocationGroups(EVENTS);

export default function LeafletMap({ activeEvent, hoveredEventId, onEventClick, onEventHover }: Props) {
  const mapRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null);
  const markersRef = useRef<Record<string, ReturnType<typeof import('leaflet')['marker']>>>({});
  const panTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeEventRef = useRef<Event | null>(null);
  const iconUrlsRef = useRef<Record<string, string | null>>({});

  // Always-current callback refs — safe to call from any Leaflet DOM listener
  const onEventClickRef = useRef(onEventClick);
  const onEventHoverRef = useRef(onEventHover);
  useEffect(() => { onEventClickRef.current = onEventClick; }, [onEventClick]);
  useEffect(() => { onEventHoverRef.current = onEventHover; }, [onEventHover]);
  useEffect(() => { activeEventRef.current = activeEvent; }, [activeEvent]);

  // ── INIT MAP ────────────────────────────────────────────────────────────────
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Use layeradd to wire listeners the moment each marker hits the DOM
    map.on('layeradd', (e: { layer: unknown }) => {
      const layer = e.layer as ReturnType<typeof L.marker>;
      if (!layer.getElement) return; // not a marker
      const wrapper = layer.getElement();
      if (!wrapper) return;

      // Find which group this marker belongs to
      const group = Object.values(locationGroups).find(g =>
        g.ids.some(id => markersRef.current[id] === layer)
      );
      if (!group) return;

      L.DomEvent.disableClickPropagation(wrapper);
      L.DomEvent.disableScrollPropagation(wrapper);

      group.ids.forEach(id => {
        const evData = EVENTS.find(e => e.id === id)!;
        const bubble = wrapper.querySelector(`.event-marker[data-event-id="${id}"]`) as HTMLElement | null;
        if (!bubble) return;
        bubble.addEventListener('mouseenter', () => onEventHoverRef.current(id));
        bubble.addEventListener('mouseleave', () => onEventHoverRef.current(null));
        bubble.addEventListener('click', ev => {
          ev.stopPropagation();
          onEventClickRef.current(evData);
        });
      });
    });

    buildAllMarkers(map, L);
    resolveAllIcons().then(() => upgradeMarkerIcons());

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PAN ON ACTIVE EVENT ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeEvent || !mapRef.current) return;
    const map = mapRef.current;
    clearTimeout(panTimeoutRef.current ?? undefined);
    panTimeoutRef.current = setTimeout(() => {
      map.flyTo([activeEvent.lat, activeEvent.lng], 10, {
        animate: true, duration: 1.4, easeLinearity: 0.25,
      });
      setTimeout(() => map.invalidateSize(), 420);
    }, 60);
  }, [activeEvent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PAN ON HOVER (only when no panel open) ──────────────────────────────────
  useEffect(() => {
    if (activeEventRef.current) return;
    if (!hoveredEventId || !mapRef.current) return;
    const ev = EVENTS.find(e => e.id === hoveredEventId);
    if (!ev) return;
    const map = mapRef.current;
    clearTimeout(panTimeoutRef.current ?? undefined);
    panTimeoutRef.current = setTimeout(() => {
      map.flyTo([ev.lat, ev.lng], 10, { animate: true, duration: 1.4, easeLinearity: 0.25 });
    }, 80);
  }, [hoveredEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── MARKER HIGHLIGHT SYNC ───────────────────────────────────────────────────
  useEffect(() => {
    Object.keys(markersRef.current).forEach(id => {
      const bubble = getMarkerBubble(id);
      if (!bubble) return;
      const isActive = id === hoveredEventId || id === activeEvent?.id;
      bubble.classList.toggle('highlighted', isActive);
      const pulse = bubble.querySelector('.marker-pulse') as HTMLElement | null;
      if (pulse) pulse.style.display = isActive ? 'block' : 'none';
    });
  }, [hoveredEventId, activeEvent]);

  // ── TOOLTIP ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tooltip = document.getElementById('map-tooltip');
    const nameEl = document.getElementById('tooltip-name');
    const locEl = document.getElementById('tooltip-location');
    const dateEl = document.getElementById('tooltip-date');
    if (!tooltip || !nameEl || !locEl || !dateEl) return;

    clearTimeout(tooltipTimeoutRef.current ?? undefined);

    const displayId = hoveredEventId ?? activeEvent?.id ?? null;
    const ev = displayId ? EVENTS.find(e => e.id === displayId) : null;

    if (ev) {
      nameEl.textContent = ev.name;
      locEl.textContent = '📍 ' + ev.location + (ev.venue ? ' · ' + ev.venue : '');
      dateEl.textContent = formatDateRange(ev.startDate, ev.endDate);
      tooltip.classList.remove('hidden');
    } else {
      tooltipTimeoutRef.current = setTimeout(() => {
        tooltip.classList.add('hidden');
      }, 1500);
    }
  }, [hoveredEventId, activeEvent]);

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  function getMarkerBubble(id: string): HTMLElement | null {
    const marker = markersRef.current[id];
    if (!marker) return null;
    const wrapper = marker.getElement();
    if (!wrapper) return null;
    return wrapper.querySelector(`.event-marker[data-event-id="${id}"]`) as HTMLElement | null;
  }

  async function resolveAllIcons() {
    await Promise.all(EVENTS.map(async ev => {
      if (ev.icon) { iconUrlsRef.current[ev.id] = ev.icon; return; }
      const firstPhoto = ev.photos?.find(p => p);
      iconUrlsRef.current[ev.id] = firstPhoto ? await resolvePhotoUrl(firstPhoto) : null;
    }));
  }

  function upgradeMarkerIcons() {
    EVENTS.forEach(ev => {
      const url = iconUrlsRef.current[ev.id];
      if (!url) return;
      const bubble = getMarkerBubble(ev.id);
      if (!bubble) return;
      const span = bubble.querySelector('.event-marker-emoji');
      if (!span) return;
      const img = document.createElement('img');
      img.src = url;
      img.alt = ev.name;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
      span.replaceWith(img);
    });
  }

  // ── BUILD MARKERS ────────────────────────────────────────────────────────────
  function buildAllMarkers(
    map: ReturnType<typeof import('leaflet')['map']>,
    L: typeof import('leaflet')
  ) {
    Object.values(locationGroups).forEach(group => {
      const { ids, centerLat, centerLng } = group;
      const n = ids.length;
      const SIZE = 160;

      let html = `<div class="marker-group-container" style="position:relative;width:${SIZE}px;height:${SIZE}px;pointer-events:none;">`;

      if (n > 1) {
        html += `<div class="marker-count-badge" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none;">${n}</div>`;
      }

      ids.forEach((id, i) => {
        const ev = EVENTS.find(e => e.id === id)!;
        const size = n === 1 ? 48 : 38;
        const { dx, dy } = fanOffset(i, n);
        const fontSize = n === 1 ? '1.4rem' : '1.1rem';
        html += `<div class="event-marker" data-event-id="${id}" style="width:${size}px;height:${size}px;background:${ev.color}22;border-color:${ev.color}88;position:absolute;left:50%;top:50%;transform:translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px));pointer-events:all;transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.2s,border-color 0.2s;"><span class="event-marker-emoji" style="font-size:${fontSize};">${ev.emoji}</span><div class="marker-pulse" style="width:${size}px;height:${size}px;display:none;"></div></div>`;
      });

      html += '</div>';

      const icon = L.divIcon({
        html,
        className: '',
        iconSize: [SIZE, SIZE],
        iconAnchor: [SIZE / 2, SIZE / 2],
      });

      // addTo triggers 'layeradd' on map → listeners wired there
      const marker = L.marker([centerLat, centerLng], { icon, interactive: true }).addTo(map);
      ids.forEach(id => { markersRef.current[id] = marker; });
    });
  }

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
