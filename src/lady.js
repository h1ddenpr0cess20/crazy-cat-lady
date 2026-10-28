import { createModel } from 'madness-engine/models/model';
import { CAST } from './cast/index.js';
import { isBaked } from './cast/library.js';

/**
 * The lady, drawn: Nonna (`characters/nonna.metrlol`, in her cardigan, glasses
 * on a chain and wooden spoon) walking about on the ball the physics rolls
 * for her. She turns to face where she is going, walks faster the faster she
 * goes, stands about when she stops, flinches when she is knocked, and
 * goes down when she is flustered.
 */

export const MODEL = 'nonna';
const DETAIL = 0.5;

export function createLady(GFX) {
  const group = new GFX.Group();
  group.name = 'lady';
  const body = new GFX.Group();
  group.add(body);
  let model = null, heading = 0, clip = 'idle', since = 0, flinched = -9;
  return {
    group,
    get built() { return model !== null; },
    /** Makes her mesh, if she is baked and isn't made yet. */
    build() {
      if (!model && (typeof window === 'undefined' || isBaked(MODEL, DETAIL))) {
        model = createModel(GFX, CAST[MODEL], { detail: DETAIL });
        body.add(model.group);
      }
      return model !== null;
    },
    /** She has been knocked: a flinch. */
    flinch(time) { flinched = time; },
    /** Every frame: `ball` is where she is; `down` once she is flustered. */
    update(dt, time, ball, { down = false, pushing = false } = {}) {
      if (!this.build()) return;
      group.position.set(ball.x, ball.y - ball.r, ball.z);
      const speed = Math.hypot(ball.vx, ball.vz);
      if (speed > 0.4) {
        const want = Math.atan2(ball.vx, ball.vz);
        let d = want - heading;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        heading += d * Math.min(1, dt * 12);
      }
      body.rotation.y = heading;
      const hit = time - flinched < 0.4;
      const next = down ? 'ko' : hit ? 'hit' : speed > 0.4 || pushing ? 'walk' : 'idle';
      if (next !== clip) { clip = next; since = time; }
      model.pose({ clip, t: clip === 'hit' ? time - flinched : time - since, time, seed: 0, speed: Math.max(0.6, Math.min(2.6, speed / 3.2)) });
    },
  };
}
