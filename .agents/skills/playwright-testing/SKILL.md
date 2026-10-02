---
name: playwright-testing
description: Design and run Playwright browser tests with semantic locators, isolation, controlled time, network scenarios, visual comparison and failure traces. Use for browser verification across products; acceptance cases, test instrumentation and performance claims belong to the workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# Playwright browser testing

Read [behavioral, clock, network and visual cases](references/behavior-clock-network-visual.md) for assertion meaning, context/external-state isolation, time advancement, service workers, multi-pointer input, screenshot baselines and failure diagnosis. Reviewed external tooling preferences do not require installing another CLI.

Playwright executes browser interactions and observes their results. A passing assertion establishes its checked behavior, not every requirement in a product. Identify the installed Playwright/browser versions, projects, operating system and required device contexts before adding tests.

## Behaviors and isolation

Start from a known browser context, storage state and fixture configuration. Test a meaningful behavior through the actions relevant to its user. Prefer role/label locators for semantic interfaces; use explicit test IDs when no stable accessible target represents the object. Scope a locator before making it brittle with position selectors.

Use locator actions and web-first assertions that wait for the actual condition. An arbitrary sleep neither proves readiness nor explains a failure. Observe critical console/page errors as well as visible outcomes when the workflow requires a clean runtime.

Test hooks can provide fixtures or observations when the environment requires them. Define their contract and justify what they control. They must preserve the behavior the test claims to exercise: setting the expected result directly does not test the path producing it.

## Time, input and network

Install a controlled clock before the application creates the timers being controlled. Distinguish changing displayed dates from advancing timers and animation callbacks. Combine deterministic data/seed with controlled time when a scenario otherwise changes between runs.

Touch emulation is not proof that a desktop-only event path handles simultaneous pointers. Exercise relevant pointer lifecycle and keyboard interaction explicitly. When MSW/service workers own interception, select scenarios there or use a compatible strategy; page routing may not observe a request already handled by a worker. The workflow determines whether those workers must remain enabled.

## Visual and diagnostic evidence

Keep screenshots stable by controlling viewport, DPR, OS/browser, fonts, data and animation state. Inspect a new baseline and the actual difference before accepting an update. A mask should cover justified nondeterminism, not the behavior under test. Version useful baselines while bounding intermediate captures and reports.

Retain traces/screenshots on relevant failures and make the HTML report discoverable. Diagnose the first failure before introducing retries that could conceal deterministic bugs. Reuse installed browsers when compatible and avoid garbage-collecting another task's shared browser resources.

## Verification boundary

Run affected tests after a behavior change and the required suite at handoff. Check genuine reload/restoration and resource disposal when their behavior is required. Report project/browser conditions and uncovered requirements. Performance measurements need a declared method and reference environment; a quick headless test alone does not establish a user-device target.

Primary references: [best practices](https://playwright.dev/docs/best-practices), [clock](https://playwright.dev/docs/clock), [visual comparisons](https://playwright.dev/docs/test-snapshots).
