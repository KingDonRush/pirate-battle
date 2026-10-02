# Pirate Battle

Preparation for the Jungle Gaming [game developer challenge](https://github.com/junglegaming/game-developer-challenge). The original brief is preserved in [CHALLENGE.md](CHALLENGE.md).

**Current state:** the development environment and implementation plan are prepared, and the startup checks pass. The page is a startup scaffold. Combat, menus, ranking, history, failure scenarios and game regression tests still need implementation. Installing a required library does not satisfy the corresponding assessment criterion.

## Setup

Use Node.js 22.21.1 and npm 10.9.4. Node 22 is also the deployment target.

```bash
nvm use
npm ci
npm run browser:install
npm run dev
```

Open `http://127.0.0.1:5173`. No environment variables or private services are required. MSW starts in development and production. Its ranking and history handlers will be implemented next.

## Commands

| Command                   | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `npm run dev`             | Development server                                    |
| `npm run build`           | Type checking and optimized build                     |
| `npm run preview`         | Serve the current build on port 4173                  |
| `npm run lint`            | ESLint, including type-aware rules                    |
| `npm run typecheck`       | Strict TypeScript checking                            |
| `npm run format:check`    | Check authored file formatting                        |
| `npm run test:e2e`        | Chromium desktop and mobile against the current build |
| `npm run test:e2e:dev`    | Check the development build and Strict Mode           |
| `npm run test:e2e:report` | Open the most recent local HTML report                |
| `npm run check`           | Lint, types, formatting, build and E2E                |

Run `npm run build` before standalone `test:e2e`. The current smoke test verifies startup, the supplied logo, the service worker, reload and page width. It does not verify the game. Tests and reports are isolated under `tests/` and `artifacts/playwright/`. Reports and failure traces are generated locally and by CI. CI keeps each report for seven days.

Tests start and stop their own server rather than reusing an unidentified process. If a default port is occupied, preserve that process and select a free port, for example `E2E_PORT=4174 npm run check`. `E2E_PORT` must be an integer from 1 to 65535.

## Implementation and delivery

- [48-hour plan and research](docs/PLAN.md): scope, priorities, sources and design review.
- [Architecture](ARCHITECTURE.md): proposed boundaries and invariants.
- [Acceptance matrix](docs/ACCEPTANCE.md): all seven rubric categories and the twelve required test groups.
- [Seven rubric workflows](docs/WORKFLOWS.md): one procedure per scored criterion, applying researched technology knowledge.
- [Skill research and security review](docs/SKILL-RESEARCH.md): existing packages, provenance, exclusions, cases and verified probe results.
- [Assets](docs/ASSETS.md): atlas handling, audit and attribution.
- [Deployment](docs/DEPLOYMENT.md): GitHub and Vercel configuration.
- [Preflight](docs/PREFLIGHT.md): verified environment and remaining work.

Controls, gameplay configuration, network scenario selection/reset and failure reproduction instructions will be added here with their implementation. Until then, their proposed behavior is in the plan and architecture.
