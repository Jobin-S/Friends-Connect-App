'use client';

// Local, per-browser state for the Soft Aurora prototype screens.
// TODO(api): replace with wallet and ticket endpoints when they exist.

import { useCallback, useEffect, useState } from 'react';

export interface BookedTicket {
  code: string;
  eventId: string;
  tierName: string;
  qty: number;
  total: number;
  bookedAt: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(`aurora:${key}`));
  } catch {
    /* storage unavailable: keep in-memory only */
  }
}

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    setValue(read(key, fallback));
    const sync = () => setValue(read(key, fallback));
    window.addEventListener(`aurora:${key}`, sync);
    return () => window.removeEventListener(`aurora:${key}`, sync);
  }, [key]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(read(key, fallback)) : next;
      setValue(resolved);
      write(key, resolved);
    },
    [key],
  );
  return [value, set] as const;
}

export const useTickets = () => useStored<BookedTicket[]>('fc-tickets', []);
export const useCoins = () => useStored<number>('fc-coins', 1240);

/** Deterministic grid of on/off cells for a ticket code, drawn as a QR-style mark. */
export function codeGrid(code: string, size = 21): boolean[] {
  let h = 2166136261;
  for (const ch of code) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    cells.push((h >>> 0) % 2 === 0);
  }
  // Finder squares in three corners
  const finder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[(r0 + r) * size + c0 + c] = edge || core;
      }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  return cells;
}
