// Sizzle Station's entry point: boots the canvas, wires input to the
// world, runs the loop, and plays the sounds the world's events ask for.
// With ?shot=<name> in the URL it renders one frozen staged frame instead
// of playing, for screenshots.

import { VIEW, LAYOUT } from './config.js';
import { createWorld, startGame, update, advance, pickFromStation, placeOnPlate, serveTicket, serveBest, cancelHeld, discardInBin } from './world.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { sfx, unlockAudio, toggleMute, startSizzle, stopSizzle } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') || '1', 10) || 1;

const world = shotName ? stageShot(shotName, seed) : createWorld(seed);
world.paused = false;

const ui = { hover: null, mouse: { x: VIEW.width / 2, y: VIEW.height / 2, inside: false } };

// A small handle for automated play tests (and nothing else).
window.__sizzle = {
  world,
  version: 1,
  update,
  actions: { startGame, advance, pickFromStation, placeOnPlate, serveBest, serveTicket, cancelHeld, discardInBin },
};

function playEvent(event) {
  if (!event) return;
  if (event === 'pick') sfx.pick();
  else if (event === 'place') sfx.place();
  else if (event === 'grill') sfx.grill();
  else if (event === 'serve') sfx.serve();
  else if (event === 'wrong') sfx.wrong();
  else if (event === 'level') sfx.level();
  else if (event === 'expire') sfx.expire();
}

function grillCooking() {
  return world.grill.some((s) => s.state === 'cooking');
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function zoneAt(x, y) {
  // Header buttons first.
  if (inRect(x, y, { x: 1196, y: 14, w: 64, h: 34 })) return 'mute';
  // Order board tickets.
  if (y >= LAYOUT.board.y && y <= LAYOUT.board.y + LAYOUT.board.h) {
    const waiting = world.tickets.filter((t) => t.state !== 'expired');
    for (let i = 0; i < waiting.length; i++) {
      if (x >= 28 + i * 312 && x <= 28 + i * 312 + 296) return { ticket: waiting[i].id };
    }
    return null;
  }
  for (const station of LAYOUT.stations) {
    if (inRect(x, y, station)) return { station: station.id };
  }
  if (inRect(x, y, LAYOUT.assembly)) return 'plate';
  if (inRect(x, y, LAYOUT.serve)) return 'serve';
  return null;
}

function onTap(x, y) {
  unlockAudio();
  if (shotName) return; // staged frames do not play
  if (world.screen === 'title') { startGame(world); sfx.level(); return; }
  if (world.screen === 'shiftEnd' || world.screen === 'failed') {
    playEvent(advance(world));
    return;
  }
  if (world.screen === 'gameover') { startGame(world); sfx.level(); return; }
  if (world.paused) { world.paused = false; return; }
  const zone = zoneAt(x, y);
  if (!zone) return;
  if (zone === 'mute') { toggleMute(); return; }
  if (zone === 'plate') { playEvent(placeOnPlate(world)); return; }
  if (zone === 'serve') { playEvent(serveBest(world)); return; }
  if (zone.station) { playEvent(pickFromStation(world, zone.station)); return; }
  if (zone.ticket) { playEvent(serveTicket(world, zone.ticket)); }
}

const input = attachInput(canvas, {
  onHover(x, y) {
    ui.mouse = { x, y, inside: true };
    const zone = zoneAt(x, y);
    ui.hover = zone && typeof zone === 'object' ? (zone.station || null) : zone;
  },
  onTap,
  onServeKey() {
    if (shotName || world.screen !== 'playing' || world.paused) return;
    unlockAudio();
    playEvent(serveBest(world));
  },
  onConfirm() {
    if (shotName) return;
    unlockAudio();
    if (world.screen === 'title') { startGame(world); sfx.level(); }
    else if (world.screen === 'shiftEnd' || world.screen === 'failed') playEvent(advance(world));
    else if (world.screen === 'gameover') { startGame(world); sfx.level(); }
  },
  onPause() {
    if (world.screen === 'playing') world.paused = !world.paused;
  },
  onCancel() {
    playEvent(cancelHeld(world));
  },
  onEscape() {
    // Escape backs out: first drop what is held, and only then pause.
    if (world.hand) { playEvent(cancelHeld(world)); return; }
    if (world.screen === 'playing') world.paused = !world.paused;
  },
  onMute() { toggleMute(); },
  onRestart() {
    if (shotName) return;
    startGame(world);
    sfx.level();
  },
  onStationKey(stationId) {
    if (shotName || world.screen !== 'playing' || world.paused) return;
    unlockAudio();
    playEvent(pickFromStation(world, stationId));
  },
});

function frame(now) {
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000 || 0);
  frame.last = now;
  if (!world.paused) update(world, dt);
  if (world.event) {
    playEvent(world.event === 'levelEnd' ? 'level' : world.event);
    world.event = null;
  }
  if (grillCooking()) startSizzle();
  else stopSizzle();
  ui.mouse = input.mouse();
  render(ctx, world, ui);
  requestAnimationFrame(frame);
}

if (shotName) {
  // One frozen frame: the staged scene, exactly as built.
  render(ctx, world, ui);
  document.title = `Sizzle Station — shot ${shotName}`;
} else {
  render(ctx, world, ui);
  requestAnimationFrame(frame);
}
