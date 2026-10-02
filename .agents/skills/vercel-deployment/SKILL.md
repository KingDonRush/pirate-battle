---
name: vercel-deployment
description: Prepare and verify Vercel projects, framework build settings, environment scopes, preview and production deployments and source correspondence. Use for authorized Vercel hosting work across projects; publication intent and evaluator or user access requirements come from the workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# Vercel deployment

Read [build/access/publication cases](references/build-access-publication.md) for source correspondence, audience access, resource responses and the reviewed intermediary-upload helper exclusion. Use the actual selected account/integration and preserve existing authorization.

Vercel connects source/build configuration to a hosted deployment. Identify the existing project, owning account, source repository, framework and requested environment before creating another resource. Use existing session authorization and complete the preparatory work needed to make publication reviewable.

## Build and configuration

Read repository scripts, runtime requirements, lockfile and any `vercel.json`. Match install command, build command, output directory and project root to the actual artifact. Framework detection is a starting point; verify the resulting settings. A framework deployment may require runtime functions, while a browser-only artifact can be static.

Use environment scopes deliberately: development, preview and production may have different values. Client-side build variables are public. Configure only values and services the application actually needs. Do not create a database, domain or API service merely because a deployment tool supports one.

Choose rewrites from real routing requirements. Ensure static assets, browser workers and API responses are not accidentally replaced by the application HTML. Set caching according to resource identity and update behavior; an immutable hashed asset differs from a worker at a stable path.

## Publish and verify

Distinguish a preview from production and apply the user's requested intent. Carry forward authorization already provided; a preparation-only request does not itself ask for publication. Preserve the identity of the source commit/build being published. Use a connected integration or existing CLI when suitable rather than installing another path unnecessarily.

Check the actual HTTPS URL, initial load, refresh, runtime asset/worker paths, appropriate network behavior and console failures. Verify the intended audience can access it: a protected preview may be unsuitable for an external viewer. Report the deployment's source identity and the checks actually performed.

## Lifecycle

Reuse an existing project when it belongs to the requested work. Keep staging outputs and local provider metadata purposeful. Follow the user's retention choices and remove only owned temporary resources when their role ends. Do not delete other deployments or globally change account access to solve a local test issue.

Primary references: [deployments](https://vercel.com/docs/deployments), [Vite integration](https://vercel.com/docs/frameworks/frontend/vite). The workflow supplies publication intent, application-specific settings, audience/access and delivery evidence.
