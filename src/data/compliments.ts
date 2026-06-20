/** 100 compliments — used by the "Random Compliment" feature and notifications. */
import { seededShuffle, pick } from '@/lib/random';
import relationship from '@/config/relationship';

const HER = relationship.her.nickname;

const BASE: string[] = [
  'You have the kind of smile that makes people forget what they were worried about.',
  'Your laugh is my favourite sound in any room.',
  'You are effortlessly, genuinely beautiful — inside first.',
  'Talking to you is the best part of my ordinary days.',
  'You make kindness look easy and cool at the same time.',
  'Your mind is gorgeous; I could listen to your thoughts for hours.',
  'You have a heart that makes the whole world feel safer.',
  'You are stunning in a way that has nothing to do with trying.',
  'Your presence calms me faster than anything else I know.',
  'You are so much braver than you give yourself credit for.',
  'You have impeccable taste — starting with deciding to put up with me.',
  'Your eyes do this thing when you are happy that undoes me completely.',
  'You are the most interesting person I have ever wanted to keep talking to.',
  'You make people feel chosen. That is a rare and beautiful gift.',
  'You are proof that soft and strong belong in the same person.',
  'Your warmth could heat a whole house in winter.',
  'You are clever in a way that sneaks up on people, and I love watching it.',
  'You wear confidence beautifully, even on the days you have to fake it.',
  'You are the best decision my heart ever made on its own.',
  'You glow, and I do not think you even notice.',
  'Your patience with the world is quietly heroic.',
  'You have a style that is entirely, unmistakably you.',
  'You are funny in a way that catches me off guard and ruins me.',
  'You are someone people feel lucky to know — me most of all.',
  'Your honesty is one of the most attractive things about you.',
  'You make hard days survivable just by existing in mine.',
  'You are gracious in a way that cannot be taught.',
  'You have a beautiful way of seeing the good first.',
  'You are wildly talented and far too humble about it.',
  'You light up when you talk about what you love, and it is breathtaking.',
  'You are the kind of person stories should be written about.',
  'Your softness is not a weakness; it is the bravest thing about you.',
  'You make growing up look graceful.',
  'You are someone I would choose in every version of this life.',
  'Your loyalty is the kind people write songs about.',
  'You are so easy to love and so worth the effort of loving well.',
  'You have a quiet confidence that turns heads without asking to.',
  'You are radiant, especially when you do not realise anyone is looking.',
  'Your hugs feel like a place I could happily get lost in.',
  'You are the most beautiful "good morning" my phone has ever shown me.',
];

const TEMPLATES = [
  `${HER}, ${'X'}`,
  `Just so you know — ${'x'}`,
  `Reminder for today: ${'x'}`,
  `In case no one told you yet, ${'x'}`,
];

function lower(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function build(target: number, seed: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  for (const b of seededShuffle(BASE, seed)) push(b);
  // Expand with gentle framings to reach the target, all unique.
  let i = 0;
  while (out.length < target && i < BASE.length * TEMPLATES.length) {
    const b = BASE[i % BASE.length];
    const t = TEMPLATES[Math.floor(i / BASE.length) % TEMPLATES.length];
    const text = t.includes('${HER}') || t.startsWith(HER) ? t.replace('X', lower(b)) : t.replace('x', lower(b));
    push(text);
    i++;
  }
  return out.slice(0, target);
}

export const COMPLIMENTS: string[] = build(100, 'our-story-compliments-v1');
export const TOTAL_COMPLIMENTS = COMPLIMENTS.length;

/** A deterministic compliment for a seed (e.g. per session or per tap). */
export function complimentFor(seed: string | number): string {
  return pick(COMPLIMENTS, seed);
}
