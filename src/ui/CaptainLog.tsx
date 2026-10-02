import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
export function CaptainLog({
  settings,
  player,
  submissions,
  onOpenChange,
}: {
  settings: Settings;
  player: PlayerIdentity | null;
  submissions: SubmissionService;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<'ranking' | 'history'>('ranking'),
    [page, setPage] = useState(1),
    [ruleset, setRuleset] = useState('');
  const [open, setOpen] = useState(false);

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
        ? ['ranking', ruleset, page, 5]
        : ['history', player?.id ?? '', page, 5],
    enabled: open && (tab === 'ranking' ? Boolean(ruleset) : Boolean(player)),
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
  function changeTab(next: 'ranking' | 'history') {
    setTab(next);
    setPage(1);
    setOpen(true);
    onOpenChange(true);
  }
  return (
    <section
      className={'captain-log' + (open ? ' expanded' : '')}
      aria-label="Captain's log"
    >
      {open ? <h2>Captain's log</h2> : null}
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
        hidden={!open}
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
              <RecordsTable
                items={result.data.items}
                kind={tab}
                page={page}
                playerId={player?.id ?? ''}
              />
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
      {open ? (
        <button
          className="primary log-back"
          onClick={() => {
            setOpen(false);
            onOpenChange(false);
            document.getElementById('menu-play')?.focus();
          }}
        >
          Main Menu
        </button>
      ) : null}
    </section>
  );
}
function RecordsTable({
  items,
  kind,
  page,
  playerId,
}: {
  items: readonly CompletedRecord[];
  kind: 'ranking' | 'history';
  page: number;
  playerId: string;
}) {
  const ranking = kind === 'ranking';
  return (
    <table className={'records records-table ' + kind} role="table">
      <thead>
        <tr>
          {(ranking
            ? ['Rank', 'Captain', 'Points', 'Played']
            : ['Date', 'Points', 'Duration', 'Result']
          ).map((label) => (
            <th key={label} scope="col">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((record, index) => {
          const date = new Date(record.completedAt),
            when = (
              <time
                dateTime={record.completedAt}
                title={date.toLocaleString('en-US')}
                aria-label={date.toLocaleString('en-US')}
              >
                {date
                  .toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                  })
                  .toUpperCase()}{' '}
                ·{' '}
                {date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </time>
            );
          return (
            <tr
              key={record.matchId}
              className={
                'record' + (record.playerId === playerId ? ' your-record' : '')
              }
              role="row"
            >
              {ranking ? (
                <>
                  <td className="rank">
                    {String((page - 1) * 5 + index + 1).padStart(2, '0')}
                  </td>
                  <td className="record-name">
                    {record.displayName}{' '}
                    {record.playerId === playerId ? (
                      <span className="you">You</span>
                    ) : null}
                  </td>
                  <td className="points">{record.score}</td>
                  <td className="played">{when}</td>
                </>
              ) : (
                <>
                  <td className="played">
                    {when}
                    <span className="history-name">{record.displayName}</span>
                  </td>
                  <td className="points">{record.score}</td>
                  <td>
                    {Math.floor(record.duration / 60)}:
                    {String(Math.floor(record.duration % 60)).padStart(2, '0')}
                  </td>
                  <td className={'end-reason ' + record.endReason}>
                    {record.endReason === 'time' ? 'Time up' : 'Defeated'}
                  </td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
