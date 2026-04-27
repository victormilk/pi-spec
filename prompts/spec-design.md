---
description: Create or refine design.md from accepted requirements for a .specs/<feature>/ spec
argument-hint: "<spec-slug> [instructions]"
---

Use the `spec-design` skill.

Spec target: `$1`
Additional instructions: `${@:2}`

Tasks:

- Use `spec_status` for `$1` if available.
- Read `.specs/$1/brainstorm.md`, `.specs/$1/requirements.md`, and existing `.specs/$1/design.md`.
- Create or update `.specs/$1/design.md` from the bundled design template if needed.
- Cover architecture, data/API/UI changes, error handling, security/privacy, testing strategy, rollout/migration, risks, and alternatives.
- Add a requirements traceability table covering every `FR-*` and `NFR-*`.
- Do not implement code yet.
- End with any design risks and the next gate: task planning.
