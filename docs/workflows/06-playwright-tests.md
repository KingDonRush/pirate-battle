# Playwright E2E and visual regression — 10 points

Contract: brief section 8, all [G01–G12](../ACCEPTANCE.md), and reviewed menu/arena/result baselines. This workflow owns evidence quality and the browser test harness; each implementation workflow still owns its behavior.

## Specialized knowledge to load

Use Playwright locator/actionability/assertion, context/fixture, clock, touch, service-worker/network, visual baseline and trace research. Read the installed-version notes before adopting CLI or screenshot defaults from an external skill. Do not install another browser-control CLI just to follow a package's preferred tool.

## Decisions and execution

1. Associate every required behavior with an observable assertion and its owning workflow. Keep state isolated with known options/database/outbox/scenario/seed. A test can provision legitimate initial fixtures but cannot manufacture the result of the combat action it claims to verify.
2. Drive actual keyboard and pointer controls, including held and simultaneous actions. Check resulting movement/rotation/trajectory/damage/score and rendered feedback. A DOM mirror can expose semantic status; a read-only snapshot can observe world state. Neither replaces controls or runs different combat rules.
3. Install the controlled clock before timers. Use a method that executes intermediate callbacks when testing continuous movement/spawns; `fastForward` can execute due timers only once and cannot stand in for a full simulation run. Freeze a real stable state for screenshots. Verify paused time does not accumulate after focus/visibility loss.
4. Use semantic locators and web-first assertions for HTML controls. Use deliberate observation/polling for canvas state where needed. Wait for the condition being asserted rather than a generic sleep or network-idle guess. Keep expected console/page errors explicit for controlled failure cases.
5. Preserve the production MSW path. `page.route` and the API request fixture do not transparently replace a browser service worker's intercepted responses. Select MSW scenarios and verify the visible/cache outcome; use browser requests for browser-worker contracts.
6. Execute main flows in Chromium desktop and mobile. A mobile viewport plus a single tap does not prove simultaneous touch. Exercise the actual multi-pointer down/up/cancel behavior, release contacts in teardown, and check orientation/resize with complete HUD/arena.
7. Review and version menu/arena/result baselines with fixed browser/OS/DPR/viewport/fonts/data/seed. Set animation handling deliberately; CSS animation disabling does not freeze Pixi tickers. Review differences before updating references. Capture HTML reports and failure traces with bounded retention.
8. Diagnose a failure using assertion/call log, error context, trace and actual state. Do not change retries, screenshot tolerances or expected scores merely to obtain a pass. Keep test-server/browser resource lifecycle explicit.

## Quality and trust

Preserve actual network and asset checks where their behavior is under test. Do not store credentials, user browser state or raw private payloads in committed traces/HARs. Reuse compatible installed browsers and disable garbage collection of another task's shared cache. A provider's claim about tool efficiency does not justify installing extra runtime code.

## Evidence and exit

All twelve groups must pass in the required projects with honest coverage. Keep reviewed visual baselines and current useful reports. Deliver failure traces when failures occurred and preserve reproduction commands. Mark the actual acceptance evidence; the startup smoke test alone proves environment boot only.
