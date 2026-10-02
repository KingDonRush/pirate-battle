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
import { GameRuntime, type CompletedLocalMatch } from '../game/runtime';
import type { MatchSession } from '../game/simulation';
import { Dialog } from './Dialog';
import forwardIcon from '../../assets/png/retina/ui/controls/icon_forward.png?url';
import turnLeftIcon from '../../assets/png/retina/ui/controls/icon_turn_left.png?url';
import turnRightIcon from '../../assets/png/retina/ui/controls/icon_turn_right.png?url';
import frontIcon from '../../assets/png/retina/ui/controls/icon_fire_front.png?url';
import leftIcon from '../../assets/png/retina/ui/controls/icon_fire_left.png?url';
import rightIcon from '../../assets/png/retina/ui/controls/icon_fire_right.png?url';
declare global {
  interface Window {
    pirateBattle?: {
      observe: () => ReturnType<GameRuntime['observe']>;
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
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer);
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
        runtime.input.press(id, actions);
        timers.current.push(setTimeout(() => runtime.input.release(id), 120));
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
          aria-label={'Health: ' + hud.health + ' of 100'}
        >
          <span aria-hidden="true">♥</span>
          <strong>{hud.health} / 100</strong>
        </div>
        <div className="hud-counter" aria-label={'Score: ' + hud.score}>
          <span>Score</span>
          <strong>{hud.score}</strong>
        </div>
        <div
          className="hud-counter"
          aria-label={
            'Time remaining: ' + mins + ' minutes ' + secs + ' seconds'
          }
        >
          <span>Time</span>
          <strong>
            {mins}:{secs}
          </strong>
        </div>
        <button className="small-button" onClick={() => runtime.pause()}>
          Pause
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
      <p className="sr-only" role="status">
        {hud.state === 'paused'
          ? hud.reason
          : hud.state === 'running'
            ? 'Battle running'
            : ''}
      </p>
      {hud.state === 'paused' && !confirm && !editingOptions ? (
        <Dialog title="Paused">
          <p>
            {hud.reason === 'Paused'
              ? 'Resume when you are ready.'
              : hud.reason}
          </p>
          <div className="stack">
            <button className="primary" onClick={() => runtime.resume()}>
              Resume
            </button>
            <button
              className="secondary"
              onClick={() => setEditingOptions(true)}
            >
              Options
            </button>
            <button className="secondary" onClick={() => setConfirm(true)}>
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
  options,
}: {
  session: MatchSession;
  audio: AudioService;
  reducedMotion: boolean;
  onExit: () => void;
  onFinish: (result: CompletedLocalMatch) => void;
  options: (close: () => void) => ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const motion = useRef(reducedMotion);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [progress, setProgress] = useState(0),
    [error, setError] = useState<string | null>(null),
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
          observe: () => accepted.observe(),
          advance: (milliseconds) => accepted.advance(milliseconds),
        };
      })
      .catch((cause: unknown) => {
        owned?.dispose();
        if (!obsolete)
          setError(
            cause instanceof Error
              ? cause.message
              : 'The arena could not load.',
          );
      });
    return () => {
      obsolete = true;
      if (owned && window.pirateBattle?.observe().matchId === session.id)
        delete window.pirateBattle;
      owned?.dispose();
    };
  }, [session, audio, onFinish, attempt]);
  return (
    <main className="game-shell">
      <div
        ref={host}
        className="arena-viewport"
        tabIndex={0}
        aria-label="Battle arena. W to move, A and D to turn. Space, Q and E to fire. Escape to pause."
      />
      {runtime ? (
        <Battle runtime={runtime} onExit={onExit} options={options} />
      ) : (
        <section className="wood-panel loading-panel" aria-live="polite">
          <h2>{error ? 'The arena could not load' : 'Preparing the battle'}</h2>
          {error ? (
            <>
              <p role="alert">{error}</p>
              <div className="stack">
                <button
                  className="primary"
                  onClick={() => {
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
