import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { localLinks, validateStructure } from './check-structure.mjs';

test('local link discovery ignores external URLs and fenced examples', () => {
  assert.deepEqual(
    localLinks(
      '[local](../doc.md) [external](https://example.com)\n```md\n[example](missing.md)\n```\n[space](<my doc.md>)',
    ),
    ['../doc.md', 'my doc.md'],
  );
});

test('tampered source, missing route, wrong weight and unresolved links fail together', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pirate-structure-test-'));
  try {
    await mkdir(path.join(root, '.agents/workflows'), { recursive: true });
    await writeFile(path.join(root, 'CHALLENGE.md'), 'weakened requirements\n');
    await writeFile(
      path.join(root, '.agents/workflows/01-gameplay.md'),
      '# Gameplay — 34 points\n\n> **Read contract:** procedure.\n\n[skill](../skills/missing/SKILL.md)\n',
    );
    await writeFile(
      path.join(root, '.agents/index.md'),
      '# Index\n\n> **Read contract:** route.\n\n| Implement | [missing](missing.md) |\n',
    );
    const { errors } = await validateStructure(root);
    assert.ok(errors.some((error) => error.includes('Company brief differs')));
    assert.ok(errors.some((error) => error.includes('Exactly seven')));
    assert.ok(errors.some((error) => error.includes('Wrong rubric weight')));
    assert.ok(
      errors.some((error) => error.includes('Missing intent route: Resume')),
    );
    assert.ok(errors.some((error) => error.includes('Broken local link')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('the maintained project satisfies the structural invariants', async () => {
  const root = new URL('../', import.meta.url);
  const result = await validateStructure(fileURLToPath(root));
  assert.deepEqual(result.errors, []);
  assert.equal(result.workflows, 7);
});
