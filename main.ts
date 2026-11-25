// Sizzle Station's hand-in program (Node 22, standard library only).
// The grader runs this file in a fresh container with no network: it reads
// the repository at /bot, and must write the entry to /output. Outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output, so a maker can check
// the hand-in locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// What lands in /output: the whole game/ folder (plain static files), the
// screenshots/ folder (3 or 4 renders of the game), and dossier.json — the
// summary the judge reads, built by the kit's vendored library from exactly
// those files. The program runs twice and both runs must write the same
// bytes, so there is no clock, no randomness and no listing order surprise
// in here: buildDossier sorts everything itself.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the folder this file sits in; /bot in the grader.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
// The grader's writable output; a local run overrides it with the env var.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps are the scorer's own (this bounty's gate.json): only
// text_max_bytes shapes the dossier's bytes; the others refuse an entry
// the scorer would refuse, so this program fails the same way instead of
// handing in something the gate would reject.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, dossierCaps));
