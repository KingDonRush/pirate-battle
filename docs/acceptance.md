# Acceptance matrix

> **Read contract:** revision-bound solution evidence, not task tracking or authorization. Recover context through the [.agents index](../.agents/index.md) and preserve the [company brief](../CHALLENGE.md). GitHub Issues and integrated checks own completion; test counts are not a rubric grade.

The frozen brief is company commit `315891441be81ca0bff75cf3c2b0cd2f27f119cd`, SHA256 `15f28ff1404bb25651503bca922223b9f74ece0aacd79a2a2253078c33fcf7e9`. All seven original weights remain unchanged. The complete behavior is implemented and checked; final integrated-source publication, permanent evidence and owned-resource closure remain the delivery gate until recorded in [parent #12](https://github.com/KingDonRush/pirate-battle/issues/12).

## Source and evidence

- PRs [#21](https://github.com/KingDonRush/pirate-battle/pull/21), [#22](https://github.com/KingDonRush/pirate-battle/pull/22), [#23](https://github.com/KingDonRush/pirate-battle/pull/23) and [#24](https://github.com/KingDonRush/pirate-battle/pull/24) integrate arena, combat, durable data and complete presentation/verification.
- Current implementation candidate `b4e331915e74a7d595a6ee9169f60fd289f8a2e5` passed the normal local gate and both [PR CI](https://github.com/KingDonRush/pirate-battle/actions/runs/37085999427) and [push CI](https://github.com/KingDonRush/pirate-battle/actions/runs/37085996804). They install from a clean checkout with `npm ci`; no private services are required.
- PR #24 integrated as `5903242133a7916dc966ba2b8f9c5dd7cabb2427`; its [integrated CI](https://github.com/KingDonRush/pirate-battle/actions/runs/37087251726) passed. Final report/publication/source correspondence and cleanup are recorded at Issue closure, never inferred from an older candidate check.
- The complete optimized suite passed **99 cases**, with two documented duplicate-view skips and **zero retries**. Eighteen affected development/root Strict Mode cases also passed after the renderer/stream corrections. It runs Chromium desktop/mobile plus a headed actual-tab focus check. The two skips avoid duplicating native1800×1000/desktop-DPR1 capture under phone emulation; genuine phone portrait/landscape still run.
- [Public game](https://pirate-battle-three-gray.vercel.app): the first clean `a600c89` release also passed 99 public browser cases and anonymous initial/reload/worker/asset-response checks. The final release replaces that artifact; [deployment](deployment.md) and the public `build-info.json` identify the revision.
- Clean `3bc40a3e7baef037b1715ebe5355859ed869d87c` completed the final post-cleanup hardware profile and ten resource cycles. [Profiling](profiling.md) records the exact build/tree, method, standard ruleset, real outcomes, raw intervals and retained-owner investigation.

The final public evidence package contains optimized, development, public and profiling HTML reports, labelled useful failure traces, native reference captures, metrics JSON and asset/source manifests. [Delivery release v1.0.0](https://github.com/KingDonRush/pirate-battle/releases/tag/v1.0.0) resolves the final integrated source once its publication gate passes. Useful CI artifacts are temporary (seven days); the delivery package preserves final evidence independently.

## Rubric

| Required category                                        |  Points | Implementation and verification                                                                                                                                                       |
| -------------------------------------------------------- | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gameplay, rules, collision and enemy behavior            |  **35** | G03–G09: real simultaneous controls, capsule/shore geometry, swept first-hit projectiles, parallel weapons, bounded AI/safe spawning, score attribution, active time, finish/replay   |
| PixiJS, architecture and resource lifecycle              |  **20** | G02/G06–G09/P02: independent simulation/private renderer clock, stable semantic HUD bridge, generation-based reflow, late async replacement, context recovery, ownership/disposal     |
| Interface, feedback, responsive layout and accessibility |  **15** | G01–G10: complete supplied-art screens, real health/HUD, readable damage/effects, native forms/dialogs/tabs, visible focus, independent usable touch, full arena in both orientations |
| Query, Axios and consistent ranking/history              |  **10** | G10–G12: validated typed REST/pagination, full-config rulesets/ties, application-owned mutations, cancellation/revision protection, transactional canonical records/outbox            |
| MSW and reproducible failures                            |   **5** | G10–G12: shared browser/Node handlers and deterministic plans, persistent projections, selectable failure/recovery/reset, public worker and observed-stream cleanup                   |
| Playwright                                               |  **10** | All twelve groups, real keys/native pointers, isolated seed/time/storage, fifteen reviewed/versioned baselines, HTML reports and labelled failure diagnostics                         |
| Performance and documentation                            |   **5** | P01–P02/D01–D03: genuine180 active seconds / 60FPS target, retained-resource investigation, English setup/design/provenance and public source-bound delivery                          |
| **Total**                                                | **100** | Every required criterion maps to observable evidence; the evaluator assigns the grade                                                                                                 |

## G01–G12

All groups below passed the complete implementation candidate suite. Final integration/public checks identify their revision separately above and in the delivery manifest.

| Group | Checked behavior                                                                                                                                                                      | Test owners                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| G01   | Name/guest/Unicode bounds, stable identity, navigation/keyboard, options bounds/errors/save/cancel/reload, immutable current-session settings                                         | arena, combat, data          |
| G02   | Visible loading, correct/missing/corrupt assets, retry, exited late load, async renderer replacement/rejection, failed lazy module recovery, audio failure/gesture recovery           | arena, journey               |
| G03   | Actual forward/rotation, bounds/shore blocking, touch, frame-partition equivalence/fractional debt and raw stalled-frame cap                                                          | arena, clock                 |
| G04   | Front and both three-parallel-origin salvos, independent cooldowns, first coastal/hull impact, one damage/score transition, bounded expiry/last step                                  | combat                       |
| G05   | Standard seeded Chaser/Shooter spawns, bounded rotation/forward pursuit, actual obstacle routes, safe configured cadence, Shooter range/line of fire, Chaser contact with zero points | combat, navigation, protocol |
| G06   | Actual time and death endings, immutable result/world after finish, new identity/HP/score/entities/cooldowns on replay, real keyboard deadline                                        | combat, deadline, protocol   |
| G07   | Manual pause, actual native tab hide/return, synthetic blur and WebGL interruption; time/cooldown/projectile/spawn freeze, explicit Resume/no accumulated held actions                | arena, journey, focus        |
| G08   | Result totals/duration/reason/save states, fresh replay and persistence of original completed result/ID after refresh                                                                 | combat, data, visual         |
| G09   | Abandon/reload exclusion, repeated navigation/cleanup, actual simultaneous Chromium touch IDs/cancellation, latest reflow target, pause precedence, full bounds at ten sizes/DPR1–3   | arena, journey, layout       |
| G10   | Paginated ranking/history, five rows, loading/empty/errors/stale updates, tabs by keyboard, complete-config ruleset/ties, isolated tab failure and scoped reset                       | data, network-contract       |
| G11   | Genuine game completion → one stored result in both projections, invalidation, pending refresh/recovery, another match while pending                                                  | data                         |
| G12   | Actual commit-before-timeout, refresh and repeated retry/unique ID, late pre-write revision protection, browser/Node shared contracts and conflicting payload rejection               | data, network-contract       |

The diagnostic adapter can observe and advance the real fixed-step clock. It cannot assign HP, score, positions or completion. Combat assertions drive actual keys/touch, collisions and rendering. Pure-rule scenarios are labelled separately from browser journeys. Browser requests retain Axios/Query/MSW; the worker is enabled in public verification.

## Presentation and access

[Reference review](visual-review.md) covers menu/Options/ranking/history/arena/pause/result at 1800×1000. Fifteen baselines protect menu/arena/result on desktop and portrait/landscape phone contexts. The ten-size matrix covers 1280×720,1440×900,768×1024,1024×768,320×568,360×640,390×844,568×320,667×375,844×390 at DPR1/2/3, including long names and usable 48px touch targets. Actual native pointers verify simultaneous movement/fire and cancellation; handler-only cases are identified.

Reflow preserves physical entity identity/positions, freezes all active combat clocks, replaces superseded destinations without intermediate resume, validates rendered fit and clears old inputs. A manual/blur/hidden pause dominates automatic completion. Reduced motion keeps readiness checks. Async exit/replacement and context restoration have current candidate coverage.

Native forms, labelled errors, buttons, manual keyboard tabs and modal dialogs supply focus containment/return. The semantic HUD publishes meaningful changes and does not announce the ticking timer every frame. Normal visual/deadline journeys audit console/page errors. Expected network/asset failure responses are classified as recoverable states, not broadly ignored errors.

## P01–P02 and D01–D03

| Criterion | Observed evidence and remaining boundary                                                                                                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P01       | Final clean optimized standard 180s match:60.0025FPS, p9517.40ms, maximum19.20ms, peak rendered ships/projectiles/effects2/11/7, both enemy types, no pauses/errors. Actual RTX4060Ti/ANGLE Vulkan, Chromium151,1440×900/DPR1. Real keyboard protocol, no outcome assignment.                       |
| P02       | Five required same-document8s play/leave cycles extended to ten. Owned session resources/unique runtime-scene objects returned to zero. Growing observation ports were fixed (51→91 before;3 in all ten final cycles). Heap growth is classified by native roots/code categories and finite limits. |
| D01       | English [README](../README.md), [ARCHITECTURE](../ARCHITECTURE.md), config/controls/options/scenario/reset/failure reproduction, audio/clock/resource/data/ruleset decisions and [asset attribution](assets.md) are implemented.                                                                    |
| D02       | Source/lockfile/assets/mocks/fixtures/tests/fifteen baselines available publicly; current clean-checkout CI and final public report/trace/profiling package/source manifests identify exact evidence.                                                                                               |
| D03       | Authorized personal Vercel project/public HTTPS, no evaluator login/private API. First public build passed the full suite; the final integrated-source artifact/manifest/public check and owned-resource closure remain the publication completion gate.                                            |

Physical Android/iOS/tablet tests and subjective listening were not performed. Chromium device emulation is described as emulation. Digital audio measured 945 windows with peak 0.69359 and zero sampled clipping at default gains; this does not prove perceived delay, masking or loop seams. Static references establish composition/assets, with actual combat data and approved additions; their unidentified original font/absent animation timeline cannot establish exact original-font or every-animation-frame equality. The standard profiling workload is not a worst-case or physical-phone benchmark, and ten resource cycles do not prove indefinitely flat memory. These limits do not substitute manufactured evidence.
