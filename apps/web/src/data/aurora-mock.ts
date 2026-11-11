// Placeholder content for the Soft Aurora screens.
// Swap these for API calls once the matching endpoints exist.

export type Hue = 'peach' | 'lilac' | 'mint' | 'coral';

export interface Celebrity {
  id: string;
  name: string;
  handle: string;
  craft: string;
  city: string;
  bio: string;
  hue: Hue;
  status: 'online' | 'busy' | 'away';
  followers: number;
  audioRate: number;
  videoRate: number;
  replies: string;
  posts: Array<{ id: string; kind: 'photo' | 'video'; caption: string; likes: number; hue: Hue }>;
}

export const celebrities: Celebrity[] = [
  {
    id: 'meera-varma',
    name: 'Meera Varma',
    handle: '@meeravarma',
    craft: 'Playback singer',
    city: 'Kochi',
    bio: 'Sings for films, writes for herself. Happy to talk about voice, nerves and first auditions.',
    hue: 'peach',
    status: 'online',
    followers: 182400,
    audioRate: 40,
    videoRate: 75,
    replies: 'Usually picks up within 2 minutes',
    posts: [
      { id: 'p1', kind: 'video', caption: 'Warm-up I do before every recording', likes: 12400, hue: 'peach' },
      { id: 'p2', kind: 'photo', caption: 'Studio B, 2 a.m.', likes: 8900, hue: 'lilac' },
      { id: 'p3', kind: 'photo', caption: 'The harmonium that started it all', likes: 15100, hue: 'mint' },
    ],
  },
  {
    id: 'arjun-das',
    name: 'Arjun Das',
    handle: '@arjunplays',
    craft: 'Cricketer',
    city: 'Trivandrum',
    bio: 'Opening batter. Ask me about pressure, comebacks or the best dosa near the stadium.',
    hue: 'mint',
    status: 'online',
    followers: 391000,
    audioRate: 60,
    videoRate: 110,
    replies: 'Free most evenings after 7',
    posts: [
      { id: 'p4', kind: 'video', caption: 'Nets session, slow motion', likes: 40200, hue: 'mint' },
      { id: 'p5', kind: 'photo', caption: 'First bat I ever owned', likes: 22800, hue: 'peach' },
    ],
  },
  {
    id: 'nila-krishnan',
    name: 'Nila Krishnan',
    handle: '@nilacooks',
    craft: 'Chef and food writer',
    city: 'Kozhikode',
    bio: 'Malabar kitchens, family recipes and why your biryani rice keeps breaking.',
    hue: 'coral',
    status: 'busy',
    followers: 96300,
    audioRate: 25,
    videoRate: 45,
    replies: 'On a call right now',
    posts: [
      { id: 'p6', kind: 'video', caption: 'Layering a dum biryani', likes: 9800, hue: 'coral' },
      { id: 'p7', kind: 'photo', caption: 'Market haul, Thursday', likes: 4100, hue: 'mint' },
    ],
  },
  {
    id: 'rohan-thomas',
    name: 'Rohan Thomas',
    handle: '@rohanframes',
    craft: 'Film director',
    city: 'Kochi',
    bio: 'Three features, one short that went too far. Talk scripts, sets or film school.',
    hue: 'lilac',
    status: 'away',
    followers: 74500,
    audioRate: 50,
    videoRate: 90,
    replies: 'Back online tomorrow',
    posts: [
      { id: 'p8', kind: 'photo', caption: 'Storyboard for the rain scene', likes: 6200, hue: 'lilac' },
    ],
  },
  {
    id: 'sana-ali',
    name: 'Sana Ali',
    handle: '@sanamoves',
    craft: 'Dancer',
    city: 'Kozhikode',
    bio: 'Contemporary and Mohiniyattam. Ask me how to start at 25.',
    hue: 'lilac',
    status: 'online',
    followers: 128900,
    audioRate: 30,
    videoRate: 60,
    replies: 'Usually picks up within 5 minutes',
    posts: [
      { id: 'p9', kind: 'video', caption: 'Eight counts, three ways', likes: 18300, hue: 'lilac' },
      { id: 'p10', kind: 'photo', caption: 'Rehearsal floor', likes: 7600, hue: 'peach' },
    ],
  },
  {
    id: 'dev-menon',
    name: 'Dev Menon',
    handle: '@devlaughs',
    craft: 'Stand-up comic',
    city: 'Trivandrum',
    bio: 'I will roast your call ringtone. Gently.',
    hue: 'peach',
    status: 'online',
    followers: 211700,
    audioRate: 35,
    videoRate: 65,
    replies: 'Usually picks up within 1 minute',
    posts: [
      { id: 'p11', kind: 'video', caption: 'Crowd work, Kochi show', likes: 33100, hue: 'peach' },
    ],
  },
];

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  left: number;
}

export interface EventItem {
  id: string;
  title: string;
  host: string;
  city: 'Kochi' | 'Kozhikode' | 'Trivandrum';
  venue: string;
  date: string; // ISO
  distanceKm: number;
  hue: Hue;
  blurb: string;
  tiers: TicketTier[];
}

export const events: EventItem[] = [
  {
    id: 'backwater-sessions',
    title: 'Backwater Sessions',
    host: 'Kayal Collective',
    city: 'Kochi',
    venue: 'Fort Kochi Warehouse',
    date: '2026-11-22T18:30:00+05:30',
    distanceKm: 4.2,
    hue: 'mint',
    blurb: 'An evening of acoustic sets by the water, with Meera Varma closing the night.',
    tiers: [
      { id: 't1', name: 'General', price: 499, left: 120 },
      { id: 't2', name: 'Front row', price: 1299, left: 14 },
    ],
  },
  {
    id: 'malabar-food-walk',
    title: 'Malabar Food Walk',
    host: 'Nila Krishnan',
    city: 'Kozhikode',
    venue: 'SM Street, starting at Mananchira',
    date: '2026-11-29T16:00:00+05:30',
    distanceKm: 182,
    hue: 'coral',
    blurb: 'Six stops, three hours, one very full stomach. Walk the old market with a chef.',
    tiers: [{ id: 't3', name: 'Walker', price: 899, left: 9 }],
  },
  {
    id: 'open-mic-night',
    title: 'Open Mic Night',
    host: 'Laugh Lab',
    city: 'Trivandrum',
    venue: 'Kowdiar Courtyard',
    date: '2026-12-05T19:30:00+05:30',
    distanceKm: 210,
    hue: 'peach',
    blurb: 'Ten new comics, five minutes each, hosted by Dev Menon.',
    tiers: [
      { id: 't4', name: 'Seat', price: 299, left: 64 },
      { id: 't5', name: 'Table for 4', price: 999, left: 6 },
    ],
  },
  {
    id: 'short-film-club',
    title: 'Short Film Club',
    host: 'Rohan Thomas',
    city: 'Kochi',
    venue: 'Panampilly Screening Room',
    date: '2026-12-12T17:00:00+05:30',
    distanceKm: 6.8,
    hue: 'lilac',
    blurb: 'Five shorts by first-time directors, followed by an open Q&A.',
    tiers: [{ id: 't6', name: 'Entry', price: 199, left: 40 }],
  },
];

export const coinPacks = [
  { id: 'c1', coins: 100, price: 99, bonus: 0 },
  { id: 'c2', coins: 300, price: 279, bonus: 20 },
  { id: 'c3', coins: 750, price: 649, bonus: 75 },
  { id: 'c4', coins: 2000, price: 1599, bonus: 300 },
];

export const transactions = [
  { id: 'x1', label: 'Video call with Meera Varma', detail: '6 min', amount: -450, when: 'Today, 8:14 pm' },
  { id: 'x2', label: 'Added coins', detail: '750 pack + 75 bonus', amount: 825, when: 'Today, 8:02 pm' },
  { id: 'x3', label: 'Audio call with Dev Menon', detail: '4 min', amount: -140, when: 'Yesterday' },
  { id: 'x4', label: 'Welcome bonus', detail: 'New account', amount: 50, when: 'Nov 8' },
];

export const recentChats = [
  { id: 'r1', name: 'Anaya', hue: 'lilac' as Hue, when: '12 min ago', kind: 'Video', duration: '18:42' },
  { id: 'r2', name: 'Kiran', hue: 'mint' as Hue, when: '2 h ago', kind: 'Audio', duration: '06:10' },
  { id: 'r3', name: 'Fathima', hue: 'peach' as Hue, when: 'Yesterday', kind: 'Video', duration: '31:05' },
];

export const interests = ['Music', 'Cricket', 'Films', 'Food', 'Travel', 'Comedy', 'Books', 'Tech', 'Dance', 'Startups'];

export const formatCount = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : `${n}`;

export const formatRupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
