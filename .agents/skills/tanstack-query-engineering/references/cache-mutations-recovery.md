# TanStack Query: identity, observers, mutations and durable recovery

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Primary baseline: Query 5.104.0 installed code and official React adapter documentation. A community package supplied useful topic discovery but was not adopted wholesale: its absolute Date-key rule and some prescribed architecture choices were evaluated independently. The cases below are reusable engineering conclusions.

## Q1. Identity is a data contract

A key separates resources whose answers differ. Include response-affecting identity, filters, sort and page; exclude unrelated UI flags and rotating credentials. Deterministic object-property order does not make array positions interchangeable. Lists and individual records with different shapes need distinct entries even if they refer to the same resource family.

A catalog filtered by locale, an account's records and a numbered page expose different identity requirements. A useful prefix can invalidate one resource family or tenant; choose its shape from actual operations rather than mandating one universal URL-like key structure. An input affecting the query function but absent from the key produces cache collision. An irrelevant input creates needless cache cardinality.

Research probe: object property order produced the same hash; array position changed it. A Date serialized to the same hash as its ISO string in the installed implementation, contradicting a candidate's claim that Dates are inherently unserializable. Prefer explicit immutable primitive identity for readability and mutation safety, while stating the actual reason.

Source: [query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys); installed `hashKey` behavior.

An endpoint option factory can preserve the same identity across a component, prefetch and invalidation. `decodeItem` below is the validated domain decoder; it is not an unchecked generic cast.

```ts
function itemOptions(id: string) {
  return queryOptions({
    queryKey: ['items', id],
    queryFn: async ({ signal }) => {
      const response = await httpClient.get<unknown>(`/items/${id}`, {
        signal,
      });
      return decodeItem(response.data);
    },
    staleTime: 30_000,
  });
}

const options = itemOptions(selectedId);
await queryClient.cancelQueries({ queryKey: options.queryKey, exact: true });
await updateItem({ id: selectedId, operationId, changes });
await queryClient.invalidateQueries({
  queryKey: options.queryKey,
  exact: true,
});
```

This is a sequence for an acknowledged update, not a generic instruction to cancel before every read. A changed list also needs its list-family invalidation, and a failed update needs its classified recovery path.

## Q2. Data state and fetch state are separate

`pending` describes missing successful data; `fetching`, `paused` and `idle` describe transport activity. The research probe constructed a disabled query with `isPending=true`, `isLoading=false`, `fetchStatus='idle'`. A spinner based only on pending would describe work that is not occurring.

Cases include a query waiting for a selected identity, an offline paused query, a populated cache refreshing in the background and a failed refresh with useful old data. Each needs different UI. A empty array is a successful result, not an exception. Decide whether the display may preserve old data on refresh failure and make its staleness/error visible.

Use the appropriate status to narrow data/error and avoid rest destructuring merely to forward unused flags. The observer tracks fields; subscribing to everything creates re-render work on unrelated changes. The result object itself is not a stable effect dependency. `select` can narrow a consumer's projection but is not the place to validate an unchecked transport payload.

Sources: [queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries), [render optimization](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations).

## Q3. Freshness, retention and invalidation

Freshness (`staleTime`) decides when a cached result needs revalidation; retention (`gcTime`) decides how long an inactive entry stays. They are independent. A resource updated every second differs from a reference list fixed at startup. Choose them from the tolerated age and cost of a stale result, not a neighboring example.

`Infinity` prevents time-based staleness but still permits explicit invalidation. `'static'` blocks invalidation-driven refetching too, so it cannot serve a list changed by mutations. Focus/mount/reconnect can refresh stale entries; hiding a tab may not unmount its observer. Design visible-tab freshness explicitly instead of assuming browser focus implements every navigation requirement.

Polling runs with its own interval and needs an end condition. Adding polling to several observers does not make one global timer. An unbounded poll, a changing key or wholesale cache persistence can accumulate requests/storage even while each individual call looks reasonable.

Sources: [important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults), [useQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery).

## Q4. Pages and placeholder meaning

When page identity changes, retaining the old page can avoid a blank screen. It is placeholder data until the new page succeeds. The caller must not label its rows as the new page or enable a next-page action using the previous page's totals without checking that state.

Reset page selection when filters invalidate it. A changing filter plus an old page number can request an out-of-range page and disguise it as an empty resource. Offset pagination's ordering can shift during writes; the API contract determines whether a cursor or deterministic stable sorting is appropriate. An infinite-query cache stores pages and page parameters as one entry with a shape different from an ordinary query.

Choose a small page count/retention bound when the UI could otherwise retain an unbounded feed. Do not flatten/duplicate the complete page cache into another store just to display rows.

Source: [pagination](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries).

## Q5. Cancellation and stale writes to the cache

Pass Query's signal into a transport that consumes it. Key separation protects different identities; cancellation/reconciliation protects obsolete work around a write to the same identity. An old read may have captured revision 1 before a mutation wrote revision 2 and return afterward.

For an optimistic update: cancel relevant reads, preserve prior data, publish the temporary value, roll back on failure and reconcile with the authoritative result. For an acknowledgement-first view: keep the pending write separate, then invalidate/refetch its affected resource families. Which model is less confusing depends on what a temporary result means to the user.

The research probe confirmed Query's signal aborted and a late result did not enter the cache through Axios. The cloned MSW Node request did not emit the same abort observation. Therefore do not assert that client cancellation proves the server stopped or reversed work. Verify the cache/user-visible outcome as well as transport signaling.

Sources: [cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation), [optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates), [QueryClient](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient).

## Q6. Mutation identity and owner lifetime

Retries replay an operation; they are not deduplication. A write can commit before the response times out. Keep its operation identity and ask the server contract how a retry obtains the existing record. An uncertain result is not the same as a validation rejection and should not be converted into a new operation identity.

The probe committed a record in an MSW handler, timed out in Axios and retried with the same ID. The mock returned the original record and its record count remained one. The result depended on the mock's idempotent contract, not Query magically deduplicating every mutation.

Callbacks tied to an unmounting screen cannot be the sole owner of required persistence/acknowledgement. Keep that lifecycle at a stable domain/data owner and use UI state as its projection. Avoid overlapping retry layers whose attempts multiply, and expose exhausted/validation/conflict states according to their actual recoverability.

Source: [mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations).

## Q7. Durable pending work versus a second cache

Persisted Query state restores the cache it owns. A domain outbox stores operations awaiting acknowledgement. They solve different problems. Pick the required durability model instead of mirroring every response into localStorage with independent freshness rules.

Persisting paused mutations requires a default mutation function before resume: functions are not serialized. Restoration also needs compatible schema/version and a clear policy for which entries survive. When using an outbox, persist a validated operation before sending, restore its stable ID and remove it only on confirmed acknowledgement. The cache can then be invalidated from that acknowledgement.

Do not silently erase pending business work to fix a corrupted cache or deployment buster. Scope cached sensitive data to the real identity and avoid persisting credentials. Local browser data is inspectable/editable; its existence does not establish server authority. Test reload while pending, after commit but before acknowledgement, and after acknowledgement before navigation.

Sources: [mutation persistence](https://tanstack.com/query/latest/docs/framework/react/guides/mutations), [persistQueryClient](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient).
