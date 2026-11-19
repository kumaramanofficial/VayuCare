import React, { useEffect, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import type { CityOption } from '../types';

interface CitySearchModalProps {
  isOpen: boolean;
  currentCity: CityOption;
  onSelect: (city: CityOption) => void;
  onClose: () => void;
}

export function CitySearchModal({
  isOpen,
  currentCity,
  onSelect,
  onClose,
}: CitySearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error('Unable to load cities');
        const data = (await res.json()) as { results?: CityOption[] };
        if (active) {
          setResults(data.results || []);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Search failed');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, query.trim() ? 240 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 pt-16 sm:pt-24 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Choose city location"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Select Location
            </h2>
            <p className="text-xs text-slate-500">
              Live hyperlocal AQI telemetry and winter smog forecast
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close city selector"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-3.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any city worldwide (e.g., Delhi, Pune, Patna, London)..."
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/15"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              Searching cities...
            </div>
          ) : error ? (
            <div className="px-5 py-6 text-center text-sm text-red-700">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              No cities matched "{query}". Try a broader city name.
            </div>
          ) : (
            results.map((city) => {
              const isSelected =
                city.name === currentCity.name &&
                Math.abs(city.latitude - currentCity.latitude) < 0.05;
              return (
                <button
                  key={`${city.name}-${city.latitude}-${city.longitude}`}
                  type="button"
                  onClick={() => {
                    onSelect(city);
                    onClose();
                  }}
                  className={`flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-slate-50 ${
                    isSelected ? 'bg-teal-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {city.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {[city.admin1, city.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-slate-400 tabular-nums">
                    {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
