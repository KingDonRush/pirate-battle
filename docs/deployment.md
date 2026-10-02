# Deployment

> **Read contract:** solution documentation, not task state or authorization. Recover intent through the [index](../.agents/index.md) and preserve the [company brief](../CHALLENGE.md). Publication evidence is revision-bound.

The approved target is a public Vercel release in the personal **kingdonrush / kingdonrushs-projects** account, using project **pirate-battle**. The repository is [KingDonRush/pirate-battle](https://github.com/KingDonRush/pirate-battle). The project exists with Vite, Node22, repository root, `npm ci`, `npm run build` and `dist`. Project-scoped password/SSO/IP protection is disabled for evaluator access; unrelated account/project settings are preserved. Final public deployment verification is still pending.

## Build and source correspondence

No private API, database, WebSocket service, secret or build environment variable is required. Ranking/history are browser-local MSW REST demonstrations consumed by Axios/Query. Normal screen navigation is React state, with no deep route/catch-all rewrite.

`npm run build` writes `dist/build-info.json` with commit, tree, dirty flag, build time, Node and actual runtime dependencies. Publish only the checked, clean source artifact. Hashed assets retain content identity; the stable worker path needs revalidation (`Cache-Control: no-cache` in the normal Vercel configuration).

The Vercel account currently has no connected GitHub account; Git-source deployment returned `no_github_account_connected`. Publication uses the authorized official MCP file-upload/deployment APIs within the same project/account. Upload the exact checked artifact by SHA1, deploy its file manifest with production target and source git metadata, and use a deployment-specific static build override when uploading `dist` rather than source. The project retains its normal Vite source-build settings. No downloaded helper, intermediary host, extracted credentials or new CLI is used. [Official deployment API](https://vercel.com/docs/rest-api/deployments/create-a-new-deployment).

## Public gate

A READY response is only a hosting status. Verify the actual HTTPS URL in fresh unauthenticated contexts: commit metadata, initial/reload, exact worker/script/asset responses, local play, real registration, paginated tabs and pending/commit-timeout recovery, desktop and touch portrait/landscape, and no unhandled errors. A protected preview cannot stand in for the final public URL.

The existing Playwright suite accepts `E2E_BASE_URL=https://...` to verify a remote release without starting a local server. Keep native-focus/hardware profiling local and documented. A new context isolates test storage; never clear a user's other browser data. Final URL, deployment identity, source revision and verification/report links are recorded in [acceptance](acceptance.md) and #20 after actual completion. Keep the public release available during assessment.
