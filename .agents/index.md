# Context routing

> **Read contract:** routing, not domain truth. Select the current intent; recover the kernel/current request if unclear. Read only the conditional references needed by that intent.

| Intent               | Initial context                                                                                 | Conditional references                                                                | State discipline                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Understand or review | Requested source/files and relevant challenge section                                           | Architecture for boundaries; selected technology for disputed facts                   | Read-only questions create no Issue/checkpoint churn.                                           |
| Implement            | Live Issue, relevant requirements and [compliance](policies/compliance.md)                      | [Workflow selection](workflows/index.md), engineering, owner code and selected skills | Search before creating tasks; record scope/acceptance and significant outcomes.                 |
| Investigate a defect | Reproduction, affected revision, requirement and owner code                                     | Owner workflow, targeted skill and failure evidence                                   | Preserve actual state; hypotheses remain unverified until checked.                              |
| Verify               | Acceptance item, candidate revision and claimed behavior                                        | Workflow 06 for browser checks or 07 for measurement; subject knowledge               | Associate evidence with revision/scenario/environment. Never set the subject's expected result. |
| Resume               | [Current checkpoint](memory/current.md), live Issue/PR, branch/diff and owned-resource records  | [Decisions](memory/decisions.md), applicable policy/workflow and knowledge            | Reconcile state and freshness before dependent action.                                          |
| Prepare publication  | Explicit current publication intent, candidate revision and [deployment](../docs/deployment.md) | Workflow 07, Git/GitHub, Vite/Vercel and worker/data checks                           | Preparation is not authorization to publish or contact people.                                  |

## Source ownership

| Information                            | Authoritative project surface                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| Company requirements                   | [Frozen company brief](../CHALLENGE.md), under [compliance](policies/compliance.md)  |
| Working rules                          | Root kernel and applicable policies                                                  |
| Task objective, acceptance, state      | [Issues](https://github.com/KingDonRush/pirate-battle/issues) and configured Project |
| Changes, reasons, timing, verification | Commits, PR events/narrative and revision-linked Actions                             |
| Resumable context                      | Checkpoint and decision references, reconciled with live tasks                       |
| Implemented behavior                   | Code, [architecture](../ARCHITECTURE.md) and README; proposals explicitly marked     |
| Requirement evidence                   | [Acceptance](../docs/acceptance.md) and linked reports/CI                            |
| Expertise                              | Selected skill and focused references                                                |
| External provenance and review limits  | [Qualification](research/skill-qualification.md)                                     |

## Knowledge selection

Prefer workflow technology links. A narrow technical question can go directly to [React](skills/react-engineering/SKILL.md), [TypeScript](skills/typescript-engineering/SKILL.md), [Pixi](skills/pixijs-engineering/SKILL.md), [Query](skills/tanstack-query-engineering/SKILL.md), [Axios](skills/axios-http/SKILL.md), [MSW](skills/msw-mocking/SKILL.md), [Playwright](skills/playwright-testing/SKILL.md), [HTML/CSS](skills/html-css-accessibility/SKILL.md), [Vite](skills/vite-tooling/SKILL.md), [Vercel](skills/vercel-deployment/SKILL.md) or [Git/GitHub](skills/git-github-engineering/SKILL.md).

Publisher material supplements a specific decision: [React performance](skills/vercel-react-best-practices/SKILL.md), [composition](skills/vercel-composition-patterns/SKILL.md), [commits](skills/git-commit/SKILL.md). Read recorded exceptions. Pixi's official collection is a conditional dependency reference: install the existing lockfile if absent; do not copy/upgrade it solely for reading.

## Reentry and freshness

Recover authorization from the user's current instructions, task state from live GitHub and implementation from the actual tree. Memory carries the last observation. If GitHub is unavailable, continue only independent authorized local work and checkpoint the unconfirmed observation without creating a shadow backlog.

Changed requirements, code, dependencies or instructions invalidate their affected evidence/route. Read only changed owners and relevant branches. A material contradiction blocks its change; lack of evidence stays unverified. This index is a reading procedure, not an automatically executing dispatcher.
