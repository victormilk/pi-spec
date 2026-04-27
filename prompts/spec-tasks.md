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
- Leave `Status: tasks-draft` while the task plan is awaiting user approval.
- Do not implement code yet unless explicitly requested after the user approves the task plan.
- End by asking the user to approve the task plan before implementation and naming the first recommended implementation task.
