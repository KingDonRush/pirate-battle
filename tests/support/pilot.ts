import { angleDifference, castIsland, distance } from '../../src/game/geometry';
import type { MatchConfig } from '../../src/game/config';
import type { Simulation, InputSnapshot } from '../../src/game/simulation';

// A reproducible input protocol, never a writer of simulation state.
export function pilotInput(
  state: ReturnType<Simulation['observe']>,
  config: MatchConfig,
): InputSnapshot {
  const target = state.enemies
    .filter((enemy) =>
      config.level.islands.every(
        (island) => castIsland(state.player, enemy, island, 5) === null,
      ),
    )
    .sort((a, b) => {
      const urgency = (enemy: typeof a) =>
        distance(enemy, state.player) /
          config.enemies[enemy.kind === 'chaser' ? 'chaser' : 'shooter'].speed -
        (enemy.kind === 'shooter' ? 2 : 0);
      return urgency(a) - urgency(b) || a.id - b.id;
    })[0];
  let turn = 0;
  if (target) {
    const travel = Math.max(
      0,
      (distance(target, state.player) - 60) / config.weapons.front.speed,
    );
    const speed =
      target.activeAt > state.elapsed
        ? 0
        : config.enemies[target.kind === 'chaser' ? 'chaser' : 'shooter'].speed;
    const lead = {
      x: target.x + Math.sin(target.heading) * speed * travel * 0.7,
      y: target.y - Math.cos(target.heading) * speed * travel * 0.7,
    };
    const difference = angleDifference(
      Math.atan2(lead.x - state.player.x, -(lead.y - state.player.y)),
      state.player.heading,
    );
    turn = Math.abs(difference) > 0.08 ? Math.sign(difference) : 0;
  }
  return { forward: false, turn, front: true, left: true, right: true };
}
