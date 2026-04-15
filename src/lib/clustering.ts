import type { Event } from './types';

const CLUSTER_KM = 80;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface LocationGroup {
  ids: string[];
  centerLat: number;
  centerLng: number;
}

export function buildLocationGroups(events: Event[]): Record<string, LocationGroup> {
  const groups: LocationGroup[] = [];

  events.forEach(ev => {
    let matched: LocationGroup | null = null;
    for (const g of groups) {
      if (haversineKm(ev.lat, ev.lng, g.centerLat, g.centerLng) <= CLUSTER_KM) {
        matched = g;
        break;
      }
    }
    if (matched) {
      matched.ids.push(ev.id);
      const evs = matched.ids.map(id => events.find(e => e.id === id)!);
      matched.centerLat = evs.reduce((s, e) => s + e.lat, 0) / evs.length;
      matched.centerLng = evs.reduce((s, e) => s + e.lng, 0) / evs.length;
    } else {
      groups.push({ ids: [ev.id], centerLat: ev.lat, centerLng: ev.lng });
    }
  });

  const result: Record<string, LocationGroup> = {};
  groups.forEach(g => { result[g.ids[0]] = g; });
  return result;
}

export function fanOffset(i: number, n: number): { dx: number; dy: number } {
  if (n === 1) return { dx: 0, dy: 0 };
  const BASE_RADIUS = n <= 2 ? 30 : n <= 3 ? 38 : n <= 5 ? 50 : 60;
  const startAngle = -Math.PI / 2;
  const spread = Math.min(2 * Math.PI * 0.78, (n - 1) * (Math.PI / 3));
  const step = spread / (n - 1);
  const angle = startAngle - spread / 2 + step * i;
  return {
    dx: Math.cos(angle) * BASE_RADIUS,
    dy: Math.sin(angle) * BASE_RADIUS,
  };
}
