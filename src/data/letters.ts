/**
 * The Letter Library — 50 complete, readable letters.
 *
 * A set of bespoke letters plus themed, fully-written compositions (real
 * paragraphs, never placeholders) expanded deterministically to 50. Each
 * letter carries a category, an estimated reading time, and a stable id used
 * for bookmarks and reading progress.
 */
import relationship from '@/config/relationship';
import { rngFromSeed, seededShuffle } from '@/lib/random';

export type LetterCategory =
  | 'Love'
  | 'Gratitude'
  | 'Encouragement'
  | 'Memories'
  | 'Future'
  | 'Apology & Grace'
  | 'Just Because';

export interface Letter {
  id: string;
  title: string;
  category: LetterCategory;
  preview: string;
  body: string[];
  signoff: string;
  /** minutes */
  readingTime: number;
}

const HER = relationship.her.nickname;
const SIG = 'Always & in all ways,\nPhathu';

const BESPOKE: Omit<Letter, 'id' | 'readingTime'>[] = [
  {
    title: 'To the girl who became my favourite person',
    category: 'Love',
    preview: 'There is a moment I keep returning to — the one where you stopped being someone I knew and became someone I needed.',
    body: [
      `${HER}, there is a moment I keep returning to. It is not loud or cinematic. It is the one where you stopped being someone I knew and quietly became someone I needed. I do not think either of us noticed it happen, which is exactly how the best things arrive.`,
      'I want you to understand something, in case the days ever get heavy enough to make you forget it: being loved by you is the gentlest, surest thing that has happened to me. You did not have to try. You just had to be exactly who you are, and that was already everything.',
      'I am not a perfect person. But I promise to keep choosing you on the easy mornings and the difficult ones. I promise to keep learning you, because you are the only subject I never get tired of studying.',
      'So this is my letter to the girl who became my favourite person. Whenever you open it, know that across whatever distance, in whatever mood, I am thinking the same thing I think every day. It is you. It has been you for a while now.',
    ],
    signoff: SIG,
  },
  {
    title: 'Thank you for the small things',
    category: 'Gratitude',
    preview: 'Everyone thanks each other for the grand gestures. I want to thank you for the quiet ones.',
    body: [
      'Everyone thanks each other for the grand gestures. I want to thank you for the quiet ones. The "text me when you get home." The way you remember the thing that was stressing me out and ask about it later. The patience you have with me on days I have not earned it.',
      'Thank you for laughing at my jokes, even the ones that did not deserve it. Thank you for the way you listen — not waiting to reply, but actually listening, like what I am saying matters because I am the one saying it.',
      'Gratitude is a strange and beautiful thing. The more I look for reasons, the more I find. You have given me a hundred small kindnesses you probably do not even remember. I remember all of them.',
    ],
    signoff: SIG,
  },
  {
    title: 'For the day you feel like giving up',
    category: 'Encouragement',
    preview: 'If you are reading this, today asked too much of you. Sit down. Breathe. Let me carry some of it.',
    body: [
      `If you are reading this, ${HER}, today probably asked too much of you. So sit down for a moment. Breathe. Let me carry some of it from here.`,
      'I need you to hear me clearly: you are not behind, you are not failing, and you are not too much. You are a person doing something hard, and doing it with more grace than you give yourself credit for.',
      'You have survived every single one of your worst days so far. That is a perfect record. The fear in your head is loud, but it has been wrong about you before, and it is wrong about you now.',
      'Rest if you need to. Cry if you need to. And when you are ready — not before — get back up. I will be right here, believing in you for both of us until you can do it again on your own.',
    ],
    signoff: SIG,
  },
  {
    title: 'The night our friendship changed',
    category: 'Memories',
    preview: 'Somewhere in early 2024, a conversation went on far longer than it was supposed to.',
    body: [
      'Somewhere in early 2024, a conversation went on far longer than it was supposed to. I remember not wanting it to end, and not quite understanding why. That was the night, I think, that the friendship started becoming something it had not asked permission to become.',
      'We were friends first, and I will always be grateful for that. It meant that before I loved how you made me feel, I already loved who you were. The feelings did not replace the friendship — they grew out of it, like something planted in good soil.',
      'I keep that memory somewhere safe. On the days I need proof that the best things are worth waiting for, I take it out and look at it.',
    ],
    signoff: SIG,
  },
  {
    title: 'The life I am quietly building toward',
    category: 'Future',
    preview: 'I daydream about a future that smells like coffee and sounds like your laugh in the next room.',
    body: [
      'I daydream more than I admit. Mostly about a future that smells like coffee and sounds like your laugh coming from the next room. Nothing dramatic. Just a life that is unmistakably ours.',
      'I think about the slow mornings and the loud adventures, the anniversaries and the ordinary Tuesdays. I think about growing into the kind of love our future selves will thank us for building carefully.',
      'I cannot promise you easy. No honest person can. But I can promise you intentional. I can promise that every quiet plan I make has a seat saved for you, and that I am walking toward it one ordinary, beautiful day at a time.',
    ],
    signoff: SIG,
  },
  {
    title: 'When we have argued',
    category: 'Apology & Grace',
    preview: 'If we have just argued, read this slowly. I am still here. I am still yours.',
    body: [
      'If we have just argued, read this slowly. First: I am still here. I am still yours. Whatever was said in frustration, the foundation has not moved an inch.',
      'I would rather be close to you than be right. I am sorry for any moment I made you feel unseen or unheard, because making you feel that way is the opposite of everything I want.',
      'We are allowed to be two whole people who sometimes get it wrong. What matters is that we keep finding our way back, gently, on purpose. So consider this my hand, reaching for yours across whatever distance the day created. Come back to me. I never really left.',
    ],
    signoff: SIG,
  },
  {
    title: 'Just because it is you',
    category: 'Just Because',
    preview: 'No occasion. No reason. Just a Tuesday and a heart that wanted to say your name.',
    body: [
      'No occasion. No reason. Just a Tuesday and a heart that wanted to say your name out loud for no profit at all.',
      `Sometimes love does not need a holiday. Sometimes it just needs to interrupt an ordinary day to say: I see you, I choose you, I am glad it is you.`,
      'So that is all this is. A letter with no agenda. Put it down and go about your day knowing you are, at this very moment, the subject of someone’s quiet, complete devotion.',
    ],
    signoff: SIG,
  },
  {
    title: 'On the days you feel unlovable',
    category: 'Encouragement',
    preview: 'Especially then. Especially on those days. Let me remind you who you are.',
    body: [
      'There will be days you feel hard to love. Especially then — especially on those days — I want you to come back to this.',
      'You are not lovable only when you are easy, or happy, or put together. You are lovable when you are tired, when you are anxious, when you have nothing left to perform. I do not love a polished version of you. I love the whole person, on the floor and on the pedestal alike.',
      'You do not have to earn your place with me. You already have it. Rest in that. It is not going anywhere.',
    ],
    signoff: SIG,
  },
  {
    title: 'A letter for your birthday',
    category: 'Love',
    preview: 'The world got a little better the day you were born. This is my yearly thank-you note to it.',
    body: [
      `Happy birthday, ${HER}. The world got measurably better the day you arrived in it, and this is my yearly thank-you note to whoever or whatever made that happen.`,
      'I hope this year is kind to you. I hope it brings the things you have been quietly hoping for, and a few good surprises you did not think to ask for. I hope you feel, all day, exactly how loved you are.',
      'Thank you for another year of being you. It is, without competition, my favourite thing that exists. Here is to many, many more — ideally most of them spent somewhere near me.',
    ],
    signoff: SIG,
  },
  {
    title: 'For our anniversary',
    category: 'Future',
    preview: 'We made it another stretch of road. Let me tell you what I noticed about you along the way.',
    body: [
      'We made it another stretch of road together, and I do not want it to pass without saying what I noticed about you along the way.',
      'I noticed how you stayed soft. I noticed the small sacrifices you thought went unseen. I noticed every time you chose us when it would have been easier not to. None of it was invisible to me. All of it mattered.',
      'Anniversaries are not just about how long. They are about how — and how we have loved each other is something I am proud of. Here is to the next chapter, written the same careful way: together.',
    ],
    signoff: SIG,
  },
  {
    title: 'When you miss me',
    category: 'Love',
    preview: 'Distance is just a number trying to scare two people who are not scared.',
    body: [
      'If you are missing me right now, read this and let it stand in until I can be there myself.',
      'Distance is just a number trying to scare two people who are not scared. I am thinking about you. Right now, probably at this very moment, you have crossed my mind and softened my whole expression without knowing it.',
      'Close your eyes. I am there — at your side, holding your hand, telling you the day will be alright. We are never as far apart as the map insists. Missing me is just love with nowhere to put itself yet. Save it. I am coming back for it.',
    ],
    signoff: SIG,
  },
  {
    title: 'Everything I forget to say out loud',
    category: 'Gratitude',
    preview: 'Some things get stuck on the way from my heart to my mouth. Here they are, written down.',
    body: [
      'Some things get stuck on the way from my heart to my mouth. So I am writing them down, where they cannot lose their nerve.',
      'I am proud of you. I am proud to be yours. You make me want to be a gentler, braver, more patient person. You are the first good news I want to share and the safe place I want to bring the bad.',
      'I do not say these things enough out loud. But I think them constantly. Consider this letter the transcript of a thousand quiet moments where I looked at you and felt lucky.',
    ],
    signoff: SIG,
  },
];

// Themed paragraph pools for generating additional complete letters.
const THEME_POOLS: Record<LetterCategory, { titles: string[]; paras: string[] }> = {
  Love: {
    titles: ['How I feel when you walk in', 'You, simply', 'A small confession', 'The shape of my whole heart'],
    paras: [
      'I have tried to find a more impressive way to say it, and there isn’t one: I love you. Plainly, completely, on purpose.',
      'You are the warmth I reach for without thinking. You are the name my mind wanders to when it has nowhere it has to be.',
      'There is a softness you brought into my life that was not there before. I notice it most on the days I would have been hard without you.',
      'Loving you does not feel like falling. It feels like arriving somewhere I was always headed.',
    ],
  },
  Gratitude: {
    titles: ['Counting the good', 'For all of it', 'A thank-you with no occasion', 'The ledger of small mercies'],
    paras: [
      'Thank you for the patience, the laughter, and the hundred tiny kindnesses you hand out like they cost you nothing.',
      'I am grateful in the ordinary way — the way that does not need a holiday or a reason, only a Tuesday and a quiet heart.',
      'The more I pay attention, the more I find to be thankful for. You are a generous person to love, and I have noticed.',
    ],
  },
  Encouragement: {
    titles: ['You can do this', 'Borrow my belief', 'On the hard days', 'A little courage, on loan'],
    paras: [
      'Whatever today is asking, you have it in you. I have watched you do hard things and stay kind through them.',
      'If your own belief runs low, borrow mine. I have more than enough certainty about you to share.',
      'You are not behind and you are not failing. You are a person doing something difficult, and doing it with grace.',
    ],
  },
  Memories: {
    titles: ['Something I keep', 'A moment, saved', 'The day I think about', 'Folded and kept'],
    paras: [
      'There is a memory of us I keep somewhere safe, and I take it out whenever I need proof that good things are real.',
      'We have built a small museum of moments — inside jokes, late talks, ordinary afternoons that turned out to be everything.',
      'I remember more than I let on. The little things especially. They are the ones that turned out to matter most.',
    ],
  },
  Future: {
    titles: ['Toward us', 'A life I am building', 'Someday, with you', 'The future tense of us'],
    paras: [
      'I daydream about a future that is unmistakably ours — slow mornings, loud adventures, and everything in between.',
      'Every quiet plan I make has a seat saved for you. I am walking toward it one ordinary, beautiful day at a time.',
      'I cannot promise easy, but I can promise intentional. I am building toward you, carefully, on purpose.',
    ],
  },
  'Apology & Grace': {
    titles: ['Coming back to you', 'My hand, reaching', 'After the storm', 'Gently, on purpose'],
    paras: [
      'I would rather be close to you than be right. Whatever the day created, the foundation has not moved.',
      'We are allowed to get it wrong sometimes. What matters is that we keep finding our way back to each other.',
      'Consider this my hand reaching for yours across whatever distance the moment made. Come back to me.',
    ],
  },
  'Just Because': {
    titles: ['No reason at all', 'Interrupting your day', 'Because it is you', 'A letter with no agenda'],
    paras: [
      'No occasion, no agenda. Just a heart that wanted to say your name out loud for no profit at all.',
      'Sometimes love just needs to interrupt an ordinary day to say: I see you, I choose you, I am glad it is you.',
      'Put this down and go about your day knowing you are, right now, the subject of someone’s quiet devotion.',
    ],
  },
};

const CATEGORIES = Object.keys(THEME_POOLS) as LetterCategory[];

function wordsOf(body: string[]): number {
  return body.join(' ').split(/\s+/).length;
}

function buildLetters(target: number, seed: string): Letter[] {
  const out: Letter[] = BESPOKE.map((l, i) => ({
    ...l,
    id: `letter-${i + 1}`,
    readingTime: Math.max(1, Math.round(wordsOf(l.body) / 180)),
  }));

  const rng = rngFromSeed(seed);
  const titleSeen = new Set(out.map((l) => l.title));
  let n = out.length;

  while (out.length < target) {
    const category = CATEGORIES[Math.floor(rng() * CATEGORIES.length)];
    const pool = THEME_POOLS[category];
    const title = pool.titles[Math.floor(rng() * pool.titles.length)] + (titleSeen.has(pool.titles[0]) ? '' : '');
    // Ensure unique titles by suffixing a soft variant when needed.
    let finalTitle = title;
    let attempt = 1;
    while (titleSeen.has(finalTitle)) {
      const variants = ['', ' — for you', ', again', ' (read slowly)', ' ♡'];
      finalTitle = title + (variants[attempt] ?? ` · ${attempt}`);
      attempt++;
    }
    titleSeen.add(finalTitle);

    const paras = seededShuffle(pool.paras, seed + n).slice(0, 3);
    const body = [`${HER},`, ...paras];
    out.push({
      id: `letter-${n + 1}`,
      title: finalTitle,
      category,
      preview: paras[0],
      body,
      signoff: SIG,
      readingTime: Math.max(1, Math.round(wordsOf(body) / 180)),
    });
    n++;
  }

  return out;
}

export const LETTERS: Letter[] = buildLetters(50, 'our-story-letters-v1');
export const TOTAL_LETTERS = LETTERS.length;
export const LETTER_CATEGORIES = CATEGORIES;

export function letterById(id: string): Letter | undefined {
  return LETTERS.find((l) => l.id === id);
}
