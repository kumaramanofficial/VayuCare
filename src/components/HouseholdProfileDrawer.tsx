import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { HouseholdProfile } from '../types';
import { COMMUTE_LABELS, COOKING_FUEL_LABELS, HOME_TYPE_LABELS } from '../lib/aqi';

interface HouseholdProfileDrawerProps {
  isOpen: boolean;
  profile: HouseholdProfile;
  onSave: (profile: HouseholdProfile) => void;
  onClose: () => void;
}

const MEMBER_OPTIONS = [
  'Infants / Toddlers (0–4)',
  'School-age children',
  'Elderly parent (65+)',
  'Asthma or respiratory sensitivity',
  'Outdoor commuter / athlete',
  'Indoor pets',
];

const PRIORITY_OPTIONS = [
  'Safe school commute',
  'Cleaner indoor air without high cost',
  'Lower daily emissions',
  'Safe indoor workouts',
  'Low-smoke cooking routine',
  'Neighbourhood / RWA coordination',
];

export function HouseholdProfileDrawer({
  isOpen,
  profile,
  onSave,
  onClose,
}: HouseholdProfileDrawerProps) {
  const [draft, setDraft] = useState<HouseholdProfile>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const toggleItem = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Household and lifestyle profile"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Household & Lifestyle Profile
            </h2>
            <p className="text-xs text-slate-500">
              Tailors routines, indoor air hacks, and emission impact math
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile editor"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Household Size */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-900">
                  Household Size
                </label>
                <span className="font-mono text-sm font-semibold text-teal-800 tabular-nums">
                  {draft.householdSize} {draft.householdSize === 1 ? 'person' : 'people'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={draft.householdSize}
                onChange={(e) =>
                  setDraft({ ...draft, householdSize: Number(e.target.value) })
                }
                className="mt-2 w-full accent-teal-700"
              />
            </div>

            {/* Vulnerable & Household Members */}
            <div>
              <label className="block text-sm font-medium text-slate-900">
                Who lives in your home?
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Select all that apply so health precautions match your family.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {MEMBER_OPTIONS.map((option) => {
                  const checked = draft.members.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setDraft({ ...draft, members: toggleItem(draft.members, option) })
                      }
                      className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors ${
                        checked
                          ? 'border-teal-600 bg-teal-50/70 font-medium text-teal-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{option}</span>
                      <span className="text-xs text-slate-500">
                        {checked ? 'Selected' : 'Add'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Commute */}
            <div>
              <label htmlFor="commute-mode" className="block text-sm font-medium text-slate-900">
                Primary Daily Commute
              </label>
              <select
                id="commute-mode"
                value={draft.commuteMode}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    commuteMode: e.target.value as HouseholdProfile['commuteMode'],
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
              >
                {Object.entries(COMMUTE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              {draft.commuteMode !== 'remote' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">
                      Round-trip commute distance
                    </label>
                    <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {draft.commuteDistanceKm} km / day
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={60}
                    step={2}
                    value={draft.commuteDistanceKm}
                    onChange={(e) =>
                      setDraft({ ...draft, commuteDistanceKm: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full accent-teal-700"
                  />
                </div>
              )}
            </div>

            {/* Home Type & Air Purifier */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="home-type" className="block text-sm font-medium text-slate-900">
                  Home Structure
                </label>
                <select
                  id="home-type"
                  value={draft.homeType}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      homeType: e.target.value as HouseholdProfile['homeType'],
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
                >
                  {Object.entries(HOME_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900">
                  HEPA Air Purifier at Home
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, hasAirPurifier: true })}
                    className={`rounded-md py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      draft.hasAirPurifier
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yes, we own one
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, hasAirPurifier: false })}
                    className={`rounded-md py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      !draft.hasAirPurifier
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    No purifier yet
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="cooking-fuel" className="block text-sm font-medium text-slate-900">
                  Primary Cooking Fuel
                </label>
                <select
                  id="cooking-fuel"
                  value={draft.cookingFuel}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      cookingFuel: e.target.value as HouseholdProfile['cookingFuel'],
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15"
                >
                  {Object.entries(COOKING_FUEL_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priorities */}
            <div>
              <label className="block text-sm font-medium text-slate-900">
                Daily Clean-Air Priorities
              </label>
              <div className="mt-2.5 grid grid-cols-1 gap-2">
                {PRIORITY_OPTIONS.map((priority) => {
                  const checked = draft.priorities.includes(priority);
                  return (
                    <button
                      key={priority}
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          priorities: toggleItem(draft.priorities, priority),
                        })
                      }
                      className={`flex items-center justify-between rounded-lg border px-3.5 py-2 text-left text-sm transition-colors ${
                        checked
                          ? 'border-teal-600 bg-teal-50/70 font-medium text-teal-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{priority}</span>
                      <span className="text-xs text-slate-500">
                        {checked ? 'Active' : 'Add'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 whitespace-nowrap"
            >
              Save Profile & Regenerate Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
