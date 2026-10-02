# Preflight

October 1, 2026. Delivery target supplied by the user: October 3, 2026.

## Prepared

- Official challenge cloned at `315891441be81ca0bff75cf3c2b0cd2f27f119cd`; original README preserved as `CHALLENGE.md`.
- Local branch `chore/preflight`, with the brief repository named `upstream`. No personal remote or public deployment created.
- Existing Node.js 22.21.1 and npm 10.9.4 reused. `.nvmrc`, engine limits, exact dependencies and lockfile make setup reproducible.
- React 19.3.0, PixiJS 8.21.0, TanStack Query 5.104.0, Axios 1.20.0, MSW 2.15.0, Playwright 1.62.1, Vite 8.3.2 and TypeScript 6.0.3 selected.
- Strict types, type-aware ESLint, React rules, formatting, development/build/preview commands and Chromium desktop/mobile E2E configuration.
- MSW worker included under `public/`, awaited before React startup in both development and production. Actual ranking/history handlers remain unimplemented.
- GitHub Actions quality workflow and Vercel static-build settings prepared.
- Two reviewed Vercel React reference packages, the official Pixi skill collection reused from the locked dependency, ten explicitly authored research/technology entrypoints with substantive case chapters, and seven workflows matching the rubric. Provenance, security-review limits and source corrections are in `SKILL-RESEARCH.md`.

## Verification

Verified locally after reinstalling from the lockfile with `npm ci`:

- `npm run check` passed: lint, strict types, formatting, optimized build and two startup E2E cases (Chromium desktop/mobile).
- `npm run test:e2e:dev` passed two more startup cases against the development server with root Strict Mode.
- The browser checks confirmed heading, supplied logo decoding, MSW worker control, reload, no horizontal overflow and no browser console/page errors.
- Skill validation is structural, not proof of specialization. The expanded knowledge and seven workflow routes are checked separately; live research probes exercised Query identity/loading/cancellation, Axios/MSW commit-then-timeout and strict TypeScript boundary parsing. Game/browser/profile acceptance remains unverified until implementation.
- Both XML/JSON atlas rectangles and UI image links are valid. Asset audit details are in `ASSETS.md`.
- The original brief remains byte-identical to upstream. The remote HEAD still matches the inspected snapshot.

The GitHub workflow is prepared using verified action release commits, but has not run on GitHub yet. The local browser smoke tests do not establish combat coverage, visual baselines, game performance or published-site correctness.

## Implementation still required

All game mechanics and user screens, REST contracts and fixtures, durable outbox/mock database, configurable failure scenarios, the twelve gameplay/data E2E groups, reviewed visual baselines, profiling evidence and the public URL remain pending. See [ACCEPTANCE.md](ACCEPTANCE.md).

## Resource lifecycle

Project dependencies, the lockfile, source assets and skills are intentional development resources. The browser setup reuses Chromium revision 1234 with garbage collection disabled. An installer initially removed that pre-existing shared revision; it was restored, and the superseded revision 1243 introduced during preflight was removed after checking cache references.

Private Drive exports were processed in memory. After verification, the temporary contact sheets, preflight `dist/` build and `artifacts/` test reports were removed. No project development/test server remained running. Both pre-existing Chromium installations were confirmed present, and this task's cleanup record was resolved and removed. The startup tests regenerate an HTML report when run again. Sources, source assets, dependencies, lockfile and skills remain for implementation.
