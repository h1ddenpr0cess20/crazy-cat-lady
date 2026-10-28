import { createCastLibrary } from 'madness-engine/models/bake';
import { CAST } from './index.js';

export const { isBaked, readyAll, ready, preload } = createCastLibrary({
  cast: CAST,
  spawn: () => new Worker(new URL('./bake.worker.js', import.meta.url), { type: 'module' }),
  detail: 0.5,
  names: () => Object.keys(CAST),
  failure: "crazy-cat-lady: a person would not bake",
  terminateOnError: false,
});
