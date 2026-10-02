import { http, HttpResponse, delay } from 'msw';
import {
  decodeRecord,
  rulesetId,
  type CompletedRecord,
  type PageResult,
} from '../data/contracts';
import { commitRecord, records, RecordConflict } from '../data/database';
import { fixtureRecords } from './fixtures';
import { scenarios, type ScenarioController } from './scenarios';
export type MockStore = {
  read: () => Promise<{ items: CompletedRecord[]; revision: number }>;
  commit: (record: CompletedRecord) => Promise<CompletedRecord>;
};
const browserStore: MockStore = { read: records, commit: commitRecord };
export function rankingOrder(a: CompletedRecord, b: CompletedRecord) {
  return (
    b.score - a.score ||
    b.duration - a.duration ||
    a.completedAt.localeCompare(b.completedAt) ||
    a.matchId.localeCompare(b.matchId)
  );
}
function pagination(url: URL) {
  const page = Number(url.searchParams.get('page') ?? 1),
    pageSize = Number(url.searchParams.get('pageSize') ?? 5);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    throw new Error('Invalid page parameters.');
  return { page, pageSize };
}
export function createHandlers(
  store: MockStore,
  conditions: ScenarioController = scenarios,
) {
  let fixtures: Promise<CompletedRecord[]> | undefined;
  const sample = () => (fixtures ??= fixtureRecords());
  async function list(
    request: Request,
    endpoint: 'ranking' | 'history',
    playerId?: string,
  ) {
    const plan = conditions.plan(endpoint),
      url = new URL(request.url);
    try {
      const { page, pageSize } = pagination(url),
        snapshot = await store.read();
      const ruleset = url.searchParams.get('rulesetId');
      if (
        endpoint === 'ranking' &&
        (!ruleset || !/^v1:[0-9a-f]{64}$/.test(ruleset))
      )
        return HttpResponse.json(
          { message: 'Invalid ruleset.' },
          { status: 400 },
        );
      let rows = [...snapshot.items];
      if (plan.scenario !== 'empty') rows.push(...(await sample()));
      if (
        endpoint === 'history' &&
        plan.scenario === 'multiple-pages' &&
        playerId
      )
        rows.push(...(await fixtureRecords(undefined, playerId)));
      rows =
        endpoint === 'ranking'
          ? rows
              .filter((record) => record.rulesetId === ruleset)
              .sort(rankingOrder)
          : rows
              .filter((record) => record.playerId === playerId)
              .sort(
                (a, b) =>
                  b.completedAt.localeCompare(a.completedAt) ||
                  a.matchId.localeCompare(b.matchId),
              );
      const response: PageResult = {
        items: rows.slice((page - 1) * pageSize, page * pageSize),
        page,
        pageSize,
        total: rows.length,
        revision: snapshot.revision,
      };
      await delay(plan.milliseconds);
      if (plan.epoch !== conditions.epoch) return HttpResponse.error();
      if (plan.connection) return HttpResponse.error();
      if (plan.status !== 200)
        return HttpResponse.json(
          { message: 'The selected demo service is unavailable.' },
          { status: plan.status },
        );
      return HttpResponse.json(response);
    } catch {
      return HttpResponse.json(
        { message: 'The requested data could not be read.' },
        { status: 400 },
      );
    }
  }
  return [
    http.get('*/api/ranking', ({ request }) => list(request, 'ranking')),
    http.get('*/api/players/:playerId/matches', ({ request, params }) =>
      list(request, 'history', String(params.playerId)),
    ),
    http.post('*/api/matches', async ({ request }) => {
      const plan = conditions.plan('registration');
      try {
        const raw: unknown = await request.json(),
          record = decodeRecord(raw);
        if (record.rulesetId !== (await rulesetId(record.config)))
          return HttpResponse.json(
            { message: 'The ruleset does not match the configuration.' },
            { status: 400 },
          );
        if (plan.connection) {
          await delay(plan.milliseconds);
          return HttpResponse.error();
        }
        if (plan.status !== 200) {
          await delay(plan.milliseconds);
          return HttpResponse.json(
            { message: 'Match registration is unavailable.' },
            { status: plan.status },
          );
        }
        if (plan.scenario === 'timeout') {
          await delay(6000);
          return HttpResponse.error();
        }
        const existed = (await store.read()).items.some(
          (item) => item.matchId === record.matchId,
        );
        if (plan.epoch !== conditions.epoch) return HttpResponse.error();
        const stored = await store.commit(record),
          revision = (await store.read()).revision;
        await delay(
          plan.scenario === 'commit-timeout' && !existed
            ? 6000
            : plan.milliseconds,
        );
        if (plan.epoch !== conditions.epoch) return HttpResponse.error();
        return HttpResponse.json(
          { record: stored, revision },
          { status: existed ? 200 : 201 },
        );
      } catch (error) {
        return HttpResponse.json(
          {
            message:
              error instanceof RecordConflict
                ? error.message
                : 'The match payload could not be registered.',
          },
          { status: error instanceof RecordConflict ? 409 : 400 },
        );
      }
    }),
  ];
}
export function memoryStore(): MockStore {
  const items = new Map<string, CompletedRecord>();
  let revision = 0;
  return {
    read: () => Promise.resolve({ items: [...items.values()], revision }),
    commit: (record) => {
      const old = items.get(record.matchId);
      if (old && JSON.stringify(old) !== JSON.stringify(record))
        return Promise.reject(new RecordConflict('Conflicting result.'));
      if (!old) {
        items.set(record.matchId, record);
        revision++;
      }
      return Promise.resolve(old ?? record);
    },
  };
}
export const handlers = createHandlers(browserStore);
