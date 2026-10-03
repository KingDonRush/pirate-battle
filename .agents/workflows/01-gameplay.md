# Gameplay, rules, collisions and enemy behavior — 35 points

> **Read contract:** project procedure for this rubric criterion. Recover intent through [the index](../index.md), read the relevant [company requirement](../../CHALLENGE.md) and apply [common engineering](../policies/engineering.md). Load only the selected skills; reenter the index if task or evidence is unclear.

Contract: brief section 2 and [G03–G09](../../docs/acceptance.md). This workflow owns combat correctness. Rendering supplies feedback and the test workflow supplies browser execution; neither may fabricate the rule result.

## Specialized knowledge to load

Selected entrypoints: [TypeScript](../skills/typescript-engineering/SKILL.md); [Pixi timing/math](../skills/pixijs-engineering/SKILL.md); [Playwright controls/time](../skills/playwright-testing/SKILL.md).

Use TypeScript boundary/state guidance for configuration and events; the Pixi ticker/math material for coordinate/time integration; and the clock/input material in Playwright when verifying a rule. For algorithm choices read the original [fixed-timestep analysis](https://gafferongames.com/post/fix_your_timestep/), [collision primitives/casts](https://box2d.org/documentation/md_collision.html) and [A* introduction](https://www.redblobgames.com/pathfinding/a-star/introduction.html). These sources inform implementation; the candidate implements the rules, as the brief requires.

## Decisions and execution

1. Keep a deterministic simulation with typed configuration, a seeded RNG, held input and explicit active elapsed time. A fixed step and accumulator consume raw frame time; do not mix a clamped Pixi animation delta with an independent wall-clock countdown. Bound long-stall catch-up and document the resulting time policy. Keep remaining fractional time between ordinary frames.
2. Model `running`, `paused`, `finished` and `disposed` transitions explicitly. Manual/blur/visibility pause freezes duration, cooldowns, spawns and projectile lifetime. Resume is an explicit player action, clears input and resets timestamp debt. Finish stops every combat system once. Restart constructs a new identity and resets every session field.
3. Implement forward motion and bounded left/right rotation. Use immutable logical island geometry and the same obstacle definition as rendering. The approved versioned viewport policy publishes effective water bounds only after a frozen, validated reflow; it does not relocate entities or change combat parameters. Correct bounds with hull size, not only the center point. Test a hull near corners and diagonal island approaches.
4. Implement frontal fire and left/right broadsides with three parallel directions and offset origins. Each weapon has its own cooldown. Track owner, previous/current position, damage and lifetime/range on each projectile. Use swept segments, resolve the first hit and consume the projectile once. Handle zero-length movement, an origin near an obstacle, tangency and multiple potential targets deterministically.
5. Chasers and Shooters both advance, turn, receive damage and respect islands. Chaser impact applies one damage event and self-destructs without score. Shooter approaches and fires only within its range/cooldown. A pathfinding grid is a navigation approximation; final movement still checks hull clearance against the actual obstacle geometry. Bound route work and define retry behavior when no path exists.
6. Select spawn points with obstacle/bounds clearance and a minimum player distance. A bounded failed search retries later instead of looping forever. Standard distribution includes both enemy types. Player-caused enemy destruction awards one point exactly once; dead entities stop colliding/firing before their visual explosion finishes.
7. Validate and snapshot the complete gameplay configuration at start. Options expose the required duration and positive spawn interval; balance changes must not leak into an active snapshot. Abandonment on exit/reload emits no completed record.

## Quality, performance and trust

Use finite numbers and documented bounds at configuration/storage boundaries. Keep the update order explicit so collision, destruction and score cannot contradict one another. Choose broad-phase acceleration or pooling from measured entity/load cost, preserving deterministic collision order. Browser mocks and local ranking are demonstration data, not an authoritative anti-cheat service.

## Evidence and exit

Verify meaningful pure-rule cases and browser actions: equal active time at different frame schedules; simultaneous movement/fire; front and both parallel volleys; obstacles before targets; single-hit/score; both enemies; safe spawns; time/death termination; pause across cooldown/spawn boundaries; clean restart and abandonment. An observation/time/seed adapter cannot set damage, position, score or completion in combat tests. Hand off completed immutable results to workflow 04 and visual events/state to workflow 02. Mark the corresponding acceptance checks only after execution.
