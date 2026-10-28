# PidgeonWorld — full campaign

A single-player pixel-art troll platformer starring **Made In Australia**. Five story worlds, four levels each, ending with the Japanese Empire in a big prawn suit at the end of level 5-4, plus the bonus Banana World (4 more levels).

## Run

```powershell
npm install
npm run dev
```

Open the printed URL, normally http://localhost:5173. If dependencies already exist but npm is unavailable, run `node node_modules/vite/bin/vite.js`.

## Choose a level

The mission panel beside the game shows a world map: five worlds of four level pips each, plus the finale on world 5. Levels unlock in order — finishing one unlocks the next — and every unlocked level stays selectable and replayable.

1. **Outer America:** green space surface, collapsing bridges, a falling-debris cameo, and a gigantic creature on level 4.
2. **PE72B:** slippery ice and falling icicles throughout, with a falling-debris cameo on level 3.
3. **XPE72A:** lava gaps and jumping fire, with a falling-debris cameo on level 3.
4. **EP17A:** a purple living planet with moving parasite swarms, and a falling-debris cameo on level 3.
5. **Actually Earth:** blue sky, grass, ninjas and falling masonry — its own signature hazard — leading into the prawn-suit boss arena at the end of level 5-4.

Every level also carries one of four rotating troll jokes: a misleading sign, a runaway collectible that can never be caught, a platform that sprouts legs and relocates, or a fake finish flag. Each level saves its own checkpoint; completing a level saves campaign progress and unlocks the next.

## Bananas and Banana World (bonus world 6)

Bananas are also Australian, and they turn up in every level of every world (1 to 3 per level in the story worlds, 2 to 5 in Banana World). Banana World is a bonus world open from the start: use the **☰ Levels** button (or the world map beside the game) and pick any of its four levels. Bananas behave like this:

- They roam the level, hopping along the ground.
- A kangaroo shot sends a banana bouncing high into the air.
- They bounce off the pigeon and never cost a heart.
- A banana that runs into an enemy flattens it, and Mission Control says "Bananas work as well."

It is a side trip: the story still ends at the prawn suit in 5-4.

The pigeon dresses for the occasion: a tuxedo (top hat, white shirt front and bow tie) in Banana World, and a white space suit with a glass helmet on Venus. The level editor's Banana World and Venus looks do the same.

## Venus (bonus world 7)

Venus is also open from the start. It looks like the real planet: golden sulphuric clouds, a hazy sun, volcanoes and lava vents, with about 90% of Earth's gravity. There are no ninjas or parasites here. The locals are the **Venera robots**, based on real Soviet Venus probes, and they **chase the pigeon** when it gets within about 500 pixels (they never chase themselves into a pit, and their normal chase speed is always slower than the pigeon). There are fourteen types, each with its own look and behaviour (a slam still flattens any of them in one go):

- **Venera 4:** the spherical descent capsule with a cap, whip antenna, solar-panel wings and a red star. Standard walker.
- **Venera 1:** a tall cylinder with big solar panels and a dish. A fast scout.
- **Venera 7:** a cone-shaped capsule on springy legs. It hops as it chases.
- **Venera 9:** a heavy saucer-ringed lander with a camera dome. Slow, and it takes two kangaroos.
- **Venera 6:** a capsule under an orange-and-white parachute. It floats through the air towards you.
- **Venera 3:** a bullet-shaped impactor with fins. It winds up (and glows orange), then dashes at you. Dodge it while it is resting.
- **Venera 8:** a golden dome on frog legs. It leaps at you in big jumps.
- **Venera 13:** an armoured lander with camera domes and a drill arm. Very slow, and it takes three kangaroos.
- **Venera 10:** the twin lander. When it is destroyed it splits into two fast mini robots.
- **Venera 15:** the radar orbiter. It does not chase, it stays back and fires slow radar pulses at you.
- **Venera 14:** a sphere with a thick shield plate on its front. Kangaroos from the front go "PING!" and do nothing; get behind it, or slam it.
- **Venera 12:** a tracked drilling lander that starts buried (you only see a mound with a drill tip). Walk past and it erupts out of the ground and chases you.
- **Venera 2:** the sleek flyby probe. It strafes back and forth very fast at head height and never chases.
- **Vega 1:** a silver balloon with a gondola that drifts high above you and drops acid bombs when you are underneath it.

**Don't take your helmet off.** On Venus, pressing **L** (or the red HELMET OFF button on touch devices) takes the pigeon's helmet off. That kills it instantly: the pigeon explodes, respawns at its checkpoint like any other death, and the explosion leaves two Venera 4 robots behind to chase it. It does nothing on other worlds.

Each Venus level gives you a different mix (all fourteen appear across the four levels). Level 4 has a gigantic Venera that ends the run in one touch. Venus also has its own **Venus parasites**: slow, pulsing, sulphur-yellow cloud-jellies with a glowing green eye that drift back and forth, nothing like the round purple parasites of EP17A (2 to 5 per level). Bananas still turn up, and still flatten Venera robots. The Venus look in the level editor uses the same robots.

## Level editor

Press **✎ Level editor** above the game to open **My levels**. Tap **+ New level** and build with the tool palette along the bottom (tap or click the level to place things):

- **Ground:** Pit (drag to dig several), Bridge (wobbly planks over a pit), Platform, Long platform, Leg platform.
- **Enemies and hazards:** Ninja, roaming Banana, Icicle, Fire, Parasite, falling Block, instant-death Giant.
- **Level flow:** Start, Exit (the rocket), Checkpoints (on the ground, or tap just above a solid platform to put one on it; the pigeon respawns on that platform), Fake flags and runaway Crumbs. Leg platforms can't hold a checkpoint because they wander off.
- **Handy:** Erase, Undo, Move view (or the slider), world look (the 7 planets), level length (2000 to 16000px in steps of 800; new levels start at 6400px).

Levels can be big: up to 16000px long, with up to 600 platforms, 300 enemies, 120 bananas, 800 hazards (icicles, fire, parasites, blocks), 20 checkpoints, and 10 each of giants, fake flags and crumbs. Levels made before this change keep their old size and objects. Very large levels use more of the browser's storage (about 5 MB in total), so use **Share** to keep a copy of any you really care about.

Tap **▶ Test** to play it straight away; **Back to editor** brings you back from the game. Levels save automatically in this browser and never affect campaign progress. **Share** gives a code (starting `PWL1.`) that can be pasted into **Import code** on another device. The editor works with touch and mouse.

## Controls

| Action                       | Keyboard       | Standard controller    |
| ---------------------------- | -------------- | ---------------------- |
| Run                          | Arrows / A D   | Left stick / D-pad     |
| Jump; then two mid-air flaps | Space / W / Up | A / Cross              |
| Fire bouncing kangaroos      | Hold X / J     | Hold X / Square        |
| Slam downward                | Down / S       | B / Circle             |
| Pause                        | Esc / P        | Start                  |
| Retry checkpoint             | R              | Pause, then B / Circle |
| Helmet off (Venus only)      | L              | (none)                 |

Walk off the left edge of a level and a large explosion blows the pigeon back onto the screen as a limp ragdoll: it tumbles through the air with its wings flailing, bounces twice, lies flat for a moment ("OOF!") and then gets back up. It costs no hearts and you cannot steer until it is over.

Pits are drawn as a black void with a glowing red floor and yellow-and-black warning stripes down both edges, so they stand out in every world, including the dark ones (the level editor shows them the same way).

You have ten hearts. Checkpoints refill health. Gigantic creatures and pits cause instant checkpoint retries. Retries are unlimited. The boss has its own health display.

On touch devices (tablets and phones) on-screen buttons appear under the game: left/right arrows, Jump, Fire and Slam. Add `?touch=1` to the address to show them on any device. The in-page feedback box was removed for now.

## Scope

Implemented: all 20 levels across five worlds, sequential unlock progression, distinct world palettes and hazards, the prawn boss fight appended to level 5-4, four rotating troll-joke mechanics, movement/combat, checkpoints, health, local save/resume, pause/retry, completion tracking, and replay.

Not yet implemented: production animation assets, sound effects, or music — the game still runs on code-drawn placeholder shapes. Suno music remains planned separately. Spaceship travel and story/rescue beats are currently narrative overlay text rather than an animated scene.

See [project_plan.md](project_plan.md) for development phases and [quick_requirements.md](quick_requirements.md) for the original decisions.

## Checks

```powershell
npm run build
npm run lint
npm test
```
