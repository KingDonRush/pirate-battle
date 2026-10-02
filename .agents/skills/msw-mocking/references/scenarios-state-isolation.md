# MSW: realistic contracts, deterministic scenarios and isolation

Baseline: MSW 2.15.0 package/API and live probes; current web examples may target major 3 and different import/startup APIs. Use installed exports/types as the compatibility boundary. The probe used `http`, `HttpResponse` and `delay` from `msw`, and `setupServer` from `msw/node`.

## M1. Network interception preserves the path under test

A handler intercepts the HTTP boundary while the real client/cache/UI execute. Replacing an application's endpoint function with an always-successful stub exercises a different path. Conversely, a mock of an external dependency is legitimate when the test's subject is the client behavior, not that external service's implementation.

Match method, origin/path and query/body contract deliberately. A ranking-only failure should not fail the unrelated history endpoint, and an API pattern should not swallow asset URLs. An unhandled endpoint is useful evidence of a contract gap; do not return a default empty list simply to suppress it.

Separate fixtures from behavior. A fixture represents valid initial data and its schema; the scenario decides timing, state mutation or failure. This separation allows the same record set to exercise loading, pagination and recovery without copying many nearly-identical handlers.

Sources: [handler organization](https://mswjs.io/docs/best-practices/structuring-handlers), [browser integration](https://mswjs.io/docs/integrations/browser).

## M2. Startup, environment and URL scope

Browser startup is asynchronous. Await worker readiness before calls that must be intercepted; otherwise an initial real request may escape while later calls look correct. A service-worker script also needs a valid served URL/scope and executable response. A catch-all rewrite returning HTML for that path is a deployment error, not a retry-policy problem.

Node's setupServer does not install a browser service worker. Pair listen/reset/close with the intended test lifetime. Browser-only storage APIs cannot be assumed in shared Node handlers; use an explicit store adapter where state persistence matters.

Choose environments from the workflow. Production mocking is appropriate for an explicitly simulated demo, while a real service application normally disables it in production. Copying the development-only condition from a tutorial without checking that purpose can break a published demo silently.

Sources: [browser](https://mswjs.io/docs/integrations/browser), [Node integration](https://mswjs.io/docs/integrations/node).

## M3. A scenario has more than a status code

Describe a scenario through initial data, request/operation identity, captured response revision, latency, failure type and side-effect phase. An empty 200 response, a 500 response, a transport rejection and an Axios timeout produce different caller behavior. Making them all one generic “error” fixture leaves important branches untested.

Use exact latency or a seeded schedule in reproducible tests. A no-argument delay can differ between browser and Node and is not a deterministic latency policy. For out-of-order reads, request A captures old data and waits, a write commits, request B captures new data and returns, then A is released. If A simply reads the store after its delay, it is no longer an old response and cannot test the intended race.

Avoid an unbounded hanging handler when a bounded delay beyond the client's timeout reproduces the needed condition. State the operation being timed out and allow owned work to terminate during cleanup. Deliberately infinite pending work is a different test with a cancellation/closure requirement.

Sources: [delay](https://mswjs.io/docs/api/delay); installed response/handler APIs.

The following schematic handler captures a payload before waiting. `store.snapshot()` returns an immutable copy and `scenario.delayFor` supplies a deterministic request schedule.

```ts
http.get('/api/items', async () => {
  const captured = store.snapshot();
  const requestIndex = scenario.nextRequestIndex();
  await delay(scenario.delayFor(requestIndex));
  return HttpResponse.json(captured);
});
```

Releasing this read after another request commits can expose a stale-response bug. Moving `store.snapshot()` after `delay` would instead return current data and miss that bug. Keep the sequence and captured revision in the reproduction steps.

## M4. Commit before timeout is a distinct contract

For failure-before-commit, reject before changing the store. For commit-then-timeout, persist the validated record and then withhold its response long enough for the client to time out. A retry reaches the canonical store and returns the existing record for an equal operation ID/payload. A changed payload for the same identity should have a defined conflict outcome.

The live probe demonstrated the second sequence: one committed record, Axios timeout, same-ID retry, still one record. A client abort also did not produce the same observed abort event on the cloned MSW Node request. Do not infer server rollback from an aborted client Promise.

Use one authoritative mock store for related resources. History and ranking, or order list and order detail, should derive from it rather than independent fixture arrays mutated separately. A Map or validated fixed record projection avoids arbitrary unchecked keys/merges. Date, score/amount and page validation still matter even for fake HTTP.

Source: installed MSW/Axios behavior; the recorded probe and [Axios timeout semantics](https://axios-http.com/docs/handling_errors).

## M5. Handler reset is not data reset

Resetting handlers does not necessarily erase a module-level store, attempt counter, RNG state or localStorage. A fresh browser context does not reset a shared Node server. Define fixture creation, handler override and store cleanup for the correct owner rather than relying on test order.

Ordinary reload persistence differs from a deliberate reset. A demo may need confirmed and pending records to survive reload, but selecting Reset should return to a known initial dataset coherently. Cancel obsolete reads before cache/store reset so a late response cannot repopulate the just-cleared view.

Reset only the identified namespaces. Clearing all user storage to fix one test introduces unrelated side effects. Keep reset scenario choices visible in a disclosed demo control when the user needs to reproduce them; internal testing can use explicit fixtures instead.

Sources: [Node lifecycle](https://mswjs.io/docs/integrations/node), [handler organization](https://mswjs.io/docs/best-practices/structuring-handlers).

## M6. Browser test tools and trust boundaries

Playwright page routing and APIRequestContext do not transparently operate through a page's service worker. If the product's mocked HTTP path is under test, keep it enabled and select scenarios through its intended control. Blocking workers changes the architecture being exercised.

Do not retain copied session cookies/private HAR payloads merely to make a mock realistic. Valid synthetic fixtures and targeted response fields usually suffice. Mock data in a browser is editable and cannot prove server authority or authentication. Keep those limits explicit while verifying the actual contract the workflow requires.

Sources: [Playwright network/service workers](https://playwright.dev/docs/network), [browser integration](https://mswjs.io/docs/integrations/browser).
