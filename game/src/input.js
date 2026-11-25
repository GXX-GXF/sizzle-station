// Mouse and keyboard for Sizzle Station. This file only translates raw
// events into game actions; main.js decides what each action does.
// Coordinates are converted to the game's 1280x720 view, whatever size the
// canvas is drawn at on the page.

import { VIEW, INGREDIENTS } from './config.js';

const STATION_KEYS = { 1: 'bun', 2: 'grill', 3: 'lettuce', 4: 'tomato', 5: 'cheese' };

export function attachInput(canvas, actions) {
  let mouse = { x: VIEW.width / 2, y: VIEW.height / 2, inside: false };

  function toView(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const p = toView(event);
    mouse = { x: p.x, y: p.y, inside: true };
    actions.onHover(p.x, p.y);
  });
  canvas.addEventListener('pointerleave', () => {
    mouse.inside = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const p = toView(event);
    actions.onTap(p.x, p.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === ' ') {
      event.preventDefault();
      actions.onServeKey();
      return;
    }
    if (key === 'enter') { actions.onConfirm(); return; }
    if (key === 'p' || key === 'escape') { actions.onPause(); return; }
    if (key === 'm') { actions.onMute(); return; }
    if (key === 'r') { actions.onRestart(); return; }
    if (STATION_KEYS[key]) {
      actions.onStationKey(STATION_KEYS[key]);
      return;
    }
    void INGREDIENTS; // stations are the whole keyboard map
  });

  return {
    mouse() { return mouse; },
  };
}
