import { useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SubmissionService } from '../data/submissions';
import { resetDemoData } from '../data/database';
import { scenarios, SCENARIOS, isScenarioId } from '../mocks/scenarios';
import { Dialog } from './Dialog';
export function NetworkControls({
  submissions,
  onReset,
}: {
  submissions: SubmissionService;
  onReset: () => void;
}) {
  const client = useQueryClient(),
    scenario = useSyncExternalStore(scenarios.subscribe, scenarios.getSnapshot);
  const [resetting, setResetting] = useState(false);
  const [confirm, setConfirm] = useState(false),
    [error, setError] = useState<string | null>(null);
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
      setError('Network preference could not be saved.');
    }
  }
  return (
    <details className="network-controls">
      <summary>Network conditions</summary>
      <p className="help">
        Demonstration service conditions for Ranking and Match History. They do
        not change combat.
      </p>
      <label htmlFor="network-scenario">Scenario</label>
      <select
        id="network-scenario"
        value={scenario}
        onChange={(event) => {
          void select(event.target.value);
        }}
      >
        {Object.entries(SCENARIOS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <p className="help">
        Select Success to recover pending saves. Fixture players are local
        demonstration data.
      </p>
      <button className="text-button" onClick={() => setConfirm(true)}>
        Reset demo data
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {confirm ? (
        <Dialog
          title="Reset demo data?"
          {...(resetting ? {} : { onCancel: () => setConfirm(false) })}
        >
          <p>
            Confirmed and pending demo matches will be removed. Your name and
            options stay saved.
          </p>
          <div className="stack">
            <button
              className="primary"
              disabled={resetting}
              onClick={() => setConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="secondary"
              disabled={resetting}
              onClick={() => {
                setResetting(true);
                void (async () => {
                  try {
                    await submissions.reset();
                    await client.cancelQueries();
                    await resetDemoData();
                    scenarios.select('success');
                    await Promise.all([
                      client.resetQueries({ queryKey: ['ranking'] }),
                      client.resetQueries({ queryKey: ['history'] }),
                    ]);
                    onReset();
                    setConfirm(false);
                  } catch {
                    setError('Demo data could not be reset.');
                  } finally {
                    setResetting(false);
                  }
                })();
              }}
            >
              {resetting ? 'Resetting…' : 'Reset matches'}
            </button>
          </div>
        </Dialog>
      ) : null}
    </details>
  );
}
