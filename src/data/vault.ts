/**
 * The "Open When" vault — sealed envelopes for specific moods & moments.
 * Each opens with a 3D envelope animation; media slots (photo/voice/video/song)
 * are optional and resolve from /public/media when the user adds their own.
 */
import relationship from '@/config/relationship';

const HER = relationship.her.nickname;

export interface VaultMedia {
  photo?: string;
  voice?: string;
  video?: string;
  song?: { title: string; artist: string; src?: string };
}

export interface OpenWhenLetter {
  id: string;
  /** e.g. "Open When You're Sad" */
  occasion: string;
  /** short label for the envelope front */
  tab: string;
  emoji: string;
  /** wax-seal accent colour */
  seal: string;
  body: string[];
  media?: VaultMedia;
}

export const VAULT: OpenWhenLetter[] = [
  {
    id: 'sad',
    occasion: "Open When You're Sad",
    tab: 'When you’re sad',
    emoji: '🌧️',
    seal: '#8b7dc4',
    body: [
      `Hi, ${HER}. If you opened this, today is heavy — so let’s make it lighter together for a minute.`,
      'You are allowed to be sad. You do not have to explain it, fix it quickly, or apologise for it. Feelings are not failures; they are just weather, and weather always moves.',
      'Put your hand on your chest. Feel that? That is a heart I am completely in love with, still beating, still carrying you through. You have made it through every single hard day so far. Perfect record.',
      'I am right here. Not to fix it — just to sit with you in it until the sky clears. And it will clear. It always does. I love you, on the bright days and the grey ones alike.',
    ],
    media: { song: { title: 'Something soft', artist: 'Our playlist' } },
  },
  {
    id: 'angry',
    occasion: 'Open When You’re Angry',
    tab: 'When you’re angry',
    emoji: '🔥',
    seal: '#e3706a',
    body: [
      'Okay. You’re angry. Good — that means something matters to you, and that is allowed.',
      'Take a slow breath with me. In for four, hold for four, out for six. Again. Your anger is valid; it just does not get to drive the car.',
      'If it’s at me: I would rather understand you than win. Come tell me, even messily. I can take it. If it’s at the world: I’m on your side, fully, no questions asked.',
      'You are still safe here. Nothing you feel could make me love you less. Let it out, then let it go when you’re ready. I’ll be holding space for the calmer you on the other side.',
    ],
  },
  {
    id: 'lonely',
    occasion: 'Open When You’re Lonely',
    tab: 'When you’re lonely',
    emoji: '🌙',
    seal: '#b76e79',
    body: [
      'Loneliness lies. It tells you that you are alone. You are not.',
      'Right now, somewhere, you are on my mind. You have softened my whole expression without even knowing it. That is how present you always are to me.',
      'Wrap yourself up. Make something warm. Imagine me beside you, because in every way that matters, I am. Talk to me later and tell me everything.',
      'You are deeply, permanently loved, even in the quiet. Especially in the quiet.',
    ],
  },
  {
    id: 'missing',
    occasion: 'Open When You’re Missing Me',
    tab: 'When you miss me',
    emoji: '💗',
    seal: '#c98b8b',
    body: [
      'Missing me is just love with nowhere to put itself yet. So put it here for a moment.',
      'Close your eyes. I’m there — at your side, holding your hand, telling you the day will be alright. We are never as far apart as the map insists.',
      'I miss you too, constantly and quietly. The distance is temporary. The us is not.',
      'Save up all that missing. I’m coming back for it, and for you.',
    ],
  },
  {
    id: 'stressed',
    occasion: 'Open When You’re Stressed',
    tab: 'When you’re stressed',
    emoji: '🫧',
    seal: '#d4af7a',
    body: [
      'Stop. One thing at a time. You cannot carry the whole mountain — just the next step.',
      'Write down what’s spinning in your head. Now circle the one thing you can actually touch today. The rest can wait its turn.',
      'You are not behind. You are a person doing a lot, and doing it better than the panic gives you credit for.',
      'Drink some water. Unclench your jaw. Lower your shoulders. I’ve got the rest. Breathe, my love — you’ve always figured it out, and you will again.',
    ],
  },
  {
    id: 'birthday',
    occasion: 'Open On Your Birthday',
    tab: 'On your birthday',
    emoji: '🎂',
    seal: '#e4c47e',
    body: [
      `Happy birthday, ${HER}! The world got measurably better the day you arrived in it.`,
      'I hope this year is gentle and generous with you. I hope it brings the quiet things you’ve been hoping for and a few good surprises you didn’t think to ask for.',
      'Thank you for another year of being exactly, wonderfully you. It is my favourite thing that exists.',
      'Here’s to celebrating you today and adoring you every other day of the year. Make a wish — I’m already working on making it come true.',
    ],
    media: { song: { title: 'Happy Birthday', artist: 'sung badly, by me' } },
  },
  {
    id: 'anniversary',
    occasion: 'Open On Our Anniversary',
    tab: 'On our anniversary',
    emoji: '🥂',
    seal: '#b76e79',
    body: [
      'We made it another stretch of road, and I refuse to let it pass quietly.',
      'I noticed how you stayed soft. I noticed the small sacrifices you thought went unseen. I noticed every time you chose us. None of it was invisible to me.',
      'Anniversaries are not just about how long, but about how. And how we’ve loved each other is something I am proud of.',
      'Here’s to the next chapter, written the same careful way: together. I love you more than the day this all started — and that was already a lot.',
    ],
  },
  {
    id: 'argument',
    occasion: 'Open After An Argument',
    tab: 'After an argument',
    emoji: '🕊️',
    seal: '#a99ed6',
    body: [
      'If we’ve just argued, read this slowly. First: I’m still here. I’m still yours.',
      'I would rather be close to you than be right. I’m sorry for any moment I made you feel unseen — that’s the opposite of everything I want.',
      'We’re allowed to be two whole people who sometimes get it wrong. What matters is that we keep finding our way back, gently, on purpose.',
      'Consider this my hand reaching for yours across whatever distance today created. Come back to me. I never really left.',
    ],
  },
  {
    id: 'motivation',
    occasion: 'Open When You Need Motivation',
    tab: 'Need motivation',
    emoji: '⚡',
    seal: '#f0ac7e',
    body: [
      'Whatever you’re facing: you’ve got this. I’ve watched you do hard things and stay kind through them.',
      'You don’t have to feel ready. You just have to begin. Momentum is built mid-motion, not before it.',
      'If your own belief is running low, borrow mine. I have an absurd amount of certainty about you.',
      'Picture the version of you on the other side of this — proud, relieved, a little surprised at how strong they were. Go meet them. I’ll be cheering the whole way.',
    ],
  },
  {
    id: 'loved',
    occasion: 'Open When You Need To Remember You Are Loved',
    tab: 'You are loved',
    emoji: '💖',
    seal: '#e3706a',
    body: [
      'In case you forgot, and in case no one has told you today: you are loved. Completely. Without conditions.',
      'Not for what you do, or how useful you are, or how well you’re holding it together. Just for being you — the whole, real, unfiltered you.',
      'You do not have to earn your place with me. You already have it, permanently, no renewal required.',
      'So rest in this for a second. Breathe it in. You are loved, ' + HER + '. You always were. You always will be.',
    ],
  },
];

export const TOTAL_VAULT = VAULT.length;

export function vaultById(id: string): OpenWhenLetter | undefined {
  return VAULT.find((v) => v.id === id);
}
