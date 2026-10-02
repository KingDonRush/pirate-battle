import { Assets, Rectangle, Texture } from 'pixi.js';
import shipsUrl from '../../assets/spritesheet/ships_miscellaneous_sheet.png?url';
import shipsXml from '../../assets/spritesheet/ships_miscellaneous_sheet.xml?raw';
import tilesUrl from '../../assets/tilesheet/tiles_sheet.png?url';

export type GameAssets = {
  ships: ReadonlyMap<string, Texture>;
  water: Texture;
  island: Texture;
};
let current: Promise<GameAssets> | undefined;
export function loadGameAssets(
  progress: (value: number) => void,
): Promise<GameAssets> {
  if (current) {
    progress(0.5);
    return current.then((assets) => {
      progress(1);
      return assets;
    });
  }
  current = (async () => {
    progress(0);
    const [ships, tiles] = await Promise.all([
      Assets.load<Texture>(shipsUrl).then((texture) => {
        progress(0.5);
        return texture;
      }),
      Assets.load<Texture>(tilesUrl).then((texture) => {
        progress(0.75);
        return texture;
      }),
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
    const result = {
      ships: frames,
      water: new Texture({
        source: tiles.source,
        frame: new Rectangle(512, 256, 64, 64),
      }),
      island: new Texture({
        source: tiles.source,
        frame: new Rectangle(320, 0, 256, 256),
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
