// A tiny seeded random generator (mulberry32) so a screenshot staging can
// be reproduced exactly from its seed, and so the game itself never depends
// on Math.random in a way a staged shot cannot repeat.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one item from a list with a seeded generator.
export function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}
