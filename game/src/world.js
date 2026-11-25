// Sizzle Station's state: tickets, the grill, the assembly plate, the
// shift clock and the score. No drawing here and no input here; this file
// only decides what happens when the player does something, and what time
// does when the player does nothing.

import {
  DISHES, LEVELS, INGREDIENTS, PATTY_COOK_SECONDS, PATTY_BURN_SECONDS,
  GRILL_SLOTS, MAX_EXPIRED_PER_SHIFT, SERVE_BONUS_MAX, COMBO_STEP,
  COMBO_CAP, WRONG_SERVE_PENALTY, TURBO_COOK_SECONDS, CALM_PATIENCE_MULT,
  BIG_TIP_MULT, UPGRADES,
} from './config.js';
import { mulberry32, pick } from './random.js';

// The grill's cook time and the customers' patience depend on the upgrades
// the player owns. The burn window (PATTY_BURN_SECONDS) never changes.
export function pattyCookSeconds(world) {
  return world.upgrades.turbo ? TURBO_COOK_SECONDS : PATTY_COOK_SECONDS;
}

function patienceSeconds(world) {
  const base = levelOf(world).patience;
  return Math.round(base * (world.upgrades.calm ? CALM_PATIENCE_MULT : 1));
}

let nextTicketId = 1;

export function createWorld(seed = 1) {
  return {
    seed,
    rand: mulberry32(seed),
    screen: 'title', // title | playing | shiftEnd | shop | gameover | failed
    levelIndex: 0,
    timeLeft: LEVELS[0].duration,
    spawnIn: 1.2,
    score: 0,
    money: 0, // spendable wallet: grows with every serve, spent in the shop.
    // Score is the final metric and is never reduced by spending.
    upgrades: { turbo: false, calm: false, tips: false },
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
  world.expired = 0; // the HUD's walked-out count is per shift: a retry (or a
  // new shift) must not start showing the previous shift's walk-outs
  world.screen = 'playing';
  world.message = { text: `${level.name} — serve them all!`, t: 2.2 };
  spawnTicket(world);
}

export function startGame(world) {
  world.score = 0;
  world.money = 0;
  world.upgrades = { turbo: false, calm: false, tips: false };
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
  const patience = patienceSeconds(world);
  world.tickets.push({
    id: nextTicketId++,
    dishId,
    patience,
    patienceMax: patience,
    state: 'waiting',
  });
}

// Is the plate a prefix of this recipe, bottom to top?
function isPrefix(plate, recipe) {
  if (plate.length > recipe.length) return false;
  for (let i = 0; i < plate.length; i++) if (plate[i] !== recipe[i]) return false;
  return true;
}

// Does the plate hold exactly the dish's recipe, in order, bottom to top?
export function plateMatchesDish(plate, dishId) {
  const want = DISHES[dishId].ingredients;
  if (plate.length !== want.length) return false;
  for (let i = 0; i < want.length; i++) if (plate[i] !== want[i]) return false;
  return true;
}

// What can go on the plate next, given what is already on it? The plate
// plus the ingredient must stay a prefix of some waiting ticket's recipe.
function nextIngredients(world) {
  const out = [];
  for (const ticket of world.tickets) {
    if (ticket.state !== 'waiting') continue;
    const recipe = DISHES[ticket.dishId].ingredients;
    if (isPrefix(world.plate, recipe) && world.plate.length < recipe.length) {
      const next = recipe[world.plate.length];
      if (!out.includes(next)) out.push(next);
    }
  }
  return out;
}

function isNextIngredient(world, ingredient) {
  return nextIngredients(world).includes(ingredient);
}

// A short hint naming what the plate needs next, for a rejected pick/place.
function nextHint(world) {
  const next = nextIngredients(world);
  if (next.length === 0) return 'No open order matches this plate';
  const names = next.map((id) => INGREDIENTS[id].name);
  if (names.length === 1) return `Next: ${names[0]}`;
  return `Next: ${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

// The waiting ticket whose recipe the plate matches exactly, in order,
// lowest patience first.
export function matchingTicket(world) {
  const waiting = world.tickets
    .filter((t) => t.state === 'waiting' && plateMatchesDish(world.plate, t.dishId))
    .sort((a, b) => a.patience - b.patience);
  return waiting[0] || null;
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
  // The bin is not a pick-up: it takes what is held (or a burnt patty off
  // the grill), so it must work with a full hand too.
  if (stationId === 'bin') return discardInBin(world);
  if (world.hand) { toast(world, 'Hands full — place it on the plate first'); return 'wrong'; }
  if (stationId === 'grill') return takeFromGrill(world);
  if (!isNextIngredient(world, stationId)) {
    toast(world, `${INGREDIENTS[stationId].name} doesn't go on yet. ${nextHint(world)}`);
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
    // A burnt patty comes off the grill into the hand, so the player can
    // bin it (or cancel it). It can never go on a plate.
    burnt.state = 'empty';
    burnt.t = 0;
    world.hand = 'burnt';
    toast(world, 'That patty is burnt — bin it!');
    return 'pick';
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
  if (item === 'burnt') {
    toast(world, 'That patty is burnt — bin it!');
    return 'wrong';
  }
  // Only the next ingredient in the recipe can go on, in order.
  if (!isNextIngredient(world, item)) {
    toast(world, `${INGREDIENTS[item].name} doesn't go on yet. ${nextHint(world)}`);
    return 'wrong';
  }
  world.plate.push(item);
  world.hand = null;
  burst(world, 1005, 470, INGREDIENTS[item].colour, 6);
  return 'place';
}

// Drop whatever is held (right-click / Escape). A station ingredient is
// just put down; a patty is lost, so a cooked patty should go to the bin.
export function cancelHeld(world) {
  if (!world.hand) return null;
  const item = world.hand;
  world.hand = null;
  toast(world, item === 'burnt' ? 'Burnt patty binned' : `${INGREDIENTS[item].name} put down`);
  return 'place';
}

// The bin: throw away what is held, or, with an empty hand, a burnt patty
// sitting on the grill, freeing its slot.
export function discardInBin(world) {
  if (world.screen !== 'playing') return null;
  if (world.hand) {
    const name = INGREDIENTS[world.hand].name;
    world.hand = null;
    toast(world, `${name} binned`);
    return 'place';
  }
  const burnt = world.grill.find((s) => s.state === 'burnt');
  if (burnt) {
    burnt.state = 'empty';
    burnt.t = 0;
    toast(world, 'Burnt patty binned — the grill is free');
    return 'place';
  }
  toast(world, 'Nothing to bin');
  return 'wrong';
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
  const tipMult = world.upgrades.tips ? BIG_TIP_MULT : 1;
  const tip = Math.round((ticket.patience / ticket.patienceMax) * SERVE_BONUS_MAX * tipMult);
  const comboBonus = Math.min(world.combo * COMBO_STEP, COMBO_CAP);
  const gained = dish.price + tip + comboBonus;
  world.score += gained;
  world.money += gained; // the wallet grows with the score, one for one
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
  // A finished shift opens the shop when another shift is still to come
  // (shifts 1 and 2); the last shift goes to the shift-end card as before.
  world.screen = failed ? 'failed'
    : (world.levelIndex + 1 < LEVELS.length ? 'shop' : 'shiftEnd');
  world.event = failed ? 'failed' : 'levelEnd';
  if (!failed) {
    const stars = world.shiftExpired === 0 ? 3 : world.shiftExpired === 1 ? 2 : 1;
    world.stars += stars;
    world.shiftStars = stars;
  }
}

// Buy one upgrade in the shop. Money pays, score never does. One purchase
// per upgrade; a second tap, or a tap without the money, is refused.
export function buyUpgrade(world, id) {
  if (world.screen !== 'shop') return null;
  const up = UPGRADES[id];
  if (!up) return null;
  if (world.upgrades[id]) {
    toast(world, `${up.name} is already yours`);
    return 'wrong';
  }
  if (world.money < up.price) {
    toast(world, `Not enough money — ${up.name} costs $${up.price}`);
    return 'wrong';
  }
  world.money -= up.price;
  world.upgrades[id] = true;
  toast(world, `${up.name} bought!`);
  return 'place';
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
  // transition, so one long step still burns a forgotten patty. The cook
  // time is the upgrade-aware one; the burn window never changes.
  const cookSeconds = pattyCookSeconds(world);
  for (const slot of world.grill) {
    if (slot.state === 'cooking') {
      slot.t += dt;
      if (slot.t >= cookSeconds) {
        slot.state = 'done';
        slot.t -= cookSeconds;
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
  if (world.screen === 'shop') {
    startShift(world, world.levelIndex + 1);
    return 'level';
  }
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
