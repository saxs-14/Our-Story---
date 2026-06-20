import { useEffect, useState } from 'react';
import { loadJSON, saveJSON } from '@/lib/storage';

export interface LiveWeather {
  tempC: number;
  code: number;
  isDay: boolean;
  label: string;
  emoji: string;
  /** A romantic spin on the real conditions. */
  loveLine: string;
  fetchedAt: string;
}

/** WMO weather codes → human label, emoji, and a tender one-liner. */
function describe(code: number, isDay: boolean): { label: string; emoji: string; loveLine: string } {
  const sun = isDay ? '☀️' : '🌙';
  const map: Record<number, { label: string; emoji: string; loveLine: string }> = {
    0: { label: 'Clear sky', emoji: sun, loveLine: 'Clear skies — exactly how you make everything feel.' },
    1: { label: 'Mostly clear', emoji: isDay ? '🌤️' : '🌙', loveLine: 'Mostly clear, with a 100% chance of thinking about you.' },
    2: { label: 'Partly cloudy', emoji: '⛅', loveLine: 'A few clouds, but you’re the sunshine that gets through.' },
    3: { label: 'Overcast', emoji: '☁️', loveLine: 'Grey skies out there — let me be the warm in your day.' },
    45: { label: 'Foggy', emoji: '🌫️', loveLine: 'Foggy out — but I always know my way back to you.' },
    48: { label: 'Foggy', emoji: '🌫️', loveLine: 'Misty morning, perfect for staying tangled up a little longer.' },
    51: { label: 'Light drizzle', emoji: '🌦️', loveLine: 'A soft drizzle — cosy-up weather, ideally with me.' },
    61: { label: 'Light rain', emoji: '🌧️', loveLine: 'Rain’s falling — blanket, tea, and you. Best forecast there is.' },
    63: { label: 'Rain', emoji: '🌧️', loveLine: 'Rainy day; the kind made for slow mornings together.' },
    65: { label: 'Heavy rain', emoji: '🌧️', loveLine: 'Pouring out there — stay dry, my love, I’ve got the umbrella.' },
    71: { label: 'Light snow', emoji: '🌨️', loveLine: 'Snow flurries — let’s catch them on our tongues like children.' },
    73: { label: 'Snow', emoji: '❄️', loveLine: 'Snow falling — cuddle season is officially open.' },
    80: { label: 'Showers', emoji: '🌦️', loveLine: 'Passing showers, like every worry when I’m with you.' },
    95: { label: 'Thunderstorm', emoji: '⛈️', loveLine: 'Storms outside — but the safest place is right next to me.' },
  };
  return map[code] ?? { label: 'Pleasant', emoji: sun, loveLine: 'Whatever the sky’s doing, my forecast is always you.' };
}

const CACHE_KEY = 'live-weather';

export function useLiveWeather(): { weather: LiveWeather | null; loading: boolean; denied: boolean } {
  const [weather, setWeather] = useState<LiveWeather | null>(() => loadJSON<LiveWeather | null>(CACHE_KEY, null));
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let active = true;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}&current=temperature_2m,weather_code,is_day&timezone=auto`;
          const res = await fetch(url);
          const json = await res.json();
          const cur = json.current;
          const d = describe(cur.weather_code, cur.is_day === 1);
          const result: LiveWeather = {
            tempC: Math.round(cur.temperature_2m),
            code: cur.weather_code,
            isDay: cur.is_day === 1,
            ...d,
            fetchedAt: new Date().toISOString(),
          };
          if (active) {
            setWeather(result);
            saveJSON(CACHE_KEY, result);
          }
        } catch {
          /* offline / API down → keep cached value */
        } finally {
          if (active) setLoading(false);
        }
      },
      () => {
        if (active) {
          setDenied(true);
          setLoading(false);
        }
      },
      { timeout: 8000, maximumAge: 1000 * 60 * 30 },
    );

    return () => {
      active = false;
    };
  }, []);

  return { weather, loading, denied };
}
