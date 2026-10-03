# Pirate Battle

> **Read contract:** solution documentation, not task state or authorization. Recover uncertain intent through the [.agents index](.agents/index.md); the [company brief](CHALLENGE.md) governs material decisions. Evidence and limits remain explicit below.

A browser naval shooter built with React, TypeScript and PixiJS. Navigate the islands, fight Chasers and Shooters, and survive until the active match clock expires. The supplied challenge artwork anchors the menus, ships, weapons, terrain and HUD. The redesigned four-island archipelago supports portrait, landscape and inverted orientation with one rigid transform. Water fills the game viewport and every visible edge is navigable.

[Play the public game](https://pirate-battle-three-gray.vercel.app). The production worker and browser-local mock database require no login. The existing v1.0.0 publication is historical while the correction candidate is validated; current release evidence is identified in acceptance. [Deployment](docs/deployment.md) identifies the checked release and source correspondence.

[Delivery evidence](https://github.com/KingDonRush/pirate-battle/releases/tag/v1.0.0) contains downloadable HTML reports, useful failure traces, reviewed native captures, metrics and source/asset manifests. Extract the package and open its report `index.html` files; the manifest identifies every observation's actual revision.

The frozen [company brief](CHALLENGE.md) is the source of requirements. [Acceptance evidence](docs/acceptance.md) distinguishes checked behavior from remaining delivery work. Delivery is tracked in [Issue #12](https://github.com/KingDonRush/pirate-battle/issues/12); a green test is not a self-awarded grade.

## Run locally

Use Node **22.21.1** (see `.nvmrc`) and npm **10.9.4**. No private API, account or environment secret is required.

```sh
npm ci
npm run browser:install
npm run dev
```

Open the printed local Vite URL. The MSW worker starts independently; a failed service initialization cannot block Play or Options. Ranking, history and registration use real Axios HTTP calls intercepted by the browser worker. Their database is local to this browser/origin, including the published demonstration.

```sh
npm run lint
npm run typecheck
npm run format:check
npm run check:structure
npm run build
npm run preview
npm run test:e2e
npm run test:e2e:dev
npm run test:e2e:report
npm run profile
```

`npm run check` runs the normal structure, lint, types, formatting, build and browser suite. Headed native-focus checks need a display; Linux CI uses `xvfb-run -a npm run check`. CI runs the four browser projects on separate runners with one worker each and a protected `verify` aggregator that requires source checks and every browser job to succeed. Measured software-rendered high-DPR cases have bounded CI wall-clock budgets; active match durations, API timeouts, assertions and zero retries are unchanged. `npm run check` remains the complete local command. The optimized preview defaults to port 4173. If another application owns that port, use `npm run preview -- --port 4175` or `E2E_PORT=4175 npm run test:e2e`; do not stop the other application. The install command includes Chromium and Firefox and uses `PLAYWRIGHT_SKIP_BROWSER_GC=1` to preserve shared browser versions.

Tests silence only their browser's audio output; game sound preferences and desktop audio remain unchanged. [Profiling](docs/profiling.md) records actual source, hardware/backend, a genuine 180-active-second sample and comparable disposal cycles. Reference-v2 results do not verify the changed archipelago-v3 renderer.

## Controls and player identity

| Action              | Keyboard             | Touch                                                                               |
| ------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| Sail and steer      | W / ↑ with A/D / ←/→ | Drag the floating stick in **Direction** mode                                       |
| Throttle and rudder | Same keys            | In **Throttle & Rudder**, drag up to sail and sideways to turn; there is no reverse |
| Front cannon        | Space                | Hold the single cannon                                                              |
| Left broadside      | Q                    | Hold the left triple cannon                                                         |
| Right broadside     | E                    | Hold the right triple cannon                                                        |
| Pause / resume      | Escape               | Pause / Resume                                                                      |

Start the floating stick anywhere clear of HUD/buttons. Its 15% dead zone avoids accidental acceleration. One pointer owns steering; other contacts can fire simultaneously. Cannons default to the left; **Options → Controls → Mirror touch controls** moves them to the right. Steering mode and mirroring persist. Desktop retains keyboard and compact arrow controls.

Keyboard and independent touch contacts can coexist. Releasing/cancelling one origin does not release another. Blur, hidden tabs, pause, layout adjustment and exit release held actions. Returning to a tab requires **Resume**. Escape cancels paused Options or abandonment confirmation back to Pause; it resumes directly from Pause. Focus and hover preserve the illustrated button shape.

Display names accept 2–24 perceived characters, letters/numbers, spaces, apostrophes and hyphens; Unicode is normalized and control characters rejected. An empty Play submission or Play as guest generates a readable local name. A stable player UUID retains history across renaming; each match retains the name used at its start. Long names wrap.

## Match configuration

Home contains the captain name, guest action, Play, Options, How to play, records and pending-save notice inside its frame. Options uses **Game, Controls, Audio, Accessibility and Demo Network** tabs. Its draft survives tab changes; **Save** validates every setting and **Cancel/Escape** discards it. Long help/settings/records scroll inside the panel. Main actions stay accessible within the available viewport.

The Game tab It accepts whole-number active durations **60–180 s** and positive spawn intervals **0.75–10 s**, in **0.25 s** steps. Defaults are **120 s / 3 s**. Audio exposes persistent master/effects/ambience gains and mute; Accessibility exposes reduced motion. Paused combat edits apply to the next match; saved control/audio preferences apply on resume. Each match freezes its complete configuration.

[config.ts](src/game/config.ts) centralizes movement/rotation, HP, hull geometry, enemy distribution, damage, projectile speed/lifetime, cooldowns, Shooter range and safe-spawn parameters. Player movement is 150 units/s; Chasers use 95 and Shooters 75. A Chaser has 40 HP, a Shooter 60 and the player 100. Front shots cause 20 damage every 0.35 s; each broadside fires three **parallel** 20-damage shots every 1.2 s. Shooter shots cause 15 damage; Chaser contact causes 25 and awards no point. Player kills award one point each.

Combat rules version **3** retains continuous projectile expiry and adds the `archipelago-v3` map and `viewport` boundary policy. Historical versions 1/2 retain their original payloads and ruleset fingerprints. The 1152 × 640 canonical island group contains a fortified northwest island, small northeast/southwest islands and a medium southeast island. Main passages are at least 160 logical units wide.

The canvas fills the game viewport, with upright HUD and controls overlaid. Additional visible water belongs to the arena; the actual capsule size determines the boundary. Orientation uses a uniform scale, translation and group rotation, with no following camera or individual island relocation. Effective orientation angles support both directions and inversion; window aspect is the fallback. Resize freezes bullets, cooldowns, AI, active time and spawns, clears input and shows **Adjusting arena…**. A newer layout replaces the prior target. Two rendered stable observations and at least 100 ms settling precede continuation; manual/focus pause still requires Resume. Reduced motion keeps those checks without animated travel.

The fixed-step runtime caps one stalled frame's contribution at 250 ms. It preserves ordinary fractional time; pauses/layout transitions discard time debt. Profiling retains raw intervals, including stalls. The renderer uses the current DPR, with no device identification.

## Results and data recovery

Combat stops immediately on time/death. A separate ending presents a 450 ms explosion and approximately 900 ms defeat transition, or a shorter Time up transition; reduced motion uses a short fade. The terminal cue has a separate owner from combat audio. The immutable result is persisted immediately, before presentation completes.

A completed match saves its ID, player/name, timestamp, score, active duration, reason, seed and complete ruleset snapshot. **Saving…**, **Match saved** and a recoverable failure state describe registration. Play Again creates a fresh match. Leaving/reloading an active match abandons it without recording it. Options, name, latest completed result, confirmed records and pending records survive refresh.

IndexedDB persists results and the outbox before submission. TanStack Query owns queries, registration mutations and retry policy; Axios uses a 4 s timeout and AbortSignal. Transient failures retry twice after 1/2 s; payload validation and conflicts do not retry automatically. Same-ID/same-content submissions recover one canonical record; a conflicting payload returns 409. Acknowledgement removes only its matching outbox item and cancels/invalidates both projections. Another match can start while a save is pending.

Ranking compares the SHA-256 fingerprint of the **complete combat configuration**, then orders score descending, active duration descending, completion date ascending and ID ascending. Name, sound and layout are excluded. History follows the player UUID and retains historical names/configs. Lists show five records/page, loading/empty/error states and previous useful data during updates. Revision checks and cancellation discard stale responses. Other captains are fictional fixtures.

## Reproduce network conditions

**Options → Demo Network** selects the following conditions; use **Save** to apply the selection:

- Success, empty lists and multiple pages.
- Slow responses (1800 ms), variable latency (120/900/300/1500 ms) and out-of-order reads (1800/100 ms).
- Timeout (6000 ms), connection errors, HTTP 400/500, ranking-only or history-only failure.
- Commit followed by timeout: the write commits before its first acknowledgement is delayed; retry recovers it.
- Match-end unavailability followed by recovery.

Select a condition before completing a match, inspect the result/pending notice, refresh, and choose Success in Demo Network and Save, or retry the save. A normal scenario change keeps matches. **Reset demo data**, inside Demo Network, requires confirmation and removes only this game's confirmed/pending results, latest result and query/scenario state; name/options remain. No browser-wide storage is cleared.

## Verification and delivery

Playwright runs Chromium desktop/mobile and Firefox desktop. Asset/module failure injection blocks service workers only in those routed contexts; data scenarios retain the production browser worker. Tests use isolated contexts, seeds, real keys/native multi-pointer input, semantic HTML and the actual Axios/Query/MSW path. `?seed=42` selects a reproducible simulation seed. `?clock=manual` enables a diagnostic clock advance through the same fixed-step rules; observation/clock controls cannot set health, score, position or completion. Between explicit manual-clock advances the renderer stays idle, while layout transitions still render; the normal game/profile uses real frames. The default game uses real time.

Reviewed menu/arena/result baselines are under `tests/e2e/visual`. Regenerate with `--update-snapshots` only after inspecting the difference. The HTML report and failure traces are written under `artifacts/playwright`; useful final evidence is delivered with the source revision. The long keyboard deadline test disables per-sample trace screenshots/DOM snapshots to bound overhead while preserving input/API/source records.

See [architecture](ARCHITECTURE.md), [asset provenance/licenses](docs/assets.md), [reference presentation review](docs/visual-review.md), [profiling](docs/profiling.md), [deployment](docs/deployment.md) and [acceptance](docs/acceptance.md) for implementation ownership and evidence. Physical mobile-device testing and subjective listening cannot be inferred from emulated Chromium or audio-node counts.
