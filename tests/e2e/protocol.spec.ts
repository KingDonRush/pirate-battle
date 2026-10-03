import { expect, test } from '@playwright/test';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';
import { Simulation } from '../../src/game/simulation';
import { pilotInput } from '../support/pilot';
import { fitWorld } from '../../src/game/reflow';
test('G06 reproducible real-rule input protocol survives to the configured deadline', () => {
  for (const interval of [3, 5, 10]) {
    const config = createConfig({
      ...DEFAULT_SETTINGS,
      duration: 180,
      spawnInterval: interval,
    });
    const game = new Simulation({
      id: 'protocol',
      player: { id: 'pilot', name: 'Protocol Pilot' },
      config,
      seed: 8,
    });
    // Bind the same fixed outer-water arena used by the real reference runtime.
    game.setArenaBounds(fitWorld(1800, 1000, 0, config.level).bounds);
    let input = pilotInput(game.observe(), config);
    for (let i = 0; i < 10800 && !game.endReason; i++) {
      if (i % 3 === 0) input = pilotInput(game.observe(), config);
      game.step(input);
    }
    expect(game.endReason).toBe('time');
    expect(game.elapsed).toBe(180);
    expect(
      game.events.filter((event) => event.kind === 'time-warning'),
    ).toHaveLength(1);
    expect(game.spawnIndex).toBeGreaterThan(10);
    expect(game.score).toBeGreaterThan(10);
  }
});
