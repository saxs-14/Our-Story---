/**
 * Love Weather engine.
 *
 * Combines condition × phenomenon × detail × an affection index to produce
 * hundreds of unique, tasteful "forecasts". A daily forecast is deterministic
 * (same all day) but the user can also shuffle for a new one.
 */
import { dayOfYear } from '@/lib/time';
import { rngFromSeed, intBetween } from '@/lib/random';

export type WeatherMood =
  | 'sunny'
  | 'storm'
  | 'rainbow'
  | 'starry'
  | 'breeze'
  | 'snow'
  | 'aurora';

export interface LoveWeather {
  headline: string;
  detail: string;
  /** Affection index, 92–100 — it's always high in this climate. */
  index: number;
  mood: WeatherMood;
  /** SVG-friendly gradient stops for the forecast card. */
  gradient: [string, string];
  icon: WeatherMood;
}

interface Condition {
  mood: WeatherMood;
  gradient: [string, string];
  headlines: string[];
}

const CONDITIONS: Condition[] = [
  {
    mood: 'sunny',
    gradient: ['#ffe7b8', '#f6b6b1'],
    headlines: [
      'Sunny with a 100% chance of cuddles',
      'Golden warmth all day, no clouds in sight',
      'Bright skies and an unstoppable urge to hold your hand',
      'Clear and radiant — exactly how you make me feel',
    ],
  },
  {
    mood: 'storm',
    gradient: ['#c9c2e8', '#b76e79'],
    headlines: [
      'Kiss storms expected tonight',
      'A front of forehead kisses moving in fast',
      'Severe affection warning in effect until forever',
      'Thunderous heartbeats rolling in from the east',
    ],
  },
  {
    mood: 'rainbow',
    gradient: ['#f6c9a8', '#c9c2e8'],
    headlines: [
      'Rainbows after every little misunderstanding',
      'Bright arcs of forgiveness across the whole sky',
      'Colour returning to everything since I met you',
    ],
  },
  {
    mood: 'starry',
    gradient: ['#3a3357', '#b76e79'],
    headlines: [
      'Clear starry night, perfect for dreaming about us',
      'A meteor shower of "thinking of you" messages',
      'Constellations rearranging themselves to spell your name',
    ],
  },
  {
    mood: 'breeze',
    gradient: ['#ddd6f3', '#f6c9a8'],
    headlines: [
      'Warm hugs moving in from the east',
      'A gentle breeze carrying the scent of your perfume',
      'Soft winds of reassurance, calm and steady',
    ],
  },
  {
    mood: 'snow',
    gradient: ['#eef3ff', '#f6b6b1'],
    headlines: [
      'Light flurries of butterflies in the stomach',
      'Cosy season — blankets, you, and absolutely nowhere to be',
      'A soft snowfall of slow dances in the kitchen',
    ],
  },
  {
    mood: 'aurora',
    gradient: ['#7e4550', '#d4af7a'],
    headlines: [
      'Aurora of affection lighting up the whole horizon',
      'Northern lights of devotion, visible from anywhere you are',
      'Glowing skies because you exist',
    ],
  },
];

const DETAILS = [
  'Bring a jacket — I plan to make you feel warm anyway.',
  'High tides of laughter expected around dinner time.',
  'Patches of overthinking will clear by the time you read my next text.',
  'Visibility: I see you, fully, exactly as you are.',
  'Pressure systems low; your shoulders can finally relax.',
  'Pollen count of compliments is dangerously high today.',
  'Expect scattered "good morning beautiful" throughout the day.',
  'UV index of your smile: off the charts — eyes will squint.',
  'Humidity rising with every memory of your laugh.',
  'A 7-day outlook of being chosen, again and again.',
  'Gentle showers of patience whenever you need them.',
  'Record highs of being understood without explaining.',
  'Wind direction: always pointing back toward you.',
  'Forecast confidence: absolute. Some things never change.',
  'Take it slow on the roads — slow is exactly how I want to love you.',
  'Comfort levels peaking; bring your softest version of yourself.',
];

const TAGLINES = [
  'Affection index',
  'Devotion index',
  'Adoration index',
  'You-are-loved index',
];

export function generateWeather(seed: string | number): LoveWeather {
  const rng = rngFromSeed(seed);
  const condition = CONDITIONS[Math.floor(rng() * CONDITIONS.length)];
  const headline = condition.headlines[Math.floor(rng() * condition.headlines.length)];
  const detail = DETAILS[Math.floor(rng() * DETAILS.length)];
  const index = intBetween(rng, 92, 100);
  return {
    headline,
    detail,
    index,
    mood: condition.mood,
    gradient: condition.gradient,
    icon: condition.mood,
  };
}

/** The deterministic forecast for a given calendar day. */
export function dailyWeather(now: Date = new Date()): LoveWeather {
  return generateWeather(`weather-${now.getFullYear()}-${dayOfYear(now)}`);
}

export function indexLabel(seed: string | number): string {
  return TAGLINES[Math.floor(rngFromSeed('label-' + seed)() * TAGLINES.length)];
}

/** Rough count of distinct forecasts this engine can produce. */
export const WEATHER_COMBINATIONS =
  CONDITIONS.reduce((sum, c) => sum + c.headlines.length, 0) * DETAILS.length * 9;
