---
name: pixijs-engineering
description: Implement and review PixiJS rendering, Application lifecycle, tickers, assets, textures, scene transforms and performance. Use for interactive 2D browser rendering across products; simulation rules, screen ownership and performance targets belong to the active workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# PixiJS engineering

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Start with the official PixiJS v8 router in the host's installed package, at `pixi.js/skills/pixijs/SKILL.md`, then the specialized skill it selects. Read [version-checked runtime cases](references/runtime-ownership-cases.md) for ownership, timing, shared animation, assets, geometry/events, profiling and corrections to upstream examples. Prefer those substantive official sources to this entrypoint summary.

PixiJS renders a scene graph through its renderer and manages display objects and GPU resources. It does not determine an application's domain rules. Identify the Pixi major version and renderer backend before using examples: initialization and texture APIs differ between versions.

## Initialization and ownership

In v8, construct the Application and await `init()` before using initialized renderer resources. Define who owns the Application, canvas, ticker, observers and subscriptions. Use a private ticker when updates must stop with that owner; a shared ticker may serve other consumers.

Guard asynchronous setup against disposal or replacement. An obsolete completion cannot attach its canvas, install listeners or restart updates. Cleanup removes owned callbacks and display objects, detaches the canvas and destroys only resources owned by that instance. Host frameworks may mount and clean up more than once; make those cycles safe without global suppression flags.

## Assets and textures

Use Assets and explicit aliases/bundles when they clarify loading and reuse. Repeated loads share cached resources, so destroying a sprite is a different decision from destroying its shared texture source. Define unloading at the bundle/owner boundary and handle failed or superseded loads. Choose loading feedback based on the host application's needs.

Read atlas metadata instead of guessing rectangles, rotation, trimming, anchor or scale. Distinguish texture pixels from logical layout units. Verify that a requested format is a supported asset type; convert unsupported atlas formats at an explicit boundary. Load only the resources used by the current feature.

## Time and coordinates

Use elapsed time for animation and understand the ticker's delta units and clamps. The workflow chooses whether independent logic needs a fixed or variable step, how to handle long stalls, and which clock pauses. Avoid introducing a second scheduler without a separate responsibility.

Keep logical scene coordinates, CSS size and physical renderer resolution distinct. Apply a coherent viewport transform and invert it for pointer coordinates. Resizing a view should not silently change domain data. Cap resolution only after choosing a documented quality/performance tradeoff.

## Measure before optimizing

Inspect frame intervals, draw work, scene size and retained resources in the target backend. Reuse textures and avoid rebuilding static geometry or text unnecessarily. Introduce batching, culling or pooling when profiling identifies a cost they address. Pooling itself needs bounded ownership and reset semantics.

Verify load/failure/retry, resize/DPR/input alignment, repeated creation/disposal and shared-asset reuse. Record the actual browser/backend and measurement method. Frame-rate targets and required lifecycle cycles come from the workflow, rather than this skill.

Primary references: [Application](https://pixijs.com/8.x/guides/components/application), [Ticker](https://pixijs.com/8.x/guides/components/ticker), [Assets](https://pixijs.com/8.x/guides/components/assets), [performance](https://pixijs.com/8.x/guides/concepts/performance-tips). Verify version-sensitive calls against installed types.
