/**
 * What the game remembers between visits: the golden keys found, the strays
 * taken in, the rest stop she was last at, how long she has been walking, and
 * the best time to all the keys. Browser storage can be missing or refuse, so every touch of
 * it is guarded and the game plays the same without it.
 */

const KEY = 'crazy-cat-lady.v1';
const EMPTY = { found: [], strays: [], stone: null, time: 0, best: 0 };

export function createStorage(store = globalThis.localStorage) {
  let saved = { ...EMPTY, found: [], strays: [] };
  try {
    const raw = JSON.parse(store?.getItem(KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      saved.found = Array.isArray(raw.found) ? raw.found.filter((n) => typeof n === 'string') : [];
      saved.strays = Array.isArray(raw.strays) ? raw.strays.filter((n) => typeof n === 'string') : [];
      saved.stone = typeof raw.stone === 'string' ? raw.stone : null;
      saved.time = Number.isFinite(raw.time) && raw.time >= 0 ? raw.time : 0;
      saved.best = Number.isFinite(raw.best) && raw.best > 0 ? raw.best : 0;
    }
  } catch {}

  const save = () => {
    try { store?.setItem(KEY, JSON.stringify(saved)); } catch {}
    return { ...saved, found: [...saved.found], strays: [...saved.strays] };
  };

  return {
    load: () => ({ ...saved, found: [...saved.found], strays: [...saved.strays] }),
    /** Where it has got to: golden keys found, strays taken in, last armchair, time so far. */
    progress({ found, strays = [], stone, time }) {
      saved = { ...saved, found: [...new Set(found)], strays: [...new Set(strays)], stone, time };
      return save();
    },
    /** All of them found in `time`: kept if it's the best. */
    finished(time) {
      saved = { ...saved, best: saved.best ? Math.min(saved.best, time) : time };
      return save();
    },
    /** Start over, keeping the best time. */
    clear() {
      saved = { ...EMPTY, found: [], strays: [], best: saved.best };
      return save();
    },
  };
}
