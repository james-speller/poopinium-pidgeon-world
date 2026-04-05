# PidgeonWorld

A classroom-friendly Phaser 3 mini game scaffolded with Vite. Guide Pixel the pigeon to collect lesson-aligned seeds, build streaks, and dodge hawks while a HUD surfaces targets and tips. The project is intentionally split into small modules so lessons, scenes, and utilities can be extended without touching the rendering core.

## Features

- **Multi-scene architecture** – `BootScene`, `MenuScene`, `PlayScene`, and `HudScene` isolate loading, navigation, gameplay, and overlays.
- **Data-driven lessons** – `src/data/lessonPlan.js` centrally defines targets, distractors, pacing, and teaching tips per level.
- **State management** – `GameState` tracks score, streaks, targets, and lives; events are broadcast so the HUD stays in sync.
- **Classroom-ready UI** – Responsive shell around the Phaser canvas with a controls legend and quick tips.
- **Tooling** – Vite dev server, ESLint (flat config), and Prettier formatting commands are pre-wired.

## Getting Started

```bash
npm install
npm run dev
```

Open the printed URL (defaults to http://localhost:5173) to play. Use the arrow keys to fly, `Space` to dash, and `M` to toggle music cues (placeholder). Collect highlighted seeds and avoid hawks.

## Scripts

| Command         | Purpose                              |
| --------------- | ------------------------------------- |
| `npm run dev`   | Start Vite with hot module reload     |
| `npm run build` | Produce an optimized production build |
| `npm run preview` | Preview the production build        |
| `npm run lint`  | Run ESLint with the shared config     |
| `npm run format`| Apply Prettier to common file types   |

## Project Structure

```
src/
├── constants/        # Shared game constants and colors
├── data/             # Lesson definitions for each level
├── game/             # Game factory and Phaser config
├── scenes/           # Boot, menu, gameplay, and HUD scenes
├── state/            # GameState class for progress tracking
├── utils/            # Small helpers (randomization)
├── main.js           # Entry point that boots Phaser
├── style.css         # Shell layout + typography
└── ...
```

## Extending the Game

- Add new lesson cards by appending objects to `lessonPlan.js` (targets, distractors, pacing, and narrative copy).
- Drop additional scenes into `src/scenes` and register them inside `getGameConfig` for new flows (e.g., assessment summaries).
- Introduce new game objects by creating helper modules under `src/objects` or `src/systems`, then importing them into `PlayScene`.

Feel free to adapt the art pipeline (currently lightweight generated textures) or swap in external assets; the Boot scene is the right place to preload them.
