# PidgeonWorld — six-demo family playtest

A single-player pixel-art troll platformer starring **Made In Australia**. This build contains one short demo for each of the five planned worlds plus the final big-prawn-suit boss encounter.

## Run

```powershell
npm install
npm run dev
```

Open the printed URL, normally http://localhost:5173. If dependencies already exist but npm is unavailable, run `node node_modules/vite/bin/vite.js`.

## Choose a demo

Use the mission panel beside the game to switch freely between:

1. **Outer America:** green space surface, collapsing bridge and a gigantic creature.
2. **PE72B:** slippery ice, falling icicles and frozen danger.
3. **XPE72A:** lava gaps, jumping fire and literal monsters.
4. **EP17A:** a purple living planet with moving parasite swarms.
5. **Actually Earth:** blue sky, grass, ninjas and falling ordinary masonry.
6. **The Big Prawn Suit:** a separate boss arena. Hit the suit with bouncing kangaroos while dodging its projectiles.

Each demo saves its checkpoint and completion independently in the current browser. Completed demos receive a tick in the selector. These are theme tests, not the final campaign levels.

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

Use the feedback box to compare the six themes and record which hazards were funny, confusing, or frustrating. Notes stay in the browser until copied.

## Scope

Implemented: six selectable demos, distinct world palettes and hazards, prawn boss combat, movement/combat, checkpoints, health, local save/resume, pause/retry, completion tracking, and replay.

Not yet implemented: the complete 20-level campaign, planet travel scenes, production animation assets, sound effects, or music. Suno music remains planned separately.

See [project_plan.md](project_plan.md) for development phases and [quick_requirements.md](quick_requirements.md) for the original decisions.

## Checks

```powershell
npm run build
npm run lint
npm test
```
