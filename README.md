# Sizzle Station

A one-screen burger food truck on a 7-day tour, built for make.fun's
"Make the best cooking game" bounty ($250 in USDC).

Orders come in on the board. You pick ingredients from the stations, cook
patties on the grill (take them off in time or they burn), park a cooked
patty on the holding tray to free your hands (it spoils after 10 seconds),
stack the burger on the assembly plate in order, and ring the bell to serve.
Each day the truck parks somewhere new — Riverside Park, Campus Quad,
Downtown Lunch, Night Market, Beach Boardwalk, Stadium Game Day, and the
Food Festival finale — with its own crowd, patience and tips. Money you earn
is spent between days on upgrades and on unlocking signature burgers; serve
a customer with patience to spare and they become a regular who follows the
truck and tips double. Let three customers walk out in a day and the day
fails.

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
  stack it, click the tray to park or retrieve a cooked patty, click a
  ticket (or the serve window) to serve a matching dish. Right-click puts
  down what you are holding.
- **Keyboard:** `1–7` pick from a station (the tray is `7`), `Space` serves
  the best matching dish, `Enter` starts / continues, `Esc` cancels what
  you are holding, `P` pauses, `M` mutes, `R` restarts.

## Menu

Base dishes, on the menu from day 1:

- **Classic Burger** — bun, patty, lettuce, tomato — $100
- **Cheese Burger** — bun, patty, cheese, tomato — $120
- **Double Stack** — bun, patty, patty, cheese, lettuce — $160
- **Garden Burger** — bun, lettuce, tomato, cheese — $110

Signature burgers, unlocked with earnings in the between-days shop:

- **The Tower** — bun, patty, patty, patty, cheese, lettuce, tomato — $200
- **Double Melt** — bun, patty, cheese, cheese, lettuce, tomato — $240
- **Garden Deluxe** — bun, lettuce, lettuce, tomato, tomato, cheese — $180

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
