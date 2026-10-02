# PixiJS, architecture and resource lifecycle — 20 points

> **Read contract:** project procedure for this rubric criterion. Recover intent through [the index](../index.md), read the relevant [company requirement](../../CHALLENGE.md) and apply [common engineering](../policies/engineering.md). Load only the selected skills; reenter the index if task or evidence is unclear.

Contract: brief section 4 and [G02, G06–G09](../../docs/acceptance.md). This workflow owns the simulation/render/input/UI boundary and resource ownership.

## Specialized knowledge to load

Selected entrypoints: [Pixi ownership and installed sources](../skills/pixijs-engineering/SKILL.md); [React effects/external store](../skills/react-engineering/SKILL.md).

Use the official skills shipped in the locked `pixi.js` package: `pixijs-application`, `pixijs-ticker`, `pixijs-scene-core-concepts`, `pixijs-scene-container`, `pixijs-scene-sprite`, `pixijs-assets`, `pixijs-events`, `pixijs-math` and `pixijs-performance`, selecting their references for the operation being changed. React's effect/external-store guidance owns the host integration. Inspect the audit/version notes before copying upstream examples.

Use [browser audio](../skills/browser-audio/SKILL.md) for gesture, buffer/voice, clock and ownership cases. The game mix and visible feedback remain in this workflow.

## Decisions and execution

1. Define a single private Application owner with asynchronous init, mount identity and cleanup. An exited initialization may complete, but cannot append a canvas, attach listeners or start rendering. Keep `autoStart` under that owner's control. Exercise setup/cleanup/setup in root Strict Mode.
2. Keep simulation rules independent of React/Pixi/HTTP. Pixi projects world state and short-lived events. React receives a cached immutable HUD snapshot only when displayed values change. A ref holds the runtime handle; it is not a second world-state store.
3. Distinguish raw timing (`elapsedMS` or a measured frame timestamp), scaled/clamped animation deltas and simulation ticks. Update rules before drawing. `AnimatedSprite` defaults to a shared ticker; for pause-controlled effects use explicit playback ownership or manual updates from the owned clock. Stopping `app.ticker` alone must not leave an explosion advancing elsewhere.
4. Load the provided atlases with visible progress and failure/retry. Validate frame/image metadata; convert XML ship rectangles explicitly, since XML auto-detection can select a bitmap-font parser. Array asset loads return a keyed record in the installed version. Await sheet parsing before reading frames. Follow [asset guidance](../../docs/assets.md) for default/retina logical units.
5. Separate logical arena, viewport scale, CSS size and physical resolution. Letterbox the complete arena, account for DPR and invert the same transform for input. Group a ship and its health overlay in a Container; do not attach children to a leaf Sprite. Resize/orientation preserves world state and rules.
6. Define ownership for display objects, texture views, shared texture sources, cached bundles, voices and subscriptions. Destroying a session sprite must not destroy a texture another scene uses. Bundle unloading has no automatic reference counting. Global resource release belongs to a proven whole-Application teardown, not an arbitrary leaf cleanup.
7. Dispose input/visibility listeners, observers, ticker callbacks, timers, effect objects, simulation entities and audio voices. Disable cached rendering before disposing its owner. A pending callback from the old session cannot update the new session.

## Quality, performance and trust

Avoid frame-driven React setters, unconditional text redraws and repeated static geometry creation. Measure whether grouping, atlases, a render group or pooling address an actual cost. Never change CSP to permit dynamic evaluation merely because a skill mentions `unsafe-eval`; the Pixi compatibility module's name requires checking its actual behavior. External asset text/HTML is not automatically trusted. Tooling recommendations do not authorize installing browser extensions or rescoping the project.

## Evidence and exit

Record Strict Mode init/cancel/retry behavior, correct asset reuse, viewport/input alignment, pause-controlled animation and repeated start/exit resource counts. Combine memory evidence with workflow 07. Hand a stable rendered state to workflow 03/06 and keep physics repairs in workflow 01.
