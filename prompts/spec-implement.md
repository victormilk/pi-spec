---
description: Implement an approved .specs/<feature>/tasks.md plan in order and update task checkboxes after validation
argument-hint: "<spec-slug> [task number or instructions]"
---

Use the `spec-implementation` skill.

Spec target: `$1`
Implementation focus: `${@:2}`

Tasks:

- Use `spec_status` for `$1` if available.
- Read `.specs/$1/brainstorm.md`, `.specs/$1/requirements.md`, `.specs/$1/design.md`, and `.specs/$1/tasks.md` before editing code.
- Verify implementation readiness before code changes: run `spec_validate` with `phase: "implementation"` if available.
- If `tasks.md` is still `Status: tasks-draft`, do not implement unless the current user message explicitly approves the task plan; when approved, update it to `Status: tasks-approved` first, then rerun implementation validation.
- When implementation work starts, set `tasks.md` to `Status: implementation-in-progress`; when all tasks are checked and validated, set it to `Status: implementation-complete`.
- Implement unchecked tasks in order, or the requested task if a task number/instruction is provided.
- Run the validation listed for each completed task where possible.
- Mark a task `[x]` only after implementation and validation pass.
- If implementation requires a design change, update `.specs/$1/design.md` first and explain why.
- Final response must list completed tasks, files changed, validation results, and remaining tasks.
