import { useCallback, useState } from 'react';
import {
  choosePlayer,
  createConfig,
  readPlayer,
  readSettings,
  saveSettings,
  validateOptions,
  type Settings,
} from './game/config';
import type { AudioService } from './game/audio';
import type { CompletedLocalMatch } from './game/runtime';
import type { MatchSession } from './game/simulation';
import { GameScreen } from './ui/GameScreen';
import titleUrl from '../assets/png/retina/ui/menu/title_pirate_battle.png?url';
import logoUrl from '../assets/logo_jungle_gaming.svg?url';

export function App({ audio }: { audio: AudioService }) {
  const [screen, setScreen] = useState<'menu' | 'options' | 'game' | 'result'>(
    'menu',
  );
  const [settings, setSettings] = useState(readSettings);
  const [name, setName] = useState(() => readPlayer()?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<MatchSession | null>(null);
  const [result, setResult] = useState<CompletedLocalMatch | null>(null);
  const finish = useCallback((completed: CompletedLocalMatch) => {
    setResult(completed);
    setSession(null);
    setScreen('result');
  }, []);
  const exit = useCallback(() => {
    setSession(null);
    setScreen('menu');
  }, []);
  function play(guest = false) {
    try {
      const player = choosePlayer(name, guest);
      const seedText = new URLSearchParams(location.search).get('seed');
      const seed =
        seedText !== null && /^\d{1,10}$/.test(seedText)
          ? Number(seedText)
          : (crypto.getRandomValues(new Uint32Array(1))[0] ?? 1);
      setName(player.name);
      setError(null);
      audio.unlock();
      setSession(
        Object.freeze({
          id: crypto.randomUUID(),
          player,
          seed,
          config: createConfig(settings),
        }),
      );
      setScreen('game');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Your name could not be saved.',
      );
      document.getElementById('display-name')?.focus();
    }
  }
  if (screen === 'game' && session)
    return (
      <GameScreen
        key={session.id}
        session={session}
        audio={audio}
        reducedMotion={
          settings.reducedMotion ||
          matchMedia('(prefers-reduced-motion: reduce)').matches
        }
        onExit={exit}
        onFinish={finish}
      />
    );
  return (
    <div className="menu-scene">
      <main className="wood-panel menu-panel">
        <h1>
          <img className="game-title" src={titleUrl} alt="Pirate Battle" />
        </h1>
        {screen === 'options' ? (
          <Options
            initial={settings}
            onCancel={() => setScreen('menu')}
            onSave={(next) => {
              saveSettings(next);
              setSettings(next);
              audio.update(next);
              setScreen('menu');
            }}
          />
        ) : screen === 'result' && result ? (
          <>
            <h2>{result.reason === 'time' ? 'Battle complete' : 'Defeated'}</h2>
            <p className="result-score">
              {result.score}
              <span>points</span>
            </p>
            <p>{result.session.player.name}</p>
            <p>
              {Math.floor(result.duration / 60)}:
              {String(Math.floor(result.duration % 60)).padStart(2, '0')} played
              · {result.reason === 'time' ? 'Time up' : 'Ship destroyed'}
            </p>
            <div className="stack">
              <button className="primary" onClick={() => play()}>
                Play Again
              </button>
              <button className="secondary" onClick={() => setScreen('menu')}>
                Main Menu
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mission">
              Sink enemy ships. Survive until time runs out.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                play();
              }}
              noValidate
            >
              <label htmlFor="display-name">
                Display name <span className="optional">(optional)</span>
              </label>
              <input
                id="display-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="nickname"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'name-error' : 'name-help'}
              />
              <p id="name-help" className="help">
                Leave blank to get a guest name. 2–24 characters.
              </p>
              {error ? (
                <p id="name-error" role="alert" className="error">
                  {error}
                </p>
              ) : null}
              <div className="stack">
                <button className="primary" type="submit">
                  Play
                </button>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => play(true)}
                >
                  Play as guest
                </button>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setScreen('options')}
                >
                  Options
                </button>
              </div>
            </form>
            <details className="instructions">
              <summary>How to play</summary>
              <p>
                <kbd>W</kbd> / <kbd>↑</kbd> Move forward · <kbd>A</kbd>{' '}
                <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd> Turn
              </p>
              <p>
                <kbd>Space</kbd> Fire forward · <kbd>Q</kbd> Left broadside ·{' '}
                <kbd>E</kbd> Right broadside · <kbd>Esc</kbd> Pause
              </p>
              <p>
                Touch: hold the arrows to move and turn. Hold a cannon button to
                fire. You can move and fire together.
              </p>
            </details>
          </>
        )}
        <footer className="brand">
          <img src={logoUrl} width="100" alt="Jungle Gaming" />
        </footer>
      </main>
    </div>
  );
}

function Options({
  initial,
  onSave,
  onCancel,
}: {
  initial: Settings;
  onSave: (settings: Settings) => void;
  onCancel: () => void;
}) {
  const [duration, setDuration] = useState(String(initial.duration)),
    [spawn, setSpawn] = useState(String(initial.spawnInterval));
  const [muted, setMuted] = useState(initial.muted),
    [reduced, setReduced] = useState(initial.reducedMotion);
  const [volume, setVolume] = useState(initial.volume),
    [error, setError] = useState<string | null>(null);
  return (
    <section>
      <h2>Options</h2>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const message = validateOptions(Number(duration), Number(spawn));
          if (message) {
            setError(message);
            document
              .getElementById(message.startsWith('Game') ? 'duration' : 'spawn')
              ?.focus();
            return;
          }
          try {
            onSave({
              ...initial,
              duration: Number(duration),
              spawnInterval: Number(spawn),
              volume,
              muted,
              reducedMotion: reduced,
            });
          } catch {
            setError(
              'Options could not be saved. Check your browser storage and try again.',
            );
          }
        }}
      >
        <label htmlFor="duration">Game session time</label>
        <div className="number-field">
          <input
            id="duration"
            type="number"
            min="60"
            max="180"
            step="1"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            aria-describedby="duration-help"
          />
          <span>seconds</span>
        </div>
        <p id="duration-help" className="help">
          60–180 seconds of active play.
        </p>
        <label htmlFor="spawn">Enemy spawn time</label>
        <div className="number-field">
          <input
            id="spawn"
            type="number"
            min="0.75"
            max="10"
            step="0.25"
            value={spawn}
            onChange={(event) => setSpawn(event.target.value)}
            aria-describedby="spawn-help"
          />
          <span>seconds</span>
        </div>
        <p id="spawn-help" className="help">
          0.75–10 seconds, in steps of 0.25.
        </p>
        <label htmlFor="volume">
          Master volume · {Math.round(volume * 100)}%
        </label>
        <input
          id="volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
        <label className="check-label">
          <input
            type="checkbox"
            checked={muted}
            onChange={(event) => setMuted(event.target.checked)}
          />{' '}
          Mute sound
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={reduced}
            onChange={(event) => setReduced(event.target.checked)}
          />{' '}
          Reduce motion
        </label>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
        <div className="stack">
          <button className="primary" type="submit">
            Save
          </button>
          <button className="secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
