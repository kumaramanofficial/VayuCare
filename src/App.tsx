import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  CalendarClock,
  Home,
  MapPin,
  Menu,
  MessageSquare,
  RefreshCw,
  Scale,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type {
  ActiveTab,
  AirQualityData,
  CityOption,
  GeneratedAirPlan,
  HouseholdProfile,
} from './types';
import { DEFAULT_CITY, DEFAULT_PROFILE, getAqiVisualTheme } from './lib/aqi';
import { CitySearchModal } from './components/CitySearchModal';
import { HouseholdProfileDrawer } from './components/HouseholdProfileDrawer';
import { OverviewSection } from './components/OverviewSection';
import { DailyRoutineView } from './components/DailyRoutineView';
import { IndoorHacksView } from './components/IndoorHacksView';
import { ImpactSimulatorView } from './components/ImpactSimulatorView';
import { CommunityAdvisorView } from './components/CommunityAdvisorView';

const STORAGE_KEYS = {
  city: 'vayucare_city_v1',
  profile: 'vayucare_profile_v1',
  completedRoutine: 'vayucare_routine_done_v1',
};

function loadSaved<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  breadcrumb: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Live AQI Overview', breadcrumb: 'Overview', icon: Activity },
  { id: 'routine', label: 'Daily Routine', breadcrumb: 'Daily Routine', icon: CalendarClock },
  { id: 'indoor', label: 'Indoor Air Hacks', breadcrumb: 'Indoor Air Hacks', icon: Home },
  { id: 'impact', label: 'Impact Simulator', breadcrumb: 'Impact Simulator', icon: Scale },
  { id: 'community', label: 'Community & Advisor', breadcrumb: 'Community & Advisor', icon: MessageSquare },
];

export default function App() {
  const [city, setCity] = useState<CityOption>(() =>
    loadSaved<CityOption>(STORAGE_KEYS.city, DEFAULT_CITY)
  );
  const [profile, setProfile] = useState<HouseholdProfile>(() =>
    loadSaved<HouseholdProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE)
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [aqiLoading, setAqiLoading] = useState(true);
  const [aqiError, setAqiError] = useState<string | null>(null);

  const [plan, setPlan] = useState<GeneratedAirPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [completedRoutineIds, setCompletedRoutineIds] = useState<string[]>(() =>
    loadSaved<string[]>(STORAGE_KEYS.completedRoutine, [])
  );
  const [selectedSwapIds, setSelectedSwapIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.city, JSON.stringify(city));
    } catch {
      // Ignore storage quota errors
    }
  }, [city]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.completedRoutine,
        JSON.stringify(completedRoutineIds)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [completedRoutineIds]);

  const generatePlanFor = useCallback(
    async (aqData: AirQualityData, hhProfile: HouseholdProfile) => {
      setPlanLoading(true);
      setPlanError(null);
      try {
        const res = await fetch('/api/ai/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ airQuality: aqData, profile: hhProfile }),
        });
        const data = (await res.json()) as {
          plan?: GeneratedAirPlan;
          error?: string;
        };
        if (!res.ok || !data.plan) {
          throw new Error(data.error || 'Could not generate tailored action plan.');
        }
        setPlan(data.plan);
        // Pre-select the first 3 sustainable swaps so impact simulator starts alive and measurable
        setSelectedSwapIds(
          (data.plan.sustainableSwaps || []).slice(0, 3).map((s) => s.id)
        );
      } catch (err: unknown) {
        setPlanError(
          err instanceof Error ? err.message : 'Failed to generate personalized plan.'
        );
      } finally {
        setPlanLoading(false);
      }
    },
    []
  );

  const fetchAirQualityAndPlan = useCallback(
    async (targetCity: CityOption, targetProfile: HouseholdProfile) => {
      setAqiLoading(true);
      setAqiError(null);
      try {
        const params = new URLSearchParams({
          lat: String(targetCity.latitude),
          lon: String(targetCity.longitude),
          city: targetCity.name,
          admin1: targetCity.admin1,
          country: targetCity.country,
        });
        const res = await fetch(`/api/air-quality?${params.toString()}`);
        const data = (await res.json()) as AirQualityData & { error?: string };
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Unable to fetch air quality readings.');
        }
        setAirQuality(data);
        setAqiLoading(false);
        await generatePlanFor(data, targetProfile);
      } catch (err: unknown) {
        setAqiError(
          err instanceof Error ? err.message : 'Air quality telemetry fetch failed.'
        );
        setAqiLoading(false);
      }
    },
    [generatePlanFor]
  );

  useEffect(() => {
    fetchAirQualityAndPlan(city, profile);
    // Run on city change; profile saves explicitly trigger regeneration via handleSaveProfile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const handleSaveProfile = (nextProfile: HouseholdProfile) => {
    setProfile(nextProfile);
    if (airQuality) {
      generatePlanFor(airQuality, nextProfile);
    }
  };

  const handleToggleRoutine = (id: string) => {
    setCompletedRoutineIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSwap = (id: string) => {
    setSelectedSwapIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const activeNav = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];
  const aqiTheme = airQuality ? getAqiVisualTheme(airQuality.current.usAqi) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-[256px] lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white lg:sticky lg:top-0 lg:h-screen">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('overview');
            }}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
          >
            VayuCare
          </a>
        </div>

        {/* Active City Telemetry Summary */}
        <div className="border-b border-slate-200 px-6 py-5">
          <button
            type="button"
            onClick={() => setCityModalOpen(true)}
            className="group flex w-full items-start justify-between text-left"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Monitored City</p>
              <p className="mt-0.5 truncate font-display text-base font-semibold text-slate-900 group-hover:text-teal-800">
                {city.name}
              </p>
            </div>
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-slate-400 group-hover:text-teal-700" />
          </button>

          {airQuality && aqiTheme && (
            <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
              <div>
                <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  {airQuality.current.usAqi}
                </span>
                <span className="ml-1.5 text-xs text-slate-500">AQI</span>
              </div>
              <span className={`text-xs font-semibold ${aqiTheme.textClass}`}>
                {aqiTheme.label}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav aria-label="Workspace navigation" className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-teal-700' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Household Profile Trigger */}
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() => setProfileDrawerOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900">
                Household Profile
              </p>
              <p className="truncate text-xs text-slate-500">
                {profile.householdSize} people · {profile.members.length} sensitivities
              </p>
            </div>
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-[2px]"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="flex h-full w-72 flex-col bg-white border-r border-slate-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
              <span className="font-display text-lg font-bold text-slate-900">
                VayuCare
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-teal-700' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="space-y-2 border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setCityModalOpen(true);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-700"
              >
                <span>Location: {city.name}</span>
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setProfileDrawerOpen(true);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-700"
              >
                <span>Edit Household Profile</span>
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Contract: Contextual Breadcrumb Left — Primary Action Right */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-6 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="font-display font-bold text-slate-900 lg:hidden whitespace-nowrap">
                VayuCare
              </span>
              <span className="text-slate-300 lg:hidden" aria-hidden="true">
                /
              </span>
              <button
                type="button"
                onClick={() => setCityModalOpen(true)}
                className="truncate font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                {city.name}
              </button>
              <span className="text-slate-300" aria-hidden="true">
                /
              </span>
              <span className="truncate font-semibold text-slate-900">
                {activeNav.breadcrumb}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={aqiLoading || planLoading}
              onClick={() => fetchAirQualityAndPlan(city, profile)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${aqiLoading || planLoading ? 'animate-spin' : ''}`}
              />
              {aqiLoading || planLoading ? 'Updating...' : 'Refresh Plan'}
            </button>
          </div>
        </header>

        {/* Main Viewport Container */}
        <main id="top" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {aqiLoading && !airQuality ? (
            <div className="space-y-6" aria-busy="true">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white lg:col-span-7" />
                <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white lg:col-span-5" />
              </div>
              <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
              <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
            </div>
          ) : aqiError && !airQuality ? (
            <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
              <h1 className="font-display text-xl font-semibold text-slate-900">
                Unable to load live air quality telemetry
              </h1>
              <p className="mt-2 text-sm text-red-700">{aqiError}</p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchAirQualityAndPlan(city, profile)}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                >
                  Retry Telemetry
                </button>
                <button
                  type="button"
                  onClick={() => setCityModalOpen(true)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Choose Another City
                </button>
              </div>
            </div>
          ) : airQuality ? (
            <>
              {activeTab === 'overview' && (
                <OverviewSection
                  airQuality={airQuality}
                  plan={plan}
                  planLoading={planLoading}
                  planError={planError}
                  profile={profile}
                  onRetryPlan={() => generatePlanFor(airQuality, profile)}
                  onOpenCityModal={() => setCityModalOpen(true)}
                  onOpenProfile={() => setProfileDrawerOpen(true)}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'routine' && (
                <DailyRoutineView
                  airQuality={airQuality}
                  plan={plan}
                  planLoading={planLoading}
                  planError={planError}
                  completedIds={completedRoutineIds}
                  onToggleComplete={handleToggleRoutine}
                  onResetCompleted={() => setCompletedRoutineIds([])}
                  onRetryPlan={() => generatePlanFor(airQuality, profile)}
                />
              )}

              {activeTab === 'indoor' && (
                <IndoorHacksView
                  airQuality={airQuality}
                  profile={profile}
                  plan={plan}
                  planLoading={planLoading}
                  planError={planError}
                  onRetryPlan={() => generatePlanFor(airQuality, profile)}
                />
              )}

              {activeTab === 'impact' && (
                <ImpactSimulatorView
                  airQuality={airQuality}
                  plan={plan}
                  planLoading={planLoading}
                  planError={planError}
                  selectedSwapIds={selectedSwapIds}
                  onToggleSwap={handleToggleSwap}
                  onRetryPlan={() => generatePlanFor(airQuality, profile)}
                />
              )}

              {activeTab === 'community' && (
                <CommunityAdvisorView
                  airQuality={airQuality}
                  profile={profile}
                  plan={plan}
                  planLoading={planLoading}
                />
              )}
            </>
          ) : null}
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-xs text-slate-500 sm:px-8">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2">
            <span>VayuCare · Urban Air Quality Assistant</span>
            <span>
              Live atmospheric readings via Open-Meteo Air Quality · Health guidance is informational, consult a physician for acute respiratory distress
            </span>
          </div>
        </footer>
      </div>

      {/* Modals & Drawers */}
      <CitySearchModal
        isOpen={cityModalOpen}
        currentCity={city}
        onSelect={setCity}
        onClose={() => setCityModalOpen(false)}
      />

      <HouseholdProfileDrawer
        isOpen={profileDrawerOpen}
        profile={profile}
        onSave={handleSaveProfile}
        onClose={() => setProfileDrawerOpen(false)}
      />
    </div>
  );
}
