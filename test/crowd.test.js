import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as GFX from 'madness-engine/gfx';
import { CAST } from '../src/cast/index.js';
import { bake, createModel } from 'madness-engine/models/model';
import { FOES } from '../src/foes.js';
import { TownMap } from '../src/map.js';
import { QUIPS, say } from '../src/quips.js';
import { COMBO, createRun, respawn, PATIENCE, STEP, stepRun } from '../src/run.js';
import { grade, SWARM } from '../src/claws.js';
import { MOST, START } from '../src/pack.js';
import { DENSITY, RING, TABLES } from '../src/spawns.js';
import { placeBall } from 'madness-engine/physics';
import { createTown } from '../src/town.js';

/** A level yard with one pauser standing 6 tiles down the +x road from the start. */
function yard(...foes) {
  const m = new TownMap({ name: 'yard', cols: 90, rows: 30 });
  m.flat(0, 0, 90, 30, 0, { surface: 'concrete' });
  m.start = { x: 3, z: 10 };
  for (const [kind, x, z] of foes) m.foe(kind, x, z, { range: 0 });
  m.district('Yard', 0, 0, 90, 30, '#888');
  return m;
}

test('every foe is somebody the cast can be sculpted as', () => {
  for (const [kind, f] of Object.entries(FOES)) {
    assert.ok(CAST[f.model], `${kind} needs ${f.model}`);
    assert.ok(f.name && f.blurb && f.shout, kind);
    assert.ok(f.toughness > 0 && f.power > 0 && f.hype > 0 && f.radius > 0 && f.speed > 0, kind);
  }
});

test('the people dressed for the city bake and move', () => {
  for (const name of ['pauser', 'eurocrat']) {
    const data = bake(CAST[name], { detail: 0.5 });
    assert.ok(data.count > 500 && data.count <= CAST[name].budget, `${name}: ${data.count} vertices`);
    const m = createModel(GFX, CAST[name], { detail: 0.5 });
    for (const clip of ['idle', 'walk', 'attack', 'ko']) m.pose({ clip, t: 0.3, time: 1.2, seed: 1, speed: 1 });
  }
});

test('the map places only the bosses and the troll; everybody else comes from a district\'s table', () => {
  const town = createTown();
  assert.deepEqual(town.foes.map((f) => f.kind).sort(), ['billionaire', 'edgecase', 'prophet', 'troll']);
  for (const f of town.foes) {
    const h = town.heightAt(f.x, f.z);
    assert.notEqual(h, null, `${f.kind} at ${f.x},${f.z}`);
    for (const s of town.solids) {
      const inside = f.x > s.min[0] && f.x < s.max[0] && f.z > s.min[2] && f.z < s.max[2] && h + 0.3 > s.min[1] && h + 0.3 < s.max[1];
      assert.ok(!inside, `${f.kind} at ${f.x.toFixed(1)},${f.z.toFixed(1)} is inside something`);
    }
  }
  for (const d of town.districts) {
    assert.ok(TABLES[d.name], `${d.name} has a table`);
    assert.ok(DENSITY[d.name] > 0, `${d.name} has a density`);
  }
  const tabled = new Set();
  for (const table of Object.values(TABLES)) for (const [kind, w] of Object.entries(table)) { assert.ok(FOES[kind] && !FOES[kind].boss && w > 0, kind); tabled.add(kind); }
  // Everybody in the roster turns up somewhere, but the bosses and the troll, who are placed.
  for (const k of Object.keys(FOES)) if (!['prophet', 'billionaire', 'edgecase', 'troll'].includes(k)) assert.ok(tabled.has(k), `nobody is a ${k}`);
  for (const k of ['pauser', 'doomer', 'altruist', 'rationalist', 'anarchist', 'eurocrat', 'striker', 'accelerationist', 'replyguy']) assert.ok(tabled.has(k), k);
});

test('they are made as she walks: round her, out of sight, on open ground, as many as her district wants, and the same every time', () => {
  const town = createTown();
  const kinds = () => {
    const run = createRun(GFX, { map: town });
    const fixed = run.crowd.foes.length;
    for (let t = 0; t < 30; t += STEP) stepRun(run, [0, 0], STEP);
    return { run, fixed, made: run.crowd.foes.slice(fixed) };
  };
  const { run, fixed, made } = kinds();
  const here = town.districtAt(run.ball.x, run.ball.z).name;
  assert.equal(here, 'Whisker Heights');
  assert.ok(made.length >= DENSITY[here] - 2 && made.length <= DENSITY[here] + 2, `${made.length} made, wanted ${DENSITY[here]}`);
  for (const f of made) {
    const d = Math.hypot(f.home[0] - run.ball.x, f.home[2] - run.ball.z);
    assert.ok(d >= RING.near - 0.5, `made ${d.toFixed(1)} tiles away, in sight`);
    assert.ok(TABLES[town.districtAt(f.home[0], f.home[2]).name][f.kind], `${f.kind} isn't from the table of where it was made`);
    assert.notEqual(town.heightAt(f.home[0], f.home[2]), null);
  }
  assert.equal(fixed, 4, 'the bosses and the troll, placed');
  assert.deepEqual(kinds().made.map((f) => f.kind), made.map((f) => f.kind), 'the same people, the same way');
  // Walk away, and what she has left behind is unmade.
  const first = made.slice();
  placeBall(run.ball, 200.5, 0.4, 100.5);
  for (let t = 0; t < 5; t += STEP) stepRun(run, [0, 0], STEP);
  assert.ok(first.every((f) => !run.crowd.foes.includes(f)), 'they went');
  assert.ok(run.crowd.foes.length > 0);
});

test('bosses are placed, not made, and stay where they stand', () => {
  const run = createRun(GFX, { map: createTown() });
  assert.equal(run.crowd.foes.filter((f) => f.stats.boss).length, 3);
  assert.ok(run.crowd.foes.every((f) => !f.spawned));
});

test('with foes off, nobody is made either', () => {
  const run = createRun(GFX, { map: createTown(), foes: false });
  for (let t = 0; t < 5; t += STEP) stepRun(run, [0, 0], STEP);
  assert.equal(run.crowd.foes.length, 0);
});

/** Step with nobody pushing, `seconds` long; returns every step's output. */
function wait(run, seconds) {
  const outs = [];
  for (let t = 0; t < seconds; t += STEP) outs.push(stepRun(run, [0, 0], STEP));
  return outs;
}

test('the cats go for a pauser that comes near, claw it, and shoo it; the lady is not touched', () => {
  const run = createRun(GFX, { map: yard(['pauser', 9.5, 10.5]) });
  run.crowd.foes[0].range = 8;
  const outs = wait(run, 12);
  const shoos = outs.flatMap((o) => o.shoos);
  assert.equal(shoos.length, 1);
  assert.ok(['shoo', 'swarm'].includes(shoos[0].grade), shoos[0].grade);
  assert.ok(outs.flatMap((o) => o.claws).length >= 3, 'it took a few claws');
  assert.ok(run.cred >= FOES.pauser.hype);
  assert.equal(run.smashed, 1);
  assert.ok(run.crowd.foes[0].dead);
  assert.equal(run.patience, PATIENCE, 'shooing costs her nothing');
});

test('the lady rolling into a foe smashes nothing: it bounces off, and costs her some patience', () => {
  const run = createRun(GFX, { map: yard(['rationalist', 6.5, 10.5]) });
  run.pack.cats.length = 0;
  const outs = [];
  for (let t = 0; t < 2.2; t += STEP) outs.push(stepRun(run, [1, 0], STEP, { boost: true }));
  assert.equal(outs.flatMap((o) => o.shoos).length, 0);
  assert.ok(outs.flatMap((o) => o.knocks).length >= 1);
  assert.ok(run.patience < PATIENCE, `${run.patience}`);
  assert.equal(run.smashed, 0);
});

test('they come at the lady when she comes near, and shout once', () => {
  const run = createRun(GFX, { map: yard(['doomer', 8.5, 10.5]) });
  const f = run.crowd.foes[0];
  f.range = 8;
  const start = f.ball.x;
  const outs = [];
  for (let t = 0; t < 1.5; t += STEP) outs.push(stepRun(run, [0, 0], STEP));
  assert.ok(f.ball.x < start - 0.3, 'it walks toward the lady');
  assert.equal(outs.flatMap((o) => o.shouts).length, 1);
});

test('shoos one after another build a combo that multiplies the purrs', () => {
  const run = createRun(GFX, { map: yard(['pauser', 8.5, 10.5], ['pauser', 8.5, 12.5], ['pauser', 8.5, 8.5]) });
  for (const f of run.crowd.foes) f.range = 8;
  const hits = wait(run, 14).flatMap((o) => o.shoos);
  assert.equal(hits.length, 3);
  assert.ok(run.bestCombo >= 2, `${run.bestCombo}`);
  assert.ok(run.cred > FOES.pauser.hype * 3, `${run.cred}`);
  assert.ok(COMBO.most >= 3);
});

test('claws: a swarm of four or more cats is worth double, and a lone foe takes toughness times two to shoo', () => {
  assert.equal(grade(1).name, 'shoo');
  assert.equal(grade(SWARM).name, 'swarm');
  assert.equal(grade(SWARM).hype, 2);
  const run = createRun(GFX, { map: yard(['altruist', 12.5, 10.5]) });
  assert.equal(run.crowd.foes[0].hp, FOES.altruist.toughness * 2);
  const cat = run.pack.cats[0];
  for (let i = 0; i < FOES.altruist.toughness * 2 - 1; i++) assert.equal(run.crowd.claw(run.crowd.foes[0], cat, 1, [1, 0], 1), null);
  const e = run.crowd.claw(run.crowd.foes[0], cat, 1, [1, 0], 1);
  assert.equal(e.type, 'shoo');
});

test('a shooed foe is gone after a moment, and nobody is simulated far from the lady', () => {
  const run = createRun(GFX, { map: yard(['pauser', 8.5, 10.5], ['doomer', 78.5, 27.5]) });
  run.crowd.foes[0].range = 8;
  const far = run.crowd.foes[1];
  const was = [far.ball.x, far.ball.z];
  wait(run, 14);
  assert.ok(run.crowd.foes[0].gone);
  assert.deepEqual([far.ball.x, far.ball.z], was);
});

test('the lady always has something to say', () => {
  for (const k of Object.keys(QUIPS).filter((k) => k !== 'district')) assert.ok(say(k).length > 3, k);
  for (const d of createTown().districts) assert.ok(say('district', { district: d.name }).length > 3, d.name);
});

test('the pack is six cats to begin with, trots after her, and keeps up when she hurries', () => {
  const run = createRun(GFX, { map: yard() });
  assert.equal(run.pack.cats.length, START);
  for (let t = 0; t < 6; t += STEP) stepRun(run, [1, 0], STEP, { boost: true });
  assert.ok(run.ball.x > 20);
  for (const c of run.pack.cats) assert.ok(Math.hypot(c.ball.x - run.ball.x, c.ball.z - run.ball.z) < 6, `a cat is ${Math.hypot(c.ball.x - run.ball.x, c.ball.z - run.ball.z).toFixed(1)} tiles behind`);
});

test('she can swing her spoon herself: it hits all round her, shoves, shoos, and has to be waited for', () => {
  const run = createRun(GFX, { map: yard(['pauser', 4.4, 10.5], ['pauser', 3.5, 11.6], ['doomer', 30.5, 10.5]) });
  run.pack.cats.length = 0;
  const far = run.crowd.foes[2];
  // They were moved off the start; bring the two up beside her.
  placeBall(run.crowd.foes[0].ball, 4.5, 0.37, 10.5);
  placeBall(run.crowd.foes[1].ball, 3.5, 0.37, 11.5);
  const first = stepRun(run, [0, 0], STEP, { swing: true });
  assert.ok(first.swung);
  assert.equal(first.swingHit, 2, 'both near ones, not the far one');
  assert.ok(run.crowd.foes[0].hp < FOES.pauser.toughness * 2 && far.hp === FOES.doomer.toughness * 2);
  assert.ok(run.crowd.foes[0].ball.vx > 1, 'shoved away from her');
  // Her arm isn't ready again straight away.
  assert.ok(!stepRun(run, [0, 0], STEP, { swing: true }).swung);
  const shoos = [];
  for (let t = 0; t < 4; t += STEP) shoos.push(...stepRun(run, [0, 0], STEP, { swing: t % 0.8 < STEP }).shoos);
  assert.equal(shoos.length, 2, 'a few swings and both are shooed');
  assert.ok(run.cred >= FOES.pauser.hype * 2);
});

test('the cats keep out of each other\'s way, standing about and following', () => {
  const run = createRun(GFX, { map: yard() });
  let closest = Infinity;
  for (let t = 0; t < 12; t += STEP) {
    stepRun(run, t < 6 ? [0, 0] : [1, 0], STEP);
    if (t < 2) continue;
    const cs = run.pack.cats;
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) closest = Math.min(closest, Math.hypot(cs[i].ball.x - cs[j].ball.x, cs[i].ball.z - cs[j].ball.z));
  }
  assert.ok(closest > 0.3, `two cats were ${closest.toFixed(2)} tiles apart`);
});

test('a stray joins the pack when she comes to it, once, and it is the coat it was sitting in', () => {
  const m = yard();
  m.stray('Tabby', 8.5, 10.5);
  const run = createRun(GFX, { map: m });
  assert.equal(run.strays.length, 1);
  const outs = [];
  for (let t = 0; t < 3; t += STEP) outs.push(stepRun(run, [1, 0], STEP));
  assert.equal(outs.filter((o) => o.stray).length, 1);
  assert.equal(run.pack.cats.length, START + 1);
  assert.equal(run.pack.cats.at(-1).coat, run.strays[0].coat);
  // Already taken in on an earlier visit: it is not there, and the pack starts a cat bigger.
  const again = createRun(GFX, { map: m, adopted: ['Tabby'] });
  assert.ok(again.strays[0].got);
  assert.equal(again.pack.cats.length, START + 1);
});

test('the city has strays to find, each somewhere she can stand, and the pack can grow to take them all', () => {
  const town = createTown();
  assert.ok(town.strays.length >= 8, `${town.strays.length}`);
  assert.ok(START + town.strays.length <= MOST);
  for (const s of town.strays) {
    const h = town.heightAt(s.x, s.z);
    assert.notEqual(h, null, s.name);
    assert.ok(town.districtAt(s.x, s.z), `${s.name} is in a district`);
    assert.ok(town.isOpen(s.x, s.z, 0.5, { near: true }), `${s.name} has room to sit`);
  }
});

test('the cats knock over small things when there is nothing else to do, and she can\'t smash anything by walking into it', () => {
  const m = yard();
  m.place('bin', 7.5, 10.5).place('bench', 7.5, 13.5);
  const run = createRun(GFX, { map: m, foes: false });
  assert.equal(run.breakables.length, 2);
  assert.ok(run.breakables.every((p) => p.boxes.length > 0 && !p.broken));
  // Into the bin at a run: it is a wall.
  const walker = createRun(GFX, { map: m, foes: false });
  walker.pack.cats.length = 0;
  for (let t = 0; t < 3; t += STEP) stepRun(walker, [1, 0], STEP, { boost: true });
  assert.equal(walker.broke, 0);
  assert.ok(walker.ball.x < 7.5, 'it stopped at the bin');
  // Left to themselves, the cats get round to it.
  const outs = wait(run, 40);
  assert.ok(outs.flatMap((o) => o.breaks).length >= 1);
  const bin = run.breakables.find((p) => p.name === 'bin');
  assert.ok(bin.broken && bin.boxes.every((b) => !b.solid));
  assert.ok(run.cred >= bin.hype);
});

test('the city has furniture to knock over, and the signs and the statue are among it', () => {
  const town = createTown();
  assert.ok(town.breakables.length > 80, `${town.breakables.length}`);
  const run = createRun(GFX, { map: town, foes: false });
  for (const p of run.breakables) assert.ok(p.boxes.length > 0 && p.r > 0 && p.top > p.base, `${p.name} at ${p.x},${p.z}`);
  const kinds = new Set(town.breakables.map((p) => p.name));
  for (const k of ['streetlamp', 'tree', 'bench', 'placard', 'statue', 'charger']) assert.ok(kinds.has(k), k);
  // Knocking it over takes it out of the world, and a new run puts it back.
  const first = run.breakables[0];
  for (const box of first.boxes) box.solid = false;
  const again = createRun(GFX, { map: town, foes: false });
  assert.ok(again.breakables[0].boxes.every((b) => b.solid));
});

test('nobody is standing where the ball is put down: not at the start, not at a respawn', () => {
  const near = (run) => run.crowd.foes.filter((f) => !f.gone && Math.hypot(f.ball.x - run.ball.x, f.ball.z - run.ball.z) < f.ball.r + run.ball.r);
  const m = yard(['pauser', 3.5, 10.5], ['doomer', 3.9, 10.2]);
  m.whetstone('Stone', 20.5, 10.5);
  m.foe('striker', 20.9, 10.9, { range: 0 });
  const run = createRun(GFX, { map: m });
  assert.equal(near(run).length, 0, 'at the start');
  assert.equal(run.crowd.foes.filter((f) => f.gone).length, 0, 'moved, not removed');
  run.checkpoint = run.stones[0];
  respawn(run);
  assert.equal(near(run).length, 0, 'at the whetstone');
  assert.ok(run.crowd.foes.every((f) => f.home && Math.hypot(f.home[0] - f.ball.x, f.home[2] - f.ball.z) < 0.01), 'they call it home now');
});

test('the people the map places are never over the start or a whetstone', () => {
  const town = createTown();
  const spots = [[town.start.x + 0.5, town.start.z + 0.5], ...town.stones.map((s) => [s.x, s.z])];
  for (const f of town.foes) for (const [x, z] of spots) assert.ok(Math.hypot(f.x - x, f.z - z) > 2.2, `${f.kind} at ${f.x.toFixed(1)},${f.z.toFixed(1)}`);
});
