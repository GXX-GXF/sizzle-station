// Deterministic staging for screenshots. A URL like
//   game/index.html?shot=cover&seed=1
// builds one frozen frame of the game: the same seed always stages the same
// frame, so a screenshot can be retaken exactly. Shot mode never advances
// the clock; it is a photograph of a moment, not a game in progress.

import { createWorld, startDay } from './world.js';

// A ticket written out by hand, so a staged shot never depends on the RNG.
function stagedTicket(id, dishId, patience, patienceMax, regular = false) {
  return { id, dishId, patience, patienceMax, state: 'waiting', regular };
}

export const SHOTS = ['start', 'cover', 'rush', 'end'];

export function stageShot(name, seed = 1) {
  const world = createWorld(seed);
  if (name === 'start') {
    world.screen = 'title';
    return world;
  }
  if (name === 'cover') {
    // Campus Quad (day 2), mid-play: three tickets, one nearly out of
    // patience; a Cheese Burger half built on the plate (bun, patty,
    // cheese is a valid prefix of the cheese recipe); one patty done and
    // one cooking on the grill; a Classic just served on the pass; 0:47
    // left; two regulars won so far.
    startDay(world, 1);
    world.timeLeft = 47;
    world.score = 340;
    world.money = 340;
    world.combo = 2;
    world.bestCombo = 3;
    world.served = 4;
    world.regulars = 2;
    world.tickets = [
      stagedTicket(101, 'classic', 11, 31),
      stagedTicket(102, 'double', 20, 31),
      stagedTicket(103, 'cheese', 27, 31),
    ];
    world.plate = ['bun', 'patty', 'cheese'];
    world.grill = [
      { state: 'done', t: 0 },
      { state: 'cooking', t: 2.5 },
    ];
    world.lastServedDish = 'classic';
    world.servedFlash = 1.0;
    world.message = null;
    return world;
  }
  if (name === 'rush') {
    // Downtown Lunch (day 3), the hard minute: four tickets, one
    // critical; both grill slots cooking; a Double just started on the
    // plate.
    startDay(world, 2);
    world.timeLeft = 23;
    world.score = 820;
    world.money = 820;
    world.combo = 4;
    world.bestCombo = 5;
    world.served = 9;
    world.regulars = 3;
    world.tickets = [
      stagedTicket(201, 'double', 6, 28),
      stagedTicket(202, 'classic', 14, 28),
      stagedTicket(203, 'veggie', 19, 28),
      stagedTicket(204, 'cheese', 24, 28),
    ];
    world.plate = ['bun', 'patty'];
    world.grill = [
      { state: 'cooking', t: 1.2 },
      { state: 'cooking', t: 3.1 },
    ];
    world.message = { text: 'Downtown Lunch — four orders at once!', t: 2 };
    return world;
  }
  if (name === 'end') {
    // The Tour Complete results after seven days.
    startDay(world, 6);
    world.screen = 'gameover';
    world.score = 3240;
    world.money = 540;
    world.served = 38;
    world.expired = 5;
    world.bestCombo = 7;
    world.stars = 17;
    world.regulars = 9;
    world.timeLeft = 0;
    return world;
  }
  // Tour verification shots (not in the submission list): the shop with
  // signature cards, a starred regular at the counter, and the finale.
  if (name === 'tourshop') {
    // After day 1: wallet $340, Turbo owned, signatures still locked.
    startDay(world, 0);
    world.screen = 'shop';
    world.money = 340;
    world.score = 340;
    world.served = 5;
    world.dayServed = 5;
    world.dayExpired = 0;
    world.dayStars = 3;
    world.regulars = 2;
    world.upgrades = { turbo: true, calm: false, tips: false };
    world.signatures = { tower: false, melt: false, garden: false };
    world.message = null;
    return world;
  }
  if (name === 'tourshop2') {
    // After day 5: wallet $900, Tower unlocked and on the menu, two
    // upgrades owned, Melt affordable, Garden not yet.
    startDay(world, 4);
    world.screen = 'shop';
    world.money = 900;
    world.score = 2680;
    world.served = 27;
    world.dayServed = 6;
    world.dayExpired = 1;
    world.dayStars = 2;
    world.regulars = 7;
    world.upgrades = { turbo: true, calm: true, tips: false };
    world.signatures = { tower: true, melt: false, garden: false };
    world.message = null;
    return world;
  }
  if (name === 'regular') {
    // Stadium Game Day (day 6): a starred regular ordering a Tower, with
    // the Tower half built on the plate.
    startDay(world, 5);
    world.timeLeft = 52;
    world.score = 1980;
    world.money = 620;
    world.combo = 3;
    world.bestCombo = 6;
    world.served = 22;
    world.regulars = 8;
    world.signatures = { tower: true, melt: false, garden: false };
    world.tickets = [
      stagedTicket(301, 'tower', 25, 28, true),
      stagedTicket(302, 'classic', 15, 28),
      stagedTicket(303, 'cheese', 22, 28),
    ];
    world.plate = ['bun', 'patty', 'patty'];
    world.grill = [
      { state: 'done', t: 0 },
      { state: 'cooking', t: 1.5 },
    ];
    world.message = null;
    return world;
  }
  world.screen = 'title';
  return world;
}
