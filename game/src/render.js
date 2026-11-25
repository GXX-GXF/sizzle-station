// Every pixel of Sizzle Station is drawn here, with canvas paths only —
// no image files, no fonts from the network. The kitchen, the order board,
// the stations, the assembly plate and the serve window are all shapes and
// text, so the game loads nothing but its own files.
//
// Visual language (after Dribbble burger-joint references — BURGY by
// VibeStyle, OOZA by BayFi Studio, Burger Boys, Nature Burger by Naokure,
// the Vibrix cooking-game UI set — plus the flat "Build the Ideal Burger"
// ingredient language (sesame dome, wavy lettuce leaf, tomato slice with
// seed pockets, cheese with drips) and the 50s drive-in diner look (neon
// OPEN sign, chrome, checker band, pendant lamps, wall clock, framed
// posters): a warm retro diner. Cherry red + mustard + cream on dark
// espresso, thick dark outlines, offset solid shadows, chunky 900-weight
// display type with a sticker shadow, and real diner props — checker band,
// striped awnings, chalkboard menu, pendant lamps, sauce shelf, wall clock,
// string lights, wainscot. Customers wait at the counter under their
// tickets, diner-game style (their faces and a little patience bubble show
// how long they have waited). The holding tray sits beside the grill in
// the station row, with a freshness bar under each parked patty.

import { DISHES, INGREDIENTS, DAYS, LAYOUT, PALETTE, UPGRADES, SHOP, TRAY_SPOIL_SECONDS } from './config.js';
import { matchingTicket, pattyCookSeconds } from './world.js';

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

// One ingredient, drawn to look like food, not a symbol. r is the icon's
// radius; the same drawing is used at r 10 (menu strip) up to r 20
// (stations and the cursor badge), so the silhouette is bold and the
// detail is layered on top of it. For buns, `variant` matters: a bottom
// bun is a flat slice and a top bun is a sesame dome — they must never
// look the same. Callers drawing a recipe pass 'bottom' for the first bun
// and 'top' for the last; anything else (the bun bin, the title strip)
// uses the dome.
export function drawIngredient(ctx, id, x, y, r, variant) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    if (variant === 'bottom') {
      // A flat bottom bun: a wide golden slice with a toasted cut surface
      // on top, no dome — visibly different from the top bun at a glance.
      ctx.fillStyle = ing.dark;
      rr(ctx, -r * 1.02, -r * 0.08, r * 2.04, r * 0.42, r * 0.14);
      ctx.fill();
      ctx.fillStyle = ing.colour;
      rr(ctx, -r * 0.98, -r * 0.18, r * 1.96, r * 0.32, r * 0.12);
      ctx.fill();
      ctx.fillStyle = '#f7cf8a';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.16, r * 0.88, r * 0.1, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.4, -r * 0.14, r * 0.35, r * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // A sesame top bun: a golden dome with scattered seeds and gloss.
      ctx.fillStyle = ing.dark;
      rr(ctx, -r, -r * 0.15, r * 2, r * 0.45, r * 0.2);
      ctx.fill();
      ctx.fillStyle = ing.colour;
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, r * 0.95, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      // Toasted band where the dome meets the base.
      ctx.fillStyle = '#c98a3a';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.12, r * 0.92, r * 0.16, 0, 0, Math.PI);
      ctx.fill();
      // Gloss on the dome.
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.55, r * 0.32, r * 0.16, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Sesame seeds, scattered, not in a row.
      ctx.fillStyle = '#fff2cf';
      for (const [sx, sy, sa] of [[-0.45, -0.5, 0.5], [-0.05, -0.72, -0.3], [0.4, -0.55, 0.9], [0.15, -0.35, 0.2], [-0.62, -0.28, -0.6]]) {
        ctx.beginPath();
        ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.055, sa, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id === 'patty' || id === 'burnt' || id === 'spoiled') {
    // A grilled patty: a slightly irregular seared slab, diagonal grill
    // marks, char specks. A burnt patty is the same slab blackened, with
    // ash instead of grill marks; a spoiled patty is dull olive-grey with
    // mouldy spots, so the three states never read alike.
    const burnt = id === 'burnt';
    const spoiled = id === 'spoiled';
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, -r * 0.28);
    ctx.quadraticCurveTo(-r * 0.95, -r * 0.55, -r * 0.55, -r * 0.55);
    ctx.lineTo(r * 0.55, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.95, -r * 0.55, r * 0.9, -r * 0.28);
    ctx.lineTo(r * 0.88, r * 0.32);
    ctx.quadraticCurveTo(r * 0.88, r * 0.5, r * 0.55, r * 0.5);
    ctx.lineTo(-r * 0.55, r * 0.5);
    ctx.quadraticCurveTo(-r * 0.88, r * 0.5, -r * 0.88, r * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.colour;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.26);
    ctx.quadraticCurveTo(-r * 0.82, -r * 0.45, -r * 0.5, -r * 0.45);
    ctx.lineTo(r * 0.5, -r * 0.45);
    ctx.quadraticCurveTo(r * 0.82, -r * 0.45, r * 0.8, -r * 0.26);
    ctx.lineTo(r * 0.78, r * 0.28);
    ctx.quadraticCurveTo(r * 0.78, r * 0.4, r * 0.5, r * 0.4);
    ctx.lineTo(-r * 0.5, r * 0.4);
    ctx.quadraticCurveTo(-r * 0.78, r * 0.4, -r * 0.78, r * 0.28);
    ctx.closePath();
    ctx.fill();
    if (spoiled) {
      // Dull mould spots instead of grill marks.
      ctx.fillStyle = 'rgba(93,102,80,0.85)';
      for (const [sx, sy, sr] of [[-0.45, -0.18, 0.13], [0.05, 0.08, 0.16], [0.45, -0.28, 0.11], [0.28, 0.24, 0.09]]) {
        ctx.beginPath();
        ctx.arc(sx * r, sy * r, sr * r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(210,214,190,0.55)';
      for (const [sx, sy] of [[-0.2, 0.2], [0.55, 0.05]]) {
        ctx.beginPath();
        ctx.arc(sx * r, sy * r, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (burnt) {
      // Ash specks.
      ctx.fillStyle = 'rgba(180,180,180,0.6)';
      for (const [ax, ay] of [[-0.4, -0.2], [0.15, 0.1], [0.45, -0.3], [0, -0.35]]) {
        ctx.beginPath();
        ctx.arc(ax * r, ay * r, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Diagonal grill marks.
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = Math.max(2, r * 0.1);
      ctx.lineCap = 'round';
      for (const gx of [-0.45, 0, 0.45]) {
        ctx.beginPath();
        ctx.moveTo(gx * r - r * 0.22, -r * 0.42);
        ctx.lineTo(gx * r + r * 0.22, r * 0.36);
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
      // Char specks.
      ctx.fillStyle = 'rgba(78,44,20,0.55)';
      for (const [cx, cy] of [[-0.6, 0.15], [0.62, -0.1]]) {
        ctx.beginPath();
        ctx.arc(cx * r, cy * r, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id === 'lettuce') {
    // A wavy leaf: ruffled edges, a centre vein and side veins, a lighter
    // frill along the top edge.
    ctx.fillStyle = ing.dark;
    leafPath(ctx, r, 2);
    ctx.fill();
    ctx.fillStyle = ing.colour;
    leafPath(ctx, r, 0);
    ctx.fill();
    // Frill highlight along the top edge.
    ctx.fillStyle = '#8ed07e';
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, -r * 0.38, r * 0.55, r * 0.14, -0.08, 0, Math.PI * 2);
    ctx.fill();
    // Veins.
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0);
    ctx.lineTo(r * 0.7, 0);
    ctx.moveTo(-r * 0.25, 0);
    ctx.lineTo(-r * 0.45, -r * 0.3);
    ctx.moveTo(r * 0.2, 0);
    ctx.lineTo(r * 0.4, -r * 0.3);
    ctx.stroke();
  } else if (id === 'tomato') {
    // A tomato slice from above: red rim, pale flesh, seed pockets in a
    // ring, a little star core.
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
    ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
    ctx.fill();
    // Seed pockets.
    ctx.fillStyle = '#ffd9d4';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34, r * 0.09, r * 0.18, a, 0, Math.PI * 2);
      ctx.fill();
    }
    // Star core.
    ctx.fillStyle = '#ffe9e5';
    star(ctx, 0, 0, r * 0.16, r * 0.07, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.4, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    // A melted slice: a diamond with a scalloped bottom edge, two drips
    // hanging off it, and a couple of holes.
    ctx.fillStyle = ing.dark;
    cheesePath(ctx, r, 2);
    ctx.fill();
    ctx.fillStyle = ing.colour;
    cheesePath(ctx, r, 0);
    ctx.fill();
    // Drips.
    ctx.fillStyle = ing.colour;
    for (const [dx, dy, dr] of [[-0.38, 0.62, 0.13], [0.32, 0.66, 0.11]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, dr * r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Highlight stripe.
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.35);
    ctx.lineTo(-r * 0.1, r * 0.35);
    ctx.lineTo(-r * 0.3, -r * 0.35);
    ctx.closePath();
    ctx.fill();
    // Holes.
    ctx.fillStyle = ing.dark;
    for (const [hx, hy] of [[-0.25, 0.15], [0.28, 0.0]]) {
      ctx.beginPath();
      ctx.arc(hx * r, hy * r, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// The wavy outline of a lettuce leaf, centred, wider than tall. dy shifts
// the whole leaf down (for the dark underlay).
function leafPath(ctx, r, dy) {
  ctx.beginPath();
  ctx.moveTo(-r * 0.95, dy);
  ctx.quadraticCurveTo(-r * 0.6, -r * 0.55 + dy, -r * 0.2, -r * 0.42 + dy);
  ctx.quadraticCurveTo(r * 0.1, -r * 0.62 + dy, r * 0.45, -r * 0.4 + dy);
  ctx.quadraticCurveTo(r * 0.8, -r * 0.52 + dy, r * 0.95, dy);
  ctx.quadraticCurveTo(r * 0.7, r * 0.42 + dy, r * 0.35, r * 0.38 + dy);
  ctx.quadraticCurveTo(r * 0.05, r * 0.55 + dy, -r * 0.3, r * 0.38 + dy);
  ctx.quadraticCurveTo(-r * 0.65, r * 0.5 + dy, -r * 0.95, dy);
  ctx.closePath();
}

// The outline of a melted cheese slice: a diamond with a scalloped bottom
// edge. dy shifts it down (for the dark underlay).
function cheesePath(ctx, r, dy) {
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.8 + dy);
  ctx.lineTo(r * 0.85, r * 0.05 + dy);
  ctx.quadraticCurveTo(r * 0.5, r * 0.5 + dy, r * 0.2, r * 0.45 + dy);
  ctx.quadraticCurveTo(0, r * 0.58 + dy, -r * 0.25, r * 0.45 + dy);
  ctx.quadraticCurveTo(-r * 0.55, r * 0.5 + dy, -r * 0.85, r * 0.05 + dy);
  ctx.closePath();
}

// A star with n points, outer radius ro, inner radius ri.
function star(ctx, x, y, ro, ri, n) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? ro : ri;
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// A stack of ingredients on a plate, drawn bottom-up like a real burger:
// a flat toasted heel at the base, a domed sesame crown on top, a patty
// that sticks out past the bun, ruffled lettuce, a tomato slice with the
// flesh showing, and cheese that drips down over the layer below.
function drawStack(ctx, items, x, y, scale) {
  // Soft shadow under the plate.
  ctx.fillStyle = 'rgba(43,26,18,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 5 * scale, 70 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  // Plate with a rim and a highlight.
  ctx.fillStyle = '#fdfaf2';
  ctx.beginPath();
  ctx.ellipse(x, y, 64 * scale, 15 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8cbb2';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e9e0cd';
  ctx.beginPath();
  ctx.ellipse(x, y, 50 * scale, 11 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(x - 28 * scale, y - 4 * scale, 16 * scale, 4 * scale, -0.2, 0, Math.PI * 2);
  ctx.fill();
  let top = y - 10 * scale;
  const r = 34 * scale;
  items.forEach((item, i) => {
    if (item === 'bun') {
      if (i === 0) {
        // Bottom bun (heel): a flat golden slice, WIDER than the fillings
        // above it, with a toasted cut surface on top. No dome — a real
        // burger has a flat bottom. Deliberately the opposite shape of the
        // crown so the two never read as the same bun.
        ctx.fillStyle = INGREDIENTS.bun.dark;
        rr(ctx, x - r * 1.08, top - 9 * scale, r * 2.16, 9 * scale, 4 * scale);
        ctx.fill();
        ctx.fillStyle = INGREDIENTS.bun.colour;
        rr(ctx, x - r * 1.04, top - 11 * scale, r * 2.08, 7 * scale, 3 * scale);
        ctx.fill();
        // Toasted cut surface, lighter and clearly visible.
        ctx.fillStyle = '#f7cf8a';
        ctx.beginPath();
        ctx.ellipse(x, top - 10 * scale, r * 0.98, 3.5 * scale, 0, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.4, top - 10 * scale, r * 0.4, 1.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        top -= 11 * scale;
      } else {
        // Top bun (crown): a tall dome with sesame seeds and gloss — the
        // opposite of the flat heel.
        ctx.fillStyle = INGREDIENTS.bun.dark;
        rr(ctx, x - r, top - 12 * scale, r * 2, 12 * scale, 5 * scale);
        ctx.fill();
        ctx.fillStyle = INGREDIENTS.bun.colour;
        ctx.beginPath();
        ctx.arc(x, top - 10 * scale, r * 0.95, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        // Toasted band at the dome base.
        ctx.fillStyle = '#c98a3a';
        ctx.beginPath();
        ctx.ellipse(x, top - 10 * scale, r * 0.9, 3 * scale, 0, 0, Math.PI);
        ctx.fill();
        // Gloss.
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.35, top - 10 * scale - r * 0.55, r * 0.32, r * 0.16, -0.4, 0, Math.PI * 2);
        ctx.fill();
        // Sesame seeds, six of them, scattered.
        ctx.fillStyle = '#fff2cf';
        for (const [sx, sy, sa] of [[-0.5, -0.55, 0.5], [-0.08, -0.78, -0.3], [0.42, -0.6, 0.9], [0.15, -0.38, 0.2], [-0.65, -0.3, -0.6], [0.62, -0.32, 0.4]]) {
          ctx.beginPath();
          ctx.ellipse(x + sx * r, top - 10 * scale + sy * r, r * 0.085, r * 0.055, sa, 0, Math.PI * 2);
          ctx.fill();
        }
        top -= 27 * scale;
      }
    } else if (item === 'patty') {
      // A thick seared patty that sticks out past the bun: dark crust on
      // top, diagonal grill ticks, a juicy highlight on the face.
      ctx.fillStyle = INGREDIENTS.patty.dark;
      rr(ctx, x - r * 1.04, top - 11 * scale, r * 2.08, 11 * scale, 4 * scale);
      ctx.fill();
      ctx.fillStyle = INGREDIENTS.patty.colour;
      rr(ctx, x - r, top - 13 * scale, r * 2, 8 * scale, 3 * scale);
      ctx.fill();
      // Seared crust along the top edge.
      ctx.fillStyle = '#4e2c14';
      rr(ctx, x - r, top - 13 * scale, r * 2, 3 * scale, 2 * scale);
      ctx.fill();
      // Juicy highlight.
      ctx.fillStyle = 'rgba(255,190,120,0.35)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.3, top - 8 * scale, r * 0.4, 2 * scale, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = INGREDIENTS.patty.dark;
      ctx.lineWidth = Math.max(2, 2.5 * scale);
      for (const gx of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(x + gx * r - 3 * scale, top - 12 * scale);
        ctx.lineTo(x + gx * r + 3 * scale, top - 5 * scale);
        ctx.stroke();
      }
      top -= 11 * scale;
    } else if (item === 'lettuce') {
      // A ruffled leaf that sticks out past the bun on both sides.
      ctx.fillStyle = INGREDIENTS.lettuce.dark;
      ctx.beginPath();
      ctx.ellipse(x, top - 3 * scale, r * 1.15, 7 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INGREDIENTS.lettuce.colour;
      for (const lx of [-0.72, 0, 0.72]) {
        ctx.beginPath();
        ctx.ellipse(x + lx * r, top - 5 * scale, r * 0.46, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8ed07e';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.4, top - 7 * scale, r * 0.42, 3 * scale, -0.1, 0, Math.PI * 2);
      ctx.fill();
      top -= 8 * scale;
    } else if (item === 'tomato') {
      // A tomato slice: red skin with the pale flesh showing as a stripe.
      ctx.fillStyle = INGREDIENTS.tomato.dark;
      ctx.beginPath();
      ctx.ellipse(x, top - 5 * scale, r * 0.9, 6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INGREDIENTS.tomato.colour;
      ctx.beginPath();
      ctx.ellipse(x, top - 6 * scale, r * 0.87, 5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8d84';
      ctx.beginPath();
      ctx.ellipse(x, top - 6 * scale, r * 0.6, 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      // Juicy gloss.
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.35, top - 7 * scale, r * 0.25, 1.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      top -= 9 * scale;
    } else if (item === 'cheese') {
      // A melted slice, wider than the patty, with long drips draping down
      // over the layer below.
      ctx.fillStyle = INGREDIENTS.cheese.colour;
      ctx.beginPath();
      ctx.moveTo(x - r * 1.02, top - 2 * scale);
      ctx.quadraticCurveTo(x - r * 0.5, top - 9 * scale, x, top - 10 * scale);
      ctx.quadraticCurveTo(x + r * 0.5, top - 9 * scale, x + r * 1.02, top - 2 * scale);
      ctx.quadraticCurveTo(x + r * 0.5, top + 2 * scale, x, top);
      ctx.quadraticCurveTo(x - r * 0.5, top + 2 * scale, x - r * 1.02, top - 2 * scale);
      ctx.closePath();
      ctx.fill();
      // Long drips over the edge of the layer below.
      for (const [dx, dl] of [[-0.55, 16], [0.1, 12], [0.6, 17]]) {
        ctx.beginPath();
        ctx.ellipse(x + dx * r, top + (dl * scale) / 2, 5 * scale, (dl * scale) / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      top -= 10 * scale;
    }
  });
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
  // A regular (a starred customer who followed the truck) carries a gold
  // star before their dish name, and the name shifts right to make room.
  let nameX = x + 14;
  if (ticket.regular) {
    ctx.fillStyle = PALETTE.gold;
    star(ctx, x + 22, y + 17, 9, 4, 5);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    nameX = x + 38;
  }
  text(ctx, dish.name, nameX, y + 17, 17, '#fff6e3', 'left', '900');
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
  // The recipe reads bottom to top: the first bun is the flat bottom bun,
  // the last bun is the domed top bun — they must not look the same.
  dish.ingredients.forEach((ing, i) => {
    const variant = ing === 'bun' ? (i === 0 ? 'bottom' : 'top') : undefined;
    drawIngredient(ctx, ing, ix, y + 56, 14, variant);
    ix += 32;
  });
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
  // The tray and bin are not ingredients either; they have their own
  // labels and keys.
  const label = station.id === 'bin' ? { station: 'Bin', key: '6' }
    : station.id === 'tray' ? { station: 'Holding Tray', key: '7' }
    : INGREDIENTS[station.id === 'grill' ? 'patty' : station.id];
  ctx.save();
  if (hover) {
    ctx.fillStyle = 'rgba(255,182,39,0.35)';
    rr(ctx, x - 6, y - 8, w + 12, h + 10, 14);
    ctx.fill();
  }
  // Name pill on top of the station. Measure with the pill's own font so
  // the narrower station row never lets neighbouring pills collide.
  ctx.font = '800 12px system-ui, "Segoe UI", sans-serif';
  const nameW = ctx.measureText(label.station.toUpperCase()).width + 24;
  pill(ctx, x + w / 2 - nameW / 2, y + 6, nameW, 22, PALETTE.cream, PALETTE.ink, 2);
  text(ctx, label.station.toUpperCase(), x + w / 2, y + 17, 12, PALETTE.ink, 'center', '800');
  // Key chip at the bottom.
  pill(ctx, x + w / 2 - 22, y + h - 24, 44, 20, PALETTE.ink, PALETTE.ink, 2);
  text(ctx, `[${label.key}]`, x + w / 2, y + h - 14, 12, PALETTE.mustard, 'center', '800');
  if (station.id === 'bun') {
    // Wooden bun bin.
    cardShadow(ctx, x + 14, y + 46, w - 28, 58, 8, 3);
    ctx.fillStyle = '#a06a33';
    rr(ctx, x + 14, y + 46, w - 28, 58, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(43,26,18,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 75);
    ctx.lineTo(x + w - 16, y + 75);
    ctx.stroke();
    drawIngredient(ctx, 'bun', x + w / 2 - 22, y + 62, 20);
    drawIngredient(ctx, 'bun', x + w / 2 + 22, y + 62, 20);
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
      const cx = x + w / 2 + (i - (world.grill.length - 1) / 2) * 84;
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
          const frac = slot.t / pattyCookSeconds(world);
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
  } else if (station.id === 'tray') {
    // Warming tray with two wells. A parked patty's freshness bar drains
    // over TRAY_SPOIL_SECONDS; a spoiled patty turns dull and mouldy and
    // is labelled so the player knows to click it into the bin.
    ctx.fillStyle = 'rgba(245,158,11,0.22)';
    rr(ctx, x + 4, y + 32, w - 8, 90, 10);
    ctx.fill();
    cardShadow(ctx, x + 7, y + 36, w - 14, 82, 8, 3);
    ctx.fillStyle = PALETTE.steelLight;
    rr(ctx, x + 7, y + 36, w - 14, 82, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#2a2725';
    rr(ctx, x + 12, y + 42, w - 24, 70, 6);
    ctx.fill();
    // Warming heat marks under the wells.
    ctx.strokeStyle = 'rgba(245,158,11,0.55)';
    ctx.lineWidth = 2;
    for (const hx of [x + 32, x + 92]) {
      ctx.beginPath();
      ctx.moveTo(hx - 16, y + 108);
      ctx.lineTo(hx + 16, y + 108);
      ctx.stroke();
    }
    world.tray.forEach((slot, i) => {
      const cx = x + 32 + i * 60;
      const cy = y + 76;
      ctx.fillStyle = '#171412';
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a8580';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (slot.state === 'empty') {
        ctx.strokeStyle = '#8a8580';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (slot.state === 'fresh') {
        drawIngredient(ctx, 'patty', cx, cy, 20);
        const left = Math.max(0, 1 - slot.t / TRAY_SPOIL_SECONDS);
        ctx.fillStyle = '#eadfc6';
        rr(ctx, cx - 22, y + 104, 44, 7, 4);
        ctx.fill();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = left > 0.5 ? PALETTE.green : left > 0.25 ? PALETTE.amber : PALETTE.red;
        if (left > 0) {
          rr(ctx, cx - 21, y + 105, 42 * left, 5, 3);
          ctx.fill();
        }
      } else {
        drawIngredient(ctx, 'spoiled', cx, cy, 20);
        pill(ctx, cx - 28, y + 34, 56, 18, '#5d6650', PALETTE.red, 2);
        text(ctx, 'SPOILED', cx, y + 43, 10, '#fff', 'center', '900');
        ctx.fillStyle = '#eadfc6';
        rr(ctx, cx - 22, y + 104, 44, 7, 4);
        ctx.fill();
        ctx.strokeStyle = PALETTE.red;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  } else if (station.id === 'bin') {
    // Steel trash can with a red lid: click it to throw away what is held,
    // a burnt patty off the grill, or a spoiled patty off the tray.
    const cx = x + w / 2;
    cardShadow(ctx, cx - 34, y + 44, 68, 76, 8, 3);
    // Lid with a handle.
    ctx.fillStyle = PALETTE.red;
    rr(ctx, cx - 36, y + 42, 72, 14, 7);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y + 42, 10, Math.PI, 0);
    ctx.stroke();
    // Tapered body.
    ctx.fillStyle = PALETTE.steel;
    ctx.beginPath();
    ctx.moveTo(cx - 32, y + 58);
    ctx.lineTo(cx + 32, y + 58);
    ctx.lineTo(cx + 24, y + 118);
    ctx.lineTo(cx - 24, y + 118);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    // Vertical ribs.
    ctx.strokeStyle = PALETTE.steelLight;
    ctx.lineWidth = 2;
    for (const rx of [-14, 0, 14]) {
      ctx.beginPath();
      ctx.moveTo(cx + rx, y + 64);
      ctx.lineTo(cx + rx * 0.75, y + 112);
      ctx.stroke();
    }
  } else {
    // Crates: a pile of the ingredient on a wooden crate.
    cardShadow(ctx, x + 14, y + 52, w - 28, 52, 8, 3);
    ctx.fillStyle = '#a06a33';
    rr(ctx, x + 14, y + 52, w - 28, 52, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(43,26,18,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 78);
    ctx.lineTo(x + w - 16, y + 78);
    ctx.stroke();
    drawIngredient(ctx, station.id, x + w / 2 - 22, y + 66, 19);
    drawIngredient(ctx, station.id, x + w / 2 + 22, y + 66, 19);
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
    // Smaller and lower than before: the old stack rose over the SERVE
    // pill and hid it. The burger now sits on the pass shelf.
    drawStack(ctx, DISHES[match.dishId].ingredients, x + w / 2, y + 112, 0.72);
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
    drawStack(ctx, DISHES[world.lastServedDish].ingredients, x + w / 2, y + 112, 0.72);
    text(ctx, 'Served!', x + w / 2, y + 150, 16, '#fff6e3', 'center', '900');
  } else {
    ctx.fillStyle = 'rgba(43,26,18,0.55)';
    rr(ctx, x + 10, y + 56, w - 20, 48, 10);
    ctx.fill();
    text(ctx, 'Ring the bell', x + w / 2, y + 70, 14, '#fff6e3', 'center', '700');
    text(ctx, 'when it matches', x + w / 2, y + 92, 13, '#e8d9b8', 'center', '700');
  }
  ctx.restore();
}

function drawMenuStrip(ctx, world) {
  const day = DAYS[world.dayIndex];
  const y = 652;
  // Dark footer board with a mustard rule on top.
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 640, 1280, 80);
  ctx.fillStyle = PALETTE.mustard;
  ctx.fillRect(0, 640, 1280, 4);
  text(ctx, 'MENU', 24, y + 12, 14, PALETTE.mustard, 'left', '900');
  let x = 100;
  for (const dishId of day.dishes) {
    const dish = DISHES[dishId];
    text(ctx, dish.short, x, y + 12, 15, '#fff6e3', 'left', '800');
    let ix = x + 84;
    dish.ingredients.forEach((ing, i) => {
      const variant = ing === 'bun' ? (i === 0 ? 'bottom' : 'top') : undefined;
      drawIngredient(ctx, ing, ix, y + 12, 10, variant);
      ix += 24;
    });
    text(ctx, `$${dish.price}`, ix + 6, y + 12, 14, PALETTE.mustard, 'left', '800');
    x = ix + 56;
  }
  text(ctx, 'Click a station (or 1–7) · [7] parks a cooked patty · Click the plate to add · Space to serve · Right-click / Esc cancels · P pause · M mute', 640, y + 44, 13, '#cbb98f', 'center', '700');
  if (world.combo >= 2) {
    pill(ctx, 1080, y + 2, 176, 26, '#e8590c', PALETTE.ink, 3);
    text(ctx, `COMBO ×${world.combo}`, 1168, y + 15, 15, '#fff', 'center', '900');
  }
}

// Four diner looks, picked by ticket id so a customer keeps the same face
// all shift.
const CUSTOMERS = [
  { skin: '#f6c89f', hair: '#6b4423', shirt: '#d9382b', style: 'hair' },
  { skin: '#eab98c', hair: '#d9382b', shirt: '#4a90d9', style: 'cap' },
  { skin: '#c98d5f', hair: '#2b1a12', shirt: '#4e9b47', style: 'curls' },
  { skin: '#f6c89f', hair: '#b8b0a4', shirt: '#7a5fc0', style: 'glasses' },
];

// One waiting customer, standing at the counter under their ticket: head
// and shoulders above the counter top, a little patience bubble overhead,
// and a face that sours as the patience runs out.
function drawCustomer(ctx, ticket, x) {
  const look = CUSTOMERS[ticket.id % CUSTOMERS.length];
  const frac = Math.max(0, ticket.patience / ticket.patienceMax);
  const mood = frac > 0.5 ? 'happy' : frac > 0.25 ? 'ok' : 'worried';
  const headY = 389;
  const headR = 21;
  // Patience bubble above the head.
  const bx = x;
  const by = 348;
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, bx - 24, by - 7, 48, 14, 7);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#eadfc6';
  rr(ctx, bx - 21, by - 4, 42, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.amber : PALETTE.red;
  if (frac > 0) {
    rr(ctx, bx - 20, by - 3, 40 * frac, 6, 3);
    ctx.fill();
  }
  // Bubble tail, pointing down at the head.
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.moveTo(bx - 5, by + 6);
  ctx.lineTo(bx + 5, by + 6);
  ctx.lineTo(bx, by + 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 5, by + 6);
  ctx.lineTo(bx, by + 16);
  ctx.lineTo(bx + 5, by + 6);
  ctx.stroke();
  // Torso: shoulders above the counter top.
  ctx.fillStyle = look.shirt;
  ctx.beginPath();
  ctx.moveTo(x - 30, 408);
  ctx.quadraticCurveTo(x - 42, 416, x - 44, 440);
  ctx.lineTo(x - 44, 470);
  ctx.lineTo(x + 44, 470);
  ctx.lineTo(x + 44, 440);
  ctx.quadraticCurveTo(x + 42, 416, x + 30, 408);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Collar.
  ctx.fillStyle = PALETTE.paper;
  ctx.beginPath();
  ctx.moveTo(x - 10, 408);
  ctx.lineTo(x, 420);
  ctx.lineTo(x + 10, 408);
  ctx.closePath();
  ctx.fill();
  // Head.
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hair / hat / glasses.
  if (look.style === 'hair') {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(x, headY - 3, headR, Math.PI * 0.95, Math.PI * 2.05);
    ctx.closePath();
    ctx.fill();
  } else if (look.style === 'cap') {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(x, headY - 4, headR * 0.95, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + headR * 0.5, headY - 12, headR * 0.7, 5, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.paper;
    ctx.beginPath();
    ctx.arc(x, headY - 22, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (look.style === 'curls') {
    ctx.fillStyle = look.hair;
    for (const [cx, cy, cr] of [[-0.7, -0.55, 0.42], [-0.15, -0.75, 0.45], [0.45, -0.65, 0.42], [0.85, -0.3, 0.35], [-0.9, -0.2, 0.32]]) {
      ctx.beginPath();
      ctx.arc(x + cx * headR, headY + cy * headR, cr * headR, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Grey side hair + glasses.
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(x - headR * 0.75, headY - 6, headR * 0.35, 0, Math.PI * 2);
    ctx.arc(x + headR * 0.75, headY - 6, headR * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    for (const gx of [-8, 8]) {
      ctx.beginPath();
      ctx.arc(x + gx, headY - 2, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - 1.5, headY - 2);
    ctx.lineTo(x + 1.5, headY - 2);
    ctx.stroke();
  }
  // Face.
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(x - 8, headY - 2, 2.2, 0, Math.PI * 2);
  ctx.arc(x + 8, headY - 2, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'happy') {
    ctx.arc(x, headY + 6, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (mood === 'ok') {
    ctx.moveTo(x - 6, headY + 10);
    ctx.lineTo(x + 6, headY + 10);
  } else {
    ctx.arc(x, headY + 16, 6, 1.15 * Math.PI, 1.85 * Math.PI);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
  if (mood === 'worried') {
    // A sweat drop at the temple.
    ctx.fillStyle = '#7cc0e8';
    ctx.beginPath();
    ctx.moveTo(x + headR - 2, headY - 12);
    ctx.quadraticCurveTo(x + headR + 5, headY - 4, x + headR - 2, headY - 1);
    ctx.quadraticCurveTo(x + headR - 8, headY - 4, x + headR - 2, headY - 12);
    ctx.fill();
  }
  if (ticket.regular) {
    // A gold star badge at the top-right of the head: this customer is a
    // regular who followed the truck to this stop.
    ctx.fillStyle = PALETTE.gold;
    star(ctx, x + headR - 1, headY - headR + 3, 10, 4.5, 5);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
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
  // Tiled wainscot along the bottom of the wall, with a wood rail on top.
  ctx.fillStyle = PALETTE.wainscot;
  ctx.fillRect(0, 436, 1280, 34);
  ctx.strokeStyle = PALETTE.wainscotLine;
  ctx.lineWidth = 2;
  for (let wx = 32; wx < 1280; wx += 64) {
    ctx.beginPath();
    ctx.moveTo(wx, 436);
    ctx.lineTo(wx, 470);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(0, 432, 1280, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(0, 432, 1280, 1);
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
  // Neon OPEN sign hanging in the window, with a soft red glow.
  const openGlow = ctx.createRadialGradient(170, 268, 4, 170, 268, 90);
  openGlow.addColorStop(0, 'rgba(255,64,64,0.35)');
  openGlow.addColorStop(1, 'rgba(255,64,64,0)');
  ctx.fillStyle = openGlow;
  ctx.fillRect(80, 178, 180, 180);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(130, 220);
  ctx.lineTo(130, 250);
  ctx.moveTo(210, 220);
  ctx.lineTo(210, 250);
  ctx.stroke();
  ctx.fillStyle = '#2b1a12';
  rr(ctx, 105, 250, 130, 38, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.neon;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'OPEN', 170, 270, 24, '#ff6b5e', 'center', '900');
  // A little potted plant on the sill.
  ctx.fillStyle = '#b26a33';
  ctx.beginPath();
  ctx.moveTo(248, 336);
  ctx.lineTo(276, 336);
  ctx.lineTo(272, 350);
  ctx.lineTo(252, 350);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.green;
  for (const [lx, ly, la] of [[256, 322, -0.4], [264, 316, 0], [272, 322, 0.4]]) {
    ctx.beginPath();
    ctx.ellipse(lx, ly, 5, 10, la, 0, Math.PI * 2);
    ctx.fill();
  }
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
  // A lower sauce shelf with two squat jars, and a hanging planter off the
  // jar shelf. These fill the dead wall under the jars.
  ctx.fillStyle = 'rgba(43,26,18,0.25)';
  ctx.fillRect(372, 366, 90, 8);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(370, 360, 90, 8);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(370, 360, 90, 8);
  for (let i = 0; i < 2; i++) {
    const jx = 384 + i * 42;
    ctx.fillStyle = ['#e0483e', '#f7c948'][i];
    rr(ctx, jx, 334, 26, 26, 5);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(jx + 4, 344, 18, 9);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(jx + 2, 328, 22, 6);
  }
  // Hanging planter: a pot on cords with trailing leaves.
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(580, 310);
  ctx.lineTo(580, 336);
  ctx.moveTo(596, 310);
  ctx.lineTo(596, 336);
  ctx.stroke();
  ctx.fillStyle = '#b26a33';
  ctx.beginPath();
  ctx.moveTo(574, 336);
  ctx.lineTo(602, 336);
  ctx.lineTo(598, 356);
  ctx.lineTo(578, 356);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.green;
  for (const [lx, ly, la] of [[578, 368, -0.5], [588, 380, 0.1], [598, 366, 0.5], [584, 392, -0.2], [594, 398, 0.3]]) {
    ctx.beginPath();
    ctx.ellipse(lx, ly, 5, 11, la, 0, Math.PI * 2);
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
  // Framed poster: a little burger, red on cream.
  cardShadow(ctx, 880, 225, 130, 125, 8, 4);
  ctx.fillStyle = PALETTE.paper;
  rr(ctx, 880, 225, 130, 125, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.red;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'SIZZLE', 945, 250, 22, PALETTE.red, 'center', '900');
  // Mini burger on the poster.
  ctx.fillStyle = INGREDIENTS.bun.colour;
  ctx.beginPath();
  ctx.arc(945, 288, 22, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff2cf';
  for (const sx of [932, 945, 958]) {
    ctx.beginPath();
    ctx.ellipse(sx, 276, 2.5, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = INGREDIENTS.patty.colour;
  rr(ctx, 923, 288, 44, 7, 3);
  ctx.fill();
  ctx.fillStyle = INGREDIENTS.lettuce.colour;
  ctx.beginPath();
  ctx.ellipse(945, 297, 24, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INGREDIENTS.cheese.colour;
  ctx.beginPath();
  ctx.moveTo(925, 301);
  ctx.lineTo(965, 301);
  ctx.lineTo(945, 310);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = INGREDIENTS.bun.colour;
  rr(ctx, 927, 310, 36, 6, 3);
  ctx.fill();
  text(ctx, '100% BEEF', 945, 325, 13, PALETTE.ink, 'center', '800');
  text(ctx, 'FRESH DAILY', 945, 340, 11, PALETTE.inkSoft, 'center', '800');
  // Round wall clock, set to the lunch rush.
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.arc(1180, 285, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(1180 + Math.cos(a) * 30, 285 + Math.sin(a) * 30);
    ctx.lineTo(1180 + Math.cos(a) * 33, 285 + Math.sin(a) * 33);
    ctx.stroke();
  }
  // Hour hand to 11, minute hand to 12, red second hand to 4.
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(1180, 285);
  ctx.lineTo(1180 - 13, 285 - 18);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1180, 285);
  ctx.lineTo(1180, 285 - 26);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1180, 285);
  ctx.lineTo(1180 + 24, 285 + 14);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(1180, 285, 3, 0, Math.PI * 2);
  ctx.fill();
  // String lights sagging between the lamp and the chalkboard.
  const bulbColours = [PALETTE.red, PALETTE.mustard, PALETTE.green, '#4a90d9', PALETTE.red, PALETTE.mustard];
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(380, 224);
  ctx.quadraticCurveTo(535, 252, 690, 224);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const t = 0.08 + (i / 5) * 0.84;
    const bx = (1 - t) * (1 - t) * 380 + 2 * (1 - t) * t * 535 + t * t * 690;
    const by = (1 - t) * (1 - t) * 224 + 2 * (1 - t) * t * 252 + t * t * 224;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by + 6);
    ctx.stroke();
    ctx.fillStyle = bulbColours[i];
    ctx.beginPath();
    ctx.arc(bx, by + 11, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(bx - 1.5, by + 9, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // A second hanging plant, far right, to fill the corner by the clock.
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1235, 214);
  ctx.lineTo(1235, 238);
  ctx.stroke();
  ctx.fillStyle = '#b26a33';
  ctx.beginPath();
  ctx.moveTo(1223, 238);
  ctx.lineTo(1247, 238);
  ctx.lineTo(1243, 260);
  ctx.lineTo(1227, 260);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.green;
  for (const [lx, ly, la] of [[1228, 272, -0.4], [1236, 286, 0.1], [1244, 270, 0.45], [1232, 300, -0.2], [1240, 312, 0.3]]) {
    ctx.beginPath();
    ctx.ellipse(lx, ly, 5, 11, la, 0, Math.PI * 2);
    ctx.fill();
  }
  // Customers waiting at the counter, one under each ticket, while playing.
  // The last one is clamped left of the serve window so the pass never
  // cuts across their face.
  if (world.screen === 'playing') {
    const slots = world.tickets.filter((t) => t.state !== 'expired');
    slots.forEach((ticket, i) => {
      if (ticket.state === 'waiting') {
        drawCustomer(ctx, ticket, Math.min(176 + i * 312, LAYOUT.serve.x - 55));
      }
    });
  }
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
  const day = DAYS[world.dayIndex];
  text(ctx, `Day ${world.dayIndex + 1}/7 · ${day.name}`, 330, 32, 16, '#fff8e7', 'left', '700');
  // Timer in a cream pill; red when the clock is nearly out.
  const urgent = world.timeLeft <= 10 && world.screen === 'playing';
  pill(ctx, 585, 10, 110, 42, urgent ? PALETTE.red : PALETTE.cream, PALETTE.ink, 3);
  display(ctx, fmtTime(world.timeLeft), 640, 32, 28, urgent ? '#fff' : PALETTE.ink, 'center', urgent ? PALETTE.redDark : '#d8c9a8');
  text(ctx, `MONEY $${world.money}`, 810, 32, 17, PALETTE.mustard, 'right', '900');
  text(ctx, `SCORE ${world.score}`, 950, 32, 21, PALETTE.gold, 'right', '900');
  text(ctx, `★ ${world.regulars}`, 1075, 32, 17, PALETTE.gold, 'right', '900');
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

// One small icon per upgrade, drawn from the same shapes as the kitchen:
// a grill with a patty (Turbo Grill), a wall clock (Calm Customers),
// a gold coin (Big Tips).
function drawUpgradeIcon(ctx, id, x, y) {
  if (id === 'turbo') {
    // A flame: hot and fast. Orange outer teardrop, yellow inner teardrop.
    ctx.fillStyle = '#e8590c';
    ctx.beginPath();
    ctx.moveTo(x, y - 24);
    ctx.quadraticCurveTo(x + 16, y - 6, x + 12, y + 8);
    ctx.quadraticCurveTo(x + 8, y + 18, x, y + 18);
    ctx.quadraticCurveTo(x - 8, y + 18, x - 12, y + 8);
    ctx.quadraticCurveTo(x - 16, y - 6, x, y - 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.quadraticCurveTo(x + 9, y - 2, x + 7, y + 8);
    ctx.quadraticCurveTo(x + 4, y + 14, x, y + 14);
    ctx.quadraticCurveTo(x - 4, y + 14, x - 7, y + 8);
    ctx.quadraticCurveTo(x - 9, y - 2, x, y - 12);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'calm') {
    // A round clock, hands at a relaxed ten past ten.
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 8, y - 8);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y - 10);
    ctx.stroke();
    ctx.lineCap = 'butt';
  } else {
    // A gold coin with a dollar sign.
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#b97a28';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, '$', x, y + 1, 22, PALETTE.ink, 'center', '900');
  }
}

// The between-days shop: three one-off upgrades on the top row and three
// signature burgers to unlock below, the wallet up top, and a NEXT STOP
// button. Geometry comes from SHOP in config.js (the same rects main.js
// hit-tests), so the drawing and the clicks can never drift apart.
function drawShop(ctx, world) {
  ctx.fillStyle = 'rgba(30,20,10,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  const p = SHOP.panel;
  cardShadow(ctx, p.x, p.y, p.w, p.h, 20, 8);
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, p.x, p.y, p.w, p.h, 20);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  const day = DAYS[world.dayIndex];
  const next = DAYS[world.dayIndex + 1];
  const stars = '★'.repeat(world.dayStars || 0) + '☆'.repeat(3 - (world.dayStars || 0));
  display(ctx, 'SHOP', 640, 98, 36, PALETTE.red);
  text(ctx, `Day ${world.dayIndex + 1} — ${day.name}, done!  ${stars}   Served ${world.dayServed} · Walked out ${world.dayExpired} · ★ ${world.regulars} regulars`, 640, 130, 16, PALETTE.inkSoft, 'center', '700');
  if (next) {
    text(ctx, `Next stop: Day ${world.dayIndex + 2} — ${next.name}. ${next.flavour}`, 640, 154, 15, PALETTE.inkSoft, 'center', '700');
  }
  // The wallet, big and gold: this is the number the shop spends.
  pill(ctx, 640 - 110, 170, 220, 40, PALETTE.board, PALETTE.ink, 3);
  text(ctx, `MONEY $${world.money}`, 640, 191, 24, PALETTE.gold, 'center', '900');
  // Section labels above each card row.
  text(ctx, 'UPGRADES', 140, 232, 15, PALETTE.ink, 'left', '900');
  text(ctx, 'SIGNATURE BURGERS — unlock a new recipe', 140, 412, 15, PALETTE.ink, 'left', '900');
  for (const card of SHOP.cards) {
    const isSig = card.kind === 'signature';
    const item = isSig ? DISHES[card.id] : UPGRADES[card.id];
    const price = isSig ? item.cost : item.price;
    const owned = isSig ? world.signatures[card.id] : world.upgrades[card.id];
    const afford = world.money >= price;
    cardShadow(ctx, card.x, card.y, card.w, card.h, 14, 4);
    ctx.fillStyle = owned ? '#eef6e6' : PALETTE.paper;
    rr(ctx, card.x, card.y, card.w, card.h, 14);
    ctx.fill();
    ctx.strokeStyle = owned ? PALETTE.greenDark : PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    const cx = card.x + card.w / 2;
    text(ctx, item.name, cx, card.y + 26, 19, PALETTE.ink, 'center', '900');
    text(ctx, item.desc, cx, card.y + 50, 13, PALETTE.inkSoft, 'center', '700');
    if (isSig) {
      // The recipe, so the player knows what they are unlocking.
      const ings = item.ingredients;
      const gap = 24;
      const startX = cx - ((ings.length - 1) * gap) / 2;
      ings.forEach((ing, i) => {
        const variant = ing === 'bun' ? (i === 0 ? 'bottom' : 'top') : undefined;
        drawIngredient(ctx, ing, startX + i * gap, card.y + 86, 11, variant);
      });
    } else {
      drawUpgradeIcon(ctx, card.id, cx, card.y + 86);
    }
    // The buy button carries the price, so the card needs no price line.
    const b = card.buy;
    if (owned) {
      pill(ctx, b.x, b.y, b.w, b.h, PALETTE.green, PALETTE.ink, 3);
      text(ctx, 'OWNED', cx, b.y + b.h / 2 + 1, 16, '#fff', 'center', '900');
    } else if (afford) {
      pill(ctx, b.x, b.y, b.w, b.h, PALETTE.mustard, PALETTE.ink, 3);
      text(ctx, `BUY $${price}`, cx, b.y + b.h / 2 + 1, 16, PALETTE.ink, 'center', '900');
    } else {
      pill(ctx, b.x, b.y, b.w, b.h, '#cbb98f', PALETTE.ink, 3);
      text(ctx, `BUY $${price}`, cx, b.y + b.h / 2 + 1, 16, '#8a7a5e', 'center', '900');
    }
  }
  // Next stop.
  const n = SHOP.next;
  cardShadow(ctx, n.x, n.y, n.w, n.h, 22, 4);
  pill(ctx, n.x, n.y, n.w, n.h, PALETTE.green, PALETTE.ink, 3);
  text(ctx, 'NEXT STOP', 640, n.y + n.h / 2 + 1, 20, '#fff', 'center', '900');
  // A toast (bought / not enough money) floats below the panel, where it
  // covers nothing.
  if (world.message) {
    ctx.font = '700 15px system-ui, "Segoe UI", sans-serif';
    const w = ctx.measureText(world.message.text).width + 36;
    ctx.fillStyle = 'rgba(43,26,18,0.92)';
    rr(ctx, 640 - w / 2, 670, w, 28, 14);
    ctx.fill();
    ctx.strokeStyle = PALETTE.mustard;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, world.message.text, 640, 685, 15, '#fff8e7', 'center', '700');
  }
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
      'A food truck: 7 days, 7 stops. Build your regulars.',
      'Orders come in, you build them, you ring the bell.',
      'Park cooked patties on the tray — use within 10s.',
      'Earn money: unlock signatures, buy upgrades.',
      'Serve with patience left — win a regular who follows you.',
      'Build bottom to top: start with the bottom bun.',
      'Stations 1–7 · Space serves · Right-click cancels.',
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
    // A held bun is the flat bottom bun when the plate is empty, the
    // domed top bun otherwise.
    const handVariant = world.hand === 'bun'
      ? (world.plate.length === 0 ? 'bottom' : 'top') : undefined;
    drawIngredient(ctx, world.hand, ui.mouse.x, ui.mouse.y - 26, 20, handVariant);
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
    const stars = '★'.repeat(world.dayStars || 0) + '☆'.repeat(3 - (world.dayStars || 0));
    const y = overlay(ctx, `${DAYS[world.dayIndex].name} — done!`, [
      `${stars}`,
      `Served ${world.dayServed} · Walked out ${world.dayExpired} · Score ${world.score}`,
      world.dayIndex + 1 < DAYS.length ? 'Next stop coming up.' : 'That was the last stop!',
    ], PALETTE.greenDark);
    ctaButton(ctx, 'Click or press Enter to continue', y + 30, PALETTE.green, '#fff');
  } else if (world.screen === 'failed') {
    const y = overlay(ctx, 'Day failed', [
      'Three customers walked out. The truck cannot run like that.',
      `Score so far: ${world.score}`,
    ], PALETTE.red);
    ctaButton(ctx, 'Click or press Enter to retry this day', y + 30, PALETTE.red, '#fff');
  } else if (world.screen === 'gameover') {
    const y = overlay(ctx, 'Tour Complete!', [
      `Final score: ${world.score}   ·   Served: ${world.served}   ·   Walked out: ${world.expired}`,
      `Regulars won: ${world.regulars}   ·   Best combo: ×${world.bestCombo}   ·   Stars: ${world.stars}/21`,
      '',
      '7 days, 7 stops — thanks for riding with Sizzle Station.',
    ], PALETTE.red);
    ctaButton(ctx, 'Press R to play again', y + 30);
  } else if (world.screen === 'shop') {
    drawShop(ctx, world);
  } else if (world.paused) {
    overlay(ctx, 'Paused', ['Press P or click to get back to the grill.'], PALETTE.ink);
  }
}
