# Acceptance matrix

> **Read contract:** solution documentation, not task tracking or authorization. Use it for the named subject; recover uncertain task context through [the index](../.agents/index.md) and check the [company brief](../CHALLENGE.md) before a material decision.

Source: [official brief](../CHALLENGE.md), snapshot `315891441be81ca0bff75cf3c2b0cd2f27f119cd`. Current state: first playable arena candidate under Issue #13; combat/data/final delivery remain pending. **No rubric category is verified yet.** Keep the original weights; do not invent point values for individual tests.

## Rubric and evidence

| Category                                                 |  Points | Required evidence                                                                                                                                                                   | Status      |
| -------------------------------------------------------- | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Gameplay, rules, collision and enemy behavior            |      35 | G03–G09; real forward/rotation/parallel broadside controls, safe spawns, island/arena blocking, one-hit projectiles, damage, both enemies, correct scoring and immutable completion | Pending     |
| PixiJS, architecture and resource lifecycle              |      20 | G02, G06–G09; frame-independent simulation, bounded React bridge, asset reuse/failure handling, viewport/input transforms, Strict Mode and complete disposal                        | Pending     |
| Interface, feedback, responsive layout and accessibility |      15 | G01–G09, G10; all required screens, ship health/HUD, readable damage and effects, keyboard/dialog semantics, simultaneous usable touch and full arena                               | Pending     |
| Query, Axios and consistent ranking/history              |      10 | G10–G12; typed pagination, exact ruleset comparison and tie policy, cache/refetch/cancellation, unique records and durable recovery                                                 | Pending     |
| MSW and failure scenarios                                |       5 | G10–G12; shared network handlers, persistent projections, reproducible selector/reset and published browser interception                                                            | Pending     |
| Playwright tests                                         |      10 | All twelve groups on Chromium desktop/mobile, independent state, seed/clock controls, actual inputs, reviewed/versioned menu/arena/result baselines, HTML report and failure traces | Pending     |
| Performance and documentation                            |       5 | P01–P02, D01–D03; optimized-build 180-second metrics, five resource cycles, English setup/architecture docs and a reproducible public delivery                                      | Pending     |
| **Total**                                                | **100** | All categories evidenced; the evaluator assigns the grade                                                                                                                           | **Pending** |

## Twelve required browser test groups

| ID  | Coverage and observable checks                                                                                                                                                                                                                                  | Status  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| G01 | Navigate Play/Options/Ranking/Match History; keyboard focus; validate session 60/180 boundaries and invalid values; positive documented spawn bounds; save/cancel and reload persistence. A new match takes a config snapshot.                                  | Pending |
| G02 | Visible asset progress/loading; correct textures; missing/corrupt asset failure; explicit retry succeeds. Obsolete loads cannot start an exited scene.                                                                                                          | Pending |
| G03 | Use keyboard to advance/rotate, check arena bounds and island blocking, compare movement at controlled frame schedules. Touch input uses the same rule path.                                                                                                    | Pending |
| G04 | Forward shot and left/right volleys each consume their cooldown; lateral shots have parallel directions and distinct origins; projectile first-hit/obstacle/expiry behavior; life, destruction and score exactly once. Destroyed ships immediately stop acting. | Pending |
| G05 | Both enemy types appear in a standard seeded match; bounded rotation/forward movement, island avoidance and configurable spawn cadence; spawns clear the player/obstacles. Chaser damage/self-destruction awards no point; Shooter attacks only within range.   | Pending |
| G06 | Finish at active-time deadline and at zero life; result contains score/effective duration/reason/config; no further time, input, spawn, damage or points; restart restores life/entities/cooldowns and changes match ID.                                        | Pending |
| G07 | Manual pause, blur and hidden-tab pause suspend timer/cooldowns/spawns; regain focus does not resume automatically; explicit resume clears held actions and accumulated paused time.                                                                            | Pending |
| G08 | Result screen shows totals, end reason, save state/retry, Play Again and Main Menu; latest completed result survives reload without another registration.                                                                                                       | Pending |
| G09 | Leave/reload live combat and confirm no ranking/history registration; repeat screen and start/exit navigation; check listener/ticker/entity cleanup; simultaneous touch movement/fire, pointer cancellation, resize/orientation and visible HUD/arena.          | Pending |
| G10 | Ranking/history loading, empty, error, background updating and multiple pages; player identification/date/duration/reason; ranking within exact config and deterministic ties; re-enter a tab and receive current data without blocking Play.                   | Pending |
| G11 | Complete a match through gameplay; one acknowledged record feeds both tabs; mutation invalidates them; unavailable network leaves a durable pending item; refresh and recovery register it; another game can start while it is pending.                         | Pending |
| G12 | Retry after commit-then-timeout and repeated clicks recover the same ID; no duplicate history/ranking row; controlled late response cannot overwrite post-write data; isolated scenario reset reproduces the failure.                                           | Pending |

Every scenario begins in a fresh browser context with known game namespaces, fixture state, seed, clock and network plan. A test may inspect state or advance time. A combat test cannot set score, hit points, entity positions or end flags to manufacture its expected result.

## Network scenario inventory

Shared fixtures and handlers must support: success; empty lists; several pages; fixed delay; variable delay; responses deliberately out of order; Axios timeout; connection failure; HTTP 4xx; HTTP 5xx; ranking-only failure; history-only failure; commit followed by response timeout; and match-end unavailability followed by recovery. The menu's disclosed scenario panel names the selected scenario and provides a scoped reset. Use fixed scenario timing in tests.

## Profiling and delivery

| ID  | Evidence                                                                                                                                                                                                                                      | Status  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| P01 | Run a 180-second match in an optimized build. Record FPS, p95 frame interval, peak entity counts, hardware, acceleration/backend, browser, viewport, DPR, ruleset and observed limits. Target 60 FPS in the documented reference environment. | Pending |
| P02 | Five start/play/exit cycles with a consistent memory method; record heap/retained resources, listener/ticker/audio/entity counts and any continuous growth investigation. A count alone is not proof of a leak.                               | Pending |
| D01 | English README with setup, actual controls, config, env requirements, network scenario selection/reset, commands and failure reproduction. English ARCHITECTURE describes the implemented design and balance decisions.                       | Pending |
| D02 | Source, lockfile, assets/provenance, mocks, fixtures, tests and reviewed visual baselines available from a clean checkout; current HTML test report and failure traces; useful profiling evidence.                                            | Pending |
| D03 | Public URL, same commit as delivery, production MSW, initial load/reload, desktop/touch verification, no unhandled console errors and access without private services or evaluator login.                                                     | Pending |

## Preflight evidence boundary

The startup smoke test checks React boot, one supplied logo, service worker activation, reload and horizontal overflow. It demonstrates environment readiness only. It earns no self-assigned game points. Replace it with game flow tests once those paths cover startup.

## First playable slice evidence

Issue #13 candidate includes real movement/rotation, hull-island/arena blocking, name/guest and persistent options, asset retry/late-load cancellation, explicit pause/time-debt clearing, generation-based coordinated reflow and concurrent native touch cancellation. Local optimized check passed 20 cases on Chromium desktop/mobile; root Strict Mode development checks passed 10 targeted cases. Normal lint/types/format/structure/build passed. Rendered review covered menu and 320×568, 568×320, 768×1024 and 1280×720 arena layouts and corrected the water tile selection. This is partial evidence for G01–G03/G07/G09, not complete verification of those groups or a rubric grade. Integration evidence belongs in the Issue/PR.

Combat candidate (#14/#15) adds real-control parallel weapons/cooldowns/player kills, seeded Chaser/Shooter behavior, one-hit swept collisions and finish/restart. Result persistence retains identity and config across refresh. Native headed background-tab checks cover explicit visibility resume on desktop/mobile sequentially. Remote integration, complete visual baselines and final profiling/publication remain unverified.
