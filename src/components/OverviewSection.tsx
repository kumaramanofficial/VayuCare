import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Clock,
  MapPin,
  ShieldAlert,
  SlidersHorizontal,
  Wind,
} from 'lucide-react';
import type {
  ActiveTab,
  AirQualityData,
  GeneratedAirPlan,
  HouseholdProfile,
} from '../types';
import { COMMUTE_LABELS, getAqiVisualTheme, HOME_TYPE_LABELS } from '../lib/aqi';

interface OverviewSectionProps {
  airQuality: AirQualityData;
  plan: GeneratedAirPlan | null;
  planLoading: boolean;
  planError: string | null;
  profile: HouseholdProfile;
  onRetryPlan: () => void;
  onOpenCityModal: () => void;
  onOpenProfile: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export function OverviewSection({
  airQuality,
  plan,
  planLoading,
  planError,
  profile,
  onRetryPlan,
  onOpenCityModal,
  onOpenProfile,
  onNavigate,
}: OverviewSectionProps) {
  const [chartMetric, setChartMetric] = useState<'pm25' | 'usAqi'>('pm25');
  const [heroImgError, setHeroImgError] = useState(false);

  const aqiTheme = getAqiVisualTheme(airQuality.current.usAqi);
  const locationLabel = [airQuality.location.name, airQuality.location.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-8">
      {/* Editorial 2-Column Hero Split (items-stretch, balanced height) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-slate-500">
              <span>{locationLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Observed {airQuality.observedAt.replace('T', ' ')}
              </span>
              {airQuality.weather.temperatureC !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {airQuality.weather.temperatureC}°C · {airQuality.weather.humidityPct}% RH · Wind {airQuality.weather.windKmh} km/h
                  </span>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-5xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-6xl">
                  {airQuality.current.usAqi}
                </span>
                <span className="text-sm font-medium text-slate-500">US AQI</span>
              </div>
              <div className={`text-base font-semibold ${aqiTheme.textClass}`}>
                {airQuality.current.level}
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              {airQuality.current.advisory}
            </p>

            {/* Key Personal Exposure Framing */}
            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Safest Ventilation Window (Next 24h)
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-teal-800 tabular-nums">
                  {airQuality.windows.safestVentilation.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Lowest predicted PM2.5 at{' '}
                  <span className="font-mono font-medium tabular-nums">
                    {airQuality.windows.safestVentilation.avgPm25} µg/m³
                  </span>{' '}
                  — crack opposite windows briefly here.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Peak Smog Danger Window
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-red-700 tabular-nums">
                  {airQuality.windows.peakSmog.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Peaks near{' '}
                  <span className="font-mono font-medium tabular-nums">
                    {airQuality.windows.peakSmog.avgPm25} µg/m³
                  </span>{' '}
                  — seal drafts and avoid outdoor exertion.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => onNavigate('routine')}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 whitespace-nowrap"
            >
              View Today's Routine
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenCityModal}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <MapPin className="h-4 w-4 text-slate-500" />
              Switch City
            </button>
            <button
              type="button"
              onClick={onOpenProfile}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              Edit Household
            </button>
          </div>
        </div>

        {/* Right Editorial Image Frame */}
        <div className="relative min-h-[260px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:col-span-5">
          {!heroImgError ? (
            <img
              src="/src/assets/images/hero_urban_smog_home_1795092220482.jpg"
              alt="Sealed sunlit urban apartment with indoor air purifier and foliage overlooking winter city haze"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-teal-50 p-6 text-center">
              <Wind className="h-10 w-10 text-teal-700" />
              <p className="mt-3 font-display text-lg font-semibold text-slate-800">
                Clean-Air Indoor Sanctuary
              </p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent p-6 text-white">
            <p className="text-xs font-medium text-slate-200">
              Active Household Profile
            </p>
            <p className="mt-1 font-display text-lg font-semibold leading-snug text-white">
              {profile.householdSize}-person {HOME_TYPE_LABELS[profile.homeType]}
            </p>
            <p className="mt-1 text-xs text-slate-200">
              {COMMUTE_LABELS[profile.commuteMode]} ·{' '}
              {profile.hasAirPurifier ? 'HEPA Purifier Active' : 'DIY / No Purifier Mode'}
            </p>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Pollutant Strip (Flat Single Elevation) */}
      <section className="grid grid-cols-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Fine Particulate PM2.5</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {airQuality.current.pm25}{' '}
            <span className="text-xs font-normal text-slate-500">µg/m³</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            <span className="font-mono font-medium text-slate-700 tabular-nums">
              {airQuality.current.whoMultiple}×
            </span>{' '}
            WHO 24h guideline (15 µg/m³)
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Coarse Dust PM10</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {airQuality.current.pm10}{' '}
            <span className="text-xs font-normal text-slate-500">µg/m³</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Road dust, construction & winter ash
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Traffic Nitrogen Dioxide</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {airQuality.current.no2}{' '}
            <span className="text-xs font-normal text-slate-500">µg/m³</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            NO₂ from diesel & petrol tailpipes
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Passive Exposure Equivalent</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {airQuality.current.cigaretteEquivalent}{' '}
            <span className="text-xs font-normal text-slate-500">cigs / day</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Berkeley Earth outdoor baseline (22 µg/m³ = 1)
          </p>
        </div>
      </section>

      {/* AI Tailored Daily Briefing + 24h Hourly Curve */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 24-Hour Hourly Smog Forecast Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 [text-wrap:balance]">
                24-Hour Dispersion & Smog Forecast
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Plan ventilation, commutes, and outdoor errands around hourly troughs.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setChartMetric('pm25')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  chartMetric === 'pm25'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PM2.5 (µg/m³)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('usAqi')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  chartMetric === 'usAqi'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                US AQI
              </button>
            </div>
          </div>

          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={airQuality.hourly}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="smogAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F766E" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="hourLabel"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [
                    chartMetric === 'pm25' ? `${value} µg/m³` : `${value} US AQI`,
                    chartMetric === 'pm25' ? 'PM2.5' : 'US AQI',
                  ]}
                />
                {chartMetric === 'pm25' && (
                  <ReferenceLine
                    y={60}
                    stroke="#EA580C"
                    strokeDasharray="4 4"
                    label={{
                      value: 'NAAQS Safe Limit (60)',
                      position: 'insideTopRight',
                      fill: '#C2410C',
                      fontSize: 11,
                    }}
                  />
                )}
                {chartMetric === 'usAqi' && (
                  <ReferenceLine
                    y={100}
                    stroke="#CA8A04"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Moderate Cap (100)',
                      position: 'insideTopRight',
                      fill: '#A16207',
                      fontSize: 11,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="#0F766E"
                  strokeWidth={2.2}
                  fill="url(#smogAreaFill)"
                  activeDot={{ r: 5, fill: '#0F766E', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GenAI Executive Briefing */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Tailored Family Briefing
              </h2>
              <span className="text-xs font-medium text-slate-500">
                Powered by Gemini
              </span>
            </div>

            {planLoading ? (
              <div className="mt-5 space-y-3" aria-busy="true">
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                <div className="mt-6 h-20 w-full animate-pulse rounded-lg bg-slate-100" />
                <div className="h-20 w-full animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : planError ? (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-900">
                  Could not generate tailored guidance
                </p>
                <p className="mt-1 text-xs text-red-700">{planError}</p>
                <button
                  type="button"
                  onClick={onRetryPlan}
                  className="mt-3 rounded-lg bg-red-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-800"
                >
                  Retry Plan Generation
                </button>
              </div>
            ) : plan ? (
              <div className="mt-4 space-y-5">
                <p className="text-sm leading-relaxed text-slate-700">
                  {plan.executiveSummary}
                </p>

                <div className="divide-y divide-slate-200 border-t border-slate-200">
                  <div className="py-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <ShieldAlert className="h-3.5 w-3.5 text-teal-700" />
                      <span>Mask & Respiratory Protocol</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {plan.maskAndOutdoorGuidance.maskGrade}
                    </p>
                  </div>

                  <div className="py-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-teal-700" />
                      <span>Outdoor Activity Guidance</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">
                      {plan.maskAndOutdoorGuidance.outdoorExerciseAdvice}
                    </p>
                  </div>

                  <div className="py-3.5">
                    <p className="text-xs font-medium text-slate-500">
                      Household Member Protection
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {plan.maskAndOutdoorGuidance.vulnerableMemberNote}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-sm font-medium">
            <button
              type="button"
              onClick={() => onNavigate('indoor')}
              className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900"
            >
              Indoor Air Hacks
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('impact')}
              className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900"
            >
              Choice Impact Simulator
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
