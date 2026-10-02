import type { Page } from '@playwright/test';
import type { InputSnapshot } from '../../src/game/simulation';
export class KeyboardPilot {
  private held = new Set<string>();
  private page: Page;
  constructor(page: Page) {
    this.page = page;
  }
  async apply(input: InputSnapshot) {
    const next = new Set<string>();
    if (input.forward) next.add('w');
    if (input.turn < 0) next.add('a');
    if (input.turn > 0) next.add('d');
    if (input.front) next.add(' ');
    if (input.left) next.add('q');
    if (input.right) next.add('e');
    for (const key of this.held)
      if (!next.has(key)) await this.page.keyboard.up(key);
    for (const key of next)
      if (!this.held.has(key)) await this.page.keyboard.down(key);
    this.held = next;
  }
  async release() {
    for (const key of this.held) await this.page.keyboard.up(key);
    this.held.clear();
  }
}
