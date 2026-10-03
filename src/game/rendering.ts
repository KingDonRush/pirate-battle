import {
  Container,
  Graphics,
  NineSliceSprite,
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
  name: string;
  flashUntil: number;
};
type Effect = {
  sprite: Sprite | Graphics;
  born: number;
  duration: number;
  kind: CombatEvent['kind'];
};
export const SHIP_FAMILIES = Object.freeze({
  player: ['ship_2.png', 'ship_8.png', 'ship_14.png'],
  chaser: ['ship_4.png', 'ship_10.png', 'ship_16.png'],
  shooter: ['ship_5.png', 'ship_11.png', 'ship_17.png'],
} as const);
export class BattleScene {
  setReducedMotion(value: boolean) {
    this.reduced = value;
  }
  readonly world = new Container();
  readonly overlays = new Container();
  readonly ocean: TilingSprite;
  private trails = new Graphics();
  private background = new Container();
  private ships = new Map<number, ShipView>();
  private balls = new Map<number, Sprite>();
  private effects: Effect[] = [];
  private assets: GameAssets;
  private reduced: boolean;
  constructor(session: MatchSession, assets: GameAssets, reduced: boolean) {
    this.assets = assets;
    this.reduced = reduced;
    this.ocean = new TilingSprite({
      texture: assets.water,
      width: 1,
      height: 1,
    });
    this.ocean.tint = 0xcfeff4;
    this.world.addChild(this.background, this.trails);
    for (const island of session.config.level.islands) {
      const shore = new Graphics()
        .roundRect(
          island.x - 18,
          island.y - 18,
          island.width + 36,
          island.height + 36,
          island.radius + 18,
        )
        .fill({ color: 0x9aefea, alpha: 0.4 });
      const foam = new Graphics()
        .roundRect(
          island.x - 5,
          island.y - 5,
          island.width + 10,
          island.height + 10,
          island.radius + 5,
        )
        .fill({ color: 0xecffed, alpha: 0.7 });
      this.background.addChild(shore, foam);
      // Preserve the supplied coast corners; extend only the centre and edges.
      // Repeating arbitrary atlas crops introduces visible sand/grass blocks.
      const ground = new NineSliceSprite({
        texture: assets.island,
        leftWidth: 64,
        rightWidth: 64,
        topHeight: 64,
        bottomHeight: 64,
        width: island.width,
        height: island.height,
      });
      ground.position.set(island.x, island.y);
      const coast = new Graphics()
        .roundRect(
          island.x,
          island.y,
          island.width,
          island.height,
          island.radius,
        )
        .fill(0xffffff);
      ground.mask = coast;
      this.background.addChild(ground, coast);
    }
    const decoration = (
      name: string,
      x: number,
      y: number,
      size = 64,
      angle = 0,
    ) => {
      const texture = assets.terrain.get(name);
      if (!texture) throw new Error('Missing terrain texture: ' + name);
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.position.set(x + size / 2, y + size / 2);
      sprite.width = size;
      sprite.height = size;
      sprite.rotation = angle;
      this.background.addChild(sprite);
    };
    // 64-unit connectors; tower faces are drawn last over aligned wall joins.
    for (const y of [64, 192])
      for (const x of [112, 176, 240])
        decoration(
          y === 192 && x === 176 ? 'gate-horizontal' : 'horizontal',
          x,
          y,
        );
    for (const x of [80, 272])
      for (const y of [96, 160])
        decoration(
          x === 272 && y === 96 ? 'vertical-cannon' : 'vertical',
          x,
          y,
        );
    for (const [x, y] of [
      [80, 64],
      [272, 64],
      [80, 192],
      [272, 192],
    ])
      decoration('tower', x!, y!);
    for (const [x, y, size] of [
      [40, 200, 72],
      [310, 245, 56],
      [912, 70, 76],
      [982, 130, 48],
      [178, 526, 64],
      [260, 540, 52],
      [850, 466, 88],
      [1000, 495, 64],
    ])
      decoration('palm', x!, y!, size);
    for (const [x, y, size] of [
      [915, 135, 48],
      [190, 510, 40],
      [965, 440, 64],
      [1060, 530, 44],
    ])
      decoration('moss-rock', x!, y!, size);
  }
  private texture(name: string): Texture {
    const texture = this.assets.ships.get(name);
    if (!texture) throw new Error('Missing ship texture: ' + name);
    return texture;
  }
  update(
    simulation: Simulation,
    view: ViewTransform,
    alpha: number,
    endingElapsed = 0,
  ) {
    const time = simulation.elapsed + endingElapsed;
    const current = [simulation.player, ...simulation.enemies.values()];
    const alive = new Set(current.map((ship) => ship.id));
    this.ocean.width = view.width;
    this.ocean.height = view.height;
    this.ocean.tileScale.set(2.4 * view.scale);
    this.ocean.tileRotation = view.angle;
    this.trails.clear();
    for (const [id, visual] of this.ships)
      if (!alive.has(id)) {
        visual.sprite.destroy();
        visual.bar.destroy({ children: true });
        this.ships.delete(id);
      }
    for (const ship of current) this.ship(ship, view, time, alpha);
    if (simulation.endReason === 'death') {
      const player = this.ships.get(simulation.player.id);
      if (player) player.sprite.alpha = Math.max(0, 1 - endingElapsed / 0.45);
    }
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
      if (!this.reduced) {
        const speed = Math.hypot(ball.vx, ball.vy),
          length = Math.min(
            50,
            speed *
              Math.min(0.1, Math.max(0, simulation.elapsed - ball.bornAt)),
          );
        const dx = ball.vx / speed,
          dy = ball.vy / speed;
        this.trails
          .poly([
            sprite.x - dy * 2.5,
            sprite.y + dx * 2.5,
            sprite.x - dx * length,
            sprite.y - dy * length,
            sprite.x + dy * 2.5,
            sprite.y - dx * 2.5,
          ])
          .fill({ color: 0xffffff, alpha: 0.7 });
      }
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
      const scale =
        effect.kind === 'explosion' ? 0.9 : effect.kind === 'water' ? 1 : 0.35;
      effect.sprite.scale.set(
        scale *
          (this.reduced ? 1 : 0.7 + t * (effect.kind === 'water' ? 2 : 0.7)),
      );
      effect.sprite.alpha = 1 - t;
      if (effect.kind === 'explosion' && effect.sprite instanceof Sprite)
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
    const names = SHIP_FAMILIES[ship.kind];
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
      visual = { sprite, bar, fill, mask, health: -1, name, flashUntil: 0 };
      this.ships.set(ship.id, visual);
      this.world.addChild(sprite);
      this.overlays.addChild(bar);
    }
    if (ship.health < visual.health) visual.flashUntil = time + 0.12;
    visual.sprite.texture = this.texture(name);
    visual.name = name;
    visual.sprite.tint = visual.flashUntil > time ? 0xfff6c2 : 0xffffff;
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
    visual.bar.visible = ship.health > 0;
  }
  private effect(event: CombatEvent, time: number) {
    if (this.effects.length >= 64) {
      this.effects.shift()?.sprite.destroy();
    }
    const sprite =
      event.kind === 'water'
        ? new Graphics()
            .circle(0, 0, 7)
            .stroke({ color: 0xf0ffff, width: 2.5 })
            .circle(0, 0, 3)
            .fill({ color: 0xe0ffff, alpha: 0.8 })
        : new Sprite(
            this.texture(
              event.kind === 'explosion'
                ? 'explosion_1.png'
                : 'explosion_3.png',
            ),
          );
    if (sprite instanceof Sprite) {
      sprite.anchor.set(0.5);
      if (event.kind === 'hit' || event.kind === 'damage')
        sprite.tint = 0xffe8aa;
    }
    sprite.position.set(event.x, event.y);
    this.world.addChild(sprite);
    this.effects.push({
      sprite,
      born: time,
      duration:
        event.kind === 'explosion'
          ? 0.45
          : event.kind === 'water'
            ? 0.25
            : 0.12,
      kind: event.kind,
    });
  }
  observe() {
    return {
      backgroundTextures: 0,
      shipAtlasUrl: this.assets.shipAtlasUrl,
      terrainObjects: this.background.children.length,
      shipTextures: Object.fromEntries(
        [...this.ships].map(([id, value]) => [id, value.name]),
      ),
      ships: this.ships.size,
      projectiles: this.balls.size,
      effects: this.effects.length,
      effectKinds: this.effects.map((effect) => effect.kind),
    };
  }
  dispose() {
    this.world.removeFromParent();
    this.overlays.removeFromParent();
    this.ocean.destroy();
    this.world.destroy({ children: true });
    if (!this.background.destroyed) this.background.destroy({ children: true });
    this.overlays.destroy({ children: true });
    this.ships.clear();
    this.balls.clear();
    this.effects.length = 0;
  }
}
