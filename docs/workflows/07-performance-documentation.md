# Performance and documentation — 5 points

Contract: brief sections 9 and 11, [P01–P02 and D01–D03](../ACCEPTANCE.md). This workflow owns measured performance, reproducibility and the final documentation/public-delivery evidence.

## Specialized knowledge to load

Use official Pixi performance/resource guidance and browser Performance/Memory methods. Apply Vite asset/build and Vercel build/publication knowledge to the actual artifact. Use [DEPLOYMENT.md](../DEPLOYMENT.md) for this project's selected settings and existing authorization.

## Decisions and execution

1. Define the reference hardware, OS/browser, renderer/acceleration, viewport, DPR, ruleset and build identity before measuring. Use an optimized build, with loading/warm-up and active-combat measurement windows stated separately. Headless software rendering is regression evidence, not a hardware FPS claim.
2. Run a genuine 180-second active match under a reproducible seed/input protocol. Record frame count/active duration, FPS, p95 raw frame intervals and entity counts. If death or a failure ends the run early, report that limit rather than calling it a complete three-minute sample. Keep the protocol reproducible without altering combat rules to generate a favorable result.
3. Measure five start/play/exit cycles using the same method and comparable post-cleanup points. Distinguish reachable heap, allocated GPU resources, reusable texture caches, active listeners/tickers, effects and voices. Investigate continuous growth and retaining paths; process counts or a single heap total do not prove a leak.
4. Identify whether a cost comes from simulation, rendering, React updates, data serialization or instrumentation. Apply a targeted change and repeat the affected measurement. Pooling needs bounds/reset/release; culling can add CPU cost when the entire arena is visible; higher DPR increases pixel work. Keep visual layering and correctness intact when batching.
5. Make README describe actual setup, environment needs, controls, configuration bounds, network scenario selection/reset, failure reproduction and commands. Make ARCHITECTURE describe the implemented boundaries, clock/collision decisions, cleanup, persistence, cache/idempotency, balance and limits. Keep planned statements visibly distinct from implemented evidence.
6. Reproduce install/check/build/test from a clean checkout and gather current useful reports/profiling evidence with source/asset attribution. Version baselines; exclude disposable build/test intermediates. The submitted source commit must identify the public build.
7. Prepare a Vercel project using the actual scripts/root/output/Node version. For authorized publication, verify the real HTTPS URL, initial load/reload, worker/assets, query and pending-result recovery, desktop/touch access and console. Confirm evaluator access without a private service/login requirement.

## Quality and trust

Use measurement units/methods and observed limits rather than unverified quality claims. Avoid raw user/private data in reports. Do not execute a downloaded upload helper or let it select an unrelated intermediary endpoint. The actual publication uses the user's chosen account/integration. A mutable document or package update invalidates the corresponding audit until rechecked.

## Evidence and exit

Deliver the measured results, environment/config/protocol, actual limitations, English docs, current test artifacts and public commit/URL correspondence. Verify owned temporary cleanup and useful retained resources before closing the task. This workflow consolidates evidence without self-assigning an evaluator's grade.
