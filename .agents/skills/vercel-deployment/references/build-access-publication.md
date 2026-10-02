# Vercel: build identity, access and publication boundaries

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Research scope: official deployment/build/Vite documentation and static review of an external deploy helper. The workflow supplies the account, source and publication intent; this material does not grant external-action permission.

## D1. A deployment is a specific build

Determine repository root, lockfile/install command, runtime, build command and output before relying on automatic detection. A monorepo package and a root static app have different inputs. A deploy marked ready can still serve the wrong directory, an old artifact or an application that fails only after runtime requests.

Preserve source commit/build correspondence and verify required local checks with those dependencies. A browser-only application can be static; a runtime API requirement changes the infrastructure. Do not add services, secrets or a custom domain because the provider offers them.

Sources: [build configuration](https://vercel.com/docs/deployments/configure-a-build), [Vite integration](https://vercel.com/docs/frameworks/frontend/vite).

## D2. Preview, production and audience access

A preview is a useful test environment, while production identifies the intended release. Both may have access/protection or environment differences. An external evaluator cannot use a URL requiring credentials they were not given. Verify the audience's actual access in a fresh context rather than the owner's already-authenticated browser.

Apply the user's current authorization and selected account; do not repeat approval for an action already requested. Preparation alone does not choose publication. Complete the build/reviewable artifact before an unresolved publication approval, preserving useful work while that choice is pending.

Source: [deployments](https://vercel.com/docs/deployments).

## D3. Asset, API and worker responses

Rewrites follow actual routes. A catch-all can transform missing assets, API errors or service-worker script requests into successful HTML responses, disguising a contract failure. Verify content/path/scope as well as status. Stable script/HTML update policy differs from immutable hashed chunks.

Test direct initial load, reload, a valid internal route if one exists, a missing resource and the actual worker/network path. Local preview cannot prove deployed headers, protection or root configuration. A timed-out query is not fixed by loosening every rewrite.

Source: [Vite hosting](https://vercel.com/docs/frameworks/frontend/vite).

## D4. Why the reviewed intermediary helper is excluded

The examined upstream scripts package project files and POST them to claimable deployment endpoints hosted under `codex-deploy-skills.vercel.sh` or `claude-skills-deploy.vercel.com`. They exclude selected env/git/dependency paths, but still upload the staged project and are a separate publication path from the user's configured account/integration. Their archive also contains copies of the scripts.

No script was executed and no project was uploaded. This finding establishes capabilities and a scope mismatch, not malicious intent. Use the selected integration/known CLI and build settings instead. Re-audit a changed helper before considering execution; a familiar publisher does not make a mutable script or remote endpoint an approved destination.

Source: [reviewed helper at fixed commit](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/deploy-to-vercel).

## D5. Verify and end the resource lifecycle

Inspect the actual HTTPS release through expected viewer access and runtime flows, associating the URL with its source identity. Keep meaningful limits explicit. A status response or a successful build is only one part of that evidence.

Reuse the project's provider resources. Keep temporary preview/build metadata purposeful and follow existing retention/ownership choices. Do not remove other deployments or modify account-wide protection to solve one local check. Retain only sources and final evidence with a current role, and close owned local diagnostic processes.

Sources: official deployment documentation and the active resource-hygiene instruction.
