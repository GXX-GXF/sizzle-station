// Every pixel of Sizzle Station is drawn here, with canvas paths only —
// no image files, no fonts from the network. The kitchen, the order board,
// the stations, the assembly plate and the serve window are all shapes and
// text, so the game loads nothing but its own files.

import { DISHES, INGREDIENTS, LEVELS, LAYOUT, PALETTE, PATTY_COOK_SECONDS } from './config.js';
import { matchingTicket } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, align = 'left', weight = '700') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px system-ui, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// One ingredient, drawn as a readable icon. r is the icon's radius.
export function drawIngredient(ctx, id, x, y, r) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = ing.dark;
    rr(ctx, -r, -r * 0.25, r * 2, r * 0.55, r * 0.25);
    ctx.fill();
    ctx.fillStyle = ing.colour;
    ctx.beginPath();
    ctx.arc(0, -r * 0.2, r * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const [sx, sy] of [[-0.4, -0.55], [0.05, -0.75], [0.45, -0.5]]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = ing.dark;
    rr(ctx, -r, -r * 0.45, r * 2, r * 0.9, r * 0.4);
    ctx.fill();
    ctx.fillStyle = ing.colour;
    rr(ctx, -r * 0.9, -r * 0.55, r * 1.8, r * 0.75, r * 0.35);
    ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.ellipse(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.45, r * 0.55, r * 0.32, a, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = ing.colour;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ing.colour;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8d84';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd9d4';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.28, Math.sin(a) * r * 0.28, r * 0.1, r * 0.2, a, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.lineTo(r, r * 0.7);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.colour;
    ctx.beginPath();
    ctx.moveTo(-r * 0.86, r * 0.55);
    ctx.lineTo(r * 0.86, r * 0.55);
    ctx.lineTo(0, -r * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [hx, hy] of [[-0.3, 0.2], [0.25, 0.05], [0, 0.35]]) {
      ctx.beginPath();
      ctx.arc(hx * r, hy * r, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// A stack of ingredients on a plate, drawn bottom-up like a real burger.
function drawStack(ctx, items, x, y, scale) {
  // Plate.
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.ellipse(x, y, 62 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8d2c2';
  ctx.beginPath();
  ctx.ellipse(x, y, 48 * scale, 10 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  let top = y - 10 * scale;
  for (const item of items) {
    const r = 34 * scale;
    if (item === 'bun') {
      ctx.fillStyle = INGREDIENTS.bun.dark;
      rr(ctx, x - r, top - 12 * scale, r * 2, 12 * scale, 5 * scale);
      ctx.fill();
      ctx.fillStyle = INGREDIENTS.bun.colour;
      ctx.beginPath();
      ctx.arc(x, top - 10 * scale, r * 0.92, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      top -= 26 * scale;
    } else if (item === 'patty') {
      ctx.fillStyle = INGREDIENTS.patty.dark;
      rr(ctx, x - r, top - 10 * scale, r * 2, 10 * scale, 4 * scale);
      ctx.fill();
      top -= 10 * scale;
    } else if (item === 'lettuce') {
      ctx.fillStyle = INGREDIENTS.lettuce.colour;
      ctx.beginPath();
      ctx.ellipse(x, top - 4 * scale, r * 1.02, 7 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      top -= 8 * scale;
    } else if (item === 'tomato') {
      ctx.fillStyle = INGREDIENTS.tomato.colour;
      ctx.beginPath();
      ctx.ellipse(x, top - 5 * scale, r * 0.85, 6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      top -= 9 * scale;
    } else if (item === 'cheese') {
      ctx.fillStyle = INGREDIENTS.cheese.colour;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.95, top);
      ctx.lineTo(x + r * 0.95, top);
      ctx.lineTo(x, top - 12 * scale);
      ctx.closePath();
      ctx.fill();
      top -= 10 * scale;
    }
  }
}

function drawTicket(ctx, ticket, x, y, w, h) {
  const dish = DISHES[ticket.dishId];
  const urgent = ticket.patience / ticket.patienceMax < 0.35;
  ctx.save();
  ctx.fillStyle = PALETTE.ticket;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ticketEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (ticket.state === 'served') {
    ctx.fillStyle = '#3f7d33';
    ctx.beginPath();
    ctx.arc(x + w - 26, y + 24, 16, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '✓', x + w - 26, y + 25, 22, '#fff', 'center');
  }
  text(ctx, dish.name, x + 14, y + 22, 19, PALETTE.ink);
  text(ctx, `$${dish.price}`, x + w - 14, y + 22, 16, PALETTE.inkSoft, 'right');
  let ix = x + 26;
  for (const ing of dish.ingredients) {
    drawIngredient(ctx, ing, ix, y + 56, 13);
    ix += 32;
  }
  // Patience bar.
  const frac = Math.max(0, ticket.patience / ticket.patienceMax);
  ctx.fillStyle = '#e8dcc2';
  rr(ctx, x + 14, y + h - 18, w - 28, 9, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.amber : PALETTE.red;
  if (frac > 0) {
    rr(ctx, x + 14, y + h - 18, (w - 28) * frac, 9, 4);
    ctx.fill();
  }
  if (urgent && ticket.state === 'waiting') {
    ctx.fillStyle = PALETTE.red;
    text(ctx, '!', x + w - 16, y + h - 32, 20, PALETTE.red, 'right');
  }
  ctx.restore();
}

function drawStation(ctx, world, station, hover) {
  const { x, y, w, h } = station;
  // The grill station's id is 'grill', but its ingredient is the patty:
  // INGREDIENTS has no 'grill' key, so resolve the label through 'patty'.
  const label = INGREDIENTS[station.id === 'grill' ? 'patty' : station.id];
  ctx.save();
  if (hover) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    rr(ctx, x - 6, y - 8, w + 12, h + 8, 12);
    ctx.fill();
  }
  text(ctx, label.station, x + w / 2, y + 16, 14, PALETTE.inkSoft, 'center');
  text(ctx, `[${label.key}]`, x + w / 2, y + h - 10, 13, PALETTE.inkSoft, 'center');
  if (station.id === 'bun') {
    ctx.fillStyle = '#8a5a2b';
    rr(ctx, x + 18, y + 46, w - 36, 58, 8);
    ctx.fill();
    drawIngredient(ctx, 'bun', x + w / 2 - 26, y + 62, 20);
    drawIngredient(ctx, 'bun', x + w / 2 + 26, y + 62, 20);
    drawIngredient(ctx, 'bun', x + w / 2, y + 88, 20);
  } else if (station.id === 'grill') {
    ctx.fillStyle = '#3a3a3a';
    rr(ctx, x + 12, y + 34, w - 24, 84, 8);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 12 + ((w - 24) / 5) * i, y + 38);
      ctx.lineTo(x + 12 + ((w - 24) / 5) * i, y + 114);
      ctx.stroke();
    }
    world.grill.forEach((slot, i) => {
      const cx = x + 58 + i * 94;
      const cy = y + 76;
      if (slot.state === 'empty') {
        ctx.strokeStyle = '#777';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const colour = slot.state === 'burnt' ? '#1c1c1c'
          : slot.state === 'done' ? '#4e2c14' : '#9a5a34';
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fill();
        if (slot.state === 'cooking') {
          const frac = slot.t / PATTY_COOK_SECONDS;
          ctx.strokeStyle = '#f7c948';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(cx, cy, 32, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
          ctx.stroke();
          // Steam.
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          for (let s = 0; s < 3; s++) {
            ctx.beginPath();
            ctx.arc(cx - 12 + s * 12, cy - 34 - ((Date.now() / 300 + s) % 3) * 6, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (slot.state === 'done') {
          ctx.fillStyle = '#f7c948';
          text(ctx, 'READY', cx, cy - 40, 12, '#f7c948', 'center');
        } else {
          text(ctx, 'BURNT', cx, cy - 40, 12, '#e0483e', 'center');
        }
      }
    });
  } else {
    // Crates: a pile of the ingredient on a wooden crate.
    ctx.fillStyle = '#8a5a2b';
    rr(ctx, x + 18, y + 52, w - 36, 52, 8);
    ctx.fill();
    drawIngredient(ctx, station.id, x + w / 2 - 24, y + 66, 18);
    drawIngredient(ctx, station.id, x + w / 2 + 24, y + 66, 18);
    drawIngredient(ctx, station.id, x + w / 2, y + 88, 18);
  }
  ctx.restore();
}

function drawPlate(ctx, world, rect, hover) {
  const { x, y, w, h } = rect;
  ctx.save();
  if (hover) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    rr(ctx, x - 6, y - 6, w + 12, h + 12, 12);
    ctx.fill();
  }
  text(ctx, 'ASSEMBLY', x + w / 2, y + 18, 14, PALETTE.inkSoft, 'center');
  const match = matchingTicket(world);
  if (world.plate.length === 0) {
    ctx.strokeStyle = '#b09a72';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 70, 62, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'Build a dish here', x + w / 2, y + h - 110, 14, PALETTE.inkSoft, 'center');
  } else {
    drawStack(ctx, world.plate, x + w / 2, y + h - 56, 1);
  }
  if (match) {
    ctx.fillStyle = '#3f7d33';
    rr(ctx, x + 10, y + h - 30, w - 20, 24, 12);
    ctx.fill();
    text(ctx, `✓ ${DISHES[match.dishId].short} ready — serve it!`, x + w / 2, y + h - 18, 13, '#fff', 'center');
  } else if (world.plate.length > 0) {
    text(ctx, `${world.plate.length} item${world.plate.length > 1 ? 's' : ''} on the plate`, x + w / 2, y + h - 18, 13, PALETTE.inkSoft, 'center');
  }
  ctx.restore();
}

function drawServe(ctx, world, rect, hover) {
  const { x, y, w, h } = rect;
  const match = matchingTicket(world);
  const glow = world.servedFlash > 0 ? Math.min(1, world.servedFlash) : 0;
  ctx.save();
  if (hover || match) {
    ctx.fillStyle = `rgba(247,201,72,${match ? 0.5 : 0.25})`;
    rr(ctx, x - 6, y - 6, w + 12, h + 12, 12);
    ctx.fill();
  }
  // The pass: a shelf with a service bell at the top corner.
  ctx.fillStyle = '#6b4a26';
  rr(ctx, x + 8, y + 120, w - 16, 16, 6);
  ctx.fill();
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.arc(x + w - 26, y + 34, 12, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x + w - 29, y + 20, 5, 6);
  text(ctx, 'SERVE', x + w / 2, y + 18, 14, PALETTE.inkSoft, 'center');
  text(ctx, '[Space]', x + w / 2, y + h - 10, 13, PALETTE.inkSoft, 'center');
  if (match) {
    drawStack(ctx, DISHES[match.dishId].ingredients, x + w / 2, y + 96, 0.85);
    text(ctx, DISHES[match.dishId].short, x + w / 2, y + 150, 14, PALETTE.ink, 'center');
    if (glow > 0) {
      ctx.strokeStyle = `rgba(63,125,51,${glow})`;
      ctx.lineWidth = 4;
      rr(ctx, x + 2, y + 2, w - 4, h - 4, 12);
      ctx.stroke();
    }
  } else if (world.lastServedDish && world.servedFlash > 0) {
    // The dish just served stays on the pass a moment: a plate ready to go.
    drawStack(ctx, DISHES[world.lastServedDish].ingredients, x + w / 2, y + 96, 0.85);
    text(ctx, 'Served!', x + w / 2, y + 150, 16, '#3f7d33', 'center');
  } else {
    text(ctx, 'Ring the bell', x + w / 2, y + 70, 14, PALETTE.inkSoft, 'center');
    text(ctx, 'when a dish matches', x + w / 2, y + 92, 13, PALETTE.inkSoft, 'center');
  }
  ctx.restore();
}

function drawMenuStrip(ctx, world) {
  const level = LEVELS[world.levelIndex];
  const y = 652;
  text(ctx, 'MENU', 24, y + 12, 14, PALETTE.inkSoft);
  let x = 100;
  for (const dishId of level.dishes) {
    const dish = DISHES[dishId];
    text(ctx, dish.short, x, y + 12, 15, PALETTE.ink);
    let ix = x + 84;
    for (const ing of dish.ingredients) {
      drawIngredient(ctx, ing, ix, y + 12, 10);
      ix += 24;
    }
    text(ctx, `$${dish.price}`, ix + 6, y + 12, 14, PALETTE.inkSoft);
    x = ix + 56;
  }
  text(ctx, 'Click a station (or 1–5) to pick up · Click the plate to add · Space to serve · P to pause · M to mute', 640, y + 44, 14, PALETTE.inkSoft, 'center');
  if (world.combo >= 2) {
    ctx.fillStyle = '#f5a623';
    rr(ctx, 1080, y + 2, 176, 26, 13);
    ctx.fill();
    text(ctx, `COMBO ×${world.combo}`, 1168, y + 15, 15, '#fff', 'center');
  }
}

function drawKitchen(ctx, world, hover) {
  // Wall and tiles.
  const grad = ctx.createLinearGradient(0, 190, 0, 470);
  grad.addColorStop(0, PALETTE.wallTop);
  grad.addColorStop(1, PALETTE.wallBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 190, 1280, 280);
  ctx.strokeStyle = PALETTE.tileLine;
  ctx.lineWidth = 1;
  for (let ty = 210; ty < 470; ty += 44) {
    ctx.beginPath();
    ctx.moveTo(0, ty);
    ctx.lineTo(1280, ty);
    ctx.stroke();
  }
  for (let tx = 0; tx < 1280; tx += 64) {
    ctx.beginPath();
    ctx.moveTo(tx, 190);
    ctx.lineTo(tx, 470);
    ctx.stroke();
  }
  // Window with a sunny street.
  ctx.fillStyle = '#bfe3f5';
  rr(ctx, 60, 220, 220, 130, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(240, 260, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#69b455';
  ctx.beginPath();
  ctx.moveTo(60, 350);
  ctx.lineTo(130, 300);
  ctx.lineTo(210, 350);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 220, 220, 130);
  ctx.beginPath();
  ctx.moveTo(170, 220);
  ctx.lineTo(170, 350);
  ctx.moveTo(60, 285);
  ctx.lineTo(280, 285);
  ctx.stroke();
  // Shelf with jars.
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(360, 300, 260, 10);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = ['#e0483e', '#f7c948', '#69b455', '#4a90d9'][i];
    rr(ctx, 380 + i * 60, 262, 36, 38, 6);
    ctx.fill();
  }
  // Menu poster.
  ctx.fillStyle = PALETTE.ticket;
  rr(ctx, 700, 215, 150, 120, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ticketEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, "TODAY'S MENU", 775, 238, 14, PALETTE.ink, 'center');
  text(ctx, 'Classic · Cheese', 775, 268, 13, PALETTE.inkSoft, 'center');
  text(ctx, 'Double · Garden', 775, 292, 13, PALETTE.inkSoft, 'center');
  text(ctx, 'Fresh · Fast · Hot', 775, 320, 13, '#c25e2e', 'center');
  // Counter.
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(0, 470, 1280, 22);
  ctx.fillStyle = PALETTE.counterFront;
  ctx.fillRect(0, 492, 1280, 148);
  ctx.fillStyle = PALETTE.counterEdge;
  ctx.fillRect(0, 492, 1280, 6);
  // Stations, plate, serve window.
  for (const station of LAYOUT.stations) {
    drawStation(ctx, world, station, hover === station.id);
  }
  drawPlate(ctx, world, LAYOUT.assembly, hover === 'plate');
  drawServe(ctx, world, LAYOUT.serve, hover === 'serve');
  // Particles.
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.t * 2);
    ctx.fillStyle = p.colour;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Floating score popups.
  for (const p of world.popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.t));
    text(ctx, p.text, p.x, p.y, 26, p.colour, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawHeader(ctx, world) {
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 0, 1280, 62);
  text(ctx, 'SIZZLE STATION', 20, 32, 26, '#ffd94d');
  const level = LEVELS[world.levelIndex];
  text(ctx, `${level.name}  ·  Shift ${world.levelIndex + 1}/3`, 330, 32, 16, '#fff8e7');
  const urgent = world.timeLeft <= 10 && world.screen === 'playing';
  text(ctx, fmtTime(world.timeLeft), 640, 32, 30, urgent ? '#ff6b5e' : '#fff', 'center');
  text(ctx, 'TIME', 640, 54, 10, '#cbb98f', 'center');
  text(ctx, `SCORE ${world.score}`, 980, 32, 22, '#fff', 'right');
  text(ctx, `Served ${world.served} · Walked out ${world.expired}`, 980, 52, 12, '#cbb98f', 'right');
  // Mute button.
  ctx.fillStyle = '#4a4238';
  rr(ctx, 1196, 14, 64, 34, 8);
  ctx.fill();
  text(ctx, '♪ M', 1228, 32, 15, '#fff8e7', 'center');
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(30,20,10,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, 340, 150, 600, 420, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ticketEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, title, 640, 210, 40, accent || PALETTE.ink, 'center');
  let y = 280;
  for (const line of lines) {
    text(ctx, line, 640, y, 19, PALETTE.inkSoft, 'center');
    y += 34;
  }
  return y;
}

export function render(ctx, world, ui) {
  ctx.clearRect(0, 0, 1280, 720);
  ctx.fillStyle = PALETTE.wallBottom;
  ctx.fillRect(0, 0, 1280, 720);
  if (world.screen === 'title') {
    drawKitchen(ctx, world, null);
    drawHeader(ctx, world);
    drawMenuStrip(ctx, world);
    const y = overlay(ctx, 'SIZZLE STATION', [
      'A one-screen burger joint. Orders come in, you build them,',
      'you ring the bell. Patties burn if you forget the grill.',
      '',
      'Click a station (or press 1–5) to pick up an ingredient.',
      'Click the plate to stack it. Space serves a matching dish.',
    ], '#c25e2e');
    text(ctx, 'Click or press Enter to start', 640, y + 30, 22, '#c25e2e', 'center');
    return;
  }
  drawKitchen(ctx, world, ui.hover);
  drawHeader(ctx, world);
  // Order board.
  ctx.fillStyle = PALETTE.board;
  rr(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, 12);
  ctx.fill();
  const waiting = world.tickets.filter((t) => t.state !== 'expired');
  if (waiting.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', 640, 126, 18, '#cbb98f', 'center');
  } else {
    waiting.forEach((ticket, i) => {
      drawTicket(ctx, ticket, 28 + i * 312, 80, 296, 92);
    });
  }
  drawMenuStrip(ctx, world);
  // Carried ingredient follows the cursor.
  if (world.hand && ui.mouse.inside) {
    drawIngredient(ctx, world.hand, ui.mouse.x, ui.mouse.y - 26, 20);
    text(ctx, INGREDIENTS[world.hand].name, ui.mouse.x, ui.mouse.y - 52, 13, PALETTE.ink, 'center');
  }
  // Toast.
  if (world.message) {
    const w = ctx.measureText(world.message.text).width + 36;
    ctx.fillStyle = 'rgba(46,42,38,0.9)';
    rr(ctx, 640 - w / 2, 186, w, 32, 16);
    ctx.fill();
    text(ctx, world.message.text, 640, 202, 15, '#fff8e7', 'center');
  }
  if (world.screen === 'shiftEnd') {
    const stars = '★'.repeat(world.shiftStars || 0) + '☆'.repeat(3 - (world.shiftStars || 0));
    const y = overlay(ctx, `${LEVELS[world.levelIndex].name} — done!`, [
      `${stars}`,
      `Served ${world.shiftServed} · Walked out ${world.shiftExpired} · Score ${world.score}`,
      world.levelIndex + 1 < LEVELS.length ? 'Next shift: more dishes, faster orders.' : 'That was the last shift — see your final score!',
    ], '#3f7d33');
    text(ctx, 'Click or press Enter to continue', 640, y + 30, 22, '#3f7d33', 'center');
  } else if (world.screen === 'failed') {
    const y = overlay(ctx, 'Shift failed', [
      'Three customers walked out. The kitchen cannot run like that.',
      `Score so far: ${world.score}`,
    ], PALETTE.red);
    text(ctx, 'Click or press Enter to retry this shift', 640, y + 30, 22, PALETTE.red, 'center');
  } else if (world.screen === 'gameover') {
    const y = overlay(ctx, 'Closing time!', [
      `Final score: ${world.score}   ·   Served: ${world.served}   ·   Walked out: ${world.expired}`,
      `Best combo: ×${world.bestCombo}   ·   Stars earned: ${'★'.repeat(Math.min(9, world.stars))}`,
      '',
      'Thanks for playing Sizzle Station.',
    ], '#c25e2e');
    text(ctx, 'Press R to play again', 640, y + 30, 22, '#c25e2e', 'center');
  } else if (world.paused) {
    overlay(ctx, 'Paused', ['Press P or click to get back to the grill.'], PALETTE.ink);
  }
}
