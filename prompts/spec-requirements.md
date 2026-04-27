---
description: Draft, repair, or refine requirements.md for an existing .specs/<feature>/ spec
argument-hint: "<spec-slug> [instructions]"
---

Use the `spec-requirements` skill.

Spec target: `$1`
Additional instructions: `${@:2}`

Tasks:

- Run or use `spec_status` for `$1` if available.
- Read `.specs/$1/brainstorm.md` first; if it is missing, pause and run `/spec-brainstorm $1` before drafting requirements.
- Read `.specs/$1/requirements.md` if it exists.
- Create or update `.specs/$1/requirements.md` only.
- Preserve existing requirement IDs unless a renumbering cleanup is explicitly requested.
- Ensure scope, user stories, functional requirements, non-functional requirements, acceptance criteria, edge cases, dependencies, and open questions are covered.
- Use EARS-style `SHALL` statements.
- Do not edit design.md, tasks.md, or implementation files in this step unless explicitly requested.
- Leave `Status: requirements-draft` while the file is awaiting review.
- Stop after drafting and ask the user to explicitly approve `requirements.md`. Do **not** continue into design.md in the same turn.
- When the user explicitly approves, update the `Status:` line in `requirements.md` to `requirements-approved`, then ask whether to start `design.md`. Treat a single "approved" reply as approval for requirements only — not for design or tasks.
