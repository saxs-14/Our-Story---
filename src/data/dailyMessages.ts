/**
 * 365 daily love notes — one for every day of the year, no repeats.
 *
 * Built from a curated bank of standalone lines across five voices
 * (romantic, motivational, funny, supportive, future). Days beyond the base
 * bank are filled with tasteful, deterministic pairings so every single day
 * resolves to a distinct, natural-reading note. A `Set` guarantees uniqueness.
 */
import relationship from '@/config/relationship';
import { dayOfYear } from '@/lib/time';
import { seededShuffle, rngFromSeed } from '@/lib/random';

export type Voice = 'romantic' | 'motivational' | 'funny' | 'supportive' | 'future';

export interface DailyNote {
  /** 1-based day index */
  day: number;
  voice: Voice;
  text: string;
}

const HER = relationship.her.nickname;

const BANK: Record<Voice, string[]> = {
  romantic: [
    `Good morning, ${HER}. The first thing my heart does each day is choose you again.`,
    'You are the calm I never knew I was searching for.',
    'If loving you were a language, I would have nothing left to learn but you.',
    'I keep finding new corners of my heart that only fit you.',
    'You are my favourite hello and my hardest goodbye.',
    'Some people search their whole lives for a feeling. I just text you good morning.',
    'You make ordinary days feel like they were written just for us.',
    'I fall for the same person every single day, and her name is yours.',
    'Being loved by you is the softest thing that has ever happened to me.',
    'You are not a chapter in my story — you are the reason I kept writing.',
    'I love you in the quiet way too, the way that asks for nothing back.',
    'Your name is the prayer I say without realising.',
    'Wherever you are is the direction I always end up facing.',
    'I did not know a heart could feel this full and still keep making room.',
    'You are the home I get to choose every morning.',
    'Loving you is the easiest decision I make and remake forever.',
    'I would relive every ordinary moment, as long as you are in it.',
    'You are proof that the best things are worth every bit of the wait.',
    'Even my silences are softer now that they belong to you.',
    'My favourite place on earth is right beside you.',
  ],
  motivational: [
    'Whatever today asks of you, remember: you have never lost a day you faced with that heart of yours.',
    'You are allowed to take up space, to want more, to become.',
    'The world is luckier on the days you decide to be brave.',
    'You are not behind. You are exactly where your story needs you.',
    'Go gently, but go. I am cheering from every corner of your day.',
    'Your softness is not weakness — it is the strongest thing about you.',
    'You can do hard things; I have watched you do them and stay kind.',
    'On the days you doubt yourself, borrow my certainty about you.',
    'Be proud of how far you have come, not just how far there is to go.',
    'You do not have to be fearless. You just have to keep showing up — and you do.',
    'The version of you that you are becoming is going to be so proud of today.',
    'Difficult roads have always led you somewhere worth standing.',
    'You are capable of more than the loudest fear in your head.',
    'Rest is not falling behind. Even the moon takes its time to return.',
    'Your dreams are not too big. They are just waiting for you to keep going.',
    'You have a way of turning pressure into something graceful. Do that today.',
    'Believe me a little, until you can believe yourself again.',
    'Every small step you take, I count it. None of it is wasted.',
  ],
  funny: [
    'Daily reminder that you are stuck with me, and I have read the terms — there are no refunds.',
    'I would say I love you to the moon and back, but honestly I would not survive the trip without you.',
    'You + me + snacks is my entire five-year plan. Investors are very excited.',
    'Warning: I am about to be unbearably soft about you again. Brace yourself.',
    'If overthinking about you were a sport, I would have a medal and a slightly sore brain.',
    'I checked, and yes, you are still the prettiest notification on my phone.',
    'Our love story has fewer plot holes than most movies, and a much better lead.',
    'You stole my heart, so technically this is a hostage situation I fully endorse.',
    'I made a pros and cons list about you. The cons page is blank and slightly insulting.',
    'Rumour has it I smile at my phone now. I plead guilty and blame you.',
    'I am not saying you are perfect, but the evidence is getting hard to argue with.',
    'My love language is sending you this and then immediately wondering if you smiled.',
    'You have ruined every other person for me, and I would like to thank you for it.',
    'Just a heads up: I plan to be annoyingly in love with you for the foreseeable forever.',
    'I would fight a bee for you. I am terrified of bees. That is the whole point.',
  ],
  supportive: [
    `Whatever you are carrying today, ${HER}, you do not have to carry it alone.`,
    'If today is heavy, put some of it down. I will help you hold the rest.',
    'You are allowed to have an off day and still be deeply, completely loved.',
    'Your feelings make sense. All of them. You do not have to earn my patience.',
    'Breathe. You are safe here. Nothing about you is too much for me.',
    'If the world was loud to you today, let me be the quiet you come home to.',
    'You never have to perform okay for me. Tired you is still my favourite you.',
    'Whatever you decide, I am on your side — before, during, and long after.',
    'I am proud of you on the days you only managed to get through. That counts.',
    'You can fall apart a little. I have got the pieces, and I am not going anywhere.',
    'Some days surviving is the victory. I see yours.',
    'You are not a burden. You are the person I would choose to show up for.',
    'Let me know you are tired and let me love you anyway. That is what this is.',
    'When it all feels like too much, remember there is a person who thinks the world of you.',
    'You are doing better than the anxious voice gives you credit for.',
  ],
  future: [
    'One day this will be a story we tell, and I cannot wait to be the one beside you telling it.',
    'I think about slow mornings with you and a future that smells like coffee and forever.',
    'There is a whole life I want to build with you, one ordinary, beautiful day at a time.',
    'Someday we will look back at right now and call it the beginning.',
    'I want all your seasons — the easy ones and the ones we grow through.',
    'I am not just in love with you, I am in love with the us we are becoming.',
    'There is a version of our future where we are old and still laughing. I am aiming for that one.',
    'I want to keep choosing you in every room, every city, every chapter ahead.',
    'Our best memories have not even happened yet, and that thrills me.',
    'I daydream about the life where your name and mine share an address.',
    'Whatever we become, I want to become it slowly, and with you.',
    'I am collecting tomorrows, and every single one of them has you in it.',
    'The plans I make quietly all have a seat saved for you.',
    'I cannot promise easy, but I can promise I am building toward you.',
    'Let us grow the kind of love that our future selves will thank us for.',
  ],
};

const CONNECTORS = [
  ' And honestly — ',
  ' Also, ',
  ' One more thing: ',
  ' P.S. ',
  ' Remember too — ',
];

interface Flat {
  voice: Voice;
  text: string;
}

function buildYear(seed: string): DailyNote[] {
  const flat: Flat[] = (Object.keys(BANK) as Voice[]).flatMap((voice) =>
    BANK[voice].map((text) => ({ voice, text })),
  );

  // Stable order for the year, then fill to 365 with unique pairings.
  const ordered = seededShuffle(flat, seed);
  const seen = new Set<string>();
  const notes: DailyNote[] = [];
  const rng = rngFromSeed('pairings-' + seed);

  const pushUnique = (voice: Voice, text: string) => {
    if (seen.has(text)) return false;
    seen.add(text);
    notes.push({ day: notes.length + 1, voice, text });
    return true;
  };

  for (const item of ordered) {
    if (notes.length >= 365) break;
    pushUnique(item.voice, item.text);
  }

  // Fill remaining days with deterministic, natural pairings.
  let guard = 0;
  while (notes.length < 365 && guard < 20000) {
    guard++;
    const a = ordered[Math.floor(rng() * ordered.length)];
    const b = ordered[Math.floor(rng() * ordered.length)];
    if (a.text === b.text) continue;
    const connector = CONNECTORS[Math.floor(rng() * CONNECTORS.length)];
    const lower = b.text.charAt(0).toLowerCase() + b.text.slice(1);
    const combined = `${a.text}${connector}${lower}`;
    pushUnique(a.voice, combined);
  }

  return notes;
}

/** The full, stable 365-day calendar of notes. */
export const DAILY_NOTES: DailyNote[] = buildYear('our-story-daily-v1');

/** The note for a specific day (defaults to today). */
export function noteForToday(now: Date = new Date()): DailyNote {
  const idx = (dayOfYear(now) - 1 + DAILY_NOTES.length) % DAILY_NOTES.length;
  return DAILY_NOTES[idx];
}

export const TOTAL_DAILY_NOTES = DAILY_NOTES.length;
