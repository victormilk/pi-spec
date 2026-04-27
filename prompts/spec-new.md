---
description: Brainstorm a feature idea, then create a project-layer spec under .specs/<feature>/ and draft requirements only after approval
argument-hint: "<feature or goal>"
---

Use the `spec-brainstorm`, `spec-driven-development`, and `spec-requirements` skills.

Create a new spec for: $ARGUMENTS

Required brainstorm gate:

- Do not call `spec_init` immediately.
- First identify the user's intent, desired outcome, likely users, scope boundaries, constraints, risks, and success criteria.
- Ask exactly one clarifying question at a time.
- After each answer, decide whether another question is needed.
- When clear enough, present a concise **Brainstorm Summary** and ask: “Should I create the spec skeleton and draft requirements now?”
- Only after the user approves, record the brainstorm with `spec_brainstorm` (or pass the summary to `spec_init` as `brainstormSummary`).

Then create requirements:

- Use the project-layer spec directory `.specs/**`.
- Use `spec_brainstorm` to record `.specs/<feature-slug>/brainstorm.md`, then use `spec_init` to create `requirements.md`, `design.md`, and `tasks.md` from bundled templates.
- Draft or update only `requirements.md` after the brainstorm is recorded.
- Use stable requirement IDs (`FR-001`, `NFR-001`) and EARS-style `SHALL` statements.
- Do not implement code yet.
- End with the spec path and the next gate: design review.
