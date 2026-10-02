---
name: typescript-engineering
description: Design TypeScript types, runtime boundaries and compiler settings with precise state models and readable APIs. Use for TypeScript implementation, refactoring and compatibility decisions in browser or server code; domain invariants are supplied by the active workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# TypeScript engineering

Read [contracts and validation cases](references/contracts-validation-design.md) for unchecked inputs, discriminated states, optional/undefined/null, finite numeric values, checked lookup, readonly/satisfies, generic design and compiler compatibility. Use the actual boundary being changed to select the case.

TypeScript checks assumptions at compilation. Network data, storage contents, user input and parsed files still require runtime validation. Start by identifying the installed compiler, build transformation, module target and existing lint rules; a newer compiler may exceed another tool's supported range.

## Model the possible values

Use discriminated unions for states whose fields and operations differ. Narrow the discriminator before accessing state-specific data. Prefer an exhaustive branch with a `never` check when introducing a variant should force callers to handle it. A broad optional-field object often permits combinations the domain cannot support.

Use `unknown` for unchecked inputs and caught errors. Narrow with actual validation before returning a domain type. `as`, a non-null assertion and an HTTP client's generic argument do not establish that received data is valid. Use a small parser for a small boundary; select a schema library when repeated structures or detailed diagnostics justify it.

Distinguish absent, undefined and null according to the contract. With exact optional property types, omit a property when it is absent rather than supplying undefined accidentally. With checked indexing, prove that a lookup exists or handle the missing case. Avoid turning missing data into a default that conceals a failed prerequisite.

Use `satisfies` to verify a configuration's shape while retaining useful literal inference. Use readonly APIs to communicate ownership, recognizing that readonly is compile-time protection rather than runtime freezing. A branded identifier is justified when mixing two structurally identical IDs would cause a concrete bug; do not brand every primitive reflexively.

## Keep APIs readable

Infer local variables when the result is obvious. Declare public boundaries, events and persisted contracts explicitly. Prefer a direct domain type to layered conditional/generic types that callers cannot understand. Introduce a generic when multiple real uses preserve the same relationship between inputs and outputs.

Keep pure transformations separate from I/O where that makes behavior easier to verify. Domain-specific time, geometry, status transitions and persistence rules are selected in the workflow; this skill does not impose an application architecture.

Choose strict compiler options appropriate to the runtime and dependencies. Preserve module-format consistency. Type-only imports clarify which dependencies exist at runtime. Check support before adopting syntax requiring a runtime transform or a library feature beyond the configured target.

## Verification

Run the project's compiler and type-aware lint. Add runtime checks for invalid external data and tests for meaningful domain boundaries when implementing them. Passing the compiler does not prove algorithmic correctness or validate external data. If a type forces repeated unsafe assertions, reconsider the model before suppressing diagnostics.

Primary references: [narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), [strict settings](https://www.typescriptlang.org/tsconfig/strict.html), [compiler options](https://www.typescriptlang.org/tsconfig/). Consult the installed tool peer ranges for compatibility choices.
