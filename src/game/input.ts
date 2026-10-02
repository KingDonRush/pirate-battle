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
  private enabled = false;
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
        event.target.closest('input,textarea,select,button,[contenteditable]'))
    )
      return;
    if (event.code === 'Escape') {
      event.preventDefault();
      this.pause();
      return;
    }
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
  }
  clear() {
    this.sources.clear();
  }
  snapshot(): InputSnapshot {
    if (!this.enabled) return EMPTY_INPUT;
    const active = new Set([...this.sources.values()].flat());
    return {
      forward: active.has('forward'),
      turn: Number(active.has('turnRight')) - Number(active.has('turnLeft')),
      front: active.has('front'),
      left: active.has('left'),
      right: active.has('right'),
    };
  }
  dispose() {
    this.clear();
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
  }
}
