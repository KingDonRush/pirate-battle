# README recordings

> **Read contract:** Technical provenance of the documentation media. The company brief and implemented game remain unchanged; task state belongs to GitHub.

These are screen recordings of the public Pirate Battle **v1.1.0 / `88bf86ff6e80532cd8c95995475d8fbed01ac34b`** build. They use supplied game artwork, real HTML controls, Pixi rendering, physics, AI and Axios/Query/MSW handlers. No generated artwork or assignment of HP, score, entity positions or match outcomes was used.

| File                                                   | Duration / size | Recorded action                                                                                                                                                                  |
| ------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [combat.gif](combat.gif)                               | 9 s / 960 × 540 | Keyboard steering, a short forward movement, front fire and both broadsides. The real simulation progresses from 9 to 18 active seconds and score 1 to 4.                        |
| [touch-and-orientation.gif](touch-and-orientation.gif) | 7 s / 900 × 530 | Native Chromium contacts with distinct pointer IDs: floating stick and simultaneous fire, portrait-to-landscape resize, renewed gesture and cancellation.                        |
| [menus-and-recovery.gif](menus-and-recovery.gif)       | 9 s / 960 × 540 | Home and Options tabs, Ranking unavailable, then recovery by saving Success and revisiting Ranking. The actual failed request and successful ranking use the normal mock worker. |

Capture: Playwright Chromium151, DPR1, seed38, isolated fresh contexts, muted browser output. Combat excerpts advance the existing diagnostic clock in100ms steps and are encoded at10frames/s; they are **not a real-time FPS benchmark**. Orientation uses the runtime's real presentation clock. Idle network waits are omitted between menu excerpts. A uniform resize and navy padding put changing mobile dimensions into one GIF canvas; the game viewport itself is complete in each source frame.

The GIFs are silent, looping documentation previews. Browser emulation is not a physical-device test. Use the still images for a motion-free view: [arena](overview.webp), [portrait](touch-portrait.webp), [Options](menus.webp). The frames were reviewed, all GIF frames decoded and their duration/loop metadata checked. Intermediate full-size PNGs and recording scripts are temporary and are removed after the final media is verified.

Artwork and font provenance remain in [Assets and attribution](../assets.md). Metrics and verification reports belong to the [v1.1.0 release](https://github.com/KingDonRush/pirate-battle/releases/tag/v1.1.0), independently of these short edited excerpts.
