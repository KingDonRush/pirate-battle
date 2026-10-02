# Axios: transport ownership, uncertainty and diagnostic safety

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Research baseline: Axios 1.20.0 installed implementation/types, official cancellation/error/interceptor docs, and live Axios–Query–MSW probes. API contracts and product retry actions remain workflow decisions.

## A1. Client instance and response boundary

A shared instance earns its existence when it owns a base URL, timeout or a consistent transport policy. Endpoint functions describe real operations, not merely renamed HTTP verbs. A global instance with mutable identity headers can leak one request context into another; a browser application's single identity differs from a server handling several users concurrently.

Use one endpoint contract to express parameters and successful response. Axios's generic response type does not parse that response. Validate the fields the domain relies on, preserving date/unit/absence meaning. A 200 response containing malformed data is a boundary failure, not an empty successful result. Conversely, an API that deliberately uses a non-default success status needs that contract reflected explicitly rather than globally relaxing every request's status validation.

Cases to verify: wrong payload shape; a successful empty list; a pagination total inconsistent with rows; two independent client identities; an endpoint with a different timeout. Keep enough operation identity in errors to diagnose these without copying raw payloads into UI messages.

Sources: [request configuration](https://axios-http.com/docs/req_config), [error handling](https://axios-http.com/docs/handling_errors).

## A2. Abort and timeout have different meanings

An owner aborts obsolete work on navigation, key replacement or disposal. Pass its AbortSignal rather than inventing another global cancellation flag. A timeout bounds waiting when the owner still wants the answer. Classify deliberate cancellation separately so replacing a query does not produce a false failure message.

Neither event proves a server write did not commit. The live research probe timed out after the MSW handler committed a record, then recovered that record by resending the same operation ID. A retry with a new ID would have represented another write. Reconciliation belongs to the API/domain contract, not to the timeout mechanism.

Axios's default timeout code can be `ECONNABORTED`; enabling `clarifyTimeoutError` changes the distinction. Browser and Node adapters can expose network errors differently. Match the installed behavior and preserve the classified cause instead of treating every AxiosError as the same recoverable failure.

Sources: [cancellation](https://axios-http.com/docs/cancellation), [timeout/error codes](https://axios-http.com/docs/handling_errors).

## A3. Interceptors are a lifecycle and ordering decision

An interceptor is appropriate for genuinely common transport behavior, such as adding request metadata or normalizing a known error envelope. It is inappropriate for screen-specific state transitions. Installing from repeated component renders accumulates handlers; retain the returned identity and eject when its shorter-lived owner is disposed.

Ordering is version/config-sensitive. In the inspected Axios implementation, request ordering depends on `legacyInterceptorReqResOrdering`, while responses are accumulated in registration order. Do not rely on a memorized LIFO rule without checking the installed options. An interceptor that assumes another already normalized a header may fail or leak data if order changes.

Test two installed handlers, their intended order, disposal of one and another request afterward. A retry/refresh interceptor must have a termination condition and avoid recursively intercepting its own retry indefinitely. Do not introduce token-refresh architecture in an application whose contract has no authentication requirement.

Sources: [interceptors](https://axios-http.com/docs/interceptors); installed `lib/core/Axios.js` and transitional defaults.

## A4. Retry ownership and uncertain writes

If Query owns retries, adding an independent Axios retry plugin multiplies attempts. Choose the owner and classify retryable statuses/conditions there. A read with a transient transport failure, a validation error, a conflict and an acknowledged write have different recovery paths. Retrying an invalid payload unchanged is wasted work; acknowledging an uncertain write from an optimistic row is incorrect.

For a durable operation, maintain a stable ID and validated serialized payload. Record it before transport if losing the operation on reload is unacceptable. Repeated clicks should share or recover that operation according to its contract, while a genuinely new user action creates a new identity. Confirm its server record before removing the pending state.

Observe attempt count, operation ID and outcome. Verify timeout-before-commit and timeout-after-commit separately. A mocked client helper that always resolves cannot exercise these HTTP failure semantics.

Sources: [Axios cancellation](https://axios-http.com/docs/cancellation), [Query mutation contract](https://tanstack.com/query/latest/docs/framework/react/guides/mutations); the research probe in the skill audit.

## A5. Errors, logging and trust

Narrow unknown errors with `axios.isAxiosError` before reading adapter fields. Preserve status/code, cancellation/timeout classification and a safe operation identifier. Request config can contain credentials, headers and personal payloads; logging the entire error or its JSON representation needs deliberate redaction. A whitelist of diagnostic fields is often easier to verify.

Do not show a raw backend/transport stack to the user or convert an error into fabricated successful data. React escaping protects normal text display, but raw HTML inserted from an error envelope is a different trust boundary. Validate/normalize received values before they choose identifiers, keys or configuration.

Review a failed request with a synthetic authorization header and verify logs omit it. This tests a specific disclosure path rather than adding a vague claim that the client is secure. Timeout/cancellation/update races require their own checks, because typed endpoints do not establish those properties.

Sources: [error handling/redaction](https://axios-http.com/docs/handling_errors), [innerHTML trust](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML).
