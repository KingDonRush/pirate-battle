import type { Page } from '@playwright/test';
export async function readyArtwork(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const urls = new Set<string>();
    for (const element of document.querySelectorAll('*')) {
      for (const match of getComputedStyle(element).backgroundImage.matchAll(
        /url\(["']?([^"')]+)["']?\)/g,
      )) {
        if (match[1]) urls.add(match[1]);
      }
    }
    await Promise.all([...document.images].map((image) => image.decode()));
    await Promise.all(
      [...urls].map(
        (url) =>
          new Promise<void>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Artwork failed: ' + url));
            image.src = url;
          }),
      ),
    );
  });
}
