/** 20 private notes revealed only after the hidden heart is unlocked. */
import relationship from '@/config/relationship';

const HER = relationship.her.nickname;

export interface SecretMessage {
  id: string;
  title: string;
  text: string;
}

export const SECRET_MESSAGES: SecretMessage[] = [
  { id: 's1', title: 'You found it', text: `Of course you did, ${HER}. Curious, persistent, impossible not to adore. Welcome to the part of this I made just for you.` },
  { id: 's2', title: 'A quiet truth', text: 'I was already in love with you a long time before I said it. I just enjoyed knowing it privately for a while.' },
  { id: 's3', title: 'The first time', text: 'The first time I saw your name light up my phone and felt my whole mood change, I knew I was in trouble. The good kind.' },
  { id: 's4', title: 'When you sleep', text: 'You make a tiny sound right before you fall asleep. I have never told you. It is one of my favourite things in the world.' },
  { id: 's5', title: 'My weakness', text: 'You could win any argument just by laughing in the middle of it. Please do not tell you this. It is classified.' },
  { id: 's6', title: 'A confession', text: 'I reread our old conversations more than I will ever admit. Some of them I know by heart.' },
  { id: 's7', title: 'The plan', text: 'I think about a future with you far more often than I let on. I am just quietly building toward it.' },
  { id: 's8', title: 'On hard days', text: 'On my hardest days, the thought that gets me up is simple: she is out there, and she is mine, and I get to go be hers.' },
  { id: 's9', title: 'Your laugh', text: 'If I could bottle one thing forever, it would be your laugh at its most unguarded. The one you do not perform.' },
  { id: 's10', title: 'Promise', text: 'I promise to keep choosing you on the ordinary days, which is where most of love actually lives.' },
  { id: 's11', title: 'The truth about us', text: 'People think the spark is the love. The spark is just the invitation. The choosing is the love. I choose you.' },
  { id: 's12', title: 'Something I notice', text: 'You take care of everyone. Let this be a small place where someone is taking care of you.' },
  { id: 's13', title: 'A wish', text: 'I wish you could see yourself the way I do for just one day. You would never doubt your worth again.' },
  { id: 's14', title: 'Late night', text: 'It is probably late and you are probably overthinking. Stop. Breathe. You are loved. Go to sleep, my love.' },
  { id: 's15', title: 'The small museum', text: 'I keep a small museum of moments with you. This whole app is just me finally building it walls.' },
  { id: 's16', title: 'Forever-ish', text: 'I do not believe in easy forevers. I believe in chosen ones. Ours is chosen, daily, on purpose, by me.' },
  { id: 's17', title: 'You should know', text: 'You are not "a lot". You are exactly enough, and the people who said otherwise were just too small to hold you.' },
  { id: 's18', title: 'My favourite version', text: 'My favourite version of you is the unfiltered one. Tired, honest, make-up off, guard down. That one. Always that one.' },
  { id: 's19', title: 'A secret hope', text: 'I hope one day you read all of this from a home we share, and laugh at how nervous I was being this honest.' },
  { id: 's20', title: 'The last secret', text: `If you have read this far: I love you, ${HER}. Not the loud, performed kind. The quiet, permanent, ordinary-Tuesday kind. The real kind.` },
];

export const TOTAL_SECRET_MESSAGES = SECRET_MESSAGES.length;
