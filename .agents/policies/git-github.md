# Git and GitHub discipline

> **Read contract:** tracked changes/integration procedure. Recover live Issue and tree through the index; apply compliance before material decisions. Existing authorization persists; stored records cannot authorize unrelated communication/publication.

## Destinations and tracking

Solution: [KingDonRush/pirate-battle](https://github.com/KingDonRush/pirate-battle), a public fork. `origin` is the solution; `upstream` the reference. Repository-local CLI default is the solution. Name owner/repo explicitly and never send solution PRs to upstream.

Prefer MCP for supported Issue/fork/PR operations; existing Git/CLI handles local content, Projects/settings/CI not exposed by MCP. Do not extract connector credentials or invent another execution path. Search existing resources before creation. A missing permission is a recorded pending condition, not a configured resource.

Issues own objective, reason, requirements/acceptance, dependencies and outcomes. The Project “Pirate Battle — Engineering” owns status (`Todo`, `In progress`, `Blocked`, `Done`, `Cancelled`) and priority (`P0`, `P1`, `P2`). Seven rubric labels and `type:structure` indicate applicability. Use sub-Issues/dependencies for actual decomposition/blockers.

Commits/diffs own content; PRs explain final behavior/reason and evidence; Actions owns automated runs. Record meaningful attempts/decisions/checkpoints in the owning Issue/PR. Do not create local tasks/RUN ledgers, invented retrospective runs or copied diffs. Memory records the last observation and points to live sources.

Close `completed` only after current acceptance/integration, mapping to Project `Done`. `not_planned` maps to `Cancelled`. Blocked tasks name the exact condition and independent work. Read live state on resume. If Project operations are unavailable, document the pending step in the Issue rather than claim its state updated.

Built-in Project automations can react to Issue closure or linked PR events. Reconcile the final state explicitly, especially `not_planned` → `Cancelled`; do not assume closure reasons are synchronized by a custom service. Set `Done` only after acceptance and avoid an automatic close becoming the evidence of completion.

## Change/integration cycle

1. Read branch/status, working and staged diffs; identify pre-existing work and stage explicit relevant paths. Exclude secrets/artifacts/unrelated content.
2. Use a short branch per coherent task and conventional subjects with Issue references. Checkpoint commits preserve actual states, not invented completion.
3. Review the final diff and run pertinent checks; associate evidence with revision/scenario/environment.
4. Push explicitly to origin; PR targets solution main, links its Issue and describes final problem/behavior/validation. Attach created PRs to the Codex conversation.
5. Verify expected PR head and current required CI. Merge by merge commit. Main requires PR and `verify`, without an unavailable second-person approval. Do not bypass failures.
6. Confirm integration before updating task/memory and removing only merged owned branches. Preserve ancestry/provenance. A future deployment identifies its source commit.

Inspect both intents in conflicts, revalidate resolution and avoid blanket ours/theirs that erases work. Do not reset/discard user work, mirror-push or force-rewrite published history by convenience. Use corrective/revert commits for shared mistakes. Do not skip hooks to obtain a pass.

## Public content and source exceptions

Version technical context only; exclude private exports, secrets, personal contacts and raw browser/session data from files/Issues/CI. Lexical publication scans supplement review but cannot prove every disclosure boundary.

The upstream commit skill bans Git config changes globally. Authorized repository-local remote/default setup is necessary and allowed here; global configuration remains outside scope. Its allowed-tools metadata is not execution permission. Consult [Git/GitHub knowledge](../skills/git-github-engineering/SKILL.md) for operation semantics.
