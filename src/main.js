import './styles.css';
import { createAudio } from './audio.js';
import { createGame } from './game.js';
import { createHud } from './hud.js';
import { createInput, PRESSES, padPresses } from 'madness-engine/input';
import { preload } from './cast/library.js';
import { bakeAll } from './models/library.js';
import { createStage } from './stage.js';
import { createStorage } from './storage.js';

const view = document.getElementById('view');
const audio = createAudio();
const wake = () => audio.wake();
addEventListener('pointerdown', wake);
addEventListener('keydown', wake);

let game = null;
const hud = createHud(document.body, {
  onStart: () => { audio.wake(); game?.start(); },
  onNew: () => { audio.wake(); game?.startOver(); },
});
hud.muted(audio.muted);
// A quick left click (or tap) swings the spoon, and a quick right click jumps; holding the left
// button walks toward the pointer, and dragging with the right turns the view, as before.
let down = null;
view.addEventListener('pointerdown', (e) => { down = e.isPrimary && (e.button === 0 || e.button === 2) ? { t: performance.now(), x: e.clientX, y: e.clientY, id: e.pointerId, press: e.button === 0 ? 'swing' : 'jump' } : null; });
view.addEventListener('pointerup', (e) => {
  if (down && down.id === e.pointerId && performance.now() - down.t < 250 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12) input.press(down.press);
  down = null;
});
view.addEventListener('pointercancel', () => { down = null; });
for (const name of ['swing', 'jump']) {
  document.getElementById(`${name}-touch`).addEventListener('pointerdown', (e) => { e.stopPropagation(); input.press(name); });
}
document.getElementById('mute').addEventListener('mute', () => hud.muted(audio.toggleMute()));

// Hurry is Shift (or the on-screen button, or the pad's A, X or right trigger) and nothing else: Space is
// the jump, so the input's own boost (which takes Space too) is not used.
const heldKeys = new Set();
addEventListener('keydown', (e) => { if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') heldKeys.add(e.code); });
addEventListener('keyup', (e) => heldKeys.delete(e.code));
addEventListener('blur', () => heldKeys.clear());
let touchHurry = false;
const hurryButton = document.getElementById('accel-touch');
hurryButton.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); touchHurry = true; });
for (const type of ['pointerup', 'pointercancel', 'pointerleave']) hurryButton.addEventListener(type, () => { touchHurry = false; });
const padHurry = () => [...(navigator.getGamepads?.() ?? [])].some((p) => p && [0, 2, 7].some((i) => p.buttons[i]?.pressed));
const hurry = () => heldKeys.size > 0 || touchHurry || padHurry();

const input = createInput(view, {
  presses: { ...PRESSES, Space: ['start', 'jump'], KeyF: 'swing', KeyK: 'jump' },
  padPresses: (b, sx, sy) => ({ ...padPresses(b, sx, sy), swing: b(3) || b(5), jump: b(1) }),
  anchor: () => game?.marbleOnScreen(view.getBoundingClientRect()),
});

try {
  const stage = await createStage(view);
  // The models bake in the background while the title waits, with a bar for how far it has got.
  const bar = document.getElementById('loading');
  bar.hidden = false;
  await bakeAll(stage.GFX, (k) => { bar.style.setProperty('--done', `${Math.round(k * 100)}%`); });
  // What the game asks of the controls: the input's, with hurry as above.
  const controls = { stick: () => input.stick(), view: (dt) => input.view(dt), take: () => input.take(), boost: hurry };
  game = createGame({ stage, hud, input: controls, audio, storage: createStorage() });
  globalThis.crazyCatLady = game;
  // Every shader there will be is compiled now, behind the bar, not the first time somebody comes into view.
  stage.warm(game.samples());
  bar.hidden = true;
  // The people bake in the background, nearest the ball first, and take their places as they are done.
  preload(game.cast());

  let last = performance.now();
  stage.renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    stage.pace(dt);
    game.update(dt, input.take());
    stage.look();
    stage.render();
  });
} catch (err) {
  const box = document.getElementById('error');
  box.hidden = false;
  box.textContent = 'Crazy Cat Lady could not start: this browser offers neither WebGPU nor WebGL 2.\n\n'
    + String(err && err.message ? err.message : err);
  console.error(err);
}
