import {
  Container,
  Graphics,
  Sprite,
  TilingSprite,
  type Texture,
} from 'pixi.js';
import type { GameAssets } from './assets';
import { worldToView, type ViewTransform } from './reflow';
import type { Ship, Simulation, CombatEvent, MatchSession } from './simulation';

type ShipView = {
  sprite: Sprite;
  bar: Container;
  fill: Sprite;
  mask: Graphics;
  health: number;
  flashUntil: number;
};
type Effect = {
  sprite: Sprite;
  born: number;
  duration: number;
  kind: CombatEvent['kind'];
};
export class BattleScene {
  setReducedMotion(value: boolean) {
    this.reduced = value;
  }
  readonly world = new Container();
  readonly overlays = new Container();
  private ships = new Map<number, ShipView>();
  private balls = new Map<number, Sprite>();
  private effects: Effect[] = [];
  private assets: GameAssets;
  private reduced: boolean;
  constructor(session: MatchSession, assets: GameAssets, reduced: boolean) {
    this.assets = assets;
    this.reduced = reduced;
    const water = new TilingSprite({
      texture: assets.water,
      width: session.config.level.width,
      height: session.config.level.height,
    });
    water.tileScale.set(2.4);
    water.tint = 0xcfeff4;
    this.world.addChild(water);
    const worldClip = new Graphics()
      .rect(0, 0, session.config.level.width, session.config.level.height)
      .fill(0xffffff);
    this.world.addChild(worldClip);
    this.world.mask = worldClip;
    // Both shores and their masks share the collision geometry. Interior art
    // repeats at a uniform scale instead of stretching the painted texture.
    for (const [texture, inset, tint] of [
      [assets.sand, 0, 0xdbdbdc],
      [assets.grass, 64, 0xa7c4e2],
    ] as const) {
      const ground = new Container();
      const tileWidth = texture.width * 1.2,
        tileHeight = texture.height * 1.2;
      // Mirrored adjacent cells share edge pixels, avoiding visible atlas seams.
      for (let row = 0; row * tileHeight < session.config.level.height; row++) {
        for (let col = 0; col * tileWidth < session.config.level.width; col++) {
          const tile = new Sprite(texture);
          tile.scale.set(col % 2 ? -1.2 : 1.2, row % 2 ? -1.2 : 1.2);
          tile.position.set(
            (col + (col % 2)) * tileWidth,
            (row + (row % 2)) * tileHeight,
          );
          tile.tint = tint;
          ground.addChild(tile);
        }
      }
      const mask = new Graphics();
      if (inset === 0) {
        for (const island of session.config.level.islands)
          mask
            .roundRect(
              island.x,
              island.y,
              island.width,
              island.height,
              island.radius,
            )
            .fill(0xffffff);
      } else {
        // Erode the union rather than each region: connected shores have no
        // artificial beach strip at an internal join. Merge rows into spans.
        const inside = (x: number, y: number) =>
          session.config.level.islands.some((island) => {
            const cx = Math.max(
              island.x + island.radius,
              Math.min(island.x + island.width - island.radius, x),
            );
            const cy = Math.max(
              island.y + island.radius,
              Math.min(island.y + island.height - island.radius, y),
            );
            return (x - cx) ** 2 + (y - cy) ** 2 <= island.radius ** 2;
          });
        const offsets = Array.from({ length: 64 }, (_, i) => ({
          x: Math.cos((i * Math.PI) / 32) * inset,
          y: Math.sin((i * Math.PI) / 32) * inset,
        }));
        const green = (x: number, y: number) =>
          inside(x, y) &&
          offsets.every((offset) => inside(x + offset.x, y + offset.y));
        for (let y = 0; y < session.config.level.height; y += 4) {
          let start: number | null = null;
          for (let x = 0; x <= session.config.level.width; x += 4) {
            const present =
              x < session.config.level.width && green(x + 2, y + 2);
            if (present && start === null) start = x;
            if (!present && start !== null) {
              mask.rect(start, y, x - start, 4).fill(0xffffff);
              start = null;
            }
          }
        }
      }
      this.world.addChild(ground, mask);
      ground.mask = mask;
    }
    if (session.config.level.version === 'reference-v2') {
      const decoration = (name: string, x: number, y: number, size = 64) => {
        const texture = assets.terrain.get(name);
        if (!texture) return;
        const sprite = new Sprite(texture);
        sprite.position.set(x, y);
        sprite.width = size;
        sprite.height = size;
        this.world.addChild(sprite);
      };
      for (const x of [56, 120, 184]) decoration('horizontal', x, 8);
      decoration('horizontal-cannon', 128, 8);
      for (const y of [32, 80]) decoration('vertical', 216, y);
      for (const x of [240, 304, 368]) decoration('horizontal', x, 80);
      decoration('gate', 292, 80);
      decoration('vertical', 384, -56);
      decoration('vertical-cannon', 384, 8);
      decoration('vertical', 384, 72);
      for (const [x, y] of [
        [48, 0],
        [208, 0],
        [208, 80],
        [368, 80],
      ])
        decoration('tower', x ?? 0, y ?? 0, 72);
      decoration('palm', 128, 156, 88);
      decoration('small-palm', 216, 252, 72);
      decoration('leaves', 448, 8, 80);
      decoration('small-palm', 936, 476, 64);
      decoration('palm', 924, 560, 88);
      decoration('moss-rock', 368, 164, 76);
      decoration('moss-stone', 768, 568, 88);
      decoration('rock', -8, 8, 72);
    }
  }
  private texture(name: string): Texture {
    const texture = this.assets.ships.get(name);
    if (!texture) throw new Error('Missing ship texture: ' + name);
    return texture;
  }
  update(simulation: Simulation, view: ViewTransform, alpha: number) {
    const time = simulation.elapsed;
    const current = [simulation.player, ...simulation.enemies.values()];
    const alive = new Set(current.map((ship) => ship.id));
    for (const [id, visual] of this.ships)
      if (!alive.has(id)) {
        visual.sprite.destroy();
        visual.bar.destroy({ children: true });
        this.ships.delete(id);
      }
    for (const ship of current) this.ship(ship, view, time, alpha);
    for (const [id, visual] of this.balls)
      if (!simulation.projectiles.has(id)) {
        visual.destroy();
        this.balls.delete(id);
      }
    for (const ball of simulation.projectiles.values()) {
      let sprite = this.balls.get(ball.id);
      if (!sprite) {
        sprite = new Sprite(this.texture('cannon_ball.png'));
        sprite.anchor.set(0.5);
        sprite.tint = ball.owner === 'player' ? 0xffffff : 0xffd6ba;
        this.balls.set(ball.id, sprite);
        this.world.addChild(sprite);
      }
      sprite.position.set(
        ball.previous.x + (ball.x - ball.previous.x) * alpha,
        ball.previous.y + (ball.y - ball.previous.y) * alpha,
      );
    }
    for (const event of simulation.events) {
      if (
        [
          'front',
          'broadside',
          'enemy-fire',
          'hit',
          'damage',
          'explosion',
          'water',
        ].includes(event.kind)
      )
        this.effect(event, time);
    }
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      if (!effect) continue;
      const t = (time - effect.born) / effect.duration;
      if (t >= 1) {
        effect.sprite.destroy();
        this.effects.splice(i, 1);
        continue;
      }
      const scale = effect.kind === 'explosion' ? 0.9 : 0.35;
      effect.sprite.scale.set(scale * (this.reduced ? 1 : 0.7 + t * 0.7));
      effect.sprite.alpha = 1 - t;
      if (effect.kind === 'explosion')
        effect.sprite.texture = this.texture(
          t < 0.35
            ? 'explosion_1.png'
            : t < 0.7
              ? 'explosion_2.png'
              : 'explosion_3.png',
        );
    }
    this.world.pivot.set(
      simulation.session.config.level.width / 2,
      simulation.session.config.level.height / 2,
    );
    this.world.position.set(view.x, view.y);
    this.world.scale.set(view.scale);
    this.world.rotation = view.angle;
  }
  private ship(ship: Ship, view: ViewTransform, time: number, alpha: number) {
    const ratio = ship.health / ship.maxHealth;
    const names =
      ship.kind === 'player'
        ? ['ship_2.png', 'ship_14.png', 'ship_20.png']
        : ship.kind === 'chaser'
          ? ['ship_16.png', 'ship_9.png', 'ship_3.png']
          : ['ship_17.png', 'ship_11.png', 'ship_23.png'];
    const name = names[ratio > 0.66 ? 0 : ratio > 0.33 ? 1 : 2] ?? 'ship_2.png';
    let visual = this.ships.get(ship.id);
    if (!visual) {
      const sprite = new Sprite(this.texture(name));
      sprite.scale.set(1.2);
      sprite.anchor.set(0.5);
      const bar = new Container(),
        frame = new Sprite(this.assets.health.frame),
        fill = new Sprite(this.assets.health.green),
        mask = new Graphics();
      fill.position.set(24, 12);
      bar.addChild(frame, fill, mask);
      fill.mask = mask;
      visual = { sprite, bar, fill, mask, health: -1, flashUntil: 0 };
      this.ships.set(ship.id, visual);
      this.world.addChild(sprite);
      this.overlays.addChild(bar);
    }
    if (ship.health < visual.health) visual.flashUntil = time + 0.12;
    visual.sprite.texture = this.texture(name);
    visual.sprite.tint = visual.flashUntil > time ? 0xffa896 : 0xffffff;
    const position = {
      x: ship.previous.x + (ship.x - ship.previous.x) * alpha,
      y: ship.previous.y + (ship.y - ship.previous.y) * alpha,
    };
    visual.sprite.position.set(position.x, position.y);
    visual.sprite.rotation =
      ship.previousHeading +
      (ship.heading - ship.previousHeading) * alpha +
      Math.PI;
    const warning = ship.activeAt > time;
    visual.sprite.alpha = warning ? 0.45 : 1;
    if (visual.health !== ship.health) {
      visual.fill.texture =
        ship.kind === 'player' && ratio > 0.5
          ? this.assets.health.green
          : this.assets.health.red;
      visual.mask
        .clear()
        .rect(24, 12, 112 * ratio, 15)
        .fill(0xffffff);
      visual.health = ship.health;
    }
    const projected = worldToView(position.x, position.y, view);
    const barScale = Math.max(0.2625, view.scale * 0.4),
      barWidth = 160 * barScale;
    visual.bar.scale.set(barScale);
    let barY = Math.max(2, projected.y - 88 * view.scale - 22 * barScale);
    // Keep an above-ship indicator clear of the desktop score/time controls.
    if (
      view.width >= 1000 &&
      view.height >= 650 &&
      Math.abs(view.angle) < 0.001 &&
      projected.x + barWidth / 2 > view.width - 500 &&
      barY < 96 &&
      barY + 40 * barScale > 28
    )
      barY = 2;
    visual.bar.position.set(
      Math.max(
        2,
        Math.min(view.width - barWidth - 2, projected.x - barWidth / 2),
      ),
      barY,
    );
    visual.bar.alpha = warning ? 0.6 : 1;
  }
  private effect(event: CombatEvent, time: number) {
    if (this.effects.length >= 64) {
      this.effects.shift()?.sprite.destroy();
    }
    const sprite = new Sprite(
      this.texture(
        event.kind === 'explosion' ? 'explosion_1.png' : 'explosion_3.png',
      ),
    );
    sprite.anchor.set(0.5);
    sprite.position.set(event.x, event.y);
    if (event.kind === 'water') sprite.tint = 0x9de2ef;
    this.world.addChild(sprite);
    this.effects.push({
      sprite,
      born: time,
      duration: event.kind === 'explosion' ? 0.45 : 0.12,
      kind: event.kind,
    });
  }
  observe() {
    return {
      ships: this.ships.size,
      projectiles: this.balls.size,
      effects: this.effects.length,
    };
  }
  dispose() {
    this.world.removeFromParent();
    this.overlays.removeFromParent();
    this.world.destroy({ children: true });
    this.overlays.destroy({ children: true });
    this.ships.clear();
    this.balls.clear();
    this.effects.length = 0;
  }
}
