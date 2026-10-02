import {
  createConfig,
  DEFAULT_SETTINGS,
  type MatchConfig,
} from '../game/config';
import { rulesetId, type CompletedRecord } from '../data/contracts';
const NAMES = [
  'Captain Flint',
  'Red Sparrow',
  'Storm Rider',
  'Sea Wolf',
  'Coral Gull',
  'Amber Tern',
  'Silver Heron',
  'Azure Otter',
  'Sunny Puffin',
  'Swift Pelican',
  'Quiet Seal',
  'Brave Finch',
  'North Star',
  'Sandy Cove',
  'Blue Horizon',
];
export async function fixtureRecords(
  config: MatchConfig = createConfig(DEFAULT_SETTINGS),
  playerId?: string,
): Promise<CompletedRecord[]> {
  const id = await rulesetId(config);
  return NAMES.map((name, index) =>
    Object.freeze({
      schemaVersion: 1 as const,
      matchId: 'fixture:' + id + ':' + (playerId ?? index) + ':' + index,
      playerId: playerId ?? 'fixture-player-' + index,
      displayName: name,
      completedAt: new Date(Date.UTC(2026, 8, 28, 12, index)).toISOString(),
      score: Math.max(0, 18 - index),
      duration: config.duration,
      endReason: 'time' as const,
      seed: index,
      config,
      rulesetId: id,
    }),
  );
}
