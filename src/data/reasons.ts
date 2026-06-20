/**
 * 500 reasons I love you, organised by category.
 *
 * A curated bank of fragments (things that complete the stem "I love …") is
 * combined with a small set of stems and expanded deterministically to exactly
 * 500 distinct reasons. Each reason has a stable id for favourites/collections.
 */
import { seededShuffle } from '@/lib/random';

export type ReasonCategory =
  | 'Cute Things'
  | 'Personality'
  | 'Memories'
  | 'Support'
  | 'Future'
  | 'Dreams'
  | 'Values'
  | 'Goals';

export interface Reason {
  id: string;
  category: ReasonCategory;
  text: string;
}

export const REASON_CATEGORIES: ReasonCategory[] = [
  'Cute Things',
  'Personality',
  'Memories',
  'Support',
  'Future',
  'Dreams',
  'Values',
  'Goals',
];

/** Fragments complete the stem, e.g. "I love " + "the way you hum when you cook." */
const FRAGMENTS: Record<ReasonCategory, string[]> = {
  'Cute Things': [
    'the way you scrunch your nose when you laugh too hard',
    'how you steal the blankets and pretend you did not',
    'the little hum you make when something tastes good',
    'how your eyes go soft right before you smile',
    'the way you talk with your hands when you are excited',
    'how you say my name when you want something sweet',
    'the way you dance a little when you think no one is watching',
    'how you get unreasonably passionate about small things',
    'the face you make when you are concentrating',
    'how you fix your hair in every reflective surface',
    'the way you fall asleep mid-sentence sometimes',
    'how you narrate animals as if you know their thoughts',
    'the way you double-text when you are excited to tell me something',
    'how you pout for exactly three seconds before laughing',
    'the way you wrap yourself in a blanket like a pastry',
    'how you sing the wrong lyrics with total confidence',
    'the way you tap your foot when your favourite song plays',
    'how you save the best bite for last every single time',
    'the way you say "okay but listen" before every good story',
    'how your handwriting gets fancier when you are happy',
    'the way you whisper even when no one else is around',
    'how you collect tiny things that remind you of moments',
  ],
  Personality: [
    'how kind you are even when no one is keeping score',
    'the quiet strength you carry without ever announcing it',
    'how curious you are about everything and everyone',
    'the way you make people feel seen in a single conversation',
    'how you laugh with your whole body',
    'the way honesty comes naturally to you',
    'how you stay gentle in a world that rewards being hard',
    'your stubborn, beautiful loyalty to the people you love',
    'how you think before you speak, and mean what you say',
    'the warmth you bring into a room without trying',
    'how brave you are with your own feelings',
    'the way you forgive without keeping a ledger',
    'how deeply you care, even when it costs you',
    'your patience with people who have not earned it yet',
    'how you find the funny side of almost everything',
    'the way you stand up for what is right, quietly and firmly',
    'how you make hard things feel a little lighter',
    'your calm in the middle of other people’s storms',
    'how genuine you are — there is no performance with you',
    'the way you listen like the person in front of you matters most',
    'how you turn empathy into action without being asked',
    'your unshakeable softness; it is your superpower',
  ],
  Memories: [
    'the first conversation that went on far longer than either of us planned',
    'the day our friendship quietly turned into something more',
    'every late-night talk that should have ended hours earlier',
    'the first time you laughed at something I said and meant it',
    'how nervous and certain I felt at the very same time',
    'the ordinary afternoon that somehow became my favourite memory',
    'the playlist we built one song at a time',
    'the first time you said something that I am still holding onto',
    'how we turned an ordinary day into one I will never forget',
    'the moment I realised I was already falling',
    'every "text me when you get home" that meant more than the words',
    'the inside jokes that no one else will ever understand',
    'the first photo of us I refuse to delete',
    'the walk that took twice as long because neither of us wanted it to end',
    'how comfortable the silences became so quickly',
    'the day you trusted me with something you do not tell everyone',
    'every time we laughed until it stopped making sense',
    'the small rituals we made without deciding to',
    'the first time it felt like coming home instead of meeting up',
    'the conversation where we both stopped pretending',
    'how February 2024 changed the shape of my whole life',
    'the memories we have not made yet that I already cannot wait for',
  ],
  Support: [
    'how you show up, even when it is inconvenient',
    'the way you believe in me before I believe in myself',
    'how you never make my hard days feel like a burden',
    'the way you ask "how are you, really?" and wait for the truth',
    'how you celebrate my small wins like they are huge',
    'the way you remind me to rest without making me feel weak',
    'how you sit with me in the hard moments instead of fixing them',
    'the way you defend my dreams when I get scared of them',
    'how you remember the things that are stressing me out',
    'the way you make space for me to just be tired sometimes',
    'how you steady me when everything feels loud',
    'the way you choose us, on purpose, on the difficult days',
    'how you forgive my worst moments and stay anyway',
    'the way you cheer the loudest from the quietest corner',
    'how you hold my hand through the things I am afraid of',
    'the way you make me feel safe enough to be honest',
    'how you never use my vulnerabilities against me',
    'the way you say "we will figure it out" and mean we',
    'how you protect my peace like it is your own',
    'the way you carry half of whatever I am carrying',
  ],
  Future: [
    'the slow mornings I want to spend only with you',
    'the home I want to build that sounds like your laugh',
    'the version of us that is still holding hands when we are old',
    'every anniversary I already cannot wait to celebrate',
    'the trips we have only ever talked about, for now',
    'the inside jokes we have not invented yet',
    'the future where your name and mine share an address',
    'the quiet life and the loud adventures, both with you',
    'the people we will become because we chose each other',
    'the someday that has had your seat saved this whole time',
    'the seasons of us I have not even met yet',
    'the small, ordinary forever I keep daydreaming about',
    'the celebrations we will throw just because we made it',
    'the future tense of "us" that I love saying',
    'the years I want to spend learning new things about you',
    'the plans I make quietly that all include you',
    'the milestones I want to reach holding your hand',
    'the life I am building toward, one day at a time, for us',
  ],
  Dreams: [
    'how you dream out loud and let me into them',
    'the way you make my dreams feel possible instead of foolish',
    'how you have ambitions that make me want to be braver',
    'the way you imagine a beautiful life and then work for it',
    'how your dreams have room in them for both of us',
    'the way you talk about the future like it is already ours',
    'how you turn "what if" into "why not"',
    'the dreams you whisper that I would help you chase anywhere',
    'how you never laugh at the size of someone’s hope',
    'the way you believe good things are coming, and make me believe it too',
    'how you sketch out a life and somehow I am always in the picture',
    'the way you chase what matters without losing who you are',
    'how your vision of us makes me want to grow',
    'the dreams we are stitching together out of late-night talks',
    'how you dare to want more and deserve all of it',
    'the way your hopes are contagious in the best way',
  ],
  Values: [
    'how honesty is not negotiable for you',
    'the way you treat kindness as a discipline, not a mood',
    'how you respect people regardless of what they can do for you',
    'the way loyalty runs all the way through you',
    'how you keep your word even when it is hard',
    'the way you value people over things, always',
    'how you stand by what you believe without needing to be loud',
    'the way you take responsibility instead of making excuses',
    'how you protect the dignity of everyone in the room',
    'the way you choose integrity when no one is watching',
    'how family and the people you love come first for you',
    'the way you treat softness as strength, not a flaw',
    'how you forgive but still hold a healthy line',
    'the way you keep growing instead of staying comfortable',
    'how you lead with patience and grace',
    'the way fairness matters to you, even when it costs you',
  ],
  Goals: [
    'how hard you work for the things you care about',
    'the way you set goals and then actually chase them',
    'how disciplined you are even when motivation runs out',
    'the way you take a small step every day toward something bigger',
    'how you bounce back instead of giving up',
    'the way you turn setbacks into lessons',
    'how you keep your promises to yourself',
    'the way you stay focused without losing your warmth',
    'how you make me want to build something of my own',
    'the way you measure success by who you are becoming',
    'how you balance your ambitions with your kindness',
    'the way you stay humble while reaching higher',
    'how you celebrate progress instead of waiting for perfection',
    'the way you keep showing up for your own dreams',
    'how you make discipline look graceful',
    'the way you finish what you start',
  ],
};

const STEMS = ['I love', 'I adore', 'I cherish', 'I am grateful for', 'It melts me —'];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildReasons(target: number, seed: string): Reason[] {
  // Build all (stem × fragment) candidates, fragment-first ordering preferred
  // so distinct fragments dominate before any stem variation repeats meaning.
  const candidates: { category: ReasonCategory; text: string }[] = [];

  for (let s = 0; s < STEMS.length; s++) {
    for (const category of REASON_CATEGORIES) {
      for (const fragment of FRAGMENTS[category]) {
        const stem = STEMS[s];
        const body = s === STEMS.length - 1 ? capitalize(fragment) : fragment;
        candidates.push({ category, text: `${stem} ${body}` });
      }
    }
  }

  // Interleave by shuffling so categories are well-distributed in the gallery.
  const ordered = seededShuffle(candidates, seed);
  const seen = new Set<string>();
  const out: Reason[] = [];
  for (const c of ordered) {
    if (out.length >= target) break;
    if (seen.has(c.text)) continue;
    seen.add(c.text);
    out.push({ id: `reason-${out.length + 1}`, category: c.category, text: c.text });
  }
  return out;
}

export const REASONS: Reason[] = buildReasons(500, 'our-story-reasons-v1');

export const TOTAL_REASONS = REASONS.length;

export function reasonsByCategory(category: ReasonCategory): Reason[] {
  return REASONS.filter((r) => r.category === category);
}

export function reasonById(id: string): Reason | undefined {
  return REASONS.find((r) => r.id === id);
}

export function categoryCounts(): Record<ReasonCategory, number> {
  const counts = Object.fromEntries(REASON_CATEGORIES.map((c) => [c, 0])) as Record<
    ReasonCategory,
    number
  >;
  for (const r of REASONS) counts[r.category]++;
  return counts;
}
