# Sizzle Station

A one-screen burger joint, built for make.fun's "Make the best cooking game" bounty ($250 in USDC).

Orders come in on the board. You pick ingredients from the stations, cook
patties on the grill (take them off in time or they burn), stack the burger
on the assembly plate, and ring the bell to serve. Three shifts — Lunch
Rush, Dinner Rush, Closing Rush — with a growing menu and faster orders.
Serve with patience to spare for a tip; let three customers walk out and
the shift fails.

## Play it

Any static server works — the game is plain files under `game/` and loads
nothing from the network:

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` through any static host.

## Controls

- **Mouse:** click a station to pick up an ingredient, click the plate to
  stack it, click a ticket (or the serve window) to serve a matching dish.
- **Keyboard:** `1–5` pick from a station, `Space` serves the best matching
  dish, `Enter` starts / continues, `P` pauses, `M` mutes, `R` restarts.

## Menu

- **Classic Burger** — bun, patty, lettuce, tomato — $100
- **Cheese Burger** — bun, patty, cheese, tomato — $120
- **Double Stack** — bun, patty, patty, cheese, lettuce — $160
- **Garden Burger** — bun, lettuce, tomato, cheese — $110

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `game/` — the game itself: `index.html` plus `src/` (config, state,
  input, rendering, sound, screenshot staging), all original, all drawn
  with canvas paths, all sound synthesised with WebAudio.
- `screenshots/` — four real renders of the game (cover first).
- `vendor/makefun-game.ts` — make.fun's dossier library, unchanged.
- `serve.ts` — a tiny local server for play-testing.

## Screenshots

The four staged shots are listed in `shots.json` and staged by
`game/src/shots.js` from `?shot=<name>&seed=1`: cover (mid-play, every
required element in frame), start, rush, and the final results.

---

Built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.
