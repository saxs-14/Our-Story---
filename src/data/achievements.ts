/**
 * 30 achievements. Each has an `unlock` predicate evaluated against live
 * progress + relationship duration, so badges light up as the story grows.
 */
import { daysBetween } from '@/lib/time';
import relationship from '@/config/relationship';

export interface AchievementContext {
  daysTogether: number;
  daysAsFriends: number;
  visits: number;
  reasonsFavorited: number;
  lettersRead: number;
  vaultOpened: number;
  dreamsChecked: number;
  gardenStage: number; // 0..4
  secretUnlocked: boolean;
  wrappedViewed: boolean;
  weatherChecked: number;
  capsulesCreated: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tier: 'bronze' | 'silver' | 'gold' | 'rose';
  unlock: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-visit', title: 'First Visit', description: 'You opened our story for the first time.', emoji: '🚪', tier: 'bronze', unlock: (c) => c.visits >= 1 },
  { id: 'returning', title: 'You Came Back', description: 'Visited five times. I love that you keep coming back.', emoji: '🔁', tier: 'bronze', unlock: (c) => c.visits >= 5 },
  { id: 'regular', title: 'Part of the Routine', description: 'Twenty visits and counting.', emoji: '📅', tier: 'silver', unlock: (c) => c.visits >= 20 },
  { id: 'devoted-visitor', title: 'Devoted', description: 'Fifty visits. This place is yours now.', emoji: '🏠', tier: 'gold', unlock: (c) => c.visits >= 50 },
  { id: 'one-week', title: 'One Week', description: 'A week of us, officially.', emoji: '🗓️', tier: 'bronze', unlock: (c) => c.daysTogether >= 7 },
  { id: 'one-month', title: 'One Month', description: 'Our first monthiversary.', emoji: '🥂', tier: 'silver', unlock: (c) => c.daysTogether >= 30 },
  { id: 'hundred-days', title: '100 Days', description: 'One hundred days of choosing each other.', emoji: '💯', tier: 'gold', unlock: (c) => c.daysTogether >= 100 },
  { id: 'half-year', title: 'Half a Year', description: 'Six months strong.', emoji: '🌗', tier: 'gold', unlock: (c) => c.daysTogether >= 182 },
  { id: 'one-year', title: 'One Year', description: 'A full year of us. The first of many.', emoji: '🌟', tier: 'rose', unlock: (c) => c.daysTogether >= 365 },
  { id: 'old-friends', title: 'Friends First', description: 'A year of friendship before anything else.', emoji: '🌱', tier: 'silver', unlock: (c) => c.daysAsFriends >= 365 },
  { id: 'long-friends', title: 'Two Years of Knowing You', description: 'Friendship that aged like something rare.', emoji: '🍷', tier: 'gold', unlock: (c) => c.daysAsFriends >= 730 },
  { id: 'reason-1', title: 'First Favourite', description: 'You saved your first reason.', emoji: '⭐', tier: 'bronze', unlock: (c) => c.reasonsFavorited >= 1 },
  { id: 'reason-10', title: 'Reason Collector', description: 'Ten reasons saved to your heart.', emoji: '💖', tier: 'silver', unlock: (c) => c.reasonsFavorited >= 10 },
  { id: 'reason-50', title: 'Reason Curator', description: 'Fifty favourites. You know what you love.', emoji: '🏆', tier: 'gold', unlock: (c) => c.reasonsFavorited >= 50 },
  { id: 'letter-1', title: 'Dear Reader', description: 'You read your first letter.', emoji: '✉️', tier: 'bronze', unlock: (c) => c.lettersRead >= 1 },
  { id: 'letter-10', title: 'Letter Reader', description: 'Ten letters read. I hope each one landed.', emoji: '📖', tier: 'silver', unlock: (c) => c.lettersRead >= 10 },
  { id: 'letter-all', title: 'Every Word', description: 'You read all fifty letters.', emoji: '📚', tier: 'rose', unlock: (c) => c.lettersRead >= 50 },
  { id: 'vault-1', title: 'First Envelope', description: 'You opened your first "Open When" letter.', emoji: '💌', tier: 'bronze', unlock: (c) => c.vaultOpened >= 1 },
  { id: 'vault-5', title: 'Vault Explorer', description: 'Opened five of the envelopes.', emoji: '🗝️', tier: 'silver', unlock: (c) => c.vaultOpened >= 5 },
  { id: 'vault-all', title: 'Keeper of the Vault', description: 'You opened every envelope.', emoji: '🔓', tier: 'gold', unlock: (c) => c.vaultOpened >= 10 },
  { id: 'dream-1', title: 'Dreamer', description: 'You marked your first shared dream.', emoji: '💭', tier: 'bronze', unlock: (c) => c.dreamsChecked >= 1 },
  { id: 'dream-10', title: 'Dream Builder', description: 'Ten dreams on the board.', emoji: '🏗️', tier: 'silver', unlock: (c) => c.dreamsChecked >= 10 },
  { id: 'garden-sprout', title: 'Green Thumb', description: 'Our garden began to sprout.', emoji: '🌿', tier: 'bronze', unlock: (c) => c.gardenStage >= 1 },
  { id: 'garden-tree', title: 'Garden Keeper', description: 'Our love grew into a tree.', emoji: '🌳', tier: 'silver', unlock: (c) => c.gardenStage >= 2 },
  { id: 'garden-bloom', title: 'In Full Bloom', description: 'The garden reached full bloom.', emoji: '🌸', tier: 'rose', unlock: (c) => c.gardenStage >= 4 },
  { id: 'weather-7', title: 'Forecaster', description: 'Checked the love weather seven times.', emoji: '⛅', tier: 'bronze', unlock: (c) => c.weatherChecked >= 7 },
  { id: 'wrapped', title: 'Our Wrapped', description: 'You watched our story replayed.', emoji: '🎞️', tier: 'silver', unlock: (c) => c.wrappedViewed },
  { id: 'capsule', title: 'Time Traveller', description: 'You sealed a message for the future.', emoji: '⏳', tier: 'silver', unlock: (c) => c.capsulesCreated >= 1 },
  { id: 'secret', title: 'Secret Finder', description: 'You found the hidden heart.', emoji: '🤫', tier: 'rose', unlock: (c) => c.secretUnlocked },
  { id: 'completionist', title: 'Heart & Soul', description: 'You explored nearly everything. Thank you for caring this much.', emoji: '👑', tier: 'rose', unlock: (c) => c.lettersRead >= 25 && c.reasonsFavorited >= 20 && c.vaultOpened >= 5 && c.dreamsChecked >= 10 },
];

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;

/** Build a context object from raw progress + the configured timeline. */
export function buildContext(partial: Partial<AchievementContext>): AchievementContext {
  return {
    daysTogether: Math.max(0, daysBetween(relationship.relationshipStart)),
    daysAsFriends: Math.max(0, daysBetween(relationship.friendshipStart)),
    visits: 0,
    reasonsFavorited: 0,
    lettersRead: 0,
    vaultOpened: 0,
    dreamsChecked: 0,
    gardenStage: 0,
    secretUnlocked: false,
    wrappedViewed: false,
    weatherChecked: 0,
    capsulesCreated: 0,
    ...partial,
  };
}
