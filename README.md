# Crazy Cat Lady

An old lady in a cardigan and her pack of cats are loose in an open city of
dog people. There are no tracks and no levels: it is one map, all of it there
from the start, and she can walk anywhere she can get to. In the way are the
dog walkers and the dog park activists, the allergic neighbours, the council
inspectors, the animal control officers, the joggers who were not looking, and
the dogs. She mostly doesn't lift a finger. **The cats do the fighting.**

Somewhere in all of it are **42 golden keys**, and **ten strays** sitting
about waiting to be taken in.

A reskin of [Metrlol](https://github.com/h1ddenpr0cess20/metrlol), and made of
the games before it:

- **the engine** is Metrlol's, which is [Petroll](https://github.com/h1ddenpr0cess20/petroll)'s: the renderer, the physics, the tiled map builder, traffic, hazards, minimap and HUD. The map is Metrlol's, a city of nine parts, 256 tiles each way, re-signed and renamed for cats; like Metrlol's it is tested to be rollable (here, walkable) from end to end;
- **the lady** is Nonna (`characters/nonna.metrlol`) from the [madness-engine](https://github.com/h1ddenpr0cess20/madness-engine) library, walking about on the ball the physics rolls for her;
- **the cats** are Catroller's: the six coats of `characters/cat` (Blaze, Nyx, Ghost, Jinx, Vex and Brutus), sculpted at the size of the house they came from and scaled here to about a fifth of a tile at the back, to the lady's three-quarters;
- **the music** is Catroller's: a sneaky little jazz trio played live in Web Audio, the drums doubling up when the cats are at somebody;
- **the golden keys** are the library's `key`.

It is not about anyone in particular, and it is fair to all dogs and cats.

## Run

```sh
git clone https://github.com/h1ddenpr0cess20/crazy-cat-lady
cd crazy-cat-lady
npm install
npm run dev               # → http://localhost:5173
```

A static page: no server, no keys. `npm run build` puts it in `dist/`, which
runs from any folder. WebGPU where the browser has it, WebGL 2 where it
doesn't (`?renderer=webgl` pins it). Node 22.12 or later.

## Play

| | |
|---|---|
| <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> or <kbd>WASD</kbd> | Walk. Up always walks up the screen, however the view is turned. |
| Hold the mouse or a finger | Walk toward the pointer. The further it is from her, the harder she goes. |
| **Click** (or tap), or <kbd>F</kbd> | **Swing** the wooden spoon. It comes round the whole of her, hits everybody within reach and shoves them back. Three hit points a swing, and her arm needs 0.7 s between swings; the cats do the rest. A quick click doesn't walk anywhere: holding the mouse down does. The SWING button on a touch screen; <kbd>Y</kbd> or the right bumper on a gamepad. |
| <kbd>K</kbd> | **Jump**: about a tile and a bit, enough for a kerb, a step or a low wall. The JUMP button on a touch screen; <kbd>B</kbd> on a gamepad. |
| <kbd>Space</kbd> or <kbd>Shift</kbd> | **Hurry**: hold it for a faster walk, until the meter runs dry (it refills when you let go). The HURRY button on a touch screen. The cats keep up. |
| <kbd>Q</kbd> <kbd>E</kbd>, or drag with the right mouse button | Turn the view. Dragging up and down tilts it. |
| Mouse wheel, or <kbd>+</kbd> <kbd>−</kbd> | Zoom. |
| Two fingers | Pinch to zoom, twist to turn, drag up or down to tilt. |
| <kbd>C</kbd> | Put the view back. |
| Gamepad | Left stick or d-pad walks; right stick turns and tilts; shoulder buttons zoom; <kbd>A</kbd>, <kbd>X</kbd> or the right trigger hurries; <kbd>Start</kbd> pauses. |
| <kbd>P</kbd> / <kbd>Esc</kbd> | A tea break (pause). |
| <kbd>M</kbd> | Sound on or off. |

### The cats do the fighting

Six cats start with her. They trot after her in a loose ring (and hop up kerbs when they get stuck on them), and when
somebody comes near she doesn't have to do anything: the nearest foe each cat
can see is the one it runs at, and it claws, over and over, until the foe is
**shooed** (thrown clear, with a yelp).

| | |
|---|---|
| **Claws** | A claw takes one off a foe's hit points (Brutus, the tom, takes two, one every half second). A foe has twice its toughness in hit points; a boss has a good deal more. A foe that is clawed stops where it is for a moment. |
| **SHOOED!** | The foe is gone, worth purrs. |
| **SWARMED!** | Four or more cats had a go at it in the last moment. Worth double. |
| **Combo** | Shoos one after another build a combo (×5 at most) that multiplies each one. |
| **Mischief** | With nobody to fight, a cat will go and knock over whatever small thing is lying about: a cone, a bin, a bench. Worth a little each, and they come back with a new run. The lady walking into them doesn't. |

- **Strays** are cats sitting about in ten places round the city (the pink dots on the map). Walk up to one and it **joins the pack**, up to 16 cats. Which strays you have taken in is kept between visits.
- **Golden keys** are the 42 things to find, with a shaft of light going up from each. The map shows the ones in the parts of town you've been to.
- **Hearts** are the little hearts lying about in lines. They are love, and worth nothing.

### Staying in one piece

She starts with 100 **patience**. Hard landings, cars, yarn reels rolling after
her, the sprinklers coming up out of the floor and the people who get to her
take it away (half as much as they would: she is a tough old bird). At nothing
she is **flustered**, and she is back at the last **rest stop** she came to,
with a sit down and a cup of tea. A can press coming down on her flusters her
outright. The milk lake and the sea swallow her, and she's put back on the
last firm ground. The cats come with her.

What you've found, the strays you've taken in, the last rest stop and the time
so far are kept in the browser (`crazy-cat-lady.v1`), and the game plays the
same with storage blocked.

## The people

Nobody is placed in the crowd. The people are made as she walks: a few at a
time, out of her sight, on open ground round her, picked from the table of the
district she is in (`src/spawns.js`) and as many as that district's density
(the Kennel District and the Pound are crowded, the far side is not), and
unmade when she has left them well behind. It is the same every time. Only the
three bosses and the troll under the bridge are placed, where they stand.

Seventy-three kinds of people, sculpted in code and baked in background
workers while the page loads. Who they are, and what they shout, is in
`src/foes.js`; the models are Metrlol's cast in new names: the dog walker is
the cultist, the animal control officer the beat cop, the jogger the
straight-edge kid, and the colossal sheepdog the yeti.

## The city

Nine parts of town, three across and three down, the busy road down the east
side, and the far side of it. The ground plan is Metrlol's; the names and signs
are new:

| | |
|---|---|
| **Whisker Heights**, north-west | Home. Cat houses, a drained pool that is now the catnip patch, the cat-house village, the hedge maze, the tuna co-op with its roof, and the cat playground. |
| **The Kennel District**, north | The Kennel Club, the slippery slope, the dinner clock, the plaza where the dog park protest has been for a year. |
| **Purrdue University**, north-east | The campus, the lever problem (knock it off the table?), and the Great Cat Tree: a ramp three times round it to the top. |
| **The Pound**, west | Behind a fence: the kibble tank with a lift up its side, sprinkler alley, the bunker. The Chief Warden lives here. |
| **Meowtown**, the middle | Downtown. Cat videos on every screen, Meme Square, the ball pit, the catwalk (a walkway in the air), the catnip farm. |
| **Zoomie Valley**, east | The zoomie cycle in hills: the peak of the zoomies, the trough of naps, the slope of stretching, the plateau of loafing. The cat café, and the Pet Food Baron's infinity pool. |
| **Sardine Bay**, south-west | The canning hall (presses coming down on the lane), the litter box (real sand), the fish market, the beach, the pier and the sea. |
| **The Kibble Works**, south-east | The kibble halls, the silos, the milk pipe, the milk lake, the yarn yard where the reels come after you, the scratching ramp. |
| **The Busy Road** | Four lanes of trucks and cars. Nobody brakes. Nobody looks. On the far side, the farm. |

## How it's made

| | |
|---|---|
| [madness-engine](https://github.com/h1ddenpr0cess20/madness-engine) | The engine the game runs on, and the library of its people, props, streets, vehicles, cats and band. |
| `src/lady.js` | The lady, drawn walking on her ball: faces where she's going, walks faster the faster she goes, flinches, goes down when flustered. |
| `src/pack.js` | The cats: following, hunting, clawing, mischief, growing. |
| `src/claws.js` | What a claw does and what a shoo is worth. |
| `src/crowd.js`, `src/spawns.js` | The people: how they walk and come at the lady, and who is made where. |
| `src/foes.js`, `src/quips.js` | Who they are and what they shout; what the lady says. |
| `src/map.js`, `src/town.js` | The map: tiles, road paint, props, solids, traffic, hazards, pickups, strays, signs; and the city, part by part. |
| `src/run.js` | The world as it runs, with nothing drawn: the rules for patience, claws, pickups. The game draws it; the tests drive it. |
| `src/audio.js` | Catroller's trio, and every sound effect, synthesised. |

Some names in the code are Metrlol's still: the golden keys are `gpu`s and
`gpus`, the rest stops are `whetstone`s and `stones`, the purrs are `cred`.

| Script | |
|---|---|
| `npm run dev` | Vite dev server (and `/preview.html`: the lady and the cats at size; `?foes=pauser,eurocrat`, `?foes=all`) |
| `npm run build` | Bundles to `dist/` |
| `npm test` | `node:test`: physics, the map builder, the city, the traffic, the hazards, the crowd and the spawner, the cats and their claws, the strays, and an autopilot that has to find all 42 golden keys in one go without being flustered |
| `npm run lint` | ESLint |

In the browser console, `crazyCatLady.debug.teleport(x, z)` puts her anywhere
on the map.
