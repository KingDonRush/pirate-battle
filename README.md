# Pirate Battle

> **Read contract:** solution documentation; proposals and verified behavior are distinguished below. Recover uncertain task context through [the index](.agents/index.md); the [company brief](CHALLENGE.md) governs material requirements.

Preparation for the Jungle Gaming [game developer challenge](https://github.com/junglegaming/game-developer-challenge). The original brief is preserved in [CHALLENGE.md](CHALLENGE.md).

**Current state:** the first playable slice has a supplied-art Pixi arena, name/guest entry, persistent options, real forward/rotation and hull collisions, simultaneous touch input, manual/blur/hidden pause, and animated coordinated reflow across desktop, portrait and landscape. Durable HTTP registration, data tabs and final profiling/publication are in the open delivery [Issue #12](https://github.com/KingDonRush/pirate-battle/issues/12). Partial checks do not award rubric points.

## Setup

Use Node.js 22.21.1 and npm 10.9.4. Node 22 is also the deployment target.

```bash
nvm use
npm ci
npm run browser:install
npm run dev
```

Open `http://127.0.0.1:5173`. No environment variables or private services are required. MSW starts in development and production. Its ranking and history handlers are currently empty.

## Commands

| Command                   | Purpose                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`             | Development server                                                                              |
| `npm run build`           | Type checking and optimized build                                                               |
| `npm run preview`         | Serve the current build on port 4173                                                            |
| `npm run lint`            | ESLint, including type-aware rules                                                              |
| `npm run typecheck`       | Strict TypeScript checking                                                                      |
| `npm run format:check`    | Check authored file formatting                                                                  |
| `npm run check:structure` | Verify instruction routes, local links, rubric weights, brief integrity and checker regressions |
| `npm run test:e2e`        | Chromium desktop and mobile against the current build                                           |
| `npm run test:e2e:dev`    | Check the development build and Strict Mode                                                     |
| `npm run test:e2e:report` | Open the most recent local HTML report                                                          |
| `npm run check`           | Structural checks, lint, types, formatting, build and E2E                                       |

Run `npm run build` before standalone `test:e2e`. The current smoke test verifies startup, the supplied logo, the service worker, reload and page width. It does not verify the game. Tests and reports are isolated under `tests/` and `artifacts/playwright/`. Reports and failure traces are generated locally and by CI. CI keeps each report for seven days.

Tests start and stop their own server rather than reusing an unidentified process. If a default port is occupied, preserve that process and select a free port, for example `E2E_PORT=4174 npm run check`. `E2E_PORT` must be an integer from 1 to 65535.

## Implementation and delivery

- [Architecture](ARCHITECTURE.md): proposed boundaries and invariants.
- [Acceptance matrix](docs/acceptance.md): all seven rubric categories and the twelve required test groups.
- [Seven rubric workflows](.agents/workflows/index.md): one procedure per scored criterion, applying researched technology knowledge.
- [Skill research and security review](.agents/research/skill-qualification.md): existing packages, provenance, exclusions, cases and verified probe results.
- [Assets](docs/assets.md): atlas handling, audit and attribution.
- [Deployment](docs/deployment.md): GitHub and Vercel configuration.
- [Design review](docs/design-review.md): concrete checks for useful copy, coherent art, readable code and honest evidence.
- [Structural verification](docs/reports/structure.md): baseline, routing scenarios, reproducibility and limits.

## Engineering context and tracking

[AGENTS.md](AGENTS.md) defines stable obligations. The [intent index](.agents/index.md) selects workflows, policies and researched skills as needed. The frozen company brief has priority over conflicting project instructions; the hash check verifies its identity, while material decisions require semantic review.

[Issues](https://github.com/KingDonRush/pirate-battle/issues) hold objectives and acceptance; the public [Engineering Project](https://github.com/users/KingDonRush/projects/1) holds status and priority. PRs/commits hold changes and reasons; [Actions](https://github.com/KingDonRush/pirate-battle/actions) holds automated verification. Technical [memory](.agents/memory/current.md) carries the last observation and must be reconciled with those live sources. There is no local backlog or RUN ledger.

The current structural update creates no gameplay task or deployment. Future implementation needs its own scoped objective and current authorization.

Controls, gameplay configuration, network scenario selection/reset and failure reproduction instructions will be added here with their implementation. Until then, proposed behavior is in the architecture and rubric workflows; acceptance remains Pending.

## Current controls and responsive behavior

W/Arrow Up advances; A/D or Left/Right rotate. Escape or Pause freezes play; Resume is explicit. Touch movement includes diagonal advance/turn targets with independent contacts. Space fires forward; Q/E fire three parallel cannonballs from the left/right broadside. Chasers pursue and explode on contact without awarding a point; Shooters approach and fire within range. Each player kill is one point. Name is optional; Play as guest chooses a readable local name without changing combat seed. Options accept 60–180 integer seconds and 0.75–10-second spawns in 0.25 steps; changes apply to new matches.

Resize or orientation freezes active time and input, animates the complete arena transform, then resumes only after the current layout has settled and rendered. A manual/focus pause remains paused. Portrait and landscape use identical physical geometry. Audio loops start from Play, pause with the match and release session voices on exit.

A read-only `window.pirateBattle.observe()` projection exposes state for browser checks; `?seed=42` selects a reproducible combat seed. Tests never change world outcomes through that projection.

Completed time/death results and their original name/config are written to IndexedDB before registration. Refresh restores the last result; Play Again creates a new identity and clean world. Pause Options applies combat changes only to the next match. Audio uses bounded supplied effects, at most two loops and twelve effect voices.

For long browser rule checks, `?seed=42&clock=manual` suspends automatic simulation time and permits `window.pirateBattle.advance(milliseconds)`. It advances the same runtime accumulator, input, rules, collisions and rendering in bounded increments; it cannot set world fields or force outcomes. Ordinary play and profiling use real time. Native visibility checks use a headed Chromium project under `xvfb-run -a npm run check` on Linux; it creates actual background tabs and disables Playwright's focus emulation.
