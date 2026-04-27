---
name: spec-implementation
description: Implement an approved .specs/<feature>/tasks.md plan. Use when executing tasks in order, validating each task, updating checkboxes, and preserving traceability to requirements and design.
---

# Spec Implementation

Use this skill when the user asks to implement a spec or continue task execution.

## Required Reads

Before editing code, read:

- `.specs/<feature>/brainstorm.md`
- `.specs/<feature>/requirements.md`
- `.specs/<feature>/design.md`
- `.specs/<feature>/tasks.md`

Run `spec_validate` with `phase: "implementation"` first if available.

## Approval and Status Gate

- Before editing code, verify `tasks.md` is not still `Status: tasks-draft`.
- If `tasks.md` is draft and the current user message does not explicitly approve the task plan, stop and ask for task approval.
- If the current user message explicitly approves the task plan, update `tasks.md` to `Status: tasks-approved`, then rerun implementation validation before coding.
- When code work starts, update `tasks.md` to `Status: implementation-in-progress`.
- When every implementation task is checked and validated, update `tasks.md` to `Status: implementation-complete`.

## Execution Rules

- Implement tasks in `tasks.md` order unless the user approves reordering.
- Work on one task or a small related group at a time.
- Do not mark a task complete until implementation and validation are done.
- If code reality conflicts with design, update `design.md` and explain the deviation before continuing.
- Preserve requirement traceability in code comments, tests, or docs when helpful, but do not over-comment obvious code.
- If `.specs/config.yaml` has `principles.tdd: true`, follow the bundled `tdd` skill and produce each task via red → green → refactor on a vertical slice (one test → one implementation, never all-tests-then-all-code).

## Updating Tasks

When a task is complete:

```markdown
- [x] 1. Completed task title
  - Requirement(s): FR-001
  - Files/areas: src/...
  - Validation: pnpm test ... ✅
```

If validation cannot run, leave the task unchecked and document the blocker.

## Final Response

Summarize:

- Tasks completed
- Files changed
- Validation run and results
- Current `tasks.md` status
- Remaining unchecked tasks or blockers
