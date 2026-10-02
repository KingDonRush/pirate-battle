# TypeScript: contracts, runtime validation and readable state models

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Research baseline: TypeScript 6.0.3 and the official narrowing, object/generic and compiler-option references. The cases are engineering applications, not a replacement for domain invariants supplied by a workflow.

## T1. An unchecked value is not a domain object

JSON, storage, form input and files are runtime boundaries. `JSON.parse`, a response generic and `as Config` can produce a value that compiles while containing an invalid number or missing field. Read the value as unknown and establish only the facts actually checked.

For a numeric parameter, `typeof value === 'number'` permits NaN and Infinity. Add finite/range/integer validation according to its domain. For a record, check object/non-null/non-array before fields. For identifiers, validate the expected shape and preserve its meaning; do not accept arbitrary object keys and then merge them into configuration. Return a known projection rather than spreading unchecked fields, which can introduce unexpected options or prototype-sensitive names.

There are different recovery policies: invalid optional preferences can fall back to documented defaults with a notice; corrupt pending business records cannot be silently discarded as if acknowledged; an invalid remote payload should fail the operation with a classified error. The type parser makes the distinction possible, while the workflow decides which policy applies.

Use a small parser for a compact contract. A schema library earns its dependency when there are repeated schemas, nested diagnostics or migrations it materially simplifies. A type predicate whose implementation always returns true is an assertion disguised as validation.

For example, this parser constructs only the supported configuration fields instead of retaining the unchecked input object:

```ts
type PollConfig = Readonly<{ intervalMs: number }>;

function parsePollConfig(value: unknown): PollConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected a configuration object.');
  }
  if (!('intervalMs' in value)) throw new Error('Missing interval.');
  const intervalMs = value.intervalMs;
  if (
    typeof intervalMs !== 'number' ||
    !Number.isFinite(intervalMs) ||
    !Number.isInteger(intervalMs) ||
    intervalMs < 100 ||
    intervalMs > 60_000
  ) {
    throw new Error('Interval must be an integer from 100 to 60000 ms.');
  }
  return Object.freeze({ intervalMs });
}
```

The bounds belong to this example's polling contract, not a universal TypeScript rule. Verify null, arrays, missing fields, numeric strings, NaN/Infinity, both boundaries and an extra untrusted field. The output deliberately omits the extra field.

Sources: [narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), [unknown and assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html).

## T2. Unions model valid combinations

Consider a request with separate `loading`, `success`, `error`, `data?` and `reason?` fields. Many combinations have no meaning. A discriminated union associates each status with the fields/operations valid in it. Narrow before reading those fields, and use an exhaustive branch when adding a new variant should force each consumer to decide.

The same method serves a background job, editing session or connected resource. It does not require a state-machine library: an explicit transition function may suffice. Keep transitions near the invariant they protect. A very broad union crossing unrelated domains makes every caller narrow fields it should never receive; prefer distinct contracts and clear events at boundaries.

Use `never` to expose an unhandled variant, rather than a default branch that converts a new state into a familiar one. In runtime decoding, an unknown discriminator remains invalid input even though compile-time callers cannot construct it.

Source: [discriminated unions and exhaustiveness](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).

## T3. Optional, undefined, null and zero

An optional property represents absence; an explicit nullable property can represent a value intentionally cleared. Under exact optional property types, `{ timeout: undefined }` is not interchangeable with omitting `timeout` unless the declared contract allows undefined. Object spreading can accidentally overwrite a valid default with an explicit missing value.

Choose the data semantics before changing types to silence an error. If a setting is absent, omit its field. If it is explicitly cleared, represent that operation. If zero is a valid override, do not use truthiness to select the default. Empty text before numeric validation is also not automatically zero.

Checked indexing exposes another absence boundary. A looked-up entity, atlas frame or list element may not exist. Prove existence at the boundary and return an actionable failure or explicit optional result; do not propagate non-null assertions through the rest of the system. For a hot loop, validating a collection's invariants once can make the subsequent API clearer than repeating assertions at every access.

Sources: [exact optional properties](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html), [checked indexing](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html).

## T4. Readonly and satisfies solve different problems

Readonly communicates ownership through APIs; it does not deep-freeze runtime objects. A readonly view can still observe mutations performed through another reference. If a start snapshot must never change, construct its own validated value and define whether runtime freezing is useful. Do not deep-clone a large changing object on every frame to imitate immutable ownership.

`satisfies` checks compatibility while preserving useful inference. It helps typed fixture/configuration tables retain discriminants without asserting that an unknown value already satisfies the domain. `as const` preserves literals and readonly shape, but cannot validate external data. A generic `Readonly<T>` is shallow; decide whether nested mutation is actually possible across the ownership boundary.

Use explicit types at exported/persisted contracts and inference for obvious local calculations. A branded ID is useful when two string IDs are regularly confused; branding every number adds concepts without addressing a demonstrated risk. Favor the least complicated model that makes illegal combinations or ownership mistakes visible.

Sources: [object types](https://www.typescriptlang.org/docs/handbook/2/objects.html), [satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html).

## T5. Generics must preserve a real relationship

A generic is useful when output types depend on input types: a keyed lookup can preserve the relationship between a selected key and its value. A function exposing a caller-selected `T` while decoding unchecked JSON promises a type it did not establish. Prefer a parser argument or a concrete decoded contract.

Evaluate abstraction cost from the caller's task. If changing one status requires understanding conditional types, mapped types, helper factories and several casts, the API may be overgeneralized. A direct domain function is often both faster to understand and easier to test. Classes, functions and factories are tools; there is no blanket ban that fits every ownership/lifecycle problem.

Public type complexity can become runtime complexity when it encourages extra allocation, wrappers or duplicated serialization. Type precision should remove checks made impossible by valid construction, not merely hide checks that still need to occur.

Source: [generics](https://www.typescriptlang.org/docs/handbook/2/generics.html).

## T6. Compiler compatibility is part of correctness

The runtime target, module resolution, syntax transformation and library types must agree. A build transform can strip TypeScript without checking it. Run `tsc` and meaningful type-aware lint separately. Type-only imports clarify runtime edges; syntax requiring a transform must be supported by the toolchain.

Check peer ranges before an upgrade. In the inspected environment, TypeScript 7 was newer than the range supported by the selected typescript-eslint package, so the 6.0.3 compiler was deliberately retained. This is a compatibility observation, not a reusable requirement to pin every project to that version.

Verification should include rejected external values, impossible state constructions and runtime boundary behavior. Compile-time checks cannot establish timing, numeric algorithm accuracy, persistence or security. Keep those observable invariants in the owning workflow and test the real path that uses them.

Sources: [compiler configuration](https://www.typescriptlang.org/tsconfig/), [module options](https://www.typescriptlang.org/docs/handbook/modules/reference.html).
