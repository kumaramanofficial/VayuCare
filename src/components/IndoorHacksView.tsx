import React, { useState } from 'react';
import { Wind } from 'lucide-react';
import type { AirQualityData, GeneratedAirPlan, HouseholdProfile } from '../types';
import { COOKING_FUEL_LABELS, HOME_TYPE_LABELS } from '../lib/aqi';

interface IndoorHacksViewProps {
  airQuality: AirQualityData;
  profile: HouseholdProfile;
  plan: GeneratedAirPlan | null;
  planLoading: boolean;
  planError: string | null;
  onRetryPlan: () => void;
}

const BUDGET_FILTERS = ['All', 'Zero Cost', 'Low Cost', 'Equipment'] as const;

export function IndoorHacksView({
  airQuality,
  profile,
  plan,
  planLoading,
  planError,
  onRetryPlan,
}: IndoorHacksViewProps) {
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [imgError, setImgError] = useState(false);

  if (planLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Indoor Air Hacks Unavailable
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {planError || 'Generate your plan to see indoor air hacks tailored to your home.'}
        </p>
        <button
          type="button"
          onClick={onRetryPlan}
          className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Generate Indoor Hacks
        </button>
      </div>
    );
  }

  const allHacks = plan.indoorHacks || [];
  const filteredHacks =
    selectedTier === 'All'
      ? allHacks
      : allHacks.filter(
          (hack) => hack.budgetTier.toLowerCase() === selectedTier.toLowerCase()
        );

  return (
    <div className="space-y-6">
      {/* Editorial Intro Split */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 sm:p-7 lg:col-span-8">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
              <span>{HOME_TYPE_LABELS[profile.homeType]}</span>
              <span aria-hidden="true">·</span>
              <span>{COOKING_FUEL_LABELS[profile.cookingFuel]}</span>
              <span aria-hidden="true">·</span>
              <span>
                {profile.hasAirPurifier ? 'HEPA Purifier Owned' : 'Zero-Purifier DIY Priority'}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold text-slate-900 [text-wrap:balance]">
              Practical Indoor Air Quality Hacks
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              During severe winter smog ({airQuality.current.pm25} µg/m³ outdoors), indoor air often reaches 55–80% of outdoor PM2.5 through door gaps, kitchen fumes, and dry sweeping. Every hack below is adapted to your exact home setup.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {BUDGET_FILTERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedTier(tier)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedTier === tier
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              Showing {filteredHacks.length} of {allHacks.length} protocols
            </span>
          </div>
        </div>

        <div className="relative min-h-[200px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:col-span-4">
          {!imgError ? (
            <img
              src="/src/assets/images/hack_indoor_purifier_1795092219549.jpg"
              alt="Clean sunlit bedroom corner with compact HEPA air purifier, hygrometer, and ceramic plant"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-6 text-center">
              <Wind className="h-8 w-8 text-teal-700" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                Indoor Clean-Air Zone
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Hacks Grid */}
      {filteredHacks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            No indoor hacks in the "{selectedTier}" tier for this plan. Switch to "All" to view every protocol.
          </p>
          <button
            type="button"
            onClick={() => setSelectedTier('All')}
            className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Show All Hacks
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredHacks.map((hack, idx) => (
            <article
              key={hack.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6"
            >
              <div>
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-teal-800 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{hack.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">{hack.budgetTier}</span>
                  <span aria-hidden="true">·</span>
                  <span>{hack.timeRequired}</span>
                </div>

                <h2 className="mt-2 font-display text-lg font-semibold text-slate-900">
                  {hack.title}
                </h2>

                <p className="mt-1 font-mono text-xs font-semibold text-teal-800">
                  Expected Impact: {hack.estimatedPm25Drop}
                </p>

                <ol className="mt-4 space-y-2 text-sm text-slate-700">
                  {hack.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-2.5">
                      <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums pt-0.5">
                        {stepIndex + 1}.
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-5 space-y-2.5 border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">How it works: </span>
                  {hack.whyItWorks}
                </p>
                <p>
                  <span className="font-semibold text-teal-800">Why it fits your home: </span>
                  {hack.tailoredNote}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
