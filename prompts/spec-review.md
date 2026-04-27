---
description: Review a .specs/<feature>/ spec or implementation for completeness and traceability
argument-hint: "<spec-slug> [focus]"
---

Use the `spec-review` skill.

Spec target: `$1`
Review focus: `${@:2}`

Tasks:

- Use `spec_status` and `spec_validate` for `$1` if available.
- Read `.specs/$1/brainstorm.md`, `.specs/$1/requirements.md`, `.specs/$1/design.md`, and `.specs/$1/tasks.md`.
- If reviewing implementation, inspect relevant code/tests referenced by completed tasks.
- Report blockers, risks, and suggestions.
- Include exact file paths plus requirement/task IDs.
- Do not make changes unless explicitly asked to fix findings.
