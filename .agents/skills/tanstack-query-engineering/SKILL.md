---
name: tanstack-query-engineering
description: Implement TanStack Query query keys, caching, pagination, mutations, cancellation and persisted asynchronous state. Use for remote-state ownership and consistency in applications; API contracts, durability requirements and retry policy are provided by the workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# TanStack Query engineering

Read [cache, mutation and recovery cases](references/cache-mutations-recovery.md) for identity, data/fetch state, freshness/retention, pagination, stale-response cancellation, mutation identity and durable pending work. The cases include observed behavior of the installed Query/Axios/MSW versions and identify a rejected blanket Date-key claim.

TanStack Query owns asynchronous remote state and its cache. It does not replace local UI or continuous computation state. Identify the installed major version and framework adapter, then map each resource's identity, freshness requirements and write behavior.

## Queries and keys

Include all variables affecting the response in a serializable key: resource, identity, filters, sort and page as appropriate. Query functions use those same inputs. An omitted variable lets different requests share a cache entry incorrectly. Keep key construction discoverable and use a stable QueryClient for the intended application lifetime.

Choose `staleTime`, `gcTime`, active-tab/focus refetch and retry behavior from the actual product needs. Distinguish initial loading from background refresh, an empty successful result from an error, and useful stale data from data known to be obsolete. Avoid copying library defaults into a delivery requirement without evaluating them.

For pagination, give each page/filter combination its own key. If retaining previous data, disclose that it is placeholder data and prevent an action from treating it as the new page. Reset page selection when a filter invalidates its meaning.

Consume the provided AbortSignal in a transport that supports it. Cancellation does not protect the cache if the query function ignores the signal. Verify a late response race when identity changes or a write invalidates outstanding reads.

## Mutations and consistency

Choose authoritative refetch or an optimistic update based on the contract. Optimistic updates need cancellation, a snapshot, rollback and subsequent reconciliation. Await invalidation when downstream behavior requires the updated view before proceeding. Keep a mutation's required lifecycle independent of a screen that can unmount.

Retries repeat a request; they do not guarantee idempotency. Classify transient and validation failures and let the workflow set bounds and recovery actions. A server-side identity/contract must define whether a repeated write creates another resource.

Persist state only when durability is required. For persisted paused mutations, supply a default mutation function before hydration/resume: stored function state cannot be serialized. A domain outbox is another option when serializable pending records need their own lifecycle. Choose one owner for that pending state instead of duplicating it across caches and storage.

## Verification

Verify initial/empty/error/refresh states, key separation, pagination, invalidation, cancellation and mutation recovery appropriate to the contract. Inspect requested resource identity as well as the visible data. Restoration tests need a genuine remount or reload, not merely another render. Required scenarios and acceptable freshness remain workflow decisions.

Primary references: [query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys), [mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations), [QueryClient](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient).
