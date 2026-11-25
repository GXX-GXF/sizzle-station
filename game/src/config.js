// Sizzle Station: all the tuning in one place — dishes, recipes, levels,
// colours and layout. Nothing here is loaded from the network; the whole
// game is static files under game/.

export const VIEW = { width: 1280, height: 720 };

// ---------------------------------------------------------------- ingredients
// Every ingredient has a station key (1-5), a colour and a draw shape.
// A patty is the only cooked ingredient: it goes on the grill raw, cooks
// for PATTY_COOK_SECONDS, and burns if it is left on too long.

export const INGREDIENTS = {
  bun:     { key: '1', name: 'Bun',     colour: '#e8a34c', dark: '#b97a28', station: 'Bun Bin' },
  patty:   { key: '2', name: 'Patty',   colour: '#7a4a26', dark: '#4e2c14', station: 'Grill' },
  lettuce: { key: '3', name: 'Lettuce', colour: '#69b455', dark: '#3f7d33', station: 'Salad Crate' },
  tomato:  { key: '4', name: 'Tomato',  colour: '#e0483e', dark: '#a92c25', station: 'Tomato Crate' },
  cheese:  { key: '5', name: 'Cheese',  colour: '#f7c948', dark: '#d19a1d', station: 'Cheese Board' },
  // A patty left on the grill too long. It can be picked up and binned, but
  // never served; it is not a station and has no key.
  burnt:   { key: '',  name: 'Burnt patty', colour: '#141210', dark: '#000000', station: 'Bin' },
  // A cooked patty left on the holding tray too long. It is never served;
  // the tray/bin interaction clears it instead of putting it in the hand.
  spoiled: { key: '',  name: 'Spoiled patty', colour: '#77765f', dark: '#4b4f3f', station: 'Bin' },
};

export const PATTY_COOK_SECONDS = 4;
export const PATTY_BURN_SECONDS = 5; // grace after done before it burns
export const GRILL_SLOTS = 2;
export const TRAY_SLOTS = 2;
export const TRAY_SPOIL_SECONDS = 10; // parked patties stay fresh this long

// ---------------------------------------------------------------- dishes
// A dish is a name, a price and the ordered stack of ingredients on the
// plate, bottom to top. Every burger starts with a bottom bun and ends
// with a top bun; the plate must match the sequence exactly, in order.

export const DISHES = {
  classic: {
    name: 'Classic Burger',
    short: 'Classic',
    price: 100,
    ingredients: ['bun', 'patty', 'lettuce', 'tomato', 'bun'],
    accent: '#e07840',
  },
  cheese: {
    name: 'Cheese Burger',
    short: 'Cheese',
    price: 120,
    ingredients: ['bun', 'patty', 'cheese', 'tomato', 'bun'],
    accent: '#f7c948',
  },
  double: {
    name: 'Double Stack',
    short: 'Double',
    price: 160,
    ingredients: ['bun', 'patty', 'patty', 'cheese', 'lettuce', 'bun'],
    accent: '#8a5a2b',
  },
  veggie: {
    name: 'Garden Burger',
    short: 'Garden',
    price: 110,
    ingredients: ['bun', 'lettuce', 'tomato', 'cheese', 'bun'],
    accent: '#69b455',
  },
  // Signature burgers: recipes the player invents and unlocks with money
  // in the shop. They only enter the order pool once unlocked. `cost` is
  // the unlock price; `price` is what the burger sells for. They use only
  // the five existing ingredients, distinct by length and composition.
  tower: {
    name: 'The Tower',
    short: 'Tower',
    price: 200,
    ingredients: ['bun', 'patty', 'patty', 'patty', 'cheese', 'lettuce', 'tomato', 'bun'],
    accent: '#8a5a2b',
    signature: true,
    cost: 250,
    desc: 'Triple-patty tower, 8 layers. Sells for $200.',
  },
  melt: {
    name: 'Double Melt',
    short: 'Double Melt',
    price: 240,
    ingredients: ['bun', 'patty', 'cheese', 'cheese', 'lettuce', 'tomato', 'bun'],
    accent: '#f7c948',
    signature: true,
    cost: 400,
    desc: 'Double cheese, extra gooey. Sells for $240.',
  },
  garden: {
    name: 'Garden Deluxe',
    short: 'Garden Deluxe',
    price: 180,
    ingredients: ['bun', 'lettuce', 'lettuce', 'tomato', 'tomato', 'cheese', 'bun'],
    accent: '#69b455',
    signature: true,
    cost: 550,
    desc: 'Double veggie, double fresh. Sells for $180.',
  },
};

// The signature dish ids, in unlock order.
export const SIGNATURE_IDS = Object.keys(DISHES).filter((id) => DISHES[id].signature);

// ---------------------------------------------------------------- tour days
// The food truck tours for seven days, one stop per day. Each day is a
// fixed clock; the crowd, its patience and its generosity change with the
// location. Patience is how long a ticket waits before the customer walks
// out. tipMult scales the patience tip (the Night Market pays big tips).
// The base dish pool grows early on; signature burgers join the pool once
// the player unlocks them (see SIGNATURE_IDS above).

export const DAYS = [
  {
    name: 'Riverside Park',
    flavour: 'A gentle start by the river.',
    duration: 75,
    spawnEvery: 4.5,
    maxTickets: 3,
    dishes: ['classic', 'cheese', 'veggie'],
    patience: 34,
    tipMult: 1,
  },
  {
    name: 'Campus Quad',
    flavour: 'Students between classes, hungry and in a hurry.',
    duration: 80,
    spawnEvery: 3.8,
    maxTickets: 4,
    dishes: ['classic', 'cheese', 'veggie', 'double'],
    patience: 30,
    tipMult: 1,
  },
  {
    name: 'Downtown Lunch',
    flavour: 'The office rush: impatient, but they tip on time.',
    duration: 80,
    spawnEvery: 3.5,
    maxTickets: 4,
    dishes: ['classic', 'cheese', 'double', 'veggie'],
    patience: 26,
    tipMult: 1,
  },
  {
    name: 'Night Market',
    flavour: 'Lanterns, crowds and big tippers.',
    duration: 85,
    spawnEvery: 4.0,
    maxTickets: 4,
    dishes: ['classic', 'cheese', 'double', 'veggie'],
    patience: 36,
    tipMult: 1.5,
  },
  {
    name: 'Beach Boardwalk',
    flavour: 'Weekend strollers, sandy and easygoing.',
    duration: 85,
    spawnEvery: 4.0,
    maxTickets: 4,
    dishes: ['classic', 'cheese', 'double', 'veggie'],
    patience: 32,
    tipMult: 1,
  },
  {
    name: 'Stadium Game Day',
    flavour: 'A roaring crowd with no time to wait.',
    duration: 85,
    spawnEvery: 3.5,
    maxTickets: 5,
    dishes: ['classic', 'cheese', 'double', 'veggie'],
    patience: 28,
    tipMult: 1,
  },
  {
    name: 'Food Festival',
    flavour: 'The finale: the biggest crowd of the tour.',
    duration: 90,
    spawnEvery: 3.5,
    maxTickets: 5,
    dishes: ['classic', 'cheese', 'double', 'veggie'],
    patience: 30,
    tipMult: 1,
  },
];

export const MAX_EXPIRED_PER_DAY = 3; // a third walk-out ends the day
export const SERVE_BONUS_MAX = 50;      // tip for serving with patience left
export const COMBO_STEP = 5;            // extra points per streak step
export const COMBO_CAP = 50;
export const WRONG_SERVE_PENALTY = 25;

// ---------------------------------------------------------------- shop
// Between days the player spends the money they earned on one-off
// upgrades and on unlocking signature burgers. Score is the final metric
// and is never reduced by spending; money is the spendable wallet. Each
// item is bought once and applies to every day after it is bought.

export const TURBO_COOK_SECONDS = 3; // Turbo Grill: patties cook in 3s
export const CALM_PATIENCE_MULT = 1.3; // Calm Customers: patience x1.3
export const BIG_TIP_MULT = 1.5;       // Big Tips: tip bonus x1.5

export const UPGRADES = {
  turbo: { name: 'Turbo Grill',    desc: 'Patties cook in 3s, not 4s.',  price: 180 },
  calm:  { name: 'Calm Customers', desc: 'Customers wait 30% longer.',  price: 180 },
  tips:  { name: 'Big Tips',       desc: 'Tips are worth 50% more.',     price: 150 },
};

// Shop panel geometry (1280x720 view). The buy rects are explicit so the
// drawing in render.js and the hit test in main.js can never drift apart.
// Two card rows: upgrades on top, signature burgers below.
export const SHOP = {
  panel: { x: 100, y: 60, w: 1080, h: 600 },
  cards: [
    { id: 'turbo',  kind: 'upgrade',   x: 140, y: 240, w: 320, h: 150, buy: { x: 230, y: 348, w: 140, h: 36 } },
    { id: 'calm',   kind: 'upgrade',   x: 480, y: 240, w: 320, h: 150, buy: { x: 570, y: 348, w: 140, h: 36 } },
    { id: 'tips',   kind: 'upgrade',   x: 820, y: 240, w: 320, h: 150, buy: { x: 910, y: 348, w: 140, h: 36 } },
    { id: 'tower',  kind: 'signature', x: 140, y: 420, w: 320, h: 150, buy: { x: 230, y: 528, w: 140, h: 36 } },
    { id: 'melt',   kind: 'signature', x: 480, y: 420, w: 320, h: 150, buy: { x: 570, y: 528, w: 140, h: 36 } },
    { id: 'garden', kind: 'signature', x: 820, y: 420, w: 320, h: 150, buy: { x: 910, y: 528, w: 140, h: 36 } },
  ],
  next: { x: 520, y: 590, w: 240, h: 44 },
};

// ---------------------------------------------------------------- layout
// All positions are in the 1280x720 view. The kitchen is one screen:
// order board on top, stations along the counter, assembly in the middle,
// serve window on the right.

export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 62 },
  board: { x: 16, y: 72, w: 1248, h: 108 },
  kitchen: { x: 0, y: 190, w: 1280, h: 380 },
  // Stations sit on the counter, left to right. The holding tray is next
  // to the grill so a finished patty can be parked without crossing the
  // kitchen; the bin remains the last station before the assembly plate.
  stations: [
    { id: 'bun',     x: 12,  y: 470, w: 116, h: 150 },
    { id: 'grill',   x: 132, y: 470, w: 184, h: 150 },
    { id: 'tray',    x: 322, y: 470, w: 124, h: 150 },
    { id: 'lettuce', x: 452, y: 470, w: 116, h: 150 },
    { id: 'tomato',  x: 574, y: 470, w: 116, h: 150 },
    { id: 'cheese',  x: 696, y: 470, w: 116, h: 150 },
    { id: 'bin',     x: 818, y: 470, w: 88,  h: 150 },
  ],
  assembly: { x: 920, y: 400, w: 170, h: 220 },
  serve: { x: 1110, y: 400, w: 146, h: 220 },
  footer: { x: 0, y: 640, w: 1280, h: 80 },
};

// Warm retro-diner palette, after Dribbble burger-joint references
// (BURGY by VibeStyle, OOZA by BayFi Studio, Burger Boys, Nature Burger
// by Naokure): cherry red + mustard + cream on dark espresso, with thick
// outlines and offset shadows instead of flat beige. Everything is drawn,
// nothing is an image file.
export const PALETTE = {
  wallTop: '#ffdf9e',
  wallBottom: '#ffc978',
  tile: '#fff3da',
  tileLine: '#eec687',
  counterTop: '#b26a33',
  counterFront: '#8a4a22',
  counterEdge: '#5e3013',
  board: '#2b1a12',
  boardEdge: '#160d07',
  ticket: '#fffdf4',
  ticketEdge: '#dfc084',
  ink: '#2b1a12',
  inkSoft: '#7a5a40',
  cream: '#fff6e3',
  paper: '#fffdf6',
  red: '#d9382b',
  redDark: '#a81f18',
  amber: '#f59e0b',
  mustard: '#ffb627',
  green: '#4e9b47',
  greenDark: '#2f6b2a',
  blue: '#4a90d9',
  gold: '#ffc93c',
  sky: '#a8d8f0',
  skyDeep: '#7cc0e8',
  hill: '#7cbf6a',
  steel: '#3d3a38',
  steelLight: '#5c5855',
  // New for the wall pass: the wainscot band along the bottom of the wall,
  // and the neon OPEN sign in the window.
  wainscot: '#f0c184',
  wainscotLine: '#d9a05e',
  neon: '#ff4040',
};
