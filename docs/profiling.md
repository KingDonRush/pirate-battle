# Optimized combat and resource profiling

> **Read contract:** measured source-bound evidence, not task state or authorization. The [company brief](../CHALLENGE.md) stays unchanged. Environment, workload and finite observation window bound these claims.

The earlier edge-only rules4 `archipelago-v3` renderer and edge/HUD corrections were measured on clean source `b352012298f000b205ba4504f93003c2b0af3cbb`. The build manifest records the exact source tree, runtime dependencies and every shipped file. P01 completed180 active seconds; an interruption after that result prevented completion of the first P02 attempt, so the remaining five-cycle P02 measurement was executed separately on the same unchanged artifact. Its HTML report covers P02; P01's raw frame/identity JSON establishes the completed match. Neither is silently relabelled to a later integration commit. The final160-unit coast-corridor/AI refinement changes this runtime; this sample is historical for that refinement. The final delivery manifest records the newly measured build and integrated public source.

Earlier16231ad/a03977ed/39455a3 samples are historical after the boundary behavior changed. They are not substituted for these final metrics. Documentation-only integration preserves runtime files; the final build-info identifies its own commit/time.

## Reproduce

```sh
npm ci
npm run browser:install
npm run build
E2E_PORT=4175 npm run profile
```

The actual Linux/NVIDIA sample used an isolated display and ANGLE/Vulkan:

```sh
xvfb-run -a env PROFILE_VULKAN=1 E2E_PORT=4175 npm run profile
```

The profiler sets1800 ×1000/DPR1, seed38 and the normal180-second/3-second-spawn options through the interface. `PROFILE_VULKAN=1` omits an unsupported screenshot on that native surface; normal Chromium/Firefox journeys provide rendered evidence. `PROFILE_SOFTWARE=1` is a headless diagnostic and cannot reproduce the hardware claim. `PROFILE_WARMUP_AUDIT=1` extends the five resource cycles to ten if further warm-up investigation is needed. All test browsers mute only their output; actual Web Audio nodes/gains/loops still execute. Desktop sound settings are unchanged.

## P01:180 active seconds

| Parameter                                   | Actual observation                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| OS / CPU                                    | Linux6.17.0-29-generic / Intel Core i5-12600K                                  |
| Browser                                     | Playwright Chromium151.0.7922.34                                               |
| Actual GPU/backend                          | NVIDIA RTX4060Ti / WebGL2 / ANGLE Vulkan1.4.312                                |
| Viewport / DPR                              | 1800 ×1000 /1                                                                  |
| Build                                       | Clean optimized Vite, Node22.21.1, source above                                |
| Config                                      | 180 active seconds; standard alternating3s spawns; full default combat balance |
| Seed / ruleset                              | 38 / `v1:e67db274eb8ce1601e83426f9adbd0cb8f7d637b8914505b784f2e280897a5b5`     |
| Outcome                                     | Time up at180s;59points,55HP,59spawns; both roles                              |
| Measured frames / raw interval sum          | 10,796 /180.0093s                                                              |
| FPS                                         | **59.9747**                                                                    |
| p95 / maximum raw interval                  | **17.40ms /55.50ms**                                                           |
| Peak rendered ships / projectiles / effects | **2 /12 /6**                                                                   |
| Peak audio voices                           | 14, at most two loops                                                          |
| Pauses / reflows / page errors              | 0 /0 /0                                                                        |

The reproducible protocol selects an unobstructed approaching target, leads its shot and drives actual keyboard turns/front/left/right fire. It observes rules; it does not assign HP, score, positions or completion. Pure input qualification selected a seeded workload that can survive; this is not a worst-case benchmark. Diagnostic focus emulation keeps this hardware sample active; the headed tab-switch test verifies native pause separately. Loading/reflow startup precedes the active window. Raw frame intervals retain stalls, while the game's documented250ms contribution cap bounds simulation catch-up.

P01 completed the full180s active window. P02 passed its separate remaining measurement in46.8s, with zero retries. Combat ended by time; an early-death prefix was not presented as a three-minute sample. The maximum55.50ms raw stall is retained in the data, with mean59.97FPS near the60FPS target. Movement/shore/navigation/touch playtesting is separate from this stationary lead-aim workload.

## P02:five comparable disposal cycles

Each cycle uses the same document and8 active seconds of real W/front/broadside input, then Pause → Main Menu → Leave match. Reloading would hide retention and is not used. The diagnostic runtime reference is released, menu images/fonts are decoded and two actual presentation frames complete before forced GC. Measurements include heap, DOM/listeners, exact native categories, representative strong-root paths and disposed-owner counters; full heap exports are discarded after aggregation.

| Cycle | Post-GC JS heap, bytes | DOM nodes | JS listeners | MessagePorts |
| ----- | ---------------------: | --------: | -----------: | -----------: |
| 1     |              7,556,440 |       107 |          188 |            3 |
| 2     |              7,922,248 |       107 |          188 |            3 |
| 3     |              8,120,436 |       107 |          188 |            3 |
| 4     |              8,222,204 |       107 |          188 |            3 |
| 5     |              8,392,868 |       107 |          188 |            3 |

Every sample ended with zero live/pending Applications, attached game canvas, owned input/browser listeners, observers, tickers, subscribers, scene objects, entities, effects and active audio/terminal voices. Unique runtime/scene objects were absent from every post-GC snapshot. Minified Application/ticker names collide with unrelated constructor names; those counts are marked ambiguous rather than treated as instance counts. Window listener counts stayed constant; all final samples had107 DOM nodes and188 JS listeners without accumulation.

Heap grew836,428bytes. Compiled-code self size accounts for767,272bytes (**91.73%**) of that difference. Unique Runtime/Scene owners were absent after every disposal; MessagePorts stayed3/3/3/3/3. This supports compilation/diagnostic warm-up as the dominant observed growth, while not proving indefinitely flat memory. The native categories and retaining paths do not show discarded combat worlds remaining rooted.

The live application intentionally keeps sixteen shared texture sources,14decoded-buffer keys and one suspended audio context. WebGL wrappers stayed bounded (two WebGL1/one WebGL2), and browser-pending stopped audio sources varied12→11 rather than growing. Their application voice maps/connections were already empty; native browser pending activity is distinct from an active sound. The browser closes the final application owner after measurement. Heap self size is not total GPU memory.

The earlier direct terrain groups met the target in that declared workload without reinstating the Firefox-breaking scenery RenderTexture. No speculative pooling, culling, lowered DPR or altered combat balance was added. Shared atlas/buffer retention has a current reuse purpose; session resources have verified closure.

## Evidence limits

This is one hardware/browser/seed/configuration and five comparable cycles, not worst-case entities, physical-phone performance or infinite retention. Physical Android/iOS/tablet tests and subjective audible mix were not performed. Output mute, nodes, source WAV properties and bounded digital levels cannot establish perceived latency, masking or loop seams. Exact JSON/frame/resource/build manifests and HTML reports belong to the current [delivery evidence](acceptance.md).

The post-Options confirmation sample again completed180active seconds near60FPS. One resource sequence was3,3,4,3,3 MessagePorts, with zero rooted runtime/scene owners and bounded browser-pending paths. An initial exact-equality assertion misclassified that transient as accumulation; the corrected gate requires return to the post-warmup baseline and explicitly checks absence of rooted runtime/scene owners. The original51→91 stream leak would fail this gate. Final confirmation JSON/HTML/source identity is separate from this labelled diagnostic.
