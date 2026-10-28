import { CAT_KINDS } from 'madness-engine/characters/cat';
import { createModel } from 'madness-engine/models/model';
import { createBall, placeBall, PUSH, stepBall } from 'madness-engine/physics';
import { CAST } from './cast/index.js';
import { isBaked } from './cast/library.js';
import { CLAW_EVERY } from './claws.js';

/**
 * The cats: the lady's pack, Catroller's six coats (`characters/cat`), each
 * a ball to the physics as she is. They trot after her in a loose ring and,
 * when somebody comes near, go for them: the nearest foe each can see is the
 * one it runs at, and claws, over and over, until the foe is shooed. With
 * nothing to fight they get up to mischief, knocking over whatever small
 * thing is lying about (a cone, a bin, a bench).
 *
 * The cats are sculpted a tile high for the house they came from; here they
 * are `SIZE` of that, about a fifth of a tile at the back, to the lady's
 * three-quarters. Nothing hurts them.
 */

export const SIZE = 0.24;
export const RADIUS = 0.15;

/** The coats the pack is drawn from, in the order they join. */
export const COATS = ['ginger', 'black', 'grey', 'calico', 'siamese', 'tom'];

/** How many are in the pack to begin with, and the most it grows to. */
export const START = 6;
export const MOST = 16;

/** How far from the lady a foe can be and still be hunted, and how far from the cat. */
const HUNT = 7, CHASE = 9;

/** How far from the lady a cat will go after anything: past this it gives up and comes back to her. */
const LEASH = 8;

/** How far behind the lady a cat can fall before it is put back beside her (it runs to catch up long before that). */
const LOST = 28;

/** How close cats come to each other (and the lady) before they steer apart, and before they are pushed apart: a cat is longer than the ball it is. */
const SPACE = 0.7, TOUCH = 0.45, HER = 0.6;

/** How often a cat looks for something to do, in seconds; and how often it gets up to mischief. */
const LOOK = 0.15, MISCHIEF = [6, 14];

/** How hard each cat's claw is; the tom's is twice any other's. */
const CLAW = (kind) => (kind.size > 1.2 ? 2 : 1);

/** The cast names of every coat, for the library to bake. */
export const CAT_MODELS = COATS.map((c) => `cat-${c}`);

export function createPack(GFX, map, world, { killY, foes = [], props = [], start = START } = {}) {
  const group = new GFX.Group();
  group.name = 'pack';
  const cats = [];
  let frame = 0;

  function join(i, as = COATS[i % COATS.length]) {
    const coat = as;
    const kind = CAT_KINDS[coat];
    const look = new GFX.Group();
    look.scale.setScalar(SIZE);
    const body = new GFX.Group();
    look.add(body);
    let model = null;
    const ball = createBall({ r: RADIUS, mass: 1 });
    ball.grounded = true;
    const cat = {
      i, coat, kind, look, body, ball, claw: CLAW(kind),
      heading: 0, stuck: 0, target: null, prop: null, cooldown: i * 0.1, seeking: 0, struck: -9, still: 0, mischief: 3 + i * 2.1,
      clip: 'idle', since: 0,
      get built() { return model !== null; },
      build() {
        if (!model && isBaked(`cat-${coat}`, 0.5)) {
          model = createModel(GFX, CAST[`cat-${coat}`], { detail: 0.5 });
          body.add(model.group);
        }
        return model !== null;
      },
      pose(state) { model?.pose(state); },
    };
    cats.push(cat);
    return cat;
  }

  /** Puts a cat down just by (x, z), on the ground. */
  function place(cat, x, z, a = cat.i * 2.4) {
    for (let k = 0; k < 8; k++) {
      const r = 0.9 + k * 0.4;
      const px = x + Math.cos(a + k) * r, pz = z + Math.sin(a + k) * r;
      const g = map.heightAt(px, pz);
      if (g != null && map.isOpen(px, pz, Infinity, { near: true })) { placeBall(cat.ball, px, g + RADIUS, pz); return; }
    }
    placeBall(cat.ball, x, (map.heightAt(x, z) ?? 0) + RADIUS + 0.3, z);
  }

  const live = (f) => !f.gone && !f.dead && !f.flung && f.look.ready;

  /** The nearest foe to the cat that is near enough the lady, or null. */
  function hunted(cat, lady) {
    const b = cat.ball;
    let best = null, bd = CHASE;
    for (const f of foes) {
      if (!live(f) || Math.abs(f.ball.x - lady.x) > HUNT || Math.abs(f.ball.z - lady.z) > HUNT) continue;
      if (Math.abs(f.ball.y - lady.y) > 2.2) continue;
      const d = Math.hypot(f.ball.x - b.x, f.ball.z - b.z);
      if (d < bd) { bd = d; best = f; }
    }
    return best;
  }

  /** Something small and breakable near the lady, to knock over. */
  function mischief(lady) {
    let best = null, bd = 5;
    for (const p of props) {
      if (p.broken || p.at > 6.5) continue;
      const d = Math.hypot(p.x - lady.x, p.z - lady.z);
      if (d < bd && Math.abs((p.base ?? 0) - lady.y) < 2) { bd = d; best = p; }
    }
    return best;
  }

  for (let i = 0; i < start; i++) join(i);

  return {
    group, cats,

    /** The pack puts itself by the lady (the start, a respawn). */
    gather(x, z) {
      for (const c of cats) { place(c, x, z); c.target = null; c.prop = null; }
    },

    /** One more cat joins, in `coat`, up to the most; returns it. */
    grow(coat) {
      if (cats.length >= MOST) return null;
      const c = join(cats.length, coat);
      place(c, cats[0].ball.x, cats[0].ball.z);
      return c;
    },

    /**
     * One step. `lady` is her ball, or null; `claw(foe, cat, damage, dir)`
     * is the crowd's, and returns what it came to. Returns { claws, shoos,
     * knocks }: who clawed, who was shooed, and what was knocked over.
     */
    step(dt, time, lady, speed, claw) {
      const out = { claws: [], shoos: [], knocks: [] };
      if (!lady) return out;
      frame++;
      for (const c of cats) {
        const b = c.ball;
        c.cooldown -= dt;
        c.seeking -= dt;
        c.mischief -= dt;
        const toLady = Math.hypot(lady.x - b.x, lady.z - b.z);
        if (toLady > LOST || b.y < killY || Math.abs(lady.y - b.y) > 10) { place(c, lady.x, lady.z); c.target = null; continue; }

        // What to do: every so often, look for somebody to go for (or something to knock over).
        if (c.seeking <= 0) {
          c.seeking = LOOK + (c.i % 4) * 0.02;
          c.target = hunted(c, lady);
          if (!c.target && c.mischief <= 0 && !c.prop) {
            c.prop = mischief(lady);
            c.mischief = MISCHIEF[0] + ((c.i * 3.7) % (MISCHIEF[1] - MISCHIEF[0]));
          }
        }
        // Never far from her: past the leash it lets go of whatever it was after.
        if (toLady > LEASH) { c.target = null; c.prop = null; }
        if (c.target && !live(c.target)) c.target = null;
        if (c.prop && c.prop.broken) c.prop = null;

        let ax = 0, az = 0, top = c.kind.speed, aim = null, attack = false;
        if (c.target) {
          const f = c.target.ball;
          const dx = f.x - b.x, dz = f.z - b.z, d = Math.hypot(dx, dz) || 1e-6;
          const reach = f.r + b.r + 0.12;
          aim = [dx / d, dz / d];
          top = c.kind.speed * 1.5;
          if (d > reach) { ax = aim[0]; az = aim[1]; } else attack = true;
        } else if (c.prop) {
          const dx = c.prop.x - b.x, dz = c.prop.z - b.z, d = Math.hypot(dx, dz) || 1e-6;
          aim = [dx / d, dz / d];
          top = c.kind.speed * 1.5;
          if (d > c.prop.r + b.r + 0.1) { ax = aim[0]; az = aim[1]; } else {
            out.knocks.push({ cat: c, prop: c.prop });
            c.prop = null;
          }
        } else {
          // Round the lady in a ring that drifts, and keeps up with her however fast she goes.
          const a = c.i * 2.399 + time * 0.25 * (c.i % 2 ? 1 : -1);
          const r = 0.9 + 0.14 * (c.i % 4);
          const tx = lady.x + Math.cos(a) * r, tz = lady.z + Math.sin(a) * r;
          const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz);
          if (d > 0.35) { ax = dx / d; az = dz / d; top = Math.max(c.kind.speed, speed * 1.2 + d * 3); }
        }
        // Room for each other: steer away from any cat that is close, harder the closer.
        for (const o of cats) {
          if (o === c) continue;
          const dx = b.x - o.ball.x, dz = b.z - o.ball.z, d = Math.hypot(dx, dz);
          if (d >= SPACE) continue;
          const k = (1 - d / SPACE) * (attack ? 0.7 : 1.6) / (d || 1);
          ax += (d ? dx : Math.cos(c.i)) * k; az += (d ? dz : Math.sin(c.i)) * k;
        }
        // Wanting to go and not getting anywhere (a wall, a post): edge round it, one way and then the other.
        const wants = ax !== 0 || az !== 0;
        c.stuck = wants && Math.hypot(b.vx, b.vz) < 0.8 ? c.stuck + dt : 0;
        if (c.stuck > 0.3) {
          const turn = (Math.floor(c.stuck / 0.7) % 2 ? -1 : 1) * (c.i % 2 ? 1 : -1) * 1.2;
          const cs = Math.cos(turn), sn = Math.sin(turn);
          [ax, az] = [ax * cs - az * sn, ax * sn + az * cs];
        }
        stepBall(b, world, ax, az, dt, { push: PUSH * (toLady > 4 ? 2.4 : 0.9), topSpeed: Math.min(top, 26), drag: 0.4 });
        // Never on top of each other, or of her.
        for (const o of cats) {
          if (o.i <= c.i) continue;
          const dx = o.ball.x - b.x, dz = o.ball.z - b.z, d = Math.hypot(dx, dz);
          if (d >= TOUCH) continue;
          const push = (TOUCH - d) / 2 / (d || 1), px = d ? dx : 1, pz = d ? dz : 0;
          b.x -= px * push; b.z -= pz * push; o.ball.x += px * push; o.ball.z += pz * push;
        }
        if (toLady < HER) { const k = (HER - toLady) / (toLady || 1); b.x -= (lady.x - b.x) * k; b.z -= (lady.z - b.z) * k; }
        const v = Math.hypot(b.vx, b.vz);
        if (aim && (attack || v < 0.5)) c.heading = Math.atan2(aim[0], aim[1]);
        else if (v > 0.3) c.heading = Math.atan2(b.vx, b.vz);
        c.still = v < 0.3 ? c.still + dt : 0;
        c.pace = v;

        if (attack && c.cooldown <= 0) {
          const f = c.target;
          c.cooldown = CLAW_EVERY + (c.i % 3) * 0.05;
          c.struck = time;
          const e = claw(f, c, c.claw, aim, time);
          out.claws.push({ cat: c, foe: f });
          if (e) { out.shoos.push(e); c.target = null; }
        }
      }
      return out;
    },

    /** Meshes to match, once a frame. */
    sync(dt, time, view = null) {
      let builds = 2;
      for (const c of cats) {
        if (!c.look.parent) group.add(c.look);
        if (!c.built && !(builds-- > 0 && c.build())) { c.look.visible = false; continue; }
        c.look.visible = true;
        const b = c.ball;
        c.look.position.set(b.x, b.y - b.r, b.z);
        let d = c.heading - c.body.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        c.body.rotation.y += d * Math.min(1, dt * 10);
        const swat = time - c.struck;
        let clip = 'idle', t = 0;
        if (swat < 0.45) { clip = 'swat'; t = swat; }
        else if (c.pace > 3.2) clip = 'run';
        else if (c.pace > 0.3) clip = 'walk';
        else if (c.still > 2.5) clip = 'sit';
        if (clip !== c.clip) { c.clip = clip; c.since = time; }
        if (view && frame % 2 && Math.hypot(b.x - view.at.x, b.z - view.at.z) > 14) continue;
        c.pose({ clip, t: clip === 'swat' ? t : time - c.since, time, seed: c.i * 1.7, pace: c.pace ?? 0, speed: 1 });
      }
    },
  };
}
