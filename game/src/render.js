// Every pixel of Sizzle Station is drawn here, with canvas paths only —
// no image files, no fonts from the network. The kitchen, the order board,
// the stations, the assembly plate and the serve window are all shapes and
// text, so the game loads nothing but its own files.
//
// Visual language (after Dribbble burger-joint references — BURGY by
// VibeStyle, OOZA by BayFi Studio, Burger Boys, Nature Burger by Naokure,
// and the Vibrix cooking-game UI set): a warm retro diner. Cherry red +
// mustard + cream on dark espresso, thick dark outlines, offset solid
// shadows, chunky 900-weight display type with a sticker shadow, and
// real diner props — checker band, striped awnings, chalkboard menu,
// pendant lamps. Layout, hit areas, timings and mechanics are untouched.

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

// Chunky display type with a sticker shadow: dark copy offset down-right,
// colour copy on top. This is what makes the logo, timer and overlay
// titles read as diner signage instead of plain labels.
function display(ctx, str, x, y, size, colour, align = 'center', shadow = PALETTE.ink) {
  text(ctx, str, x + 2, y + 3, size, shadow, align, '900');
  text(ctx, str, x, y, size, colour, align, '900');
}

// A solid offset shadow for a card — cartoon depth, no blur cost.
function cardShadow(ctx, x, y, w, h, r, dy = 5) {
  ctx.fillStyle = 'rgba(43,26,18,0.28)';
  rr(ctx, x + 2, y + dy, w, h, r);
  ctx.fill();
}

// A pill button with a dark outline.
function pill(ctx, x, y, w, h, fill, stroke = PALETTE.ink, lw = 3) {
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
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
    // Gloss on the dome.
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.55, r * 0.35, r * 0.18, -0.4, 0, Math.PI * 2);
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
    // Grill marks.
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = Math.max(2, r * 0.09);
    for (const gx of [-0.45, 0, 0.45]) {
      ctx.beginPath();
      ctx.moveTo(gx * r, -r * 0.42);
      ctx.lineTo(gx * r, -r * 0.02);
      ctx.stroke();
    }
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
    // Veins.
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, 0);
    ctx.lineTo(r * 0.6, 0);
    ctx.moveTo(0, -r * 0.35);
    ctx.lineTo(0, r * 0.35);
    ctx.stroke();
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
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.4, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.4);
    ctx.lineTo(-r * 0.1, r * 0.4);
    ctx.lineTo(-r * 0.3, -r * 0.3);
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
  // Soft shadow under the plate.
  ctx.fillStyle = 'rgba(43,26,18,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4 * scale, 66 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  // Plate.
  ctx.fillStyle = '#fdfaf2';
  ctx.beginPath();
  ctx.ellipse(x, y, 62 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8cbb2';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e9e0cd';
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
      ctx.fillStyle = '#fff2cf';
      for (const sx of [-0.4, 0.05, 0.45]) {
        ctx.beginPath();
        ctx.ellipse(x + sx * r, top - 10 * scale - r * 0.5, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      top -= 26 * scale;
    } else if (item === 'patty') {
      ctx.fillStyle = INGREDIENTS.patty.dark;
      rr(ctx, x - r, top - 10 * scale, r * 2, 10 * scale, 4 * scale);
      ctx.fill();
      ctx.fillStyle = INGREDIENTS.patty.colour;
      rr(ctx, x - r * 0.9, top - 12 * scale, r * 1.8, 7 * scale, 3 * scale);
      ctx.fill();
      top -= 10 * scale;
    } else if (item === 'lettuce') {
      ctx.fillStyle = INGREDIENTS.lettuce.dark;
      ctx.beginPath();
      ctx.ellipse(x, top - 4 * scale, r * 1.05, 7 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INGREDIENTS.lettuce.colour;
      ctx.beginPath();
      ctx.ellipse(x, top - 5 * scale, r * 1.02, 6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      top -= 8 * scale;
    } else if (item === 'tomato') {
      ctx.fillStyle = INGREDIENTS.tomato.dark;
      ctx.beginPath();
      ctx.ellipse(x, top - 5 * scale, r * 0.88, 6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INGREDIENTS.tomato.colour;
      ctx.beginPath();
      ctx.ellipse(x, top - 6 * scale, r * 0.85, 5 * scale, 0, 0, Math.PI * 2);
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

// An order ticket: cream card, cherry-red header band, price chip, chunky
// patience bar. Geometry (x, y, w, h) is the click target — unchanged.
function drawTicket(ctx, ticket, x, y, w, h) {
  const dish = DISHES[ticket.dishId];
  const urgent = ticket.patience / ticket.patienceMax < 0.35;
  ctx.save();
  cardShadow(ctx, x, y, w, h, 12);
  ctx.fillStyle = PALETTE.ticket;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (urgent && ticket.state === 'waiting') {
    ctx.strokeStyle = PALETTE.red;
    ctx.lineWidth = 3;
    rr(ctx, x - 2, y - 2, w + 4, h + 4, 14);
    ctx.stroke();
  }
  // Red header band.
  ctx.fillStyle = PALETTE.red;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 12);
  ctx.lineTo(x + 3, y + 3);
  ctx.arcTo(x + 3, y + 3, x + 12, y, 9);
  ctx.lineTo(x + w - 12, y);
  ctx.arcTo(x + w - 3, y + 3, x + w - 3, y + 12, 9);
  ctx.lineTo(x + w - 3, y + 32);
  ctx.lineTo(x + 3, y + 32);
  ctx.closePath();
  ctx.fill();
  text(ctx, dish.name, x + 14, y + 17, 17, '#fff6e3', 'left', '900');
  // Price chip.
  pill(ctx, x + w - 68, y + 7, 56, 18, PALETTE.mustard, PALETTE.ink, 2);
  text(ctx, `$${dish.price}`, x + w - 40, y + 16, 13, PALETTE.ink, 'center', '800');
  if (ticket.state === 'served') {
    ctx.fillStyle = PALETTE.green;
    ctx.beginPath();
    ctx.arc(x + w - 30, y + 58, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, '✓', x + w - 30, y + 59, 20, '#fff', 'center', '900');
  }
  let ix = x + 26;
  for (const ing of dish.ingredients) {
    drawIngredient(ctx, ing, ix, y + 56, 14);
    ix += 32;
  }
  // Patience bar: chunky, outlined, green → amber → red.
  const frac = Math.max(0, ticket.patience / ticket.patienceMax);
  ctx.fillStyle = '#eadfc6';
  rr(ctx, x + 14, y + h - 18, w - 28, 10, 5);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.amber : PALETTE.red;
  if (frac > 0) {
    rr(ctx, x + 15, y + h - 17, (w - 30) * frac, 8, 4);
    ctx.fill();
  }
  if (urgent && ticket.state === 'waiting') {
    ctx.fillStyle = PALETTE.red;
    ctx.beginPath();
    ctx.arc(x + w - 18, y + h - 32, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, '!', x + w - 18, y + h - 31, 15, '#fff', 'center', '900');
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
    ctx.fillStyle = 'rgba(255,182,39,0.35)';
    rr(ctx, x - 6, y - 8, w + 12, h + 10, 14);
    ctx.fill();
  }
  // Name pill on top of the station.
  const nameW = ctx.measureText(label.station).width + 30;
  pill(ctx, x + w / 2 - nameW / 2, y + 6, nameW, 22, PALETTE.cream, PALETTE.ink, 2);
  text(ctx, label.station.toUpperCase(), x + w / 2, y + 17, 13, PALETTE.ink, 'center', '800');
  // Key chip at the bottom.
  pill(ctx, x + w / 2 - 22, y + h - 24, 44, 20, PALETTE.ink, PALETTE.ink, 2);
  text(ctx, `[${label.key}]`, x + w / 2, y + h - 14, 12, PALETTE.mustard, 'center', '800');
  if (station.id === 'bun') {
    // Wooden bun bin.
    cardShadow(ctx, x + 18, y + 46, w - 36, 58, 8, 3);
    ctx.fillStyle = '#a06a33';
    rr(ctx, x + 18, y + 46, w - 36, 58, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(43,26,18,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 75);
    ctx.lineTo(x + w - 20, y + 75);
    ctx.stroke();
    drawIngredient(ctx, 'bun', x + w / 2 - 26, y + 62, 20);
    drawIngredient(ctx, 'bun', x + w / 2 + 26, y + 62, 20);
    drawIngredient(ctx, 'bun', x + w / 2, y + 88, 20);
  } else if (station.id === 'grill') {
    // Steel griddle with a warm glow underneath.
    ctx.fillStyle = 'rgba(245,158,11,0.25)';
    rr(ctx, x + 8, y + 30, w - 16, 92, 10);
    ctx.fill();
    cardShadow(ctx, x + 12, y + 34, w - 24, 84, 8, 3);
    ctx.fillStyle = PALETTE.steel;
    rr(ctx, x + 12, y + 34, w - 24, 84, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = PALETTE.steelLight;
    ctx.lineWidth = 2;
    rr(ctx, x + 16, y + 38, w - 32, 76, 6);
    ctx.stroke();
    ctx.strokeStyle = '#2a2725';
    ctx.lineWidth = 3;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 12 + ((w - 24) / 5) * i, y + 40);
      ctx.lineTo(x + 12 + ((w - 24) / 5) * i, y + 112);
      ctx.stroke();
    }
    world.grill.forEach((slot, i) => {
      const cx = x + 58 + i * 94;
      const cy = y + 76;
      if (slot.state === 'empty') {
        ctx.strokeStyle = '#8a8580';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        const colour = slot.state === 'burnt' ? '#141210'
          : slot.state === 'done' ? '#4e2c14' : '#9a5a34';
        if (slot.state === 'cooking') {
          ctx.fillStyle = 'rgba(245,158,11,0.3)';
          ctx.beginPath();
          ctx.arc(cx, cy, 34, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        if (slot.state === 'cooking') {
          const frac = slot.t / PATTY_COOK_SECONDS;
          ctx.strokeStyle = PALETTE.mustard;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx, cy, 33, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
          ctx.stroke();
          ctx.lineCap = 'butt';
          // Steam.
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          for (let s = 0; s < 3; s++) {
            ctx.beginPath();
            ctx.arc(cx - 12 + s * 12, cy - 34 - ((Date.now() / 300 + s) % 3) * 6, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (slot.state === 'done') {
          pill(ctx, cx - 32, cy - 52, 64, 20, PALETTE.green, PALETTE.ink, 2);
          text(ctx, 'READY', cx, cy - 42, 12, '#fff', 'center', '900');
        } else {
          pill(ctx, cx - 32, cy - 52, 64, 20, PALETTE.ink, PALETTE.red, 2);
          text(ctx, 'BURNT', cx, cy - 42, 12, '#ff6b5e', 'center', '900');
          // Smoke.
          ctx.fillStyle = 'rgba(120,120,120,0.5)';
          for (let s = 0; s < 3; s++) {
            ctx.beginPath();
            ctx.arc(cx - 10 + s * 10, cy - 34 - ((Date.now() / 260 + s) % 3) * 7, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });
  } else {
    // Crates: a pile of the ingredient on a wooden crate.
    cardShadow(ctx, x + 18, y + 52, w - 36, 52, 8, 3);
    ctx.fillStyle = '#a06a33';
    rr(ctx, x + 18, y + 52, w - 36, 52, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(43,26,18,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 78);
    ctx.lineTo(x + w - 20, y + 78);
    ctx.stroke();
    drawIngredient(ctx, station.id, x + w / 2 - 24, y + 66, 19);
    drawIngredient(ctx, station.id, x + w / 2 + 24, y + 66, 19);
    drawIngredient(ctx, station.id, x + w / 2, y + 88, 19);
  }
  ctx.restore();
}

function drawPlate(ctx, world, rect, hover) {
  const { x, y, w, h } = rect;
  ctx.save();
  if (hover) {
    ctx.fillStyle = 'rgba(255,182,39,0.35)';
    rr(ctx, x - 6, y - 6, w + 12, h + 12, 14);
    ctx.fill();
  }
  const nameW = ctx.measureText('ASSEMBLY').width + 30;
  pill(ctx, x + w / 2 - nameW / 2, y + 6, nameW, 22, PALETTE.cream, PALETTE.ink, 2);
  text(ctx, 'ASSEMBLY', x + w / 2, y + 17, 13, PALETTE.ink, 'center', '800');
  const cx = x + w / 2;
  const cy = y + h - 56;
  // Round wooden board under the plate.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 78, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  const match = matchingTicket(world);
  if (world.plate.length === 0) {
    ctx.strokeStyle = '#d8c9a8';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 62, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'Build a dish here', cx, y + h - 110, 14, '#e8d9b8', 'center', '700');
  } else {
    drawStack(ctx, world.plate, cx, cy, 1);
  }
  if (match) {
    pill(ctx, x + 10, y + h - 30, w - 20, 24, PALETTE.green, PALETTE.ink, 2);
    text(ctx, `✓ ${DISHES[match.dishId].short} ready!`, cx, y + h - 18, 13, '#fff', 'center', '800');
  } else if (world.plate.length > 0) {
    const label = `${world.plate.length} item${world.plate.length > 1 ? 's' : ''} on the plate`;
    ctx.font = '700 13px system-ui, "Segoe UI", sans-serif';
    const lw = ctx.measureText(label).width + 24;
    pill(ctx, cx - lw / 2, y + h - 30, lw, 22, PALETTE.ink, PALETTE.ink, 2);
    text(ctx, label, cx, y + h - 19, 13, PALETTE.mustard, 'center', '700');
  }
  ctx.restore();
}

function drawServe(ctx, world, rect, hover) {
  const { x, y, w, h } = rect;
  const match = matchingTicket(world);
  const glow = world.servedFlash > 0 ? Math.min(1, world.servedFlash) : 0;
  ctx.save();
  if (hover || match) {
    ctx.fillStyle = `rgba(255,182,39,${match ? 0.45 : 0.22})`;
    rr(ctx, x - 6, y - 6, w + 12, h + 12, 14);
    ctx.fill();
  }
  // Red-and-white striped awning over the pass.
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 === 0 ? PALETTE.red : PALETTE.paper;
    ctx.fillRect(x + i * 12, y, 12, 16);
  }
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, 16);
  // The pass: a shelf with a service bell at the top corner.
  ctx.fillStyle = '#6b4a26';
  rr(ctx, x + 8, y + 120, w - 16, 16, 6);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Bell, brass with a highlight.
  ctx.fillStyle = '#c9a227';
  ctx.beginPath();
  ctx.arc(x + w - 26, y + 40, 13, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(x + w - 30, y + 34, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6d1f';
  ctx.fillRect(x + w - 29, y + 26, 5, 6);
  const nameW = ctx.measureText('SERVE').width + 30;
  pill(ctx, x + w / 2 - nameW / 2 - 8, y + 26, nameW, 22, PALETTE.cream, PALETTE.ink, 2);
  text(ctx, 'SERVE', x + w / 2 - 8, y + 37, 13, PALETTE.ink, 'center', '800');
  pill(ctx, x + w / 2 - 26, y + h - 24, 52, 20, PALETTE.ink, PALETTE.ink, 2);
  text(ctx, '[Space]', x + w / 2, y + h - 14, 12, PALETTE.mustard, 'center', '800');
  if (match) {
    drawStack(ctx, DISHES[match.dishId].ingredients, x + w / 2, y + 96, 0.85);
    pill(ctx, x + 12, y + 142, w - 24, 22, PALETTE.cream, PALETTE.ink, 2);
    text(ctx, DISHES[match.dishId].short, x + w / 2, y + 153, 13, PALETTE.ink, 'center', '800');
    if (glow > 0) {
      ctx.strokeStyle = `rgba(78,155,71,${glow})`;
      ctx.lineWidth = 4;
      rr(ctx, x + 2, y + 2, w - 4, h - 4, 12);
      ctx.stroke();
    }
  } else if (world.lastServedDish && world.servedFlash > 0) {
    // The dish just served stays on the pass a moment: a plate ready to go.
    drawStack(ctx, DISHES[world.lastServedDish].ingredients, x + w / 2, y + 96, 0.85);
    text(ctx, 'Served!', x + w / 2, y + 150, 16, '#fff6e3', 'center', '900');
  } else {
    ctx.fillStyle = 'rgba(43,26,18,0.55)';
    rr(ctx, x + 10, y + 56, w - 20, 48, 10);
    ctx.fill();
    text(ctx, 'Ring the bell', x + w / 2, y + 70, 14, '#fff6e3', 'center', '700');
    text(ctx, 'when a dish matches', x + w / 2, y + 92, 13, '#e8d9b8', 'center', '700');
  }
  ctx.restore();
}

function drawMenuStrip(ctx, world) {
  const level = LEVELS[world.levelIndex];
  const y = 652;
  // Dark footer board with a mustard rule on top.
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 640, 1280, 80);
  ctx.fillStyle = PALETTE.mustard;
  ctx.fillRect(0, 640, 1280, 4);
  text(ctx, 'MENU', 24, y + 12, 14, PALETTE.mustard, 'left', '900');
  let x = 100;
  for (const dishId of level.dishes) {
    const dish = DISHES[dishId];
    text(ctx, dish.short, x, y + 12, 15, '#fff6e3', 'left', '800');
    let ix = x + 84;
    for (const ing of dish.ingredients) {
      drawIngredient(ctx, ing, ix, y + 12, 10);
      ix += 24;
    }
    text(ctx, `$${dish.price}`, ix + 6, y + 12, 14, PALETTE.mustard, 'left', '800');
    x = ix + 56;
  }
  text(ctx, 'Click a station (or 1–5) to pick up · Click the plate to add · Space to serve · P to pause · M to mute', 640, y + 44, 13, '#cbb98f', 'center', '700');
  if (world.combo >= 2) {
    pill(ctx, 1080, y + 2, 176, 26, '#e8590c', PALETTE.ink, 3);
    text(ctx, `COMBO ×${world.combo}`, 1168, y + 15, 15, '#fff', 'center', '900');
  }
}

function drawKitchen(ctx, world, hover) {
  // Wall and tiles.
  const grad = ctx.createLinearGradient(0, 190, 0, 470);
  grad.addColorStop(0, PALETTE.wallTop);
  grad.addColorStop(1, PALETTE.wallBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 190, 1280, 280);
  // Red-and-cream checker band along the top of the wall.
  for (let i = 0; i < 1280 / 24; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#d94f30' : PALETTE.tile;
    ctx.fillRect(i * 24, 190, 24, 24);
  }
  ctx.fillStyle = 'rgba(43,26,18,0.15)';
  ctx.fillRect(0, 212, 1280, 2);
  ctx.strokeStyle = PALETTE.tileLine;
  ctx.lineWidth = 1;
  for (let ty = 258; ty < 470; ty += 44) {
    ctx.beginPath();
    ctx.moveTo(0, ty);
    ctx.lineTo(1280, ty);
    ctx.stroke();
  }
  for (let tx = 0; tx < 1280; tx += 64) {
    ctx.beginPath();
    ctx.moveTo(tx, 214);
    ctx.lineTo(tx, 470);
    ctx.stroke();
  }
  // Pendant lamps with a warm glow.
  for (const lx of [340, 1080]) {
    const glow = ctx.createRadialGradient(lx, 252, 4, lx, 252, 70);
    glow.addColorStop(0, 'rgba(255,214,100,0.5)');
    glow.addColorStop(1, 'rgba(255,214,100,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, 252, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx, 190);
    ctx.lineTo(lx, 232);
    ctx.stroke();
    ctx.fillStyle = PALETTE.redDark;
    ctx.beginPath();
    ctx.moveTo(lx - 22, 252);
    ctx.lineTo(lx + 22, 252);
    ctx.lineTo(lx + 12, 228);
    ctx.lineTo(lx - 12, 228);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(lx, 256, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Window with a sunny street and a striped awning.
  const sky = ctx.createLinearGradient(0, 220, 0, 350);
  sky.addColorStop(0, PALETTE.skyDeep);
  sky.addColorStop(1, '#d8eefb');
  ctx.fillStyle = sky;
  rr(ctx, 60, 220, 220, 130, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(240, 262, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,217,77,0.6)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(240 + Math.cos(a) * 28, 262 + Math.sin(a) * 28);
    ctx.lineTo(240 + Math.cos(a) * 36, 262 + Math.sin(a) * 36);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.hill;
  ctx.beginPath();
  ctx.moveTo(60, 350);
  ctx.quadraticCurveTo(140, 296, 210, 350);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5da24a';
  ctx.beginPath();
  ctx.moveTo(150, 350);
  ctx.quadraticCurveTo(220, 310, 280, 350);
  ctx.closePath();
  ctx.fill();
  // Awning stripes above the window.
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? PALETTE.red : PALETTE.paper;
    ctx.fillRect(54 + i * 15, 208, 15, 14);
  }
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 220, 220, 130);
  ctx.beginPath();
  ctx.moveTo(170, 220);
  ctx.lineTo(170, 350);
  ctx.moveTo(60, 285);
  ctx.lineTo(280, 285);
  ctx.stroke();
  // Wooden sill.
  ctx.fillStyle = '#8a5a2b';
  rr(ctx, 52, 350, 236, 10, 4);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Shelf with jars.
  ctx.fillStyle = 'rgba(43,26,18,0.25)';
  ctx.fillRect(362, 306, 260, 8);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(360, 300, 260, 10);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(360, 300, 260, 10);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = ['#e0483e', '#f7c948', '#69b455', '#4a90d9'][i];
    rr(ctx, 380 + i * 60, 262, 36, 38, 6);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.paper;
    rr(ctx, 386 + i * 60, 276, 24, 12, 3);
    ctx.fill();
  }
  // Chalkboard menu poster.
  cardShadow(ctx, 700, 215, 150, 120, 8, 4);
  ctx.fillStyle = PALETTE.board;
  rr(ctx, 700, 215, 150, 120, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.mustard;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, "TODAY'S MENU", 775, 238, 13, PALETTE.mustard, 'center', '900');
  ctx.strokeStyle = 'rgba(255,246,227,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(716, 252);
  ctx.lineTo(834, 252);
  ctx.stroke();
  text(ctx, 'Classic · Cheese', 775, 270, 13, '#fff6e3', 'center', '700');
  text(ctx, 'Double · Garden', 775, 294, 13, '#fff6e3', 'center', '700');
  text(ctx, 'Fresh · Fast · Hot', 775, 320, 13, PALETTE.mustard, 'center', '800');
  // Counter: wood top with a highlight, grooved front, brass kick strip.
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(0, 470, 1280, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(0, 470, 1280, 3);
  ctx.fillStyle = PALETTE.counterFront;
  ctx.fillRect(0, 492, 1280, 148);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 492, 1280, 6);
  ctx.strokeStyle = 'rgba(43,26,18,0.35)';
  ctx.lineWidth = 2;
  for (let gx = 96; gx < 1280; gx += 96) {
    ctx.beginPath();
    ctx.moveTo(gx, 498);
    ctx.lineTo(gx, 632);
    ctx.stroke();
  }
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, 632, 1280, 8);
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
    display(ctx, p.text, p.x, p.y, 26, p.colour, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawHeader(ctx, world) {
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 0, 1280, 62);
  ctx.fillStyle = PALETTE.mustard;
  ctx.fillRect(0, 58, 1280, 4);
  // Logo badge.
  pill(ctx, 16, 12, 252, 38, PALETTE.red, PALETTE.ink, 3);
  display(ctx, 'SIZZLE STATION', 142, 32, 21, '#fff6e3', 'center', PALETTE.redDark);
  const level = LEVELS[world.levelIndex];
  text(ctx, `${level.name}  ·  Shift ${world.levelIndex + 1}/3`, 330, 32, 16, '#fff8e7', 'left', '700');
  // Timer in a cream pill; red when the clock is nearly out.
  const urgent = world.timeLeft <= 10 && world.screen === 'playing';
  pill(ctx, 585, 10, 110, 42, urgent ? PALETTE.red : PALETTE.cream, PALETTE.ink, 3);
  display(ctx, fmtTime(world.timeLeft), 640, 32, 28, urgent ? '#fff' : PALETTE.ink, 'center', urgent ? PALETTE.redDark : '#d8c9a8');
  text(ctx, `SCORE ${world.score}`, 980, 32, 22, PALETTE.gold, 'right', '900');
  text(ctx, `Served ${world.served} · Walked out ${world.expired}`, 980, 52, 12, '#cbb98f', 'right', '700');
  // Mute button (rect is the click target in main.js — keep it).
  pill(ctx, 1196, 14, 64, 34, '#4a4238', PALETTE.mustard, 2);
  text(ctx, '♪ M', 1228, 32, 15, '#fff8e7', 'center', '800');
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(30,20,10,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  cardShadow(ctx, 340, 150, 600, 420, 20, 8);
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, 340, 150, 600, 420, 20);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  display(ctx, title, 640, 210, 40, accent || PALETTE.ink);
  let y = 280;
  for (const line of lines) {
    text(ctx, line, 640, y, 19, PALETTE.inkSoft, 'center', '700');
    y += 34;
  }
  return y;
}

// A chunky call-to-action button centred on (640, y).
function ctaButton(ctx, label, y, fill = PALETTE.mustard, colour = PALETTE.ink) {
  ctx.font = '900 20px system-ui, "Segoe UI", sans-serif';
  const w = ctx.measureText(label).width + 56;
  cardShadow(ctx, 640 - w / 2, y - 20, w, 44, 22, 4);
  pill(ctx, 640 - w / 2, y - 20, w, 44, fill, PALETTE.ink, 3);
  text(ctx, label, 640, y + 2, 20, colour, 'center', '900');
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
    ], PALETTE.red);
    // Ingredient strip under the title.
    const ids = ['bun', 'patty', 'lettuce', 'tomato', 'cheese'];
    ids.forEach((id, i) => drawIngredient(ctx, id, 640 + (i - 2) * 44, 246, 15));
    ctaButton(ctx, 'Click or press Enter to start', y + 30);
    return;
  }
  drawKitchen(ctx, world, ui.hover);
  drawHeader(ctx, world);
  // Order board.
  cardShadow(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, 12, 4);
  ctx.fillStyle = PALETTE.board;
  rr(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = PALETTE.mustard;
  ctx.fillRect(LAYOUT.board.x + 12, LAYOUT.board.y, LAYOUT.board.w - 24, 3);
  ctx.fillStyle = PALETTE.gold;
  for (const [sx, sy] of [[26, 82], [1254, 82], [26, 170], [1254, 170]]) {
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const waiting = world.tickets.filter((t) => t.state !== 'expired');
  if (waiting.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming…', 640, 126, 18, '#cbb98f', 'center', '700');
  } else {
    waiting.forEach((ticket, i) => {
      drawTicket(ctx, ticket, 28 + i * 312, 80, 296, 92);
    });
  }
  drawMenuStrip(ctx, world);
  // Carried ingredient follows the cursor, in a badge with a name pill.
  if (world.hand && ui.mouse.inside) {
    ctx.fillStyle = 'rgba(43,26,18,0.25)';
    ctx.beginPath();
    ctx.arc(ui.mouse.x, ui.mouse.y - 24, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(ui.mouse.x, ui.mouse.y - 26, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    drawIngredient(ctx, world.hand, ui.mouse.x, ui.mouse.y - 26, 20);
    const name = INGREDIENTS[world.hand].name;
    ctx.font = '800 13px system-ui, "Segoe UI", sans-serif';
    const nw = ctx.measureText(name).width + 24;
    pill(ctx, ui.mouse.x - nw / 2, ui.mouse.y - 66, nw, 22, PALETTE.ink, PALETTE.ink, 2);
    text(ctx, name, ui.mouse.x, ui.mouse.y - 55, 13, PALETTE.mustard, 'center', '800');
  }
  // Toast.
  if (world.message) {
    const w = ctx.measureText(world.message.text).width + 36;
    ctx.fillStyle = 'rgba(43,26,18,0.92)';
    rr(ctx, 640 - w / 2, 186, w, 32, 16);
    ctx.fill();
    ctx.strokeStyle = PALETTE.mustard;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, world.message.text, 640, 202, 15, '#fff8e7', 'center', '700');
  }
  if (world.screen === 'shiftEnd') {
    const stars = '★'.repeat(world.shiftStars || 0) + '☆'.repeat(3 - (world.shiftStars || 0));
    const y = overlay(ctx, `${LEVELS[world.levelIndex].name} — done!`, [
      `${stars}`,
      `Served ${world.shiftServed} · Walked out ${world.shiftExpired} · Score ${world.score}`,
      world.levelIndex + 1 < LEVELS.length ? 'Next shift: more dishes, faster orders.' : 'That was the last shift — see your final score!',
    ], PALETTE.greenDark);
    ctaButton(ctx, 'Click or press Enter to continue', y + 30, PALETTE.green, '#fff');
  } else if (world.screen === 'failed') {
    const y = overlay(ctx, 'Shift failed', [
      'Three customers walked out. The kitchen cannot run like that.',
      `Score so far: ${world.score}`,
    ], PALETTE.red);
    ctaButton(ctx, 'Click or press Enter to retry this shift', y + 30, PALETTE.red, '#fff');
  } else if (world.screen === 'gameover') {
    const y = overlay(ctx, 'Closing time!', [
      `Final score: ${world.score}   ·   Served: ${world.served}   ·   Walked out: ${world.expired}`,
      `Best combo: ×${world.bestCombo}   ·   Stars earned: ${'★'.repeat(Math.min(9, world.stars))}`,
      '',
      'Thanks for playing Sizzle Station.',
    ], PALETTE.red);
    ctaButton(ctx, 'Press R to play again', y + 30);
  } else if (world.paused) {
    overlay(ctx, 'Paused', ['Press P or click to get back to the grill.'], PALETTE.ink);
  }
}
