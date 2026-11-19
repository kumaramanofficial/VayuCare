import React, { useRef, useState } from 'react';
import { Check, Copy, Send } from 'lucide-react';
import type {
  AirQualityData,
  ChatMessage,
  GeneratedAirPlan,
  HouseholdProfile,
} from '../types';

interface CommunityAdvisorViewProps {
  airQuality: AirQualityData;
  profile: HouseholdProfile;
  plan: GeneratedAirPlan | null;
  planLoading: boolean;
}

const STARTER_PROMPTS = [
  'Is it safe for children to play outdoors during the safest window today?',
  'How do I build an effective DIY box-fan air filter on a budget?',
  'Do indoor plants actually lower PM2.5 during severe winter smog?',
  'How can our apartment RWA reduce morning car-idle emissions at the gate?',
];

export function CommunityAdvisorView({
  airQuality,
  profile,
  plan,
  planLoading,
}: CommunityAdvisorViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `I'm tracking live air quality for ${airQuality.location.name} (currently US AQI ${airQuality.current.usAqi}, PM2.5 ${airQuality.current.pm25} µg/m³). Ask me about safe outdoor windows, DIY indoor filtration, protecting children or seniors, or comparing the emission impact of daily choices.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    setChatError(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          airQuality,
          profile,
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Unable to reach advisor right now.');
      }

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...nextHistory, botMsg]);
      setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : 'Advisor request failed.');
    } finally {
      setSending(false);
    }
  };

  const handleCopyNotice = async () => {
    if (!plan?.communityPlaybook?.whatsappMessage) return;
    try {
      await navigator.clipboard.writeText(plan.communityPlaybook.whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      {/* Left: Live Grounded GenAI Clean-Air Advisor */}
      <section className="flex flex-col rounded-xl border border-slate-200 bg-white lg:col-span-7">
        <div className="border-b border-slate-200 px-6 py-4">
          <h1 className="font-display text-xl font-semibold text-slate-900">
            Smog & Clean-Air Advisor
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Grounded in {airQuality.location.name}'s live PM2.5 ({airQuality.current.pm25} µg/m³) and your household profile
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5 max-h-[460px] min-h-[340px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-teal-700 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                {msg.text}
              </div>
              <span className="mt-1 font-mono text-[11px] text-slate-400 tabular-nums">
                {msg.role === 'user' ? 'You' : 'VayuCare Advisor'} · {msg.timestamp}
              </span>
            </div>
          ))}
          {sending && (
            <div className="flex items-start">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Analyzing live telemetry and household context...
              </div>
            </div>
          )}
          {chatError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
              {chatError}
            </div>
          )}
          <div ref={listEndRef} />
        </div>

        {/* Starter Prompts */}
        <div className="border-t border-slate-100 px-6 py-3">
          <p className="text-xs font-medium text-slate-500">Quick questions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(prompt)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-700 transition-colors hover:border-teal-600 hover:text-teal-900 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2 border-t border-slate-200 px-6 py-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about masks, school commute, indoor hacks, or air science..."
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/15"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </section>

      {/* Right: Neighbourhood / RWA Community Playbook */}
      <section className="space-y-5 lg:col-span-5">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-teal-800">
                Community & RWA Advisory
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold text-slate-900 [text-wrap:balance]">
                {plan?.communityPlaybook?.headline ||
                  `Today's Clean-Air Notice for ${airQuality.location.name}`}
              </h2>
            </div>
            <button
              type="button"
              disabled={!plan?.communityPlaybook?.whatsappMessage}
              onClick={handleCopyNotice}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-teal-700" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Notice
                </>
              )}
            </button>
          </div>

          {planLoading ? (
            <div className="mt-4 space-y-2.5" aria-busy="true">
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
          ) : plan?.communityPlaybook ? (
            <>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                {plan.communityPlaybook.whatsappMessage}
              </div>

              <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
                <h3 className="text-xs font-semibold text-slate-900">
                  High-Impact Neighbourhood Actions
                </h3>
                <div className="divide-y divide-slate-200">
                  {plan.communityPlaybook.collectiveActions.map((act, idx) => (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {String(idx + 1).padStart(2, '0')}. {act.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {act.description}
                      </p>
                      <p className="mt-1 text-xs font-medium text-teal-800">
                        Direct impact: {act.expectedImpact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Generate your location plan to draft a shareable RWA or school parent group notice.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
