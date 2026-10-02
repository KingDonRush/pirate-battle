---
name: axios-http
description: Implement typed Axios transport boundaries, cancellation, timeouts, error classification and interceptor lifecycle. Use for HTTP client engineering across applications; caching, product recovery actions and API idempotency are selected by the workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# Axios HTTP engineering

Read [transport and failure cases](references/transport-errors-cancellation.md) for client/response ownership, timeout versus abort, interceptor ordering/lifetime, retry ownership and safe diagnostics. Use installed-version checks for ordering/error codes rather than generic folklore.

Axios owns request transport and response handling. Separate transport behavior from UI messages, cache ownership and domain decisions. Inspect the installed version and browser/Node adapter when diagnosing a failure.

## Client and contract boundaries

Use an instance when shared base URL, headers, timeout or transport behavior has a clear owner. Keep endpoint functions explicit enough that callers can see their arguments, response and failure contract. Avoid a universal API abstraction that hides endpoint semantics or simply renames `get` and `post`.

A typed response generic documents the expected shape; it does not validate the response. Parse unchecked data where the domain relies on it. Preserve request/query parameters and date/unit meaning through that boundary. Only redefine successful status codes when the API contract supports the change.

## Cancellation and timeout

Pass an AbortSignal from the request owner and let that owner cancel obsolete work. Use supported AbortController APIs rather than adding deprecated cancellation mechanisms. A timeout bounds waiting; it is not a statement about whether the server completed a write. The workflow defines how such an uncertain write is reconciled.

Set a timeout suited to the operation and classify cancellation separately from failure. Do not notify a user of an error merely because navigation deliberately cancelled a stale read. When a query library owns cancellation/retries, connect its signal and policy rather than adding a second independent retry loop inside Axios.

## Errors and interceptors

Narrow caught errors with `axios.isAxiosError` before reading Axios fields. Distinguish an HTTP response failure, a request without a received response, timeout, cancellation and an unexpected client failure. Preserve the actionable status/code while returning a stable application error shape. Do not turn a failed request into an empty successful response.

Add an interceptor only for cross-cutting behavior with an actual consumer. Install once for its owning instance and eject when a shorter-lived owner is disposed. Repeated component renders must not accumulate interceptors. Logging must avoid exposing headers, credentials or raw sensitive payloads; retain only diagnostics needed to reproduce the issue.

## Verification

Exercise actual HTTP boundaries for response/status parsing, timeout, abort and relevant retry behavior. For repeated writes, verify the server's idempotency/reconciliation contract instead of assuming the client prevents duplication. Confirm a disposed interceptor or cancelled request cannot update an obsolete owner. Product error text and failure scenarios come from the workflow.

Primary references: [cancellation](https://axios-http.com/docs/cancellation), [error handling](https://axios-http.com/docs/handling_errors), [interceptors](https://axios-http.com/docs/interceptors).
