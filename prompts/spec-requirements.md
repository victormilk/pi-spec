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
