# PidgeonWorld — full 20-level campaign

A single-player pixel-art troll platformer starring **Made In Australia**. Five worlds, four levels each, ending with the Japanese Empire in a big prawn suit at the end of level 5-4.

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

## Level editor

Press **✎ Level editor** above the game to open **My levels**. Tap **+ New level** and build with the tool palette along the bottom (tap or click the level to place things):

- **Ground:** Pit (drag to dig several), Bridge (wobbly planks over a pit), Platform, Long platform, Leg platform.
- **Enemies and hazards:** Ninja, Icicle, Fire, Parasite, falling Block, instant-death Giant.
- **Level flow:** Start, Exit (the rocket), up to 2 Checkpoints, a Fake flag and a runaway Crumb.
- **Handy:** Erase, Undo, Move view (or the slider), world look (the 5 planets), level length (2000-8000px).

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
