/**
 * The reels scripts/reel.js makes. Each is a soundtrack (Catroller's trio, and
 * its tempo), a line to open on, and clips cut on its bar lines: scenes (see
 * src/reel/recorder.js: the lady wandering a district with her pack of twelve
 * and a crowd close round her), the best stretch of each that the cats made
 * of it. Every one ends on the card with the address. The only thing in them
 * is cats swarming people.
 */

/** The trio, in the key and at the pace the game plays it in (`themeFor(3)`), the drums doubling up when the cats are at somebody. */
const TRIO = { args: [], tempo: 119, lead: 0.1 };

export const REELS = {
  swarm: {
    hook: ['Twelve cats', 'one very surprised dog walker'],
    music: TRIO,
    // The best of the eight scenes: six stretches of two bars (four seconds a clip), in the order of the scenes.
    clips: { from: [0, 1, 2, 3, 4, 5, 6, 7], take: 6, bars: 2 },
  },
  clowder: {
    hook: ['Do not bring a dog', 'to a cat lady\'s street'],
    music: TRIO,
    // Three long stretches, four bars (eight seconds) each, of the best scenes.
    clips: { from: [0, 1, 2, 3, 4, 5, 6, 7], take: 3, bars: 4 },
  },
};

/**
 * What each sound the game makes is worth to a reel: a number, or a function
 * of what it was called with. `swarm` and `shoo` are noted by recorder.js as
 * each foe goes; a claw is one cat's swipe, so a stretch with many of them has
 * cats on somebody; the lady being knocked about is no advert.
 */
export const WORTH = {
  swarm: 40,
  shoo: 15,
  claw: 1,
  squeak: -8,
  pop: -30,
  gloop: -30,
  honk: -2,
  knock: -1,
};

/** A foe going is worth seeing only with a moment after it, for it to fly. */
export const AFTER = { swarm: 1.2, shoo: 1.2 };

/**
 * The sound, before it goes out: the trio is a plucked bass and brushes, light
 * at the bottom already; a little of the very bottom is cut and the top lifted
 * so that it carries on a phone.
 */
export const MIX = 'highpass=f=45,treble=g=3:f=3500:w=0.6';

/** How long the card to end on stays up, in seconds. */
export const CARD = 4.6;

/** How long the opening line stays up, and when the address comes in under the HUD. */
export const HOOK = 2.4;
export const PILL = 2.7;
