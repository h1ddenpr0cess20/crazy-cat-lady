import { CIVIC } from 'madness-engine/scenery/civic';
import { DISCOURSE } from 'madness-engine/scenery/discourse';
import { candycane, candycorn, caramelapple, gumdrop, lollipop, peppermint, sweet } from 'madness-engine/props/sweets';
import { krystal } from './krystal.js';
import { STREET } from 'madness-engine/scenery/street';
import { scooter } from 'madness-engine/scenery/street.metrlol';
import { truckwheel, VEHICLES, wheel } from 'madness-engine/scenery/vehicles';

/** How much coarser than sculpted a model is meshed, by name: the candies, hundreds of them and tiny on screen. */
const COARSE = { sweet: 3, candycorn: 3, lollipop: 3, caramelapple: 3, peppermint: 3, gumdrop: 3, candycane: 3 };

/** How much coarser a vehicle's far version (`sedan-far`) is: what the traffic draws away from the ball. */
export const FAR = 2.2;

/**
 * Every sculpted model, by name; and each vehicle again, coarser, for far
 * off, and without its wheels (`sedan-body`), for the traffic near by,
 * whose wheels (`wheel`, `truckwheel`) go round.
 */
export const MODELS = Object.fromEntries([
  ...Object.entries({ ...VEHICLES, ...STREET, scooter, ...CIVIC, ...DISCOURSE, krystal, sweet, candycorn, lollipop, caramelapple, peppermint, gumdrop, candycane, wheel, truckwheel }).filter(([name]) => name !== 'whetstone' && name !== 'like').map(([name, def]) => [name, { coarse: COARSE[name] ?? 1, ...def }]),
  ...Object.entries(VEHICLES).map(([name, def]) => [`${name}-far`, { ...def, name: `${def.name}-far`, coarse: FAR }]),
  ...Object.values(VEHICLES).map((def) => [def.body.name, def.body]),
]);
