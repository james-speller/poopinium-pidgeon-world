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

`quick_requirements.md` remains the original decision record. This plan is the implementation roadmap.

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

### Phase 4 — world and boss theme demos (complete)

- [x] Expand the family test into one selectable demo for each of the five worlds plus the final prawn-suit boss.
- [x] Give each demo a distinct palette, hazard mechanic, local checkpoint, and completion record.
- [x] Collect family feedback comparing the six demos.
- [x] Review movement, flap height, slam, damage, shot cooldown, trap readability, checkpoints, and session length.
- [x] Write the full 20-level specification with level maps, traps, enemies, planet transitions, boss phases, menus, and acceptance criteria.
- [x] Tune the prototype from the family test without introducing an easy mode.

Exit: agreed full-game specification, chosen theme directions, and tested movement/combat tuning. **Reached — see "Family feedback" and "Full 20-level specification" below.**

### Phase 5 — production art and audio

- Agree sprite resolution, palette, silhouettes, animation frame lists, and asset naming.
- Generate pigeon references and production pixel assets; align and clean sprite sheets before integration.
- Create tiles/backgrounds for all five worlds, Samurai/Ninjas, monsters, parasites, spaceship, kangaroos, prawn suit, UI, and effects.
- Prepare Suno briefs for five world tracks, menu, final boss, and victory; import separately generated music later.
- Add sound effects, mixing, mute controls, and reduced-flash options.

Exit: coherent readable art and working audio, checked in actual gameplay. Not started — the full campaign below still runs on code-drawn placeholder shapes.

### Phase 6 — full adventure

- [x] Build the other 19 levels with distinct traps and increasing difficulty.
- [x] Add world progression (sequential unlocks) and the single final prawn-suit boss, combined into the end of level 5-4.
- [x] Extend versioned saves (v3) and test old-save migration from the six-demo (v2) format.
- [ ] Spaceship travel and story/rescue *cutscenes* — implemented today as narrative overlay text (world-complete / rescue-ending screens), not a dedicated animated scene. Revisit once Phase 5 art exists.

Exit: all 20 levels can be completed from a new game through the rescue ending. **Code complete, pending family playtest and your own `npm run build`/`lint`/`test` before trusting it.**

### Phase 7 — polish and release

- Full keyboard/controller playtests, browser/viewport checks, performance and save-recovery tests.
- Balance chaotic traps, remove softlocks, clean up assets, and verify credits/licenses.
- Package a production build and agree hosting before publication.

Exit: family-approved release with documented controls and no blocking progression bugs.

## Family feedback (2026-09-23)

Collected from the six-demo playtest, ahead of building the full campaign:

- **Funniest moment:** the falling ceiling block ("Complimentary Ceiling" style debris drop). It is now featured at least once in every world, not just Actually Earth.
- **Rough edge:** checkpoint spacing felt off. Kept at three checkpoints per level (unchanged count) but placement is now generated to land just *after* the level's hardest gap/trap cluster, rather than at a fixed fraction of the level.
- **Controls:** jumping, flapping, shooting, and slamming were rated "great as-is, ship it" — no physics tuning applied for the 20-level build.
- **Troll jokes to lean into:** misleading signs, a runaway collectible, a platform that sprouts legs, and more fake finish flags — all four are now implemented (see "New troll-joke mechanics" below) and rotate across the 20 levels so no single joke repeats too often.
- **Level length:** requested "Mario-sized" (3–6 minutes), longer than the original 1–3 minute demos. Level width now scales from 3000px (first level of a world) to 4200px (final level), versus the demos' fixed 2800px.
- **Exclusions:** none — current tone approved. Only ask was to vary the jokes rather than repeat one.

## Full 20-level specification

### Structure

Five worlds × four levels. Levels unlock sequentially — completing a level unlocks the next; all previously unlocked levels stay selectable and replayable from the mission panel's world map. The sole boss (the Japanese Empire in the big prawn suit) is not a separate demo anymore: it is the second half of level 5-4, reached after a normal platforming section.

Each world has a signature environmental hazard (reused from the six-demo build) plus one guest appearance of the fan-favourite falling-block gag:

| World | Signature hazard | Falling-block cameo |
| ----- | ----------------- | -------------------- |
| 1 Outer America | Collapsing bridges | Level 1-2 |
| 2 PE72B | Falling icicles | Level 2-3 |
| 3 XPE72A | Rising fireballs | Level 3-3 |
| 4 EP17A | Floating parasite swarm | Level 4-3 |
| 5 Actually Earth | Falling ceiling debris (its own identity) | Levels 5-1, 5-3, 5-4 |

Every world's level 4 adds a gigantic, instant-death creature patrolling the final stretch (contact bypasses hearts entirely; it cannot be shot). Levels get longer and busier through a world: level 1 of each world is the shortest/simplest, level 4 the longest and most crowded.

### New troll-joke mechanics (built this session)

- **Misleading sign** — every level keeps its own custom joke sign text (e.g. "INSPECTED TWICE (BY THE SAME PERSON)") placed right before its hazard, continuing the original "Absolutely Safe Bridge" gag.
- **Runaway collectible** — a small crumb sprite that scoots away and resets once the player is out of range; it can never actually be caught. Purely comedic, no scoring system implied.
- **Platform that sprouts legs** — one decorative platform per level (on the rotation) waits until the player stands on it, then slides away after a short delay. It stops at its new spot rather than vanishing, so it can't soft-lock a level.
- **Fake finish flag** — a red flag partway through a level that triggers a "FAKE FINISH!" popup and a jab of text, then does nothing else; the real exit (or boss arena, on 5-4) is further on.

These four rotate one-per-level across the 20 levels so the same joke never repeats twice in a row.

### Level sizing

| Level index in world | Width | Gaps | Enemies |
| --------------------- | ----- | ---- | ------- |
| 1 | 3000px | 2 | 3 |
| 2 | 3400px | 3 | 4 |
| 3 | 3800px | 3 | 5 |
| 4 | 4200px | 4 | 6 (+ giant) |

Gaps, checkpoints, enemy positions, and decorative platforms are generated (not hand-typed) from each level's width and gap layout, guaranteeing checkpoints, the exit, and enemies never land inside a pit — see [`src/data/layout.js`](src/data/layout.js).

### Level 5-4 — the finale

A normal platforming section (levels 1–3 checkpoints, the giant creature, the Earth-block gag) leads into a separate boss arena appended to the end of the level (no scene transition, just more level). The prawn boss has 16 kangaroo-hit health (up from 12 in the six-demo build), roams the arena, and fires aimed projectiles that get faster as its health drops. Defeating it completes the entire campaign and shows the rescue ending.

### Progression, menus, and saves

- **World map:** the mission panel now lists all five worlds with their four levels as small numbered pips. Locked levels show a lock icon and cannot be selected; the current level is highlighted; completed levels get a checkmark.
- **Completion overlays:** three distinct outcomes — a normal level-complete screen offering "Continue to `<next level>`", a world-complete screen offering to fly to the next world, and the campaign-complete "rescue ending" screen after 5-4.
- **Save format v3** (`pidgeonworld-campaign-v3` in `localStorage`): current level, unlocked levels, completed levels, a per-level checkpoint index (0–2), and total deaths. An old v2 (six-demo) save is detected and gracefully reset to a fresh v3 campaign rather than crashing — this is intentional data loss for playtesters of the six-demo build, documented here rather than attempting a lossy id-remapping migration.

### Controls and physics (unchanged from the demo build — feedback said "ship it")

| Action           | Keyboard                 | Standard gamepad               |
| ---------------- | ------------------------ | ------------------------------- |
| Run              | A/D or left/right arrows | Left stick or D-pad            |
| Jump / flap      | Space or W or up arrow   | Bottom face button (A / Cross) |
| Shoot kangaroo   | X or J (hold to repeat)  | Left face button (X / Square)  |
| Downward slam    | S or down arrow          | Right face button (B / Circle) |
| Pause / resume   | Escape or P              | Start                          |
| Retry checkpoint | R                        | Start, then B / Circle         |

Jump and flap require separate presses. A ground jump does not spend either flap. Landing restores two flaps. Slam accelerates downward and defeats ordinary enemies on contact. Normal contact costs one heart, with a short invulnerability window. Gigantic creatures bypass hearts and invulnerability. Pits also restart the checkpoint. Shots bounce, have a 350 ms cooldown, and expire so they cannot accumulate forever.

### Acceptance criteria

- A new save starts at level 1-1 with only that level unlocked.
- Completing any non-finale level unlocks the next level in sequence and shows a level-complete overlay.
- Completing a world's 4th level (except world 5) shows a world-complete overlay and unlocks the next world's level 1.
- Reaching and defeating the boss in 5-4 shows the campaign-complete rescue ending; there is no exit flag in 5-4's ground course.
- Checkpoints, the exit (or boss arena), enemies, and decorative platforms never overlap a gap, for all 20 levels.
- An old six-demo save loads without crashing and resets to a fresh, playable v3 campaign.
- Keyboard and gamepad controls behave identically to the six-demo build (unchanged per feedback).

### Save contract (unchanged mechanics, new schema)

Save locally in this browser on checkpoint activation, death, and completion. Resume at the saved level and checkpoint with full health; record total deaths and per-level completion. Completed levels can be replayed from the world map. No accounts or cloud sync. Corrupt or obsolete-version saves fall back safely to a fresh campaign. If browser storage is blocked, play continues with a visible warning. Feedback notes are saved locally and can be copied; they are not sent anywhere.

## Verification log

- **`npm run build` / `npm run lint` / `npm test` not run this session** — `node`/`npm` were not reachable from this session's shell tools, so these could not be executed here. **Please run the three commands below yourself and report any failures**:
  ```bash
  npm run build
  npm run lint
  npm test
  ```
- Tests were rewritten in [`tests/adventure.test.js`](tests/adventure.test.js) to cover: flap limits, generated checkpoint/exit/enemy/platform placement across all 20 levels, campaign structure (20 levels, boss only on 5-4), ordinary vs gigantic damage, checkpoint monotonicity, level-unlock progression, save roundtrip, corrupt/unavailable storage, and graceful v2→v3 save migration.
- Browser verification was performed against a live dev server this session, driving the Phaser scene directly through its own update loop (bypassing an unreliable window-focus issue in the automation browser itself, not the game) to get real physics ticks. Confirmed working: movement/gravity/collision, enemy contact damage, the collapsing bridge, pit-fall death, checkpoint activation and health refill, death/respawn to the correct checkpoint, the runaway-crumb joke, the world map's lock/active/done states, level 5-4 loading its combined platforming-then-boss-arena layout, kangaroo shots damaging the boss, and boss defeat correctly showing the campaign-complete rescue ending overlay.
- **One real bug was found and fixed this session**: the "platform sprouts legs" joke used `Phaser.GameObjects.Rectangle` shapes wired into Arcade Physics by hand, which don't get Phaser's `enableBody`/`setVelocityX` GameObject helper methods (only Sprites do) — so the first time a level containing that joke respawned the player, `resetRun()` crashed. Fixed by using the lower-level `body.reset()`/`body.setVelocityX()` calls instead, and re-verified the fix live (forced death + respawn, and forced the platform to trigger and relocate) with no further errors.
- Not covered this session, for time: a full manual playthrough of every one of the 20 levels' unique hazard/joke combination, the misleading-sign and fake-finish-flag jokes specifically (code-reviewed but not exercised live), and a physical gamepad. Worth covering in your own playtest.
- Prior six-demo verification (build/lint/tests passing, full browser playthrough, boss fight, responsive canvas) is preserved in git history but no longer describes the current code.
- Prototype art remains original code-drawn pixel placeholders; production asset generation and audio remain Phase 5, still not started.

## Family test handoff

Open http://localhost:5173. The mission panel now shows a world map — five worlds of four level pips each, plus a boss pip on world 5. Play levels in order; completing one unlocks the next. Try at least one full world through to its "world complete" screen, and if you have time, push through to 5-4's boss for the rescue ending. Use the notes box and "Copy feedback" to bring observations back. Saves and feedback stay in this browser; switching browsers starts a separate save, and old six-demo saves will reset to a fresh campaign automatically.
