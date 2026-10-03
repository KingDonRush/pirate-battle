// Self-contained browser probe, serialized by page.evaluate. Read the real
// rendered surface; never replace pixels or write a gameplay outcome.
export function probeRenderedArena(kind: 'terrain' | 'trail') {
  window.pirateBattle!.advance(17);
  const state = window.pirateBattle!.observe();
  const view = state.view!;
  const canvas = document.querySelector('canvas')!;
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  const context = gl ? null : canvas.getContext('2d');
  if (!gl && !context) throw new Error('No readable rendered canvas surface.');
  const backend = gl ? 'webgl' : 'canvas';
  const pixel = (x: number, y: number) => {
    const px = Math.round((x * canvas.width) / view.width);
    const py = Math.round((y * canvas.height) / view.height);
    if (context) return [...context.getImageData(px, py, 1, 1).data];
    const rgba = new Uint8Array(4);
    gl!.readPixels(
      px,
      canvas.height - 1 - py,
      1,
      1,
      gl!.RGBA,
      gl!.UNSIGNED_BYTE,
      rgba,
    );
    return [...rgba];
  };
  const worldPixel = (x: number, y: number) => {
    const dx = x - view.originX;
    const dy = y - view.originY;
    return pixel(
      view.x +
        (dx * Math.cos(view.angle) - dy * Math.sin(view.angle)) * view.scale,
      view.y +
        (dx * Math.sin(view.angle) + dy * Math.cos(view.angle)) * view.scale,
    );
  };
  if (kind === 'trail') {
    const ball = state.projectiles.find(
      (projectile) => projectile.owner === 'player',
    );
    if (!ball) throw new Error('The actual front shot is missing.');
    return {
      kind: 'trail' as const,
      backend,
      trail: worldPixel(ball.x, ball.y + 15),
      water: worldPixel(ball.x + 12, ball.y + 15),
    };
  }
  const host = document
    .querySelector('.arena-viewport')!
    .getBoundingClientRect();
  return {
    kind: 'terrain' as const,
    backend,
    rgba: pixel(view.width * 0.03, view.height * 0.55),
    land: [
      [208, 168],
      [988, 132],
      [252, 552],
      [968, 516],
    ].map(([x = 0, y = 0]) => worldPixel(x, y)),
    view,
    width: innerWidth,
    height: innerHeight,
    host: { x: host.x, y: host.y, width: host.width, height: host.height },
    scene: state.resources.scene,
  };
}
