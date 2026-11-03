import { CIVIC } from 'madness-engine/scenery/civic';
import { DISCOURSE } from 'madness-engine/scenery/discourse';
import { milk } from 'madness-engine/props/groceries';
import { krystal } from './krystal.js';
import { STREET } from 'madness-engine/scenery/street';
import { scooter } from 'madness-engine/scenery/street.metrlol';
import { truckwheel, VEHICLES, wheel } from 'madness-engine/scenery/vehicles';

/** How much coarser than sculpted a model is meshed, by name: the cartons of milk, hundreds of them and small on screen. */
const COARSE = { milk: 3 };

/** How much coarser a vehicle's far version (`sedan-far`) is: what the traffic draws away from the ball. */
export const FAR = 2.2;

/**
 * Every sculpted model, by name; and each vehicle again, coarser, for far
 * off, and without its wheels (`sedan-body`), for the traffic near by,
 * whose wheels (`wheel`, `truckwheel`) go round.
 */
export const MODELS = Object.fromEntries([
  ...Object.entries({ ...VEHICLES, ...STREET, scooter, ...CIVIC, ...DISCOURSE, krystal, milk, wheel, truckwheel }).filter(([name]) => name !== 'whetstone' && name !== 'like').map(([name, def]) => [name, { coarse: COARSE[name] ?? 1, ...def }]),
  ...Object.entries(VEHICLES).map(([name, def]) => [`${name}-far`, { ...def, name: `${def.name}-far`, coarse: FAR }]),
  ...Object.values(VEHICLES).map((def) => [def.body.name, def.body]),
]);
