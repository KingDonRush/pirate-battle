import { Assets, Rectangle, Texture } from 'pixi.js';
import shipsUrl from '../../assets/spritesheet/ships_miscellaneous_sheet.png?url';
import shipsXml from '../../assets/spritesheet/ships_miscellaneous_sheet.xml?raw';
import uiUrl from '../../assets/spritesheet/ui_sheet.png?url';
import uiData from '../../assets/spritesheet/ui_sheet.json';
import tilesUrl from '../../assets/tilesheet/tiles_sheet.png?url';

export type GameAssets = {
  ships: ReadonlyMap<string, Texture>;
  water: Texture;
  sand: Texture;
  grass: Texture;
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
    if (!frames.has('ship_2.png'))
      throw new Error('The player ship is missing.');
    const terrain = new Map<string, Texture>();
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
      ['gate', 704, 192, 64, 64],
    ] as const)
      terrain.set(
        name,
        new Texture({ source: tiles.source, frame: new Rectangle(x, y, w, h) }),
      );
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
      ships: frames,
      terrain,
      health,
      water: new Texture({
        source: tiles.source,
        frame: new Rectangle(512, 256, 64, 64),
      }),
      sand: new Texture({
        source: tiles.source,
        frame: new Rectangle(32, 32, 128, 128),
      }),
      grass: new Texture({
        source: tiles.source,
        frame: new Rectangle(400, 64, 112, 128),
      }),
    };
    progress(1);
    return result;
  })().catch((error: unknown) => {
    current = undefined;
    throw error;
  });
  return current;
}
