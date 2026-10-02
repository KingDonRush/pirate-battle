# Current technical checkpoint

> **Read contract:** this is a dated observation, not live task state or authorization. On resume consult the linked Issue/PR, Project and actual branch/diff/revision, then select [the current intent](../index.md). Resolve later merge/CI/closure events from GitHub.

## Observation: October 2, 2026 — GitHub discipline refinement

- Objective: [Issue #10](https://github.com/KingDonRush/pirate-battle/issues/10), tighten completion gates, milestone records and board-driven closure.
- Observed task state: open / In progress, P1. No gameplay or deployment task is selected.
- Branch: codex/github-completion-discipline, based on main bdb3c474058d1cc5e600a6e4cf16df820a7f63c7. The current tree contains the policy/template changes; read actual HEAD for later revisions.
- Project fact: Auto-close issue was removed through the supported GraphQL API. The five other workflow IDs/names/enabled states were compared before/after and remained unchanged.
- Documentation: the policy separates ready for integration from completed, requires final acceptance/documentation/cleanup before explicit closure and defines meaningful milestone/completion payloads.
- Hypotheses: none promoted to facts. Templates and structural checks do not prove semantic acceptance.

## Evidence and remaining gate

Earlier structural preparation passed [main CI](https://github.com/KingDonRush/pirate-battle/actions/runs/37014857563) at the observed base. It is historical evidence for the changing instruction tree. Local structural checks passed (three existing tests, 45 own Markdown files and seven weighted procedures), formatting/diff checks passed and the frozen brief hash matches. Manual review confirmed that a merged PR with pending main CI or undelivered acceptance documentation must leave the task open/In progress. Candidate PR CI, protected merge and integrated-main verification remain required.

The task must stay open/In progress until all acceptance and owned-resource cleanup pass. Its final completion record belongs in the Issue, with actual source/check links. The versioned checkpoint can predate that event; it does not need another commit merely to mirror GitHub closure.

## Reentry inside the authorized scope

Read Issue #10 and current checks. If it remains open, continue its concrete remaining gate; if it is completed, there is no successor task selected. A new material task requires its own current objective. Never close early to write a future closed-state snapshot.

The [Git/GitHub policy](../policies/git-github.md) owns the procedure; [durable references](decisions.md) explain maintained choices. Game architecture proposals remain in [ARCHITECTURE.md](../../ARCHITECTURE.md), and game acceptance remains Pending in [the matrix](../../docs/acceptance.md). No game work, deployment or next playable Issue is part of this refinement.

The owned review branch is tracked in the host's task-specific hygiene record until its integrated local/remote refs are removed. Use that prescribed record only for owned resources requiring later closure. Preserve other tasks' resources; source, lockfile, dependency versions and the frozen company brief are unchanged.
