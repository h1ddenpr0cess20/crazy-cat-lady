import { createFoeMesh, FOES, KNOCKED_OUT } from './foes.js';
import { collideBalls, createBall, placeBall, PUSH, stepBall } from 'madness-engine/physics';
import { grade, STAGGER } from './claws.js';
import { DENSITY, EVERY, FALLBACK, pickKind, RING, seeded, TABLES, TRIES } from './spawns.js';

/**
 * The people in the way. Each is a ball to the physics, as the lady is: they
 * stand about their patch of the map, wander a little, and come at her if she
 * comes near, shouting. She doesn't fight them: the cats do (`pack.js`). A cat
 * that reaches one claws it (`claw`), each claw taking off some of its `hp`,
 * and at nothing it is shooed, thrown clear. A foe that gets to the lady
 * bounces off her, and it costs her some of her patience.
 *
 * Nobody is placed in the crowd but the bosses: the rest are made as she
 * walks, a few at a time, in the open ground round her, picked from her
 * district's table, and unmade when she has left them behind (`spawns.js`).
 *
 * Only those near the lady are simulated. Everyone else stands where they
 * were, in the pose they were in. Nobody is there at all until their model
 * is baked (`foes.js`): not drawn, not in the way. And only those in view are
 * drawn and posed; the rest are taken out of the scene.
 */

/** Further than this from the ball, a foe stands still and is not posed. */
const SLEEP = 24;

/** Further than this from what the camera looks at, a foe isn't drawn. */
const DRAW = 48;

/** How many foes' meshes may be made in a frame, as they first come into view. */
const BUILDS = 2;

/** Further than these from what the camera looks at, a foe is posed every second frame, and every third. */
const POSE_HALF = 10, POSE_THIRD = 18;

/** How near the ball has to come for a foe to notice it, if the map doesn't say. */
const NOTICE = 6.5;

/** How long a foe that has taken a knock can't be hit again. */
const GUARD = Object.freeze({ foe: 0.9, boss: 1.5 });

/** How long before a foe shouts again. */
const HOARSE = 20;

export function createCrowd(GFX, map, world, { killY, enabled = true, spawning = enabled, seed = 7 } = {}) {
  const group = new GFX.Group();
  group.name = 'crowd';
  const axis = new GFX.Vector3();
  const spinQ = new GFX.Quaternion();
  const sphere = new GFX.Sphere();
  let frame = 0;

  let made = 0;
  /** A foe from `m` ({ kind, x, z, facing, range, notice }): a ball to the physics, and a look. */
  const make = (m) => {
    const stats = FOES[m.kind];
    if (!stats) throw new Error(`${map.name}: no such foe as ${m.kind}`);
    const look = createFoeMesh(GFX, m.kind);
    look.group.rotation.y = m.facing ?? 0;
    const ground = map.heightAt(m.x, m.z) ?? 0;
    const ball = createBall({ x: m.x, y: ground + stats.radius, z: m.z, r: stats.radius, mass: stats.boss ? 50 : 2.5 });
    ball.grounded = true;
    return {
      ...m, i: made++, stats, look, ball, heading: m.facing ?? 0, moving: false, chasing: false, striking: false,
      dead: false, gone: false, hp: stats.hp ?? stats.toughness * 2, guard: 0, stagger: 0, clawed: [], flung: null, downAt: 0,
      home: [m.x, ground + stats.radius, m.z], drift: null, driftUntil: 0, shoutedAt: -HOARSE, awake: false,
    };
  };
  const foes = (enabled ? map.foes : []).map(make);
  const rnd = seeded(seed);
  let spawnTimer = 0, sweepTimer = 0;

  /** The foe, thrown clear: up and away along `dir` ([x, z], unit), as hard as `speed`. */
  function fling(foe, dir, speed, time) {
    const b = foe.ball;
    const away = 3.5 + speed * 0.9;
    foe.dead = true;
    foe.downAt = time;
    foe.flung = {
      x: b.x, y: b.y - b.r, z: b.z, vx: dir[0] * away, vy: 4.5 + speed * 0.45, vz: dir[1] * away,
      axis: [-dir[1], dir[0]], rate: 7 + speed * 0.6, t: 0, ground: map.heightAt(b.x, b.z) ?? b.y - b.r,
    };
  }

  /** Somebody new, now and then, if fewer are about the lady than her district wants; and those she has left behind are unmade. */
  function spawn(dt, lady) {
    spawnTimer += dt;
    sweepTimer += dt;
    if (sweepTimer > 2) {
      sweepTimer = 0;
      for (let k = foes.length - 1; k >= 0; k--) {
        const f = foes[k];
        if (!f.spawned) continue;
        const b = f.ball;
        if (!f.gone && !(Math.hypot(b.x - lady.x, b.z - lady.z) > RING.gone && !f.dead)) continue;
        if (f.look.group.parent === group) group.remove(f.look.group);
        foes.splice(k, 1);
      }
    }
    if (spawnTimer < EVERY) return;
    spawnTimer = 0;
    const here = map.districtAt(lady.x, lady.z);
    const want = DENSITY[here?.name] ?? FALLBACK;
    let near = 0;
    for (const f of foes) if (!f.gone && !f.dead && !f.stats.boss && Math.hypot(f.ball.x - lady.x, f.ball.z - lady.z) < RING.far + 4) near++;
    if (near >= want) return;
    for (let k = 0; k < TRIES; k++) {
      const a = rnd() * Math.PI * 2, r = RING.near + rnd() * (RING.far - RING.near);
      const x = lady.x + Math.cos(a) * r, z = lady.z + Math.sin(a) * r;
      const ground = map.heightAt(x, z);
      // On firm, level, open ground at about her height (not up on a roof), where somebody could stand.
      if (ground == null || Math.abs(ground - (lady.y - lady.r)) > 1.5 || !map.isOpen(x, z, Math.max(0.4, lady.y), { near: true })) continue;
      let crowded = false;
      for (const f of foes) if (!f.gone && Math.hypot(f.ball.x - x, f.ball.z - z) < 1.4) { crowded = true; break; }
      if (crowded) continue;
      const table = TABLES[map.districtAt(x, z)?.name];
      if (!table) continue;
      const kind = pickKind(table, rnd());
      const f = make({ kind, x, z, facing: rnd() * Math.PI * 2, range: 3, notice: null });
      f.spawned = true;
      foes.push(f);
      break;
    }
  }

  return {
    group, foes,

    /**
     * Somebody is standing where the ball is about to be put (a respawn, the
     * start): everyone within `r` of (x, z) is moved just outside it, to
     * somewhere they can stand, and made to call it home.
     */
    clear(x, z, r = 2.2) {
      for (const f of foes) {
        if (f.gone || f.dead) continue;
        const b = f.ball;
        const d = Math.hypot(b.x - x, b.z - z);
        if (d >= r + b.r) continue;
        const base = d > 1e-3 ? Math.atan2(b.z - z, b.x - x) : f.i;
        let moved = false;
        for (let ring = 0; ring < 3 && !moved; ring++) {
          for (let k = 0; k < 16 && !moved; k++) {
            const a = base + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 8);
            const rr = r + b.r + 0.3 + ring * 0.8;
            const nx = x + Math.cos(a) * rr, nz = z + Math.sin(a) * rr;
            const ground = map.heightAt(nx, nz);
            if (ground == null || !map.isOpen(nx, nz, Infinity, { near: true })) continue;
            placeBall(b, nx, ground + b.r, nz);
            f.home = [nx, ground + b.r, nz];
            moved = true;
          }
        }
        if (!moved) f.gone = true;
      }
    },

    /**
     * A cat's claw on `foe` (`cat` is who, for the swarm): it takes `damage`
     * off, staggers a moment, and at nothing is shooed, thrown clear along
     * `dir` ([x, z], unit). Returns the event for it if it was shooed.
     */
    claw(foe, cat, damage, dir, time) {
      if (foe.dead || foe.gone) return null;
      foe.hp -= damage;
      foe.stagger = STAGGER;
      foe.clawed = foe.clawed.filter((c) => time - c.t < 1.2 && c.cat !== cat);
      foe.clawed.push({ cat, t: time });
      if (foe.hp > 0) return null;
      const how = grade(foe.clawed.length);
      fling(foe, dir, 6, time);
      return { type: 'shoo', grade: how.name, foe, hype: foe.stats.hype * how.hype };
    },

    /**
     * The lady's swing at `time`: everyone within her reach (and their own
     * size) takes `damage`, as if from a claw, and is shoved back from her.
     * Returns the shoo events, and how many she hit.
     */
    swing(lady, damage, reach, shove, time) {
      const shoos = [];
      let hit = 0;
      for (const f of foes) {
        if (f.gone || f.dead || f.flung || !f.look.ready) continue;
        const b = f.ball;
        const dx = b.x - lady.x, dz = b.z - lady.z, d = Math.hypot(dx, dz) || 1e-6;
        if (d > reach + b.r || Math.abs(b.y - lady.y) > 1.6) continue;
        hit++;
        const dir = [dx / d, dz / d];
        const e = this.claw(f, 'lady', damage, dir, time);
        if (e) shoos.push(e);
        else { b.vx += dir[0] * shove; b.vz += dir[1] * shove; }
      }
      return { shoos, hit };
    },

    /**
     * One step. `ball` is the lady's, or null. Returns what happened to it
     * and the people: { type: 'bonk' | 'shout', grade, foe, damage, hype } for each.
     */
    step(dt, time, ball) {
      const events = [];
      if (spawning && ball) spawn(dt, ball);
      for (const f of foes) {
        if (f.gone || !f.look.ready) continue;
        f.guard = Math.max(0, f.guard - dt);
        f.stagger = Math.max(0, f.stagger - dt);

        // Thrown clear: a fall through the air, then gone.
        if (f.flung) {
          const k = f.flung;
          k.t += dt;
          k.vy -= 24 * dt;
          k.x += k.vx * dt; k.y += k.vy * dt; k.z += k.vz * dt;
          if (k.y < k.ground) { k.y = k.ground; k.vy = Math.abs(k.vy) * 0.25; k.vx *= 0.6; k.vz *= 0.6; }
          if (time - f.downAt > KNOCKED_OUT) f.gone = true;
          continue;
        }

        const b = f.ball;
        const dx = ball ? ball.x - b.x : 0, dz = ball ? ball.z - b.z : 0;
        const dist = ball ? Math.hypot(dx, dz) : Infinity;
        f.awake = dist < SLEEP;
        if (!f.awake) { f.moving = false; f.chasing = false; continue; }

        // What it does: come at the ball if it is near its patch; otherwise drift about, or go home.
        const notice = f.notice ?? NOTICE;
        const fromHome = ball ? Math.hypot(ball.x - f.home[0], ball.z - f.home[2]) : Infinity;
        let ax = 0, az = 0;
        f.chasing = !!ball && dist < notice && fromHome < f.range + notice && Math.abs(ball.y - b.y) < 1.6 && dist > 1e-3;
        if (f.chasing) {
          ax = dx / dist; az = dz / dist;
          if (time - f.shoutedAt > HOARSE) {
            f.shoutedAt = time;
            events.push({ type: 'shout', foe: f });
          }
        } else {
          const hx = f.home[0] - b.x, hz = f.home[2] - b.z, hd = Math.hypot(hx, hz);
          if (hd > f.range) { ax = hx / hd * 0.6; az = hz / hd * 0.6; f.drift = null; }
          else {
            if (time > f.driftUntil) {
              // A short walk somewhere, then a stand about.
              const idle = f.drift != null;
              const a = ((f.i * 2.399963 + time * 0.7) % (Math.PI * 2));
              f.drift = idle ? null : [Math.cos(a) * 0.45, Math.sin(a) * 0.45];
              f.driftUntil = time + (idle ? 1.8 + (f.i % 5) * 0.5 : 1.0 + (f.i % 3) * 0.4);
            }
            if (f.drift) { ax = f.drift[0]; az = f.drift[1]; }
          }
        }
        if (f.stagger > 0) { ax = 0; az = 0; }
        stepBall(b, world, ax, az, dt, { push: PUSH * 0.4, topSpeed: f.stagger > 0 ? 0.3 : f.chasing ? f.stats.speed : f.stats.speed * 0.35 });
        const speed = Math.hypot(b.vx, b.vz);
        f.moving = speed > 0.25;
        if (speed > 0.2) f.heading = Math.atan2(b.vx, b.vz);
        if (b.y < killY) { f.gone = true; continue; }

        // Meeting the lady: it bounces off her, and costs her some patience.
        f.striking = false;
        if (!ball) continue;
        const reach = ball.r + b.r;
        const d3 = Math.hypot(ball.x - b.x, ball.y - b.y, ball.z - b.z);
        if (d3 < reach + 0.35) f.striking = true;
        if (d3 >= reach) continue;
        if (f.guard > 0) { collideBalls(ball, b, 0.9); continue; }
        events.push({ type: 'bonk', grade: 'bonk', foe: f, damage: f.stats.power, hype: 0 });
        f.guard = f.stats.boss ? GUARD.boss : GUARD.foe;
        collideBalls(ball, b, 0.9);
      }
      return events;
    },

    /**
     * Meshes to match, once a frame. `view` ({ at, frustum }) is what the
     * camera looks at and sees; without it, everyone is in view.
     */
    sync(dt, time, view = null) {
      let builds = BUILDS;
      frame++;
      for (const f of foes) {
        const b = f.ball;
        const k = f.flung;
        const x = k ? k.x : b.x, y = k ? k.y : b.y - b.r, z = k ? k.z : b.z;
        let shown = !f.gone && f.look.ready;
        const far = view ? Math.hypot(x - view.at.x, z - view.at.z) : 0;
        if (shown && view) {
          sphere.center.set(x, y + b.r, z);
          sphere.radius = b.r * 2.5 + 1.5;
          shown = far < DRAW && view.frustum.intersectsSphere(sphere);
        }
        if (shown && !f.look.built) shown = builds-- > 0 && f.look.build();
        if (shown !== (f.look.group.parent === group)) {
          if (shown) group.add(f.look.group); else group.remove(f.look.group);
        }
        if (!shown) continue;
        if (k) {
          f.look.group.position.set(x, y, z);
          axis.set(k.axis[0], 0, k.axis[1]);
          spinQ.setFromAxisAngle(axis, Math.min(Math.PI * 1.6, k.t * k.rate));
          f.look.group.quaternion.copy(spinQ);
          f.look.animate(time + f.i * 1.37, false, { down: true });
          continue;
        }
        f.look.group.position.set(x, y, z);
        f.look.group.quaternion.set(0, 0, 0, 1);
        let d = f.heading - f.look.body.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        f.look.body.rotation.y += d * Math.min(1, dt * 8);
        // Further off, the poses come less often: the clips run on the clock all the same.
        const every = far < POSE_HALF ? 1 : far < POSE_THIRD ? 2 : 3;
        if (!f.posed || (f.awake && (frame + f.i) % every === 0)) {
          f.posed = true;
          f.look.animate(time + f.i * 1.37, f.moving, { chasing: f.chasing, striking: f.striking });
        }
      }
    },
  };
}
