# Assets and attribution

> **Read contract:** solution documentation, not task tracking or authorization. Use it for the named subject; recover uncertain task context through [the index](../.agents/index.md) and check the [company brief](../CHALLENGE.md) before a material decision.

Source: [Jungle Gaming challenge assets](https://github.com/junglegaming/game-developer-challenge/tree/315891441be81ca0bff75cf3c2b0cd2f27f119cd/assets), commit `315891441be81ca0bff75cf3c2b0cd2f27f119cd`.

The original repository contains 522 tracked files: the brief, `.gitignore`, 483 PNGs, 27 WAVs, three SVGs, two XML atlases, two JSON atlases, two legacy SWF sources and one tilesheet note. There is no application source to extend.

## Preflight inspection

All PNG files were decoded for integrity. Both XML and both JSON atlases were parsed; their frame rectangles are within their textures. Every UI metadata image path points to an existing individual PNG. All WAV headers were read: 44.1 kHz, with mono effects and stereo sailing/ocean loops. All SVG trees were parsed. SWF files were inventoried as legacy source files, without executing them. The reference screens and the default ship/UI/tile sheets were viewed. This verifies integrity and metadata; it is not a rendered-game quality or audio-listening test.

## Runtime use

- Each ship atlas has 102 entries, including 24 complete ship sprites, hull/sail parts, cannonballs and effects. Convert the XML rectangles into a small typed manifest before use. Ship sprite forward direction and anchor must be verified against the art.
- The UI atlases have 36 named frames. Default and retina textures are 1024×1024 and 2048×2048. `frame` rectangles use texture pixels; `meta.ui`, frame `ui`, borders and layout use logical 1× pixels. Padding is not simply doubled: read the selected atlas rather than scaling every coordinate from its default counterpart.
- Tiles are 64×64 in the default sheet, without margins. Use the same explicit level definition for blocked geometry and rendering. Background reference images contain rendered ships and projectiles; they are suitable menu art, not collision data or the live arena.
- Reference screenshots guide hierarchy. Rebuild interactive menus with HTML controls; do not place clickable overlays over a screenshot.
- Import explicit asset URLs through Vite. Leave original sources in `assets/`; ship selected runtime files rather than copying the full 520-file pack into `public/`.
- Bound simultaneous sound effects, release completed voices and pause loops with the match. The 8-second sailing and 12-second ocean loops can be reused after a user gesture.

## Licenses

The challenge provides these files for the assessment and directs candidates to use them. The supplied snapshot has no separate LICENSE or asset-license file. Preserve its origin and do not invent a license or identify an unverified original artist. Record the source and actual license of any complementary asset before adding it. The starter currently adds no external visual or audio assets.

The vendored Vercel React skill declares MIT in its [SKILL.md](../.agents/skills/vercel-react-best-practices/SKILL.md), with Vercel as author. It was installed from commit `063bee94c3f4df8453406c830b0a7df0f2860278`. Preserve its upstream files and attribution when updating. Runtime/library licenses remain available in their npm packages and should be listed with any added assets in the final handoff.
