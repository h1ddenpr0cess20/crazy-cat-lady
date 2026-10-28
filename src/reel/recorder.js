import '../styles.css';

import { createAudio } from '../audio.js';
import { CAT_MODELS } from '../pack.js';
import { createGame } from '../game.js';
import { createHud } from '../hud.js';
import { STEP, stepRun } from '../run.js';
import { MODEL as LADY } from '../lady.js';
import { FOES } from '../foes.js';
import { preload, ready } from '../cast/library.js';
import { bakeAll } from '../models/library.js';
import { TABLES } from '../spawns.js';
import { createStage } from '../stage.js';
import { createStorage } from '../storage.js';
import { createTown } from '../town.js';
import { createRecorder } from './core.js';

/**
 * Crazy Cat Lady, for the reels (reel.html; the filming is core.js): the game
 * built as main.js builds it, with nobody's hands on it. There are no levels
 * in an open city, so a "level" is a scene: a spot in one of the districts,
 * the lady wandering about it in a slow circle with the pack of twelve she has
 * by now, and a crowd of that district's people made close round her, three
 * times as many as usual, so the cats always have somebody to swarm. Each
 * lasts `SCENE` seconds. The reels are the best stretches of them.
 */

/** Where each scene is: a rest stop's open ground in each part of town. */
export const SPOTS = [
  { name: 'Kennel Square', at: [126.5, 46.5] },
  { name: 'Meme Square', at: [111.5, 131.5] },
  { name: 'The Quad', at: [188.5, 40.5] },
  { name: 'Zoomie Valley', at: [165.5, 145.5] },
  { name: 'Sardine Bay', at: [96.5, 188.5] },
  { name: 'Kibble Works', at: [134.5, 214.5] },
  { name: 'Pound Gate', at: [46.5, 93.5] },
  { name: 'Whisker Heights', at: [31.5, 31] },
];

/** How long each scene lasts, in seconds, and how much more crowded than usual, and how near, the crowd is made. */
const SCENE = 42;
const CROWD = { density: 3, near: 5, far: 12 };

/** Seconds the scene runs before the film starts. */
const WARM = 3;

/** How close the camera is (the game's usual is 1; smaller is nearer). */
const ZOOM = 0.65;

const town = createTown();
/** Six strays taken in already, so the pack is twelve. */
const store = (() => {
  const data = new Map([['crazy-cat-lady.v1', JSON.stringify({ strays: town.strays.slice(0, 6).map((s) => s.name) })]]);
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
})();

let told = 0, scene = 0;

createRecorder({
  async ready() {
    // Everybody who can turn up in these districts, and the lady and the cats.
    const kinds = new Set();
    for (const s of SPOTS) {
      const table = TABLES[town.districtAt(...s.at)?.name];
      for (const k of Object.keys(table ?? {})) kinds.add(FOES[k].model);
    }
    const names = [LADY, ...CAT_MODELS, ...kinds];
    preload(names);
    await Promise.all(names.map((n) => ready(n, 0.5)));
    await Promise.all(['400 20px Anton', '500 20px "Barlow Condensed"', '700 20px "Barlow Condensed"'].map((f) => document.fonts.load(f)));
  },

  createAudio,
  quiet: ['rolling', 'fighting'],

  async build({ audio }) {
    const hud = createHud(document.body, { onStart() {} });
    hud.muted(false);
    const input = {
      stick: () => ({ x: 0, y: 0 }),
      view: () => ({ turn: 0, tilt: 0, zoom: 1 }),
      take: () => [],
      boost: () => false,
      get pointing() { return false; },
    };
    const stage = await createStage(document.getElementById('view'));
    await bakeAll(stage.GFX);
    const game = createGame({ stage, hud, input, audio, storage: createStorage(store) });
    stage.warm(game.samples());
    return { game, stage, GFX: stage.GFX };
  },

  start(game, level) {
    scene = level;
    const spot = SPOTS[level];
    game.start();
    const { run } = game.debug;
    game.debug.shoos.length = 0;
    told = 0;
    game.debug.teleport(...spot.at);
    run.pack.gather(...spot.at);
    run.crowd.clear(...spot.at);
    run.crowd.tune(CROWD);
    // Three seconds on, with nobody watching, so there is a crowd and the cats are into it from the first frame.
    for (let t = 0; t < WARM; t += STEP) stepRun(run, [0, 0], STEP);
    // Close in, for a phone held upright: the cats are small.
    game.debug.stage.view.aim.zoom = ZOOM;
  },
  // The lady wanders round in a slow circle; the cats do the rest.
  pilot: (game) => ({
    next() {
      const { ball, time } = game.debug.run;
      const a = time * 0.9;
      // A slow circle, drawn back toward where the scene is if she wanders off it.
      const [hx, hz] = SPOTS[scene].at, dx = hx - ball.x, dz = hz - ball.z, d = Math.hypot(dx, dz);
      const home = Math.min(0.6, Math.max(0, d - 2) * 0.25);
      return { push: [Math.cos(a) * 0.3 + (dx / (d || 1)) * home, Math.sin(a) * 0.3 + (dz / (d || 1)) * home] };
    },
    // She is hit by nobody in a reel: the film is the cats.
    saw() { game.debug.run.patience = 100; },
    stuck: null,
  }),
  attach: (game, pilot) => { game.debug.pilot = pilot; },
  ball: (game) => game.debug.ball,
  name: () => SPOTS[scene].name,
  state: (game) => game.state,
  phase: (game) => (game.debug.run.time > SCENE ? 'end' : game.state === 'play' ? 'live' : 'wait'),
  presses: () => [],
  steering: (game) => game.state === 'play',

  /** Each foe shooed, by how: a swarm is worth more. */
  notes(game) {
    const out = [];
    for (; told < game.debug.shoos.length; told++) out.push(game.debug.shoos[told] === 'swarm' ? 'swarm' : 'shoo');
    return out;
  },

  music: (audio) => audio.startMusic(),

  card: {
    logo: '<h1 class="crest">CRAZY<br>CAT LADY</h1><p class="tag">a lady, her cats, and a city of dog people</p>',
    url: 'crazy-cat-lady.vercel.app',
  },
  theme: {
    display: 'Anton, Impact, "Arial Narrow Bold", sans-serif',
    body: '"Barlow Condensed", "Arial Narrow", system-ui, sans-serif',
    accent: '#d8402e',
    'accent-dark': '#6a1e18',
    'accent-2': '#ffd23a',
    cool: '#ff8ac0',
    dim: '#d8c8b0',
    'pill-top': '150px',
    'pill-size': '14px',
    'url-size': '24px',
    'cta-size': '19px',
  },
});
