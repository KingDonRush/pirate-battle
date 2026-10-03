import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { loadGameAssets } from '../game/assets';
import type { AudioService } from '../game/audio';
import type { Action } from '../game/input';
import type { Settings } from '../game/config';
import { GameRuntime, type CompletedLocalMatch } from '../game/runtime';
import type { MatchSession } from '../game/simulation';
import { Dialog } from './Dialog';
import forwardIcon from '../../assets/png/retina/ui/controls/icon_forward.png?url';
import turnLeftIcon from '../../assets/png/retina/ui/controls/icon_turn_left.png?url';
import turnRightIcon from '../../assets/png/retina/ui/controls/icon_turn_right.png?url';
import frontIcon from '../../assets/png/retina/ui/controls/icon_fire_front.png?url';
import leftIcon from '../../assets/png/retina/ui/controls/icon_fire_left.png?url';
import heartIcon from '../../assets/png/retina/ui/hud/icon_heart.png?url';
import scoreIcon from '../../assets/png/retina/ui/hud/icon_score.png?url';
import timeIcon from '../../assets/png/retina/ui/hud/icon_time.png?url';
import pauseIcon from '../../assets/png/retina/ui/controls/icon_pause.png?url';
import logoUrl from '../../assets/logo_jungle_gaming.svg?url';
import rightIcon from '../../assets/png/retina/ui/controls/icon_fire_right.png?url';
declare global {
  interface Window {
    pirateBattle?: {
      observe: (includeFrames?: boolean) => ReturnType<GameRuntime['observe']>;
      advance: (milliseconds: number) => void;
    };
  }
}
function Control({
  runtime,
  actions,
  label,
  icon,
  diagonal,
}: {
  runtime: GameRuntime;
  actions: readonly Action[];
  label: string;
  icon: string;
  diagonal?: boolean;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  return (
    <button
      type="button"
      className={'round-control' + (diagonal ? ' diagonal' : '')}
      aria-label={label}
      title={label}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        runtime.input.press('pointer:' + event.pointerId, actions);
      }}
      onPointerUp={(event) =>
        runtime.input.release('pointer:' + event.pointerId)
      }
      onPointerCancel={(event) =>
        runtime.input.release('pointer:' + event.pointerId)
      }
      onLostPointerCapture={(event) =>
        runtime.input.release('pointer:' + event.pointerId)
      }
      onClick={(event) => {
        if (event.detail !== 0) return;
        const id = 'activation:' + label;
        clearTimeout(timer.current);
        runtime.input.press(id, actions);
        timer.current = setTimeout(() => {
          runtime.input.release(id);
          timer.current = undefined;
        }, 120);
      }}
    >
      <img src={icon} alt="" draggable={false} />
    </button>
  );
}
function Battle({
  runtime,
  onExit,
  options,
}: {
  runtime: GameRuntime;
  onExit: () => void;
  options: (close: () => void) => ReactNode;
}) {
  const hud = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot);
  useEffect(() => {
    if (hud.state === 'running')
      document.querySelector<HTMLElement>('.arena-viewport')?.focus();
  }, [hud.state]);
  const [confirm, setConfirm] = useState(false);
  const [editingOptions, setEditingOptions] = useState(false);
  const mins = Math.floor(hud.remaining / 60),
    secs = String(hud.remaining % 60).padStart(2, '0');
  return (
    <>
      <header className="battle-hud">
        <div className="captain">
          <span className="eyebrow">Captain</span>
          <strong>{runtime.session.player.name}</strong>
        </div>
        <div
          className="hud-health"
          aria-label={
            'Health: ' +
            hud.health +
            ' of ' +
            runtime.session.config.player.health
          }
        >
          <img className="heart-icon" src={heartIcon} alt="" />
          <div className="health-gauge">
            <span
              className="health-fill"
              style={{
                clipPath:
                  'inset(0 ' +
                  ((256 -
                    30 -
                    (196 * hud.health) / runtime.session.config.player.health) /
                    256) *
                    100 +
                  '% 0 0)',
                visibility: hud.health === 0 ? 'hidden' : 'visible',
              }}
            />
            <strong>
              {hud.health} / {runtime.session.config.player.health}
            </strong>
          </div>
        </div>
        <div className="hud-counter" aria-label={'Score: ' + hud.score}>
          <img className="counter-icon" src={scoreIcon} alt="" />
          <span className="counter-label">Score</span>
          <strong>{hud.score}</strong>
        </div>
        <div
          className="hud-counter"
          aria-label={
            'Time remaining: ' + mins + ' minutes ' + secs + ' seconds'
          }
        >
          <img className="counter-icon" src={timeIcon} alt="" />
          <span className="counter-label">Time</span>
          <strong>
            {String(mins).padStart(2, '0')}:{secs}
          </strong>
        </div>
        <button
          className="small-button game-pause"
          aria-label="Pause"
          onClick={() => runtime.pause()}
        >
          <img src={pauseIcon} alt="" />
        </button>
      </header>
      <div className="steering controls" aria-label="Movement controls">
        <Control
          runtime={runtime}
          actions={['forward', 'turnLeft']}
          label="Forward and turn left"
          icon={forwardIcon}
          diagonal
        />
        <Control
          runtime={runtime}
          actions={['forward']}
          label="Move forward"
          icon={forwardIcon}
        />
        <Control
          runtime={runtime}
          actions={['forward', 'turnRight']}
          label="Forward and turn right"
          icon={forwardIcon}
          diagonal
        />
        <Control
          runtime={runtime}
          actions={['turnLeft']}
          label="Turn left"
          icon={turnLeftIcon}
        />
        <span className="control-hint">
          Move
          <br />W A D
        </span>
        <Control
          runtime={runtime}
          actions={['turnRight']}
          label="Turn right"
          icon={turnRightIcon}
        />
      </div>
      <div className="weapons controls" aria-label="Attack controls">
        <span />
        <Control
          runtime={runtime}
          actions={['front']}
          label="Fire forward"
          icon={frontIcon}
        />
        <span />
        <Control
          runtime={runtime}
          actions={['left']}
          label="Fire left broadside"
          icon={leftIcon}
        />
        <span className="control-hint">
          Fire
          <br />Q Space E
        </span>
        <Control
          runtime={runtime}
          actions={['right']}
          label="Fire right broadside"
          icon={rightIcon}
        />
      </div>
      {hud.state === 'reflowing' ? (
        <div className="reflow-notice" role="status">
          Adjusting arena…
        </div>
      ) : null}
      {hud.state === 'ending' ? (
        <div
          className={'ending-overlay ' + runtime.simulation.endReason}
          role="status"
        >
          {runtime.simulation.endReason === 'death' ? 'Defeated' : 'Time up'}
        </div>
      ) : null}
      {hud.audioError ? (
        <p className="sound-notice" role="status">
          {hud.audioError}{' '}
          <button
            className="text-button"
            onClick={() => runtime.recoverSound()}
          >
            Retry sound
          </button>
        </p>
      ) : null}
      <p className="sr-only" role="status">
        {hud.state === 'paused'
          ? hud.reason
          : hud.state === 'running'
            ? 'Battle running'
            : ''}
      </p>
      {hud.state === 'paused' && !confirm && !editingOptions ? (
        <Dialog title="Paused" onCancel={() => runtime.resume()}>
          <p>{hud.reason === 'Paused' ? 'Ready when you are.' : hud.reason}</p>
          <div className="stack">
            <button
              className="primary"
              disabled={!hud.rendererAvailable}
              onClick={() => runtime.resume()}
            >
              Resume
            </button>
            <button className="primary" onClick={() => setEditingOptions(true)}>
              Options
            </button>
            <button className="primary" onClick={() => setConfirm(true)}>
              Main Menu
            </button>
          </div>
        </Dialog>
      ) : null}
      {editingOptions ? (
        <Dialog
          title="Battle options"
          onCancel={() => setEditingOptions(false)}
        >
          <p>Changes apply to your next match.</p>
          {options(() => setEditingOptions(false))}
        </Dialog>
      ) : null}
      {confirm ? (
        <Dialog title="Leave this match?" onCancel={() => setConfirm(false)}>
          <p>This match will not be added to Ranking or Match History.</p>
          <div className="stack">
            <button className="primary" onClick={() => setConfirm(false)}>
              Keep playing
            </button>
            <button className="secondary" onClick={onExit}>
              Leave match
            </button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
export function GameScreen({
  session,
  audio,
  reducedMotion,
  onExit,
  onFinish,
  onCompleted,
  options,
  preferences,
}: {
  session: MatchSession;
  audio: AudioService;
  reducedMotion: boolean;
  onExit: () => void;
  onFinish: (result: CompletedLocalMatch) => void;
  onCompleted: (result: CompletedLocalMatch) => void;
  options: (close: () => void) => ReactNode;
  preferences: Settings;
}) {
  const host = useRef<HTMLDivElement>(null);
  const motion = useRef(reducedMotion);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [stick, setStick] = useState<{
    x: number;
    y: number;
    dx: number;
    dy: number;
  } | null>(null);
  const clearStick = () => {
    if (pointer.current) runtime?.input.release('stick:' + pointer.current.id);
    pointer.current = null;
    setStick(null);
  };
  useEffect(() => {
    if (!runtime) return;
    const clear = () => {
      if (runtime.getSnapshot().state !== 'running') {
        if (pointer.current)
          runtime.input.release('stick:' + pointer.current.id);
        pointer.current = null;
        setStick(null);
      }
    };
    const unsubscribe = runtime.subscribe(clear);
    return unsubscribe;
  }, [runtime]);
  const [progress, setProgress] = useState(0),
    [error, setError] = useState<{ message: string; reload: boolean } | null>(
      null,
    ),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    motion.current = reducedMotion;
    runtime?.setReducedMotion(reducedMotion);
  }, [reducedMotion, runtime]);
  useEffect(() => {
    let obsolete = false,
      owned: GameRuntime | undefined;
    const element = host.current;
    if (!element) return;
    void loadGameAssets((value) => {
      if (!obsolete) setProgress(value);
    })
      .then(async (assets) => {
        if (obsolete) return;
        owned = new GameRuntime(
          element,
          session,
          assets,
          audio,
          motion.current,
          onFinish,
          onCompleted,
        );
        await owned.init();
        if (obsolete) {
          owned.dispose();
          return;
        }
        setRuntime(owned);
        element.focus();
        const accepted = owned;
        window.pirateBattle = {
          observe: (includeFrames) => accepted.observe(includeFrames),
          advance: (milliseconds) => accepted.advance(milliseconds),
        };
      })
      .catch(() => {
        owned?.dispose();
        if (!obsolete)
          setError({
            message: owned
              ? 'The graphics renderer could not start. Try again reloads this page.'
              : 'Ships or islands could not load. Check your connection and try again.',
            reload: Boolean(owned),
          });
      });
    return () => {
      obsolete = true;
      if (owned && window.pirateBattle?.observe().matchId === session.id)
        delete window.pirateBattle;
      owned?.dispose();
    };
  }, [session, audio, onFinish, onCompleted, attempt]);
  return (
    <main
      className="game-shell"
      data-touch={navigator.maxTouchPoints > 0}
      data-mirror={preferences.mirrorControls}
      data-reduced={reducedMotion}
    >
      <img className="battle-brand" src={logoUrl} alt="Jungle Gaming" />
      <div
        ref={host}
        className="arena-viewport"
        tabIndex={0}
        aria-label="Battle arena. W to move, A and D to turn. Space, Q and E to fire. Escape to pause."
        onPointerDown={(event) => {
          if (
            !runtime ||
            runtime.getSnapshot().state !== 'running' ||
            pointer.current ||
            event.pointerType === 'mouse'
          )
            return;
          const hud = event.currentTarget.parentElement?.querySelectorAll(
            '.battle-hud, .battle-hud .captain',
          );
          if (
            hud &&
            [...hud].some((element) => {
              const bounds = element.getBoundingClientRect();
              return (
                event.clientX >= bounds.left &&
                event.clientX <= bounds.right &&
                event.clientY >= bounds.top &&
                event.clientY <= bounds.bottom
              );
            })
          )
            return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          const bounds = event.currentTarget.getBoundingClientRect();
          pointer.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
          setStick({
            x: Math.max(
              48,
              Math.min(bounds.width - 48, event.clientX - bounds.left),
            ),
            y: Math.max(
              48,
              Math.min(bounds.height - 48, event.clientY - bounds.top),
            ),
            dx: 0,
            dy: 0,
          });
        }}
        onPointerMove={(event) => {
          if (
            !runtime ||
            !pointer.current ||
            pointer.current.id !== event.pointerId
          )
            return;
          const dx = (event.clientX - pointer.current.x) / 48,
            dy = (event.clientY - pointer.current.y) / 48;
          const length = Math.max(1, Math.hypot(dx, dy));
          runtime.steer(
            'stick:' + event.pointerId,
            dx / length,
            dy / length,
            preferences.controlMode,
          );
          setStick((value) =>
            value
              ? { ...value, dx: (dx / length) * 26, dy: (dy / length) * 26 }
              : null,
          );
        }}
        onPointerUp={(event) => {
          if (pointer.current?.id === event.pointerId) clearStick();
        }}
        onPointerCancel={(event) => {
          if (pointer.current?.id === event.pointerId) clearStick();
        }}
        onLostPointerCapture={(event) => {
          if (pointer.current?.id === event.pointerId) clearStick();
        }}
      />
      {stick ? (
        <div
          className="virtual-stick"
          aria-hidden="true"
          style={{ left: stick.x - 48, top: stick.y - 48 }}
        >
          <div
            className="virtual-stick-knob"
            style={{ transform: `translate(${stick.dx}px, ${stick.dy}px)` }}
          />
        </div>
      ) : runtime && navigator.maxTouchPoints > 0 ? (
        <div className="stick-hint">
          Touch &amp; drag
          <br />
          to steer
        </div>
      ) : null}
      {runtime ? (
        <Battle runtime={runtime} onExit={onExit} options={options} />
      ) : (
        <section className="wood-panel loading-panel" aria-live="polite">
          <h2>{error ? 'The arena could not load' : 'Preparing the battle'}</h2>
          {error ? (
            <>
              <p role="alert">{error.message}</p>
              <div className="stack">
                <button
                  className="primary"
                  onClick={() => {
                    if (error.reload) {
                      location.reload();
                      return;
                    }
                    setError(null);
                    setProgress(0);
                    setAttempt((value) => value + 1);
                  }}
                >
                  Try again
                </button>
                <button className="secondary" onClick={onExit}>
                  Main Menu
                </button>
              </div>
            </>
          ) : (
            <>
              <progress
                max={1}
                value={progress}
                aria-label="Loading arena assets"
              />
              <p>Loading ships and islands… {Math.round(progress * 100)}%</p>
              <button className="secondary" onClick={onExit}>
                Main Menu
              </button>
            </>
          )}
        </section>
      )}
    </main>
  );
}
