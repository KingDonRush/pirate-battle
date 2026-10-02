# Playwright: behavioral evidence, deterministic time and visual review

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Baseline: Playwright 1.62.1, official runner/API docs and a reviewed Checkly reference package used for topic discovery. That package's extra CLI, unconditional updates, authentication setup and some generalizations are not adopted as requirements. The workflow selects product acceptance cases.

## E1. Locators and what a passing assertion means

A role/label locator expresses the control a user can identify. It resists markup refactoring and exposes missing semantic names. A test ID is appropriate for a stable observation without a meaningful accessible target; CSS may be necessary for a deliberately structural assertion. The choice is based on what the test claims, not an absolute ban on selectors.

Web-first assertions wait for an actual condition rather than sampling once too early. A visible text change, enabled action or stable response projection usually describes readiness better than network-idle. A long-lived connection, background request or service worker can make network-idle irrelevant to the user action.

Avoid a test that sets its own expected outcome. A fixture can provision a starting record; a checkout test must still activate Checkout, and a drawing/input test must still activate the relevant input. Observational hooks can expose otherwise unreadable canvas/domain state without changing the path producing it. Record the observable contract and the behavior not covered by the assertion.

Sources: [best practices](https://playwright.dev/docs/best-practices), [assertions](https://playwright.dev/docs/test-assertions).

## E2. Isolation includes external state

Each test context isolates browser storage/session, but not a shared mock database, Node module counter or mutable remote resource. Use a fixture with explicit initialization and teardown for those dependencies. A read-only catalog can be shared per worker; a record every test mutates cannot be shared merely for faster setup.

A named session/browser context/page represent different lifetimes. A second tab shares its context's session; a second context represents an independent one. Pick the identity that the behavior needs, close owned contexts and retain private session state only when the task actually requires it.

Run a test alone, in reversed order and under the intended worker count when diagnosing shared-state behavior. A retry can hide an ordering leak; it does not repair it. Configuring a test client's retries is different from weakening the application's retry policy to make assertions finish sooner.

Sources: [isolation](https://playwright.dev/docs/browser-contexts), [fixtures](https://playwright.dev/docs/test-fixtures).

## E3. Time is several APIs, not one freeze

`setFixedTime` fixes Date reads while timers continue. Clock installation controls timers, animation callbacks and related time APIs. Install before the application creates the timers to avoid mixing native and fake handles. Then choose advancement according to the behavior under test.

`fastForward` emulates a jump and can execute a due timer only once. `runFor` executes intermediate callbacks, so it is suitable when a continuous update loop must actually advance. A fixed screenshot state should come from a real deterministic update path paused at the desired point, not a direct assignment of the expected world state.

Examples differ: relative text needs a fixed date; an expiry action needs its timeout to execute; continuous movement needs each step; return from a hidden tab needs the gap policy and explicit resume checked. A clock controlling the page does not automatically control every worker/Node backend timer. Choose deterministic response schedules at that boundary too.

Sources: [clock guide](https://playwright.dev/docs/clock), [Clock API](https://playwright.dev/docs/api/class-clock).

For a timer-driven progress control, a behavioral sequence is:

```ts
await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
await page.goto('/');
await page.getByRole('button', { name: 'Start' }).click();
await page.clock.runFor(500);
await expect(page.getByRole('progressbar')).toHaveAttribute(
  'aria-valuenow',
  '5',
);
```

The expected five steps must follow the real 100 ms operation implemented by the subject. Changing the DOM attribute directly, using `setFixedTime` alone or jumping over every intermediate callback would establish a different claim.

## E4. Interception must exercise the correct architecture

Page/context route handlers can replace browser network calls, but service-worker-handled requests may not reach them. APIRequestContext is a separate HTTP client and does not automatically invoke a page's worker. If browser MSW is required, drive a browser request and select scenarios there; blocking the worker and substituting page.route proves a different setup.

For a stale-response test, control when each response captured its data and when it is released. A delay alone does not make a response stale. Assert the final visible/cache revision, not just a request counter. For an uncertain mutation, check the server store's unique operation identity after retry, not only that the client displayed success.

HAR replay is useful for a selected external boundary but may contain sensitive payloads. Do not capture and commit real private state as convenient test data. Masking an important resource failure or mocking the action under test can turn a green run into false evidence.

Sources: [network](https://playwright.dev/docs/network), [API testing](https://playwright.dev/docs/api-testing).

## E5. Touch, focus and geometry

A narrow viewport is not touch input, and a single tap is not a held multi-pointer interaction. For simultaneous actions, drive the actual down/move/up/cancel lifecycle with distinct identities using an appropriate browser input method. A dispatched DOM event can test a handler but may not cover native hit-testing/capture; state that boundary rather than claiming a physical-device test.

Focus/visibility behavior also needs a genuine transition, not an arbitrary paused flag. Test keyboard capture inside editable controls/dialogs and after returning to active content. Resize tests should verify target coordinate mapping, clipped content and retained state, rather than only recording the new width.

Emulation controls viewport, device scale, touch/mobile flags and other selected conditions; it does not guarantee physical GPU, browser UI or finger ergonomics. Keep real-device/performance limits distinct from regression evidence.

Source: [emulation](https://playwright.dev/docs/emulation).

## E6. Visual baselines and animated rendering

`toHaveScreenshot` compares reviewed references and uses stability checks. A plain screenshot merely captures evidence. Select viewport/element/full-page scope according to the behavior being protected. An aria snapshot protects semantic structure, while a pixel baseline protects rendered appearance; neither is automatically a replacement for the other.

Specify animation handling deliberately and distinguish page.screenshot from screenshot assertion defaults. CSS/Web Animation handling does not freeze an independently running canvas ticker. Wait for the fonts/assets/layout that actually matter, control time/data/seed and use a consistent browser/OS/DPR reference.

Mask only justified nondeterminism. Masking a failed result, important number or broken canvas prevents the test from seeing that regression. Inspect actual/expected/diff images before changing a baseline or tolerance. A changed expected image is a reviewed design change, not a remedy for an unexplained failure.

Sources: [visual comparison](https://playwright.dev/docs/test-snapshots), [LocatorAssertions screenshot API](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-screenshot).

## E7. Diagnostics and resource cost

Use the assertion/call log, error context and trace to determine which action/condition failed. Capture failure artifacts with bounded retention. Console errors need a deliberate distinction between unhandled bugs and expected controlled error responses; do not broadly ignore all errors to make a network scenario green.

An additional browser-control CLI is optional, even when a candidate skill recommends it. Reuse installed runner/browser capabilities when sufficient. Browser installation can garbage-collect shared caches, so preserve other tasks' resources and pin a compatible binary/version. End owned servers/contexts and discard superseded diagnostic output when its role ends.

Use optimized builds and a declared hardware reference for performance claims. Controlled-clock or headless regression runs are excellent for deterministic behavior, but cannot establish normal real-time frame rate. Report which evidence actually ran.

Sources: [trace viewer](https://playwright.dev/docs/trace-viewer), [best practices](https://playwright.dev/docs/best-practices).
