import goldKey from 'madness-engine/props/key';
import { createKit } from 'madness-engine/kit';
import { createModel, createStatic } from 'madness-engine/models/model';
import { CAST } from './cast/index.js';
import { isBaked } from './cast/library.js';
import { SIZE } from './pack.js';
import { mergeCopies } from './placed.js';

/**
 * What there is to pick up, as it looks:
 *
 * - likes, cartons of milk standing about in lines (the library's grocery
 *   `milk`) — drawn in chunks of the map, each chunk redrawn when a like in it
 *   is collected;
 * - golden keys (the library's key), big, spinning, with a shaft of light
 *   going up from each so they can be seen across the city;
 * - strays, cats sitting about waiting to be taken in (until they are);
 * - rest stops (the stands are placed models, see `map.krystal`): a
 *   painted pad in front of each, where her patience comes back.
 */

const CHUNK = 16;

/** What the likes are, and how much bigger than sculpted it is drawn (a little, and no two quite alike, so a line of them isn't a fence). */
const LIKE = 'milk';
const scaleOf = (i) => 1.2 + ((i * 7) % 5) * 0.04;

export function createPickups(GFX, run) {
  const group = new GFX.Group();
  group.name = 'pickups';
  // The cartons are lit a little more than what's round them, so they can be seen in the dark.
  const lit = run.built?.light ?? (() => [1, 1, 1]);
  const light = (x, y, z) => lit(x, y, z).map((v) => Math.max(0.85, v * 1.2));

  // Likes, by chunk: each is a carton of milk, turned the same way every time.
  const chunks = new Map();
  for (const [i, s] of run.likes.entries()) {
    const key = `${Math.floor(s.x / CHUNK)},${Math.floor(s.z / CHUNK)}`;
    if (!chunks.has(key)) chunks.set(key, { seeds: [], meshes: [] });
    chunks.get(key).seeds.push({ s, scale: scaleOf(i), angle: (i * 2.399) % (Math.PI * 2) });
  }
  const drawChunk = (chunk) => {
    for (const mesh of chunk.meshes) group.remove(mesh);
    // Every carton left in the chunk is one mesh.
    const copies = chunk.seeds.filter(({ s }) => !s.got).map(({ s, scale, angle }) => ({ x: s.x, y: s.y - 0.32 + 0.01, z: s.z, angle, scale }));
    chunk.meshes = copies.length ? [mergeCopies(GFX, LIKE, copies, light)] : [];
    for (const mesh of chunk.meshes) group.add(mesh);
  };
  for (const c of chunks.values()) drawChunk(c);

  // Golden GPUs.
  const beamMaterial = new GFX.MeshBasicMaterial({ name: 'beam', color: new GFX.Color('#ffd760'), transparent: true, opacity: 0.16, depthWrite: false, blending: GFX.AdditiveBlending, side: GFX.DoubleSide });
  const haloMaterial = new GFX.MeshBasicMaterial({ name: 'halo', color: new GFX.Color('#ffe08a'), transparent: true, opacity: 0.3, depthWrite: false, blending: GFX.AdditiveBlending });
  const beamGeometry = new GFX.CylinderGeometry(0.16, 0.34, 14, 16, 1, true);
  beamGeometry.translate(0, 7, 0);
  const golden = run.gpus.map((g, i) => {
    const holder = new GFX.Group();
    holder.position.set(g.x, g.y, g.z);
    const spin = new GFX.Group();
    const card = createStatic(GFX, goldKey);
    card.scale.multiplyScalar(0.9);
    card.position.y = -0.4;
    spin.add(card);
    const halo = new GFX.Mesh(new GFX.SphereGeometry(0.4, 16, 12), haloMaterial);
    const beam = new GFX.Mesh(beamGeometry, beamMaterial);
    beam.position.y = -0.3;
    holder.add(spin, halo, beam);
    holder.visible = !g.got;
    group.add(holder);
    return { g, holder, spin, halo, phase: i * 0.7 };
  });

  // The strays, sitting.
  const strays = run.strays.map((s, i) => {
    const holder = new GFX.Group();
    holder.position.set(s.x, s.y, s.z);
    holder.rotation.y = i * 2.1;
    holder.scale.setScalar(SIZE);
    return { s, holder, model: null, phase: i * 1.9, on: false };
  });

  // The pads the krystals stand beside.
  const padKit = createKit(GFX);
  for (const p of run.stones) {
    const y = p.y;
    padKit.cyl([p.x, y + 0.01, p.z], 0.62, 0.02, '#d8402e', { segments: 32 });
    padKit.cyl([p.x, y + 0.02, p.z], 0.5, 0.02, '#3a3e48', { segments: 32 });
    padKit.cyl([p.x, y + 0.03, p.z], 0.2, 0.02, '#aab2c2', { segments: 24 });
  }
  if (!padKit.empty) group.add(padKit.build({ name: 'krystal-pads' }));

  return {
    group,
    /** A like was collected: redraw its chunk. */
    eaten(s) {
      const c = chunks.get(`${Math.floor(s.x / CHUNK)},${Math.floor(s.z / CHUNK)}`);
      if (c) drawChunk(c);
    },
    sync(dt, time) {
      for (const o of strays) {
        const show = !o.s.got;
        if (show && !o.model && isBaked(`cat-${o.s.coat}`, 0.5)) {
          o.model = createModel(GFX, CAST[`cat-${o.s.coat}`], { detail: 0.5 });
          o.holder.add(o.model.group);
        }
        if (show && o.model && !o.on) { o.on = true; group.add(o.holder); }
        if (!show && o.on) { o.on = false; group.remove(o.holder); }
        if (o.on) {
          // Waiting about to be taken in: mostly sitting, now and then looking round, or curled up asleep.
          const s = Math.sin(time * 0.4 + o.phase);
          o.model.pose({ clip: s > 0.6 ? 'look' : s < -0.8 ? 'sleep' : 'sit', t: 0, time, seed: o.phase, pace: 0, speed: 1 });
        }
      }
      for (const o of golden) {
        o.holder.visible = !o.g.got;
        if (o.g.got) continue;
        o.spin.rotation.y = time * 1.8 + o.phase;
        o.spin.position.y = Math.sin(time * 2.2 + o.phase) * 0.06;
        const k = 1 + Math.sin(time * 4 + o.phase) * 0.1;
        o.halo.scale.setScalar(k);
      }
    },
  };
}
