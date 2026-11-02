import { fbm } from 'madness-engine/models/sdf';
import { grainy } from 'madness-engine/models/skins';

/**
 * Krystal: the rest stop's stand. A fortune-teller's table under a velvet cloth with a gold fringe, and on it, in a
 * brass stand, the crystal ball (the library's Krystal, `heroes/krystal`, but still: baked once, nothing turning, so a
 * city of them costs nothing a frame). Where the lady sits down with a cup of tea and her patience is put right.
 */

const GLOW = (hex, k) => ({ roughness: 0.2, emissive: hex, emissiveIntensity: k });

/** The mist in the glass: deep violet, with swirls of blue and pink through it. */
const MIST = (p) => {
  const a = fbm(p[0] * 26, p[1] * 26 + 3, p[2] * 26, 3), b = fbm(p[0] * 17 + 9, p[1] * 17, p[2] * 17 + 4, 3);
  const base = [0.07, 0.03, 0.3], blue = [0.1, 0.5, 0.95], pink = [0.9, 0.22, 0.65];
  const t = Math.max(0, (a - 0.5) * 3), u = Math.max(0, (b - 0.55) * 3);
  return [0, 1, 2].map((i) => base[i] + (blue[i] - base[i]) * Math.min(1, t) + (pink[i] - base[i]) * Math.min(1, u) * 0.7);
};

export const krystal = {
  name: 'krystal', cell: 0.02,
  materials: {
    velvet: { roughness: 0.95, sheen: 0.5, sheenColor: '#b080ff', sheenRoughness: 0.5 },
    brass: { roughness: 0.25, metalness: 1 },
    glass: { roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, metalness: 0.1, emissive: '#3a1a90', emissiveIntensity: 1.1 },
    gold: GLOW('#ffc860', 0.6),
    wood: { roughness: 0.7 },
  },
  colliders: [{ cyl: [0, 0, 0.22, 0, 0.92] }],
  lights: [[0, 0.82, 0.1, '#b890ff', 2.4]],
  sculpt(s) {
    const velvet = grainy('#4a1a78', 0.16, 14), trim = '#e0b040';
    // The table: three legs and a round top, hidden under the cloth, which hangs a hand's breadth down all round.
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5, x = Math.cos(a) * 0.14, z = Math.sin(a) * 0.14;
      s.limb([x, 0.02, z], [x * 0.8, 0.52, z * 0.8], 0.018, 0.022, { color: '#3a2412', mat: 'wood', k: 0.008 });
    }
    s.cylinder([0, 0.57, 0], 0.22, 0.06, { color: velvet, mat: 'velvet', k: 0.014, round: 0.02 });
    s.cylinder([0, 0.628, 0], 0.222, 0.006, { color: velvet, mat: 'velvet', k: 0.008, round: 0.004 });
    // A gold fringe round the hem and a gold band round the edge of the top.
    s.torus([0, 0.516, 0], 0.218, 0.007, { color: trim, mat: 'gold', k: 0.004 });
    s.torus([0, 0.628, 0], 0.2, 0.005, { color: trim, mat: 'gold', k: 0.004 });
    // The stand: a round foot, a waisted stem, and a cup the ball sits down into.
    s.cylinder([0, 0.64, 0], 0.075, 0.008, { color: '#c89a3a', mat: 'brass', k: 0.006, round: 0.006 });
    s.limb([0, 0.645, 0], [0, 0.7, 0], 0.03, 0.022, { color: '#c89a3a', mat: 'brass', k: 0.01 });
    s.limb([0, 0.7, 0], [0, 0.735, 0], 0.022, 0.05, { color: '#c89a3a', mat: 'brass', k: 0.01 });
    s.torus([0, 0.742, 0], 0.052, 0.011, { color: '#d8aa44', mat: 'brass', k: 0.005 });
    // The ball, with a few bright flecks in the mist.
    s.sphere([0, 0.815, 0], 0.08, { color: MIST, mat: 'glass', k: 0.01 });
    for (let i = 0; i < 6; i++) {
      const a = i * 2.399963, r = 0.02 + 0.035 * ((i * 0.41) % 1);
      s.sphere([Math.cos(a) * r, 0.8 + 0.05 * ((i * 0.29) % 1), Math.sin(a) * r], 0.006, { color: '#f0e0ff', mat: 'gold', k: 0.003 });
    }
    // A small star on the cloth in front, in gold.
    s.paint((p) => Math.max(Math.hypot(p[0], p[2] - 0.15) - 0.03, 0.62 - p[1]), trim, 0.006);
  },
};
