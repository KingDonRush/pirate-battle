# Interface, feedback, responsiveness and accessibility — 15 points

Contract: brief sections 3 and 7, with relevant [G01–G10](../ACCEPTANCE.md). This workflow owns what the player sees, understands and can operate.

## Specialized knowledge to load

Use researched React component/state/composition material, supplied visual assets, and the W3C keyboard/focus/tabs/dialog/target-size guidance. Read the relevant Pixi Sprite/Graphics/Text material for overlays and effects. Performance rules are applied according to the actual update frequency and visible behavior.

## Decisions and execution

1. Map menu, options, active combat, pause, result, ranking and history to their actual actions and states. English copy states what happened and the available next action. Play is the primary menu action; during combat keep health, score, remaining time, pause and input readable.
2. Use supplied naval art coherently, rebuilding controls with semantic HTML. Reference screenshots are visual guidance rather than clickable screenshots. Keep spacing/type/button states consistent; decorative statistics, generic marketing copy and implementation jargon require a concrete player purpose to remain.
3. Implement associated labels, validation feedback, visible focus, keyboard order and dialog focus return. Prefer native semantics. For tabs, distinguish focus from selection and choose manual activation when loading makes automatic activation disruptive. Errors and status announcements must be useful without announcing every frame.
4. Define how Options edits a draft, saves valid values and persists them. Preserve the original saved state on cancellation. A new match uses its start snapshot. Result presents score, active duration, end reason, save/pending/error state and Play Again/Main Menu even when an older submission remains pending.
5. Build simultaneous movement/rotation/attack touch clusters with independent pointer identities. Release on up, cancel, lost capture, blur and pause. Keyboard gameplay capture applies only to active gameplay and does not consume menu/form keys. Test targets with actual spacing and phone reach, not only their CSS dimensions.
6. Preserve the full arena/HUD across supported desktop, landscape and usable portrait layouts. Handle orientation, zoom, longer text and visible error messages without clipping. Coordinate mapping belongs to workflow 02 and cannot be patched by changing game rules for a small viewport.
7. Give attacks, impacts and damage distinct readable feedback. Differentiate enemy roles and deteriorating ships. Health remains visible above all ships. Support reduced motion while preserving state meaning, and bound/pause/release audio consistently.

## Quality and trust

React escapes ordinary text; do not introduce raw HTML/SVG injection for convenience. Accessible names and errors follow their data source without exposing raw transport details. Context/compound components are justified by actual shared behavior; a small options form does not need a generic UI framework. Loading, empty, failed and stale-but-updating data views are separate user states.

## Evidence and exit

Review complete screens at normal scale and through Tab/Enter/Escape, mouse and simultaneous touch actions. Check focus, names, labels, contrast, reflow, phone controls and error/pending states. Provide stable menu/arena/result states for workflow 06 visual baselines. Record actual controls/copy and limitations in README.
