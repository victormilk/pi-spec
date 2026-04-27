---
description: Create or refine tasks.md from accepted requirements and design for a .specs/<feature>/ spec
argument-hint: "<spec-slug> [instructions]"
---

Use the `spec-tasks` skill.

Spec target: `$1`
Additional instructions: `${@:2}`

Tasks:

- Use `spec_status` and `spec_validate` for `$1` if available.
- Read `.specs/$1/brainstorm.md`, `.specs/$1/requirements.md`, `.specs/$1/design.md`, and existing `.specs/$1/tasks.md`.
- Create or update `.specs/$1/tasks.md` from the bundled tasks template if needed.
- Produce ordered checkbox tasks with requirement mappings, likely file/area hints, and validation steps.
- Ensure every requirement has task coverage.
- Refuse to draft tasks.md while `design.md` is `Status: design-draft`. Ask the user to approve the design first and update its `Status:` to `design-approved`.
- Leave `Status: tasks-draft` while the task plan is awaiting user approval.
- Do not implement code yet unless explicitly requested after the user approves the task plan.
- Stop after drafting and ask the user to explicitly approve the task plan. When approved, update `Status:` in `tasks.md` to `tasks-approved` and rerun `spec_validate` with `phase: "implementation"` before any code changes.
- End by asking the user to approve the task plan before implementation and naming the first recommended implementation task.
