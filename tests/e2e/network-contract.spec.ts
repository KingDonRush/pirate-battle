import { test, expect } from '@playwright/test';
import axios from 'axios';
import { setupServer } from 'msw/node';
import {
  createHandlers,
  memoryStore,
  rankingOrder,
} from '../../src/mocks/handlers';
import { ScenarioController, SCENARIOS } from '../../src/mocks/scenarios';
import { fixtureRecords } from '../../src/mocks/fixtures';
import {
  decodePage,
  decodeConfig,
  decodeRecord,
  canonical,
  rulesetId,
} from '../../src/data/contracts';
import { createConfig, DEFAULT_SETTINGS } from '../../src/game/config';
test('G12 shared Node HTTP handlers recover committed timeouts and reject conflicting identity', async () => {
  const store = memoryStore(),
    conditions = new ScenarioController(),
    server = setupServer(...createHandlers(store, conditions));
  server.listen({ onUnhandledRequest: 'error' });
  const http = axios.create({
    baseURL: 'https://pirate-battle.test/api',
    timeout: 4000,
  });
  try {
    const fixture = (await fixtureRecords())[0];
    if (!fixture) throw new Error('Missing fixture');
    const record = decodeRecord({
      ...fixture,
      matchId: 'network-write',
      playerId: 'network-player',
    });
    conditions.configure('commit-timeout');
    await expect(
      http.post('/matches', record, { timeout: 50 }),
    ).rejects.toMatchObject({ code: 'ECONNABORTED' });
    expect((await store.read()).items).toHaveLength(1);
    conditions.configure('success');
    const response = await http.post<{ record: unknown }>('/matches', record);
    expect(canonical(decodeRecord(response.data.record))).toBe(
      canonical(record),
    );
    await http.post('/matches', record);
    expect((await store.read()).items).toHaveLength(1);
    await expect(
      http.post('/matches', { ...record, score: record.score + 1 }),
    ).rejects.toMatchObject({ response: { status: 409 } });
    const history = await http.get<unknown>('/players/network-player/matches');
    expect(decodePage(history.data).items).toHaveLength(1);
    const ranking = await http.get<unknown>('/ranking', {
      params: { rulesetId: record.rulesetId, page: 1 },
    });
    expect(
      decodePage(ranking.data).items.some(
        (item) => item.matchId === record.matchId,
      ),
    ).toBe(true);
  } finally {
    server.close();
  }
});
test('G10 required scenario plans are deterministic and reset their sequence', () => {
  const conditions = new ScenarioController();
  for (const name of Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]) {
    conditions.configure(name);
    const first = conditions.plan('ranking'),
      second = conditions.plan('ranking');
    conditions.configure(name);
    expect(conditions.plan('ranking')).toMatchObject({
      scenario: first.scenario,
      milliseconds: first.milliseconds,
      index: 0,
    });
    expect(second.index).toBe(1);
    expect(first.milliseconds).toBeGreaterThan(0);
  }
});
test('G10 complete ruleset fingerprint and deterministic tie policy', async () => {
  const a = createConfig(DEFAULT_SETTINGS),
    b = createConfig({ ...DEFAULT_SETTINGS, volume: 0, muted: true });
  expect(await rulesetId(a)).toBe(await rulesetId(b));
  expect(
    await rulesetId({
      ...a,
      weapons: { ...a.weapons, front: { ...a.weapons.front, damage: 21 } },
    }),
  ).not.toBe(await rulesetId(a));
  const fixture = (await fixtureRecords())[0];
  if (!fixture) throw new Error('Missing fixture');
  const first = { ...fixture, matchId: 'first', duration: 120 },
    second = { ...fixture, matchId: 'second', duration: 110 };
  expect(rankingOrder(first, second)).toBeLessThan(0);
  expect(rankingOrder(first, { ...first, matchId: 'last' })).toBeLessThan(0);
});
test('G12 out-of-order HTTP reads capture the old database revision before the write', async () => {
  const store = memoryStore(),
    conditions = new ScenarioController(),
    server = setupServer(...createHandlers(store, conditions));
  server.listen({ onUnhandledRequest: 'error' });
  const http = axios.create({
    baseURL: 'https://pirate-battle.test/api',
    timeout: 4000,
  });
  try {
    conditions.configure('out-of-order');
    const fixture = (await fixtureRecords())[14];
    if (!fixture) throw new Error('Missing fixture');
    const old = http.get<unknown>('/ranking', {
      params: { rulesetId: fixture.rulesetId, page: 4 },
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    await http.post('/matches', {
      ...fixture,
      matchId: 'new-write',
      playerId: 'new-player',
      score: 0,
    });
    const fresh = decodePage(
      (
        await http.get<unknown>('/ranking', {
          params: { rulesetId: fixture.rulesetId, page: 4 },
        })
      ).data,
    );
    const late = decodePage((await old).data);
    expect(fresh.revision).toBe(1);
    expect(fresh.items).toHaveLength(1);
    expect(late.revision).toBe(0);
    expect(late.items).toHaveLength(0);
  } finally {
    server.close();
  }
});
test('G10 shared handlers reproduce each transport/status and latency failure', async () => {
  test.setTimeout(45000);
  const conditions = new ScenarioController(),
    server = setupServer(...createHandlers(memoryStore(), conditions));
  server.listen({ onUnhandledRequest: 'error' });
  const http = axios.create({
    baseURL: 'https://pirate-battle.test/api',
    timeout: 2500,
  });
  const id = await rulesetId(createConfig(DEFAULT_SETTINGS));
  try {
    for (const name of [
      'connection',
      'http-400',
      'http-500',
      'ranking-failure',
      'timeout',
    ] as const) {
      conditions.configure(name);
      await expect(
        http.get('/ranking', {
          params: { rulesetId: id },
          timeout: name === 'timeout' ? 100 : 2500,
        }),
      ).rejects.toThrow();
    }
    for (const name of [
      'success',
      'empty',
      'multiple-pages',
      'slow',
      'variable',
    ] as const) {
      conditions.configure(name);
      const page = decodePage(
        (await http.get<unknown>('/ranking', { params: { rulesetId: id } }))
          .data,
      );
      expect(page.items).toHaveLength(name === 'empty' ? 0 : 5);
    }
    conditions.configure('history-failure');
    await expect(
      http.get('/players/fixture-player-0/matches'),
    ).rejects.toMatchObject({ response: { status: 503 } });
    const rank = decodePage(
      (await http.get<unknown>('/ranking', { params: { rulesetId: id } })).data,
    );
    expect(rank.total).toBe(15);
  } finally {
    server.close();
  }
});

test('G10 historical complete config keeps its original canonical fingerprint', async () => {
  const current = createConfig(DEFAULT_SETTINGS);
  const historical = {
    ...current,
    version: 1 as const,
    level: {
      width: 960,
      height: 640,
      version: 'islands-v1',
      islands: [{ x: 192, y: 128, width: 160, height: 160, radius: 28 }],
    },
    player: { health: 100, speed: 150, turnSpeed: Math.PI },
  };
  const decoded = decodeConfig(historical);
  expect(canonical(decoded)).toBe(canonical(historical));
  expect(await rulesetId(decoded)).toBe(await rulesetId(historical));
  expect(await rulesetId(decoded)).not.toBe(await rulesetId(current));
  const previousLevel = { ...current.level };
  delete previousLevel.navigationPadding;
  const previousArchipelago = {
    ...current,
    version: 3 as const,
    level: { ...previousLevel, version: 'archipelago-v3' },
  };
  const previousDecoded = decodeConfig(
    JSON.parse(JSON.stringify(previousArchipelago)),
  );
  expect(previousDecoded).toEqual(previousArchipelago);
  expect(await rulesetId(previousDecoded)).toBe(
    await rulesetId(previousArchipelago),
  );
  expect(await rulesetId(previousDecoded)).not.toBe(await rulesetId(current));
});
