import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status)
          : undefined;
      // Do not retry auth or invalid argument errors
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        throw err;
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

interface PresetCity {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
}

const PRESET_CITIES: PresetCity[] = [
  { name: 'New Delhi', admin1: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 },
  { name: 'Gurugram', admin1: 'Haryana', country: 'India', latitude: 28.4595, longitude: 77.0266 },
  { name: 'Noida', admin1: 'Uttar Pradesh', country: 'India', latitude: 28.5355, longitude: 77.391 },
  { name: 'Mumbai', admin1: 'Maharashtra', country: 'India', latitude: 19.076, longitude: 72.8777 },
  { name: 'Bengaluru', admin1: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Kolkata', admin1: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Lucknow', admin1: 'Uttar Pradesh', country: 'India', latitude: 26.8467, longitude: 80.9462 },
  { name: 'Chandigarh', admin1: 'Chandigarh', country: 'India', latitude: 30.7333, longitude: 76.7794 },
  { name: 'Lahore', admin1: 'Punjab', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587 },
  { name: 'Beijing', admin1: 'Beijing', country: 'China', latitude: 39.9042, longitude: 116.4074 },
  { name: 'London', admin1: 'England', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276 },
];

function formatHourLabel(isoString: string): string {
  const parts = isoString.split('T');
  const timePart = parts[1] || '00:00';
  const hourNum = parseInt(timePart.split(':')[0] || '0', 10);
  if (hourNum === 0) return '12 AM';
  if (hourNum < 12) return `${hourNum} AM`;
  if (hourNum === 12) return '12 PM';
  return `${hourNum - 12} PM`;
}

function classifyUsAqi(aqi: number): { level: string; advisory: string } {
  if (aqi <= 50) {
    return {
      level: 'Good',
      advisory: 'Air quality is satisfactory. Ideal for outdoor activity and natural cross-ventilation.',
    };
  }
  if (aqi <= 100) {
    return {
      level: 'Moderate',
      advisory: 'Acceptable air quality; unusually sensitive individuals should limit prolonged outdoor exertion.',
    };
  }
  if (aqi <= 150) {
    return {
      level: 'Unhealthy for Sensitive Groups',
      advisory: 'Children, older adults, and people with asthma or heart conditions should reduce heavy outdoor activity.',
    };
  }
  if (aqi <= 200) {
    return {
      level: 'Unhealthy',
      advisory: 'Everyone may begin to experience respiratory irritation. Use N95 masks outdoors and shift exercise indoors.',
    };
  }
  if (aqi <= 300) {
    return {
      level: 'Very Unhealthy',
      advisory: 'Health alert: winter smog inversion likely. Seal drafts, run filtration, and avoid non-essential outdoor exposure.',
    };
  }
  return {
    level: 'Hazardous',
    advisory: 'Emergency air pollution levels. Keep windows sealed, operate HEPA filtration continuously, and protect vulnerable members.',
  };
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/cities', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.json({ results: PRESET_CITIES });
      return;
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding service returned ${response.status}`);
    }
    const data = (await response.json()) as {
      results?: Array<{
        name: string;
        admin1?: string;
        country?: string;
        latitude: number;
        longitude: number;
      }>;
    };

    const results: PresetCity[] = (data.results || []).map((item) => ({
      name: item.name,
      admin1: item.admin1 || '',
      country: item.country || '',
      latitude: item.latitude,
      longitude: item.longitude,
    }));

    res.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to search cities';
    res.status(500).json({ error: message });
  }
});

app.get('/api/air-quality', async (req, res) => {
  try {
    const lat = Number(req.query.lat ?? 28.6139);
    const lon = Number(req.query.lon ?? 77.209);
    const city = String(req.query.city || 'New Delhi');
    const admin1 = String(req.query.admin1 || 'Delhi');
    const country = String(req.query.country || 'India');

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.status(400).json({ error: 'Valid latitude and longitude coordinates are required.' });
      return;
    }

    const aqiUrl =
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
      `&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust` +
      `&hourly=pm2_5,pm10,us_aqi,nitrogen_dioxide,ozone` +
      `&forecast_days=2&timezone=auto`;

    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

    const [aqiResp, weatherResp] = await Promise.all([fetch(aqiUrl), fetch(weatherUrl)]);

    if (!aqiResp.ok) {
      throw new Error(`Air quality telemetry service returned HTTP ${aqiResp.status}`);
    }

    const aqiJson = (await aqiResp.json()) as {
      timezone?: string;
      current?: {
        time: string;
        us_aqi: number | null;
        pm2_5: number | null;
        pm10: number | null;
        nitrogen_dioxide: number | null;
        ozone: number | null;
        sulphur_dioxide: number | null;
        carbon_monoxide: number | null;
        dust: number | null;
      };
      hourly?: {
        time: string[];
        pm2_5: Array<number | null>;
        pm10: Array<number | null>;
        us_aqi: Array<number | null>;
        nitrogen_dioxide: Array<number | null>;
        ozone: Array<number | null>;
      };
    };

    let weather = { temperatureC: null as number | null, humidityPct: null as number | null, windKmh: null as number | null };
    if (weatherResp.ok) {
      const wJson = (await weatherResp.json()) as {
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          wind_speed_10m?: number;
        };
      };
      weather = {
        temperatureC: wJson.current?.temperature_2m ?? null,
        humidityPct: wJson.current?.relative_humidity_2m ?? null,
        windKmh: wJson.current?.wind_speed_10m ?? null,
      };
    }

    const current = aqiJson.current;
    const hourly = aqiJson.hourly;
    if (!current || !hourly) {
      throw new Error('Incomplete air quality telemetry received from Open-Meteo.');
    }

    const currentTime = current.time;
    const allTimes = hourly.time || [];
    let startIdx = allTimes.findIndex((t) => t >= currentTime.slice(0, 13));
    if (startIdx < 0) startIdx = 0;

    const next24 = allTimes.slice(startIdx, startIdx + 24).map((t, offset) => {
      const idx = startIdx + offset;
      return {
        time: t,
        hourLabel: formatHourLabel(t),
        pm25: Number((hourly.pm2_5[idx] ?? 0).toFixed(1)),
        pm10: Number((hourly.pm10[idx] ?? 0).toFixed(1)),
        usAqi: Math.round(hourly.us_aqi[idx] ?? 0),
        no2: Number((hourly.nitrogen_dioxide[idx] ?? 0).toFixed(1)),
        ozone: Number((hourly.ozone[idx] ?? 0).toFixed(1)),
      };
    });

    // Find safest 2-hour ventilation window and peak smog 2-hour window
    let safestStart = 0;
    let safestAvgPm25 = Infinity;
    let peakStart = 0;
    let peakAvgPm25 = -1;

    for (let i = 0; i < Math.max(1, next24.length - 1); i++) {
      const a = next24[i];
      const b = next24[Math.min(i + 1, next24.length - 1)];
      const avg = (a.pm25 + b.pm25) / 2;
      if (avg < safestAvgPm25) {
        safestAvgPm25 = avg;
        safestStart = i;
      }
      if (avg > peakAvgPm25) {
        peakAvgPm25 = avg;
        peakStart = i;
      }
    }

    const safeA = next24[safestStart] || next24[0];
    const safeB = next24[Math.min(safestStart + 2, next24.length - 1)] || safeA;
    const peakA = next24[peakStart] || next24[0];
    const peakB = next24[Math.min(peakStart + 2, next24.length - 1)] || peakA;

    const usAqi = Math.round(current.us_aqi ?? next24[0]?.usAqi ?? 0);
    const pm25 = Number((current.pm2_5 ?? next24[0]?.pm25 ?? 0).toFixed(1));
    const pm10 = Number((current.pm10 ?? next24[0]?.pm10 ?? 0).toFixed(1));
    const no2 = Number((current.nitrogen_dioxide ?? 0).toFixed(1));
    const ozone = Number((current.ozone ?? 0).toFixed(1));
    const so2 = Number((current.sulphur_dioxide ?? 0).toFixed(1));
    const co = Number((current.carbon_monoxide ?? 0).toFixed(0));
    const dust = Number((current.dust ?? 0).toFixed(1));

    const classification = classifyUsAqi(usAqi);
    const cigaretteEquivalent = Number((pm25 / 22).toFixed(1));
    const whoMultiple = Number((pm25 / 15).toFixed(1));

    res.json({
      location: {
        name: city,
        admin1,
        country,
        latitude: lat,
        longitude: lon,
        timezone: aqiJson.timezone || 'auto',
      },
      observedAt: currentTime,
      current: {
        usAqi,
        level: classification.level,
        advisory: classification.advisory,
        pm25,
        pm10,
        no2,
        ozone,
        so2,
        co,
        dust,
        cigaretteEquivalent,
        whoMultiple,
      },
      weather,
      windows: {
        safestVentilation: {
          label: `${safeA?.hourLabel || '2 PM'} – ${safeB?.hourLabel || '4 PM'}`,
          avgPm25: Number(safestAvgPm25.toFixed(1)),
          avgAqi: Math.round(((safeA?.usAqi ?? usAqi) + (safeB?.usAqi ?? usAqi)) / 2),
        },
        peakSmog: {
          label: `${peakA?.hourLabel || '7 AM'} – ${peakB?.hourLabel || '9 AM'}`,
          avgPm25: Number(peakAvgPm25.toFixed(1)),
          avgAqi: Math.round(((peakA?.usAqi ?? usAqi) + (peakB?.usAqi ?? usAqi)) / 2),
        },
      },
      hourly: next24,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch air quality data';
    res.status(502).json({ error: message });
  }
});

app.post('/api/ai/plan', async (req, res) => {
  try {
    const { airQuality, profile } = req.body as {
      airQuality?: Record<string, unknown>;
      profile?: Record<string, unknown>;
    };

    if (!airQuality || !profile) {
      res.status(400).json({ error: 'Both airQuality telemetry and household profile are required.' });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Generate a deeply practical, scientifically grounded Urban Air Quality Action Plan for this family today.

LIVE LOCATION & AIR QUALITY TELEMETRY:
${JSON.stringify(airQuality, null, 2)}

HOUSEHOLD & LIFESTYLE PROFILE:
${JSON.stringify(profile, null, 2)}

Requirements:
1. Tailor EVERY recommendation directly to the city's live PM2.5, PM10, NO2, O3, safest ventilation window, peak smog window, weather (wind/humidity/temperature inversion risk), and the household's exact members, commute mode, home setup, air purifier availability, and cooking fuel.
2. Daily Routine: Create exactly 5 time-blocked items spanning Morning, Midday, Afternoon/Commute, Evening, and Night. Explicitly reference the live safest ventilation window and peak smog window times. For each item, explain both how it reduces personal inhaled pollution AND how it lowers emissions.
3. Indoor Air Quality Hacks: Create exactly 5 practical hacks across "Zero Cost", "Low Cost", and "Equipment" tiers. If the household does NOT have an air purifier, prioritize high-efficacy DIY and zero-cost hacks (like damp-towel draft sealing, Corsi-Rosenthal box fan filter, wet mopping vs dry sweeping, exhaust-first cooking protocol). If they DO have a purifier, include CADR placement, filter care, and CO2 balance during the safest window. Be scientifically honest about indoor plants (they boost humidity/wellbeing marginally but cannot replace filtration during severe PM2.5 spikes).
4. Sustainable Alternatives: Create exactly 5 concrete lifestyle swaps tailored to their current commute, cooking fuel, and daily habits. Provide realistic, defensible numeric estimates for weeklyCo2SavedKg (number), weeklyPm25PreventedGrams (number), and personalExposureDropPct (integer 2-35), and explain the exact physical mechanism in directImpactExplanation.
5. Community Playbook: Create a ready-to-share neighbourhood/RWA/school WhatsApp advisory message tailored to this city's live AQI and practical collective steps (e.g., pausing leaf burning, carpooling school runs, providing N95 masks to security guards & sanitation staff).
6. Keep all prose crisp, empathetic, concrete, and free of hype or filler.`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are VayuCare, an environmental health scientist and urban clean-air advisor helping families and communities navigate severe winter smog and urban air pollution with realistic, scientifically accurate guidance and transparent impact explanations.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: {
                type: Type.STRING,
                description: '2-3 crisp sentences interpreting today live AQI, temperature inversion or wind dispersion, and top priority for this household.',
              },
              maskAndOutdoorGuidance: {
                type: Type.OBJECT,
                properties: {
                  maskGrade: { type: Type.STRING, description: 'e.g. N95 / KN95 required outdoors, or Optional' },
                  outdoorExerciseAdvice: { type: Type.STRING },
                  vulnerableMemberNote: { type: Type.STRING },
                },
                required: ['maskGrade', 'outdoorExerciseAdvice', 'vulnerableMemberNote'],
              },
              dailyRoutine: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    timeSlot: { type: Type.STRING, description: 'e.g. 6:30 AM – 8:00 AM' },
                    phase: { type: Type.STRING, description: 'Morning, Midday, Afternoon, Evening, or Night' },
                    title: { type: Type.STRING },
                    action: { type: Type.STRING },
                    lowEmissionHabit: { type: Type.STRING },
                    exposureReductionPct: { type: Type.INTEGER, description: 'Estimated % reduction in inhaled PM2.5 for this block (5-60)' },
                    co2SavedGrams: { type: Type.INTEGER, description: 'Estimated grams of CO2e avoided by following this low-emission step' },
                    directImpactExplanation: { type: Type.STRING, description: 'Clear 1-2 sentence scientific explanation of why this choice matters directly.' },
                  },
                  required: [
                    'id',
                    'timeSlot',
                    'phase',
                    'title',
                    'action',
                    'lowEmissionHabit',
                    'exposureReductionPct',
                    'co2SavedGrams',
                    'directImpactExplanation',
                  ],
                },
              },
              indoorHacks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    category: { type: Type.STRING, description: 'Filtration, Sealing, Cooking, Cleaning, or Ventilation' },
                    budgetTier: { type: Type.STRING, description: 'Zero Cost, Low Cost, or Equipment' },
                    timeRequired: { type: Type.STRING, description: 'e.g. 5 mins daily' },
                    estimatedPm25Drop: { type: Type.STRING, description: 'e.g. 25–40% lower indoor PM2.5' },
                    steps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    whyItWorks: { type: Type.STRING, description: 'Direct scientific explanation of how this hack traps or avoids particulates.' },
                    tailoredNote: { type: Type.STRING, description: 'Why this hack fits the user specific home/purifier/cooking setup.' },
                  },
                  required: [
                    'id',
                    'title',
                    'category',
                    'budgetTier',
                    'timeRequired',
                    'estimatedPm25Drop',
                    'steps',
                    'whyItWorks',
                    'tailoredNote',
                  ],
                },
              },
              sustainableSwaps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    category: { type: Type.STRING, description: 'Commute, Cooking, Home Energy, or Community' },
                    currentHabit: { type: Type.STRING },
                    sustainableAlternative: { type: Type.STRING },
                    weeklyCo2SavedKg: { type: Type.NUMBER },
                    weeklyPm25PreventedGrams: { type: Type.NUMBER },
                    personalExposureDropPct: { type: Type.INTEGER },
                    directImpactExplanation: { type: Type.STRING },
                    communityScaleNote: { type: Type.STRING },
                  },
                  required: [
                    'id',
                    'title',
                    'category',
                    'currentHabit',
                    'sustainableAlternative',
                    'weeklyCo2SavedKg',
                    'weeklyPm25PreventedGrams',
                    'personalExposureDropPct',
                    'directImpactExplanation',
                    'communityScaleNote',
                  ],
                },
              },
              communityPlaybook: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  whatsappMessage: { type: Type.STRING, description: 'Concise, ready-to-paste neighbourhood/RWA/school alert message.' },
                  collectiveActions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        expectedImpact: { type: Type.STRING },
                      },
                      required: ['title', 'description', 'expectedImpact'],
                    },
                  },
                },
                required: ['headline', 'whatsappMessage', 'collectiveActions'],
              },
            },
            required: [
              'executiveSummary',
              'maskAndOutdoorGuidance',
              'dailyRoutine',
              'indoorHacks',
              'sustainableSwaps',
              'communityPlaybook',
            ],
          },
        },
      })
    );

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      throw new Error('Gemini returned an empty plan response.');
    }

    const parsed = JSON.parse(rawText);
    res.json({ plan: parsed, generatedAt: new Date().toISOString() });
  } catch (err: unknown) {
    console.error('Error generating AI plan:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate personalized air quality plan';
    res.status(500).json({ error: message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, airQuality, profile } = req.body as {
      message?: string;
      history?: Array<{ role: 'user' | 'model'; text: string }>;
      airQuality?: Record<string, unknown>;
      profile?: Record<string, unknown>;
    };

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are VayuCare, a concise, evidence-based Urban Air Quality Assistant helping families and communities navigate winter smog and urban air pollution.

CURRENT LIVE TELEMETRY FOR USER'S CITY:
${JSON.stringify(airQuality || {}, null, 2)}

USER'S HOUSEHOLD & LIFESTYLE PROFILE:
${JSON.stringify(profile || {}, null, 2)}

Guidelines:
- Always ground your advice in their live PM2.5, AQI, safest ventilation window, and specific household profile (e.g., kids, elderly, asthma, commute, purifier status).
- Always include a brief "Direct Impact" takeaway explaining the tangible health or emission consequence of the recommended action.
- Be honest and evidence-based (never recommend ineffective myths as substitutes for real filtration/N95 masks).
- Structure answers cleanly using short paragraphs and simple bullet points. Keep answers practical and under 220 words unless they ask for detailed steps.`;

    const contents = [
      ...(history || []).slice(-8).map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      {
        role: 'user',
        parts: [{ text: message.trim() }],
      },
    ];

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      })
    );

    const reply = (response.text ?? '').trim();
    if (!reply) {
      throw new Error('Empty response received from Gemini advisor.');
    }

    res.json({ reply });
  } catch (err: unknown) {
    console.error('Error in AI chat:', err);
    const message = err instanceof Error ? err.message : 'Failed to reach air quality advisor';
    res.status(500).json({ error: message });
  }
});

const ttsCache = new Map<string, string>();

app.post('/api/ai/tts', async (req, res) => {
  try {
    const { text, voiceName } = req.body as { text?: string; voiceName?: string };
    const cleaned = String(text || '').trim();
    if (!cleaned) {
      res.status(400).json({ error: 'Narration text is required.' });
      return;
    }

    const selectedVoice = voiceName || 'Kore';
    const cacheKey = `${selectedVoice}::${cleaned}`;
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      res.json({ audioBase64: cached, mimeType: 'audio/wav' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
      );
    }
    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const interaction = await withRetry(() =>
      ai.interactions.create({
        model: 'gemini-3.8-flash-lite-tts',
        input: [
          {
            type: 'text',
            text: cleaned,
            annotations: [
              {
                type: 'speech_metadata',
                style: 'Warm, clear, articulate documentary product narrator at a natural brisk pace',
              },
            ],
          },
        ],
        response_format: { type: 'audio' },
        generation_config: {
          speech_config: [
            {
              language: 'en-US',
              voice: selectedVoice,
            },
          ],
        },
      })
    );

    const base64Audio = interaction.output_audio?.data;

    if (!base64Audio) {
      throw new Error('No audio waveform returned by Gemini TTS.');
    }

    if (ttsCache.size > 40) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) ttsCache.delete(firstKey);
    }
    ttsCache.set(cacheKey, base64Audio);

    res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
  } catch (err: unknown) {
    console.error('Error generating TTS narration:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to synthesize voiceover audio';
    res.status(500).json({ error: message });
  }
});

app.use('/presentation-assets', express.static(path.resolve(__dirname, 'public/presentation')));

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VayuCare server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
