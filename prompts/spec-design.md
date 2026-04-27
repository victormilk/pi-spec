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
- Refuse to draft design.md while `requirements.md` is `Status: requirements-draft`. Ask the user to approve requirements first and update its `Status:` to `requirements-approved`.
- Leave `Status: design-draft` while the file is awaiting review.
- Stop after drafting and ask the user to explicitly approve `design.md`. Do **not** continue into tasks.md in the same turn.
- When the user explicitly approves, update the `Status:` line in `design.md` to `design-approved`, then ask whether to start `tasks.md`. Treat a single "approved" reply as approval for design only — not for tasks or implementation.
- End with any design risks and the next gate: task planning.
