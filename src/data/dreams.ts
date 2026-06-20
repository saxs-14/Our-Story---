/** 50 future dreams across the categories shown on the Dreams / Vision Board page. */

export type DreamCategory =
  | 'Places to Visit'
  | 'Dream House'
  | 'Date Ideas'
  | 'Future Goals'
  | 'Marriage Dreams'
  | 'Adventure List'
  | 'Bucket List'
  | 'Joint Goals';

export interface Dream {
  id: string;
  category: DreamCategory;
  title: string;
  note: string;
  emoji: string;
}

const RAW: Record<DreamCategory, { title: string; note: string; emoji: string }[]> = {
  'Places to Visit': [
    { title: 'Watch the sunset in Cape Town', note: 'Signal Hill, a blanket, and absolutely nowhere to be.', emoji: '🌅' },
    { title: 'Santorini blue & white', note: 'Whitewashed walls, you, and an unreasonable amount of photos.', emoji: '🇬🇷' },
    { title: 'Paris in the soft season', note: 'Slow walks, warm bread, and saying "we made it" out loud.', emoji: '🗼' },
    { title: 'A quiet beach in Zanzibar', note: 'Turquoise water and a hammock built for two.', emoji: '🏝️' },
    { title: 'Northern lights together', note: 'Bundled up, looking up, holding hands in the cold.', emoji: '🌌' },
    { title: 'A safari at golden hour', note: 'Kruger, a slow drive, and the whole sky on fire.', emoji: '🦁' },
  ],
  'Dream House': [
    { title: 'A kitchen with morning light', note: 'Big windows, slow coffee, you humming while you cook.', emoji: '🌞' },
    { title: 'A reading nook for two', note: 'Soft chairs, warm lamps, and a shelf we fill together.', emoji: '📚' },
    { title: 'A little garden', note: 'Where we grow tomatoes badly and flowers beautifully.', emoji: '🌿' },
    { title: 'A wall of our photos', note: 'A staircase you cannot climb without smiling.', emoji: '🖼️' },
    { title: 'A balcony for slow evenings', note: 'String lights, two cups, and the whole day winding down.', emoji: '✨' },
  ],
  'Date Ideas': [
    { title: 'Cook a new recipe together', note: 'Make a mess, laugh, eat it anyway.', emoji: '🍝' },
    { title: 'Stargazing away from the city', note: 'A drive out, a playlist, and the universe showing off.', emoji: '🔭' },
    { title: 'A rainy-day movie marathon', note: 'Blankets, snacks, and zero plans to move.', emoji: '🎬' },
    { title: 'Sunrise hike', note: 'Tired legs, big views, and breakfast as the reward.', emoji: '🥾' },
    { title: 'Picnic in the park', note: 'Old-fashioned, golden, exactly our speed.', emoji: '🧺' },
    { title: 'Slow dancing in the kitchen', note: 'No occasion. Just one good song and you.', emoji: '💃' },
  ],
  'Future Goals': [
    { title: 'Build something stable together', note: 'A calm, secure base for the life we are dreaming up.', emoji: '🏗️' },
    { title: 'Learn a language as a team', note: 'Badly at first, fluently in love throughout.', emoji: '🗣️' },
    { title: 'Get properly healthy together', note: 'Walks, water, and looking out for each other.', emoji: '🌱' },
    { title: 'A shared savings dream', note: 'A jar, a goal, and the satisfaction of watching it fill.', emoji: '🫙' },
  ],
  'Marriage Dreams': [
    { title: 'A wedding that feels like us', note: 'Less spectacle, more warmth. The people who matter.', emoji: '💍' },
    { title: 'Write our own vows', note: 'Say out loud the things this app keeps for now.', emoji: '📜' },
    { title: 'A first dance we practised', note: 'The one we rehearsed in the kitchen until we got it.', emoji: '🎶' },
    { title: 'Grow old on the same porch', note: 'Two chairs, decades later, still choosing each other.', emoji: '🪑' },
  ],
  'Adventure List': [
    { title: 'Road trip with no fixed plan', note: 'A full tank, a playlist, and wherever the road wants.', emoji: '🚗' },
    { title: 'Try surfing together', note: 'Fall a lot, laugh more, get one good wave.', emoji: '🏄' },
    { title: 'Hot air balloon at dawn', note: 'Terrifying, gorgeous, unforgettable.', emoji: '🎈' },
    { title: 'Camp under the stars', note: 'A tent, a fire, and the quiet kind of brave.', emoji: '🏕️' },
    { title: 'Swim in a waterfall', note: 'Cold water, warm sun, the best kind of shriek.', emoji: '💦' },
  ],
  'Bucket List': [
    { title: 'See snow together', note: 'Catch it on our tongues like absolute children.', emoji: '❄️' },
    { title: 'Watch a meteor shower', note: 'Wish on the same one at the same time.', emoji: '☄️' },
    { title: 'Plant a tree we visit yearly', note: 'Measure our years by how tall it grows.', emoji: '🌳' },
    { title: 'Frame our first photo properly', note: 'The blurry one. Especially the blurry one.', emoji: '📷' },
    { title: 'Write letters to open in 10 years', note: 'Seal them. Forget them. Cry happily later.', emoji: '✉️' },
  ],
  'Joint Goals': [
    { title: 'Master one shared hobby', note: 'Something we are both bad at until suddenly we are not.', emoji: '🎯' },
    { title: 'A monthly adventure rule', note: 'One new thing together, every single month.', emoji: '🗓️' },
    { title: 'Build our own traditions', note: 'Small rituals that become "ours" without deciding to.', emoji: '🕯️' },
    { title: 'Support each other’s big dream', note: 'Take turns being the loud one in the front row.', emoji: '📣' },
  ],
};

export const DREAM_CATEGORIES = Object.keys(RAW) as DreamCategory[];

function build(): Dream[] {
  const out: Dream[] = [];
  let n = 0;
  for (const category of DREAM_CATEGORIES) {
    for (const d of RAW[category]) {
      out.push({ id: `dream-${++n}`, category, ...d });
    }
  }
  // Top up to 50 by reusing the richest categories with gentle reframings.
  const filler = [
    ...RAW['Places to Visit'],
    ...RAW['Date Ideas'],
    ...RAW['Adventure List'],
  ];
  let i = 0;
  const prefixes = ['One day:', 'Soon:', 'For us:'];
  while (out.length < 50) {
    const base = filler[i % filler.length];
    const cat = (DREAM_CATEGORIES[i % DREAM_CATEGORIES.length]);
    out.push({
      id: `dream-${++n}`,
      category: cat,
      title: `${prefixes[i % prefixes.length]} ${base.title}`,
      note: base.note,
      emoji: base.emoji,
    });
    i++;
  }
  return out.slice(0, 50);
}

export const DREAMS: Dream[] = build();
export const TOTAL_DREAMS = DREAMS.length;

export function dreamsByCategory(category: DreamCategory): Dream[] {
  return DREAMS.filter((d) => d.category === category);
}
