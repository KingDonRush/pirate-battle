import { Assets, CanvasSource, Rectangle, Texture } from 'pixi.js';
import shipsUrl from '../../assets/spritesheet/ships_miscellaneous_sheet.png?url';
import shipsXml from '../../assets/spritesheet/ships_miscellaneous_sheet.xml?raw';
import uiUrl from '../../assets/spritesheet/ui_sheet.png?url';
import uiData from '../../assets/spritesheet/ui_sheet.json';
import tilesUrl from '../../assets/tilesheet/tiles_sheet.png?url';

export type GameAssets = {
  shipAtlasUrl: string;
  ships: ReadonlyMap<string, Texture>;
  water: Texture;
  island: Texture;
  terrain: ReadonlyMap<string, Texture>;
  health: Readonly<{ frame: Texture; green: Texture; red: Texture }>;
};
let current: Promise<GameAssets> | undefined;
export function loadGameAssets(
  progress: (value: number) => void,
): Promise<GameAssets> {
  if (current) {
    progress(0.33);
    return current.then((assets) => {
      progress(1);
      return assets;
    });
  }
  const prepared: CanvasSource[] = [];
  current = (async () => {
    progress(0);
    let loaded = 0;
    const load = async (url: string) => {
      const texture = await Assets.load<Texture>(url);
      progress(++loaded / 3);
      return texture;
    };
    const [ships, tiles, ui] = await Promise.all([
      load(shipsUrl),
      load(tilesUrl),
      load(uiUrl),
    ]);
    const xml = new DOMParser().parseFromString(shipsXml, 'application/xml');
    if (xml.querySelector('parsererror'))
      throw new Error('The ship atlas could not be read.');
    const frames = new Map<string, Texture>();
    for (const entry of xml.querySelectorAll('SubTexture')) {
      const name = entry.getAttribute('name');
      const [x, y, width, height] = ['x', 'y', 'width', 'height'].map((key) =>
        Number(entry.getAttribute(key)),
      );
      if (
        !name ||
        x === undefined ||
        y === undefined ||
        width === undefined ||
        height === undefined ||
        ![x, y, width, height].every(Number.isFinite) ||
        width <= 0 ||
        height <= 0 ||
        x < 0 ||
        y < 0 ||
        x + width > ships.source.width ||
        y + height > ships.source.height
      )
        throw new Error('A ship atlas frame is invalid.');
      frames.set(
        name,
        new Texture({
          source: ships.source,
          frame: new Rectangle(x, y, width, height),
        }),
      );
    }
    for (const name of [
      'ship_2.png',
      'ship_8.png',
      'ship_14.png',
      'ship_4.png',
      'ship_10.png',
      'ship_16.png',
      'ship_5.png',
      'ship_11.png',
      'ship_17.png',
      'cannon_ball.png',
      'explosion_1.png',
      'explosion_2.png',
      'explosion_3.png',
    ])
      if (!frames.has(name))
        throw new Error('Missing ship or combat texture: ' + name);
    const terrain = new Map<string, Texture>();
    const isolate = (x: number, y: number, width: number, height: number) => {
      if (
        x < 0 ||
        y < 0 ||
        x + width > tiles.source.width ||
        y + height > tiles.source.height
      )
        throw new Error('The terrain atlas has invalid dimensions.');
      const canvas = document.createElement('canvas');
      canvas.width = width + 4;
      canvas.height = height + 4;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Terrain textures could not be prepared.');
      context.drawImage(
        tiles.source.resource as CanvasImageSource,
        x,
        y,
        width,
        height,
        2,
        2,
        width,
        height,
      );
      // Extrude the actual edge pixels into a two-pixel sampling gutter.
      context.drawImage(canvas, 2, 2, width, 1, 2, 0, width, 2);
      context.drawImage(
        canvas,
        2,
        height + 1,
        width,
        1,
        2,
        height + 2,
        width,
        2,
      );
      context.drawImage(canvas, 2, 0, 1, height + 4, 0, 0, 2, height + 4);
      context.drawImage(
        canvas,
        width + 1,
        0,
        1,
        height + 4,
        width + 2,
        0,
        2,
        height + 4,
      );
      const source = new CanvasSource({ resource: canvas });
      prepared.push(source);
      return new Texture({ source, frame: new Rectangle(2, 2, width, height) });
    };
    for (const [name, x, y, w, h] of [
      ['palm', 384, 256, 64, 64],
      ['small-palm', 448, 256, 64, 64],
      ['leaves', 320, 256, 64, 64],
      ['moss-rock', 64, 256, 64, 64],
      ['moss-stone', 128, 256, 64, 64],
      ['rock', 64, 192, 64, 64],
      ['tower', 768, 0, 64, 64],
      ['horizontal', 960, 0, 64, 64],
      ['vertical', 896, 0, 64, 64],
      ['vertical-cannon', 896, 64, 64, 64],
      ['horizontal-cannon', 896, 128, 64, 64],
      ['gate-horizontal', 704, 256, 64, 64],
    ] as const)
      terrain.set(name, isolate(x, y, w, h));
    const hpFrame = uiData.frames.enemy_health_frame.frame;
    const greenFrame = uiData.frames.enemy_health_fill_green.frame,
      redFrame = uiData.frames.enemy_health_fill_red.frame;
    const health = {
      frame: new Texture({
        source: ui.source,
        frame: new Rectangle(hpFrame.x, hpFrame.y, hpFrame.w, hpFrame.h),
      }),
      green: new Texture({
        source: ui.source,
        frame: new Rectangle(greenFrame.x + 24, greenFrame.y + 12, 112, 15),
      }),
      red: new Texture({
        source: ui.source,
        frame: new Rectangle(redFrame.x + 24, redFrame.y + 12, 112, 15),
      }),
    };
    const result = {
      shipAtlasUrl: shipsUrl,
      ships: frames,
      terrain,
      health,
      water: isolate(512, 256, 64, 64),
      island: isolate(320, 0, 256, 256),
    };
    // The cropped sources own their pixels; the preparation atlas is no longer borrowed.
    await Assets.unload(tilesUrl);
    progress(1);
    return result;
  })().catch((error: unknown) => {
    for (const source of prepared) source.destroy();
    current = undefined;
    throw error;
  });
  return current;
}
