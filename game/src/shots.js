// Deterministic staging for screenshots. A URL like
//   game/index.html?shot=cover&seed=1
// builds one frozen frame of the game: the same seed always stages the same
// frame, so a screenshot can be retaken exactly. Shot mode never advances
// the clock; it is a photograph of a moment, not a game in progress.

import { createWorld, startShift } from './world.js';

// A ticket written out by hand, so a staged shot never depends on the RNG.
function stagedTicket(id, dishId, patience, patienceMax) {
  return { id, dishId, patience, patienceMax, state: 'waiting' };
}

export const SHOTS = ['start', 'cover', 'rush', 'end'];

export function stageShot(name, seed = 1) {
  const world = createWorld(seed);
  if (name === 'start') {
    world.screen = 'title';
    return world;
  }
  if (name === 'cover') {
    // Dinner Rush, mid-play: three tickets, one nearly out of patience;
    // a Cheese Burger half built on the plate (bun, patty, cheese is a
    // valid prefix of the cheese recipe); one patty done and one
    // cooking on the grill; a Classic just served on the pass; 0:47 left.
    startShift(world, 1);
    world.timeLeft = 47;
    world.score = 340;
    world.combo = 2;
    world.bestCombo = 3;
    world.served = 4;
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
    // Closing Rush, the hard minute: four tickets, one critical; both
    // grill slots cooking; a Double just started on the plate.
    startShift(world, 2);
    world.timeLeft = 23;
    world.score = 820;
    world.combo = 4;
    world.bestCombo = 5;
    world.served = 9;
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
    world.message = { text: 'Closing Rush — four orders at once!', t: 2 };
    return world;
  }
  if (name === 'end') {
    // The final results after three shifts.
    startShift(world, 2);
    world.screen = 'gameover';
    world.score = 1240;
    world.served = 14;
    world.expired = 2;
    world.bestCombo = 5;
    world.stars = 7;
    world.timeLeft = 0;
    return world;
  }
  world.screen = 'title';
  return world;
}
