# Optimized combat and resource profiling

> **Read contract:** measured source-bound evidence, not task state or authorization. The [company brief](../CHALLENGE.md) stays unchanged. Environment, workload and finite observation window bound these claims.

The fixed coast corridor, enemy routing, direct terrain renderer and compact HUD were measured on clean source `6c9d89cc14afdb25ccd21e0dee46dea6c9219340`, tree `c83e626fcbef4ffef6f542a82b40ae7df352988b`. P01 and P02 passed in the same uninterrupted optimized run, with zero retries. Its build manifest records the exact dependencies and all 67 shipped files. The final delivery manifest separately identifies the integrated/public source and verifies correspondence of the 66 runtime/static files; build-info records its own commit/time.

Earlier cached-scenery and edge-only samples are historical after the coast/AI refinement. Their numbers are not substituted for this current measurement.

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

The profiler sets 1800 × 1000/DPR1, seed38 and the normal 180-second/3-second-spawn options through the interface. `PROFILE_VULKAN=1` omits an unsupported screenshot on that native surface; the normal Chromium/Firefox journeys provide rendered evidence. `PROFILE_SOFTWARE=1` is a headless diagnostic and cannot reproduce the hardware claim. `PROFILE_WARMUP_AUDIT=1` extends the five resource cycles to ten when warm-up investigation is needed. All test browsers mute only their output; real Web Audio nodes, gains and loops still execute. Desktop sound settings remain unchanged.

## P01: 180 active seconds

| Parameter                                   | Actual observation                                                                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| OS / CPU                                    | Linux6.17.0-29-generic / Intel Core i5-12600K                                                                                                  |
| Browser                                     | Playwright Chromium151.0.7922.34                                                                                                               |
| Actual GPU/backend                          | NVIDIA RTX4060Ti / WebGL2 / ANGLE Vulkan1.4.312                                                                                                |
| Viewport / DPR                              | 1800 × 1000 / 1                                                                                                                                |
| Build                                       | Clean optimized Vite, Node22.21.1, source above                                                                                                |
| Config                                      | Rules4 / archipelago-v4 / fixed160-unit outer corridor; 180 active seconds, standard alternating3s spawns and unchanged default combat balance |
| Seed / ruleset                              | 38 / `v1:b29b040e2407e9659f89be12ffd5d7ef09e481f9005dffd00a87a631b68acf42`                                                                     |
| Outcome                                     | Time up at180s; 58points, 100HP, 59spawns; both roles                                                                                          |
| Measured frames / raw interval sum          | 10,801 / 180.0101s                                                                                                                             |
| FPS                                         | **60.0022**                                                                                                                                    |
| p95 / maximum raw interval                  | **17.40ms / 18.90ms**                                                                                                                          |
| Peak rendered ships / projectiles / effects | **4 / 16 / 6**                                                                                                                                 |
| Peak audio voices                           | 14, at most two loops                                                                                                                          |
| Pauses / reflows / page errors              | 0 / 0 / 0                                                                                                                                      |

The reproducible protocol selects an unobstructed approaching target, leads its shot from observed enemy velocity (including stationary attack states) and drives actual keyboard turns/front/left/right fire. It observes rules; it does not assign HP, score, positions or completion. Pure input qualification uses the same fitted outer-water bounds as the browser runtime. Selecting a surviving seeded workload does not make this a worst-case benchmark. Diagnostic focus emulation keeps the hardware sample active; a headed tab-switch test separately verifies native pause. Loading/reflow startup precedes the active window. Raw frame intervals retain stalls, while the game's documented250ms contribution cap bounds simulation catch-up.

P01 completed the full180s active window. P02 passed all five comparable cycles in45.4s; the combined report includes both successful tests. Combat ended by time; no early-death prefix is presented as a three-minute sample. Movement, shore navigation and touch playtesting are separate from this stationary lead-aim workload.

## P02: five comparable disposal cycles

Each cycle uses the same document and8 active seconds of real W/front/broadside input, then Pause → Main Menu → Leave match. Reloading would hide retention and is not used. The diagnostic runtime reference is released, menu images/fonts are decoded and two actual presentation frames complete before forced GC. Measurements include heap, DOM/listeners, native categories, representative strong-root paths and disposed-owner counters; full heap exports are discarded after aggregation.

| Cycle | Post-GC JS heap, bytes | DOM nodes | JS listeners | MessagePorts |
| ----- | ---------------------: | --------: | -----------: | -----------: |
| 1     |              7,553,996 |       107 |          188 |            3 |
| 2     |              7,958,540 |       107 |          188 |            3 |
| 3     |              8,146,436 |       107 |          188 |            3 |
| 4     |              8,263,132 |       107 |          188 |            3 |
| 5     |              8,404,596 |       107 |          188 |            3 |

Every sample ended with zero live/pending Applications, attached game canvas, owned input/browser listeners, observers, tickers, subscribers, scene objects, entities, effects and active audio/terminal voices. Unique Runtime/Scene objects were absent from every post-GC snapshot. Minified Application/ticker names collide with unrelated constructor names; those counts are explicitly ambiguous. All final samples had107 DOM nodes and188 JS listeners; window listener counts remained constant.

Heap grew850,600bytes. Compiled-code self size accounts for782,460bytes (**91.99%**) of that difference. Unique Runtime/Scene owners were absent after every disposal; MessagePorts stayed3/3/3/3/3. Compilation/diagnostic warm-up dominates the observed growth, but five cycles do not prove indefinitely flat memory. The native categories and retaining paths do not show discarded combat worlds remaining rooted.

The application intentionally keeps sixteen shared texture sources, fourteen decoded-buffer keys and one suspended audio context for reuse. WebGL wrappers stayed bounded (two WebGL1/one WebGL2). Browser-pending stopped audio sources varied8→7 rather than growing; application voice maps and connections were already empty. Browser pending activity is distinct from an active sound. The browser closes the final application owner after measurement. Heap self size is not total GPU memory.

Direct terrain groups met the60FPS target in this workload without reinstating the Firefox-breaking scenery RenderTexture. No speculative pooling, culling, lowered DPR or combat-balance change was added. Shared atlas/buffer retention has a current reuse purpose; session resources have verified closure.

## Evidence limits

This is one hardware/browser/seed/configuration and five comparable cycles, not worst-case entities, physical-phone performance or infinite retention. Physical Android/iOS/tablet testing and subjective audible mix were not performed. Muted output, nodes, WAV properties and bounded digital levels cannot establish perceived latency, masking or loop seams. Exact JSON/frame/resource/build manifests and the combined HTML report belong to the current [delivery evidence](acceptance.md).

Earlier diagnostic work found and repaired an observed-stream leak. The resource gate checks return to the post-warmup MessagePort baseline and absence of unique Runtime/Scene owners rather than requiring equality with a transient intermediate count. Useful labelled failure traces accompany the delivery; they do not replace current passing evidence.
