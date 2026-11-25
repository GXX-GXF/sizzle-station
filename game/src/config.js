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
};

export const PATTY_COOK_SECONDS = 4;
export const PATTY_BURN_SECONDS = 5; // grace after done before it burns
export const GRILL_SLOTS = 2;

// ---------------------------------------------------------------- dishes
// A dish is a name, a price and the multiset of ingredients on the plate.
// Order matters not; a double stack simply needs two patties.

export const DISHES = {
  classic: {
    name: 'Classic Burger',
    short: 'Classic',
    price: 100,
    ingredients: ['bun', 'patty', 'lettuce', 'tomato'],
    accent: '#e07840',
  },
  cheese: {
    name: 'Cheese Burger',
    short: 'Cheese',
    price: 120,
    ingredients: ['bun', 'patty', 'cheese', 'tomato'],
    accent: '#f7c948',
  },
  double: {
    name: 'Double Stack',
    short: 'Double',
    price: 160,
    ingredients: ['bun', 'patty', 'patty', 'cheese', 'lettuce'],
    accent: '#8a5a2b',
  },
  veggie: {
    name: 'Garden Burger',
    short: 'Garden',
    price: 110,
    ingredients: ['bun', 'lettuce', 'tomato', 'cheese'],
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
  // Stations sit on the counter, left to right.
  stations: [
    { id: 'bun',     x: 24,  y: 470, w: 150, h: 150 },
    { id: 'grill',   x: 190, y: 470, w: 210, h: 150 },
    { id: 'lettuce', x: 416, y: 470, w: 150, h: 150 },
    { id: 'tomato',  x: 582, y: 470, w: 150, h: 150 },
    { id: 'cheese',  x: 748, y: 470, w: 150, h: 150 },
  ],
  assembly: { x: 920, y: 400, w: 170, h: 220 },
  serve: { x: 1110, y: 400, w: 146, h: 220 },
  footer: { x: 0, y: 640, w: 1280, h: 80 },
};

// Warm kitchen palette. Everything is drawn, nothing is an image file.
export const PALETTE = {
  wallTop: '#ffe3b3',
  wallBottom: '#ffc98a',
  tile: '#fff3dd',
  tileLine: '#f0d3a4',
  counterTop: '#a06a3b',
  counterFront: '#7d4f27',
  counterEdge: '#5d3a1c',
  board: '#2e2a26',
  boardEdge: '#171310',
  ticket: '#fff8e7',
  ticketEdge: '#d9c49a',
  ink: '#2e2a26',
  inkSoft: '#6b5d4d',
  cream: '#fff8e7',
  red: '#e0483e',
  amber: '#f5a623',
  green: '#69b455',
  blue: '#4a90d9',
};
