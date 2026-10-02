# MSW and reproducible failure scenarios — 5 points

> **Read contract:** project procedure for this rubric criterion. Recover intent through [the index](../index.md), read the relevant [company requirement](../../CHALLENGE.md) and apply [common engineering](../policies/engineering.md). Load only the selected skills; reenter the index if task or evidence is unclear.

Contract: brief section 6 and supporting [G10–G12](../../docs/acceptance.md). This workflow owns the network mock contract, fixture state and failure timing. Workflow 04 owns client response/recovery.

## Specialized knowledge to load

Selected entrypoints: [MSW network/state/scenarios](../skills/msw-mocking/SKILL.md); [Axios timeout/cancellation](../skills/axios-http/SKILL.md).

Use MSW browser/Node lifecycle, handler ordering, stateful fixtures, delay/error and isolation research. Match the installed MSW 2.15.0 API rather than assuming current-major examples are interchangeable. Consult Playwright network guidance for service-worker interception limitations.

## Decisions and execution

1. Share typed contracts, fixtures and handlers across development, Node tests and the published browser demonstration. Await worker activation before API calls. Serve its stable script URL at the correct scope, preserving executable content rather than an SPA fallback response.
2. Use one persistent mock database keyed by match ID. Ranking and history derive from it. Equal duplicate writes return the stored record; conflicting content fails explicitly. Validation and pagination are handled at the request boundary.
3. Specify each scenario as payload/state, response timing, failure type, side-effect phase and deterministic sequence. Success, empty/multiple-page lists, fixed/variable latency, out-of-order responses, timeout, network failure, 4xx/5xx, ranking-only/history-only failure, commit-then-timeout and end-of-match unavailability/recovery must be selectable and reproducible.
4. For commit-then-timeout, write the record before delaying/withholding the response. Do not simulate it merely by failing before persistence. For stale reads, capture the old revision at request time and release that response after a later write, so the client test exercises a real race.
5. Keep scenario selection and reset in a disclosed menu panel. Reset fixture database, outbox/scenario state and associated Query cache coherently, cancelling obsolete requests first. Clear only the game's namespaces. Preserve confirmed records and pending writes through refresh in ordinary operation.
6. Isolate handler/data/counter/latency state in tests. A new browser context alone does not reset shared Node mock data. Handle legitimate asset requests separately from unhandled API endpoints. Give unhandled API calls visible diagnostics instead of returning fabricated success.

## Quality, performance and trust

No test changes the component's Axios implementation to bypass the network path. Keep production demo mocking enabled because this challenge explicitly needs it. A general skill's development-only example does not choose that deployment behavior. Avoid indefinite random delays or hidden global counters that make failures impossible to reproduce. The fixture identity is stable and payload validation excludes prototype-sensitive/unbounded data.

## Evidence and exit

Verify actual Axios requests are intercepted, committed writes appear in subsequent projections, repeated requests remain unique, and reset reproduces initial state in development/tests/published build. Give workflow 06 exact scenario names/timing and expected state transitions. Report differences between browser and Node adapters when a probe shows them.
