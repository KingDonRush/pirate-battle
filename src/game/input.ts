import { EMPTY_INPUT, type InputSnapshot } from './simulation';
export type Action =
  'forward' | 'turnLeft' | 'turnRight' | 'front' | 'left' | 'right';
const KEYS: Record<string, Action> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyA: 'turnLeft',
  ArrowLeft: 'turnLeft',
  KeyD: 'turnRight',
  ArrowRight: 'turnRight',
  Space: 'front',
  KeyQ: 'left',
  KeyE: 'right',
};
export class InputController {
  private sources = new Map<string, readonly Action[]>();
  private analog = new Map<
    string,
    { throttle: number; turn: number; heading?: number }
  >();
  steer(
    id: string,
    value: { throttle: number; turn: number; heading?: number },
  ) {
    if (this.enabled) this.analog.set(id, value);
  }
  private enabled = false;
  private disposed = false;
  private pause: () => void;
  constructor(pause: () => void) {
    this.pause = pause;
    window.addEventListener('keydown', this.down);
    window.addEventListener('keyup', this.up);
  }
  private down = (event: KeyboardEvent) => {
    if (
      !this.enabled ||
      event.repeat ||
      (event.target instanceof HTMLElement &&
        event.target.closest('input,textarea,select,dialog,[contenteditable]'))
    )
      return;
    if (event.code === 'Escape') {
      event.preventDefault();
      this.pause();
      return;
    }
    if (
      event.code === 'Space' &&
      event.target instanceof HTMLElement &&
      event.target.closest('button')
    )
      return;
    const action = KEYS[event.code];
    if (action) {
      event.preventDefault();
      this.sources.set(event.code, [action]);
    }
  };
  private up = (event: KeyboardEvent) => {
    this.sources.delete(event.code);
  };
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }
  press(id: string, actions: readonly Action[]) {
    if (this.enabled) this.sources.set(id, actions);
  }
  release(id: string) {
    this.sources.delete(id);
    this.analog.delete(id);
  }
  clear() {
    this.sources.clear();
    this.analog.clear();
  }
  snapshot(): InputSnapshot {
    if (!this.enabled) return EMPTY_INPUT;
    const active = new Set([...this.sources.values()].flat());
    const analogue = [...this.analog.values()][0];
    const digitalTurn =
      Number(active.has('turnRight')) - Number(active.has('turnLeft'));
    const throttle = Math.max(
      Number(active.has('forward')),
      analogue?.throttle ?? 0,
    );
    return {
      forward: throttle > 0,
      throttle,
      ...(digitalTurn === 0 && analogue?.heading !== undefined
        ? { heading: analogue.heading }
        : {}),
      turn: Math.max(-1, Math.min(1, digitalTurn + (analogue?.turn ?? 0))),
      front: active.has('front'),
      left: active.has('left'),
      right: active.has('right'),
    };
  }
  observe() {
    return {
      listeners: this.disposed ? 0 : 2,
      sources: this.sources.size + this.analog.size,
    };
  }
  dispose() {
    this.disposed = true;
    this.enabled = false;
    this.clear();
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
  }
}
