---
name: spec-tasks
description: Build .specs/<feature>/tasks.md from accepted requirements and design. Use for ordered implementation checklists with requirement mappings, file hints, and validation steps.
---

# Spec Tasks

Use this skill to turn accepted requirements and design into an implementation plan.

## Required Reads

Before editing tasks, read:

- `.specs/<feature>/brainstorm.md`
- `.specs/<feature>/requirements.md`
- `.specs/<feature>/design.md`
- Existing `.specs/<feature>/tasks.md`, if present

## Output File

Write tasks to:

```text
.specs/<feature-slug>/tasks.md
```

Start from `../../templates/spec/tasks.md` when creating a new task list.

## Task Quality Bar

Each implementation task should be:

- Small enough for one focused coding pass
- Ordered to reduce rework and expose risk early
- Written as a checkbox (`- [ ]`)
- Mapped to requirement IDs
- Annotated with likely files/areas
- Given a validation command or manual check

Prefer this shape:

```markdown
- [ ] 1. Implement TODO
  - Requirement(s): FR-001, NFR-001
  - Files/areas: src/...
  - Validation: pnpm test ...
```

## Sequencing Guidance

Typical order:

1. Foundation/schema/config changes
2. Core behavior
3. Integration points
4. Error handling and edge cases
5. Tests
6. Docs/migration/cleanup

## Done Criteria

Before asking for implementation approval:

- `Status: tasks-draft` remains in place while the plan is under review
- Every requirement appears in at least one task
- Every task has a validation path
- Design testing strategy is represented by tasks
- Risky migrations or rollouts have explicit tasks

Implementation may start only after explicit user approval updates the status to `tasks-approved` and implementation-readiness validation passes.
