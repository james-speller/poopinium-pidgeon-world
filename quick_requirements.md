# PidgeonWorld — quick redesign requirements

## Vision

Completely redesign the existing classroom counting game as a very silly, sprite-based 2D platform adventure starring a pigeon. The game should be enjoyable for a parent and their nine-year-old son to play together.

Use Mario as a reference for side-scrolling platforming and Syobon Action (Cat Mario), confirmed by the user, as a reference for unexpected traps and tricks. Create original characters, levels, artwork, and audio.

## Confirmed design decisions

- **Play format:** single-player. Parent and child take turns controlling the same character; no simultaneous multiplayer.
- **Hero:** a male pigeon named **Made In Australia**.
- **Character appearance:** Made In Australia and Another Australian Pigeon both look like regular pigeons, rendered in pixel art.
- **Mission:** find and rescue his mate, **Another Australian Pigeon**, who has been kidnapped by Samurai and Ninjas belonging to the **Japanese Empire**. The Empire wants to experiment with exploding pigeons to take over the universe.
- **Setting:** an adventure across four alien planets in a different solar system, followed by Earth as the fifth world.
- **Interplanetary travel:** a spaceship carries the pigeon between planets.
- **Structure:** five planets, each containing four levels: **20 levels total**.
- **Boss:** exactly one boss encounter, against the **Japanese Empire wearing a big prawn suit**, at the end of Earth's fourth level (level 5-4). No earlier bosses or minibosses. Encounter mechanics remain to be designed.
- **Difficulty:** absolute chaos, with no easy mode. Do not add an easy or assist mode.
- **Art style:** regular pixel art. Exact sprite resolution and palette remain to be specified.
- **Abilities:** running and jumping; a button-activated downward slam; shooting kangaroos as projectiles that bounce along the ground; and two mid-air flaps, replenished on landing. Kangaroo shots are unlimited with a short cooldown. Exact cooldown duration and movement tuning remain to be specified.
- **Health:** ten hearts, refilled to full at checkpoints. Gigantic creatures kill in one hit regardless of remaining hearts. Which creatures count as gigantic and damage from other hazards remain to be specified.
- **Death and retries:** restart at checkpoints with unlimited retries. Exact checkpoint placement remains to be designed.
- **Saving:** automatically save progress between play sessions. Save location, save triggers, and the exact resume behaviour will be defined in the full specification.
- **Controls:** support both keyboard and game controllers.
- **Troll reference:** Syobon Action (Cat Mario).

## Confirmed worlds, in order

Each world contains four levels. Planet themes are confirmed; individual level layouts and encounters remain to be designed.

| World | Planet | Theme | Levels |
| --- | --- | --- | --- |
| 1 | Outer America | Green surface, black space background, and a visible sun. | 1-1 to 1-4 |
| 2 | PE72B | Very cold and extremely dangerous. | 2-1 to 2-4 |
| 3 | XPE72A | Very hot, populated by literal monsters. | 3-1 to 3-4 |
| 4 | EP17A | Massive parasites swarming the planet. | 4-1 to 4-4 |
| 5 | Actually Earth | Earth, with a blue sky, grass surface, and a sun in the sky. | 5-1 to 5-4 |

Gigantic creatures are level hazards or enemies, not extra bosses. The sole boss is the Japanese Empire in its big prawn suit at the end of level 5-4.

## Requested direction

- Made In Australia the pigeon is the playable hero.
- Running, jumping, platforms, and adventure replace the educational seed-matching loop.
- A very silly tone, with lots of surprises and a game world that deliberately tricks the player.
- Sprite-based characters, enemies, scenery, and animation.
- A family-friendly experience suitable for a nine-year-old.
- Develop a full specifications document collaboratively before substantial implementation.
- Generate image assets after agreeing on the visual direction and asset list.
- Generate music separately in Suno later; plan for importing those tracks.

## Proposed design principles — to confirm

- Present the Japanese Empire as a fictional cartoon space empire in this absurd universe. Its Samurai and Ninjas are the enemy faction. Depict exploding-pigeon experiments through non-graphic cartoon effects and rescue stakes suitable for the intended family audience.
- Make failure funny through absurd traps and cartoon slapstick. Quick respawns are proposed; checkpoint restarts and unlimited retries are confirmed.
- Make tricks learnable even when outrageous, so players can discover a way through the chaos.
- Keep the full chaotic difficulty for everyone: no easy mode, assist mode, or automatic difficulty reduction.
- Prefer cartoon slapstick and absurdity; avoid graphic violence, frightening imagery, and mean-spirited jokes.
- Keep movement responsive and predictable so the environment supplies the surprises.
- Support taking turns naturally between attempts; a dedicated turn-tracking feature is not currently required.

## Ideas to choose from — not committed features

- A helpful-looking sign gives terrible advice; another complains when ignored.
- A breadcrumb runs away just before being collected.
- A suspicious platform waits until the pigeon feels safe before sprouting legs.
- A fake finish flag reveals another ridiculous challenge.
- A silly squawk distracts enemies; this would be an additional ability and is not yet requested.
- Literal trolls could appear as characters, if wanted, as well as the game trolling the player.

## Questions for our next design conversation

1. Which troll jokes would you most like? We can propose level-by-level surprises and prawn-suit boss attacks in the full specification.
2. Are there things either of you dislikes or wants excluded? What jokes does your son particularly enjoy?

The core design choices are now sufficient to draft the full specification. These remaining questions are optional creative input, not blockers. Propose individual levels, boss attacks, movement tuning, controls, and save behaviour in the specification, clearly separating proposals from confirmed requirements.

## Suggested first playable milestone — to confirm

One short level on Outer America, starring Made In Australia, with running, jumping, a button-activated downward slam, two mid-air flaps replenished on landing, unlimited bouncing kangaroo projectiles with a short cooldown, ten hearts with full checkpoint refills, a few distinct troll surprises, checkpoint restarts, unlimited retries, automatic progress saving, and a clear ending. Support keyboard and controllers. Tune attacks and movement during the prototype. Use placeholder sprites initially to validate whether movement and jokes are fun. Expand into the full five-planet, 20-level adventure with spaceship travel after parent-and-child playtesting; this milestone is not the full game scope. Reserve the sole Japanese Empire boss in its big prawn suit for the end of level 5-4.

## Full specification should cover

- Agreed audience, tone, story, characters, and scope.
- Single-player turn-taking and supported controls.
- Movement rules, camera behaviour, collisions, abilities, and interactions.
- Five-planet, 20-level structure, troll encounters, the sole final Japanese Empire boss, checkpoints, and retries, with no easy or assist mode.
- Menus, pause/restart flow, progress saving, and accessibility needs.
- Art direction and asset inventory: sprite dimensions, animation states and frames, tiles, backgrounds, effects, and UI.
- Audio inventory: sound effects, music cues, looping needs, volume controls, and later Suno imports.
- Technical approach, milestones, acceptance criteria, and family playtest feedback.

## Asset and audio workflow

1. Agree on visual style and create a pigeon character reference for approval.
2. Define consistent scale, palette, transparency, sprite framing, and animation requirements.
3. Generate and review character, enemy, scenery, and effect assets; check that animation frames align and work in the game.
4. Use temporary audio hooks during development. Prepare music briefs for separate Suno generation later, then import and test the chosen tracks.

## Existing project

The current project uses Phaser 3 and Vite. Reusing that foundation is a proposal; the counting lessons and existing gameplay are not requirements for the redesign. This document captures planning only and does not implement the new game.
