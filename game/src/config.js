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
};

export const PATTY_COOK_SECONDS = 4;
export const PATTY_BURN_SECONDS = 5; // grace after done before it burns
export const GRILL_SLOTS = 2;

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
};

// ---------------------------------------------------------------- levels
// Three shifts. Each shift is a fixed clock; orders arrive faster and the
// menu grows as the night goes on. Patience is how long a ticket waits
// before the customer walks out.

export const LEVELS = [
  {
    name: 'Lunch Rush',
    duration: 75,
    spawnEvery: 8,
    maxTickets: 3,
    dishes: ['classic', 'cheese'],
    patience: 34,
  },
  {
    name: 'Dinner Rush',
    duration: 80,
    spawnEvery: 6.5,
    maxTickets: 3,
    dishes: ['classic', 'cheese', 'double'],
    patience: 31,
  },
  {
    name: 'Closing Rush',
    duration: 85,
    spawnEvery: 5,
    maxTickets: 4,
    dishes: ['classic', 'cheese', 'double', 'veggie'],
    patience: 28,
  },
];

export const MAX_EXPIRED_PER_SHIFT = 3; // a third walk-out ends the shift
export const SERVE_BONUS_MAX = 50;      // tip for serving with patience left
export const COMBO_STEP = 5;            // extra points per streak step
export const COMBO_CAP = 50;
export const WRONG_SERVE_PENALTY = 25;

// ---------------------------------------------------------------- layout
// All positions are in the 1280x720 view. The kitchen is one screen:
// order board on top, stations along the counter, assembly in the middle,
// serve window on the right.

export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 62 },
  board: { x: 16, y: 72, w: 1248, h: 108 },
  kitchen: { x: 0, y: 190, w: 1280, h: 380 },
  // Stations sit on the counter, left to right. The bin is the last one:
  // a narrow station so the row still ends before the assembly plate.
  stations: [
    { id: 'bun',     x: 24,  y: 470, w: 132, h: 150 },
    { id: 'grill',   x: 166, y: 470, w: 204, h: 150 },
    { id: 'lettuce', x: 380, y: 470, w: 132, h: 150 },
    { id: 'tomato',  x: 522, y: 470, w: 132, h: 150 },
    { id: 'cheese',  x: 664, y: 470, w: 132, h: 150 },
    { id: 'bin',     x: 806, y: 470, w: 100, h: 150 },
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
};
