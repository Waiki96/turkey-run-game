[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Waiki96/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Waiki96/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Turkey Run — Thanksgiving Escape

A turkey escape game for [make.fun's turkey-run-game-01 bounty](https://make.fun/bounty/turkey-run-game-01) ($250 USDC, 20 places paid).

Thanksgiving morning. The farmer is coming for you. Run 1000 metres from the
farmyard, through the cornfield and past the kitchen yard, to the forest gate —
and live to gobble again.

## How to play

Open `game/index.html` in a desktop browser (no build step, no network — the
game is plain static files under `game/`).

- **SPACE / ↑ / click** — jump
- **DOWN** — slide under low branches, and hold to brake
- Jump fences, hay bales, pumpkins and the oven. Slide under branches.
- **Brake to time the carving knife**: it slashes down on a cycle — wait it
  out, or jump its low base while the blade is up.
- Grab corn for points and golden feathers for a shield (one free hit).
- Three lives. Every stumble lets the farmer close in — if he reaches you,
  you're Thanksgiving dinner. Reach 1000 m and you escape.

Keys: **P** pause, **M** sound on/off, **R** restart. Your best score is kept
in the browser.

## What it is

A 2D canvas runner written from scratch in plain JavaScript (no engine, no
assets): every sprite is drawn procedurally, every sound is synthesized
with WebAudio. The source is split by job — `config.js` (tuning),
`random.js` (seeded RNG), `audio.js` (sounds), `input.js` (keyboard/mouse),
`world.js` (level, obstacles, the farmer chase), `render.js` (all the art),
`main.js` (loop, states, autopilot).

An autopilot plays the game by itself (`decide()` in `main.js`) — it is how
the screenshots were produced and the proof the game is winnable.

## Screenshots

The four screenshots in `screenshots/` are real renders of this game's own
code in a browser: the title screen, a run in play, the oven and knife trap,
and the escape. Demo states are driven by the URL hash (`#demo=title`,
`#demo=play`, `#demo=oven`, `#demo=escaped`, `#demo=caught`).

## Hand in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the vendored
`vendor/makefun-game.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
