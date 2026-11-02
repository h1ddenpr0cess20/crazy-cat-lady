import { seeded } from '../spawns.js';

/**
 * Who looks like what. The people are the library's (`madness-engine/characters/*`), and every one of them comes in one
 * set of colours, so a crowd of them is a crowd of the same few faces. Each is dressed here in `variant` (see the
 * engine's `person`): a complexion from the presets below (skin, hair and eyes that go together), and, unless they wear
 * a uniform or a costume, clothes in colours drawn from a palette, the same every time for the same person.
 *
 * Nothing here changes a model: the same person is baked in other colours.
 */

/** Skin, hair and eyes that go together, from the palest to the deepest. */
export const COMPLEXIONS = Object.freeze([
  { name: 'fair, blond, blue', skin: '#f6dcc8', hair: '#e0c070', eyes: '#5a86b0' },
  { name: 'fair, ginger, green', skin: '#f0d0c0', hair: '#b0502a', eyes: '#3a6a3a' },
  { name: 'fair, auburn, grey', skin: '#f0d0c0', hair: '#8a3a1e', eyes: '#6a7a8a' },
  { name: 'light, chestnut, hazel', skin: '#e9b48f', hair: '#7a5230', eyes: '#6a6a2a' },
  { name: 'light, brown, blue', skin: '#e9b48f', hair: '#3a2414', eyes: '#3a5a8a' },
  { name: 'light, dark blond, green', skin: '#e9b48f', hair: '#a07840', eyes: '#3a6a3a' },
  { name: 'light tan, black, brown', skin: '#dcb48a', hair: '#0e0a08', eyes: '#2a1a10' },
  { name: 'olive, black, brown', skin: '#d19a6a', hair: '#0e0a08', eyes: '#4a2e18' },
  { name: 'olive, dark brown, hazel', skin: '#d19a6a', hair: '#241810', eyes: '#6a4a22' },
  { name: 'tan, dark brown, hazel', skin: '#c68642', hair: '#241810', eyes: '#6a4a22' },
  { name: 'brown, black, brown', skin: '#a9703f', hair: '#0e0a08', eyes: '#4a2e18' },
  { name: 'brown, brown, green', skin: '#a9703f', hair: '#3a2414', eyes: '#3a6a3a' },
  { name: 'deep brown, black, dark', skin: '#8d5524', hair: '#0e0a08', eyes: '#2a1a10' },
  { name: 'deeper brown, black, dark', skin: '#6f4120', hair: '#0e0a08', eyes: '#2a1a10' },
  { name: 'dark, black, dark', skin: '#533018', hair: '#0e0a08', eyes: '#2a1a10' },
  { name: 'deepest, black, dark brown', skin: '#3b2314', hair: '#0e0a08', eyes: '#3a2a1a' },
]);

/** What they might wear on top, on the legs, as a suit, and on their feet. */
export const TOPS = ['#b4121c', '#d1481f', '#e0a020', '#3a7a3a', '#1f6a7a', '#2a4a9a', '#5a3a8a', '#c24a8a', '#e8e2d0', '#7a1a2a', '#4a4a52', '#2a2a30', '#6a8a3a', '#d8d0b8', '#3a8ac8', '#f4f0e6'];
export const BOTTOMS = ['#2a3a5a', '#3a4a6a', '#4a4a52', '#1c1c22', '#6a5a3a', '#4a3a2a', '#5a6a4a', '#7a2a2a', '#8a8a8a', '#2a4a3a'];
export const SUITS = ['#1a2a4a', '#2a2a30', '#1a1a1e', '#4a3a2a', '#5a1a2a', '#2a4a3a', '#6a6a72', '#3a3a5a'];
export const SHOES = ['#101014', '#2a1a10', '#5a3a1c', '#f4f2ee', '#2a3a5a', '#8a5a32', '#7a1a1a'];

/** Not people to look at twice: things that are not skin and hair at all (a robot, an alien, a mascot, a suit of armour, a ghoul), and the lady herself. */
const AS_THEY_ARE = new Set(['alien', 'doomlord', 'knight', 'mascot', 'mime', 'mogul', 'nonna', 'robot', 'troll', 'yeti', 'zombie']);

/** Uniforms and costumes: they keep their clothes, and get another face. */
const KEEP_CLOTHES = new Set([
  'cop', 'security', 'medic', 'lifeguard', 'welder', 'pallbearer', 'mourner', 'waiter', 'coroner', 'gatekeeper', 'wizard', 'runner',
  'emo', 'goth', 'cultist', 'punk', 'scenekid', 'raver', 'blader', 'hotdog', 'cowboy', 'surfer', 'foreman', 'engineer',
]);

/** Their hair is part of who they are (a mohican, a comb-over, a white beard, the lady's grey): it stays. */
const KEEP_HAIR = new Set(['punk', 'neighbour', 'wizard', 'rival', 'gent', 'mourner', 'purist', 'foreman', 'cultist']);

const hashOf = (name) => [...name].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

/**
 * The people of `cast` (a table of definitions by name), each in the colours it is given here, in a table of its own.
 * Complexions go round the cast, spread so that neighbours in the alphabet are not alike; clothes are drawn per person.
 */
export function dressed(cast) {
  const people = Object.keys(cast).filter((n) => typeof cast[n].variant === 'function' && !AS_THEY_ARE.has(n)).sort();
  const out = { ...cast };
  people.forEach((name, rank) => { out[name] = dress(name, cast[name], COMPLEXIONS[(rank * 7 + 2) % COMPLEXIONS.length]); });
  return out;
}

/** One person in a complexion and, unless they wear a uniform or a costume, in clothes drawn for them. */
export function dress(name, def, complexion) {
  const rnd = seeded(hashOf(name));
  const pick = (list, not = null) => {
    let c = list[Math.floor(rnd() * list.length)];
    if (c === not) c = list[(list.indexOf(c) + 3) % list.length];
    return c;
  };
  const here = def.palette();
  const changes = { skin: complexion.skin, eyes: complexion.eyes };
  if (!KEEP_HAIR.has(name) && !grey(here.hair)) changes.hair = complexion.hair;
  if (!KEEP_CLOTHES.has(name)) {
    const look = {};
    const of = (slot) => here.groups.find((g) => g.includes(slot));
    const set = (group, color) => { for (const slot of group ?? []) look[slot] = color; };
    const top = of('torso'), legs = of('legs');
    let worn = null;
    if (top && top === legs) { worn = pick(SUITS); set(top, worn); } else {
      if (top) { worn = pick(TOPS); set(top, worn); }
      if (legs) set(legs, pick(BOTTOMS, worn));
    }
    // A sleeve of its own (a cardigan over a shirt) is another colour again.
    const sleeve = of('sleeve');
    if (sleeve && sleeve !== top && sleeve !== legs) set(sleeve, pick(TOPS, worn));
    const boot = of('boot');
    if (boot && boot !== top && boot !== legs && !boot.includes('buckle')) set(boot, pick(SHOES));
    changes.look = look;
  }
  return def.variant(changes);
}

/** Whether a hair colour is grey or white (and so a person's age, not their complexion). */
function grey(hex) {
  if (!hex) return false;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const hi = Math.max(r, g, b), lo = Math.min(r, g, b);
  return hi > 0.45 && (hi - lo) / hi < 0.12;
}
