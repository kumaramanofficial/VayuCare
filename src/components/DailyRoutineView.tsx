import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { AirQualityData, GeneratedAirPlan } from '../types';

interface DailyRoutineViewProps {
  airQuality: AirQualityData;
  plan: GeneratedAirPlan | null;
  planLoading: boolean;
  planError: string | null;
  completedIds: string[];
  onToggleComplete: (id: string) => void;
  onResetCompleted: () => void;
  onRetryPlan: () => void;
}

export function DailyRoutineView({
  airQuality,
  plan,
  planLoading,
  planError,
  completedIds,
  onToggleComplete,
  onResetCompleted,
  onRetryPlan,
}: DailyRoutineViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (planLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          Routine Unavailable
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {planError || 'Generate your daily plan to view time-blocked low-emission routines.'}
        </p>
        <button
          type="button"
          onClick={onRetryPlan}
          className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Generate Daily Routine
        </button>
      </div>
    );
  }

  const routine = plan.dailyRoutine || [];
  const completedItems = routine.filter((item) => completedIds.includes(item.id));
  const totalCo2Today = completedItems.reduce((sum, item) => sum + item.co2SavedGrams, 0);
  const maxCo2Today = routine.reduce((sum, item) => sum + item.co2SavedGrams, 0);
  const avgExposureDrop =
    completedItems.length > 0
      ? Math.min(
          68,
          Math.round(
            completedItems.reduce((sum, item) => sum + item.exposureReductionPct, 0) * 0.45
          )
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header & Progress Bar Strip */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 [text-wrap:balance]">
              Low-Emission Daily Routine for {airQuality.location.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Timed around today's safest ventilation window ({airQuality.windows.safestVentilation.label}) and peak smog alert ({airQuality.windows.peakSmog.label}).
            </p>
          </div>
          {completedIds.length > 0 && (
            <button
              type="button"
              onClick={onResetCompleted}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Day
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Steps Completed Today</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {completedItems.length} / {routine.length}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Emissions Avoided Today</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-teal-800 tabular-nums">
              {(totalCo2Today / 1000).toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {(maxCo2Today / 1000).toFixed(2)} kg CO₂e
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Estimated Inhaled PM2.5 Drop</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-teal-800 tabular-nums">
              {avgExposureDrop}%
            </p>
          </div>
        </div>
      </section>

      {/* Time-Blocked Schedule */}
      <section className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {routine.map((item, idx) => {
          const isDone = completedIds.includes(item.id);
          const isExpanded = expandedId === item.id;

          return (
            <article
              key={item.id}
              className={`p-6 transition-colors ${isDone ? 'bg-slate-50/70' : 'bg-white'}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => onToggleComplete(item.id)}
                    aria-label={isDone ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      isDone
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-slate-300 bg-white text-transparent hover:border-teal-600'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-teal-800 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}. {item.timeSlot}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.phase}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        -{item.exposureReductionPct}% PM2.5 exposure
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {item.co2SavedGrams} g CO₂e saved
                      </span>
                    </div>

                    <h2
                      className={`mt-1.5 font-display text-lg font-semibold ${
                        isDone ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </h2>

                    <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                      {item.action}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Low-emission choice: </span>
                      {item.lowEmissionHabit}
                    </p>

                    {isExpanded && (
                      <div className="mt-3.5 border-t border-slate-200 pt-3.5 text-sm text-slate-700">
                        <p className="text-xs font-semibold text-teal-800">
                          Direct Impact Science
                        </p>
                        <p className="mt-1 leading-relaxed">
                          {item.directImpactExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center sm:ml-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
                  >
                    {isExpanded ? 'Hide Impact' : 'Why This Matters'}
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
