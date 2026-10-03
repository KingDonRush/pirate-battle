import { Application, UPDATE_PRIORITY } from 'pixi.js';
import type { GameAssets } from './assets';
import type { AudioService } from './audio';
import { InputController } from './input';
import { ReflowCoordinator, type ViewTransform } from './reflow';
import { Simulation, STEP, type MatchSession } from './simulation';
import { BattleScene } from './rendering';

export type HudSnapshot = Readonly<{
  state: 'loading' | 'running' | 'reflowing' | 'paused' | 'finished';
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
  private pausedReason: string | null = null;
  private accumulator = 0;
  private finishing = false;
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
  constructor(
    host: HTMLElement,
    session: MatchSession,
    assets: GameAssets,
    audio: AudioService,
    reducedMotion: boolean,
    finished: (result: CompletedLocalMatch) => void,
  ) {
    this.host = host;
    this.session = session;
    this.audio = audio;
    this.finished = finished;
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
    );
    this.audioOwner = session.id + ':' + ++mountSequence;
    this.scene = new BattleScene(session, assets, reducedMotion);
    this.sharedTextureSources = new Set([
      assets.water.source,
      assets.health.frame.source,
      ...[...assets.ships.values()].map((texture) => texture.source),
    ]).size;
    this.application.stage.addChild(this.scene.world, this.scene.overlays);
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
      this.scene.prepareBackground(
        this.application.renderer,
        this.session.config.level.width,
        this.session.config.level.height,
      );
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
      ? 'finished'
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
    this.reflow.request(
      width,
      height,
      window.innerWidth < window.innerHeight,
      now,
    );
    this.publish();
    this.application.start();
  };
  private freeze() {
    this.input.setEnabled(false);
    this.audio.pause();
    this.accumulator = 0;
    this.lastNow = 0;
  }
  private ready() {
    if (this.disposed) return;
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
    this.pause(
      'Graphics were interrupted. Waiting for the renderer to recover.',
    );
    this.application.stop();
  };
  private contextRestored = () => {
    if (this.disposed) return;
    this.scene.prepareBackground(
      this.application.renderer,
      this.session.config.level.width,
      this.session.config.level.height,
    );
    this.rendererAvailable = true;
    this.pausedReason = 'Graphics recovered. Resume when you are ready.';
    this.measure();
    this.publish();
  };
  private blur = () => this.pause('Paused because the window lost focus.');
  private visibility = () => {
    if (document.hidden) this.pause('Paused because the tab was hidden.');
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
        (this.manualClock ? 0 : this.lastNow === 0 ? 0 : now - this.lastNow);
    this.lastNow = now;
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
    );
    const counts = this.scene.observe();
    for (const key of ['ships', 'projectiles', 'effects'] as const)
      this.peaks[key] = Math.max(this.peaks[key], counts[key]);
    for (const event of this.simulation.events)
      this.audio.effect(event.kind, this.audioOwner);
    this.simulation.events.length = 0;
    try {
      this.application.render();
    } catch {
      this.rendererAvailable = false;
      this.pause('The arena could not render. Leave this match and try again.');
      this.application.stop();
      this.complete();
      return;
    }
    this.reflow.afterRender(now, this.host.clientWidth, this.host.clientHeight);
    this.publish();
    this.complete();
    if ((this.pausedReason || this.manualClock) && !this.reflow.active)
      this.application.stop();
  }
  private complete() {
    if (this.simulation.endReason && !this.finishing) {
      this.finishing = true;
      this.freeze();
      this.application.stop();
      this.audio.stop(this.audioOwner);
      this.finished({
        session: this.session,
        score: this.simulation.score,
        duration: this.simulation.elapsed,
        reason: this.simulation.endReason,
        date: new Date().toISOString(),
      });
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
            ? 5 + Number(Boolean(window.visualViewport))
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
    window.removeEventListener('blur', this.blur);
    document.removeEventListener('visibilitychange', this.visibility);
    window.visualViewport?.removeEventListener('resize', this.measure);
    window.removeEventListener('resize', this.measure);
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
