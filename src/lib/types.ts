export interface EventStat {
  value: string;
  label: string;
}

export interface MerchItem {
  name: string;
  price: string;
  icon: string;
  link: string;
}

export interface EventLink {
  label: string;
  url: string;
  icon: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  venue: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  emoji: string;
  icon: string;
  color: string;
  description: string;
  stats: EventStat[];
  photos: string[];
  merch: MerchItem[];
  links: EventLink[];
}
