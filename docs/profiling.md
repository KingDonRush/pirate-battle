# Optimized combat and resource profiling

> **Read contract:** measured solution evidence, not task tracking or authorization. Recover context through the [.agents index](../.agents/index.md) and preserve the [company brief](../CHALLENGE.md). The source, environment and finite observation window below bound every claim.

The initial completed real-time profile ran on clean source `a600c89de0483dbfefb354964ccac802670f443f` (tree `31f89a15e1b99713cd11e3b7c32bf747f6905cfc`). The resource investigation then prompted a browser mock-stream cleanup, documented below; final repetition/source correspondence remains part of the delivery gate. JSON reports and the profiling HTML report accompany the public delivery evidence package linked from [acceptance](acceptance.md).

## Reproduce

```sh
npm ci
npm run browser:install
npm run build
E2E_PORT=4175 npm run profile
```

On the measured Linux/NVIDIA environment, an isolated display avoids unrelated window focus changes while retaining actual hardware acceleration:

```sh
xvfb-run -a env PROFILE_VULKAN=1 PROFILE_WARMUP_AUDIT=1 E2E_PORT=4175 npm run profile
```

`PROFILE_VULKAN=1` selects ANGLE/Vulkan and omits screenshot capture on that surface. Normal visual/functional runs capture the rendered game separately. `PROFILE_WARMUP_AUDIT=1` extends the five required resource cycles to ten for the growth investigation. `PROFILE_SOFTWARE=1` selects headless diagnostic rendering; it cannot reproduce the hardware FPS claim. Tests mute only their browser's output; actual Web Audio buffers, voices, gains and suspension still execute. No desktop audio setting is changed.

## P01: genuine 180 active seconds

| Parameter                                   | Observed value                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------- |
| OS                                          | Linux, kernel 6.17.0-29-generic                                                 |
| CPU                                         | Intel Core i5-12600K                                                            |
| Browser                                     | Playwright Chromium 151.0.7922.34                                               |
| Actual renderer                             | WebGL2 / ANGLE Vulkan 1.4.312 on NVIDIA GeForce RTX4060Ti                       |
| Viewport / DPR                              | 1440×900 / 1                                                                    |
| Build                                       | Optimized Vite output, clean source above, Node22.21.1                          |
| Configuration                               | 180 active seconds; standard 3s alternating spawns; full default combat balance |
| Seed / ruleset                              | 42 / `v1:f011c1cb59ce7d1307cd3b5416ac2e5812a626a37a39cddff7e3a7d85e935efa`      |
| Completed outcome                           | Time up at exactly 180s; score59; HP55; 59 spawns; both enemy roles observed    |
| Raw frames / interval sum                   | 10,801 / 180.0097s                                                              |
| FPS                                         | **60.0023**                                                                     |
| p95 raw frame interval                      | **17.40ms**                                                                     |
| Maximum raw interval                        | **19.80ms**                                                                     |
| Peak rendered ships / projectiles / effects | **2 / 13 / 7**                                                                  |
| Peak audio voices                           | 14, including at most two loops                                                 |
| Pauses / reflows / page errors              | 0 / 0 / 0                                                                       |

The protocol selects an unobstructed approaching enemy, leads the shot and uses actual keyboard turns/front/left/right fire. It observes the simulation; it never writes HP, position, score or end state. Browser focus emulation is enabled for this diagnostic sample; genuine blur/hidden-tab behavior is tested separately with actual tab transitions. Loading/layout startup precedes the measured active window. Raw intervals include stalls; the simulation's 250ms catch-up cap is not used to hide them.

This is a standard seeded workload, not a worst-case entity stress test or a physical-phone measurement. Other applications on the host are preserved. A previous 84.27s death prefix and an unsupported final screenshot timeout are retained as labelled diagnostics, not substituted for this passing sample. The final dedicated run passed both P01 and P02 in 4.6 minutes.

## P02: disposal and retained-memory investigation

Every cycle uses the same document: start, eight active seconds of real movement/front/broadside input, Pause → Main Menu → Leave match. A reload would conceal retention and is not used. The diagnostic runtime reference is released before forced GC. Each point records heap, DOM/listeners, native objects, category self sizes and representative strong-root paths. Full browser heap exports are discarded after aggregation.

| Cycle | Post-GC JavaScript heap, bytes | DOM nodes | JS listeners |
| ----- | -----------------------------: | --------: | -----------: |
| 1     |                      7,343,448 |       249 |          188 |
| 2     |                      7,733,700 |       325 |          229 |
| 3     |                      7,900,684 |       325 |          229 |
| 4     |                      8,007,764 |       325 |          229 |
| 5     |                      8,161,540 |       249 |          188 |
| 6     |                      8,192,852 |       249 |          188 |
| 7     |                      8,259,752 |       249 |          188 |
| 8     |                      8,316,424 |       249 |          188 |
| 9     |                      8,644,864 |       249 |          188 |
| 10    |                      8,704,424 |       249 |          188 |

All ten cycles ended with zero live/pending Applications, canvases attached to the document, input/browser listeners, observers, owned tickers, background textures, ships, projectiles, effects and active audio voices/loops. Window listener counts stayed constant. The first transient DOM/listener increase returned to the initial counts and did not accumulate. Unique runtime/scene constructor objects were absent from every post-GC heap. Pixi Application/ticker constructor names collide after minification; the report marks those counts ambiguous and does not treat them as instance counts.

The overall heap still increased by 1,360,976 bytes. Category comparison accounts for 1,240,536 bytes (91.2% of that delta) in compiled **code**, with 50,032 bytes of strings and smaller browser/diagnostic structures. This supports compilation/diagnostic warm-up as the main observed growth, rather than retained combat worlds; it does not prove an indefinitely flat heap. Ten cycles are the stated observation window.

Native counts stayed bounded: two canvas objects, two WebGL1 objects, one WebGL2 object and one live application audio context. Strong-root paths show Blink per-context wrappers/pending activity and a compiled-module WebGL reference, not old runtime/scene owners. Pixi's installed `getTestContext` intentionally caches a capability-test context; that is consistent with the module-root reference. Stopped audio nodes retained by browser pending activity were 14, briefly 15, then 14 again; the application's voice map and connections were already empty. Shared decoded buffers and atlas sources remain owned by the still-open application for reuse. Closing the browser closes that final owner.

Heap self sizes are not GPU allocation totals. Application/resource counters, exact native counts, root paths and repeated comparison supplement them; neither heap totals nor process counts alone establish disposal. Longer sessions and physical-device retention remain outside this measurement.

## Measured rendering change

An empty-world WebGL draw probe measured **14 draws before** and **4 after** caching the static coast/water/decoration layer as one session-owned texture at canonical resolution2. It preserves sprite/overlay layering, rebuilds after context restoration and is destroyed on exit. The draw probe's `gl.finish()` timing is a diagnostic and is not the FPS result above. No pooling, culling, arbitrary DPR cap or combat simplification was added. Reviewed sampling-edge differences were accepted in the existing baselines without widening pixel tolerance.

## Measured MSW observation cleanup

A focused native-root audit found MessagePorts **51→61→71→81→91** over five cycles. The locked worker transfers separate request/response clones for lifecycle observation; quiet mode left those streams unconsumed. The browser mock owner now cancels those observational bodies through `response:mocked`/`response:bypass` and removes its listeners on HMR disposal. The original client/asset responses remain separate in the installed worker's code. The generated worker and dependency versions are unchanged.

The affected optimized five-cycle comparison returned **3→3→3→3→3** native ports, with the same actual play/leave path and zero owned session resources. The profiling regression now requires a constant port count. The surviving roots are shared React/browser/library infrastructure; they are distinct from old sessions. The native source-size and heap-code growth remain measured separately. Full HTTP/asset/worker regressions and the final clean real-time profile must pass after this correction.

The public [MSW lifecycle API](https://mswjs.io/api/life-cycle-events) documents response observation. The cancellation decision is specific to the separate cloned bodies verified in this locked worker; recheck that ownership before upgrading MSW or adding another body-observation consumer.

## Digital audio levels

`PROFILE_AUDIO_LEVELS=1 npm run profile` selects a separate 30-active-second real-input mix audit. A read-only analyser observes the master gain while the genuine input pilot fires all three weapons. Test-browser output remains muted. The clean b4e3319 build produced 945 sampled windows, peak0.69359, maximum RMS0.26671 and zero sampled peaks above1, with default master70%/effects80%/ambience35% and no page errors. No limiter or arbitrary volume reduction was added without a demonstrated clipping problem.

These are digital signal measurements for this workload. They do not establish perceived timing, masking, loop seams or an audible physical-device review. The game remains playable with visible feedback while muted; device/listening limits are recorded in [acceptance](acceptance.md).
