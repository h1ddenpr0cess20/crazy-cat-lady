/**
 * What the cats do to the people in the way. There is no roll of the dice:
 * a cat that reaches one claws it, and each claw takes off some of its `hp`
 * (twice its `toughness`, unless it is a boss and says otherwise). At
 * nothing it is shooed, thrown clear, and worth `hype`. If four or more
 * cats had a go at it in the last moment, it was swarmed, and worth double.
 */

/** How long a foe that has been clawed stops where it is. */
export const STAGGER = 0.3;

/** How many cats it takes to swarm one. */
export const SWARM = 4;

/** How long between one cat's claws, in seconds. */
export const CLAW_EVERY = 0.55;

/**
 * The lady's own swing, with the wooden spoon: it comes round the whole of her,
 * reaches `reach` tiles from her middle (past the foe's own size), does
 * `damage` to everyone it reaches, shoves them back, and can't be done again
 * for `every` seconds.
 */
export const SWING = Object.freeze({ reach: 1.5, damage: 3, every: 0.7, shove: 4 });

/** What it is called when a foe goes, and what it is worth, by how many cats were at it. */
export function grade(cats) {
  return cats >= SWARM ? { name: 'swarm', hype: 2 } : { name: 'shoo', hype: 1 };
}

/** What it is called when it lands. */
export const GRADES = Object.freeze({
  swarm: { title: 'SWARMED!' },
  shoo: { title: 'SHOOED!' },
  bonk: { title: 'OOF' },
});
