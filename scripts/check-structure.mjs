import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const challengeHash =
  '15f28ff1404bb25651503bca922223b9f74ece0aacd79a2a2253078c33fcf7e9';

const workflows = new Map([
  ['01-gameplay.md', 35],
  ['02-pixijs-architecture-lifecycle.md', 20],
  ['03-interface-accessibility.md', 15],
  ['04-query-axios-consistency.md', 10],
  ['05-msw-failures.md', 5],
  ['06-playwright-tests.md', 10],
  ['07-performance-documentation.md', 5],
]);
const externalSkills = new Set([
  'git-commit',
  'vercel-react-best-practices',
  'vercel-composition-patterns',
]);
const requiredFiles = [
  'AGENTS.md',
  'README.md',
  'ARCHITECTURE.md',
  'CHALLENGE.md',
  '.agents/index.md',
  '.agents/policies/compliance.md',
  '.agents/policies/engineering.md',
  '.agents/policies/git-github.md',
  '.agents/workflows/index.md',
  '.agents/research/skill-qualification.md',
  '.agents/memory/current.md',
  '.agents/memory/decisions.md',
  'docs/acceptance.md',
  'docs/assets.md',
  'docs/deployment.md',
  'docs/design-review.md',
  'docs/reports/structure.md',
  '.github/workflows/quality.yml',
  '.github/ISSUE_TEMPLATE/task.yml',
  '.github/pull_request_template.md',
];
const intents = [
  'Understand or review',
  'Implement',
  'Investigate a defect',
  'Verify',
  'Resume',
  'Prepare publication',
];

async function exists(target) {
  try {
    return await stat(target);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function markdownFiles(root, directory) {
  const folder = path.join(root, directory);
  if (!(await exists(folder))) return [];
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const relative = path.posix.join(directory, entry.name);
    if (directory === '.agents/skills' && externalSkills.has(entry.name))
      continue;
    if (entry.isDirectory())
      files.push(...(await markdownFiles(root, relative)));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(relative);
  }
  return files;
}

export function localLinks(markdown) {
  const prose = markdown.replace(
    /^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm,
    '',
  );
  return [...prose.matchAll(/\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g)]
    .map((match) => match[1].replace(/^<|>$/g, ''))
    .filter(
      (target) =>
        !/^[a-z][a-z\d+.-]*:/i.test(target) && !target.startsWith('#'),
    );
}

/** Structural invariants only; semantic compliance requires a human/agent review. */
export async function validateStructure(root) {
  const errors = [];
  for (const file of requiredFiles) {
    if (!(await exists(path.join(root, file)))?.isFile())
      errors.push(`Missing entry: ${file}`);
  }

  const brief = path.join(root, 'CHALLENGE.md');
  if (await exists(brief)) {
    const hash = createHash('sha256')
      .update(await readFile(brief))
      .digest('hex');
    if (hash !== challengeHash)
      errors.push('Company brief differs from the frozen source.');
  }

  const workflowFiles = await markdownFiles(root, '.agents/workflows');
  const actual = workflowFiles.filter(
    (file) => path.basename(file) !== 'index.md',
  );
  if (actual.length !== workflows.size)
    errors.push('Exactly seven rubric workflows are required.');
  for (const [name, weight] of workflows) {
    const file = `.agents/workflows/${name}`;
    if (!actual.includes(file)) {
      errors.push(`Missing rubric workflow: ${name}`);
      continue;
    }
    const text = await readFile(path.join(root, file), 'utf8');
    const declaredWeight = Number(text.match(/^# .+ — (\d+) points$/m)?.[1]);
    if (declaredWeight !== weight)
      errors.push(`Wrong rubric weight: ${name} must be ${weight}.`);
    if (!localLinks(text).some((link) => link.startsWith('../skills/'))) {
      errors.push(`Workflow has no selected skill route: ${name}`);
    }
  }

  const files = [
    'AGENTS.md',
    'README.md',
    'ARCHITECTURE.md',
    ...(await markdownFiles(root, '.agents')),
    ...(await markdownFiles(root, 'docs')),
  ];
  for (const file of files) {
    if (!(await exists(path.join(root, file)))) continue;
    const text = await readFile(path.join(root, file), 'utf8');
    if (file !== 'AGENTS.md' && !text.includes('**Read contract:**')) {
      errors.push(`Missing reading/reentry contract: ${file}`);
    }
    for (const link of localLinks(text)) {
      // The root kernel's configured host skill is a portable external dependency.
      if (
        file === 'AGENTS.md' &&
        link === '/home/kingdonrush/.codex/skills/higiene-do-ambiente/SKILL.md'
      )
        continue;
      const target = decodeURIComponent(link.split('#')[0]);
      const resolved = path.resolve(root, path.dirname(file), target);
      if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) {
        errors.push(`Link leaves the project: ${file} -> ${link}`);
      } else if (!(await exists(resolved))) {
        errors.push(`Broken local link: ${file} -> ${link}`);
      }
    }
  }

  const index = path.join(root, '.agents/index.md');
  if (await exists(index)) {
    const text = await readFile(index, 'utf8');
    const routedIntents = new Set(
      text
        .split('\n')
        .filter((line) => line.startsWith('|'))
        .map((line) => line.split('|')[1]?.trim()),
    );
    for (const intent of intents) {
      if (!routedIntents.has(intent))
        errors.push(`Missing intent route: ${intent}`);
    }
    for (const [name] of workflows) {
      const router = path.join(root, '.agents/workflows/index.md');
      if (
        (await exists(router)) &&
        !(await readFile(router, 'utf8')).includes(`](${name})`)
      ) {
        errors.push(`Unrouted rubric workflow: ${name}`);
      }
    }
  }

  for (const obsolete of [
    'docs/PLAN.md',
    'docs/PREFLIGHT.md',
    'docs/WORKFLOWS.md',
    'docs/workflows',
    '.agents/tracking',
  ]) {
    if (await exists(path.join(root, obsolete)))
      errors.push(`Superseded state still exists: ${obsolete}`);
  }
  for (const ledger of [
    'tasks.md',
    'runs.jsonl',
    '.agents/tasks.md',
    '.agents/runs.jsonl',
  ]) {
    if (await exists(path.join(root, ledger)))
      errors.push(`Local task ledger is not allowed: ${ledger}`);
  }
  return { errors, checkedFiles: files.length, workflows: workflows.size };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const result = await validateStructure(root);
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(
      `Structure verified: ${result.checkedFiles} own Markdown files, ${result.workflows} rubric workflows and frozen company brief. Semantic review remains separate.`,
    );
  }
}
