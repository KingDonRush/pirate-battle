# React: component identity, composition, state and lifecycle

Research scope: client React 19, with version-sensitive alternatives called out. This is an engineering synthesis from React's API/learning material and the reviewed Vercel component/performance packages. It supplies reusable decisions; the workflow assigns product roles and acceptance requirements.

## Topic graph and reading routes

Component API expands into ownership, composition, variant modeling and semantic props. Ownership expands into controlled values, local drafts, derived values and shared state. Identity expands into type, tree position, key and preservation/reset. Lifecycle expands into render purity, user events, reactive effects, asynchronous cancellation, subscriptions and cleanup. Performance expands into subscription width, prop identity, expensive derivation, lazy feature loading and measured memoization. These branches interact: changing a component identity can destroy the subscription and reset its draft even when its props look unchanged.

Read the cases below according to the observed problem. Server-rendered cache/serialization advice is conditional on an actual server rendering model; the Vercel package contains that separate material.

## R1. Component contracts and composition

A component contract defines which decisions the caller makes and which behavior the component owns. Props are not just a bag of fields. If `editable`, `compact`, `archived` and `submitting` are independent booleans, ask whether all sixteen combinations are meaningful. If actions differ by mode, a discriminated variant or explicit composed component makes the valid combinations visible. If the only difference is an optional icon, one optional prop is usually clearer than a new component family.

Three different situations need different composition:

- A reusable panel with caller-owned content needs a semantic wrapper and `children`, preserving caller control over headings/actions.
- A field/action pair sharing validation can keep a local controlled value or lift it to their nearest common owner. Context is useful only when real consumers would otherwise require repeated threading.
- A component library whose layout and state implementations genuinely vary can use compound components and a provider contract. A small single-use form gains little from an injected generic `state/actions/meta` interface.

The Vercel composition package offers concrete before/after examples for these cases. Its provider recommendation is not proof every state should be put into context. Follow one input change to the visible result: if the route crosses several generic wrappers with no meaningful decision, simplify it. Measure context fan-out before splitting providers merely for theoretical performance.

Source: [Vercel composition rules](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/composition-patterns), [React state structure](https://react.dev/learn/choosing-the-state-structure).

## R2. Identity and preservation

React associates state with component type and position, refined by keys. A rerender is not a remount. Defining a component function inside another render creates a different component type, which can unexpectedly discard input/focus. A stable key describes the logical entity; an array index does not when rows reorder. Generating a random key every render resets rather than identifies.

Use a stable identity while editing the same record. Intentionally change a key when switching records should reset a draft. Preserve a hidden panel's state only when that is the actual product behavior; conditional removal unmounts it, so storing essential durable work only inside that panel loses it. Data that must outlive the screen needs an owner with the corresponding lifetime.

A practical review sequence is to type into a field, update an unrelated parent value, reorder a surrounding list, hide/reopen the panel, and switch to a different record. Record which actions should preserve/reset. Unexpected loss usually indicates identity or ownership, not a need to add another persistence effect.

Source: [preserving/resetting state](https://react.dev/learn/preserving-and-resetting-state).

## R3. State, drafts and derivation

Store a fact once. A total, selected item's description or validation flag that can be computed from existing state normally remains a derivation. Separately storing it creates a period when the source changed but the copy has not. A reducer makes related transitions explicit when several events must update fields together; it is not necessary for one independent checkbox.

A form draft is intentionally different from saved data. Load the initial saved value when the editing identity starts; do not mirror every subsequent prop change into the draft and erase unsaved input. Define what happens if the authoritative version changes while the user edits. Cancel discards the draft; save submits the validated draft. Optimistically saying “saved” before acknowledgement is a separate domain decision.

Controlled fields have a consistent value and owner; uncontrolled fields use initial defaults. Accidentally changing between undefined and a controlled value produces warnings and ambiguous input ownership. A parser that converts missing data into zero can silently change a valid empty draft into another value. Keep absence, empty text, invalid input and a valid zero distinct.

Source: [state structure](https://react.dev/learn/choosing-the-state-structure), [input contract](https://react.dev/reference/react-dom/components/input).

## R4. Events versus reactive effects

A user event has a causal identity: clicking Submit initiates a submission once. An effect reacts to committed dependencies: displaying a host may establish an external connection. Modeling Submit as a boolean plus effect makes the submission vulnerable to dependency changes and remounts. Conversely, installing a subscription only in a click handler leaves it disconnected from the component lifetime.

When a subscription depends on a document ID, effect cleanup removes the old document's subscription before setup for the new ID. Include genuine reactive dependencies. Do not hide an unstable function/object dependency by suppressing lint; first determine whether the calculation belongs inside setup or the action belongs in an event. An Effect Event is for non-reactive logic called from effects, not a blanket escape from dependencies.

Three diagnostic questions expose the choice: Which event or committed state caused this action? Which change must replace the external resource? Which owner removes it? A POST, listener or timer with no answer can duplicate or outlive its intended use. Rendering remains pure even if a render is repeated or abandoned before commit.

Sources: [events/effects](https://react.dev/learn/separating-events-from-effects), [useEffect](https://react.dev/reference/react/useEffect), [unnecessary effects](https://react.dev/learn/you-might-not-need-an-effect).

## R5. Asynchronous resource ownership

Cleanup can happen before a resource finishes initializing. Examples include a graphics widget, media connection or asynchronously loaded editor. A cleanup function that only disposes an already-populated ref misses the late result. Attach ownership identity/cancellation to the setup operation, and dispose a result that arrives after its owner became obsolete. Do not append it or attach callbacks to a replacement host.

The lifecycle to verify is `start A → exit A → start B → A resolves`. A must dispose itself without changing B. Also test `start A → setup rejects`, `start A → resolves → exit A`, and development setup/cleanup/setup. Cancellation is an ownership decision; it does not require every external library to support network abort. A late Promise may still resolve, so the ownership check remains necessary.

Keep disposing an imperative handle separate from destroying shared caches used by other consumers. A module singleton is appropriate for a shared dependency with application lifetime, but not for a screen-specific resource that can be replaced. Report startup errors in the active owner's state rather than logging an unhandled rejection.

Sources: [Strict Mode](https://react.dev/reference/react/StrictMode), [effect cleanup](https://react.dev/reference/react/useEffect).

A minimal ownership pattern for an asynchronously created widget is below. The factory and error reporter are stable imported functions; `host` is the current host identity. The widget owns its own idempotent disposal.

```tsx
useEffect(() => {
  let obsolete = false;
  let widget: Widget | undefined;

  void createWidget(host)
    .then((created) => {
      if (obsolete) {
        created.dispose();
        return;
      }
      widget = created;
      created.start();
    })
    .catch((error: unknown) => {
      widget?.dispose();
      widget = undefined;
      if (!obsolete) reportStartupError(error);
    });

  return () => {
    obsolete = true;
    widget?.dispose();
    widget = undefined;
  };
}, [host]);
```

The important case is the late `created` result after cleanup, not just the successful visible mount. A setup that allocates before rejecting also needs its own internal cleanup: the host cannot dispose a handle it never received.

## R6. Refs, subscriptions and snapshot consistency

A ref can hold a mutable handle without triggering React output. It is suitable for an imperative resource, not for hiding a displayed value that now never updates. An external store owns its own state and exposes subscribe/getSnapshot; React consumes the projection it actually needs.

`getSnapshot` must preserve object identity while its published values are unchanged. Returning a fresh object on every call can loop. Returning the same mutable object after changing its fields conceals an update. Cache an immutable projection when the underlying version changes, and make unsubscribe remove the same listener installed by subscribe.

Situations differ: a clock label needs updates when its displayed value changes; a numeric progress value may need bounded frequent updates; a resource handle used only in callbacks needs no rendering subscription. Publishing an entire changing world to a component that needs one label increases work and coupling. Define the publication frequency and values in the workflow, then use the external-store contract consistently.

Source: [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).

## R7. Memoization and context costs

Memoization compares identities, not human meaning. A freshly constructed object/inline callback can invalidate memoized work. A custom comparator that forgets a callback can retain a stale closure. Stabilize values when they are an actual dependency of expensive work; do not add hooks around cheap primitive calculations or recreate an entire generic caching layer.

Context consumers update when the provider value changes; wrapping a consumer in `memo` does not stop a changed context value reaching it. Split independently changing state only when consumer sets and costs justify the boundary. Derive a narrow subscription instead of asking every component to read every field.

Measure in an optimized build with representative interaction. Strict Mode's extra development calls identify impure behavior; their count is not a production benchmark. Preserve input/focus/error behavior while reducing renders, and compare the identified cost before/after.

Sources: [memo](https://react.dev/reference/react/memo), [useContext](https://react.dev/reference/react/useContext).

## R8. Security and a reviewed upstream disagreement

Ordinary React text is escaped; raw HTML insertion is a different trust boundary. Avoid introducing it to display labels or server error text. If rich external markup is required, define sanitization and allowed content instead of assuming a TypeScript type makes it safe. Keep raw transport details/credentials out of UI errors and diagnostic output.

The reviewed Vercel rule calls `useContext` incorrect in React 19 and recommends `use` universally. React still documents `useContext`. `use` permits conditional context reads and has Promise/Suspense behavior; choose it for those needs rather than performing a mechanical replacement. Likewise, the composition examples are options with costs, not mandatory architecture. This exception is recorded so provenance does not become blind obedience.

Sources: [React use](https://react.dev/reference/react/use), [useContext](https://react.dev/reference/react/useContext), [innerHTML trust boundary](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML).
