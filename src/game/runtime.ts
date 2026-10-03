import { Application, UPDATE_PRIORITY } from 'pixi.js';
import type { GameAssets } from './assets';
import type { Settings } from './config';
import type { AudioService } from './audio';
import { InputController } from './input';
import { ReflowCoordinator, type ViewTransform } from './reflow';
import { Simulation, STEP, type MatchSession } from './simulation';
import { BattleScene } from './rendering';

export type HudSnapshot = Readonly<{
  state: 'loading' | 'running' | 'reflowing' | 'paused' | 'ending' | 'finished';
  audioError: string | null;
  rendererAvailable: boolean;
  health: number;
  score: number;
  remaining: number;
  reason: string | null;
  reflowRevision: number;
}>;
export type CompletedLocalMatch = Readonly<{
  session: MatchSession;
  score: number;
  duration: number;
  reason: 'time' | 'death';
  date: string;
}>;
let liveApplications = 0;
let pendingApplications = 0;
let mountSequence = 0;
export class GameRuntime {
  setReducedMotion(value: boolean) {
    this.reducedMotion = value;
    this.reflow.setReducedMotion(value);
    this.scene.setReducedMotion(value);
  }
  readonly input: InputController;
  readonly simulation: Simulation;
  private application = new Application();
  private scene: BattleScene;
  private sharedTextureSources = 0;
  private audioOwner: string;
  private reflow: ReflowCoordinator;
  private observer: ResizeObserver;
  private disposed = false;
  private initialized = false;
  private rendererAvailable = true;
  private needsRendererCheck = false;
  private pausedReason: string | null = null;
  private accumulator = 0;
  private finishing = false;
  private endingElapsed = 0;
  private result: CompletedLocalMatch | null = null;
  private delivered = false;
  private reducedMotion: boolean;
  private lastNow = 0;
  private subscribers = new Set<() => void>();
  private hud: HudSnapshot;
  private view: ViewTransform | null = null;
  private frames: number[] = [];
  private peaks = { ships: 0, projectiles: 0, effects: 0 };
  private host: HTMLElement;
  readonly session: MatchSession;
  private audio: AudioService;
  private finished: (result: CompletedLocalMatch) => void;
  private completed: (result: CompletedLocalMatch) => void;
  constructor(
    host: HTMLElement,
    session: MatchSession,
    assets: GameAssets,
    audio: AudioService,
    reducedMotion: boolean,
    finished: (result: CompletedLocalMatch) => void,
    completed: (result: CompletedLocalMatch) => void,
  ) {
    this.host = host;
    this.session = session;
    this.audio = audio;
    this.finished = finished;
    this.completed = completed;
    this.reducedMotion = reducedMotion;
    this.simulation = new Simulation(session);
    this.input = new InputController(() => this.pause('Paused'));
    this.hud = Object.freeze({
      state: 'loading',
      audioError: null,
      rendererAvailable: true,
      health: 100,
      score: 0,
      remaining: session.config.duration,
      reason: null,
      reflowRevision: 0,
    });
    this.reflow = new ReflowCoordinator(
      reducedMotion,
      () => this.freeze(),
      () => this.ready(),
      session.config.level,
    );
    this.audioOwner = session.id + ':' + ++mountSequence;
    this.scene = new BattleScene(session, assets, reducedMotion);
    this.sharedTextureSources = new Set([
      assets.water.source,
      assets.island.source,
      assets.health.frame.source,
      ...[...assets.terrain.values()].map((texture) => texture.source),
      ...[...assets.ships.values()].map((texture) => texture.source),
    ]).size;
    this.application.stage.addChild(
      this.scene.ocean,
      this.scene.world,
      this.scene.overlays,
    );
    this.observer = new ResizeObserver(this.measure);
  }
  async init() {
    pendingApplications++;
    let pending = true;
    try {
      await this.application.init({
        background: 0x142b35,
        preference: 'webgl',
        autoDensity: true,
        resolution: devicePixelRatio,
        autoStart: false,
        sharedTicker: false,
        width: Math.max(1, this.host.clientWidth),
        height: Math.max(1, this.host.clientHeight),
      });
      pendingApplications--;
      pending = false;
      this.initialized = true;
      liveApplications++;
      if (this.disposed) {
        this.destroyApplication();
        return;
      }
      // Pixi registers this method with an explicit Application context.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.application.ticker.remove(this.application.render, this.application);
      this.application.ticker.add(
        this.frame,
        undefined,
        UPDATE_PRIORITY.NORMAL,
      );
      this.host.appendChild(this.application.canvas);
      this.application.canvas.addEventListener(
        'webglcontextlost',
        this.contextLost,
      );
      this.application.canvas.addEventListener(
        'webglcontextrestored',
        this.contextRestored,
      );
      this.observer.observe(this.host);
      window.addEventListener('blur', this.blur);
      document.addEventListener('visibilitychange', this.visibility);
      window.visualViewport?.addEventListener('resize', this.measure);
      window.addEventListener('resize', this.measure);
      screen.orientation?.addEventListener('change', this.measure);
      this.beginAudio();
      this.measure();
      this.application.start();
    } catch (error) {
      this.dispose();
      if (!this.initialized) this.scene.dispose();
      throw error;
    } finally {
      if (pending) pendingApplications--;
    }
  }
  subscribe = (listener: () => void) => {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  };
  getSnapshot = () => this.hud;
  private publish() {
    const state = this.simulation.endReason
      ? this.delivered
        ? 'finished'
        : 'ending'
      : this.pausedReason
        ? 'paused'
        : this.reflow.active
          ? 'reflowing'
          : 'running';
    const next: HudSnapshot = {
      state,
      audioError: this.audio.error,
      rendererAvailable: this.rendererAvailable,
      health: this.simulation.player.health,
      score: this.simulation.score,
      remaining: Math.max(
        0,
        Math.ceil(this.session.config.duration - this.simulation.elapsed),
      ),
      reason: this.pausedReason,
      reflowRevision: this.reflow.revision,
    };
    if (
      next.audioError !== this.hud.audioError ||
      next.rendererAvailable !== this.hud.rendererAvailable ||
      next.state !== this.hud.state ||
      next.health !== this.hud.health ||
      next.score !== this.hud.score ||
      next.remaining !== this.hud.remaining ||
      next.reason !== this.hud.reason ||
      next.reflowRevision !== this.hud.reflowRevision
    ) {
      this.hud = Object.freeze(next);
      for (const listener of this.subscribers) listener();
    }
  }
  private measure = () => {
    if (this.disposed || !this.initialized) return;
    const width = this.host.clientWidth,
      height = this.host.clientHeight,
      now = performance.now();
    this.application.renderer.resize(
      Math.max(1, width),
      Math.max(1, height),
      devicePixelRatio,
    );
    this.reflow.request(width, height, this.orientation(), now, [
      this.simulation.player,
      ...this.simulation.enemies.values(),
      ...this.simulation.projectiles.values(),
    ]);
    this.publish();
    this.application.start();
  };
  private orientation() {
    const orientation = screen.orientation;
    if (
      orientation &&
      /primary|secondary/.test(orientation.type) &&
      orientation.type.startsWith('portrait') ===
        this.host.clientWidth < this.host.clientHeight
    ) {
      const naturalPortrait =
        orientation.type.startsWith('portrait') ===
        (orientation.angle % 180 === 0);
      return (
        (naturalPortrait ? Math.PI / 2 : 0) -
        (orientation.angle * Math.PI) / 180
      );
    }
    return this.host.clientWidth < this.host.clientHeight ? Math.PI / 2 : 0;
  }
  steer(id: string, dx: number, dy: number, mode: Settings['controlMode']) {
    const magnitude = Math.min(1, Math.hypot(dx, dy));
    if (magnitude < 0.15) {
      this.input.release(id);
      return;
    }
    const throttle = (magnitude - 0.15) / 0.85;
    if (mode === 'direction')
      this.input.steer(id, {
        throttle,
        turn: 0,
        heading: Math.atan2(dx, -dy) - (this.view?.angle ?? 0),
      });
    else
      this.input.steer(id, {
        throttle: Math.max(0, -dy),
        turn: Math.max(-1, Math.min(1, dx)),
      });
  }
  private freeze() {
    this.input.setEnabled(false);
    if (!this.simulation.endReason) this.audio.pause();
    this.accumulator = 0;
    this.lastNow = 0;
  }
  private ready() {
    if (this.disposed) return;
    if (this.view) this.simulation.setArenaBounds(this.view.bounds);
    this.lastNow = 0;
    this.accumulator = 0;
    if (!this.pausedReason && !this.simulation.endReason) {
      this.input.setEnabled(true);
      this.audio.resume();
    }
    this.publish();
  }
  private contextLost = (event: Event) => {
    event.preventDefault();
    this.rendererAvailable = false;
    this.needsRendererCheck = false;
    if (this.simulation.endReason) {
      this.audio.cancelEnding(this.audioOwner);
      this.publish();
      // The terminal DOM presentation can finish without an available GPU.
      this.application.start();
      return;
    }
    this.pause(
      'Graphics were interrupted. Waiting for the renderer to recover.',
    );
    this.application.stop();
  };
  private contextRestored = () => {
    if (this.disposed) return;
    this.needsRendererCheck = true;
    this.pausedReason = 'Graphics recovered. Resume when you are ready.';
    this.measure();
    this.publish();
  };
  private blur = () => {
    if (this.simulation.endReason) this.audio.cancelEnding(this.audioOwner);
    else this.pause('Paused because the window lost focus.');
  };
  private visibility = () => {
    if (this.simulation.endReason) {
      if (document.hidden) this.audio.cancelEnding(this.audioOwner);
      else {
        this.measure();
      }
    } else if (document.hidden)
      this.pause('Paused because the tab was hidden.');
    else this.measure();
  };
  pause(reason = 'Paused') {
    if (this.disposed || this.simulation.endReason) return;
    this.pausedReason = reason;
    this.freeze();
    this.publish();
    if (!this.reflow.active) this.application.stop();
  }
  private beginAudio() {
    void this.audio
      .begin(this.audioOwner)
      .then(() => {
        if (!this.disposed) this.publish();
      })
      .catch(() => {
        if (!this.disposed) {
          this.audio.error = 'Sound is unavailable. You can keep playing.';
          this.publish();
        }
      });
  }
  recoverSound() {
    if (this.disposed || this.simulation.endReason) return;
    this.audio.unlock();
    this.beginAudio();
    if (this.pausedReason || this.reflow.active) this.audio.pause();
  }
  resume() {
    if (
      this.disposed ||
      document.hidden ||
      this.simulation.endReason ||
      !this.rendererAvailable
    )
      return;
    if (this.audio.error) this.recoverSound();
    this.pausedReason = null;
    this.lastNow = 0;
    this.accumulator = 0;
    this.input.clear();
    if (!this.reflow.active) {
      this.input.setEnabled(true);
      this.audio.resume();
    }
    this.publish();
    this.application.start();
  }
  private manualClock =
    new URLSearchParams(location.search).get('clock') === 'manual';
  advance(milliseconds: number) {
    if (!this.manualClock) throw new Error('Manual clock is not enabled.');
    if (
      !Number.isFinite(milliseconds) ||
      milliseconds < 0 ||
      milliseconds > 180000
    )
      throw new Error('Invalid clock advance.');
    for (
      let remaining = milliseconds;
      remaining > 0 && !this.disposed && !this.simulation.endReason;
      remaining -= Math.min(remaining, 100)
    )
      this.tick(Math.min(remaining, 100));
  }
  private frame = () => this.tick();
  private tick(forcedDelta?: number) {
    if (this.disposed) return;
    const now = performance.now(),
      elapsed =
        forcedDelta ??
        (this.manualClock && !this.finishing
          ? 0
          : this.lastNow === 0
            ? 0
            : now - this.lastNow);
    this.lastNow = now;
    if (this.finishing && !document.hidden)
      this.endingElapsed += Math.min(elapsed, 100) / 1000;
    if (
      !this.pausedReason &&
      !this.reflow.active &&
      !this.simulation.endReason
    ) {
      this.frames.push(elapsed);
      this.accumulator += Math.min(elapsed, 250) / 1000;
      const input = this.input.snapshot();
      this.audio.movement(input.forward);
      while (this.accumulator >= STEP && !this.simulation.endReason) {
        this.simulation.step(input);
        this.accumulator -= STEP;
      }
    }
    this.view = this.reflow.update(now);
    this.scene.update(
      this.simulation,
      this.view,
      this.reflow.active || this.pausedReason
        ? 1
        : Math.min(1, this.accumulator / STEP),
      this.endingElapsed,
    );
    const counts = this.scene.observe();
    for (const key of ['ships', 'projectiles', 'effects'] as const)
      this.peaks[key] = Math.max(this.peaks[key], counts[key]);
    for (const event of this.simulation.events)
      this.audio.effect(event.kind, this.audioOwner);
    this.simulation.events.length = 0;
    if (this.rendererAvailable || this.needsRendererCheck) {
      try {
        this.application.render();
        this.rendererAvailable = true;
        this.needsRendererCheck = false;
      } catch {
        this.rendererAvailable = false;
        this.needsRendererCheck = false;
        this.pause(
          'The arena could not render. Leave this match and try again.',
        );
        if (!this.simulation.endReason) this.application.stop();
      }
    }
    if (this.rendererAvailable)
      this.reflow.afterRender(
        now,
        this.host.clientWidth,
        this.host.clientHeight,
      );
    this.publish();
    this.complete();
    if (
      (this.pausedReason || this.manualClock) &&
      !this.reflow.active &&
      !this.finishing
    )
      this.application.stop();
  }
  private complete() {
    if (this.simulation.endReason && !this.finishing) {
      this.finishing = true;
      this.freeze();
      this.audio.ending(this.audioOwner, this.simulation.endReason);
      this.result = Object.freeze({
        session: this.session,
        score: this.simulation.score,
        duration: this.simulation.elapsed,
        reason: this.simulation.endReason,
        date: new Date().toISOString(),
      });
      this.completed(this.result);
      this.application.start();
      this.publish();
    }
    const duration = this.reducedMotion
      ? 0.2
      : this.simulation.endReason === 'death'
        ? 0.9
        : 0.45;
    if (this.result && !this.delivered && this.endingElapsed >= duration) {
      this.delivered = true;
      this.application.stop();
      this.publish();
      this.finished(this.result);
    }
  }
  observe(includeFrames = false) {
    return {
      ...this.simulation.observe(),
      hud: this.hud,
      view: this.view,
      input: this.input.snapshot(),
      resources: {
        applications: liveApplications,
        pendingApplications,
        browserListeners:
          this.input.observe().listeners +
          (this.initialized && !this.disposed
            ? 5 +
              Number(Boolean(window.visualViewport)) +
              Number(Boolean(screen.orientation))
            : 0),
        observers: Number(this.initialized && !this.disposed),
        ticker: Number(this.initialized && this.application.ticker.started),
        sharedTextureSources: this.sharedTextureSources,
        classNames: {
          runtime: this.constructor.name,
          scene: this.scene.constructor.name,
          application: this.application.constructor.name,
          ticker: this.initialized
            ? this.application.ticker.constructor.name
            : null,
        },
        renderer: this.initialized ? this.application.renderer.type : null,
        resolution: this.initialized
          ? this.application.renderer.resolution
          : null,
        scene: this.scene.observe(),
        listeners: this.subscribers.size,
        audio: this.audio.observe(),
      },
      peaks: { ...this.peaks },
      frames: includeFrames ? this.frames.slice() : [],
    };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.observer.disconnect();
    this.input.dispose();
    this.simulation.dispose();
    this.audio.stop(this.audioOwner);
    if (!this.delivered) this.audio.cancelEnding(this.audioOwner);
    window.removeEventListener('blur', this.blur);
    document.removeEventListener('visibilitychange', this.visibility);
    window.visualViewport?.removeEventListener('resize', this.measure);
    window.removeEventListener('resize', this.measure);
    screen.orientation?.removeEventListener('change', this.measure);
    this.subscribers.clear();
    if (this.initialized) this.destroyApplication();
  }
  private destroyApplication() {
    this.application.canvas.removeEventListener(
      'webglcontextlost',
      this.contextLost,
    );
    this.application.canvas.removeEventListener(
      'webglcontextrestored',
      this.contextRestored,
    );
    this.application.ticker.remove(this.frame);
    this.scene.dispose();
    this.application.destroy(
      {
        removeView: true,
        releaseGlobalResources:
          liveApplications === 1 && pendingApplications === 0,
      },
      { children: true },
    );
    liveApplications--;
    this.initialized = false;
  }
}
