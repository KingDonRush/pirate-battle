import {
  useCallback,
  useEffect,
  useState,
  useRef,
  useSyncExternalStore,
  lazy,
  Suspense,
} from 'react';
import {
  choosePlayer,
  createConfig,
  readPlayer,
  readSettings,
  saveSettings,
} from './game/config';
import type { AudioService } from './game/audio';
import type { CompletedLocalMatch } from './game/runtime';
import type { MatchSession } from './game/simulation';
import { localResult } from './data/contracts';
import type { SubmissionService } from './data/submissions';
import { latestResult } from './data/database';
import { CaptainLog } from './ui/CaptainLog';
import { BattleLoadBoundary } from './ui/BattleLoadBoundary';
import { Options } from './ui/Options';
import titleUrl from '../assets/png/retina/ui/menu/title_pirate_battle.png?url';
import logoUrl from '../assets/logo_jungle_gaming.svg?url';
import frontIcon from '../assets/png/retina/ui/controls/icon_fire_front.png?url';
import leftIcon from '../assets/png/retina/ui/controls/icon_fire_left.png?url';
import rightIcon from '../assets/png/retina/ui/controls/icon_fire_right.png?url';
import playerIcon from '../assets/png/default/ships/ship_2.png?url';
import chaserIcon from '../assets/png/default/ships/ship_4.png?url';
import shooterIcon from '../assets/png/default/ships/ship_5.png?url';
const GameScreen = lazy(() =>
  import('./ui/GameScreen').then((module) => ({ default: module.GameScreen })),
);
export function App({
  audio,
  submissions,
}: {
  audio: AudioService;
  submissions: SubmissionService;
}) {
  const [screen, setScreen] = useState<
    'menu' | 'options' | 'help' | 'game' | 'result'
  >('menu');
  const [logOpen, setLogOpen] = useState(false),
    [settings, setSettings] = useState(readSettings);
  const [player, setPlayer] = useState(readPlayer),
    [name, setName] = useState(() => readPlayer()?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<MatchSession | null>(null),
    [result, setResult] = useState<CompletedLocalMatch | null>(null);
  const saves = useSyncExternalStore(
    submissions.subscribe,
    submissions.getSnapshot,
  );
  const previousScreen = useRef(screen);
  useEffect(() => {
    const previous = previousScreen.current;
    previousScreen.current = screen;
    if (screen === 'game' || logOpen) return;
    const target =
      screen === 'menu'
        ? previous === 'options'
          ? 'menu-options'
          : previous === 'help'
            ? 'menu-help'
            : 'menu-play'
        : screen === 'options'
          ? 'options-Game'
          : screen === 'help'
            ? 'help-title'
            : 'result-title';
    document.getElementById(target)?.focus();
  }, [screen, logOpen]);
  useEffect(() => {
    const measure = () => {
      const viewport = window.visualViewport;
      document.documentElement.style.setProperty(
        '--viewport-height',
        `${viewport?.height ?? window.innerHeight}px`,
      );
    };
    measure();
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      document.documentElement.style.removeProperty('--viewport-height');
    };
  }, []);
  useEffect(() => {
    let obsolete = false;
    void latestResult()
      .then((record) => {
        if (obsolete || !record) return;
        setResult(localResult(record));
        void submissions.status(record.matchId);
        if (localStorage.getItem('pirate-battle:view') === 'result')
          setScreen('result');
      })
      .catch(() => {
        if (!obsolete)
          setError(
            'Previous results could not be read. Browser storage is unavailable.',
          );
      });
    return () => {
      obsolete = true;
    };
  }, [submissions]);
  const completed = useCallback(
    (match: CompletedLocalMatch) => {
      setResult(Object.freeze(match));
      try {
        localStorage.setItem('pirate-battle:view', 'result');
      } catch {
        /* The durable save state reports failure. */
      }
      void submissions.completed(match);
    },
    [submissions],
  );
  const finish = useCallback(() => {
    setSession(null);
    setScreen('result');
  }, []);
  const exit = useCallback(() => {
    audio.cancelEnding();
    setSession(null);
    setLogOpen(false);
    setScreen('menu');
    try {
      localStorage.setItem('pirate-battle:view', 'menu');
    } catch {
      setError('Your menu preference could not be saved.');
    }
  }, [audio]);
  function play(guest = false) {
    try {
      const identity = choosePlayer(name, guest);
      setPlayer(identity);
      setName(identity.name);
      const seedText = new URLSearchParams(location.search).get('seed');
      const parsed =
        seedText && /^\d{1,10}$/.test(seedText) ? Number(seedText) : NaN;
      const seed =
        Number.isInteger(parsed) && parsed >= 0 && parsed <= 0xffffffff
          ? parsed
          : crypto.getRandomValues(new Uint32Array(1))[0]!;
      setError(null);
      audio.unlock();
      setSession(
        Object.freeze({
          id: crypto.randomUUID(),
          player: identity,
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
  const save = (next: typeof settings) => {
    saveSettings(next);
    setSettings(next);
    audio.update(next);
  };
  if (screen === 'game' && session)
    return (
      <BattleLoadBoundary key={session.id} onExit={exit}>
        <Suspense
          fallback={
            <main className="menu-scene">
              <section className="wood-panel loading-panel">
                <h2>Preparing the battle</h2>
                <p role="status">Loading the arena…</p>
                <button className="secondary" onClick={exit}>
                  Main Menu
                </button>
              </section>
            </main>
          }
        >
          <GameScreen
            key={session.id}
            session={session}
            audio={audio}
            preferences={settings}
            reducedMotion={
              settings.reducedMotion ||
              matchMedia('(prefers-reduced-motion: reduce)').matches
            }
            onExit={exit}
            onFinish={finish}
            onCompleted={completed}
            options={(close) => (
              <Options
                initial={settings}
                onCancel={close}
                onSave={(next) => {
                  save(next);
                  close();
                }}
                submissions={submissions}
                onReset={() => setResult(null)}
              />
            )}
          />
        </Suspense>
      </BattleLoadBoundary>
    );
  const saveState = result ? saves.byId[result.session.id] : undefined;
  return (
    <div className="menu-scene reference-scene">
      <main
        className={
          'wood-panel menu-panel reference-panel ' +
          (screen === 'menu'
            ? logOpen
              ? 'log-panel'
              : 'main-menu'
            : screen + '-panel')
        }
      >
        {screen === 'menu' ? (
          <>
            <div className="menu-core" hidden={logOpen}>
              <h1>
                <img
                  className="game-title"
                  src={titleUrl}
                  alt="Pirate Battle"
                />
              </h1>
              <p className="menu-motto">Set sail. Take command.</p>
              <form
                id="captain-form"
                className="identity-row"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  play();
                }}
              >
                <label htmlFor="display-name">
                  Display name <span className="optional">(optional)</span>
                </label>
                <input
                  id="display-name"
                  value={name}
                  placeholder="Guest captain"
                  autoComplete="nickname"
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'name-error' : 'name-help'}
                />
                <p id="name-help" className="help">
                  Leave blank for a guest name. 2–24 characters.
                </p>
                {error ? (
                  <p id="name-error" role="alert" className="error">
                    {error}
                  </p>
                ) : null}
              </form>
              <div className="home-actions">
                <button
                  id="menu-play"
                  type="button"
                  onClick={() => play()}
                  className="primary menu-play"
                  aria-label="Play"
                >
                  Play
                </button>
                <button
                  type="button"
                  id="menu-options"
                  className="secondary menu-options"
                  aria-label="Options"
                  onClick={() => setScreen('options')}
                >
                  Options
                </button>
              </div>
              <div className="home-links">
                <button className="inline-button" onClick={() => play(true)}>
                  Play as guest
                </button>
                <button
                  className="inline-button"
                  id="menu-help"
                  onClick={() => setScreen('help')}
                >
                  How to play
                </button>
              </div>
              <img className="menu-ship" src={playerIcon} alt="" />
              <p className="menu-objective">
                Navigate the islands. Survive the battle.
              </p>
            </div>
            <CaptainLog
              settings={settings}
              player={player}
              submissions={submissions}
              onOpenChange={setLogOpen}
            />
            {!logOpen && (result || saves.pending > 0 || saves.error) ? (
              <div className="save-strip">
                {result ? (
                  <button
                    className="inline-button last-result"
                    onClick={() => setScreen('result')}
                  >
                    Last result
                  </button>
                ) : null}
                {saves.pending > 0 ? (
                  <span role="status">
                    {saves.pending} pending{' '}
                    <button
                      className="inline-button"
                      onClick={() => {
                        void submissions.retryAll();
                      }}
                    >
                      Retry saves
                    </button>
                  </span>
                ) : null}
                {saves.error ? <p role="alert">{saves.error}</p> : null}
              </div>
            ) : null}
          </>
        ) : screen === 'options' ? (
          <Options
            initial={settings}
            onSave={(next) => {
              save(next);
              setScreen('menu');
            }}
            onCancel={() => setScreen('menu')}
            submissions={submissions}
            onReset={() => setResult(null)}
          />
        ) : screen === 'help' ? (
          <section
            className="help-content"
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !event.repeat) {
                event.preventDefault();
                setScreen('menu');
              }
            }}
          >
            <h2 id="help-title" tabIndex={-1}>
              How to play
            </h2>
            <div className="panel-scroll">
              <p>
                Sink enemy ships for one point each. Survive until time runs
                out.
              </p>
              <div className="ship-guide">
                {[
                  [playerIcon, 'Your pirate ship'],
                  [chaserIcon, 'Chaser'],
                  [shooterIcon, 'Shooter'],
                ].map(([icon, label]) => (
                  <div key={label}>
                    <img src={icon} alt="" />
                    <strong>{label}</strong>
                    <p>
                      {label === 'Chaser'
                        ? 'Pursues and explodes on contact.'
                        : label === 'Shooter'
                          ? 'Approaches and fires from range.'
                          : 'Sail forward, turn and fire.'}
                    </p>
                  </div>
                ))}
              </div>
              <h3>Keyboard</h3>
              <p>
                <kbd>W</kbd> / <kbd>↑</kbd> sail · <kbd>A D</kbd> /{' '}
                <kbd>← →</kbd> turn · <kbd>Esc</kbd> pause / resume.
              </p>
              <div className="weapon-guide">
                {[
                  [leftIcon, 'Q · Left broadside'],
                  [frontIcon, 'Space · Front cannon'],
                  [rightIcon, 'E · Right broadside'],
                ].map(([icon, label]) => (
                  <div key={label}>
                    <img src={icon} alt="" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <h3>Touch</h3>
              <p>
                Start the floating stick anywhere clear of a button.{' '}
                {settings.controlMode === 'direction'
                  ? 'Drag towards your destination; the ship turns and sails.'
                  : 'Drag up to sail; drag sideways to turn.'}{' '}
                Hold any cannon with another finger. Cannons are on the{' '}
                {settings.mirrorControls ? 'right' : 'left'}.
              </p>
              <p className="help">
                Your ship keeps its momentum only while you hold a control. A
                pause or orientation change releases held actions.
              </p>
            </div>
            <div className="panel-actions">
              <button className="secondary" onClick={() => setScreen('menu')}>
                Main Menu
              </button>
            </div>
          </section>
        ) : result ? (
          <section className="result-content">
            <h2 id="result-title" tabIndex={-1}>
              {result.reason === 'death' ? 'Defeated' : 'Battle complete'}
            </h2>
            <p className="result-captain">{result.session.player.name}</p>
            <div className="result-score" aria-label={'Score: ' + result.score}>
              {result.score}
            </div>
            <p>Points earned</p>
            <div className="result-summary">
              <p>
                Time played: {Math.floor(result.duration / 60)}:
                {String(Math.floor(result.duration % 60)).padStart(2, '0')}
              </p>
              <p>{result.reason === 'death' ? 'Defeated' : 'Time up'}</p>
            </div>
            <p role="status">{saveState?.message ?? 'Saving…'}</p>
            {saveState?.status === 'error' ||
            saveState?.status === 'pending' ? (
              <button
                className="text-button"
                onClick={() => {
                  void submissions.retry(result.session.id, result);
                }}
              >
                Try again
              </button>
            ) : null}
            <div className="panel-actions">
              <button className="primary" onClick={() => play()}>
                Play Again
              </button>
              <button className="secondary" onClick={exit}>
                Main Menu
              </button>
            </div>
          </section>
        ) : null}
        <footer className="brand">
          <img src={logoUrl} alt="Jungle Gaming" />
        </footer>
      </main>
    </div>
  );
}
