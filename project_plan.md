# PidgeonWorld — project plan

## Agreed game

A single-player pixel-art troll platform adventure for a parent and nine-year-old taking turns. Made In Australia, a regular pigeon, rescues Another Australian Pigeon from the fictional space Japanese Empire's Samurai and Ninjas, who plan to conquer the universe using exploding pigeons. Both protagonists look like regular pigeons. Spaceships connect the worlds.

| World | Name           | Confirmed environment                   |
| ----- | -------------- | --------------------------------------- |
| 1     | Outer America  | Green surface, black space, visible sun |
| 2     | PE72B          | Extremely cold and dangerous            |
| 3     | XPE72A         | Extremely hot, with monsters            |
| 4     | EP17A          | Swarming with massive parasites         |
| 5     | Actually Earth | Blue sky, grass, sun                    |

There will be four levels per world (20 total). Exactly one boss: the Japanese Empire in a big prawn suit at the end of 5-4. Gigantic creatures elsewhere are hazards, not bosses.

Confirmed mechanics: running, jumping, button-triggered downward slam, two mid-air flaps reset on landing, unlimited ground-bouncing kangaroo projectiles with a short cooldown, ten hearts refilled at checkpoints, instant death from gigantic creatures, unlimited checkpoint retries, automatic progress saving, keyboard and controller support. Absolute chaos, no easy or assist mode. Original pixel art; music generated separately in Suno later.

`quick_requirements.md` remains the original decision record. This plan is the implementation roadmap. The values and individual traps below are initial design choices for feedback, not additional user requirements.

## Development phases

### Phase 1 — design and prototype specification

- [x] Consolidate the agreed story, worlds, mechanics, and scope here.
- [x] Define one complete Outer America test level and input/save rules.
- [x] Separate the first playable milestone from the full 20-level game.

Exit: a concrete, small level can be built without inventing the rest of the campaign.

### Phase 2 — movement, combat, and technical foundation

- [x] Implement gravity, side-scrolling camera, platforms, run/jump, two flaps, and downward slam.
- [x] Add bouncing kangaroo shots, ordinary enemies, hearts, and gigantic-creature instant death.
- [x] Support keyboard and standard browser gamepads, pause, retry, and menu.
- [x] Add versioned local saves, validated checkpoint loading, and graceful storage failure.

Exit: the controls and retry loop work consistently and saves survive reloads.

### Phase 3 — first playable family test (complete)

- [x] Build Outer America 1-1: a beginning, three checkpoints, escalating troll encounters, and spaceship finish.
- [x] Provide original code-drawn pixel placeholder sprites and a readable HUD.
- [x] Add instructions, completion summary, replay, and a saved feedback form.
- [x] Verify build/lint, gameplay state tests, and browser playthrough; document untested physical devices.
- [x] Start the game locally for parent-and-child feedback.

Exit: your son can launch the game, play a full level, retry, resume saved progress, reach the ship, and report which parts were funny or frustrating. Completed with positive initial family feedback.

### Phase 4 — world and boss theme demos (current feedback target)

- [x] Expand the family test into one selectable demo for each of the five worlds plus the final prawn-suit boss.
- [x] Give each demo a distinct palette, hazard mechanic, local checkpoint, and completion record.
- [ ] Collect family feedback comparing the six demos.
- Review movement, flap height, slam, damage, shot cooldown, trap readability, checkpoints, and session length.
- Write the full 20-level specification with level maps, traps, enemies, planet transitions, boss phases, menus, and acceptance criteria.
- Tune the prototype from the family test without introducing an easy mode.

Exit: agreed full-game specification, chosen theme directions, and tested movement/combat tuning.

### Phase 5 — production art and audio

- Agree sprite resolution, palette, silhouettes, animation frame lists, and asset naming.
- Generate pigeon references and production pixel assets; align and clean sprite sheets before integration.
- Create tiles/backgrounds for all five worlds, Samurai/Ninjas, monsters, parasites, spaceship, kangaroos, prawn suit, UI, and effects.
- Prepare Suno briefs for five world tracks, menu, final boss, and victory; import separately generated music later.
- Add sound effects, mixing, mute controls, and reduced-flash options.

Exit: coherent readable art and working audio, checked in actual gameplay.

### Phase 6 — full adventure

- Build the other 19 levels with distinct traps and increasing difficulty.
- Add spaceship travel and world progression, story/rescue scenes, and the single final prawn-suit boss.
- Extend versioned saves and test old-save migration.

Exit: all 20 levels can be completed from a new game through the rescue ending.

### Phase 7 — polish and release

- Full keyboard/controller playtests, browser/viewport checks, performance and save-recovery tests.
- Balance chaotic traps, remove softlocks, clean up assets, and verify credits/licenses.
- Package a production build and agree hosting before publication.

Exit: family-approved release with documented controls and no blocking progression bugs.

## First-test specification

This section records the original Outer America test. The current Phase 4 build generalises it into six shorter demos with two checkpoints per regular world and a separate boss arena.

### Controls and physics (tunable)

| Action           | Keyboard                 | Standard gamepad               |
| ---------------- | ------------------------ | ------------------------------ |
| Run              | A/D or left/right arrows | Left stick or D-pad            |
| Jump / flap      | Space or W or up arrow   | Bottom face button (A / Cross) |
| Shoot kangaroo   | X or J (hold to repeat)  | Left face button (X / Square)  |
| Downward slam    | S or down arrow          | Right face button (B / Circle) |
| Pause / resume   | Escape or P              | Start                          |
| Retry checkpoint | R                        | Start, then B / Circle         |

Jump and flap require separate presses. A ground jump does not spend either flap. Landing restores two flaps. Slam accelerates downward and defeats ordinary enemies on contact. Normal contact costs one heart, with a short invulnerability window. Gigantic creatures bypass hearts and invulnerability. Pits also restart the checkpoint. Shots bounce, have a 350 ms cooldown, and expire so they cannot accumulate forever.

### Outer America 1-1 — Welcome. Probably.

A short horizontal course with green ground, a black starfield, a sun, regular pigeon hero, and a ship at the end. Approximately 1–3 minutes for a first attempt, depending on discoveries.

1. Landing field: learn jump/flaps, fire at a patrolling Ninja, reach checkpoint one.
2. Absolutely Safe Bridge: a conspicuously reassuring sign precedes collapsing platforms over a pit; flaps can save the player. Reach checkpoint two.
3. Complimentary Ceiling: an overhead block drops when approached; it hurts rather than instantly kills. More Ninjas invite shooting or slamming. Reach checkpoint three.
4. Totally Normal Wildlife: a gigantic creature patrols the final stretch and kills on contact. Jump and flap over it; projectiles cannot remove it. A fake finish flag insults the player and points to the actual spaceship.
5. Reach the ship to finish the prototype. Show deaths, time, replay, and feedback prompts. Do not pretend the remaining campaign exists.

Each retry resets traps/enemies/projectiles, restores ten hearts, and returns to the latest activated checkpoint. Checkpoints cannot move backward. A checkpoint refills once on activation; retry always restores health.

### Save contract

Save locally in this browser on checkpoint activation, death, and completion. Resume at the saved checkpoint with full health; record deaths and whether the test was completed. Completed players can replay the test. No accounts or cloud sync. Corrupt/old saves fall back safely. If browser storage is blocked, play continues with a visible warning. New run explicitly starts this prototype over. Feedback is saved locally and can be copied; it is not sent anywhere.

### Feedback prompts

- Which trap made you laugh?
- Which bit felt unfair or confusing?
- Were jumping, flapping, shooting, and slamming comfortable?
- What should happen in the next level?

## Verification log

- Production build: passes (Phaser bundle-size advisory remains).
- ESLint: passes.
- Seven Node tests: pass; cover flap limits, solid checkpoint/exit placement in every world, ordinary vs gigantic damage, independent per-demo checkpoints/completion, save roundtrip, and corrupt/unavailable storage.
- Browser playthrough: completed Outer America 1-1 from the start through all three checkpoints, the bridge, ceiling, gap, gigantic creature, false finish, and spaceship ending.
- Browser checks: jumping/flapping/slam and kangaroo shots; ordinary damage; giant instant death and respawn; checkpoint health refill; pause/resume; checkpoint and completion persistence across reload; replay resets the run; feedback notes persist across reload.
- Browser console: no runtime errors or warnings observed during the completed run.
- Six-demo selector: all five worlds and the boss load with the expected name, palette, description, and saved selection.
- Boss browser playthrough: kangaroo hits reduce the 12-point prawn health bar, the boss fires aimed projectiles, defeat opens the completion screen, and completion persists with a selector tick.
- Responsive canvas: checked at narrow and desktop widths; retains its 16:9 container without the previous growth loop.
- Physical gamepad: mapping implemented, but not tested with connected hardware. Please include controller comfort/compatibility in family feedback.
- Prototype art is original code-drawn pixel placeholders. Production asset generation and audio remain future phases.

## Family test handoff

Open http://localhost:5173 and choose any of the six demos in the mission panel. Try each theme and the boss with keyboard, then with a controller if available. Use the notes below the game and Copy feedback to bring observations back to the development conversation. Saves and feedback stay in this browser; switching browsers starts a separate save. Family feedback comparing the demos is the next step.
