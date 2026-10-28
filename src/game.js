import { CAST } from './cast/index.js';
import { materialsOf } from 'madness-engine/models/model';
import { createEffects } from './effects.js';
import { createLady } from './lady.js';
import { createPickups } from './pickups.js';
import { CAT_MODELS } from './pack.js';
import { MODEL as LADY } from './lady.js';
import { FOES } from './foes.js';
import { say } from './quips.js';
import { TABLES } from './spawns.js';
import { createRun, putBack, respawn, STEP, stepRun, toGround } from './run.js';
import { createWorldMeshes } from './scenery.js';
import { LAMP_LIGHTS } from './stage.js';
import { HOME } from 'madness-engine/views/town';

/**
 * The game: one city, all of it open from the start. Walk anywhere with the
 * pack; find the 42 golden keys and take in the strays; let the cats shoo the
 * people in the way, and say something about it afterwards. Get flustered and
 * she is back at the last rest stop she came to; go into the tar and she's
 * back on the last firm ground. What she has found is kept between visits.
 */

const BANNERS = {
  flustered: 'FLUSTERED!',
  squashed: 'FLATTENED!',
  sunk: 'GLOOP!',
};

/** What it is called when it lands (see `claws.js`). */
const GRADES = { swarm: 'SWARMED!', shoo: 'SHOOED!', bonk: 'OOF' };

/** How close the camera comes for the title, and how fast it circles. */
const TITLE_ZOOM = 0.34;
const TITLE_TURN = 0.16;

export function createGame({ stage, hud, input, audio, storage }) {
  const { GFX, scene, view } = stage;
  const effects = createEffects(GFX, scene);
  const lady = createLady(GFX);
  scene.add(lady.group);
  const xray = createXray(GFX);
  scene.add(xray.sprite);
  // What the camera saw last frame, for the crowd: only those in it are drawn.
  const seeing = { at: stage.target, frustum: new GFX.Frustum() };
  const viewProjection = new GFX.Matrix4();

  let saved = storage.load();
  let run = createRun(GFX, { found: saved.found, adopted: saved.strays });
  const world = createWorldMeshes(GFX, run.map, run.built);
  scene.add(world, run.traffic.group, run.hazards.group, run.crowd.group, run.pack.group);
  let pickups = createPickups(GFX, run);
  scene.add(pickups.group);
  effects.setCourse(run.map);
  hud.setMap(run.map);

  let state = 'title';  // title · play · lost · won
  let paused = false;
  let timer = 0;
  let accumulator = 0;
  let lostHow = null;
  let elapsed = saved.time;
  let likesGot = 0;
  let streak = 0, streakTimer = 0;
  let swingWanted = false, jumpWanted = false;
  let saveTimer = 0;
  let playZoom = HOME.zoom;
  const seen = new Set();

  const found = () => run.gpus.filter((g) => g.got).length;

  // The town's lamps, where their light comes from; the nearest few light the ball for real.
  const lamps = run.map.lamps.map((l) => ({ ...l, y: (l.y ?? run.map.heightAt(l.x, l.z) ?? 0) + l.height, color: new GFX.Color(l.colour) }));
  let lampTimer = 0;
  /** The real lights to the lamps nearest (x, z), and the flares that are burning. */
  function lightUp(x, z) {
    const near = lamps.map((l) => ({ l, d: Math.hypot(l.x - x, l.z - z) - l.reach * 0.3 })).sort((a, b) => a.d - b.d);
    stage.lampLights.forEach((light, i) => {
      const n = near[i];
      if (!n || n.d > 14) { light.intensity = 0; return; }
      light.position.set(n.l.x, n.l.y - 0.15, n.l.z);
      light.color.copy(n.l.color);
      light.distance = n.l.reach * 1.25;
      light.intensity = 1.6 * n.l.glow;
    });
  }
  void LAMP_LIGHTS;

  function enter(next) {
    state = next;
    timer = 0;
  }

  function reset({ fresh = false } = {}) {
    // A new run of the world: everything back where it was, the golden keys found kept unless starting over.
    if (fresh) saved = storage.clear();
    scene.remove(run.traffic.group, run.hazards.group, run.crowd.group, run.pack.group, pickups.group);
    run = createRun(GFX, { found: saved.found, adopted: saved.strays, ball: run.ball, map: run.map });
    world.userData.restoreProps();
    scene.add(run.traffic.group, run.hazards.group, run.crowd.group, run.pack.group);
    pickups = createPickups(GFX, run);
    scene.add(pickups.group);
    const stone = run.stones.find((p) => p.name === saved.stone);
    if (stone) { run.checkpoint = stone; respawn(run); }
    elapsed = saved.time;
    likesGot = 0;
    seen.clear();
    const b = run.ball;
    stage.target.set(b.x, b.y, b.z);
  }

  function showTitle() {
    enter('title');
    paused = false;
    hud.paused(false);
    view.aim.zoom = TITLE_ZOOM;
    audio.startMusic();
    hud.title(saved, { found: found(), total: run.gpus.length });
  }

  function start({ fresh = false } = {}) {
    reset({ fresh });
    enter('play');
    view.aim.zoom = playZoom;
    hud.play();
    hud.patience(run.patience);
    hud.gold(found(), run.gpus.length);
    hud.likes(likesGot);
    hud.cred(run.cred, 0);
    hud.pack(String(run.pack.cats.length));
    hud.clock(elapsed);
    audio.wake();
    audio.startMusic();
  }

  function save() {
    saved = storage.progress({ found: run.gpus.filter((g) => g.got).map((g) => g.name), strays: run.strays.filter((s) => s.got).map((s) => s.name), stone: run.checkpoint?.name ?? null, time: elapsed });
  }

  function lose(how) {
    const b = run.ball;
    lostHow = how;
    enter('lost');
    hud.banner(BANNERS[how], 'big');
    if (how === 'sunk') {
      effects.gloop(b.x, b.y, b.z);
      audio.gloop();
    } else {
      effects.pop(b.x, b.y, b.z, b.vx, b.vz, '#e8c8d8');
      audio.pop();
      hud.quip(say('flustered'));
    }
  }

  function physics(push, boost) {
    const live = state === 'play';
    const moving = state !== 'lost' || lostHow === 'sunk';
    const out = stepRun(run, push, STEP, { live, moving: moving && state !== 'title', boost, swing: swingWanted, jump: jumpWanted });
    swingWanted = false;
    jumpWanted = false;
    if (state !== 'play') return;
    const b = run.ball;
    for (const car of out.honks) audio.honk(car.kind);
    if (out.hurt > 0) {
      hud.patience(run.patience);
      hud.hit();
      lady.flinch(run.time);
      audio.squeak();
      if (out.hits.includes('car') || out.hits.includes('reel') || out.hits.includes('foe')) {
        effects.sparks(b.x, b.y, b.z);
        audio.clunk(Math.max(out.impact, 5));
      }
      if (out.hits.includes('flare')) audio.sizzle();
    } else if (out.impact > 3) {
      audio.knock(out.impact);
    }
    for (const foe of out.shouts) hud.toast(`${foe.stats.name}: “${foe.stats.shout}”`, 2.2);
    for (const e of out.knocks) {
      hud.quip(GRADES[e.grade], say(e.grade), 2.2);
    }
    if (out.jumped) audio.hop();
    if (out.swung) {
      lady.swing(run.time);
      audio.swing(out.swingHit > 0);
      if (out.swingHit > 0) { const a = lady.group.position; effects.sparks(a.x, a.y + 0.4, a.z, 6); }
    }
    for (const c of out.claws) {
      const at = c.foe.ball;
      effects.sparks(at.x, at.y, at.z, 3);
      audio.claw();
    }
    for (const e of out.shoos) {
      const at = e.foe.ball;
      effects.sparks(at.x, at.y, at.z, 16);
      effects.chaff(at.x, at.y, at.z);
      audio.smash(e.grade === 'swarm');
      const combo = run.combo > 1 ? ` ×${run.combo}` : '';
      hud.quip(`${GRADES[e.grade]}${combo}  +${Math.round(e.hype * run.combo)}`, say(run.combo >= 3 ? 'combo' : e.grade), 2.6);
      hud.cred(run.cred, run.combo);
    }
    for (const p of out.breaks) {
      const away = [(p.x - b.x), (p.z - b.z)], l = Math.hypot(away[0], away[1]) || 1;
      const sp = Math.hypot(b.vx, b.vz);
      if (p.kind === 'model') effects.debris(p.name, { ...p.model, y: p.base }, away[0] / l * sp, away[1] / l * sp);
      effects.sparks(p.x, p.base + 0.4, p.z, 8);
      world.userData.smash(p);
      audio.smash(false);
      hud.cred(run.cred, run.combo);
    }
    for (const s of out.picked) {
      likesGot++;
      pickups.eaten(s);
      effects.chaff(s.x, s.y, s.z);
      audio.like(streak++);
      streakTimer = 0.6;
      hud.likes(likesGot);
    }
    if (out.stray) {
      effects.confetti(out.stray.x, out.stray.y + 0.3, out.stray.z);
      audio.chime();
      hud.pack(String(run.pack.cats.length), true);
      hud.banner('A NEW CAT!', 'gold');
      hud.toast(`+1 cat · ${out.stray.name} · ${run.pack.cats.length} in the pack`, 3.5);
      hud.quip(say('stray'));
      save();
    }
    if (out.gpu) {
      const n = found();
      effects.confetti(out.gpu.x, out.gpu.y, out.gpu.z);
      audio.golden();
      hud.gold(n, run.gpus.length);
      if (n === run.gpus.length) {
        hud.banner(`EVERY GOLDEN KEY!\n${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`, 'gold');
        hud.quip(say('won'));
        saved = storage.finished(elapsed);
        enter('won');
      } else {
        hud.banner('GOLDEN KEY!', 'gold');
        hud.toast(`★ ${out.gpu.name} · ${n} of ${run.gpus.length}`, 3.5);
        hud.quip(say('gpu'));
      }
      save();
    }
    if (out.sharpened) {
      hud.patience(run.patience);
      hud.toast(`Rest stop · ${out.sharpened.name}`);
      hud.quip(say('sharpened'));
      audio.hiss();
      save();
    }
    if (out.district) {
      if (!seen.has(out.district.name)) {
        seen.add(out.district.name);
        hud.toast(out.district.name, 2.2);
        hud.quip(say('district', { district: out.district.name }));
        audio.chime();
      }
      hud.place(out.district.name);
    }
    if (out.outcome) lose(out.outcome);
  }

  function update(dt, presses) {
    const stick = input.stick();
    const look = input.view(dt);
    view.turn(look.turn, look.tilt);
    view.zoomBy(look.zoom);
    if (state === 'title') view.aim.yaw += TITLE_TURN * dt;
    else playZoom = view.aim.zoom;
    view.step(dt);

    for (const p of presses) {
      if (p === 'mute') hud.muted(audio.toggleMute());
      if (p === 'swing' && state === 'play' && !paused) swingWanted = true;
      if (p === 'jump' && state === 'play' && !paused) jumpWanted = true;
      if (p === 'home') {
        view.reset();
        if (state === 'title') view.aim.zoom = TITLE_ZOOM;
      }
      if (p === 'pause' && state !== 'title') {
        paused = !paused;
        hud.paused(paused);
        if (paused) audio.stopMusic(); else audio.startMusic();
        if (paused) save();
      }
      if (p === 'start' && state === 'title') start();
      if ((p === 'start' || p === 'tap') && state === 'won' && timer > 2) {
        hud.banner(null);
        enter('play');
      }
    }
    if (paused) {
      audio.rolling(0, false);
      return;
    }

    timer += dt;
    const push = state === 'play' ? toGround(stick, view.yaw) : [0, 0];
    const boosting = input.boost();
    accumulator = Math.min(accumulator + dt, STEP * 12);
    while (accumulator >= STEP) {
      accumulator -= STEP;
      physics(state === 'play' ? push : [0, 0], state === 'play' && boosting);
    }

    const b = run.ball;
    switch (state) {
      case 'play':
      case 'won':
        elapsed += dt;
        hud.clock(elapsed);
        if (timer > 1 && hud.bannerShown && state === 'play') hud.banner(null);
        saveTimer += dt;
        if (saveTimer > 10) { saveTimer = 0; save(); }
        break;
      case 'lost':
        elapsed += dt;
        if (timer > 1.6) {
          if (lostHow === 'sunk') putBack(run);
          else respawn(run);
          hud.banner(null);
          hud.patience(run.patience);
          enter('play');
        }
        break;
    }
    streakTimer -= dt;
    if (streakTimer <= 0) streak = 0;

    // The lantern over the ball, and the lamps round it.
    stage.focus.set(b.x, b.y, b.z);
    lampTimer -= dt;
    if (lampTimer <= 0) { lampTimer = 0.2; lightUp(b.x, b.z); }

    // The lady, walking on the ball.
    const speed = Math.hypot(b.vx, b.vz);
    lady.update(dt, run.time, b, { down: state === 'lost' && lostHow !== 'sunk', pushing: state === 'play' && (stick.x !== 0 || stick.y !== 0) });
    hud.accel(run.accel, run.winded);
    if (state === 'lost' && lostHow === 'sunk') lady.group.position.y = b.y - b.r - Math.min(1, timer / 0.8) * 0.8;

    world.userData.uncover(b, dt);
    xray.update(dt, b, stage.camera.position, run.map, true);
    run.traffic.sync(stage.target);
    run.hazards.sync(dt, run.time);
    const camera = stage.camera;
    seeing.frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    run.crowd.sync(dt, run.time, seeing);
    run.pack.sync(dt, run.time, seeing);
    pickups.sync(dt, run.time);
    effects.update(dt);
    audio.rolling(state === 'play' && b.grounded ? speed : 0, b.grounded);
    audio.fighting(state === 'play' && run.pack.cats.some((c) => run.time - c.struck < 1) ? 1 : 0);
    if (state !== 'title') {
      hud.minimap({ ball: b, yaw: view.yaw, cars: run.traffic.cars, gpus: run.gpus, strays: run.strays, stones: run.stones, foes: run.crowd.foes, seen });
    }

    // The camera: after the ball.
    const target = stage.target;
    if (debug.look) {
      target.set(...debug.look.at);
      view.zoom = view.aim.zoom = debug.look.zoom;
      return;
    }
    const k = 1 - Math.exp(-(state === 'title' ? 2 : 6) * dt);
    target.x += (b.x - target.x) * k;
    target.y += (b.y - target.y) * k;
    target.z += (b.z - target.z) * k;
  }

  /** For the console and screenshots: the run, a camera override (`look`), and a way to jump about. */
  const debug = {
    stage, look: null,
    get run() { return run; },
    get ball() { return run.ball; },
    teleport(x, z) {
      const y = (run.map.topAt(x, z) ?? 0) + run.ball.r + 0.05;
      run.ball.x = x; run.ball.y = y; run.ball.z = z;
      run.ball.vx = run.ball.vy = run.ball.vz = 0;
      stage.target.set(x, y, z);
    },
  };

  reset();
  showTitle();

  return {
    update,
    start,
    /**
     * Everybody who can turn up, by the name of their model, in the order to
     * bake them in: the lady, the cats, whoever is placed, then the people of
     * the district she is in, then the rest. (The people are made as she
     * walks, so nobody is in the crowd to ask until they are baked.)
     */
    cast() {
      const b = run.ball, here = run.map.districtAt(b.x, b.z)?.name;
      const models = (table) => Object.keys(table ?? {}).map((kind) => FOES[kind].model);
      const order = [LADY, ...CAT_MODELS, ...run.crowd.foes.map((f) => f.stats.model), ...models(TABLES[here]), ...Object.values(TABLES).flatMap(models)];
      return [...new Set(order)];
    },
    /**
     * One of everything that comes into view later than the first frame, to
     * draw once beforehand (`stage.warm`): a triangle in each of the people's
     * materials (laid out as their meshes are), and each kind of flying bit.
     */
    samples() {
      const triangle = new GFX.BufferGeometry();
      for (const name of ['position', 'normal', 'color']) triangle.setAttribute(name, new GFX.BufferAttribute(new Float32Array(9), 3));
      const people = this.cast().flatMap((name) => materialsOf(GFX, CAST[name]).map((m) => new GFX.Mesh(triangle, m)));
      return [...people, ...effects.samples()];
    },
    startOver: () => start({ fresh: true }),
    get state() { return state; },
    get paused() { return paused; },
    /** Where the ball is on the screen, in CSS pixels, for the pointer controls. */
    marbleOnScreen(rect) {
      const b = run.ball;
      const v = new GFX.Vector3(b.x, b.y, b.z).project(stage.camera);
      return { x: rect.left + (v.x + 1) / 2 * rect.width, y: rect.top + (1 - v.y) / 2 * rect.height };
    },
    debug,
  };
}

/**
 * The ball, seen through what's in front of it: when a house or a tank is
 * between the camera and the ball, a ring where the ball is, drawn over
 * everything, so the ball is never lost behind the scenery.
 */
function createXray(GFX) {
  let map = null;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(140, 200, 255, 0.18)';
    g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(200, 235, 255, 0.95)';
    g.lineWidth = 7;
    g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.stroke();
    // A little paw print, to say where she is.
    g.fillStyle = 'rgba(240, 200, 220, 0.95)';
    g.beginPath(); g.ellipse(64, 70, 15, 12, 0, 0, Math.PI * 2); g.fill();
    for (const [x, y] of [[44, 50], [56, 40], [72, 40], [84, 50]]) { g.beginPath(); g.ellipse(x, y + 6, 6, 8, 0, 0, Math.PI * 2); g.fill(); }
    map = new GFX.CanvasTexture(c);
    map.colorSpace = GFX.SRGBColorSpace;
  }
  const material = new GFX.SpriteMaterial({ map, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const sprite = new GFX.Sprite(material);
  sprite.renderOrder = 1000;
  sprite.visible = false;
  let shown = 0;
  // (A little round each point, for the eaves.)
  const ROUND = [[0, 0], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]];
  // Only the big cylinders (tanks) hide the ball; the map's are fixed, so they are picked out once.
  let big = [], bigOf = null;
  return {
    sprite,
    update(dt, b, eye, townMap, visible) {
      if (bigOf !== townMap) { bigOf = townMap; big = townMap.cylinders.filter((c) => c.r > 1.5); }
      // Along the line from the eye to the ball, is anything standing higher than the line?
      let hidden = false;
      const dx = b.x - eye.x, dy = b.y - eye.y, dz = b.z - eye.z;
      const far = Math.hypot(dx, dy, dz);
      for (let d = 0.2; d < far && !hidden; d += 0.25) {
        if (d < b.r * 2.5) continue;
        const x = b.x - dx * (d / far), y = b.y - dy * (d / far), z = b.z - dz * (d / far);
        for (const [ox, oz] of ROUND) if ((townMap.heightAt(x + ox, z + oz) ?? -Infinity) > y + 0.05) { hidden = true; break; }
        if (!hidden) for (const c of big) if (c.y1 > y && Math.hypot(x - c.x, z - c.z) < c.r) { hidden = true; break; }
      }
      shown += ((hidden && visible ? 1 : 0) - shown) * Math.min(1, dt * 10);
      material.opacity = shown;
      sprite.visible = shown > 0.02;
      sprite.position.set(b.x, b.y, b.z);
      sprite.scale.setScalar(b.r * 2.1);
    },
  };
}
