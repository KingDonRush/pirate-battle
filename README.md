# Pirate Battle

> **Read contract:** solution documentation; proposals and verified behavior are distinguished below. Recover uncertain task context through [the index](.agents/index.md); the [company brief](CHALLENGE.md) governs material requirements.

Preparation for the Jungle Gaming [game developer challenge](https://github.com/junglegaming/game-developer-challenge). The original brief is preserved in [CHALLENGE.md](CHALLENGE.md).

**Current state:** the page is a startup scaffold. The repository has engineering instructions, researched technology references and GitHub tracking; structural validation is recorded separately from game acceptance. Combat, menus, ranking, history, failure scenarios and game regression tests still need implementation. Installing a required library does not satisfy the corresponding assessment criterion.

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
