# Architecture

> **Read contract:** solution documentation; proposals and verified behavior are distinguished below. Recover uncertain task context through [the index](.agents/index.md); the [company brief](CHALLENGE.md) governs material requirements.

Status: implementation design, established during preflight on October 1, 2026. Only the React bootstrap, stable QueryClient, browser MSW startup and tooling currently exist. Replace design claims with verified behavior as each slice ships.

The build uses Vite and plain CSS. TypeScript 6.0.3 remains within the installed typescript-eslint 8.71.0 peer range (`>=4.8.4 <6.1.0`). Dependency versions are not changed by the governance migration.

## Responsibilities and dependencies

| Area              | Owns                                                                            | Depends on                                                        |
| ----------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `game/simulation` | Match state, movement, AI, collisions, damage, cooldowns, spawns and completion | Typed config, input state, seeded RNG and elapsed simulation time |
| `game/rendering`  | Pixi scene, textures, ship health, damage appearance and effects                | Read-only simulation state and short-lived visual events          |
| `game/input`      | Keyboard and pointer state, capture and release                                 | Active gameplay context                                           |
| `game/runtime`    | Clock, simulation/render connection, pause and disposal                         | The three areas above                                             |
| React features    | Menu, options, HUD, dialogs, results and data tabs                              | Runtime commands, cached UI snapshots and query hooks             |
| Data layer        | Axios contracts, Query keys, submission mutation and durable outbox             | Browser storage and HTTP                                          |
| MSW layer         | Fixtures, scenario state and the simulated authoritative match database         | Shared contracts and storage                                      |

Create these modules when their behavior is implemented. The simulation has no React, Pixi, Axios, storage or DOM imports. Start with direct functions and small typed records. Add a reusable abstraction only when another concrete caller needs it.

## Match lifecycle and time

The runtime uses explicit `loading`, `ready`, `running`, `paused`, `finished` and `disposed` states. A completed match carries an end reason, effective duration, score, match ID, player ID, timestamp and the configuration snapshot taken at start. Returning to the menu from a live match abandons it and does not create a completed result.

Use a fixed simulation step of 1/60 second with an accumulator fed by Pixi's frame timestamp. Convert speed and rotation from units per second. Cap a single frame contribution at 250 ms and document that exceptionally long stalls can lose excess wall time. Normal frame rates must produce equivalent gameplay over the same active time. Use simulation time for the match duration, spawn schedule, weapon cooldowns and projectile lifetime. One callback drives simulation and rendering, without a second interval clock.

Pause stops advancement of all simulation time. Losing focus or hiding the page clears held input and enters `paused`. Resume requires a player action, resets the frame timestamp and accumulator, and starts with empty input. A frame after resume must not consume the gap spent paused.

Completion happens once. Once finished, movement, attacks, spawns, damage and scoring cannot advance. Create the completed result and persist it before starting the registration request. Starting another match creates a new match ID and new simulation entities, even if an earlier result is pending submission.

## Configuration and input

Options expose session duration (60–180 seconds) and positive enemy spawn interval. Proposed spawn bounds are 0.75–10 seconds, default 3 seconds; these remain balance choices until playtesting. Centralize all other values required by the brief in a typed, versioned configuration. Enemy distribution must guarantee both types occur in the standard match.

Proposed keyboard mapping: W/Arrow Up advances, A/D or Left/Right rotate, Space fires forward, Q/E fire left/right, and Escape pauses. Touch uses two clusters of large HTML buttons for movement and attacks. Multiple pointer IDs and keyboard actions contribute to held input independently. `pointerup`, `pointercancel`, lost capture, blur and pause release actions. Capture gameplay keys only while the game owns input, excluding menus, dialogs and editable controls.

## Collisions, AI and scoring

Arena art and obstacle geometry derive from the same level definition. Use circle hulls and explicit blocked tile rectangles initially. Check swept projectile segments against targets and obstacles so a fast cannonball cannot pass through a thin island. Resolve the first impact, consume the projectile and apply damage once. Limit every weapon independently, including each lateral side. A broadside consists of three parallel trajectories offset along the hull; it is not a spread of diverging angles.

Both enemies move forward and turn at a bounded angular speed. The Chaser pursues, deals one collision hit and self-destructs without awarding a point. The Shooter approaches and fires within its configured range. Use simple waypoint routing around blocked cells when a direct path is obstructed. Validate this behavior through inputs and rendered outcomes before optimizing it.

Spawns check obstacle clearance, arena bounds and minimum distance from the player. Use bounded candidate selection and a documented retry on the next step when no valid location exists. A destroyed enemy becomes inactive immediately and awards exactly one point only when killed by a player attack. Visual explosion objects may outlive it briefly; those objects cannot participate in combat.

## React and Pixi integration

React owns screen navigation and controls. One integration effect mounts and disposes a private Pixi Application. Handle cancellation while asynchronous `app.init()` or asset loading is still pending: an obsolete mount cannot append its canvas, install listeners or start a ticker. Strict Mode must exercise setup, cleanup and setup successfully.

Keep positions and other continuous state in the simulation. Expose a cached immutable HUD snapshot through `useSyncExternalStore`, publishing discrete changes and the displayed clock value. `getSnapshot` must return the same object until a published value changes. Health bars above ships remain Pixi objects. Avoid a React subscription to the full world.

Use a fixed logical arena and a uniform viewport scale. Letterbox when necessary rather than crop the world. Resize the renderer to its container, cap render resolution at `min(devicePixelRatio, 2)` initially, and invert the viewport transform when mapping input coordinates. Support desktop and landscape mobile; provide a usable portrait layout with the complete arena and controls, plus an optional landscape suggestion. Rotation must not reset the match or change its logical geometry.

Load only assets needed for the current screen through explicit Vite URLs. Cache shared texture sources at application scope. Session disposal removes sprites, listeners, observers, effect objects and the private ticker without destroying textures another scene still uses. Audio starts after user input, pauses with the match and releases voices on exit. Stop and disconnect session voices while retaining only reusable buffers.

## Ranking, history and the outbox

Proposed REST resources: `GET /api/ranking?rulesetId=...&page=...`, `GET /api/players/:playerId/matches?page=...`, and `POST /api/matches`. Validate pagination and payloads at the boundary. A record includes the full config snapshot; a canonical ruleset fingerprint includes every balance parameter affecting comparison, not just match duration. Rank within the same ruleset by score descending, effective duration ascending, completion timestamp ascending, then match ID ascending. This is a deterministic tie policy to document and test.

Use one persistent mock database indexed by match ID. Ranking and history are projections of that database, so registering a match never writes two independent copies. A duplicate ID with the same result returns the stored record. A conflicting payload for an existing ID returns an explicit conflict response.

The client's versioned outbox holds completed results until acknowledgement. Persist before sending; do not infer success from a timeout or a local optimistic row. Registration uses a TanStack mutation whose lifecycle is independent of the result screen. Retry at most two transient failures with bounded delays, then show a retry action. Validation failures require a clear error. Restore pending records after refresh and resend their original IDs. Delete an outbox item only after confirming the matching record. Keep pending records available while the player starts new matches.

Query keys include resource, player/ruleset identity and page. Pass TanStack's abort signal to Axios; cancel obsolete requests before updating related cache entries. Invalidate/refetch ranking and history after acknowledgement and when their tabs become active. An older response must not replace data fetched after the acknowledged write. Axios has an explicit timeout; both timeout and abort are classified at the data boundary.

Mocks start in the published browser build. Scenario controls belong in a disclosed panel on the menu. Scenarios specify latency/response order and failure point separately. For timeout-after-commit, persist on the mock side before delaying the response; a retry must hit the original record. Reset removes only the game's namespaced records, outbox and scenario state, and resets Query cache consistently.

## Verification and current limits

The [acceptance matrix](docs/acceptance.md) owns verification status. Add pure-rule tests when simulation functions exist, and browser tests that use actual keyboard and pointer controls. Test hooks may observe immutable snapshots and control elapsed time/seed; they cannot set score, apply damage, fabricate completion or move entities to pass combat tests.

Use the optimized build for a 180-second profiling run and five start/play/exit cycles. Record FPS, p95 frame intervals, entity counts, listener/ticker counts, memory method and environment. Headless Chromium is useful for regression; hardware acceleration on a real browser is the production performance reference. Persist options, last completed result, confirmed mock records and pending submissions. Active combat is deliberately not restored after reload.
