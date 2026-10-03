import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SubmissionService } from '../data/submissions';
import { resetDemoData } from '../data/database';
import { scenarios, SCENARIOS, type ScenarioId } from '../mocks/scenarios';
import { Dialog } from './Dialog';
export function NetworkControls({
  submissions,
  onReset,
  scenario,
  onScenarioChange,
}: {
  submissions: SubmissionService;
  onReset: () => void;
  scenario: ScenarioId;
  onScenarioChange: (value: ScenarioId) => void;
}) {
  const client = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [confirm, setConfirm] = useState(false),
    [error, setError] = useState<string | null>(null);
  return (
    <section className="network-controls">
      <h3>Demo Network</h3>
      <p className="help">
        Demonstration service conditions for Ranking and Match History. They do
        not change combat.
      </p>
      <fieldset className="scenario-grid">
        <legend>Scenario</legend>
        {Object.entries(SCENARIOS).map(([value, label]) => (
          <label className="choice" key={value}>
            <input
              type="radio"
              name="network-scenario"
              value={value}
              checked={scenario === value}
              onChange={() => onScenarioChange(value as ScenarioId)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <p className="help">
        Select Success to recover pending saves. Fixture players are local
        demonstration data.
      </p>
      <button
        type="button"
        className="text-button"
        onClick={() => setConfirm(true)}
      >
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
              type="button"
              disabled={resetting}
              onClick={() => setConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="secondary"
              type="button"
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
    </section>
  );
}
