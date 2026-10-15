import type { EventRecord } from "./types";

export type BrowseEventsResult = {
  events: EventRecord[];
  categories: { id: number; category: string }[];
  cities: string[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};
