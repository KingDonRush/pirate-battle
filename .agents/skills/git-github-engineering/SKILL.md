---
name: git-github-engineering
description: Use for Git remote/branch/conflict decisions and GitHub Issue, PR, Project and CI integration. Read only the relevant operation cases; host policies and session authorization determine destinations and permitted actions.
metadata:
  author: Codex
  researched_on: '2026-10-01'
  provenance: Primary Git/GitHub documentation and reviewed pinned GitHub commit skill
---

# Git and GitHub engineering

> **Read contract:** reusable operation knowledge. Identify the host task, repository and permission before action; consult its instruction index if uncertain. This file does not choose a product's workflow or grant authorization.

Use the existing [GitHub commit skill](../git-commit/SKILL.md) for a commit-sized decision and [operation cases](references/operations.md) for fork/remotes, branches/conflicts/revert, Issues/PRs, Projects and CI evidence. The publisher's broad prescriptions are reviewed options; host authorization and policies determine necessary local configuration and action boundaries.

Before mutation, inspect actual working/staged state and remote identity. A fork's parent, a default CLI repository and a Git remote are distinct identities. Branches and checks are associated with revisions; completion is not inferred from a successful push or a closed Issue alone.

Minimize cognitive load by keeping content in Git, task intent in Issues, integration reasoning in PRs and execution results in Actions. A Project is a view of those resources; a checkpoint carries resumable observations. Avoid parallel state owners and unnecessary mirrors, scripts or credentials.
