# TanStack Query, Axios and consistent ranking/history — 10 points

> **Read contract:** project procedure for this rubric criterion. Recover intent through [the index](../index.md), read the relevant [company requirement](../../CHALLENGE.md) and apply [common engineering](../policies/engineering.md). Load only the selected skills; reenter the index if task or evidence is unclear.

Contract: brief section 5 and [G10–G12](../../docs/acceptance.md). This workflow owns typed REST consumption, cache consistency and durable idempotent result recovery. Workflow 05 implements the simulated server/conditions.

## Specialized knowledge to load

Selected entrypoints: [Query identity/cache/mutations](../skills/tanstack-query-engineering/SKILL.md); [Axios transport](../skills/axios-http/SKILL.md); [TypeScript boundaries](../skills/typescript-engineering/SKILL.md).

Use Query identity/state/pagination/cancellation/mutation/persistence material, Axios transport/error/interceptor guidance and TypeScript runtime validation. Verify examples against Query 5.104.0 and Axios 1.20.0. The research probes distinguish client cancellation from server-side cancellation and a timeout from an uncommitted write.

## Decisions and execution

1. Define paginated ranking/history and result registration contracts. Results contain match/player identity, date, score, active duration, end reason and the complete start configuration. Ranking compares identical rulesets with deterministic ties. Validate stored/received values rather than trusting a response generic or type assertion.
2. Use a stable QueryClient and keys containing every response identity: resource, player/ruleset, sort/filter and page as applicable. Normalize key values deliberately; credentials do not belong in keys. Factories are useful for shared calls, not a requirement to manufacture extra layers around two endpoints.
3. Separate initial fetching, pending-with-no-fetch, empty success, error and background refresh. A disabled/paused query can be pending without loading. Retain useful data during refresh and disclose stale/error status. Re-entering a tab refreshes as required; choosing `staleTime: 'static'` would prevent invalidation and is unsuitable here.
4. Pass Query's AbortSignal through Axios and use an explicit timeout. Cancel obsolete reads before reconciliation and invalidate/refetch both projections after acknowledged registration. A late pre-write read cannot replace post-write data. Cancellation stops the client path; it does not undo a server commit.
5. Persist an immutable completed result in a versioned outbox before sending, independent of the result screen. Retry its original match ID. Same-ID/same-payload registration recovers the existing server record; a conflicting payload fails visibly. Delete the pending item only after matching acknowledgement. Restore pending sends after refresh, and let another match start while one is pending.
6. Bound transient retries and expose manual recovery after exhaustion. Classify validation/conflict failures separately. Required storage failures remain visible. Do not add independent Axios and Query retry loops whose product multiplies requests.
7. Query ranking/history as projections of workflow 05's canonical mock database. Keep local options/gameplay outside Query's remote cache. A domain outbox stores unacknowledged writes; it is not a second cache of already-queried lists.

## Quality, performance and trust

Use a deterministic ruleset fingerprint, finite validated fields and known persisted schema versions. Avoid stale closure keys, rest-destructuring subscriptions to every Query field and needless cache serialization. Logs whitelist useful status/code/identity, not full Axios request config. Browser mock records are user-editable demonstration state, without claims of server authority.

## Evidence and exit

Verify all query states, pagination, both updated projections, duplicate clicks, commit-then-timeout, reload/recovery, another match while pending and controlled late responses. Provide save/query states to workflow 03 and reproduction steps to workflow 06. APIs cannot block Play/Options or active combat.
