# Vite: assets, runtime compatibility and built-artifact failures

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Research scope: official Vite assets/build/mode documentation, the installed Vite 8 toolchain and concrete browser-worker integration. Framework/runtime choices are supplied by the workflow.

## V1. The module graph and public resources solve different needs

An imported resource participates in the build graph and gets a resolved output URL. Public resources are copied without that transformation and preserve a stable path. An image atlas/font/media resource can have companions referenced by strings that the bundler cannot rewrite automatically.

Use explicit imports/manifests when those paths are known. A JSON atlas's `meta.image` is not magically updated because the corresponding PNG was imported elsewhere. Either use an explicit parser descriptor/preloaded texture or generate a build-aware manifest; verify the resulting request in the built artifact. Copying all source assets into public output solves paths by inflating payload and duplicating ownership, so select the smallest appropriate path strategy.

Worker scripts, a robots file or another stable resource may legitimately belong in public. Their URL, MIME type, scope and caching remain part of the integration contract. An ordinary imported chunk usually does not need that stable-path behavior.

Source: [static assets](https://vite.dev/guide/assets).

## V2. Root, nested base and refresh

A source-relative URL that works in development can fail after hashing or deployment beneath a subpath. Vite's base rewrites known imported/CSS/HTML URLs, while dynamic concatenation needs an explicit base-aware strategy. Test an initial load and refresh of the intended location, not only clicking from a root page that has already loaded resources.

A SPA fallback is appropriate for real client routes, but not for every path indiscriminately. Returning index HTML for a worker, missing chunk or API request changes a visible 404 into a misleading parsing/registration error. The hosting contract must distinguish those resource paths.

Use a development/preview HTTP server for the module application; opening the source HTML as a file is a different environment. Preview checks built output locally, while the hosting workflow verifies actual headers/base/refresh behavior on HTTPS.

Source: [production build/base](https://vite.dev/guide/build).

## V3. Types, runtime and plugins

Syntax transformation and type checking are separate operations. A successful build may strip invalid types while another checker would reject them. Run the configured compiler/lint explicitly and match their supported ranges with Node and the framework plugin.

The build target defines syntax compatibility, not every platform API's existence. A new browser feature may still need a capability check or a documented support boundary. Avoid installing a large compatibility layer for APIs the selected audience does not need.

Read migration notes before changing a major build tool. The installed Vite 8 uses a different underlying bundler API from older configuration examples; copying a legacy chunk option can fail or do something different. Start with supported defaults, inspect the graph and split an expensive optional feature only when its initial-load cost warrants it.

Sources: [build compatibility](https://vite.dev/guide/build), [getting started](https://vite.dev/guide/).

## V4. Modes and exposed configuration

Client environment values become part of delivered code. A value named like a secret is not private merely because it lives in an env file during build. Separate public endpoints/feature options from private server secrets and configure only the values the architecture uses.

Build mode and `NODE_ENV` are related but not interchangeable arbitrary labels. Decide when a mock, debug adapter or optional UI is enabled from the actual workflow. A development-only mock gate can break a deliberately simulated published demonstration. Conversely, shipping a test mutation hook by default can expose behavior the workflow never intended for a user.

Validate required configuration at startup and explain a missing value through the appropriate owner. Do not provide a fabricated endpoint fallback that sends data to an unrelated service.

Source: [env and modes](https://vite.dev/guide/env-and-mode).

## V5. Release changes and lazy-load recovery

A running old page can request an old hashed chunk after a new deployment removed it. This differs from a malformed source import. The preload-error signal can help choose an intentional reload/retry path; an unconditional restart loop can repeatedly discard work without fixing the cause.

Keep stable HTML/worker and immutable hashed-resource caching policies distinct. Preserve durable work before an intended refresh, and document the deployed source/build identity. An app that boots only after manually clearing all browsing data has an unresolved update/persistence contract.

Source: [load-error handling](https://vite.dev/guide/build).

## V6. Reproducibility and cleanup

Use one package manager/lockfile and existing compatible runtimes. Confirm the server being reused belongs to this project/configuration; a port responding is not enough. Close owned servers after checks and remove superseded build/capture intermediates while retaining reconstruction sources.

Verify install, type/lint, build and artifact loading from the same setup the evaluator will use. A quick development screenshot does not establish asset paths, worker scope or public refresh. Report the boundary checked rather than calling every prepared command executed.

Sources: official guides above and the active environment-hygiene instruction.
