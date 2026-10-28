import { createScore, themeFor } from 'madness-engine/music/score';

/**
 * Every sound, made on the spot with Web Audio — no samples. Her footsteps
 * are a soft shuffle, filtered noise that rises with speed; the horns, the
 * mews, the claws, the shoos and the jingles are short synthesised bursts;
 * the music is Catroller's trio (`music/score`): a sneaky little jazz band
 * with a plucked bass walking, brushes and a vibraphone, all the way
 * through, title and city alike, the drums doubling up when the cats are
 * at somebody.
 *
 * Nothing can play until the page has had a click or a key (browsers insist),
 * so `wake()` is called on the first one.
 */

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

/** The key and pace the trio plays in (`themeFor`: the third room of Catroller's house). */
const SCORE = themeFor(3);

export function createAudio() {
  let ctx = null, master = null, sfx = null, music = null;
  let roll = null, noise = null, band = null, fight = 0;
  let muted = false;
  /** Whether the band should be playing. Set before the page has had its click, too. */
  let want = false;

  try { muted = localStorage.getItem('crazy-cat-lady.muted') === '1'; } catch {}

  function wake() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
    sfx = ctx.createGain();
    sfx.gain.value = 0.9;
    sfx.connect(master);
    music = ctx.createGain();
    music.gain.value = 0.7;
    music.connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const grind = ctx.createBiquadFilter();
    grind.type = 'bandpass';
    grind.frequency.value = 220;
    grind.Q.value = 0.9;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(grind).connect(low).connect(gain).connect(sfx);
    source.start();
    roll = { band: grind, gain };

    band = createScore(ctx, music, noise);
    playWanted();
  }

  function playWanted() {
    if (!band) return;
    if (!want) { band.stop(); return; }
    if (!band.playing) band.start(SCORE);
  }

  const now = () => ctx.currentTime;

  function burst({ at = 0, length = 0.1, type = 'lowpass', freq = 1000, q = 0.7, gain = 0.5, sweep = null }) {
    if (!ctx) return;
    gain = Math.max(0.0002, gain);
    const t = now() + at;
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + length);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    s.connect(f).connect(g).connect(sfx);
    s.start(t, Math.random() * 1.5);
    s.stop(t + length + 0.05);
  }

  function tone({ at = 0, freq = 440, to = null, length = 0.15, type = 'sine', gain = 0.3, out = sfx, attack = 0.005 }) {
    if (!ctx) return;
    gain = Math.max(0.0002, gain);
    const t = now() + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + length);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + length + 0.05);
  }

  return {
    wake,

    get muted() { return muted; },

    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('crazy-cat-lady.muted', muted ? '1' : '0'); } catch {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, now(), 0.05);
      return muted;
    },

    /** The shuffle of her slippers, every frame: speed in tiles a second, and whether she's on anything. */
    rolling(speed, grounded) {
      if (!roll) return;
      const level = grounded ? Math.min(0.26, speed * 0.028) : 0;
      roll.gain.gain.setTargetAtTime(level, now(), 0.05);
      roll.band.frequency.setTargetAtTime(380 + speed * 110, now(), 0.08);
    },

    /** A knock against the course, as hard as `speed`. */
    knock(speed) {
      const k = Math.min(1, speed / 12);
      if (k < 0.08) return;
      burst({ length: 0.07, freq: 700 + 900 * k, gain: 0.5 * k });
      tone({ freq: 140 + 60 * k, to: 60, length: 0.12, gain: 0.5 * k });
    },

    /** A car's horn, or a truck's. */
    honk(kind = 'car') {
      const [a, b, length] = kind === 'car' ? [415, 523, 0.32] : [185, 233, 0.6];
      for (const f of [a, b]) tone({ freq: f, length, type: 'square', gain: 0.07, attack: 0.01 });
      tone({ at: length * 0.6, freq: a, length: length * 0.5, type: 'square', gain: 0.05 });
    },

    /** The lady, knocked: a startled squeak. */
    squeak() {
      tone({ freq: 660, to: 190, length: 0.2, type: 'square', gain: 0.1 });
      tone({ at: 0.03, freq: 1240, to: 400, length: 0.14, type: 'triangle', gain: 0.07 });
    },

    /** Metal: a reel, a post, a stamp. */
    clunk(speed = 6) {
      const k = Math.min(1, speed / 8);
      tone({ freq: 220, to: 160, length: 0.25, type: 'triangle', gain: 0.25 * k });
      tone({ freq: 630, length: 0.18, gain: 0.08 * k });
      burst({ length: 0.05, freq: 1500, gain: 0.25 * k });
    },

    /** The ball flustered. */
    pop() {
      burst({ length: 0.12, type: 'highpass', freq: 1800, gain: 0.8 });
      tone({ freq: 320, to: 70, length: 0.25, gain: 0.5 });
      for (let i = 0; i < 8; i++) tone({ at: 0.05 + Math.random() * 0.25, freq: 900 + Math.random() * 1800, length: 0.05, type: 'triangle', gain: 0.06 });
      tone({ at: 0.35, freq: 2200, to: 1400, length: 0.25, gain: 0.08 });
    },

    /** Into the tar, or the sea. */
    gloop() {
      for (let i = 0; i < 6; i++) tone({ at: i * 0.12, freq: 140 + Math.random() * 90, to: 300, length: 0.09, gain: 0.25 });
    },

    /** A sprinkler going up under her: the hiss and the whump. */
    sizzle() {
      burst({ length: 0.5, type: 'bandpass', freq: 2800, q: 1.4, gain: 0.5 });
      tone({ freq: 110, to: 60, length: 0.3, gain: 0.35 });
    },

    /** A like: a little pluck, higher for each one in a row. */
    like(run = 0) {
      tone({ freq: NOTE(79 + ([0, 2, 4, 7, 9, 12][run % 6])), length: 0.12, type: 'triangle', gain: 0.16 });
    },

    /** A golden key. */
    golden() {
      [67, 71, 74, 79, 83, 86].forEach((n, i) => tone({ at: i * 0.07, freq: NOTE(n), length: i === 5 ? 0.7 : 0.18, type: 'square', gain: 0.1 }));
      [55, 59, 62, 67].forEach((n, i) => tone({ at: i * 0.14, freq: NOTE(n), length: 0.4, type: 'triangle', gain: 0.2 }));
    },

    /** A rest stop: a long sigh, and a bright ring. */
    hiss() {
      burst({ length: 0.6, type: 'highpass', freq: 3000, sweep: 8000, gain: 0.3 });
      tone({ at: 0.05, freq: 2400, to: 3600, length: 0.5, type: 'triangle', gain: 0.05 });
    },

    /** Somebody shooed: a yowl, a crash, and a ring. A swarm is bigger. */
    smash(big = false) {
      burst({ length: 0.16, type: 'lowpass', freq: 1100, gain: big ? 0.9 : 0.6 });
      tone({ freq: 190, to: 48, length: big ? 0.45 : 0.3, type: 'sawtooth', gain: big ? 0.4 : 0.28 });
      tone({ at: 0.02, freq: 880, to: 320, length: 0.16, type: 'square', gain: 0.08 });
      if (big) tone({ at: 0.06, freq: 1320, to: 660, length: 0.5, type: 'triangle', gain: 0.1 });
    },

    /** A cat's claw landing: a quick ripping swipe and a hiss. */
    claw() {
      burst({ length: 0.09, type: 'bandpass', freq: 3200, sweep: 1400, q: 1.2, gain: 0.25 });
      tone({ freq: 880, to: 420, length: 0.12, type: 'sawtooth', gain: 0.05 });
    },

    /** The cats at somebody, 0 to 1: the band's drums double up. */
    fighting(k) {
      if (k !== fight) { fight = k; band?.tension(k); }
    },

    /** Somewhere new. */
    chime() {
      tone({ freq: NOTE(76), length: 0.3, type: 'triangle', gain: 0.12 });
      tone({ at: 0.12, freq: NOTE(83), length: 0.45, type: 'triangle', gain: 0.12 });
    },

    /** The music: now, or as soon as the page has had a click. */
    startMusic() {
      want = true;
      playWanted();
    },

    stopMusic() {
      want = false;
      band?.stop();
    },
  };
}
