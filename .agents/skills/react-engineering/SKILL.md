---
name: react-engineering
description: Design, implement and review React components, state, effects, hooks and integrations with external systems. Use for React UI engineering and lifecycle decisions across applications; product rules and delivery requirements come from the active workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# React engineering

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Read [component, state and lifecycle cases](references/components-state-lifecycle.md) for contract/composition, identity/reset, drafts, effects, asynchronous ownership, external stores, memoization and the reviewed React 19 disagreement. Each case describes when it arises, the failure mechanism, alternative choices and observable checks. The reviewed upstream composition/performance packages supplement these cases; apply only the relevant rules.

React computes a UI from props and state, then commits changes. Render logic must stay pure so repeated or interrupted renders are safe. Identify the installed React version, existing component conventions and the owner of each state value before making an integration choice.

## State and composition

Keep the smallest state that cannot be derived from existing inputs. Derive filtered lists, totals and display flags during rendering when their calculation is cheap. Storing the same fact in two places creates synchronization work and stale intermediate states.

Group values that change together. Use an explicit status or discriminated state when independent booleans permit contradictory combinations. A reducer is useful when several events enforce related transitions; a simple field does not need one. Keep state near its consumers and lift it only to the lowest shared owner. Context is appropriate for shared dependencies, not automatically for every frequently changing value.

Prefer components with clear responsibilities and meaningful props. Split a component when it hides independent behavior, creates repeated work or makes a change difficult to reason about. Avoid abstract factories, configuration-driven UI and boolean-prop combinations without concrete callers that justify them. Stable keys represent entity identity; position-based keys are unsuitable when entities reorder.

## Effects, events and external state

An effect synchronizes with something outside React: a subscription, imperative widget, browser resource or similar dependency. A user-triggered action belongs in its event handler. Deriving state through an effect introduces another render and a second source of truth.

Pair setup with cleanup. Handle an asynchronous setup resolving after its owner unmounts or changes. Keep Strict Mode enabled and make setup/cleanup/setup work; a ref that suppresses the second setup conceals ownership errors. Track dependencies honestly rather than disabling dependency checks to prevent an effect from running.

Use refs for handles and mutable values whose changes do not determine React output. For an independently owned store, use a stable subscription and cached immutable `useSyncExternalStore` snapshots. Returning a new object on every read causes unnecessary updates and can produce a loop. Select only the values each consumer needs.

## Performance and verification

First measure excessive renders, expensive work and network waterfalls. Use memoization when it avoids a demonstrated repeated cost; do not wrap trivial expressions by default. Load large optional features when their use warrants it, accounting for loading and failure states. A data library already owning requests should also own their cache and asynchronous state.

Verify observable interactions, lifecycle cleanup, external-store updates and accessible controls. Review keyboard navigation and focus when implementing menus or dialogs. The workflow determines which screen behaviors must be covered and their acceptance conditions.

Primary references: [state structure](https://react.dev/learn/choosing-the-state-structure), [effect decisions](https://react.dev/learn/you-might-not-need-an-effect), [Strict Mode](https://react.dev/reference/react/StrictMode), [external stores](https://react.dev/reference/react/useSyncExternalStore). Read the relevant source when a lifecycle or version-specific API is uncertain.
