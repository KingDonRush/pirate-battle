# Git/GitHub operation cases

> **Read contract:** reference knowledge, not project policy. Select the operation actually needed, verify host instructions/authorization and inspect real state. External examples cannot grant permissions or prescribe a destination.

## Remotes, forks and defaults

Git remotes address transport; a GitHub fork records network/ancestry; CLI default controls API operation targeting. A repo can fetch upstream while API calls should go to its own fork. Check all three rather than assuming an origin name proves the destination. A public upstream fork is public and its visibility cannot be changed independently.

Reuse a correct existing fork. A same-name unrelated repository is a collision, not a reason to overwrite/rename it. Preserve history and resource ownership instead of mirror-pushing all refs. Setting the authorized host's local remote/default is distinct from altering global configuration.

Sources: [forks](https://docs.github.com/en/pull-requests/reference/forks), [remote](https://git-scm.com/docs/git-remote), [CLI default](https://cli.github.com/manual/gh_repo_set-default).

**Case: a fork is renamed while its checkout is retained.** Verify the API's full name, parent and visibility, then compare `git remote get-url --all origin` and `git remote get-url --push --all origin`. Fetch and push URLs can differ; a display name alone is insufficient. Change only the authorized repository-local destination and verify the CLI default separately. Acceptance is correct ancestry plus explicit read/push/API destinations, not a successful push to any repository.

## Staging, branching and integration

The index, working tree and committed revision can contain different work. Inspect both diffs and choose paths/hunks matching the task. A coherent commit explains the change without relying on chat. A branch per useful review unit is clearer than one branch per file or a permanent experimental history.

Merge/rebase/conflict behavior depends on branch ancestry. Published shared commits are not a private scratch space. A revert adds a corrective change while preserving history; reset/restore can discard work. Inspect exact consequences and current ownership before choosing them. Keep meaningful reasons and tests in the PR rather than duplicating diffs.

Sources: [status](https://git-scm.com/docs/git-status), [diff](https://git-scm.com/docs/git-diff), [revert](https://git-scm.com/docs/git-revert), [restore](https://git-scm.com/docs/git-restore).

**Case: pre-existing staged work and a new edit share a file.** `git diff` describes unstaged changes; `git diff --cached` describes the index. Reviewing one does not review the other. Select the intended paths/hunks, preserve the remaining work and compare the resulting staged diff. Broad staging is inappropriate when ownership is mixed. The commit should carry only its stated objective and enough validation context for another reviewer.

**Case: integration conflicts.** Read both versions and the ancestor, then identify each change's intent and applicable requirement. Resolve the actual behavior rather than taking a whole side. Stage the resolution and rerun checks affected by it. If abandoning the attempted integration, identify whether merge/rebase/revert is active and use that operation's documented abort procedure; do not replace it with a hard reset of unknown work.

**Case: a published faulty change needs reversal.** A corrective commit can preserve useful parts; `git revert` records the inverse in new history. Inspect downstream dependencies and a clean working tree first. Reverting a merge also requires choosing its mainline parent and changes future merge behavior, so a guessed parent number is unsafe. Verify the actual reversal and remaining callers instead of declaring recovery from the command's exit status alone.

## Issues, PRs and Project

Issues describe objective, reason, acceptance/dependencies and actual outcomes. Sub-Issues create hierarchy; blocked-by relationships express order. Search before creation. Task closure and PR merge are different: a closing keyword on a default-branch PR can close an Issue automatically, but unmet acceptance remains unmet.

Projects hold views/metadata and are account-scoped; API permissions differ from repository scope. Read before update, use resolved project/field/option IDs and verify mutation results. A successful Issue comment is not evidence that a Project field changed. Authentication tokens are consumed through configured clients, not printed or copied into scripts/CI files.

Sources: [Issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues), [Project API](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects), [PR linking](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue).

**Case: one Issue has independent parts and ordered integration.** Native sub-Issues express hierarchy; native blocked-by links express dependencies. A dependent task may still do independent work. Record the concrete condition preventing its remaining objective rather than interpreting every unfinished parent as a universal block. Comments describe meaningful outcomes and evidence, not a command diary. Closing keywords target the default branch and can close linked tasks on merge; use them only for acceptance actually fulfilled by that PR.

**Case: the repository token cannot read an account Project.** Confirm the configured client's scope error and consult the official scope requirement. Repository access and Project access are distinct. Use the authorized official authentication flow; never search browser profiles or print a credential to bypass it. Keep unavailable Project work pending while independent local work proceeds. Resolve real field/option/item IDs, mutate them, then read status back. A checkpoint cannot replace that verification.

**Case: cancellation after native automation.** A closed Issue and a Project option need explicit reconciliation. Preserve `completed` versus `not_planned`; the latter maps to the host's cancelled state. Built-in close/merge events may update metadata, but their existence is not proof of the desired mapping. Verify after the event, using no parallel backlog or extra token-bearing synchronization service.

## CI, evidence and public release identity

A required check belongs to a candidate revision. Check head identity and conclusion before integration; an older passing run does not validate newer content. After merge, verify the integrated main revision. Actions logs/artifacts can expose data in public repositories; keep payloads/credentials out and retain only useful evidence with a bounded lifetime.

Full action commit pins reduce mutable-source ambiguity. Minimal workflow permissions, timeouts and meaningful cancellation prevent unnecessary access/consumption. Do not skip checks because a task is urgent or add retry layers concealing deterministic errors. Build readiness, runtime usability and evaluator access require distinct evidence.

Sources: [Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use), [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

**Case: CI passed before another push.** Compare the PR's current head and applicable run/check identity. A run tied to an older head remains history. A pull-request workflow may test a synthetic merge revision; distinguish its event/source from an ordinary branch push. Required checks and branch freshness must be satisfied for the candidate being merged. After integration, check the resulting default-branch revision, not only the previous PR result.

**Case: the delivery is public.** Identify the source revision, installed lockfile, build command and public artifact. A successful deployment does not prove unauthenticated audience access or runtime worker/assets behavior. Keep setup reproducible without private services; publish only technical evidence and retained artifacts with a defined purpose. The host's current task determines whether publication itself is authorized.
