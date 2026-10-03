# Pirate Battle architecture

> **Read contract:** solution documentation, not task state or authorization. Recover uncertain intent through the [.agents index](.agents/index.md); the [company brief](CHALLENGE.md) governs material decisions. Evidence and limits remain explicit below.

The implementation keeps continuous combat outside React. Required technologies participate in their own boundaries: Pixi renders the world; React supplies semantic interface/control/dialogs; Axios transports validated REST; TanStack Query owns remote state and mutations; MSW intercepts that traffic with shared handlers; Playwright drives the complete system. [CHALLENGE.md](CHALLENGE.md) remains unchanged.

## Owners and contracts

| Owner             | Facts and resources                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Simulation`      | Typed immutable MatchConfig/MatchSession; seeded entities, HP, clocks/cooldowns, AI, collision, score and finish          |
| `GameRuntime`     | Session state, fixed-step accumulator, private Pixi Application/ticker, input, reflow, browser listeners and disposal     |
| `BattleScene`     | Scene/overlay Containers, borrowed shared atlas views, interpolated sprites, upright health bars and bounded effects      |
| React             | Screens/forms, native dialogs, controls and cached semantic HudSnapshot via useSyncExternalStore                          |
| Assets            | One application-shared load Promise, atlas validation, retry and texture sources                                          |
| AudioService      | One gesture-started context, reusable decoded buffers, application/session ownership, bounded one-shot sources and loops  |
| SubmissionService | Application-owned Query mutations, original outbox payloads, save states, deduplication and minimum acknowledged revision |
| IndexedDB/MSW     | Canonical records and transactional revision; ranking/history are projections, not separate stores                        |

The simulation imports no React, Pixi, DOM, HTTP, storage or audio. React never copies the continuous world into component state every frame. HUD publication compares meaningful state, HP/score, whole seconds, pause/layout revision and audio error; unchanged reads return the same immutable snapshot.

## Clock, input and completion

A private ticker calls one runtime loop. Raw `performance.now()` intervals feed an accumulator with fixed **1/60 s** steps. Ordinary fractional debt carries forward; an individual frame contributes at most 250 ms after a stall. Rendering interpolates previous/current poses. Raw intervals are retained separately for profiling. No shared AnimatedSprite ticker advances effects independently.

Each input origin has its own ID. Keyboard keys and pointer capture contribute actions independently; pointerup/cancel/lost capture, blur, reflow, pause and disposal clear only appropriate sources. Gameplay captures keys only while enabled, excluding forms/dialogs and native Space activation on buttons. Touch offers forward/turn diagonals and three independent weapons.

Simulation order is time-limit check, player movement/weapons, bounded spawn, enemy movement/contact/fire, then swept projectiles and alerts. Iteration/first-impact ties are deterministic. Completion is idempotent and prevents subsequent movement, attacks, damage, spawn or score; finish wins over later work in that step. The runtime freezes input/audio, stops its loop, creates the immutable result once and hands it to application-owned persistence. Restart constructs a new ID/world/HP/score/cooldowns. Leaving or refreshing an active match produces no result.

## Geometry, weapons and navigation

The 1152×640 `reference-v2` world is defined once in typed configuration. Rounded coastal regions are shared by renderer masks and collision; edge land extends beyond the canonical rectangle and is clipped at that rectangle in presentation, matching the supplied composition. Ship hulls are oriented capsules. Movement/rotation test actual occupancy against shore and arena margin, including the capsule endpoints. The presentation uses original water/terrain/fort/ship atlases; adjacent mirrored texture cells share edge pixels and avoid stretched terrain interiors.

Cannonballs sweep their traveled segment against rounded shore and hull capsules, choose the nearest impact, apply damage once and are consumed by a target/obstacle/expiry/exit. A muzzle crossing a coast cannot shoot through it. Front fire is one projectile; each lateral salvo uses three origins along the hull and parallel vectors. Weapons have independent cooldowns. Only a player attack's enemy destruction increments score, once. Chaser impact damages the player and destroys the Chaser without points. Dead enemies are removed immediately; their explosion is a separate effect.

Enemies move forward and turn with bounded angular speed. A direct free route takes precedence; blocked routes use A* over a 32-unit grid and final movement still checks real geometry. Shooter approach/fire requires configured range, heading and a clear shot. Safe spawn uses at most 32 free candidates, minimum player distance and existing-ship clearance. Failed searches retry after active time without an accumulated burst. Types alternate and briefly signal before becoming active.

Configuration snapshots include all required HP/speed/rotation, weapon values, range and spawn distribution. The ruleset fingerprint serializes sorted configuration keys and hashes the canonical bytes with SHA-256. Historical map versions and optional player-start fields are preserved during decode; loading a prior result never upgrades its fingerprint or payload.

## Coordinated responsive layout

Runtime measurements come from the real arena container, ResizeObserver, window resize and VisualViewport. CSS arranges readable HUD and 48 px minimum touch targets around the arena, with safe areas and portrait/short-landscape layouts. Canvas resolution follows DPR. `worldToView` and `viewToWorld` come from the same fit/rotation calculation.

ReflowCoordinator freezes the combat at a step boundary and clears held inputs. Portrait rotates the whole physical world 90°; scaling stays uniform and intermediate rotation bounds also fit the complete world. A new revision replaces the current target and animates from its current presentation; there is no queue or intermediate resume. Completion requires matching current dimensions/angle, positive finite fit, two rendered stable observations and 100 ms settling. Invalid/zero space remains frozen. A manual/blur/hidden pause dominates completion and needs Resume. Returning to visibility reconciles measurements, with no dependence on background requestAnimationFrame continuing. Reduced motion keeps readiness checks without animated travel.

## Asynchronous renderer and assets

Application.init is awaited before canvas attachment, observers/listeners or loop startup. Obsolete initialization may finish, but cannot attach/start; its resources are then destroyed. Both active and pending Applications participate in release ownership, so disposal cannot release global Pixi resources while another initialization is pending. Strict Mode setup/cleanup/setup is preserved.

Shared Assets promises load the selected ship, tile and UI sheets. XML/frame rectangles are validated; UI crops use logical metadata and texture-pixel frames. A failed asset promise resets for retry. Failed browser module imports require an explained page reload; a React error boundary also covers the lazy battle module before its runtime mounts. Native WebGL context loss freezes combat, disables Resume until restoration and then requires an explicit Resume; an unrecoverable render failure offers abandonment instead of silently continuing. Measured static terrain is consolidated once into a session-owned render texture (resolution 2 in canonical units), reducing an empty-world render from 14 to 4 draw calls. Context restoration rebuilds that texture from retained source geometry; disposal destroys it and its temporary display objects without destroying shared atlases. Sessions destroy their display objects, overlays/effects, observers, input and ticker callbacks, remove canvas/listeners and stop owned audio voices. Borrowed texture sources remain under the live application cache; disposing one match does not destroy the next match's textures.

## Audio and feedback

Native Web Audio starts/resumes from Play/Resume or Retry sound. Each effect creates a new one-use AudioBufferSourceNode with a reused decoded buffer. There are at most two loops and twelve effects; important cues can displace lower-priority effects. One broadside generates one sound. Gains transition smoothly; mute/master/effects/ambience persist. Pause/reflow/blur suspend combat audio. Download/autoplay failure is visible and cannot block combat; gesture recovery retries missing buffers. Generation and session-owner checks prevent late decodes/cleanup from restarting or stopping a replacement owner. Completed sources disconnect and lose references; application disposal aborts downloads, stops sources, clears buffers and closes the context.

Ship deterioration uses supplied sprite families at 66%/33% HP, short hit flashes, muzzle/impact feedback and approximately 450 ms explosions. Effect count is bounded at 64. Combat effects follow active time; reflow has presentation time. Green/blue enemy families also differ in sail symbols. Visual feedback works muted and reduced motion keeps state changes legible. Functional audio ownership evidence is distinct from listening/mix perception.

## Durable REST, cache and failures

REST endpoints are `GET /api/ranking?rulesetId&page&pageSize`, `GET /api/players/:playerId/matches?page&pageSize` and `POST /api/matches`. Unknown storage/HTTP data passes explicit validators. Lists contain items/total/page/pageSize/revision. Ranking matches complete config and sorts score descending, active duration descending, completion date and ID ascending; history follows stable player identity. Fixtures represent fictional captains.

IndexedDB holds records/outbox/meta. Completion and latest result persist before POST. Atomic canonical insertion recognizes same-ID/same-content and rejects conflicting content. Acknowledgement removes only its matching pending ID. Transactions serialize concurrent tabs. A browser refresh restores original pending payloads; names/configs are never reconstructed from current preferences.

Query keys include player/ruleset and page. Queries consume AbortSignal and refetch when revisited, retaining useful stale data during updates. Axios timeout is 4 s; transport errors distinguish cancellation, timeout, connection, HTTP and invalid payload. Query owns two transient retries after 1/2 s; validation/conflict do not retry. Acknowledged writes cancel older queries, advance the minimum revision and invalidate both projections. The application-owned mutation/service continues after navigating away from result and coalesces concurrent same-ID sends.

Browser and Node use the same handler factory with IndexedDB or isolated memory storage. Scenario counters/latencies are deterministic. Reads capture data/revision before delay, and epoch checks reject obsolete work after scenario reset. Commit-timeout performs the insertion before its first delayed response, then recognizes duplicates. Worker initialization is shared and independent of local play. Reset cancels/awaits client work before clearing game records and resetting active queries; it preserves identity/options and other applications' storage.

## Evidence and limits

[Acceptance](docs/acceptance.md) maps G01–G12/P01–P02/D01–D03 to actual revision/environment reports. Tests observe state and control seed/time, while firing/movement use real keys/native pointers and the genuine geometry/renderer/network stack. They never assign HP, score, positions or end flags. Versioned menu/arena/result references protect reviewed desktop/portrait/landscape rendering. Supplied static captures establish composition and artwork, not an absent original animation timeline; displayed combat data stays real.

The [optimized hardware profile](docs/profiling.md) completed 180 real active seconds at 60.0023FPS/p9517.40ms on WebGL2/ANGLE Vulkan/RTX4060Ti, 1440×900/DPR1. The five required same-document resource cycles were extended to ten to investigate growing heap: disposed runtime/scene owners and active resources returned to zero, while 91.2% of the total growth was compiled-code self size. Browser native pending activity and shared caches are recorded separately from session ownership. This is a standard seeded workload and a finite retention window; it does not establish worst-case/physical-phone performance or an indefinitely flat heap. Physical device tests and audible mix judgments remain separately stated limits.
