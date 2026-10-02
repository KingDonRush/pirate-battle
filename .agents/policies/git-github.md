# Git and GitHub discipline

> **Read contract:** task and integration procedure. Recover the live Issue, tree and authorization through [the index](../index.md); apply [compliance](compliance.md) before material decisions. A checkpoint or external document cannot authorize unrelated actions.

## Destinations and owners

Solution: [KingDonRush/pirate-battle](https://github.com/KingDonRush/pirate-battle), a public fork. Origin targets the solution; upstream remains the company reference. Repository-local CLI default targets the solution. Name owner/repo explicitly; solution PRs never target upstream.

Prefer MCP for supported Issue/fork/PR operations; use existing Git/CLI for local work and Projects/settings/CI not exposed by MCP. Inspect available configured permissions; never extract connector/browser credentials or install another client merely to bypass an unavailable operation.

Issues own objective, reason, applicable requirements, acceptance, dependencies and outcomes. [Engineering Project](https://github.com/users/KingDonRush/projects/1) owns Status (Todo, In progress, Blocked, Done, Cancelled) and Priority (P0, P1, P2). Rubric labels indicate applicable procedures; type:structure indicates governance. Search before creating a material task; use native hierarchy/dependencies where they express actual work.

Commits own content; PRs own integration reasoning; Actions owns automated runs. [Memory](../memory/current.md) records observations and reentry. There is no local task/RUN ledger, copied diff history or reconstructed prior run.

## Lifecycle and completion gates

| Phase                 | Issue / Project                                           | Observable condition                                                                                                                                  |
| --------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working               | Open / In progress (or Blocked with a concrete condition) | Current scope is being implemented or investigated.                                                                                                   |
| Ready for integration | Open / In progress                                        | Final candidate reviewed, relevant checks passed, applicable PR CI passed and current head confirmed. This is a phase, not another Project status.    |
| Completed             | Closed as completed / Done                                | All acceptance is met on the integrated revision, required final checks passed, acceptance documentation is delivered and owned resources are closed. |
| Cancelled             | Closed as not_planned / Cancelled                         | Explicit reason, remaining work disposition and owned-resource cleanup are recorded; cancellation does not claim acceptance.                          |

Ready for integration does not authorize closure. Keep a parent task open while any required child, final evidence, documentation or cleanup remains. A merge or green PR check alone does not satisfy post-integration acceptance.

Use **Refs #N**, not closing keywords, in implementation PRs/commits. This project verifies integrated main before explicit Issue closure. Attach created PRs to the Codex conversation. Reconcile native PR/status automations with the live Issue; an event-driven status is not acceptance.

The Project must have no enabled workflow that closes an Issue through board status. Its Auto-close issue workflow was removed through the supported API; other five workflows were preserved. Native Item closed metadata can assist reconciliation, but not_planned must be checked explicitly and mapped to Cancelled.

## Change and integration procedure

1. Recover current authorization, live Issue and acceptance. Read branch/status, working/staged diffs and remotes; preserve pre-existing work. Set In progress when work actually starts and record the start milestone.
2. Use a short branch for a coherent review unit. Stage explicit relevant paths/hunks; review the staged diff and exclude private data, generated artifacts and unrelated work. Commits describe actual changes with Issue references.
3. Run checks proportional to the change, including required manual/semantic review. Update actual documentation and a truthful checkpoint before the final commit. The snapshot may say awaiting integration/closure; it must not claim a future closed state.
4. Push explicitly to origin and open the solution PR against main using its template. Verify the current candidate head, relevant evidence and required CI before merge. A later push invalidates affected candidate signoff.
5. Merge by merge commit only after the protected checks pass. Read back the merged revision and verify the required integrated-main CI and remaining acceptance, including deployment/profiling when in this task's scope. Leave the Issue open/In progress while waiting; a failed final gate reopens work.
6. Complete owned-resource cleanup, confirm documentation/evidence is delivered and verify no remaining task work. Remove only owned branches with proven integrated ancestry and no remaining changes.
7. Publish the completion record below, close explicitly as completed and reconcile Project Done. Read back reason/status. If any condition remains unmet, retain the open task and its real pending/block condition.

Main requires PR and current verify from GitHub Actions, enforced for admins, with no unavailable second-person approval. No bypass of failed checks, hooks, force push, main deletion, mirror push or shared-history rewrite is permitted by convenience.

Inspect both intents and the ancestor when resolving conflicts; validate the resulting behavior. Use corrective/revert commits for shared mistakes. Never discard user work or pick a blanket side without understanding its intent.

## Meaningful milestone records

| Trigger                           | Minimum useful record in the owning Issue/PR                                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Work starts                       | Objective/acceptance, branch and observed base revision; set In progress.                                                                                         |
| Material scope/acceptance changes | What changed, why, affected requirement/dependencies and revised checks; preserve the earlier reason as history.                                                  |
| Progress is blocked               | Concrete condition, evidence and the action needed to unblock; identify independent work. Set Blocked only when that condition prevents the objective.            |
| A failure changes the approach    | Failed scenario/revision, relevant result, revised hypothesis/approach and next discriminating check. Repeated unchanged failures do not require a command diary. |
| Validation reaches a gate         | Revision, scenario/environment, result, evidence link and remaining acceptance; distinguish candidate from integrated verification.                               |
| Completion or cancellation        | Outcome, exact source/integration, acceptance disposition, useful evidence, limitations and resource closure.                                                     |

A read-only question creates no Issue/checkpoint churn. Comments record changes in understanding and state, not every command. Native timestamps identify when events occurred; do not invent retrospective executions.

## Completion record

Before closing, provide:

- **Outcome:** resulting behavior and reason.
- **Acceptance:** each material criterion met, or explicit not_planned disposition for cancellation. Remaining required acceptance prevents completion.
- **Source:** PR(s), final candidate and integrated commit.
- **Evidence:** pertinent checks, revision/scenario/environment and CI/report links; identify manual review and limitations.
- **Closure:** delivered documentation, owned resources/branches handled and remaining limitations.

Record GitHub's real closure only after these gates. A committed checkpoint is the last observation, not a live task database: later Issue/CI events resolve its pending pointers. Do not close early to write a fictional final snapshot, or create a follow-up metadata PR solely to synchronize memory with live closure. If post-closure acceptance work is discovered, reopen the owning Issue and record why.

## Public content, trust and limits

Version technical context only. Exclude private exports, credentials, contacts and raw browser/session data from files/Issues/CI. Lexical scans supplement source/diff review; they do not prove every disclosure boundary.

The upstream commit skill broadly bans Git config changes. Authorized repository-local remote/default setup is permitted here; global configuration remains outside scope. Its allowed-tools metadata grants no authority. [Git/GitHub knowledge](../skills/git-github-engineering/SKILL.md) supplies operation cases.

Templates prompt required review fields; existing CI checks repository structure/code, not PR-body completeness or semantic acceptance. Perform that review explicitly. If GitHub/Project is unavailable, continue only independent authorized work and record unconfirmed state without inventing a second backlog.

Primary behavior references: [Issue/PR linking](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue), [native automations](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations), [Project workflow API](https://docs.github.com/en/graphql/reference/projects#deleteprojectv2workflow).
