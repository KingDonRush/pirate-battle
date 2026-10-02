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
  bar: Graphics;
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
    water.tint = 0x9dcbd5;
    this.world.addChild(water);
    for (const island of session.config.level.islands) {
      const sprite = new Sprite(assets.island);
      sprite.position.set(island.x, island.y);
      sprite.width = island.width;
      sprite.height = island.height;
      this.world.addChild(sprite);
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
        visual.bar.destroy();
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
      sprite.anchor.set(0.5);
      const bar = new Graphics();
      visual = { sprite, bar, health: -1, flashUntil: 0 };
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
    if (
      visual.health !== ship.health ||
      visual.bar.context.instructions.length === 0
    ) {
      visual.bar
        .clear()
        .roundRect(0, 0, 42, 7, 3)
        .fill(0x142b35)
        .stroke({
          color: ship.kind === 'player' ? 0xffedb8 : 0xcba253,
          width: 1,
        });
      if (ratio > 0)
        visual.bar
          .roundRect(2, 2, 38 * ratio, 3, 1)
          .fill(ratio > 0.5 ? 0x76d995 : ratio > 0.25 ? 0xffd26d : 0xff8872);
      if (ship.kind === 'chaser')
        visual.bar
          .moveTo(20, 10)
          .lineTo(23, 14)
          .lineTo(17, 14)
          .closePath()
          .fill(0xf9ac99);
      if (ship.kind === 'shooter') visual.bar.circle(21, 12, 2).fill(0x93cdff);
      visual.health = ship.health;
    }
    const projected = worldToView(position.x, position.y, view);
    visual.bar.position.set(
      Math.max(2, Math.min(view.width - 44, projected.x - 21)),
      Math.max(2, projected.y - 62 * view.scale - 14),
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
