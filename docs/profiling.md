# Optimized combat and resource profiling

> **Read contract:** measured source-bound evidence, not task state or authorization. The [company brief](../CHALLENGE.md) stays unchanged. Environment, workload and finite observation window bound these claims.

The corrected `archipelago-v3` direct renderer was measured on clean source `16231ad5304ca20b806acca9e19dffe3831dfae9`, tree `c33073a291ada3863c969695e9671b810c2cdaee`. The profiling build manifest records every shipped file. Source/asset manifests distinguish documentation/harness changes and a later Options-only stylesheet correction. The latter changes dependency filenames; rules, renderer, input and audio sources are unchanged. The final delivery manifest identifies the final checked build and any confirming profile, rather than silently relabelling this sample. The former cached `reference-v2` numbers are historical and are not substituted for this sample.

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
| Seed / ruleset                              | 38 / `v1:4d61de0eafc20fea87a43f4b9badc9343702c43e2f8f4f068b05cba67daa30fa`     |
| Outcome                                     | Time up at180s;59points,70HP,59spawns; both roles                              |
| Measured frames / raw interval sum          | 10,801 /180.0096s                                                              |
| FPS                                         | **60.0024**                                                                    |
| p95 / maximum raw interval                  | **17.40ms /19.60ms**                                                           |
| Peak rendered ships / projectiles / effects | **2 /12 /6**                                                                   |
| Peak audio voices                           | 14, at most two loops                                                          |
| Pauses / reflows / page errors              | 0 /0 /0                                                                        |

The reproducible protocol selects an unobstructed approaching target, leads its shot and drives actual keyboard turns/front/left/right fire. It observes rules; it does not assign HP, score, positions or completion. Pure input qualification selected a seeded workload that can survive; this is not a worst-case benchmark. Diagnostic focus emulation keeps this hardware sample active; the headed tab-switch test verifies native pause separately. Loading/reflow startup precedes the active window. Raw frame intervals retain stalls, while the game's documented250ms contribution cap bounds simulation catch-up.

The complete dedicated P01/P02 execution passed2 cases with zero retries in3.8minutes. Combat ended by time rather than using an early-death prefix as a three-minute sample. Movement/shore/navigation/touch playtesting is separate from this stationary lead-aim workload.

## P02:five comparable disposal cycles

Each cycle uses the same document and8 active seconds of real W/front/broadside input, then Pause → Main Menu → Leave match. Reloading would hide retention and is not used. The diagnostic runtime reference is released before forced GC. Measurements include heap, DOM/listeners, exact native categories, representative strong-root paths and disposed-owner counters; full heap exports are discarded after aggregation.

| Cycle | Post-GC JS heap, bytes | DOM nodes | JS listeners | MessagePorts |
| ----- | ---------------------: | --------: | -----------: | -----------: |
| 1     |              7,562,312 |       107 |          188 |            3 |
| 2     |              8,035,780 |       183 |          229 |            3 |
| 3     |              8,126,608 |       107 |          188 |            3 |
| 4     |              8,311,924 |       183 |          229 |            3 |
| 5     |              8,392,976 |       107 |          188 |            3 |

Every sample ended with zero live/pending Applications, attached game canvas, owned input/browser listeners, observers, tickers, subscribers, scene objects, entities, effects and active audio/terminal voices. Unique runtime/scene objects were absent from every post-GC snapshot. Minified Application/ticker names collide with unrelated constructor names; those counts are marked ambiguous rather than treated as instance counts. Window listener counts stayed constant; the transient DOM/listener increase returned to its original counts and did not accumulate.

Heap grew830,664bytes. Category comparison accounts for755,552bytes (**90.96%**) in compiled-code self size, plus22,192bytes of weak-array metadata,17,776bytes of strings,15,444bytes of object shapes and smaller browser/diagnostic structures. This supports compilation/diagnostic warm-up as the dominant observed growth, while not proving indefinitely flat memory. The native categories and retaining paths do not show discarded combat worlds remaining rooted.

The live application intentionally keeps sixteen shared texture sources,14decoded-buffer keys and one suspended audio context. Canvas2D contexts stayed15 (including crop preparation/capability resources), WebGL wrappers stayed bounded (two WebGL1/one WebGL2), and browser-pending stopped audio sources varied12→11 rather than growing. Their application voice maps/connections were already empty; native browser pending activity is distinct from an active sound. The browser closes the final application owner after measurement. Heap self size is not total GPU memory.

The direct terrain groups meet the target in this declared workload without reinstating the Firefox-breaking scenery RenderTexture. No speculative pooling, culling, lowered DPR or altered combat balance was added. Shared atlas/buffer retention has a current reuse purpose; session resources have verified closure.

## Evidence limits

This is one hardware/browser/seed/configuration and five comparable cycles, not worst-case entities, physical-phone performance or infinite retention. Physical Android/iOS/tablet tests and subjective audible mix were not performed. Output mute, nodes, source WAV properties and bounded digital levels cannot establish perceived latency, masking or loop seams. Exact JSON/frame/resource/build manifests and HTML reports belong to the current [delivery evidence](acceptance.md).
