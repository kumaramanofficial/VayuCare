import React, { useRef, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';

const CHAPTERS = [
  {
    num: '01',
    time: '00:00',
    startSec: 0,
    title: 'Severe Winter Smog & VayuCare Overview',
    summary:
      'Introduces VayuCare and shows how real-time hyperlocal AQI telemetry translates raw winter smog levels into actionable family protection.',
  },
  {
    num: '02',
    time: '00:35',
    startSec: 35.02,
    title: 'Live Hyperlocal AQI & 24-Hour Dispersion Forecast',
    summary:
      'Breaks down PM2.5, PM10, NO₂, WHO guideline multiples, passive cigarette equivalence, and automatic Safest Ventilation vs Peak Smog windows.',
  },
  {
    num: '03',
    time: '01:05',
    startSec: 65.28,
    title: 'Household Profile & Low-Emission Daily Routine',
    summary:
      'Explains how family sensitivities, commute mode, and home structure drive a time-blocked Gemini daily checklist with live CO₂e and PM2.5 exposure savings.',
  },
  {
    num: '04',
    time: '01:37',
    startSec: 97.06,
    title: 'Practical Indoor Air Quality Hacks',
    summary:
      'Walks through Zero-Cost, Low-Cost, and Equipment protocols—door-draft sealing, exhaust-first cooking, wet mopping, DIY box-fan filtration, and HEPA placement.',
  },
  {
    num: '05',
    time: '02:10',
    startSec: 130.4,
    title: 'Sustainable Alternatives & Community Impact Simulator',
    summary:
      'Demonstrates interactive lifestyle swap toggles calculating annual CO₂e avoided, winter PM2.5 soot prevented, and neighbourhood scale across 25 to 5,000 homes.',
  },
  {
    num: '06',
    time: '02:41',
    startSec: 161.1,
    title: 'Grounded AI Advisor & RWA Community Playbook',
    summary:
      'Covers the multi-turn Gemini Smog Advisor grounded in live city telemetry and the one-click copyable RWA/school WhatsApp smog advisory.',
  },
];

export default function PresentationPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState(false);

  const seekTo = (sec: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = sec;
    vid.play().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
            VayuCare Presentation
          </span>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Open App
            </a>
            <a
              href="/presentation-assets/vayucare-presentation.mp4"
              download="VayuCare-Feature-Presentation.mp4"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-teal-500 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Download MP4
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        <div>
          <p className="text-xs font-medium text-teal-400">
            Standalone Presentation Video · 1280×720 H.264 / AAC · 03:07 · Gemini 3.8 Studio Narration
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold text-white [text-wrap:balance]">
            VayuCare — Detailed Feature Walkthrough
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Unlisted presentation video kept completely separate from the main VayuCare application. Play full-screen or download the universal MP4 for slides and submissions.
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-black shadow-2xl">
          {videoError ? (
            <div className="flex aspect-video flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-medium text-slate-200">
                Presentation video file could not be loaded.
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              playsInline
              preload="metadata"
              onError={() => setVideoError(true)}
              className="aspect-video w-full bg-black"
              src="/presentation-assets/vayucare-presentation.mp4"
            />
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-display text-base font-semibold text-white">
              Presentation Chapters
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Click any chapter to jump directly to that section in the video.
            </p>
          </div>
          <div className="divide-y divide-slate-800">
            {CHAPTERS.map((ch) => (
              <button
                key={ch.num}
                type="button"
                onClick={() => seekTo(ch.startSec)}
                className="flex w-full flex-col gap-1 px-6 py-4 text-left transition-colors hover:bg-slate-800/60 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <div>
                  <span className="font-mono text-xs font-semibold text-teal-400 tabular-nums">
                    {ch.num}.
                  </span>{' '}
                  <span className="font-display text-sm font-semibold text-white">
                    {ch.title}
                  </span>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {ch.summary}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-slate-400 tabular-nums">
                  {ch.time}
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
