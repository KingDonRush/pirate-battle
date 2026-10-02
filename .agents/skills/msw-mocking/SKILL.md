---
name: msw-mocking
description: Build and review MSW network handlers, fixtures, browser and Node integration, deterministic scenarios and isolated mock state. Use for development, tests or explicitly requested browser demos; product contracts and environments enabling mocks belong to the workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# MSW network mocking

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Read [scenario, state and isolation cases](references/scenarios-state-isolation.md) for browser/Node boundaries, startup, delay/response revisions, commit-then-timeout, handler versus data reset and service-worker test interception. Use the workflow to select mocked environments and required failure cases.

MSW intercepts requests at the network boundary, allowing the real client and application code to execute. It is not a substitute for implementing domain logic or a production backend. Identify the installed major version and supported handler/startup APIs before following current documentation.

## Contracts and handler organization

Use shared transport contracts and small request handlers organized around resources. Keep fixtures separate from scenario behavior so a payload change does not rewrite every failure case. Match the real client's methods, paths and parameters. Validate requests where malformed input should fail, and return the status/body required by the API contract.

When a mock must behave statefully, choose one authoritative mock store and derive related responses from it. Reset handlers and reset mock data are separate operations; define both. Persistent mock state is justified for a demo or recovery requirement, not automatically for ordinary unit tests.

## Startup and isolation

In the browser, await worker activation before requests that must be intercepted. Ensure the worker script is served as a script at the appropriate origin/scope. Enable interception in environments selected by the workflow. A development-only example must not decide whether a published demonstration needs mocks.

In Node tests, pair server listen/reset/close with test lifecycle. Define which unhandled requests should fail and which legitimate resources pass through. Reset shared handlers, fixture state, counters and browser storage as applicable so test ordering cannot change results. Remove only the mock namespaces owned by the test or application.

## Deterministic failure scenarios

Specify response payload, delay, sequence and failure point independently. Use fixed timing or a seeded plan when testing variable latency. A timeout before a write and a timeout after the write commits are different cases. Simulate network rejection through the supported MSW API; an HTTP error response is not the same failure.

Control scenarios through explicit test fixtures or a disclosed demo selector when requested. Scenario logic should not enter the production domain implementation. Assert the resulting application behavior, with network evidence when useful, rather than asserting that a component called a mocked helper.

## Verification

Check that the real HTTP client is intercepted in each required environment, that subsequent reads reflect a committed write, and that reset reproduces the initial state. Verify latency/failure behavior from the caller's perspective and check that an unhandled endpoint is detectable. The workflow selects the scenario inventory and persistence/recovery requirements.

Primary references: [browser integration](https://mswjs.io/docs/integrations/browser), [handler organization](https://mswjs.io/docs/best-practices/structuring-handlers). Consult package types for differences between the installed major and current examples.
