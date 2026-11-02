import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chooseClip } from '../src/pack.js';

/** A cat that has been standing about, with nothing happening to it. */
const cat = (o = {}) => ({ i: 0, pace: 0, still: 0, target: null, closing: Infinity, crouching: false, wary: false, fresh: false, lastClaw: -9, won: -9, played: -9, hurt: -9, hiss: -9, cheered: -9, ...o });
const clip = (o, time = 100) => chooseClip(cat(o), time).clip;

test('a cat on the move runs, stalks near its target, or walks', () => {
  assert.equal(clip({ pace: 5 }), 'run');
  assert.equal(clip({ pace: 2 }), 'walk');
  assert.equal(clip({ pace: 2, closing: 1.5 }), 'stalk');
  assert.equal(clip({ pace: 2, closing: 6 }), 'walk');
});

test('the first claw of a fight is a pounce, played from its spring so it lands with the claw; the rest are swats', () => {
  const pounce = chooseClip(cat({ lastClaw: 99.9, fresh: true }), 100);
  assert.equal(pounce.clip, 'attack');
  assert.ok(pounce.t >= 0.2 && pounce.t < 0.8, `${pounce.t}`);
  assert.equal(chooseClip(cat({ lastClaw: 99.8, fresh: false }), 100).clip, 'swat');
  // Between claws it is back to what it was doing.
  assert.equal(clip({ lastClaw: 99.3, fresh: true, pace: 5 }), 'run');
});

test('a cat that has been knocked flinches, and a cat that was told to hiss does, if it is not after anybody', () => {
  assert.equal(clip({ hurt: 99.8, pace: 5 }), 'hit');
  assert.equal(clip({ hiss: 99.6 }), 'cast');
  assert.equal(clip({ hiss: 99.6, target: {} }), 'idle');
  // A hiss that has not come yet (the cats go one after another) is not one.
  assert.equal(clip({ hiss: 100.2 }), 'idle');
  assert.equal(clip({ hiss: 98 }), 'idle');
});

test('a cat bats at what it knocked over, and crouches over what it is about to', () => {
  assert.equal(clip({ played: 99.2 }), 'play');
  assert.equal(clip({ played: 97 }), 'idle');
  assert.equal(clip({ crouching: true, pace: 0.5 }), 'crouch');
});

test('standing about: pleased after a shoo or a cheer, ears up if somebody is near, then looking round, sitting, asleep', () => {
  assert.equal(clip({ won: 99 }), 'win');
  assert.equal(clip({ cheered: 99.5 }), 'win');
  assert.equal(clip({ won: 90 }), 'idle');
  assert.equal(clip({ wary: true, still: 1 }), 'alert');
  assert.equal(clip({ wary: true, still: 0.1 }), 'idle');
  assert.equal(clip({ still: 3 }), 'sit');
  assert.equal(clip({ still: 20 }), 'sleep');
  assert.equal(clip({ still: 20, wary: true }), 'alert');
  assert.ok(['look', 'idle'].includes(clip({ still: 1.5 })));
});
