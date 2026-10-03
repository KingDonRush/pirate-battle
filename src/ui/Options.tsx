import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { validateOptions, type Settings } from '../game/config';
import type { SubmissionService } from '../data/submissions';
import { scenarios, type ScenarioId } from '../mocks/scenarios';
import { NetworkControls } from './NetworkControls';
const TABS = [
  'Game',
  'Controls',
  'Audio',
  'Accessibility',
  'Demo Network',
] as const;
export function Options({
  initial,
  onSave,
  onCancel,
  submissions,
  onReset,
}: {
  initial: Settings;
  onSave: (settings: Settings) => void;
  onCancel: () => void;
  submissions: SubmissionService;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Game');
  const [duration, setDuration] = useState(String(initial.duration));
  const [spawn, setSpawn] = useState(String(initial.spawnInterval));
  const [draft, setDraft] = useState(initial);
  const [scenario, setScenario] = useState<ScenarioId>(scenarios.getSnapshot());
  const [error, setError] = useState<string | null>(null),
    [saving, setSaving] = useState(false);
  const focusFrame = useRef(0),
    client = useQueryClient();
  useEffect(() => () => cancelAnimationFrame(focusFrame.current), []);
  const update = (patch: Partial<Settings>) =>
    setDraft((value) => ({ ...value, ...patch }));
  async function save() {
    const message = validateOptions(Number(duration), Number(spawn));
    if (message) {
      setError(message);
      setTab('Game');
      cancelAnimationFrame(focusFrame.current);
      focusFrame.current = requestAnimationFrame(() =>
        document
          .getElementById(message.startsWith('Game') ? 'duration' : 'spawn')
          ?.focus(),
      );
      return;
    }
    setSaving(true);
    try {
      if (scenario !== scenarios.getSnapshot()) {
        scenarios.select(scenario);
        await Promise.all([
          client.cancelQueries({ queryKey: ['ranking'] }),
          client.cancelQueries({ queryKey: ['history'] }),
        ]);
        await Promise.all([
          client.invalidateQueries({ queryKey: ['ranking'] }),
          client.invalidateQueries({ queryKey: ['history'] }),
        ]);
      }
      onSave({
        ...draft,
        duration: Number(duration),
        spawnInterval: Number(spawn),
      });
    } catch {
      setError('Options could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      className="options-content"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          if (!event.repeat && !saving) onCancel();
        }
      }}
    >
      <h2>Options</h2>
      <div
        role="tablist"
        aria-label="Options sections"
        className="options-tabs"
        onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
            return;
          event.preventDefault();
          const buttons = [
            ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
              'button',
            ),
          ];
          const index = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          buttons[
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? buttons.length - 1
                : (index +
                    (event.key === 'ArrowRight' ? 1 : -1) +
                    buttons.length) %
                  buttons.length
          ]?.focus();
        }}
      >
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={'options-' + name.replaceAll(' ', '-')}
            aria-controls="options-body"
            aria-selected={tab === name}
            tabIndex={tab === name ? 0 : -1}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <form
        className="options-form"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        noValidate
      >
        <div
          className="panel-scroll"
          id="options-body"
          role="tabpanel"
          aria-labelledby={'options-' + tab.replaceAll(' ', '-')}
        >
          {tab === 'Game' ? (
            <>
              <p className="help">Choose the rhythm of your next battle.</p>
              <label htmlFor="duration">Game session time</label>
              <div className="number-field">
                <button
                  type="button"
                  className="round-step"
                  aria-label="Decrease game session time"
                  onClick={() =>
                    setDuration(String(Math.max(60, Number(duration) - 10)))
                  }
                >
                  −
                </button>
                <input
                  id="duration"
                  type="number"
                  min="60"
                  max="180"
                  step="1"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  aria-describedby="duration-help"
                  aria-invalid={Boolean(error?.startsWith('Game'))}
                />
                <span>s</span>
                <button
                  type="button"
                  className="round-step"
                  aria-label="Increase game session time"
                  onClick={() =>
                    setDuration(String(Math.min(180, Number(duration) + 10)))
                  }
                >
                  +
                </button>
              </div>
              <p id="duration-help" className="help">
                60–180 seconds of active play.
              </p>
              <label htmlFor="spawn">Enemy spawn time</label>
              <div className="number-field">
                <button
                  type="button"
                  className="round-step"
                  aria-label="Decrease enemy spawn time"
                  onClick={() =>
                    setSpawn(String(Math.max(0.75, Number(spawn) - 0.25)))
                  }
                >
                  −
                </button>
                <input
                  id="spawn"
                  type="number"
                  min="0.75"
                  max="10"
                  step="0.25"
                  value={spawn}
                  onChange={(event) => setSpawn(event.target.value)}
                  aria-describedby="spawn-help"
                  aria-invalid={Boolean(error?.startsWith('Enemy'))}
                />
                <span>s</span>
                <button
                  type="button"
                  className="round-step"
                  aria-label="Increase enemy spawn time"
                  onClick={() =>
                    setSpawn(String(Math.min(10, Number(spawn) + 0.25)))
                  }
                >
                  +
                </button>
              </div>
              <p id="spawn-help" className="help">
                0.75–10 seconds, in steps of 0.25.
              </p>
            </>
          ) : tab === 'Controls' ? (
            <>
              <fieldset>
                <legend>Touch steering</legend>
                <label className="choice">
                  <input
                    type="radio"
                    name="steering-mode"
                    checked={draft.controlMode === 'direction'}
                    onChange={() => update({ controlMode: 'direction' })}
                  />
                  Direction
                  <span>
                    Drag towards your destination. The ship turns and sails
                    forward.
                  </span>
                </label>
                <label className="choice">
                  <input
                    type="radio"
                    name="steering-mode"
                    checked={draft.controlMode === 'rudder'}
                    onChange={() => update({ controlMode: 'rudder' })}
                  />
                  Throttle &amp; Rudder
                  <span>Drag up to sail; drag left or right to turn.</span>
                </label>
              </fieldset>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.mirrorControls}
                  onChange={(event) =>
                    update({ mirrorControls: event.target.checked })
                  }
                />
                Mirror touch controls
              </label>
              <p className="help">
                Cannons appear on the {draft.mirrorControls ? 'right' : 'left'}.
                Start the floating stick anywhere clear of a button.
              </p>
              <p>
                Keyboard: <kbd>W</kbd> / <kbd>↑</kbd> sail · <kbd>A D</kbd> turn
                · <kbd>Q Space E</kbd> fire · <kbd>Esc</kbd> pause / resume.
              </p>
            </>
          ) : tab === 'Audio' ? (
            <>
              {(
                [
                  ['volume', 'Master'],
                  ['effectsVolume', 'Effects'],
                  ['ambienceVolume', 'Ambience'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="audio-setting">
                  <label htmlFor={key}>
                    {label} volume · {Math.round(draft[key] * 100)}%
                  </label>
                  <input
                    id={key}
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={draft[key]}
                    onChange={(event) =>
                      update({ [key]: Number(event.target.value) })
                    }
                  />
                </div>
              ))}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.muted}
                  onChange={(event) => update({ muted: event.target.checked })}
                />
                Mute sound
              </label>
            </>
          ) : tab === 'Accessibility' ? (
            <>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={draft.reducedMotion}
                  onChange={(event) =>
                    update({ reducedMotion: event.target.checked })
                  }
                />
                Reduce motion
              </label>
              <p>
                Short fades replace movement effects. Damage, projectiles and
                match status remain visible.
              </p>
              <p className="help">
                Keyboard focus stays visible. Menus support Tab, Enter and
                Escape; tabs use arrow keys and Enter.
              </p>
            </>
          ) : (
            <NetworkControls
              submissions={submissions}
              scenario={scenario}
              onScenarioChange={setScenario}
              onReset={() => {
                setScenario('success');
                onReset();
              }}
            />
          )}
          {error ? (
            <p id="options-error" role="alert" className="error">
              {error}
            </p>
          ) : null}
        </div>
        <div className="panel-actions">
          <button className="primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            className="secondary"
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
