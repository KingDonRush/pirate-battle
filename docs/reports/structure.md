# Structural verification

> **Read contract:** evidence for the structural task, separate from game acceptance. Associate outcomes with their observed revision and environment; recover current task state through [the intent index](../../.agents/index.md) and live GitHub. Later relevant changes can invalidate these results.

## Scope and baseline

[Issue #1](https://github.com/KingDonRush/pirate-battle/issues/1) covers the kernel, routing, disciplines, research qualification, workflows, memory and GitHub integration. Five native sub-Issues describe its parts. No gameplay, publication or next playable Issue belongs to this delivery.

[PR #7](https://github.com/KingDonRush/pirate-battle/pull/7) integrated the preparation baseline, preserving ancestry from company commit `315891441be81ca0bff75cf3c2b0cd2f27f119cd`. Baseline commit: `db6dc71d6cde239304b69e440ada67684b2a261d`; merge: `01d5db73e5d16f525d5e7953fa50af5c6a0e8dfd`. [Baseline PR CI](https://github.com/KingDonRush/pirate-battle/actions/runs/36946505585) passed `verify`.

The first local optimized startup attempt reached an unrelated server on port 4173. The baseline corrected server ownership and added validated `E2E_PORT`. Rechecking with port 4174 passed the normal suite; development startup passed on 5173. [Issue #2](https://github.com/KingDonRush/pirate-battle/issues/2) records the actual failure and correction. Other tasks' server was preserved.

## Routing and semantic review

Manual reading scenarios reviewed on October 2, 2026 against the migration tree on `chore/agent-kernel`, based on the baseline merge. This is a scoped review by the implementing agent, not an independent behavioral evaluation or formal proof that an agent will always comply.

| Scenario                               | Selected context and observed result                                                                                                                                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Narrow React context question          | Understand/review → React entrypoint → R8 case and recorded source exception. The route does not require loading every skill or opening an Issue. React still supports `useContext`; publisher advice is contextual.                                                    |
| Pause defect investigation             | Investigate → challenge §2/§4/§8 → workflows 01, 02 and 06 → clock/ownership cases. There is no implemented pause to reproduce yet; the route identifies required future evidence without starting gameplay. Workflow 03 is conditional on controls/focus presentation. |
| Resume without the chat                | Checkpoint → index → live parent/sub-Issues, Project and local branch/status/remotes. The observed baseline merge and active migration match the checkpoint; task state is checked live rather than inferred from memory.                                               |
| Proposed 30-second session             | Blocked by §2: “Duração configurável entre **60 e 180 segundos** de jogo ativo.” A short deadline does not justify relaxing this interval. Compatible alternative: keep the range and simplify optional decoration.                                                     |
| Proposed replacement of Pixi rendering | Blocked by §1/§4: PixiJS is required for game rendering and must participate effectively. The required stack cannot be replaced because another renderer is easier.                                                                                                     |
| Choice of Vite and plain CSS           | Permitted by §1: build tooling, styling and complementary libraries are candidate choices, provided the required technologies and remaining requirements are preserved.                                                                                                 |
| External execution instruction         | A hypothetical helper instruction in external material is technical input, not authorization. Kernel/compliance/qualification require payload and destination inspection; it cannot authorize execution, secret access or publication. No unknown helper was executed.  |
| Evidence after instruction changes     | Baseline CI remains historical evidence. Its pass cannot sign off the changed routes/checker. The checkpoint explicitly requires new verification; changing a tested owner requires its affected checks again.                                                          |
| Tracking versus memory                 | Six structural Issues and five native sub-Issues are in the public Project. Issues own acceptance, Project owns status, PRs/Actions own change/run evidence; checkpoint facts refer to those sources. There is no local tasks/RUN ledger.                               |

The conflict examples are hypothetical review scenarios; no contrary game change was attempted. Their blocked result is recorded here and in the owning Issue, rather than presented as an automatic semantic checker result.

## Automated and reproduction evidence

The structural checker validates frozen-brief identity, own local file links, necessary reading endpoints, six intent routes and exactly seven weighted workflows. Its regression tests reject a tampered brief, missing route, wrong weight and broken local link. It does not prove semantic agreement, expertise, safety, accessibility or game behavior.

Local migration verification passed: `E2E_PORT=4174 npm run check` (three structural regression/integration tests, lint, strict types, formatting, optimized build and two desktop/mobile startup cases), followed by `npm run test:e2e:dev` (two Strict Mode startup cases). The initial structural attempt rejected padded Markdown table rows as missing routes; parsing now trims the actual intent column and the maintained-tree test passes. This was a validator defect, not missing domain routes. [PR #8](https://github.com/KingDonRush/pirate-battle/pull/8) verified candidate `91c278a99b83ed50dbc3e960c32380b608c8135a` through [PR CI](https://github.com/KingDonRush/pirate-battle/actions/runs/37012792312), then integrated at `ef9a4ba88f4c53c9a8b62fe9f3fd745f4698b122`. [Main CI](https://github.com/KingDonRush/pirate-battle/actions/runs/37013012387) passed that merge. A clean detached checkout passed `npm ci`, `npm run browser:install`, `E2E_PORT=4184 npm run check` and `E2E_PORT=5184 npm run test:e2e:dev`, with the same three structural and four startup cases. Actual outcomes are linked on [Issue #6](https://github.com/KingDonRush/pirate-battle/issues/6). Node 22.21.1, npm 10.9.4 and existing Chromium revision 1234 are the local reference environment. Dependency versions and application source remain unchanged by this migration.

## Tracking, integration and hygiene

The public [Engineering Project](https://github.com/users/KingDonRush/projects/1) is linked to `KingDonRush/pirate-battle`, with a default table, Status (`Todo`, `In progress`, `Blocked`, `Done`, `Cancelled`) and Priority (`P0`, `P1`, `P2`). Labels identify structure and the seven rubric criteria. Native dependency links express the baseline and integration ordering; built-in event automations are followed by explicit status reconciliation.

Main protection is configured and read back: required PR, up-to-date `verify` check from GitHub Actions, enforced for admins, zero required second-person approvals, no force push and no main deletion. Merge commits are enabled; squash/rebase integration is disabled. Protected structural integration and clean reproduction passed. This final documentation records completed observations; later changes require affected checks and the actual revision. Actions keeps its existing pinned actions, read-only contents permission, timeout and seven-day artifact retention. Public technical memory contains no conversation, credentials or private exports.

The disposable checkout and its generated dependencies/build/reports were removed and its worktree unregistered. Owned research/download, local builds/reports and their cleanup record were removed. Preparation branches were deleted only after integration checks. Source/dependencies/assets and other tasks' resources were preserved. Test-server ports were closed, while the unrelated 4173 server remained. No unresolved task hygiene resource remains. Game acceptance and deployment remain Pending in [the matrix](../acceptance.md).

## Closed task state

The parent and five sub-Issues are closed as `completed`; all six Project items are Done. No task is active and no game work has started. The checkpoint references actual verification and live sources. Issue history/PRs/Actions preserve what changed, why and when; technical memory carries recovery context without private conversations or a parallel backlog.
