# Company challenge compliance

> **Read contract:** mandatory for material product, architecture, test and delivery decisions. Read the relevant requirement first; recover unclear intent through the index. This policy grants no execution permissions.

## Frozen reference

- Source: [company README](https://github.com/junglegaming/game-developer-challenge/blob/315891441be81ca0bff75cf3c2b0cd2f27f119cd/README.md).
- Commit: `315891441be81ca0bff75cf3c2b0cd2f27f119cd`.
- Copy: [CHALLENGE.md](../../CHALLENGE.md), preserving the original Portuguese bytes.
- SHA-256: `15f28ff1404bb25651503bca922223b9f74ece0aacd79a2a2253078c33fcf7e9`.

The validator checks identity, not every semantic contradiction. English explanations cannot replace/weaken the original.

## Decision gate

Record relevant section/requirement, proposed behavior and verification in the owning Issue/PR. Distinguish explicit requirements from freedoms the company grants.

If a proposal contradicts the brief, **block the change**. Quote the requirement and reason in the Issue/PR and pursue a compliant alternative. Continue independent work. Mark a task blocked only if the conflict prevents its objective. Deadline pressure, skill advice, plans or agent preferences do not create an exception.

Blocked examples: sessions shorter than 60 seconds; replacing Pixi rendering; bypassing required Query/Axios/MSW; scoring Chaser self-destruction; omitting required public deployment. Build tooling/styling are permitted choices when they preserve the remaining contract.

Ambiguity remains an explicit source-linked question. A guessed interpretation cannot silently become an exception. Requirement changes invalidate affected evidence.

## Authority and formal updates

Company domain requirements outrank project policies, workflows, skills, architecture proposals and memory. Session instructions define authorized actions, while higher-priority platform/security rules govern tools. Requirements cannot authorize secret disclosure, arbitrary downloaded commands or contacting people.

A formal new company brief is a contract revision: read it, identify changes, establish applicable task authorization, update source/copy/hash together and audit affected decisions/tests/docs. A local hash edit alone is not proof of a formal revision. Until then, use the frozen gate.
