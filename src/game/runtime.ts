import {
  Application,
  Container,
  Graphics,
  Sprite,
  TilingSprite,
  UPDATE_PRIORITY,
} from 'pixi.js';
import type { GameAssets } from './assets';
import type { AudioService } from './audio';
import { InputController } from './input';
import { ReflowCoordinator, worldToView, type ViewTransform } from './reflow';
import { Simulation, STEP, type MatchSession } from './simulation';

export type HudSnapshot = Readonly<{
  state: 'loading' | 'running' | 'reflowing' | 'paused' | 'finished';
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
export class GameRuntime {
  readonly input: InputController;
  readonly simulation: Simulation;
  private application = new Application();
  private world = new Container();
  private overlays = new Container();
  private player: Sprite;
  private healthBar = new Graphics();
  private reflow: ReflowCoordinator;
  private observer: ResizeObserver;
  private disposed = false;
  private initialized = false;
  private pausedReason: string | null = null;
  private accumulator = 0;
  private finishing = false;
  private lastNow = 0;
  private subscribers = new Set<() => void>();
  private hud: HudSnapshot;
  private view: ViewTransform | null = null;
  private frames: number[] = [];
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
    this.hud = {
      state: 'loading',
      health: 100,
      score: 0,
      remaining: session.config.duration,
      reason: null,
      reflowRevision: 0,
    };
    this.reflow = new ReflowCoordinator(
      reducedMotion,
      () => this.freeze(),
      () => this.ready(),
    );
    const water = new TilingSprite({
      texture: assets.water,
      width: session.config.level.width,
      height: session.config.level.height,
    });
    this.world.addChild(water);
    for (const island of session.config.level.islands) {
      const sprite = new Sprite(assets.island);
      sprite.position.set(island.x, island.y);
      sprite.width = island.width;
      sprite.height = island.height;
      this.world.addChild(sprite);
    }
    const texture = assets.ships.get('ship_2.png');
    if (!texture) throw new Error('The player texture is unavailable.');
    this.player = new Sprite(texture);
    this.player.anchor.set(0.5);
    this.world.addChild(this.player);
    this.healthBar
      .roundRect(0, 0, 42, 7, 3)
      .fill(0x142b35)
      .stroke({ color: 0xcba253, width: 1 });
    this.healthBar.roundRect(2, 2, 38, 3, 1).fill(0x6fce7d);
    this.overlays.addChild(this.healthBar);
    this.application.stage.addChild(this.world, this.overlays);
    this.observer = new ResizeObserver(this.measure);
  }
  async init() {
    try {
      await this.application.init({
        background: 0x142b35,
        preference: 'webgl',
        autoDensity: true,
        resolution: Math.min(devicePixelRatio, 2),
        autoStart: false,
        sharedTicker: false,
        width: Math.max(1, this.host.clientWidth),
        height: Math.max(1, this.host.clientHeight),
      });
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
      this.observer.observe(this.host);
      window.addEventListener('blur', this.blur);
      document.addEventListener('visibilitychange', this.visibility);
      window.visualViewport?.addEventListener('resize', this.measure);
      window.addEventListener('resize', this.measure);
      void this.audio.begin(this.session.id);
      this.measure();
      this.application.start();
    } catch (error) {
      this.dispose();
      if (!this.world.destroyed) {
        this.world.destroy({ children: true });
        this.overlays.destroy({ children: true });
      }
      throw error;
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
      next.state !== this.hud.state ||
      next.health !== this.hud.health ||
      next.score !== this.hud.score ||
      next.remaining !== this.hud.remaining ||
      next.reason !== this.hud.reason ||
      next.reflowRevision !== this.hud.reflowRevision
    ) {
      this.hud = next;
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
      Math.min(devicePixelRatio, 2),
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
  resume() {
    if (this.disposed || document.hidden || this.simulation.endReason) return;
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
  private frame = () => {
    if (this.disposed) return;
    const now = performance.now(),
      elapsed = this.lastNow === 0 ? 0 : now - this.lastNow;
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
    this.world.pivot.set(
      this.session.config.level.width / 2,
      this.session.config.level.height / 2,
    );
    this.world.position.set(this.view.x, this.view.y);
    this.world.scale.set(this.view.scale);
    this.world.rotation = this.view.angle;
    this.player.position.set(
      this.simulation.player.x,
      this.simulation.player.y,
    );
    this.player.rotation = this.simulation.player.heading + Math.PI;
    const position = worldToView(
      this.simulation.player.x,
      this.simulation.player.y,
      this.view,
    );
    const top = position.y - 66 * this.view.scale - 9;
    this.healthBar.position.set(
      Math.max(2, Math.min(this.view.width - 44, position.x - 21)),
      Math.max(2, top),
    );
    this.application.render();
    this.reflow.afterRender(now, this.host.clientWidth, this.host.clientHeight);
    this.publish();
    if (this.simulation.endReason && !this.finishing) {
      this.finishing = true;
      this.freeze();
      this.application.stop();
      this.finished({
        session: this.session,
        score: this.simulation.score,
        duration: this.simulation.elapsed,
        reason: this.simulation.endReason,
        date: new Date().toISOString(),
      });
    }
    if (this.pausedReason && !this.reflow.active) this.application.stop();
  };
  observe() {
    return {
      ...this.simulation.observe(),
      hud: this.hud,
      view: this.view,
      input: this.input.snapshot(),
      resources: {
        applications: liveApplications,
        listeners: this.subscribers.size,
        audio: this.audio.observe(),
      },
      frames: this.frames.slice(-12000),
    };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.observer.disconnect();
    this.input.dispose();
    this.audio.stop(this.session.id);
    window.removeEventListener('blur', this.blur);
    document.removeEventListener('visibilitychange', this.visibility);
    window.visualViewport?.removeEventListener('resize', this.measure);
    window.removeEventListener('resize', this.measure);
    this.subscribers.clear();
    if (this.initialized) this.destroyApplication();
  }
  private destroyApplication() {
    this.application.ticker.remove(this.frame);
    this.application.destroy(
      { removeView: true, releaseGlobalResources: liveApplications === 1 },
      { children: true },
    );
    liveApplications--;
    this.initialized = false;
  }
}
