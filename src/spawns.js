/**
 * Who turns up where. The people aren't placed on the map: they are made as
 * the lady walks, a few at a time, out of her sight, in the open ground
 * round her, and unmade when she has left them well behind. What kind
 * comes is picked by the district it is made in, from that district's table
 * (kind: weight), and how many there are about her is that district's
 * `DENSITY`, so the Kennel District and the Pound are crowded and the far
 * side is not. It is the same every time (`createSpawner` takes a seed).
 *
 * The bosses are the exception: they stand where the map puts them, and so
 * does the troll under the bridge.
 */

export const TABLES = Object.freeze({
  'Whisker Heights': { commune: 5, theorist: 4, scroller: 6, anarchist: 5, replyguy: 3, drunk: 1, yimby: 5, nimby: 4, folksinger: 3, dropout: 6, simulationist: 3, cyclist: 3, cat: 2, influencer: 2 },
  'The Kennel District': { pauser: 15, doomer: 6, altruist: 7, purist: 5, forecaster: 4, rationalist: 6, longtermist: 3, researcher: 3, substacker: 2, farmer: 3, replyguy: 2, gatekeeper: 1, ethicist: 5, prompter: 5, shoggoth: 5, pallbearer: 2 },
  'Purrdue University': { rationalist: 5, researcher: 5, theorist: 4, purist: 3, longtermist: 2, forecaster: 2, gatekeeper: 1, podcaster: 1, professor: 6, philosopher: 4, postdoc: 5, labrat: 4, cat: 2, prompter: 2 },
  'The Pound': { pauser: 8, doomer: 6, forecaster: 3, researcher: 3, purist: 2, rationalist: 2, prepper: 7, pallbearer: 4, deadposter: 5 },
  'Meowtown': { replyguy: 13, farmer: 8, substacker: 7, thoughtleader: 3, gatekeeper: 2, scroller: 5, podcaster: 2, drunk: 1, influencer: 6, maincharacter: 4, screenshotter: 4, newsletter: 4, bird: 1, hottakes: 3, deadposter: 2, festivalbro: 2 },
  'Zoomie Valley': { accelerationist: 9, vc: 5, podcaster: 3, thoughtleader: 4, founder: 6, recruiter: 3, cryptobro: 4, biohacker: 4, corgi: 3, festivalbro: 2 },
  'Sardine Bay': { eurocrat: 12, striker: 6, commuter: 6, raver: 10, doorman: 2, drunk: 2, dpo: 6, waiter: 4, tourist: 8, nonna: 2, cabbie: 4, cyclist: 3, lifeguard: 3, surfer: 4, festivalbro: 5 },
  'The Kibble Works': { accelerationist: 9, vc: 3, podcaster: 2, thoughtleader: 2, technician: 6, oncall: 4, wrangler: 4, guard: 4, robot: 4, keeper: 2, founder: 2 },
  'The Busy Road': { accelerationist: 4, cryptobro: 2, alien: 1 },
  'The Far Side': { accelerationist: 7, alien: 5, cryptobro: 2 },
});

/** How many of them there are about her at once, by district; `FALLBACK` where there is none. */
export const DENSITY = Object.freeze({
  'Whisker Heights': 14, 'The Kennel District': 22, 'Purrdue University': 18, 'The Pound': 22, 'Meowtown': 20,
  'Zoomie Valley': 16, 'Sardine Bay': 20, 'The Kibble Works': 16, 'The Busy Road': 3, 'The Far Side': 6,
});
export const FALLBACK = 8;

/** How near to her they are made (not in view), how far they are made, and how far from her they are unmade. */
export const RING = Object.freeze({ near: 13, far: 28, gone: 44 });

/** How often it looks to see whether more are wanted, in seconds, and how many places it tries each time. */
export const EVERY = 0.25;
export const TRIES = 10;

/** A seeded random number between 0 and 1: the same run of them for the same seed. */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One kind out of `table` ({ kind: weight }) for `r`, 0 to 1. */
export function pickKind(table, r) {
  const total = Object.values(table).reduce((a, b) => a + b, 0);
  let at = r * total;
  for (const [kind, weight] of Object.entries(table)) if ((at -= weight) < 0) return kind;
  return Object.keys(table).at(-1);
}
