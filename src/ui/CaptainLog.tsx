import { useEffect, useState, useSyncExternalStore } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createConfig,
  type Settings,
  type PlayerIdentity,
} from '../game/config';
import { rulesetId, type CompletedRecord } from '../data/contracts';
import {
  history,
  ranking,
  retryDelay,
  retryTransient,
  ApiError,
} from '../data/api';
import type { SubmissionService } from '../data/submissions';
import { resetDemoData } from '../data/database';
import { scenarios, SCENARIOS, isScenarioId } from '../mocks/scenarios';
import { Dialog } from './Dialog';
export function CaptainLog({
  settings,
  player,
  submissions,
}: {
  settings: Settings;
  player: PlayerIdentity | null;
  submissions: SubmissionService;
}) {
  const [tab, setTab] = useState<'ranking' | 'history'>('ranking'),
    [page, setPage] = useState(1),
    [ruleset, setRuleset] = useState('');
  const [reset, setReset] = useState(false),
    [failure, setFailure] = useState<string | null>(null);
  const client = useQueryClient();
  const scenario = useSyncExternalStore(
    scenarios.subscribe,
    scenarios.getSnapshot,
  );
  useEffect(() => {
    let obsolete = false;
    void rulesetId(createConfig(settings)).then((id) => {
      if (!obsolete) setRuleset(id);
    });
    return () => {
      obsolete = true;
    };
  }, [settings]);
  const result = useQuery({
    queryKey:
      tab === 'ranking'
        ? ['ranking', ruleset, page]
        : ['history', player?.id ?? '', page],
    enabled: tab === 'ranking' ? Boolean(ruleset) : Boolean(player),
    queryFn: async ({ signal }) => {
      const data =
        tab === 'ranking'
          ? await ranking(ruleset, page, signal)
          : await history(player?.id ?? '', page, signal);
      if (data.revision < submissions.minimumRevision)
        throw new ApiError(
          'A stale response was discarded. Try again.',
          'connection',
        );
      return data;
    },
    staleTime: 0,
    gcTime: 120000,
    retry: retryTransient,
    retryDelay,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const pages = Math.max(1, Math.ceil((result.data?.total ?? 0) / 5));
  async function select(value: string) {
    if (!isScenarioId(value)) return;
    try {
      scenarios.select(value);
      await Promise.all([
        client.cancelQueries({ queryKey: ['ranking'] }),
        client.cancelQueries({ queryKey: ['history'] }),
      ]);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['ranking'] }),
        client.invalidateQueries({ queryKey: ['history'] }),
      ]);
    } catch {
      setFailure('Network preference could not be saved.');
    }
  }
  function changeTab(next: 'ranking' | 'history') {
    setTab(next);
    setPage(1);
  }
  return (
    <section className="captain-log" aria-label="Captain's log">
      <div
        className="tabs"
        role="tablist"
        aria-label="Match records"
        onKeyDown={(event) => {
          if (
            event.key !== 'ArrowLeft' &&
            event.key !== 'ArrowRight' &&
            event.key !== 'Home' &&
            event.key !== 'End'
          )
            return;
          event.preventDefault();
          const buttons =
            event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
          const current = [...buttons].indexOf(
            document.activeElement as HTMLButtonElement,
          );
          buttons[
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? 1
                : current === 0
                  ? 1
                  : 0
          ]?.focus();
        }}
      >
        <button
          id="ranking-tab"
          role="tab"
          aria-selected={tab === 'ranking'}
          aria-controls="record-panel"
          tabIndex={tab === 'ranking' ? 0 : -1}
          onClick={() => changeTab('ranking')}
        >
          Ranking
        </button>
        <button
          id="history-tab"
          role="tab"
          aria-selected={tab === 'history'}
          aria-controls="record-panel"
          tabIndex={tab === 'history' ? 0 : -1}
          onClick={() => changeTab('history')}
        >
          Match History
        </button>
      </div>
      <div
        id="record-panel"
        role="tabpanel"
        data-revision={result.data?.revision}
        aria-labelledby={tab === 'ranking' ? 'ranking-tab' : 'history-tab'}
      >
        {tab === 'ranking' ? (
          <p className="help">
            {settings.duration}-second battles · {settings.spawnInterval}-second
            spawns. Matching combat rules only.
          </p>
        ) : (
          <p className="help">
            Your completed battles, including earlier display names.
          </p>
        )}
        {tab === 'history' && !player ? (
          <p>Play a match to begin your history.</p>
        ) : result.isLoading ? (
          <p role="status">
            Loading {tab === 'ranking' ? 'ranking' : 'match history'}…
          </p>
        ) : result.isError && !result.data ? (
          <div role="alert">
            <p>
              {result.error instanceof Error
                ? result.error.message
                : 'The records could not be loaded.'}
            </p>
            <button
              className="text-button"
              onClick={() => {
                void result.refetch();
              }}
            >
              Try again
            </button>
          </div>
        ) : result.data ? (
          <>
            {result.isFetching ? (
              <p role="status" className="help">
                Updating records…
              </p>
            ) : null}
            {result.isError ? (
              <p role="alert">
                Showing earlier records. Update failed.{' '}
                <button
                  className="inline-button"
                  onClick={() => {
                    void result.refetch();
                  }}
                >
                  Try again
                </button>
              </p>
            ) : null}
            {result.data.items.length === 0 ? (
              <p>
                {tab === 'ranking'
                  ? 'No battles with these rules yet.'
                  : 'No completed battles yet.'}
              </p>
            ) : (
              <ol className="records" start={(page - 1) * 5 + 1}>
                {result.data.items.map((record, index) => (
                  <RecordRow
                    key={record.matchId}
                    record={record}
                    rank={tab === 'ranking' ? (page - 1) * 5 + index + 1 : null}
                    yours={record.playerId === player?.id}
                  />
                ))}
              </ol>
            )}
            <nav
              className="pagination"
              aria-label={tab === 'ranking' ? 'Ranking pages' : 'History pages'}
            >
              <button
                className="small-button"
                disabled={page <= 1 || result.isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button
                className="small-button"
                disabled={page >= pages || result.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </nav>
          </>
        ) : (
          <p role="status">Preparing records…</p>
        )}
      </div>
      <details className="network-controls">
        <summary>Network conditions</summary>
        <p className="help">
          Demonstration service conditions for Ranking and Match History. They
          do not change combat.
        </p>
        <label htmlFor="network-scenario">Scenario</label>
        <select
          id="network-scenario"
          value={scenario}
          onChange={(event) => {
            void select(event.target.value);
          }}
        >
          {Object.entries(SCENARIOS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <p className="help">
          Select Success to recover pending saves. Fixture players are local
          demonstration data.
        </p>
        <button className="text-button" onClick={() => setReset(true)}>
          Reset demo data
        </button>
        {failure ? <p role="alert">{failure}</p> : null}
      </details>
      {reset ? (
        <Dialog title="Reset demo data?" onCancel={() => setReset(false)}>
          <p>
            Confirmed and pending demo matches will be removed. Your name and
            options stay saved.
          </p>
          <div className="stack">
            <button className="primary" onClick={() => setReset(false)}>
              Cancel
            </button>
            <button
              className="secondary"
              onClick={() => {
                void (async () => {
                  try {
                    await submissions.reset();
                    await client.cancelQueries();
                    await resetDemoData();
                    scenarios.select('success');
                    client.removeQueries({ queryKey: ['ranking'] });
                    client.removeQueries({ queryKey: ['history'] });
                    setPage(1);
                    setReset(false);
                  } catch {
                    setFailure('Demo data could not be reset.');
                  }
                })();
              }}
            >
              Reset matches
            </button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
function RecordRow({
  record,
  rank,
  yours,
}: {
  record: CompletedRecord;
  rank: number | null;
  yours: boolean;
}) {
  const date = new Date(record.completedAt);
  return (
    <li className={'record' + (yours ? ' your-record' : '')}>
      {rank !== null ? <span className="rank">{rank}</span> : null}
      <div className="record-info">
        <strong>
          {record.displayName} {yours ? <span className="you">You</span> : null}
        </strong>
        <time dateTime={record.completedAt}>
          {date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
        {rank === null ? (
          <span>
            {Math.floor(record.duration / 60)}:
            {String(Math.floor(record.duration % 60)).padStart(2, '0')} ·{' '}
            {record.endReason === 'time' ? 'Time up' : 'Defeated'}
          </span>
        ) : null}
        {record.matchId.startsWith('fixture:') ? (
          <span className="fixture-label">Demo record</span>
        ) : null}
      </div>
      <strong className="points">
        {record.score}
        <span>points</span>
      </strong>
    </li>
  );
}
