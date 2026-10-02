# Deployment

> **Read contract:** solution documentation, not task tracking or authorization. Use it for the named subject; recover uncertain task context through [the index](../.agents/index.md) and check the [company brief](../CHALLENGE.md) before a material decision.

Target: a public Vercel URL serving the same commit as the submitted solution. The public solution fork is [KingDonRush/pirate-battle](https://github.com/KingDonRush/pirate-battle). Static build settings are prepared; no game or Vercel deployment exists.

## User configuration

1. Sign in to [Vercel](https://vercel.com/) with the GitHub account that will own the solution.
2. Import the existing solution fork. `origin` points to that fork; `upstream` remains Jungle's brief. Direct all solution work to `origin`.
3. Import the solution repository into Vercel. Select Vite, repository root, Node.js 22.x, install command `npm ci`, build command `npm run build`, and output directory `dist`. These commands are also in `vercel.json`.
4. No secrets or environment variables are required by the selected architecture. Ranking and history are simulated in the browser, so a database, API host and WebSocket service are unnecessary for this challenge.
5. For evaluator access, ensure the final URL opens without Vercel login or deployment protection. A custom domain is optional. Keep the deployment accessible throughout evaluation.

Source: [Vercel's Vite integration](https://vercel.com/docs/frameworks/frontend/vite). Browser mocks must start before data queries in the published build, as required by the challenge. Avoid a catch-all rewrite over `/api/*`: unhandled API calls should fail visibly rather than receive the SPA's HTML. Current screen navigation is planned as local state, so deep route rewrites are not needed. Revisit this only if actual URL routes are introduced.

## Verify before final submission

Run `npm ci`, `npm run browser:install`, `npm run check`, and the required profiling on a clean checkout. Keep the final source commit, public build identity and test/profiling evidence together.

Verify the actual HTTPS deployment with a fresh browser context: initial load, reload, worker registration, asset progress/failure recovery, a complete match, options persistence, paginated tabs, pending result after refresh, retry after timeout-after-commit, and empty console. Test a desktop and a touch viewport. Verify a protected preview is not the URL sent to the evaluator.

If an earlier service worker remains in the test profile, unregister only that project's worker and clear only its namespaced storage before rechecking. Do not clear all user browsing data. Make the final commit available to the evaluator without a private dependency.

Publication is a later authorized implementation step; this structural delivery creates no deployment or gameplay task.
