import React, { useState } from 'react';
import { Check, Leaf } from 'lucide-react';
import type { AirQualityData, GeneratedAirPlan } from '../types';

interface ImpactSimulatorViewProps {
  airQuality: AirQualityData;
  plan: GeneratedAirPlan | null;
  planLoading: boolean;
  planError: string | null;
  selectedSwapIds: string[];
  onToggleSwap: (id: string) => void;
  onRetryPlan: () => void;
}

export function ImpactSimulatorView({
  airQuality,
  plan,
  planLoading,
  planError,
  selectedSwapIds,
  onToggleSwap,
  onRetryPlan,
}: ImpactSimulatorViewProps) {
  const [communityHouseholds, setCommunityHouseholds] = useState(500);
  const [imgError, setImgError] = useState(false);

  if (planLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Impact Simulator Unavailable
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {planError || 'Generate your plan to simulate the direct impact of sustainable lifestyle choices.'}
        </p>
        <button
          type="button"
          onClick={onRetryPlan}
          className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Generate Alternatives
        </button>
      </div>
    );
  }

  const swaps = plan.sustainableSwaps || [];
  const activeSwaps = swaps.filter((swap) => selectedSwapIds.includes(swap.id));

  const weeklyCo2Kg = activeSwaps.reduce((sum, s) => sum + s.weeklyCo2SavedKg, 0);
  const annualCo2Kg = weeklyCo2Kg * 52;
  const weeklyPm25Grams = activeSwaps.reduce(
    (sum, s) => sum + s.weeklyPm25PreventedGrams,
    0
  );
  const winterSeasonPm25Grams = weeklyPm25Grams * 16; // 16-week Nov–Feb winter smog season
  const combinedExposureDropPct = Math.min(
    65,
    Math.round(
      activeSwaps.reduce((sum, s) => sum + s.personalExposureDropPct, 0) * 0.7
    )
  );
  const avoidedCigaretteEqPerWeek = Number(
    ((airQuality.current.pm25 * (combinedExposureDropPct / 100) * 7) / 22).toFixed(1)
  );

  // Community scale projection over the 16-week winter smog season
  const communityCo2Tonnes = (weeklyCo2Kg * 16 * communityHouseholds) / 1000;
  const communityPm25Kg = (weeklyPm25Grams * 16 * communityHouseholds) / 1000;

  return (
    <div className="space-y-6">
      {/* Quantified Live Impact Readout Strip */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 [text-wrap:balance]">
              Sustainable Alternatives & Direct Impact Simulator
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Toggle everyday swaps below to see exactly how your household choices reduce inhaled pollution and local emissions in {airQuality.location.name}.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {activeSwaps.length} of {swaps.length} choices adopted
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 divide-y divide-slate-200 border-t border-slate-200 pt-5 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="py-3 sm:py-0 sm:pr-5">
            <p className="text-xs font-medium text-slate-500">Annual CO₂e Avoided</p>
            <p className="mt-1.5 font-mono text-2xl font-semibold text-teal-800 tabular-nums">
              {annualCo2Kg.toFixed(0)}{' '}
              <span className="text-xs font-normal text-slate-500">kg / year</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-mono tabular-nums">{weeklyCo2Kg.toFixed(1)} kg</span> every week
            </p>
          </div>

          <div className="py-3 sm:px-5 sm:py-0">
            <p className="text-xs font-medium text-slate-500">Winter PM2.5 Prevented</p>
            <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {winterSeasonPm25Grams.toFixed(0)}{' '}
              <span className="text-xs font-normal text-slate-500">grams</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Directly kept out of {airQuality.location.name} air (16 wks)
            </p>
          </div>

          <div className="py-3 sm:px-5 sm:py-0">
            <p className="text-xs font-medium text-slate-500">Personal Exposure Drop</p>
            <p className="mt-1.5 font-mono text-2xl font-semibold text-teal-800 tabular-nums">
              -{combinedExposureDropPct}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Combined commute & indoor reduction
            </p>
          </div>

          <div className="py-3 sm:pl-5 sm:py-0">
            <p className="text-xs font-medium text-slate-500">Cleaner Breathing Dividend</p>
            <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {avoidedCigaretteEqPerWeek}{' '}
              <span className="text-xs font-normal text-slate-500">cigs eq / wk</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Avoided particulate burden per adult
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Toggle List */}
      <section className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {swaps.map((swap) => {
          const isSelected = selectedSwapIds.includes(swap.id);
          return (
            <div
              key={swap.id}
              className={`p-6 transition-colors ${isSelected ? 'bg-teal-50/35' : 'bg-white'}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => onToggleSwap(swap.id)}
                    aria-pressed={isSelected}
                    aria-label={`Toggle sustainable choice: ${swap.title}`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      isSelected
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-slate-300 bg-white text-transparent hover:border-teal-600'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-medium text-teal-800">{swap.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        -{swap.weeklyCo2SavedKg} kg CO₂e / wk
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        -{swap.weeklyPm25PreventedGrams} g PM2.5 / wk
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        -{swap.personalExposureDropPct}% exposure
                      </span>
                    </div>

                    <h2 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
                      {swap.title}
                    </h2>

                    <div className="mt-2.5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Instead of</p>
                        <p className="mt-0.5 text-slate-700">{swap.currentHabit}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-teal-800">Switch to</p>
                        <p className="mt-0.5 font-medium text-slate-900">
                          {swap.sustainableAlternative}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      <span className="font-medium text-slate-900">Direct impact: </span>
                      {swap.directImpactExplanation}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 sm:ml-4">
                  <button
                    type="button"
                    onClick={() => onToggleSwap(swap.id)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-teal-700 text-white hover:bg-teal-800'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? 'Included in Plan' : 'Adopt Swap'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Community Multiplier Section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div>
            <p className="text-xs font-medium text-teal-800">
              Collective Neighbourhood Scale
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-slate-900 [text-wrap:balance]">
              What happens if your RWA or neighbourhood adopts these exact swaps?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Slide to model collective participation across apartments, schools, or local commuter groups during the 16-week winter smog season.
            </p>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="community-slider"
                  className="text-sm font-medium text-slate-900"
                >
                  Participating Households in {airQuality.location.name}
                </label>
                <span className="font-mono text-lg font-semibold text-teal-800 tabular-nums">
                  {communityHouseholds.toLocaleString()} homes
                </span>
              </div>
              <input
                id="community-slider"
                type="range"
                min={25}
                max={5000}
                step={25}
                value={communityHouseholds}
                onChange={(e) => setCommunityHouseholds(Number(e.target.value))}
                className="mt-2.5 w-full accent-teal-700"
              />
              <div className="mt-1 flex justify-between font-mono text-xs text-slate-400 tabular-nums">
                <span>25 homes</span>
                <span>1,000 homes</span>
                <span>5,000 homes</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Winter CO₂e Prevented Together
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {communityCo2Tonnes.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">metric tonnes</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Local Exhaust & Smoke PM2.5 Prevented
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold text-teal-800 tabular-nums">
                {communityPm25Kg.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">kg fine soot</span>
              </p>
            </div>
          </div>
        </div>

        <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:col-span-5">
          {!imgError ? (
            <img
              src="/src/assets/images/community_clean_commute_1795092224070.jpg"
              alt="Urban families walking and cycling alongside an elevated metro transit station during crisp winter morning light"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-6 text-center">
              <Leaf className="h-8 w-8 text-teal-700" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                Low-Emission Urban Mobility
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
