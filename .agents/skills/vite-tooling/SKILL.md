---
name: vite-tooling
description: Configure and verify Vite development, optimized builds, asset URLs, public resources, base paths and toolchain compatibility. Use for Vite application tooling across projects; selected framework, hosting provider and delivery commands belong to the workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# Vite tooling

Read [asset/build/version cases](references/assets-build-versioning.md) for imported versus public resources, companion URLs, base/refresh, type/runtime/plugin compatibility, modes, lazy-chunk recovery and reproducibility. Verify the optimized artifact rather than assuming dev behavior proves deployment.

Vite's development server and production build resolve modules and assets differently. A successful development page does not prove the built artifact can load from its deployment base. Read package scripts, the lockfile, Node engines and plugin peer ranges before changing versions.

## Reproducible toolchain

Use the existing package manager and one canonical lockfile. Align Node, framework plugin, compiler and lint versions with their declared supported ranges. Pin a version when reproducibility or a compatibility boundary warrants it; newest is not automatically the appropriate choice.

Keep development, build, preview and type checking explicit. A transformer processing TypeScript is not necessarily checking its types. Required checks should fail on their own diagnostics rather than silently pass because a command found no relevant tests or files.

## Assets and deployment base

Imported assets participate in Vite's graph and receive appropriate built URLs. `public/` resources are copied unchanged and are appropriate when a stable filename/root path is necessary. Decide which behavior the resource needs instead of copying a whole asset directory into both locations.

Use supported static imports, analyzable URL construction or an explicit glob/manifest. A path that resolves from the source tree may not exist in `dist/`. Verify atlas/font/media companion URLs after transformation. Treat worker URLs and scopes as explicit integration contracts.

Set `base` to the actual served location. Check root and nested paths when the hosting context requires them. Values exposed through client environment variables are delivered to the browser and cannot hold secrets. Validate required config and provide an actionable startup failure if it is absent.

## Verification and resource lifecycle

Use a managed dev/preview server with a known host and port, or reuse an identified compatible server. Close owned processes when their verification ends. Retain sources and lockfile; remove superseded build/test intermediates when they have no remaining use.

Check the optimized build through HTTP: module loading, asset URLs, base path, refresh and any browser worker. Preview verifies the artifact locally; the hosting workflow still verifies the real deployment. Split optional modules after identifying useful loading/bundle tradeoffs rather than forcing a chunk structure without measurements.

Primary references: [getting started](https://vite.dev/guide/), [static assets](https://vite.dev/guide/assets). The workflow supplies framework selection, commands, deployment base and acceptance conditions.
