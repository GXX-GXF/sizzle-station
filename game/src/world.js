// Sizzle Station's state: tickets, the grill, the assembly plate, the
// shift clock and the score. No drawing here and no input here; this file
// only decides what happens when the player does something, and what time
// does when the player does nothing.

import {
  DISHES, LEVELS, INGREDIENTS, PATTY_COOK_SECONDS, PATTY_BURN_SECONDS,
  GRILL_SLOTS, MAX_EXPIRED_PER_SHIFT, SERVE_BONUS_MAX, COMBO_STEP,
  COMBO_CAP, WRONG_SERVE_PENALTY,
} from './config.js';
import { mulberry32, pick } from './random.js';

let nextTicketId = 1;

export function createWorld(seed = 1) {
  return {
    seed,
    rand: mulberry32(seed),
    screen: 'title', // title | playing | shiftEnd | gameover | failed
    levelIndex: 0,
    timeLeft: LEVELS[0].duration,
    spawnIn: 1.2,
    score: 0,
    served: 0,
    expired: 0,
    combo: 0,
    bestCombo: 0,
    stars: 0,
    event: null, // one-frame event for sounds: 'expire' | 'levelEnd' | 'failed'
    hand: null, // an ingredient id the player is carrying, or null
    plate: [], // ingredient ids on the assembly plate, bottom first
    grill: Array.from({ length: GRILL_SLOTS }, () => ({ state: 'empty', t: 0 })),
    tickets: [],
    particles: [],
    popups: [],
    message: null, // a short toast, { text, t }
    shiftServed: 0,
    shiftExpired: 0,
    lastServedDish: null,
    servedFlash: 0, // seconds the serve window glows after a serve
  };
}

export function levelOf(world) {
  return LEVELS[world.levelIndex];
}

export function startShift(world, levelIndex) {
  const level = LEVELS[levelIndex];
  world.levelIndex = levelIndex;
  world.timeLeft = level.duration;
  world.spawnIn = 1.0;
  world.tickets = [];
  world.plate = [];
  world.hand = null;
  world.grill = Array.from({ length: GRILL_SLOTS }, () => ({ state: 'empty', t: 0 }));
  world.shiftServed = 0;
  world.shiftExpired = 0;
  world.screen = 'playing';
  world.message = { text: `${level.name} — serve them all!`, t: 2.2 };
  spawnTicket(world);
}

export function startGame(world) {
  world.score = 0;
  world.served = 0;
  world.expired = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.stars = 0;
  startShift(world, 0);
}

function spawnTicket(world) {
  const level = levelOf(world);
  if (world.tickets.filter((t) => t.state === 'waiting').length >= level.maxTickets) return;
  const dishId = pick(world.rand, level.dishes);
  world.tickets.push({
    id: nextTicketId++,
    dishId,
    patience: level.patience,
    patienceMax: level.patience,
    state: 'waiting',
  });
}

// Count how many of each ingredient a list holds.
function counts(list) {
  const out = {};
  for (const item of list) out[item] = (out[item] || 0) + 1;
  return out;
}

// Does the plate hold exactly the dish's recipe, item for item?
export function plateMatchesDish(plate, dishId) {
  const want = counts(DISHES[dishId].ingredients);
  const have = counts(plate);
  const keys = new Set([...Object.keys(want), ...Object.keys(have)]);
  for (const k of keys) if ((want[k] || 0) !== (have[k] || 0)) return false;
  return true;
}

// The waiting ticket whose recipe the plate matches, lowest patience first.
export function matchingTicket(world) {
  const waiting = world.tickets
    .filter((t) => t.state === 'waiting' && plateMatchesDish(world.plate, t.dishId))
    .sort((a, b) => a.patience - b.patience);
  return waiting[0] || null;
}

// Is this ingredient still wanted by any waiting ticket, given the plate?
function stillWanted(world, ingredient) {
  for (const ticket of world.tickets) {
    if (ticket.state !== 'waiting') continue;
    const want = counts(DISHES[ticket.dishId].ingredients);
    const have = counts(world.plate);
    if ((have[ingredient] || 0) < (want[ingredient] || 0)) return true;
  }
  return false;
}

function toast(world, text) {
  world.message = { text, t: 1.6 };
}

function popup(world, x, y, text, colour) {
  world.popups.push({ x, y, text, colour: colour || '#2e2a26', t: 1.1 });
}

function burst(world, x, y, colour, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = world.rand() * Math.PI * 2;
    const speed = 40 + world.rand() * 90;
    world.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 40,
      t: 0.5 + world.rand() * 0.4,
      colour,
      size: 3 + world.rand() * 4,
    });
  }
}

// ---------------------------------------------------------------- actions
// Each returns a small event string the caller may play a sound for:
// 'pick' | 'place' | 'grill' | 'serve' | 'wrong' | 'expire' | null.

export function pickFromStation(world, stationId) {
  if (world.screen !== 'playing') return null;
  if (world.hand) { toast(world, 'Hands full — place it on the plate first'); return 'wrong'; }
  if (stationId === 'grill') return takeFromGrill(world);
  if (!stillWanted(world, stationId)) {
    toast(world, `${INGREDIENTS[stationId].name} is not on any open order`);
    return 'wrong';
  }
  world.hand = stationId;
  return 'pick';
}

export function takeFromGrill(world) {
  const done = world.grill.find((s) => s.state === 'done');
  if (done) {
    done.state = 'empty';
    done.t = 0;
    world.hand = 'patty';
    return 'pick';
  }
  const burnt = world.grill.find((s) => s.state === 'burnt');
  if (burnt) {
    burnt.state = 'empty';
    burnt.t = 0;
    toast(world, 'Burnt patty binned — watch the grill!');
    return 'place';
  }
  const empty = world.grill.find((s) => s.state === 'empty');
  if (empty) {
    empty.state = 'cooking';
    empty.t = 0;
    return 'grill';
  }
  toast(world, 'Grill is full');
  return 'wrong';
}

export function placeOnPlate(world) {
  if (world.screen !== 'playing') return null;
  if (!world.hand) {
    // Empty hand on the plate takes the top item back off.
    const top = world.plate.pop();
    if (top) { world.hand = top; return 'pick'; }
    return null;
  }
  const item = world.hand;
  if (!stillWanted(world, item)) {
    toast(world, `No open order wants ${INGREDIENTS[item].name} right now`);
    return 'wrong';
  }
  world.plate.push(item);
  world.hand = null;
  burst(world, 1005, 470, INGREDIENTS[item].colour, 6);
  return 'place';
}

export function serveTicket(world, ticketId) {
  if (world.screen !== 'playing') return null;
  const ticket = world.tickets.find((t) => t.id === ticketId);
  if (!ticket || ticket.state !== 'waiting') return null;
  if (!plateMatchesDish(world.plate, ticket.dishId)) {
    world.score = Math.max(0, world.score - WRONG_SERVE_PENALTY);
    world.combo = 0;
    toast(world, `That is not a ${DISHES[ticket.dishId].name}! −${WRONG_SERVE_PENALTY}`);
    return 'wrong';
  }
  const dish = DISHES[ticket.dishId];
  const tip = Math.round((ticket.patience / ticket.patienceMax) * SERVE_BONUS_MAX);
  const comboBonus = Math.min(world.combo * COMBO_STEP, COMBO_CAP);
  const gained = dish.price + tip + comboBonus;
  world.score += gained;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.served += 1;
  world.shiftServed += 1;
  world.lastServedDish = ticket.dishId;
  world.servedFlash = 1.2;
  ticket.state = 'served';
  ticket.goneIn = 0.6; // the ticket lingers as a checkmark, then leaves
  world.plate = [];
  world.hand = null;
  popup(world, 1180, 430, `+${gained}`, '#3f7d33');
  burst(world, 1180, 470, '#f7c948', 14);
  return 'serve';
}

// Space serves the matching ticket with the least patience left.
export function serveBest(world) {
  const ticket = matchingTicket(world);
  if (!ticket) {
    if (world.plate.length > 0) toast(world, 'No order matches this plate yet');
    return null;
  }
  return serveTicket(world, ticket.id);
}

// ---------------------------------------------------------------- time

function endShift(world, failed) {
  world.screen = failed ? 'failed' : 'shiftEnd';
  world.event = failed ? 'failed' : 'levelEnd';
  if (!failed) {
    const stars = world.shiftExpired === 0 ? 3 : world.shiftExpired === 1 ? 2 : 1;
    world.stars += stars;
    world.shiftStars = stars;
  }
}

export function update(world, dt) {
  // Particles and popups age whatever the screen.
  for (const p of world.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
    p.t -= dt;
  }
  world.particles = world.particles.filter((p) => p.t > 0);
  for (const p of world.popups) { p.y -= 34 * dt; p.t -= dt; }
  world.popups = world.popups.filter((p) => p.t > 0);
  if (world.message) {
    world.message.t -= dt;
    if (world.message.t <= 0) world.message = null;
  }
  if (world.servedFlash > 0) world.servedFlash -= dt;
  if (world.screen !== 'playing') return;

  const level = levelOf(world);
  world.timeLeft -= dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    endShift(world, false);
    return;
  }

  // New orders on the level's rhythm.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnTicket(world);
    world.spawnIn = level.spawnEvery;
  }

  // Patience runs out: the customer walks out.
  for (const ticket of world.tickets) {
    if (ticket.state !== 'waiting') continue;
    ticket.patience -= dt;
    if (ticket.patience <= 0) {
      ticket.patience = 0;
      ticket.state = 'expired';
      world.expired += 1;
      world.shiftExpired += 1;
      world.combo = 0;
      world.event = 'expire';
      toast(world, `A ${DISHES[ticket.dishId].name} walked out!`);
      if (world.shiftExpired >= MAX_EXPIRED_PER_SHIFT) {
        endShift(world, true);
        return;
      }
    }
  }
  // Served tickets linger as a checkmark, then leave the board.
  for (const ticket of world.tickets) {
    if (ticket.state === 'served') ticket.goneIn -= dt;
  }
  world.tickets = world.tickets.filter(
    (t) => t.state === 'waiting' || (t.state === 'served' && t.goneIn > 0),
  );

  // The grill cooks, then burns. Leftover time carries across the
  // transition, so one long step still burns a forgotten patty.
  for (const slot of world.grill) {
    if (slot.state === 'cooking') {
      slot.t += dt;
      if (slot.t >= PATTY_COOK_SECONDS) {
        slot.state = 'done';
        slot.t -= PATTY_COOK_SECONDS;
        if (slot.t >= PATTY_BURN_SECONDS) { slot.state = 'burnt'; slot.t = 0; }
      }
    } else if (slot.state === 'done') {
      slot.t += dt;
      if (slot.t >= PATTY_BURN_SECONDS) { slot.state = 'burnt'; slot.t = 0; }
    }
  }
}

// Advance to the next shift, or to the final results.
export function advance(world) {
  if (world.screen === 'shiftEnd') {
    if (world.levelIndex + 1 < LEVELS.length) startShift(world, world.levelIndex + 1);
    else world.screen = 'gameover';
    return 'level';
  }
  if (world.screen === 'failed') {
    startShift(world, world.levelIndex);
    return 'level';
  }
  return null;
}
